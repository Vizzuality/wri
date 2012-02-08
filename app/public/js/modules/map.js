
/*
 ===============================================
 control map related things
 ===============================================
*/
App.modules.Map = function(app) {

    // red popup showing zone and activity over a region
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
            this.$('h1').html(info.zone);
            if(info.events) {
                this.$('h2').html(info.events + " events this month");
            } else {
                this.$('h2').html("no events");
            }
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


    /**
     * map and ALL related things like layers and so on
     */
    app.Map = Class.extend({
        init: function(bus) {
            _.bindAll(this, 'enable_layer', 'reorder_layers', 'show_area_info', 'zoom_changed');
            var self = this;
            this.bus = bus;
            this.map = new MapView({el: $('.map_container')});
            this.popup = new Popup({mapview: this.map});
            this.movement_timeout = -1;
            this.report_polygons = {};
            this.month = 0;

            //map style
            //this.map.map.setOptions({'styles': app.Config.MAP_STYLE});

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

            this.layer_editor.bind('layer_changed', function(name) {
                self.country_layer.tilemill.toggle(name);
            });

            this.map.bind('changed:layers', function() {
                self.layer_editor.layers = self.map.get_layers();
                self.layer_editor.render();
            });

            this.map.bind('zoom_changed', this.zoom_changed);


            // prebuil layers
            self.country_layer = new app.CountryLayer(self);
            self.country_layer.bind('mouse_on', this.show_area_info);
            self.country_layer.bind('mouse_out', self.popup.hide);
            self.map.bind('zoom_changed', self.popup.hide);

            //grid layer
            self.grid_layer = new TimePlayer('global_32x');
            self.map.add_layer('time', {name: 't'}, {layer: self.grid_layer});
            self.map.enable_layer('time', true);

            self.show_controls(false);
        },

        //shows the popup when the user hovers some area
        show_area_info: function(e, area) {
            self = this;
            var c = area.properties.cumm;
            var ev = c && c[self.month];
            this.popup.show(e.latLng, {
                zone: area.properties.name_1,
                events: ev
            });
        },

        set_time: function(month) {
            this.month = month;
            this.grid_layer.set_time(month);
        },

        center_map_on: function(bbox) {
              var b = new google.maps.LatLngBounds();
              _(bbox.coordinates[0]).each(function(ll) {
                b.extend(new google.maps.LatLng(ll[1], ll[0]));
              });
              this.map.map.fitBounds(b);
        },

        displace: function(px, py) {
            var p = this.map.projector.transformCoordinates(this.map.get_center());
            p.x += px;
            p.y += py;
            var ll = this.map.projector.untransformCoordinates(p);
            this.map.set_center(ll);
        },

        // enable suitable grid size for each zoom
        zoom_changed: function(z) {
            var self = this;
            console.log("zoom: ", z);
            var size = 32;
            var table_name = 'global_64x_grid';

            if(z == 5) {
                size = 32
                table_name = 'global_32x_grid';
            } else if(z == 6) {
                size = 16;
                table_name = 'global_16x_grid';
            } else if(z == 7) {
                size = 8;
                table_name = 'global_8x_grid';
            } else if(z >= 8) {
                size = 4;
                table_name = 'global_4x_grid';
            }
            self.grid_layer.set_table(table_name, size);
            console.log("table_name: ", table_name);

        },

        enable_layer: function(name, enable) {
            this.map.enable_layer(name, enable);
        },

        reorder_layers: function(order) {
            this.map.reorder_layers(order);
            this.layer_editor.render();
        },

        show_country: function(country, iso) {
            this.country_layer.show_country(country, iso);
            this.grid_layer.set_country_iso(iso);
        },

        enter_on: function(region_name) {
        },

        show_controls: function(show) {
            if(show) {
                this.map.show_controls();
                //$('.layers').show();
                //$('.search').show();
            } else {
                this.map.hide_controls();
                //$('.layers').hide();
                //$('.search').hide();
            }
        }
    });
};
