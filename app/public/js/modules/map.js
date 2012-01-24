
/*
 ===============================================
 control map related things
 ===============================================
*/
App.modules.Map = function(app) {

    // edit, delete popup shown when user is editing a poly
    var Popup = Backbone.View.extend({
        el: $('.area_popup'),

        initialize: function() {
            _.bindAll(this, 'show', 'hide');
            this.map = this.options.mapview;
        },

        show: function(at, info) {
            var self = this;
            var px = this.map.projector.transformCoordinates(at);
            this.set_pos(px);
        },

        set_pos: function(p) {
            this.el.css({
                top: p.y - 20 - 50,
                left: p.x
            });
            this.el.show();
        },

        hide: function() {
            this.el.hide();
        }
    });


    app.Map = Class.extend({
        init: function(bus) {
            _.bindAll(this, 'enable_layer', 'reorder_layers', 'show_area_info');
            var self = this;
            this.bus = bus;
            this.map = new MapView({el: $('.map_container')});
            this.seachbox = new Searchbox({el: $('.map_container .search')});
            this.popup = new Popup({mapview: this.map});
            this.movement_timeout = -1;
            this.report_polygons = {};

            // add layers to the map
            _(app.Config.MAP_LAYERS).each(function(layer) {
                self.map.add_layer(layer.name, layer);
                self.map.enable_layer(layer.name, layer.enabled);
            });

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


            bus.link(this, {
                'map:enable_layer': 'enable_layer',
                'map:reorder_layers':'reorder_layers'
            });

            this.seachbox.bind('goto', function(latlng, zoom) {
                self.map.set_center(latlng);
                self.map.set_zoom(zoom);
            });

            // prebuil layers
            self.country_layer = new app.CountryLayer(self);
            self.country_layer.bind('mouse_on', this.show_area_info);
            self.country_layer.bind('mouse_out', self.popup.hide);

            this.show_controls(false);
        },

        //shows the popup when the user hovers some area
        show_area_info: function(e, area) {
            this.popup.show(e.latLng, "TODO");
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

        show_country: function(country) {
            this.country_layer.show_country(country);
        },

        enter_on: function(region_name) {
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
