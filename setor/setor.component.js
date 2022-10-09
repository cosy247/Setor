(function (functory) {

  Setor && functory(Setor);

})((Setor) => {
  let componentHtmlMap = {};
  let rootCss = null;

  function renderShadow(root, shadow, html) {
    shadow.innerHTML = html;

    let setor = new Setor();
    setor.shadow = shadow;
    setor.props = root.retainAttrs || {};

    let allScripts = Array.from(shadow.querySelectorAll("script"));
    allScripts.forEach(script => {
      let setorName = script.getAttribute("setor") || "setor";
      new Function(setorName, script.innerHTML)(setor);
      script.parentNode.removeChild(script);
    })

    Setor.render(shadow, setor.cites);
    setor.isRendered = true;
    typeof setor.renderd === "function" && setor.renderd();

    if (rootCss) {
      let link = document.createElement("link");
      link.setAttribute("rel", "stylesheet");
      link.setAttribute("href", rootCss);
      rootCss && shadow.appendChild(link);
    }
  }

  Object.assign(Setor, {
    rootCss(v) {
      if (!rootCss) rootCss = v;
    },
    components(components) {
      for (let componentName in components) {
        if (Object.hasOwnProperty.call(components, componentName)) {
          const componentPath = components[componentName];
          componentName = componentName.replace(/^[A-Z]/, r => r.toLowerCase());
          componentName = componentName.replace(/(?<!^)[A-Z]/g, r => "-" + r.toLowerCase());
          if (componentHtmlMap[componentName]) return;
          componentHtmlMap[componentName] = true;
          customElements.define(
            componentName,
            class extends HTMLElement {
              constructor() {
                super();
                let shadow = this.attachShadow({ mode: "open" });
                if (componentHtmlMap[componentName] === true) {
                  fetch(componentPath + ".html")
                    .then(data => {
                      if (data.status == 200) {
                        return data.text();
                      } else {
                        document.write(`<pre>The module is missing : ${componentName}</pre>`);
                        throw `The module is missing : ${componentName}`;
                      }
                    })
                    .then(html => {
                      componentHtmlMap[componentName] = html;
                      renderShadow(this, shadow, html);
                    })
                } else {
                  renderShadow(this, shadow, componentHtmlMap[componentName]);
                }
              }
            }
          );
        }
      }
    },
  })

  Object.assign(Setor.prototype, {
    shadow: null,
    props: {},
    cites: {},

    isRendered: false,
    renderd: null,

    bind(data) {
      return Setor.bind(data);
    },

    cite(cites) {
      if (Object.prototype.toString.call(cites) !== "[object Object]") {
        return;
      }
      Object.assign(this.cites, cites);
    },

    get(selector) {
      return this.isRendered && this.shadow.querySelector(selector);
    },

    getAll(selector) {
      return this.isRendered && this.shadow.querySelectorAll(selector);
    },

    refresh() {
      Setor.refresh();
    },

    clearRefresh() {
      Setor.clearRefresh();
    }
  });

  Object.defineProperties(Setor.prototype, {
    event:{
      get () {
        return this.shadow.contains(Setor.event) ? Setor.event : null;
      }
    }
  })
})
