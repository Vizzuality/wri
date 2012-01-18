function App() {
  var args = Array.prototype.slice.call(arguments),
    callback = args.pop(),
    modules = (args[0] && typeof args[0] === "string") ? args : args[0],
    i, m, mod, submod;

  if (!(this instanceof App)) {
    return new App(modules, callback);
  }

  if (!modules || modules === '*') {
    modules = [];
    for (i in App.modules) {
      if (App.modules.hasOwnProperty(i)) {
        modules.push(i);
      }
    }
  }

  for (i = 0; i < modules.length; i += 1) {
    m = modules[i];
    App.modules[m](this);
    if (this[m].hasOwnProperty('submodules')) {
      for (submod in this[m].submodules) {
        App.modules[m][this[m]['submodules'][submod]](this);
      }
    }
  }

  callback(this);
  return this;
};

App.modules = {};
