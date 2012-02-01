/*
 ===============================================
 main enter point
 ===============================================
*/

App.modules.WRI= function(app) {

   // app router
   var Router = Backbone.Router.extend({
      routes: {
        ":country": "country",
        ":country/s/*state": "country"
      },

      country: function(country, state) {
        app.Log.log("route: country" + country + " " + state);
      }

    });

    function template(s,d){
     for(var p in d)
       s=s.replace(new RegExp('{'+p+'}','g'), d[p]);
     return s;
    }

   var CountryPanel = Backbone.View.extend({
       START:  new Date(2006, 0, 1),
       MONTHS: [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ],
       

       initialize: function() {
           this.template = this.el.html();
           this.model.bind('change', this.render, this);
           this.stories = this.options.stories;
           this.time = 0;
       },

       set_time: function(t) {
           this.time = t;
           this.graph.set_time(t);
           this.set_headlines();
       },

       month_to_date: function(month) {
          var months = month % 12;
          var years = (month/12)>>0;
          return new Date(this.START.getFullYear() + years, this.START.getMonth() + months, 1);
       },

       set_headlines: function() {
           var six = 100*this.model.change_since(this.time - 6, this.time);
           var last = 100*this.model.change_since(this.time - 1, this.time);
           var stat = {
               '.inc_last_six_months': six.toFixed(0),
               '.inc_last_month': last.toFixed(0)
           };
           _(stat).each(function(percent, el) {
                this.$(el).html(percent);
                if(percent > 3) {
                    this.$(el + "_percent")
                        .removeClass('green')
                        .addClass('red');
                } else {
                    this.$(el + "_percent")
                        .addClass('green')
                        .removeClass('red');
                }
           });
           var d = this.month_to_date(this.time);
           this.$('.inc_date').html(
                this.MONTHS[d.getMonth()] + " " +
                d.getFullYear()
           );
       },

       render: function() {
           var self = this;
           var m = this.model;

           var html = template(this.template, {
               country: m.get('name_engli'),
               description: m.get('description')
           });

           this.el.fadeOut(300, function() {
             self.el.html(html);
             self.graph = new Graph({el: self.$('#graph')});
             self.graph.set_country(self.model);

             self.$('.stories').append(
                new app.StoryView({
                    model: self.stories.random(1)[0]
                }).render().el
             );
             self.el.fadeIn();
           });
       }

   });

   // dropdown
   var CountriesListView = Backbone.View.extend({

    initialize: function() {
        this.countries = this.options.countries;
        this.country = this.options.country;
        this.countries.bind('reset',function() {
            if(this.continent) {
                this.render();
            }
        }, this);
        this.country.bind('change', function() {
            this.continent = this.country.get('unregion1');
            if(this.countries.models.length > 0)
                this.render();
        }, this);
        this.el.dropdown({source: []});
    },

    render: function() {
        var st = _(this.countries.inside(this.continent)).map(function(s) {
            return {
              name: s.get('name_engli'),
              url: '/country#' + s.get('name_engli')
            };
        });
        this.el.dropdown('update', st);
        this.$('.init').html(this.continent);
    }

   });


    // the app
    app.WRI = Class.extend({

        init: function() {
            _.bindAll(this, 'on_route');
            $('body').css({'overflow-x': 'hidden', 'overflow-y': 'auto'});
            $('html').css({'overflow-x': 'hidden'});
        },

        run: function() {
            _.bindAll(this, 'on_route_to', '_state_url', 'set_state');
            var self = this;

            // set a global bus
            this.bus = new app.Bus();
            app.bus = this.bus;

            // models
            this.stories = new app.Stories();
            this.country = new app.Country({'name_engli': ''});
            this.countries = new app.Countries();

            // widgets
            var stories_dropdown = new app.StoryListView({
                el: $('#stories_drop'),
                stories: this.stories
            });

            var countries_dropdown = new CountriesListView({
                el: $('#continent_drop'),
                countries: this.countries,
                country: this.country
            });

            var search = new app.Search({
              el: $('#autocomplete'),
              countries: this.countries
            });

            // change the next/prev country buttons
            // when country is selected and country list
            // are ready
            var f = _.after(2, function() {
                var next_prev = self.countries.next_country(self.country.get('name_engli'));
                if(next_prev) {
                    var prev = next_prev[0];
                    var next = next_prev[1];
                    $('.pag.left').attr('href', 'country#' + prev.get('name_engli'))
                        .animate({'left': 0});
                    $('.pag.right').attr('href', 'country#' + next.get('name_engli'))
                        .animate({'right': 0});
                } 
            });
            this.countries.bind('reset', f);
            this.country.bind('change', f);

            // fetch as soon as posible
            this.stories.fetch();
            this.countries.fetch();

            // the map
            this.map = new app.Map(this.bus);

            // init routing and app state
            this.router = new Router();
            this.router.bind('route:country', this.on_route);
            this.app_state = new app.State();
            this.app_state.set_router(this.router);
            this.state_url = _.debounce(this._state_url, 200);

            //info panel
            this.panel = new CountryPanel({
                el: $('#country_info'),
                model: this.country,
                stories: this.stories
            });

            this.state = [];
            this.level = 0;

            // slider
            this.slider = new Slider({el: $(".slider")});
            this.slider.bind('change', function(month) {
                // timestamp to month
                self.map.set_time(month);
                self.panel.set_time(month);
            });

            this.bus.on('app:route_to', this.on_route_to);

            this.map.map.bind('center_changed', this.state_url);
            this.map.map.bind('zoom_changed', this.state_url);
            this.map.show_controls(true);
            this.app_state.bind('change:map', this.set_state);


            // ready, luanch
            Backbone.history.start();

            //this.add_test_layer();
            //this.add_time_layer();
        },


        _state_url: function() {
            var self = this;
            var c = self.map.map.get_center();
            self.app_state.set({
                'map': {
                    center: {
                        lat: c.lat(),
                        lon: c.lng()
                    },
                    zoom: self.map.map.get_zoom()
                }
            });
            self.app_state.save();
        },

        set_state: function(state) {
          var self = this;
          var st = state.get('map');
          self.map.map.set_center(new google.maps.LatLng(st.center.lat,st.center.lon));
          self.map.map.set_zoom(st.zoom);
       },

       country_changed: function() {
            var self = this;
            var c = this.country;
            self.map.show_country(c.get('name_engli'), c.get('iso'));
       },

       move_map_to: function(c) {
            var self = this;
            self.map.center_map_on(c.get('bbox'));
            self.map.displace(255, 0);
       },

       on_route: function(country, state) {
            var self = this;

            var c = this.country;
            c.set({'name_engli': country}, {silent: true});
            if(state) {
                this.app_state.fetch(state);
            } else {
                c.unbind('change', this.move_map_to);
                c.bind('change', this.move_map_to, this);
            }
            c.unbind('change', this.country_changed);
            c.bind('change', this.country_changed, self);

            c.fetch();
        },

        on_route_to: function(route) {
            app.Log.debug("route => ", route);
            this.router.navigate(route, true);
        }

    });
};


