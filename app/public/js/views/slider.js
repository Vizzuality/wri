
/**
 * footer slider
 */
var Slider = Backbone.View.extend({

    events: {
        'mousedown .marker': 'startDrag',
    },

    initialize: function() {
        _.bindAll(this, 'startDrag', 'onDrag', 'endDrag');
        this.dragging = false;
        this.marker = this.$('.marker');
    },

    startDrag: function(e) {
        this.dragging = true;
        this.startPos = this.marker.position();
        this.startMousePos = e.clientX;
        $(document).mousemove(this.onDrag);
        $(document).mouseup(this.endDrag);
        return false;
    },

    onDrag: function(e) {
        if(!this.dragging) 
            return;

        var span = this.el.width();
        var offset = e.clientX - this.startMousePos;
        var newPos =  this.startPos.left + offset;
        newPos = Math.max(0, newPos);
        newPos = Math.min(span - this.marker.width(), newPos);
        this.marker.css({left: newPos});
        this.trigger('change', newPos/span);
        return false;

    },

    endDrag: function(e) {
        this.dragging = false;
        $(document).unbind('mousemove', this.onDrag);
        $(document).unbind('mouseup', this.onDrag);
        return false;
    }

});

var HTML5Slider = Backbone.View.extend({

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
