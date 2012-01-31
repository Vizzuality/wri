/**************************************************************************
* WRI SLIDER PLUGIN
**************************************************************************/
(function($, window, undefined) {

  // constants
  var TRUE = true, FALSE = true, NULL = null
    , name = 'wriSlider'
  // Plugin parts
    , Core, API, Helper
  // default options
    , defaultOptions = {
        globalEvents : [],
        monthNames : [ "JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC" ]
      };

  

    /***************************************************************************
    * Private methods
    **************************************************************************/
    Core = {
      pluginName : name,
      options : null,


    _init : function (options) {
      // take user options in consideration
      Core.options = $.extend( true, defaultOptions, options );
      return this.each( function () {
        var $el = $(this);

        // Append spinner
        Core._addCanvas($el);

        // Bind
        Core._bind($el);
      });
    },


    _bind: function($el) {
      $(window).resize(Core._resetSlider);
      $el.find('a.animation').bind({click: Core._animate});
    },


    _trigger : function ( eventName, data, $el ) {
      var isGlobal = $.inArray( eventName, Core.options.globalEvents ) >= 0, eventName = eventName + '.' +  Core.pluginName;

      if (!isGlobal) {
        $el.trigger( eventName, data );
      } else {
        $.event.trigger( eventName, data );
      }
    },

    _addCanvas: function($el) {
      $el.append('<span class="canvas"></span><span class="shadow"></span>');

      // Add years
      // var table = '<table><tr>';

      // for (var i=2006, length=2013; i<length; i++) {
      //   if (i!=2012) {
      //     table += '<td width="16%"><div>' + i + '</div></td>'
      //   } else {
      //     table += '<td width="2%"><div>' + i + '</div></td>'
      //   }
      // }

      // table += '</tr></table>';

      //$el.append(table);


      Core._initializeButton($el);
      Core._initializeSlider($el);
    },

    _initializeButton: function($el) {
      $el.append('<a href="#play" class="animation">play</a>');
    },

    _initializeSlider: function($el) {
      $el.find('span.canvas').slider({
        min: new Date(Core.options.start).getTime(),
        max: new Date(Core.options.end).getTime(),
        value: new Date(Core.options.value).getTime(),
        step: 100000000,
        create: function(ev, ui) {
          var value = new Date(Core.options.value);
          var date = Core.options.monthNames[value.getMonth()] + ' ' + value.getFullYear();
          $(ev.target).find('a.ui-slider-handle').text(date);
        },
        slide: function(ev,ui) {

          // If click or move

          var date = Core.options.monthNames[new Date(ui.value).getMonth()] + ' ' + new Date(ui.value).getFullYear();
          $(ev.target).find('a.ui-slider-handle').text(date);
          Core._trigger('change',[ui.value],$(ev.target));
        },
        change: function(ev,ui) {
          var date = Core.options.monthNames[new Date(ui.value).getMonth()] + ' ' + new Date(ui.value).getFullYear();
          $(ev.target).find('a.ui-slider-handle').text(date);
          Core._trigger('change',[ui.value],$(ev.target));
        }
      });
    },

    _resetSlider: function(ev) {
      //console.log(ev);
    },

    _animate: function(ev) {
      if (ev)
        ev.preventDefault();

      var $button = $(ev.target);

      if ($button.hasClass('play')) {
        Core._stopAnimation($button);
      } else {
        Core._startAnimation($button);
      }
    },

    _stopAnimation: function($button) {
      $button.removeClass('play');
      $button.text('play');
      clearInterval($button.data('interval'));
    },

    _startAnimation: function($button) {
      $button.addClass('play');
      $button.text('pause');
      var interval = setInterval(function(){
        var $el = $button.closest('.slider').find('span.canvas')
          , value = $el.slider('value') + 2500000000
          , max = $el.slider('option','max');
        
        // Check if it is the end, if not goes on
        if (value<max) {
          $el.slider('value',value);
        } else {
          Core._stopAnimation($button);
        }
        
      },500);
      $button.data('interval',interval);
    }

  };


  /***************************************************************************
  * Public methods
  **************************************************************************/
  API = {
    update: function(timestamp) {
      var $el = this;
      $el.find('span.canvas').slider('value',timestamp);
    }
  };


  /***************************************************************************
   * Static methods
  **************************************************************************/
   // var pluginPrototype = $.fn[name];
   // pluginPrototype.methodName = Core.methodName;


  /***************************************************************************
   * Helpers (general purpose private methods)
  **************************************************************************/
  Helper = {};


  /***************************************************************************
   * Plugin installation
  **************************************************************************/
  $.fn[name] = function (userInput) {
    // check if such method exists
    if ( $.type( userInput ) === "string" && API[ userInput ] ) {
      return API[ userInput ].apply( this, Array.prototype.slice.call( arguments, 1 ) );
    }
    // initialise otherwise
    else if ( $.type( userInput ) === "object" || !userInput ) {
      return Core._init.apply( this, arguments );
    } else {
      $.error( 'You cannot invoke ' + name + ' jQuery plugin with the arguments: ' + userInput );
    }
  };
})( jQuery, window );








/**************************************************************************
* DROPDOWN PLUGIN
**************************************************************************/
(function($, window, undefined) {

  // constants
  var TRUE = true, FALSE = true, NULL = null
    , name = 'dropdown'
  // Plugin parts
    , Core, API, Helper
  // default options
    , defaultOptions = {
        globalEvents : []
      };


    /***************************************************************************
    * Private methods
    **************************************************************************/
    Core = {
      pluginName : name,
      options : null,


    _init : function (options) {
      // take user options in consideration
      Core.options = $.extend( true, defaultOptions, options );
      return this.each( function () {
        var $el = $(this);

        // Create elements
        Core._createElements($el);

        // Bind events
        Core._bind($el);
      });
    },


    _bind: function($el) {
      $el.find('a.init').bind({'click':Core._onClick});
    },


    _trigger : function ( eventName, data, $el ) {
      var isGlobal = $.inArray( eventName, Core.options.globalEvents ) >= 0, eventName = eventName + '.' +  Core.pluginName;

      if (!isGlobal) {
        $el.trigger( eventName, data );
      } else {
        $.event.trigger( eventName, data );
      }
    },
 

    // PRIVATE LOGIC
    _createElements: function($el) {

      var text = $el.text();

      $el.html(
        '<a class="init" href="#' + text + '">' + text + '</a>'+
        '<div class="options">' +
          '<div class="t"></div>' +
          '<div class="b"></div>' +
          '<ul></ul>' +
        '</div>'
      );

      var list = $el.find('ul');
      _.each(Core.options.source, function(v,i){
        list.append('<li><a href="' + v.url + '">' + v.name + '</a></li>');
      });
    },


    _onClick: function(ev) {
      ev.stopPropagation();
      ev.preventDefault();

      var $el = $(ev.target).closest('span.select');
      if ($el.hasClass('active')) {
        Core._close($el);
      } else {
        Core._open($el);
      }
    },

    _open: function($el) {
      $el.addClass('active');
      $('body').click(function(ev) {
        if (!$(ev.target).closest('span.select').length) {
          Core._close($el);
          $('body').unbind('click');
        };
      });
    },

    _close: function($el) {
      $el.removeClass('active');
      $('body').unbind('click');
    }
  };




  /***************************************************************************
   * Plugin installation
  **************************************************************************/
  $.fn[name] = function (userInput) {
    // check if such method exists
    if ( $.type( userInput ) === "string" && API[ userInput ] ) {
      return API[ userInput ].apply( this, Array.prototype.slice.call( arguments, 1 ) );
    }
    // initialise otherwise
    else if ( $.type( userInput ) === "object" || !userInput ) {
      return Core._init.apply( this, arguments );
    } else {
      $.error( 'You cannot invoke ' + name + ' jQuery plugin with the arguments: ' + userInput );
    }
  };
})( jQuery, window );




(function(){
  // $('.slider').wriSlider({
  //     start: 'January 1, 2006 00:00:00'
  //   , end: 'February 1, 2012 00:00:00'
  //   , value: 'January 1, 2009 00:00:00'
  // });

  // $('.slider').wriSlider('update',[3423445]);

  /*$('span.select').dropdown({
    source: [{name:'vizz',url:'#where'},{name:'asdf asdf asdf asdf',url:'#where'},{name:'asdf asdf asdf asdf asdf',url:'#where'},{name:'as dfas fasd fdsaf',url:'#where'}]
  });
  */

})( jQuery, window );
