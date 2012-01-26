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
			$(window).resize(Core._resetSlider)
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

			Core._initializeSlider($el);
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
					var date = Core.options.monthNames[new Date(ui.value).getMonth()] + ' ' + new Date(ui.value).getFullYear();
					$(ev.target).find('a.ui-slider-handle').text(date);
					var value = ui.value;
					Core._trigger('change',[value],$(ev.target));
				}
			});
		},

		_resetSlider: function(ev) {
			//console.log(ev);
		}


	};


	/***************************************************************************
	* Public methods
	**************************************************************************/
	API = {
		// YOUR PLUGIN PUBLIC LOGIC HERE
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



(function(){
	$('footer.slider').wriSlider({
			start: 'January 1, 2006 00:00:00'
		, end: 'February 1, 2012 00:00:00'
		, value: 'January 1, 2009 00:00:00'
	});

})( jQuery, window );
