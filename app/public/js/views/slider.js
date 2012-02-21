
/**
 * footer slider
 */
var Slider = Backbone.View.extend({

    START:  new Date(2006, 0, 1),

    initialize: function() {
        _.bindAll(this, 'startDrag', 'onDrag', 'endDrag');
        var self = this;
        this.el.wriSlider({
           start: 'February 1, 2006 00:00:00', 
           end: 'January 1, 2012 00:00:00',
           value: 'January 1, 2012 00:00:00'
        });
        this.dragging = false;
        this.marker = this.$('.marker');
        this.el.bind('change.wriSlider', function(ev, v){
              var start = self.START;
              /*var start = self.START.getTime();
              var d = v - start;
              var month = d/(3600*1000*24*30);
              */
              var d = new Date(v);
              var month = 12*(d.getFullYear() - start.getFullYear()) + d.getMonth();

              self.trigger('change', month>>0);
        });

    },

    month_to_date: function(month) {
      var months = month % 12;
      var years = (month/12)>>0;
      return new Date(this.START.getFullYear() + years, this.START.getMonth() + months, 1);
    },

    stop: function() {
        this.el.wriSlider('stop');
    },

    set_time: function(month) {
        var self = this;
        var t = this.month_to_date(month);
        self.el.wriSlider('update', t.getTime());
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
