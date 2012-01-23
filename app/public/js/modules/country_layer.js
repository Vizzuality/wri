

/**
 * manages rendering and events of countries borders
 */
App.modules.CountryLayer = function(app) {

    app.CountryLayer = Class.extend({

        init: function(map) {
            _.bindAll(this, 'mousemove');
            var self = this;
            //TODO: extract to constants
            var cartodb = new CartoDB({
                user: 'wri-01',
                table: 'gadm0_simple',
                columns: ['iso', 'shape_area', 'cartodb_id'],
                debug: false,
                where: 'forma=true',
                shader: {
                    'point-color': '#fff',
                    'line-color': '#D7D7D8',
                    'line-width': '2',
                    'polygon-fill': 'rgba(255,255, 255,0.2)'
                }
            });
            self.map = map;
            map.map.add_layer('vector0', {name: 'v0', enabled: true}, cartodb.layer);
            self.layer = cartodb;

            //bindings
            this.map.map.bind('mousemove', this.mousemove);

        },

        show_country: function(country) {
            var self = this;
            //self.layer.options.where = "name_engli = '{0}'".format(country);
            self.layer.options.where = "name_0 = '{0}'".format(country);
            self.layer.options.table = 'gadm1';
            self.layer.options.columns = ['name_0', 'name_1', 'cartodb_id'];
            self.map.enable_layer('vector0', true);
            self.layer.layer.redraw();
            self.vec_cache = {};
        },

        push: function(b) {
            var columns_level = [
                ['name_engli','cartodb_id'],
                ['name_0', 'name_1', 'cartodb_id'],
                ['name_0', 'name_1', 'name_2', 'cartodb_id']
            ];

            //update level
            this.state.push(b);
            ++this.level;
            this.cartodb.options.table = 'gadm' + this.level;
            this.cartodb.options.columns = columns_level[this.level];
            this.map.map.map.fitBounds(b);

        },

        mousemove: function(e) {
            var self = this;
            var p = self.layer.geometry_at(e.latLng, e.point,self.map.map.get_zoom());
            if(p) {
                if(self.current_geom == p.properties.cartodb_id){
                    return ;
                }
                var cid = self.current_geom = p.properties.cartodb_id;

                //self.stats_panel.set_info(p.properties);
                var geom = p.geometry;
                var opts = {
                        "strokeColor": "#FFF366",
                        "strokeOpacity": 0.8,
                        "strokeWeight": 2,
                        "fillColor": "#FFF366",
                        "fillOpacity": 0.6,
                        'clickable': false
                };
                if(self.vec) {
                    self.vec.forEach(function(gv){
                       gv.setMap(null);
                    });
                }
                if(self.vec_cache[cid]) {
                    self.vec = self.vec_cache[cid];
                } else {
                    self.vec = new GeoJSON(geom, opts);
                    if(!self.vec.length) {
                        self.vec = [self.vec];
                    }
                    self.vec_cache[cid] = self.vec;
                }
                self.vec.forEach(function(gv){
                    gv.setMap(self.map.map.map);
                });
            } else {
                if(self.vec) {
                    self.vec.forEach(function(gv){
                       gv.setMap(null);
                    });
                }
                self.current_geom = null;
            }
        }
    });

};
