(function (functory) {

  if (window.Pulsor) functory(window.Pulsor);

})((Pulsor) => {
  const APP_CONFIG_PATH = "app.config.json";

  function createApp() {
    fetch(APP_CONFIG_PATH)
      .then(data => data.json())
      .then(config => {
        if (!config.rootNode) return;

        Pulsor.components({
          "app-root": "src/App"
        });
        let rootNode = document.querySelector(config.rootNode);
        rootNode.innerHTML = "<app-root></app-root>";

        if (config.rootJs) {
          fetch(config.rootJs)
            .then(data => data.text())
            .then(js => {
              new Function("PulsorComponent", js)(Pulsor);
            });
        }

        if (config.rootCss) {
          Pulsor.rootCss(config.rootCss);
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
