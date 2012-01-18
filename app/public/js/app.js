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

/**
 * String formatting for JavaScript.
 * 
 * Usage: 
 * 
 *   "{0} is {1}".format("CartoDB", "epic!");
 *   // CartoDB is epic!
 * 
 */
String.prototype.format = function(i, safe, arg) {
  function format() {
      var str = this, 
          len = arguments.length+1;
      
      for (i=0; i < len; arg = arguments[i++]) {
          safe = typeof arg === 'object' ? JSON.stringify(arg) : arg;
          str = str.replace(RegExp('\\{'+(i-1)+'\\}', 'g'), safe);
      }
      return str;
  }
  format.native = String.prototype.format;
  return format;
}();
