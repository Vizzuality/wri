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
            var percent =  this.country.def_percent_in_month(month);
            this.$('span').css({width: percent+ '%'});
            if(Math.abs(percent - this.old_percent) > 0.1) {
                this.$('span').addClass('growing');
                this.remove_growing();
            }
            this.old_percent = percent;
        },

        render: function() {
          $(this.el).append(this.template.format(this.country.slug(), this.country.get('name_engli')));
          this.set_time(0);
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



    /*
     * main controller for home page
     */
    app.WRIHome = Class.extend({

      run: function() {
        var self = this;

        // data
        var countries = new app.Countries();
        var stories = new app.Stories();

        // bubble map
        var bubbleMap = new app.MainMap(countries);

        this.slider = new Slider({el: $(".slider")});

        // search widget
        var search = new app.Search({
          el: $('#autocomplete'),
          countries: countries
        });

        var stories_dropdown = new app.StoryListView({
            el: $('span.select'),
            stories: stories
        });

        this.slider.bind('change', bubbleMap.set_time);
        this.slider.bind('change', search.set_time);

        stories.bind('reset', function() {
            _(stories.random(2)).each(function(s) {
                $('#featured_stories').append(new app.StoryView({model: s}).render().el);
            });
        });

        // the 3 country lists
        var views = [
          {
            el: $('#south_america'),
            area: 'South America',
            countries: countries
          },
          {
            el: $('#africa'),
            area: ['Eastern Africa', 'Western Africa', 'Middle Africa'],
            countries: countries
          },
          {
            el: $('#south_east_asia'),
            area: ['Southern Asia','South-Eastern Asia'],
            countries: countries
          }
        ];
        _(views).each(function(v) {
            var view = new CountriesView(v);
            self.slider.bind('change', view.set_time);
        });

        //get data
        countries.fetch();
        stories.fetch();
        countries.bind('reset', function() {
            this.slider.set_time(0);
        }, this);

      }


    });
}

