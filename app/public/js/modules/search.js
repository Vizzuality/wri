App.modules.Search = function(app) {

    var Search = Backbone.View.extend({
      initialize: function() {
        _.bindAll(this, 'render', 'set_time');
        this.countries = this.options.countries;
        this.countries.bind('reset', this.render);
        this.el.autocomplete({
            source: [],
            minLength: 2,
            url: '/country#'
        });
      },

      set_time: function(month) {
          this.month = month;
          this.render();
      },

      render: function() {
        var self = this;
        // generate list
        var country_list_search = this.countries.map(function(c) {
          return {
            'label': c.get('name_engli'),
            'per': c.def_percent_in_month(self.month)
          };
        });

        this.el.autocomplete("option", 'source', country_list_search);
      }
    });

    app.Search = Search;
};
