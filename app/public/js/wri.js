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
    this.canvas_setup = this.get_time_data;
    this.render = this.render_time;
    this.cells = [];
    this.base_url = 'http://wri-01.cartodb.com/api/v2/sql';
}

TimePlayer.prototype = new CanvasTileLayer();

TimePlayer.prototype.set_time = function(t) {
    console.log(t);
    this.time = t;
    this.redraw();
};

TimePlayer.prototype.sql = function(sql, callback) {
    var self = this;
    $.getJSON(this.base_url  + "?q=" + encodeURIComponent(sql) ,function(data){
        callback(data);
    });
}

TimePlayer.prototype.pre_cache_months = function(rows) {
    var row;
    var cells = [];
    for(var i in rows) {
      row = rows[i];
      cells[i] = {
        x: row.upper_left_x,
        y: row.upper_left_y,
        months: row.cummulative
      }
    }
    return cells;
}

// get time data in json format
TimePlayer.prototype.get_time_data = function(tile, coord, zoom) {
    var self = this;

    var projection = new MercatorProjection();
    var bbox = projection.tileBBox(coord.x, coord.y, zoom);
    var sql = "SELECT upper_left_x, upper_left_y, cell_width, cell_height, pixels, total_incr as events, cummulative, boxpoly, the_geom_webmercator FROM griddify_results"

    sql += " WHERE the_geom && ST_SetSRID(ST_MakeBox2D(";
    sql += "ST_Point(" + bbox[0].lng() + "," + bbox[0].lat() +"),";
    sql += "ST_Point(" + bbox[1].lng() + "," + bbox[1].lat() +")), 4326)";

    this.sql(sql, function(data) {
        tile.cells = self.pre_cache_months(data.rows);
    });
}


var originShift = 2 * Math.PI* 6378137 / 2.0;
function meterToPixels(mx, my, zoom) {
  var initialResolution = 2 * Math.PI * 6378137 / 256.0;
  var res = initialResolution / (1 << zoom)
  px = (mx + originShift) / res
  py = (my + originShift) / res
  return [px, py];
}


TimePlayer.prototype.render_time = function(tile, coord, zoom) {
    var projection = new MercatorProjection();
    var month = this.time>>0;
    var w = tile.canvas.width;
    var h = tile.canvas.height;
    var ctx = tile.ctx;
    var data, i, j, x, y, def;

    var cells = tile.cells;
    var cell;
    var point;
    var x, y;

    // clear canvas
    tile.canvas.width = w;

    ctx.fillStyle = "#000";
    // render cells
    for(i=0; i < cells.length; ++i) {
      cell = cells[i];

      //transform to local tile x/y
      //TODO: precache this
      point = projection.tilePoint(coord.x, coord.y, zoom);
      pixels = meterToPixels(cell.x, cell.y, zoom);
      pixels[1] = (256 << zoom) - pixels[1];
      x = pixels[0] - point[0];
      y = pixels[1] - point[1];

      //var c = (255.0*cell.months[month]/10)>>0;
      ctx.fillStyle = '#000';
      if(cell.months) {
        var c =  cell.months[month];
        var colors = [
            'rgba(255, 51, 51, 0.9)',
            'rgba(170, 52, 51, 0.6)',
            'rgba(104, 48, 59, 0.6)',
            'rgba(84, 48, 59, 0.6)'
        ]
        if (c == 0) continue;
        var idx = 0;
        if(c < 10) idx = 0;
        if(c < 7.5) idx = 1
        if(c < 5) idx = 2;
        if(c < 2.5) idx = 3;
        ctx.fillStyle = colors[idx];//"rgb(" + c + ",0, 0)";
      }
      // render
      ctx.fillRect(x, y, 6, 6);
    }
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


