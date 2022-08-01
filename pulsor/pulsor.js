(function (functory) {
  window.Pulsor = functory();
})(() => {
  class Lsnrctl {
    static callback = null;
    static isDuty = true;
    static Proxy(target, handler) {
      let proxy = new Proxy(target, handler);
      proxy[Symbol.toStringTag] = "Lsnrctl.Proxy";
      return proxy;
    }
    // = new Proxy(Proxy, {
    //   construct(target, argumentsList) {
    //     let res = new target(...argumentsList);
    //     res[Symbol.toStringTag] = "Lsnrctl.Proxy";
    //     return res;
    //   },
    // });

    static getProxyHandler(callbacks = {}, callbackKey = "data") {
      return {
        get: (target, key, receiver) => {
          if (Lsnrctl.isDuty && typeof key !== "symbol") {
            if (Lsnrctl.callback) {
              if (callbacks[`${callbackKey}.${key}`]) {
                if (!callbacks[`${callbackKey}.${key}`].includes(Lsnrctl.callback)) {
                  callbacks[`${callbackKey}.${key}`].push(Lsnrctl.callback);
                }
              } else {
                callbacks[`${callbackKey}.${key}`] = [Lsnrctl.callback];
              }
            }
          }
          let value = Reflect.get(target, key, receiver);
          if (value !== null && typeof value == "object") {
            if (Object.prototype.toString.call(value) !== "[object Lsnrctl.Proxy]") {
              target[key] = value = Lsnrctl.Proxy(value, Lsnrctl.getProxyHandler(callbacks, `${callbackKey}.${key}`));
            }
          }
          return value;
        },
        set: (target, key, newValue, receiver) => {
          let reflect = true;
          if (!Lsnrctl.callback) {
            // if (newValue !== null && typeof newValue === "object") {
            //   newValue = Lsnrctl.Proxy(newValue, Lsnrctl.getProxyHandler(callbacks, callbacks));
            // }
            Reflect.set(target, key, newValue, receiver);
            if (Object.prototype.toString.call(target) == "[object Array]") {
              Reflect.set(target, "length", target.length, receiver);
            }
            if (typeof key !== "symbol") {
              callbacks[`${callbackKey}.${key}`] && callbacks[`${callbackKey}.${key}`].forEach((call) => call());
            }
          }
          return reflect;
        },
        deleteProperty(target, key, receiver) {
          if (!Lsnrctl.callback) {
            let reflect = Reflect.deleteProperty(target, key, receiver);
            callbacks[`${callbackKey}.${key}`] && callbacks[`${callbackKey}.${key}`].forEach((call) => call());
            return reflect;
          }
          return false;
        },
      };
    }

    static getProxyData(data) {
      if (typeof data == "object") {
        return new Proxy(data, Lsnrctl.getProxyHandler());
      } else {
        return new Proxy({ v: data }, Lsnrctl.getProxyHandler());
      }
    }
  }

  class Render {
    dataKeys = [];
    dataValues = [];

    forKeys = [];
    forValues = [];

    ifConditions = [];
    lastIfElement = null;

    constructor(root, data) {
      if (typeof data == "object") {
        this.dataKeys = Object.keys(data);
        this.dataValues = Object.values(data);
      }
      this.renderNode(root);
    }

    renderNode(node) {
      if (node.nodeName == "#comment") {
        return;
      }
      if (node.nodeName == "#text") {
        this.renderText(node);
      } else {
        if (node.getAttribute("-for")) {
          this.renderAttr(node, "-for", node.getAttribute("-for"));
        } else {
          for (const child of Array.from(node.childNodes)) {
            this.renderNode(child);
          }
          if (Object.hasOwnProperty.call(node, "attributes")) {
            for (const attr of Array.from(node.attributes)) {
              this.renderAttr(node, attr.name, attr.value);
            }
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
      Lsnrctl.callback = () => {
        let value = valueFun();
        if (typeof value == "undefined") {
          node.data = "";
        } else if (typeof value == "object") {
          node.data = JSON.stringify(value);
        } else {
          node.data = value;
        }
      };
      Lsnrctl.callback();
      Lsnrctl.callback = null;
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
        }
      }
    }

    renderBind(node, attrName, valueString) {
      if (node.tagName.toUpperCase() == "INPUT" && attrName[0] == ":") {
        this.renderTwoWayBind(node, attrName.slice(1), valueString);
      } else {
        let valueFun = this.getValueFun(valueString);
        Lsnrctl.callback = () => {
          let value = valueFun();
          if (typeof value == "object" || typeof value == "function") {
            node[attrName] = value;
          } else {
            node.setAttribute(attrName, value);
          }
        };
        Lsnrctl.callback();
        Lsnrctl.callback = null;
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
        Lsnrctl.callback = () => {
          node.checked = bindArr.includes(node.lable);
        };
        Lsnrctl.callback();
        Lsnrctl.callback = null;
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
        Lsnrctl.callback = () => {
          node.checked = valueFun() == node.lable;
        };
        Lsnrctl.callback();
        Lsnrctl.callback = null;
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
        Lsnrctl.callback = () => {
          node.value = valueFun();
        };
        Lsnrctl.callback();
        Lsnrctl.callback = null;
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
      let [kv, forDataString] = valueString.split(" in ");
      let [k, v] = kv.split(",");

      let forAnchor = document.createComment("");
      node.parentNode.insertBefore(forAnchor, node);
      node.parentNode.removeChild(node);

      let forNodes = [];
      let forData = null;
      Lsnrctl.callback = () => {
        // if (forData == null) {
        //   forData = this.getValueFun(forDataString)();
        //   if (typeof forData == "number") {
        //     forData = new Array(forData);
        //   }
        // }
        forData = this.getValueFun(forDataString)();
        if (typeof forData == "number") {
          forData = new Array(forData).fill(null).map((_, x) => x);
        }
        let dataLength = forData.length;

        // Lsnrctl.isDuty = false;

        if (dataLength > forNodes.length) {
          for (let index = forNodes.length; index < dataLength; index++) {
            let cloneNode = node.cloneNode(true);
            forNodes.push(cloneNode);
            forAnchor.parentNode.insertBefore(cloneNode, forAnchor);

            this.forKeys.push(k, v);

            this.forValues.push(() => index);
            if (typeof forData[index] == "object") {
              this.forValues.push(() => {
                return forData[index];
              });
            } else {
              this.forValues.push(() => {
                return {
                  get v() {
                    return forData[index];
                  },
                  set v(v) {
                    forData[index] = v;
                  },
                };
              });
            }

            this.renderNode(cloneNode);

            this.forKeys.pop();
            this.forKeys.pop();
            this.forValues.pop();
            this.forValues.pop();
          }
        } else if (dataLength < forNodes.length) {
          for (let index = dataLength; index < forNodes.length; index++) {
            forNodes[index].parentNode.removeChild(forNodes[index]);
          }
          forNodes.length = dataLength;
        }
      };
      Lsnrctl.callback();
      Lsnrctl.callback = null;
    }

    renderSpecial_show(node, valueString) {
      let valueFun = this.getValueFun(valueString);
      let display = node.style.display;
      Lsnrctl.callback = () => {
        node.style.display = valueFun() ? display : "none";
      };
      Lsnrctl.callback();
      Lsnrctl.callback = null;
    }

    renderSpecial_if(node, valueString) {
      let ifAnchor = document.createComment("if");
      node.parentElement.insertBefore(ifAnchor, node);
      let valueFun = this.getValueFun(valueString);

      this.ifConditions = [valueFun];
      this.lastIfElement = node;

      Lsnrctl.callback = () => {
        if (valueFun()) {
          ifAnchor.parentElement.insertBefore(node, ifAnchor);
        } else {
          ifAnchor.parentElement.removeChild(node);
        }
      };
      Lsnrctl.callback();
      Lsnrctl.callback = null;
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

      Lsnrctl.callback = () => {
        for (const condition of ifConditions) {
          if (condition()) {
            elifAnchor.parentElement.removeChild(node);
            return;
          }
        }
        elifAnchor.parentElement.insertBefore(node, elifAnchor);
      };
      Lsnrctl.callback();
      Lsnrctl.callback = null;
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

      Lsnrctl.callback = () => {
        for (const condition of ifConditions) {
          if (condition()) {
            elseAnchor.parentElement.removeChild(node);
            return;
          }
        }
        elseAnchor.parentElement.insertBefore(node, elseAnchor);
      };
      Lsnrctl.callback();
      Lsnrctl.callback = null;
    }

    getValueFun(valueString) {
      valueString = valueString.replaceAll("\n", "\\n");
      let forKeys = [...this.dataValues];
      let forValueFuns = [...this.forValues];
      return () => {
        let funProps = [...this.dataKeys, ...forKeys];
        let funValues = [...this.dataValues, ...forValueFuns.map((v) => v())];
        return new Function(funProps, `return (${valueString})`).apply(null, funValues);
      };
    }
  }

  return class Pulsor {
    beforeCreate = [];
    created = [];

    constructor() {
      if (Object.prototype.toString.call(this.beforeCreate) == "[object Array]") {
        this.beforeCreate.forEach((callback) => callback.call(this));
      }
      if (Object.prototype.toString.call(this.created) == "[object Array]") {
        this.created.forEach((callback) => callback.call(this));
      }
    }

    static bind(data) {
      return Lsnrctl.getProxyData(data);
    }

    static render(root, data) {
      if (root instanceof Element) {
        new Render(root, data);
      } else if (typeof root == "string") {
        root = document.querySelector(root);
        root && new Render(root, data);
      }
    }
  };
});
