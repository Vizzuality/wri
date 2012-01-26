/*
 ===============================================
 WRIHome manages /
 ===============================================
*/

App.modules.WRIHome= function(app) {


	var Country = Backbone.Model.extend({
		center: function() {
			return JSON.parse(this.get('the_geom')).coordinates;
		},
		time_series: function() {
			return this.get('cumm');
		}
	});

    /**
     * countries collection
     */
    var Countries = app.CartoDB.CartoDBCollection.extend({
	  model: Country,
      table: 'country_attributes_live',
      columns: [
		'unregion1',
		'unregion2',
		'name_engli',
		'cumm',
		'total_incr',
		'start_value',
		'ST_AsGeoJSON(ST_Centroid(the_geom)) as the_geom'
	  ],
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

    var Search = Backbone.View.extend({
      initialize: function() {
        _.bindAll(this, 'render');
	    var test = [{label:'jamon', per: 40},{label:'santana'},{label:'Spain'}];
        this.countries = this.options.countries;
        this.countries.bind('reset', this.render);
        this.el.autocomplete({
            source: test,
            minLength: 2,
            url: '/country#'
        });
      },

      render: function() {
        // generate list
        var country_list_search = this.countries.map(function(c) {
          return {
            'label': c.get('name_engli'),
            'per': (Math.random()*100)>>0
          }
        });

        this.el.autocomplete("option", 'source', country_list_search);
      }
    });

    /*
     * main controller for home page
     */
    app.WRIHome = Class.extend({

      run: function() {


        var countries = new Countries();

        var bubbleMap = new app.MainMap(countries);

        var search = new Search({
          el: $('#autocomplete'),
          countries: countries
        });

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

