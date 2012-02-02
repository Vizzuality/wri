

/**
 * quick'n'dirty tilemill on top of cartodb
 */

var MiniTilemill = function(user, map) {
    this.layers = [];
    this.user_name = user;
    this.map = map;
};

MiniTilemill.prototype.addLayer = function(style, table) {

    var layer = new google.maps.CartoDBLayer({
        map_canvas: 'map_canvas',
        map: this.map,
        user_name: 'tiles' + ['01', '02', '03', '04'][this.layers.length%3] + "." + this.user_name,
        //user_name: this.user_name,
        table_name: table,
        map_style: false,
        infowindow: false,
        auto_bound: false,
        tile_style: style,
        index: this.layers.length
    });

    this.layers.push({
        layer: layer,
        table: table
    });
    return layer;
};

MiniTilemill.prototype.update_query = function(q) {
    var sql = "select * from country_attributes_live where iso = '{0}'";
    sql = sql.format(iso);
    self.country_border.update(sql);
};

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

            this.tilemill = new MiniTilemill("wri-01", map.map.map);

            //TODO: extract to constants
            var cartodb = new CartoDB({
                user: 'wri-01',
                table: 'admin1_attributes_live',
                columns: ['iso', 'shape_area', 'cartodb_id'],
                debug: false,
                where: 'forma=true',
                shader: {
                    'point-color': '#fff',
                    'line-color': 'rgba(0,0,0,0)',//'#D7D7D8',
                    'line-width': '0',
                    'polygon-fill': 'rgba(255,255, 255,0.01)'
                }
            });
            map.map.add_layer('vector0', {name: 'v0', enabled: true}, cartodb.layer);
            self.layer = cartodb;

            this.pas_layer = this.tilemill.addLayer(
                $('#selected_countries_pas').html(),
                'selected_countries_pas'
            );
            this.country_border = this.tilemill.addLayer(
                $('#border_style').html(),
                'country_attributes_live'
            );
            this.rivers = this.tilemill.addLayer(
                $('#rivers').html(),
                'rivers'
            );
            this.places = this.tilemill.addLayer(
                $('#places').html(),
                'places'
            );

            //bindings
            this.map.map.bind('mousemove', this.mousemove);
            this.map.map.bind('click', this.map_click);

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

        show_country: function(country, iso) {
            var self = this;
            _.extend(self.layer.options, {
                where: "name_0 = '{0}'".format(country.replace("'", "''")),
                table: 'admin1_attributes_live',
                columns:['name_0', 'name_1', 'cartodb_id']
            });
            self.map.enable_layer('vector0', true);
            self.layer.layer.redraw();
            self.vec_cache = {};

            var sql = "select 0 as lid, the_geom_webmercator, 'dummy' as name_1 from country_attributes_live where iso = '{0}'";

            sql += " UNION ";
            sql += "select 1 as lid, the_geom_webmercator, name_1 from admin1_attributes_live where iso = '{0}'";
            sql = sql.format(iso);
            self.country_border.update(sql);

            sql = "select * from selected_countries_pas where iso = '{0}'";
            sql = sql.format(iso);
            self.pas_layer.update(sql);

            sql = "select * from rivers";
            self.rivers.update(sql);

            sql = "select * from places";
            self.places.update(sql);
        },

        show_region: function(region) {
            /*var self = this;
            _.extend(self.layer.options, {
                where: "name_1 = '{0}'".format(region),
                table: 'gadm2',
                columns:['name_0', 'name_1', 'cartodb_id']
            });
            self.map.enable_layer('vector0', true);
            self.layer.layer.redraw();
            self.vec_cache = {};
            */
        },


        _enter: function(b, geometry) {
            if(this.level == this.LEVEL_COUNTRY) {
                //update level
                //this.state.push(b);
                //this.level = this.LEVEL_REGION;
                //var area_name = geometry.properties.name_1;
                //this.show_region(area_name);
                //this.trigger('changed_area_name', area_name);
                this.map.map.map.fitBounds(b);
                this.map.map.unbind('mousemove', this.mousemove);
            }
            /* else if(this.level == this.LEVEL_REGION) {
                this.map.map.unbind('mousemove', this.mousemove);
                this.map.map.map.fitBounds(b);
            }*/
            this.remove_hover();
        },

        back: function() {
            if(this.level == this.LEVEL_REGION) {
                var country = this.state.push(b);
                this.show_country(country);
                this.trigger('changed_area_name', country);
                this.level = this.LEVEL_COUNTRY;
                //always unbind to not bind twice
                this.map.map.unbind('mousemove', this.mousemove);
                this.map.map.bind('mousemove', this.mousemove);
            }
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
