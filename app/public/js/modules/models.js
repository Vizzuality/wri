
App.modules.Data = function(app) {

    var Model = Backbone.Model.extend({

        urlRoot: app.config.API_URL,

        initialize: function() {
          //_.bindAll(this, '_save');
          //this.bind('change:polygons', this.fetch);
          //this.save = _.debounce(this._save, 800);
        }
    });

    app.Model = Model


};
