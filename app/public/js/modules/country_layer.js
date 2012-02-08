
/**
 * quick'n'dirty tilemill on top of cartodb
 */

var MiniTilemill = function(user, map) {
    this.layers = {};
    this.user_name = user;
    this.map = map;
    this.use_cartodb_styles = false;
};

MiniTilemill.prototype.addLayer = function(style, table, name_editor, sql) {

    var layer = new CartoDBLayer(
        this.user_name,
        sql,
        table,
        style
    )

    this.layers[name_editor] = layer;
    this.map.add_layer(name_editor, {name: table, enabled: true}, layer);
    //this.map.enable_layer(table, true);
    return layer;
};

MiniTilemill.prototype.toggle = function(table) {
    var l = this.layers[table];
    l.show(!l.showing);
}

MiniTilemill.prototype.update_layers = function() {
    for(var ly in this.layers) {
        this.map.update_layer(ly);
    }
}


/**
 * manages rendering and events of countries borders
 */
App.modules.CountryLayer = function(app) {

    var CountryLayer = Class.extend({
        LEVEL_COUNTRY: 1,
        LEVEL_REGION: 2,

        init: function(map) {
            _.bindAll(this, 'mousemove', 'map_click');
            var self = this;

            self.level = this.LEVEL_COUNTRY;
            self.state = [];
            self.map = map;
            self.zoom_country = 8;

            this.tilemill = new MiniTilemill("wri-01", map.map);

            //TODO: extract to constants
            var cartodb = new CartoDB({
                user: 'wri-01',
                table: 'admin1_attributes_live',
                columns: ['iso', 'shape_area', 'cartodb_id', 'cumm'],
                debug: false,
                where: 'forma=true',
                shader: {
                    'point-color': '#fff',
                    'line-color': 'rgba(0,0,0,0)',//'#D7D7D8',
                    'line-width': '0',
                    'polygon-fill': 'rgba(255,255, 255,0.01)'
                }
            });
            map.map.add_layer('vector0', {name: 'v0', enabled: true}, cartodb);
            self.layer = cartodb;

            this.pas_layer = this.tilemill.addLayer(
                //$('#selected_countries_pas').html(),
                null,
                'selected_countries_pas',
                'Protected Areas'

            );
            this.rivers = this.tilemill.addLayer(
                //$('#rivers').html(),
                null,
                'rivers',
                'Rivers'
            );
            this.country_border = this.tilemill.addLayer(
                $('#border_style').html(),
                'country_attributes_live',
                'Borders',
                "select 0 as lid,'dummy' as name_1, 0 as shape_area, the_geom_webmercator from country_attributes_live limit 1"
            );

            this.places = this.tilemill.addLayer(
                //$('#places').html(),
                null,
                'places',
                'Populated places'
            );

            //bindings
            this.map.map.bind('mousemove', this.mousemove);
            this.map.map.bind('click', this.map_click);
            this.map.map.bind('zoom_changed', function(z) {
                if(z <= self.zoom_country) {
                    self.enable_map_interaction();
                }
            });

        },

        map_click: function(e) {
           var self = this;
           var p = self.layer.geometry_at(e.latLng, e.point,self.map.map.get_zoom());
           if(p) {
               var geom = p.geometry;
               var vec = new GeoJSON(geom);
               if(!vec.length) {
                   vec = [vec];
               }

               var b = new google.maps.LatLngBounds();
               _(vec).each(function(v) {
                       v.getPath().forEach(function(ele, idx) {
                           b.extend(ele);
                       });
               });

               self._enter(b, p);
           }
        },

        get_country_zoom: function(bbox) {
            var b = new google.maps.LatLngBounds();
            _(bbox.coordinates[0]).each(function(ll) {
                b.extend(new google.maps.LatLng(ll[1], ll[0]));
            });
            //adapted from http://stackoverflow.com/questions/6048975/google-maps-v3-how-to-calculate-the-zoom-level-for-a-given-bounds
            var GLOBE_WIDTH = 256; // a constant in Google's map projection
            var west = b.getSouthWest().lat();
            var east = b.getNorthEast().lat();
            var angle = east - west;
            if (angle < 0) {
              angle += 360;
            }
            var pixelWidth = $(this.map.map.map.getDiv()).height();
            var zoom = Math.round(Math.log(pixelWidth * 180/ angle / GLOBE_WIDTH) / Math.LN2);
            //return this.map.map.map.getBoundsZoomLevel(b);
            return zoom;
        },

        show_country: function(country, iso) {
            var self = this;
            self.zoom_country = self.get_country_zoom(country.get('bbox'));
            self.map.map.set_min_zoom(self.zoom_country);
            console.log("country zoom", self.zoom_country);

            _.extend(self.layer.options, {
                where: "name_0 = '{0}'".format(country.get('name_engli').replace("'", "''")),
                table: 'admin1_attributes_live',
                columns:['name_0', 'name_1', 'cartodb_id', 'cumm']
            });

            self.map.enable_layer('vector0', true);
            self.layer.layer.redraw();

            var sql = "select 0 as lid, the_geom_webmercator, 'dummy' as name_1, 0 as shape_area from country_attributes_live where iso = '{0}'";
            sql += " UNION ";
            sql += "select 1 as lid, the_geom_webmercator, name_1, shape_area from admin1_attributes_live where iso = '{0}'";
            sql = sql.format(iso);
            self.country_border.update(sql);

            sql = "select the_geom_webmercator, is_point from selected_countries_pas where iso = '{0}'";
            sql = sql.format(iso);
            self.pas_layer.update(sql);

            //sql = "select * from rivers";
            sql = "SELECT rivers.the_geom_webmercator, scalerank FROM rivers, simple_countries where ST_Intersects(rivers.the_geom,simple_countries.the_geom) and simple_countries.iso = '{0}'".format(iso);
            self.rivers.update(sql);

            sql = "select the_geom_webmercator, name, pop_max from places where iso='{0}' order by gn_pop limit 20".format(iso);
            self.places.update(sql);

            this.tilemill.update_layers();

            this.enable_map_interaction();
        },

        enable_map_interaction: function() {
            this.map.map.unbind('mousemove', this.mousemove);
            this.map.map.bind  ('mousemove', this.mousemove);
            this.map.map.unbind('click', this.map_click);
            this.map.map.bind  ('click', this.map_click);
        },

        disable_map_interaction: function() {
            this.map.map.unbind('mousemove', this.mousemove);
            this.map.map.unbind('click', this.map_click);
        },


        _enter: function(b, geometry) {
            if(this.level == this.LEVEL_COUNTRY) {
                this.map.map.map.fitBounds(b);
                this.disable_map_interaction();
                this.map.displace(250, 0);
            }
            this.remove_hover();
        },

        mousemove: function(e) {
            var self = this;
            var p = self.layer.geometry_at(e.latLng, e.point,self.map.map.get_zoom());
            if(p) {
                if(self.current_geom == p.properties.cartodb_id){
                    return ;
                }
                self.trigger('mouse_on', e, p);
                var cid = self.current_geom = p.properties.cartodb_id;
                var geom = p.geometry;
                this.show_hover(geom);
            } else {
                self.remove_hover();
                self.current_geom = null;
                self.trigger('mouse_out');
            }
        },

        show_hover: function(geom) {
            var self = this;
            var opts = {
                    "strokeColor": "#FFFFFF",
                    "strokeOpacity": 0.8,
                    "strokeWeight": 6,
                    "fillColor": "#FFF366",
                    "fillOpacity": 0.0,
                    'clickable': false
            };
            self.remove_hover();
            self.vec = new GeoJSON(geom, opts);
            if(!self.vec.length) {
                self.vec = [self.vec];
            }
            self.vec.forEach(function(gv){
                gv.setMap(self.map.map.map);
            });
        },

        remove_hover: function() {
            var self = this;
            if(self.vec) {
                self.vec.forEach(function(gv){
                   gv.setMap(null);
                });
            }
        }
    });

    _.extend(CountryLayer.prototype, Backbone.Events);
    app.CountryLayer = CountryLayer;

};
