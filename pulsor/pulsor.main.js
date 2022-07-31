(function () {
  const APP_CONFIG_PATH = "pulsor.config.json";

  let _renderCall = null;

  function _setRenderCall(callback, ...props) {
    (function renderCall() {
      _renderCall = renderCall;
      callback(...props);
      _renderCall = null;
    })();
  }

  function _getFileCont(url, type, callback) {
    fetch(url)
      .then((res) => {
        if (res.status == 200) {
          if (typeof res[type] == "function") {
            return res[type]();
          } else {
            return res.text();
          }
        } else {
          return "";
        }
      })
      .then((data) => callback(data));
  }

  function _getProxyHandler() {
    let resetCalls = {};
    let propTypes = {};
    return {
      get: (target, key, receiver) => {
        if (_renderCall) {
          if (resetCalls[key]) {
            if (!resetCalls[key].includes(_renderCall)) {
              resetCalls[key].push(_renderCall);
            }
          } else {
            resetCalls[key] = [_renderCall];
          }
        }
        if (!propTypes.hasOwnProperty(key)) {
          propTypes[key] = false;
          let value = Reflect.get(target, key);
          if (typeof value == "object") {
            propTypes[key] = value.constructor;
            Reflect.set(target, key, new Proxy(value, _getProxyHandler()), receiver);
          }
        }
        return Reflect.get(target, key, receiver);
      },
      set: (target, key, newValue, receiver) => {
        if (!_renderCall) {
          let value = Reflect.get(target, key);
          if (propTypes[key] && typeof newValue != "undefined" && newValue.constructor == propTypes[key]) {
            if (propTypes[key] == Array) {
              let length = value.length;
              for (let index = 0; index < newValue.length; index++) {
                Reflect.set(value, index, newValue[index], receiver);
              }
              if (length != newValue.length) {
                Reflect.set(value, "length", newValue.length, receiver);
                resetCalls[key] && resetCalls[key].forEach((call) => call());
              }
            } else {
              for (const k in newValue) {
                if (newValue.hasOwnProperty(k)) {
                  Reflect.set(value, k, newValue[k], receiver);
                }
              }
              for (const k in value) {
                if (value.hasOwnProperty(k) && !newValue.hasOwnProperty(k)) {
                  Reflect.deleteProperty(value, k, receiver);
                }
              }
              resetCalls[key] && resetCalls[key].forEach((call) => call());
            }
            return true;
          } else {
            propTypes[key] = false;
            let reflect = Reflect.set(target, key, newValue, receiver);
            resetCalls[key] && resetCalls[key].forEach((call) => call());
            return reflect;
          }
        }
        return false;
      },
      deleteProperty(target, key, receiver) {
        if (!_renderCall) {
          let reflect = Reflect.deleteProperty(target, key, receiver);
          resetCalls[key] && resetCalls[key].forEach((call) => call());
          return reflect;
        }
        return false;
      },
    };
  }

  function _getValueFun(valueString, funProps = [], funValues = []){
    return () => {
      return new Function(...funProps, `return (${valueString.replaceAll("\n", "\\n")})`).apply(undefined, funValues);
    };
  }

  class Component {
    static tagNames = [];

    rootShadow;
    innerHTML;
    pulsor;

    renderCall = null;
    renderDataKeys = [];
    renderDataValues = [];
    renderForKeys = [];
    renderForValues = [];

    forKeys = [];
    forValues = [];

    ifConditions = [];
    lastIfElement = null;

    constructor(root, html) {
      this.rootNode = root;
      this.innerHTML = html;
      this.pulsor = new Pulsor(root.props);
      this.attachShadow();
    }

    attachShadow() {
      this.rootShadow = this.rootNode.attachShadow({ mode: "open" });
      this.rootShadow.innerHTML = this.innerHTML;

      let allScripts = Array.from(this.rootShadow.querySelectorAll("script"));
      let allScriptText = allScripts.map((script) => script.innerHTML).join(";");
      let renderData = new Function("pulsor", allScriptText)(this.pulsor);

      if (typeof renderData == "object") {
        this.renderDataKeys = Object.keys(renderData);
        this.renderDataValues = Object.values(renderData);
      }

      allScripts.forEach((script) => script.parentNode.removeChild(script));
      this.renderShadow();
      this.addIndexStyle();
    }

    addIndexStyle() {
      let css = document.createElement("link");
      css.rel = "stylesheet";
      css.href = "src/index.css";
      this.rootShadow.appendChild(css);
    }

    renderShadow() {
      if (typeof this.pulsor.beforeRender == "function") {
        this.pulsor.beforeRender();
      }

      this.renderNode(this.rootShadow);

      if (typeof this.pulsor.rendered == "function") {
        this.pulsor.rendered();
      }
    }

    renderNode(node) {
      if (node.nodeName == "#comment" || node.nodeName == "STYLE") {
        return;
      } else if (node.nodeName == "#text") {
        this.renderText(node);
      } else if (node.nodeName == "#document-fragment") {
        for (const child of Array.from(node.childNodes)) {
          this.renderNode(child);
        }
      } else {
        if (node.getAttribute("-for")) {
          this.renderAttr(node, "-for", node.getAttribute("-for"));
        } else {
          for (const child of Array.from(node.childNodes)) {
            this.renderNode(child);
          }
          for (const attr of Array.from(node.attributes)) {
            this.renderAttr(node, attr.name, attr.value);
          }
        }
      }
    }

    renderText(node) {
      let match;
      while ((match = node.data.match(/\{\{.*?\}\}/)) !== null) {
        if (match.index !== 0) {
          node = node.splitText(match.index);
        }
        let newNode = node.splitText(match[0].length);
        this.renderTextCotnt(node, node.data.slice(2, -2));
        node = newNode;
      }
    }

    renderTextCotnt(node, valueString) {
      let valueFun = this.getValueFun(valueString);
      _setRenderCall(() => {
        let value = valueFun();
        if (typeof value == "undefined") {
          node.data = "";
        } else if (typeof value == "object") {
          node.data = JSON.stringify(value);
        } else {
          node.data = value;
        }
      });
    }

    renderAttr(node, attrName, valueString) {
      if (attrName.length == 1) return;
      let mark = attrName[0];
      if ([":", "@", "-"].indexOf(mark) >= 0) {
        node.removeAttribute && node.removeAttribute(attrName);
        attrName = attrName.slice(1);
        if (mark == ":") {
          this.renderBind(node, attrName, valueString);
        } else if (mark == "@") {
          this.renderEvent(node, attrName, valueString);
        } else if (mark == "-") {
          this.renderSpecial(node, attrName, valueString);
        } else if (mark == "^") {
          this.renderProp(node, attrName, valueString);
        }
      }
    }

    renderBind(node, attrName, valueString) {
      if (node.tagName.toUpperCase() == "INPUT" && attrName[0] == ":") {
        this.renderTwoWayBind(node, attrName.slice(1), valueString);
      } else {
        let valueFun = this.getValueFun(valueString);
        _setRenderCall(() => {
          let value = valueFun();
          node.setAttribute(attrName, value);
          // if (typeof value == "object" || typeof value == "function") {
          //   node[attrName] = value;
          // } else {
          //   node.setAttribute(attrName, value);
          // }
          // node[attrName] = value;
        });
      }
    }

    renderTwoWayBind(node, type, valueString) {
      if (node.getAttribute(":lable")) {
        this.renderBind(node, "lable", node.getAttribute(":lable"));
      }

      let forValueFun = null;
      if (this.forKeys.includes(valueString)) {
        forValueFun = this.forValues[this.forKeys.indexOf(valueString)];
      }

      let valueFun = this.getValueFun(valueString);
      let setValueFun;
      let model;
      if (node.type == "checkbox") {
        model = "change";
        let bindArr = valueFun();
        _setRenderCall(() => {
          node.checked = bindArr.includes(node.lable);
        });
        setValueFun = () => {
          if (node.checked && !bindArr.includes(node.lable)) {
            bindArr.push(node.lable);
          } else if (!node.checked && bindArr.includes(node.lable)) {
            let index = bindArr.indexOf(node.lable);
            bindArr.splice(index, 1);
          }
        };
      } else if (node.type == "radio") {
        model = "change";
        _setRenderCall(() => {
          node.checked = valueFun() == node.lable;
        });
        if (forValueFun) {
          setValueFun = () => {
            if (node.checked) {
              forValueFun(node.lable);
            }
          };
        } else {
          let setFun = this.getValueFun(valueString + "=window.event.target.lable");
          setValueFun = () => {
            if (node.checked) {
              setFun();
            }
          };
        }
      } else {
        model = "input";
        _setRenderCall(() => {
          node.value = valueFun();
        });
        if (forValueFun) {
          setValueFun = () => {
            forValueFun(node.value);
          };
        } else {
          setValueFun = this.getValueFun(valueString + "=window.event.target.value");
        }
      }

      Array.from(new Set(type.split("."))).forEach((tp) => {
        if (tp == "model") {
          node.addEventListener(model, setValueFun);
        } else {
          node.addEventListener(tp, setValueFun);
        }
      });
    }

    renderEvent(node, attrName, valueString) {
      let valueFun = this.getValueFun(valueString);
      node.addEventListener(attrName, valueFun);
    }

    renderProp(node, attrName, valueString) {
      if(typeof node.props == "object") {
        node.props[attrName] = this.getValueFun(valueString)();
      }else {
        node.props = {attrName:this.getValueFun(valueString)()};
      }
    }

    renderSpecial(node, attrName, valueString) {
      if (attrName == "for") {
        this.renderSpecial_for(node, valueString);
      } else if (attrName == "show") {
        this.renderSpecial_show(node, valueString);
      } else if (attrName == "if") {
        this.renderSpecial_if(node, valueString);
      } else if (attrName == "elif") {
        this.renderSpecial_elif(node, valueString);
      } else if (attrName == "else") {
        this.renderSpecial_else(node);
      }
    }

    renderSpecial_for(node, valueString) {
      let [itemName, forDataString] = valueString.split(" in ");

      let forAnchor = document.createComment("");
      node.parentNode.insertBefore(forAnchor, node);
      node.parentNode.removeChild(node);

      let forNodes = [];
      let forData = null;
      _setRenderCall(() => {
        if (forData == null) {
          forData = this.getValueFun(forDataString)();
          if (typeof forData == "number") {
            forData = new Array(forData);
          }
        }

        let dataLength = forData.length;

        if (dataLength > forNodes.length) {
          for (let index = forNodes.length; index < dataLength; index++) {
            let cloneNode = node.cloneNode(true);
            forNodes.push(cloneNode);
            forAnchor.parentNode.insertBefore(cloneNode, forAnchor);

            this.renderForKeys.push(itemName);
            this.renderForValues.push({
              k:index,
              get v(){
                return forData[index];
              },
              set v(newV){
                forData[index] = newV;
              }
            });

            this.renderNode(cloneNode);

            this.renderForKeys.pop();
            this.renderForValues.pop();
          }
        } else if (dataLength < forNodes.length) {
          for (let index = dataLength; index < forNodes.length; index++) {
            forNodes[index].parentNode.removeChild(forNodes[index]);
          }
          forNodes.length = dataLength;
        }
      });
    }

    renderSpecial_show(node, valueString) {
      let valueFun = this.getValueFun(valueString);
      let display = node.style.display;
      _setRenderCall(() => {
        node.style.display = valueFun() ? display : "none";
      });
    }

    renderSpecial_if(node, valueString) {
      let ifAnchor = document.createComment("if");
      node.parentElement.insertBefore(ifAnchor, node);
      let valueFun = this.getValueFun(valueString);

      this.ifConditions = [valueFun];
      this.lastIfElement = node;

      _setRenderCall(() => {
        if (valueFun()) {
          ifAnchor.parentElement.insertBefore(node, ifAnchor);
        } else {
          ifAnchor.parentElement.removeChild(node);
        }
      });
    }

    renderSpecial_elif(node, valueString) {
      if (this.ifConditions.length == 0) return;

      let previousElementSibling = node.previousElementSibling;
      if (!previousElementSibling || previousElementSibling != this.lastIfElement) return;

      let elifAnchor = document.createComment("elif");
      node.parentElement.insertBefore(elifAnchor, node);

      let valueFun = this.getValueFun(valueString);
      let ifConditions = [...this.ifConditions];
      this.ifConditions.push(valueFun);
      this.lastIfElement = node;

      _setRenderCall(() => {
        for (const condition of ifConditions) {
          if (condition()) {
            elifAnchor.parentElement.removeChild(node);
            return;
          }
        }
        elifAnchor.parentElement.insertBefore(node, elifAnchor);
      });
    }

    renderSpecial_else(node) {
      if (this.ifConditions.length == 0) return;

      let previousElementSibling = node.previousElementSibling;
      if (!previousElementSibling || previousElementSibling != this.lastIfElement) return;

      let elseAnchor = document.createComment("elif");
      node.parentElement.insertBefore(elseAnchor, node);

      let ifConditions = [...this.ifConditions];

      this.ifConditions = [];
      this.lastIfElement = null;

      _setRenderCall(() => {
        for (const condition of ifConditions) {
          if (condition()) {
            elseAnchor.parentElement.removeChild(node);
            return;
          }
        }
        elseAnchor.parentElement.insertBefore(node, elseAnchor);
      });
    }

    getValueFun(valueString) {
      let funProps = [...this.renderDataKeys, ...this.renderForKeys];
      let funValues = [...this.renderDataValues, ...this.renderForValues];
      return _getValueFun(valueString, funProps, funValues);
    }
  }

  class Pulsor {
    props = null;

    constructor(props) {
      this.props = props;
    }

    import(componentName) {
      return {
        from(componentPath) {
          _getFileCont(componentPath + ".html", "text", (html) => {
            window.customElements.define(
              componentName,
              class extends HTMLElement {
                constructor() {
                  super();
                  new Component(this, html);
                }
              }
            );
          });
        },
      };
    }

    bind(data) {
      return new Proxy(data, _getProxyHandler());
    }
  }

  class App {
    config = {};

    constructor() {
      this.getConfig();
    }

    getConfig() {
      _getFileCont(APP_CONFIG_PATH, "json", (conf) => {
        this.config = conf;
        this.renderRoot();
      });
    }

    renderRoot() {
      let rootNode = document.querySelector(this.config.rootNode);
      _getFileCont(`src/${this.config.rootFileName}.html`, "text", (html) => {
        new Component(rootNode, html);
      });
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    new App();
  });
})();
