
App.modules.Stories = function(app) {

  var Stories = app.CartoDB.CartoDBCollection.extend({
      table: 'geostories',
      columns: [
        'iso',
        'text',
        'title',
        'picture_url',
        'name_engli'
      ],

      cache: true,

      random: function(number) {
        var models = this.models;
        return _(_.shuffle(_.range(this.models.length)).slice(0, number)).map(function(i) {
          return models[i];
        });

      }
  });

  // exports
  app.Stories = Stories;
};
