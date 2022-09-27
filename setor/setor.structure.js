(function (functory) {

  if (Setor) functory(Setor);

})((Setor) => {
  const APP_CONFIG_PATH = "app.config.json";

  function createApp() {
    fetch(APP_CONFIG_PATH)
      .then(data => data.json())
      .then(config => {
        if (!config.rootNode) return;

        Setor.components({
          "app-root": "src/App"
        });
        let rootNode = document.querySelector(config.rootNode);
        rootNode.innerHTML = "<app-root></app-root>";

        if (config.rootJs) {
          fetch(config.rootJs)
            .then(data => data.text())
            .then(js => {
              new Function("SetorComponent", js)(Setor);
            });
        }

        if (config.rootCss) {
          Setor.rootCss(config.rootCss);
          let link = document.createElement("link");
          link.setAttribute("rel", "stylesheet");
          link.setAttribute("href", config.rootCss);
          rootNode.appendChild(link);
        }
      });
  }

  if (document.readyState == "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      createApp();
    });
  } else {
    createApp();
  }
})
