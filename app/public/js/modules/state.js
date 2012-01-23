
App.modules.State = function(app) {

    /**
     * this model serializes it in the browser url
     * use it to pass state between clients
     */
    app.State = Backbone.Model.extend({

        initialize: function() {
            // removed because it does not want to work on FF :(
            //this.compressor = LZMA ? new LZMA("/js/libs/lzma_worker.js") : null;
        },

        set_router: function(router) {
            var self = this;
            self.router = router;
            //self.router.bind('route', this.on_route);
        },

        save: function() {
            this.serialize();
        },

        fetch: function(state) {
           var self = this;
           if (state) {
               var b;
               try {
                    b = atob(state);
               } catch(e) {
                   app.Log.error("error parsing state");
                   return;
               }
               self.set(JSON.parse(b));
           }
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
          var self = this;
          var json = JSON.stringify(this.toJSON());
          //remove previous state
          var new_hash = location.hash.replace(/\/s\/[a-zA-Z0-9=]+/,'');
          self.router.navigate(new_hash + '/s/' + btoa(json), false);
          /*
            var self = this;
            var json = JSON.stringify(this.toJSON());
            this.compressor.compress(json, 1, function(data) {
                self.router.navigate('w/' + btoa(data));
            });
            */
        }
    });
};
