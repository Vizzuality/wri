/*
 ===============================================
 WRIHome manages /
 ===============================================
*/

App.modules.WRIHome= function(app) {


    /**
     * countries collection
     */
    var Countries = app.CartoDB.CartoDBCollection.extend({
      table: 'gadm0',
      columns: ['unregion1', 'unregion2', 'name_engli'],
      cache: true,
      inside: function(area) {
        return this.filter(function(c) {
          return c.get('unregion1') === area;
        });
      }
    });

    /**
     * country list on the home page.
     * Renders a country list
     */
    var CountriesView = Backbone.View.extend({

      initialize: function() {
        _.bindAll(this, 'render');
        this.countries = this.options.countries;
        this.area = this.options.area;
        this.countries.bind('reset', this.render);
      },

      render: function() {
        //TODO: manage more than 1 area
        var names = _.map(this.countries.inside(this.area), function(c) { return c.get('name_engli');});
        names = _(names).map(function(n) {
          return '<li><a href="/country#{0}">{0}<span style="width:50%" class="bar"></span></a></li>'.format(n);
        });
        this.el.html('');
        this.el.append(names.join(''));
        return this.el;
      }

    });

    /*
     * main controller for home page
     */
    app.WRIHome = Class.extend({

      run: function() {

        app.MainMap();

        var countries = new Countries();
        // the 3 country lists
        var views = [
          new CountriesView({
            el: $('#south_america'),
            area: 'South America',
            countries: countries
          }),
          new CountriesView({
            el: $('#middle_america'),
            area: 'Central America',
            countries: countries
          }),
          new CountriesView({
            el: $('#south_east_asia'),
            area: 'Southern Asia',
            countries: countries
          })
        ];
        countries.fetch();
      }

    });
}

