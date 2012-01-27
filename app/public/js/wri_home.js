/*
 ===============================================
 WRIHome manages /
 ===============================================
*/

App.modules.WRIHome= function(app) {

    var CountryView = Backbone.View.extend({
        tagName: 'li',
        template: '<a href="/country#{0}">{1}<span style="width:50%" class="bar"></span></a>',

        initialize: function() {
            _.bindAll(this, '_remove_growing');
            this.country = this.options.country;
            this.timeout = null;
            this.remove_growing = _.debounce(this._remove_growing, 300);
        },

        _remove_growing: function() {
            this.$('span').removeClass('growing');
        },

        set_time: function(month) {
            var percent =  this.country.get('time_series_normalized')[month]*100.0;
            this.$('span').css({width: percent+ '%'});
            if(Math.abs(percent - this.old_percent) > 0.1) {
                this.$('span').addClass('growing');
                this.remove_growing();
            }
            this.old_percent = percent;
        },

        render: function() {
          $(this.el).append(this.template.format(this.country.slug(), this.country.get('name_engli')));
          return this;
        }
    });

    /**
     * country list on the home page.
     * Renders a country list
     */
    var CountriesView = Backbone.View.extend({

      initialize: function() {
        _.bindAll(this, 'render', 'set_time');
        this.countries = this.options.countries;
        this.area = this.options.area;
        this.countries.bind('reset', this.render);
        this.country_views = [];
      },

      set_time: function(month) {
          this.month = month;
          _(this.country_views).each(function(v) {
              v.set_time(month);
          });
      },

      render: function() {
        var self = this;
        this.el.html('');
        _(this.countries.inside(this.area)).each(function(c) {
            var v = new CountryView({country: c});
            self.country_views.push(v);
            self.el.append(v.render().el);
        });
        return this;
      }

    });

    var Search = Backbone.View.extend({
      initialize: function() {
        _.bindAll(this, 'render');
        this.countries = this.options.countries;
        this.countries.bind('reset', this.render);
        this.el.autocomplete({
            source: [],
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
        var self = this;

        // data
        var countries = new app.Countries();

        // bubble map
        var bubbleMap = new app.MainMap(countries);

        this.slider = new Slider({el: $(".slider")});

        // search widget
        var search = new Search({
          el: $('#autocomplete'),
          countries: countries
        });

        this.slider.bind('change', function(month) {
            bubbleMap.set_time(month);
        });

        // the 3 country lists
        var views = [
          {
            el: $('#south_america'),
            area: 'South America',
            countries: countries
          },
          {
            el: $('#middle_america'),
            area: 'Central America',
            countries: countries
          },
          {
            el: $('#south_east_asia'),
            area: 'Southern Asia',
            countries: countries
          }
        ];
        _(views).each(function(v) {
            var view = new CountriesView(v);
            self.slider.bind('change', view.set_time);
        });

        //get data
        countries.fetch();
      }

    });
}

