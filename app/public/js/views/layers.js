
var Layer = Backbone.View.extend({

    template: _.template('<span class="color <%=normalized_name%>">&nbsp</span><%= name %>'),

    tagName: 'li',

    events: {
      'click': 'toggle'
    },

    initialize: function(layer) {
        var self = this;
        this.layer = this.options.layer;
    },

    render: function() {
        var el = $(this.el);
        var d = _.extend(this.layer, {
            normalized_name: this.layer.name.replace(' ', '_')
        });
        el.html(
            this.template(d)
        ).addClass('sortable').attr('id', this.layer.name);
        if(this.layer.enabled) {
            el.addClass('enabled');
        }
        return this;
    },

    toggle: function() {
        var e = !this.layer.showing;
        var el = $(this.el);
        if(e) {
            el.addClass('enabled');
        } else {
            el.removeClass('enabled');
        }
        this.trigger('changed', this.layer.name);
    },

    close: function() {
        this.unbind();
        this.remove();
    }

});

var LayerEditor = Backbone.View.extend({

    events: {
        'click': 'open'
    },

    initialize: function() {
        var self = this;
        this.layers = this.options.layers;
        this.open = false;
        this.views = {};
        this.render();
    },

    render: function(howmany, order) {
        var self = this;
        var el = this.$('ul');
        /*el.find('li').each(function(i,el){
            $(el).remove()
        });*/
        _(this.layers).each(function(layer) {
            if(layer.editable) {
                var v = self.views[layer.name];
                if (v) {
                    v.close();
                }
                v = new Layer({ layer: layer });
                v.bind('changed', function(name) {
                    self.trigger('layer_changed', name);
                });
                self.views[layer.name] = v;
                el.append(v.render().el);
            }
        });
        /*el.sortable({
          revert: false,
          items: '.sortable',
          axis: 'y',
          cursor: 'pointer',
          stop:function(event,ui){
            $(ui.item).removeClass('moving');
            //
            //DONT CALL THIS FUNCTION ON beforeStop event, it will crash :D
            //
            self.sortLayers();
          },
          start:function(event,ui){
            $(ui.item).addClass('moving');
          }
        });
        */
        return this;
    },

    sortLayers: function() {
        var order = [];
        this.$('li').each(function(i, el) {
            order.push($(el).attr('id'));
        });
        this.trigger('layers_changed');
        //this.bus.emit("map:reorder_layers", order);
    },

    open: function(e) {
        if(e) e.preventDefault();
        this.el.addClass('open');
        this.el.css("z-index","100");      
        this.open = true;
    },

    close: function(e) {
        this.el.removeClass('open');
        this.el.css("z-index","10");
        this.open = false;
    },

    sort_by: function(layers_order) {
        this.layers.sort(function(a, b) {
          return _(layers_order).indexOf(a.name) -
             _(layers_order).indexOf(b.name);
        });
        this.open = true;
    },

});
