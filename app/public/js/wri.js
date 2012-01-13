/*
 ===============================================
 main enter point
 ===============================================
*/

/*
 ====================
 this class renders deforestation data in a given time
 ====================
*/

function TimePlayer() {
    this.time = 0;
    this.canvas_setup = this.get_image;
    this.render = this.render_time;
    this.data = [];
    for(var i=0; i < 64*64; ++i) {
        this.data[i] = 0;
    }
}

TimePlayer.prototype = new CanvasTileLayer();

TimePlayer.prototype.set_time = function(t) {
    console.log(t);
    this.time = t;
    this.redraw();
};

TimePlayer.prototype.pre_cache_months = function(time_pixels) {
    this.months = [];
    for(var m=0; m < 48 ; ++m) {
        var data = [];
        for(var i=0; i < 64; ++i) {
            for(var j=0; j < 64; ++j) {
                var xx = i*4;
                var yy = j*4;
                var px = (m/3)>>0;
                var sx = px%4;
                var sy = (px/4)>>0;
                var comp = m%3;
                data[j*64 + i] = time_pixels[((yy + sy)*256 + (xx + sx))*4 + comp];
            }
        }
        this.months[m] = data;
    }

}

TimePlayer.prototype.get_image = function(tile, coord, zoom) {
    var self = this;
    var img = new Image();
    img.src = '/img/test_time.png';
    img.onload = function() {
        var c = tile.canvas;
        tile.ctx.drawImage(img, 0, 0);
        tile.pixel_data = tile.ctx.getImageData(0, 0, c.width, c.height).data;
        self.pre_cache_months(tile.pixel_data);
        //self.render();
    };
};

TimePlayer.prototype.render_time = function(tile, coord, zoom) {
    var month = this.time>>0;
    var w = tile.canvas.width;
    var h = tile.canvas.height;
    var ctx = tile.ctx;
    var image = ctx.getImageData(0,0, w, h);
    var pixels = image.data;
    var time_pixels = tile.pixel_data;
    var pixel_pos;
    var grid_size = 4;
    var data = this.months[month];

    for(i=0; i < w; ++i) {
        for(j=0; j < h; ++j) {
           var x = (i/4)>>0;
           var y = (j/4)>>0;
           var def = data[y*64  + x];
           pixel_pos = 4 * (j*w + i);

            // x,y, time -> real pixel pos
           pixels[pixel_pos + 0] = 25*def;
           pixels[pixel_pos + 1] = 0;
           pixels[pixel_pos + 2] = 0;
           pixels[pixel_pos + 3] = def === 0 ? 0: 200;
        }
    }
    ctx.putImageData(image,0,0);
};

App.modules.WRI= function(app) {

   // app router
   var Router = Backbone.Router.extend({
      routes: {
        "w/*state": "work"
      },

      work: function() {
        app.Log.log("route: work");
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
            this.router.bind('route:work', this.on_route);
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
            ///this.add_test_layer();
            this.add_time_layer();
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
                table: 'gadm0',
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


       on_route: function(state) {
            //this.work_id = work_id;
            //this.banner.hide();
            //this.map.work_mode();
            // show the panel and set mode to adding polys
            //this.panel.show();
            this.app_state.fetch(state);

            //if(state) {
              //this.set_state(this.decode_state(state));
            //}
        },

        on_route_to: function(route) {
            app.Log.debug("route => ", route);
            this.router.navigate(route, true);
        }

    });
};


