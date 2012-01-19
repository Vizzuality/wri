/*
 ===============================================
 main enter point
 ===============================================
*/

App.modules.WRI= function(app) {

   // app router
   var Router = Backbone.Router.extend({
      routes: {
        ":country": "country",
        ":country/*state": "country"
      },

      country: function() {
        app.Log.log("route: country");
      }

    });

    app.State = Backbone.Model.extend({

        initialize: function() {
            //this.compressor = LZMA ? new LZMA("/js/libs/lzma_worker.js") : null;
        },

        save: function() {
            this.serialize();
        },

        fetch: function(state) {
          /*
            var self = this;
            var b = atob(state);
            var bytes = b.split(',').map(function(s){  return parseInt(s, 10); }); 
            self.compressor.decompress(bytes, function(res){
                self.set(JSON.parse(res));
            });
            */
        },

        serialize: function() {
          /*
            var self = this;
            var json = JSON.stringify(this.toJSON());
            this.compressor.compress(json, 1, function(data) {
                self.router.navigate('w/' + btoa(data));
            });
            */
        }
    });

    var Country = app.CartoDB.CartoDBModel.extend({
      table: "gadm0",
      columns: {
        'id': 'cartodb_id',
        'name': 'name_engli',
        'center': 'ST_Centroid(the_geom)',
        'bbox': 'ST_Envelope(the_geom)'
      },
      what: 'name_engli'
    });

    // the app
    app.WRI = Class.extend({

        init: function() {
            _.bindAll(this, 'on_route');
            $('html,body').css({overflow: 'hidden'});
        },

        run: function() {
            _.bindAll(this, 'on_route_to', '_state_url');
            var self = this;
            this.bus = new app.Bus();
            // set a global bus
            app.bus = this.bus;
            this.map = new app.Map(this.bus);

            // init routing
            this.router = new Router();
            this.router.bind('route:country', this.on_route);
            this.app_state = new app.State();
            this.app_state.router = this.router;

            this.state = [];
            this.level = 0;

            // main components

            this.stats_panel = new app.StatsPanel({el: $('#panel')}); 
            this.time_slider = new Slider({el: $("#time_slider")});
            this.time_slider.bind('change', function(v) {
                self.time_layer.set_time(v);
            });

            this.bus.on('app:route_to', this.on_route_to);

            this.state_url = _.debounce(this._state_url, 200);
            this.map.map.bind('center_changed', this.state_url);
            this.map.map.bind('zoom_changed', this.state_url);
            this.map.show_controls(true);


            // ready, luanch
            Backbone.history.start();
            //this.router.navigate('w/work_test');
            /*
            var test = new app.Model();
            test.set({'my_test': 'jaja'});
            test.save();
            setTimeout(function() {
              test.set({'my_test': 'ADASD'});
              test.save();
            }, 1000);
            */
            //this.add_test_layer();
            //this.add_time_layer();
        },

        add_time_layer: function() {
            var lyr = new TimePlayer();
            this.time_layer = lyr;
            this.map.map.add_layer('time', {name: 't'}, lyr);
            this.map.map.enable_layer('time', true);
        },

        add_test_layer: function() {
            var self = this;
            var cartodb = new CartoDB({
                user: 'wri-01',
                table: 'gadm0_simple',
                columns: ['iso',   'shape_area', 'cartodb_id'],
                debug: false,
                where: 'forma=true',
                shader: {
                    'point-color': '#fff',
                    'line-color': '#000',
                    'line-width': '1',
                    'polygon-fill': function(data) { 
                        var c = 255 - (255*data.shape_area/950.0)>>0;
                        return "rgba(" + c + ", 250, 250, 0.8)";
                    }
                }
            });
            self.cartodb = cartodb;
            this.map.map.add_layer('vector0', {name: 'v0', enabled: true}, cartodb.layer);
            this.map.map.enable_layer('vector0', true);
            self.vec = null;
            self.current_geom = null;
            self.vec_cache = {};

            this.map.map.bind('click', function(e) {
                var p = cartodb.geometry_at(e.latLng, e.point,self.map.map.get_zoom());
                if(p) {
                    var geom = p.geometry;
                    var vec = new GeoJSON(geom);
                    if(!vec.length) vec =[vec];
                    var b = new google.maps.LatLngBounds();
                    _(vec).each(function(v) {
                        v.getPath().forEach(function(ele, idx) {
                            b.extend(ele);
                        });
                    });

                    self.push(b);
                }
            });


            this.map.map.bind('mousemove', function(e) {
                var p = cartodb.geometry_at(e.latLng, e.point,self.map.map.get_zoom());
                if(p) {
                    if(self.current_geom == p.properties.cartodb_id){
                        return ;
                    }
                    var cid = self.current_geom = p.properties.cartodb_id;

                    self.stats_panel.set_info(p.properties);
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
                }
            });
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

        _state_url: function() {
            var self = this;
            var c = self.map.map.get_center();
            self.app_state.set({
                'map': {
                    center: {
                        lat: c.lat(),
                        lon: c.lng()
                    },
                    zoom: self.map.map.get_zoom()
                }
            });
            self.app_state.save();

        },

        set_state: function(st) {
          var self = this;
          self.map.map.set_center(new google.maps.LatLng(st.lat,st.lon));
          self.map.map.set_zoom(st.zoom);
       },


       on_route: function(country, state) {
            //this.work_id = work_id;
            //this.banner.hide();
            //this.map.work_mode();
            // show the panel and set mode to adding polys
            //this.panel.show();
            //this.app_state.fetch(state);

            //if(state) {
              //this.set_state(this.decode_state(state));
            //}
            var self = this;
            var c = new Country({'name_engli': country});
            c.fetch();
            c.bind('change', function() {
              var b = new google.maps.LatLngBounds();
              _(c.get('bbox').coordinates[0]).each(function(ll) {
                b.extend(new google.maps.LatLng(ll[1], ll[0]));
              });
              self.map.map.map.fitBounds(b);

            });
        },

        on_route_to: function(route) {
            app.Log.debug("route => ", route);
            this.router.navigate(route, true);
        }

    });
};


