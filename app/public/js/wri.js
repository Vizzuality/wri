/*
 ===============================================
 main enter point
 ===============================================
*/

App.modules.Carbon = function(app) {

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
            this.compressor = LZMA ? new LZMA("/js/libs/lzma_worker.js") : null;
        },

        save: function() {
            this.serialize();
        },

        fetch: function(state) {
            var self = this;
            var b = atob(state);
            var bytes = b.split(',').map(function(s){  return parseInt(s, 10); }); 
            self.compressor.decompress(bytes, function(res){
                self.set(JSON.parse(res));
            });
        },

        serialize: function() {
            var self = this;
            var json = JSON.stringify(this.toJSON());
            this.compressor.compress(json, 1, function(data) {
                self.router.navigate('w/' + btoa(data));
            });
        }
    });

    // the app
    app.Carbon = Class.extend({

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

            this.bus.on('app:route_to', this.on_route_to);

            this.state_url = _.debounce(this._state_url, 200);
            this.map.map.bind('center_changed', this.state_url);
            this.map.map.bind('zoom_changed', this.state_url);

            // ready, luanch
            Backbone.history.start();
            //this.router.navigate('w/work_test');
            //
            var test = new app.Model();
            test.set({'my_test': 'jaja'});
            test.save();
            setTimeout(function() {
              test.set({'my_test': 'ADASD'});
              test.save();
            }, 1000);
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

            /*var self = this;
            if(self.work_id === undefined) return;
            var center = self.map.map.get_center();
            var zoom = self.map.map.get_zoom();
            var data = [];
            data.push(zoom, center.lat(), center.lng());
            var map_pos = data.join(',');

            var layers = self.map.map.layers;
            var layer_data = [];
            var layer_indexes = _.pluck(app.config.MAP_LAYERS,'name');
            _(self.map.map.layers_order).each(function(name) {
                var layer = layers[name];
                var idx = _.indexOf(layer_indexes, name);
                layer_data.push(idx);
                layer_data.push(layer.enabled?1:0);
            });

            self.router.navigate('w/' + self.work_id + '/' + map_pos + '|' + layer_data.join(','));
            */
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
            this.map.show_controls(true);
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


