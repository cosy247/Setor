(function (functory) {

  Setor && functory(Setor);

})((Setor) => {
  class Router{
    static _hash = "";
    static map = {};
    static set hash(v) {
      this._hash = v;
    };
    static get hash(){
      return this._hash;
    }
  }

  window.addEventListener('hashchange', function() {
    Router.hash = location.hash;
  }, false);


  Setor.addRenderSpecial("router", (node, valueString, adorns, valueFun, lsnrctl) => {
    return false;
  })

  Object.assign(Setor, {
  })

  Object.assign(Setor.prototype, {
  });

  Object.defineProperties(Setor.prototype, {
  })
})
