// jqueryui slider wrapper
// triggers change with values
//
//
var Slider = Backbone.View.extend({

    events: {
        'change': 'slide'
    },

    initialize: function() {
        _.bind(this, 'slide', 'set_values');
    },

    slide: function(e) {
        this.trigger('change', this.el.val());
    },

    set_value: function(value) {
        this.el.slider( "value" , 0, low);
    }
});

