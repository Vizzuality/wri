
/*
 ===============================================
 control map related things
 ===============================================
*/
App.modules.Map = function(app) {

    // edit, delete popup shown when user is editing a poly
    var Popup = Backbone.View.extend({
        el: $('#polygon_popup'),

        events: {
            'click #delete': 'remove',
            'click #done': 'edit'
        },

        initialize: function() {
            _.bindAll(this, 'show', 'hide', 'remove', 'edit');
            this.map = this.options.mapview;
            this.smooth = this.options.smooth || true;
            this.smooth_k = 0.08;
            this.target_pos = null;
            this.current_pos = null;
        },

        remove: function(e) {
            e.preventDefault();
            this.trigger('remove');
        },

        edit: function(e) {
            e.preventDefault();
            this.trigger('edit');
        },

        show: function(at) {
            var self = this;
            var px = this.map.projector.transformCoordinates(at);
            if(!this.timer) {
                this.timer = setInterval(function() {
                    self.current_pos.x += (self.target_pos.x - self.current_pos.x)*self.smooth_k;
                    self.current_pos.y += (self.target_pos.y - self.current_pos.y)*self.smooth_k;
                    self.set_pos(self.current_pos);
                }, 20);
                this.current_pos = px;
            }
            this.target_pos = px;

            if(!this.smooth) {
                set_pos(px);
            }
        },

        set_pos: function(p) {
            this.el.css({
                top: this.current_pos.y - 20 - 50,
                left: this.current_pos.x
            });
            this.el.show();
        },

        hide: function() {
            this.el.hide();
            if(this.timer) {
                clearInterval(this.timer);
                this.timer = null;
            }
        }
    });


    app.Map = Class.extend({
        init: function(bus) {
            _.bindAll(this, 'enable_layer', 'reorder_layers');
            var self = this;
            this.map = new MapView({el: $('.map_container')});
            this.seachbox = new Searchbox({el: $('.map_container .search')});
            this.report_polygons = {};
            // add layers to the map
            _(app.Config.MAP_LAYERS).each(function(layer) {
                self.map.add_layer(layer.name, layer);
                self.map.enable_layer(layer.name, layer.enabled);
            });

            this.popup = new Popup({mapview: this.map});
            this.layer_editor = new LayerEditor({
                el: $('.layers'),
                bus: bus,
                layers: this.map.get_layers()
            });

            this.map.bind('changed:layers', function() {
                self.layer_editor.layers = self.map.get_layers();
                self.layer_editor.render();
            });
            this.map.map.setOptions({'styles': app.Config.MAP_STYLE});
            this.polygon_edit = new PolygonDrawTool({mapview: this.map});
            this.bus = bus;

            this.movement_timeout = -1;

            bus.link(this, {
                'map:enable_layer': 'enable_layer',
                'map:reorder_layers':'reorder_layers'
            });

            this.seachbox.bind('goto', function(latlng, zoom) {
                self.map.set_center(latlng);
                self.map.set_zoom(zoom);
            });
            this.show_controls(false);
        },

        center_map_on: function(bbox) {
              var b = new google.maps.LatLngBounds();
              _(bbox.coordinates[0]).each(function(ll) {
                b.extend(new google.maps.LatLng(ll[1], ll[0]));
              });
              this.map.map.fitBounds(b);
        },

        enable_layer: function(name, enable) {
            this.map.enable_layer(name, enable);
        },

        reorder_layers: function(order) {
            this.map.reorder_layers(order);
            this.layer_editor.render();
        },

        show_controls: function(show) {
            if(show) {
                this.map.show_controls();
                $('.layers').show();
                $('.search').show();
            } else {
                this.map.hide_controls();
                $('.layers').hide();
                $('.search').hide();
            }
        }
    });
};
