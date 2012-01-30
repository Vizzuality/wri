
App.modules.Stories = function(app) {

    var StoryView = Backbone.View.extend({
        tagName: 'li',
        initialize: function() {
            this.template_id = this.options.template_id || '#story-template';
        },

        render: function() {
            var template = _.template($(this.template_id).html());
            $(this.el).html(template(this.model.toJSON()));
            return this;
        }
    });

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
  app.StoryView = StoryView;
};
