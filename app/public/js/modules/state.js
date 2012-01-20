
App.modules.State = function(app) {

    /**
     * this model serializes it in the browser url
     * use it to pass state between clients
     */
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
};
