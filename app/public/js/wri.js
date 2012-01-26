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

    var Graph = Backbone.View.extend({
        initialize: function() {
          this.w = 500;
          this.h = 200;
          var vis = d3.select(this.el[0])
            .append("svg")
              .attr("width", this.w)
              .attr("height", this.h);
          this.vis = vis;
          this.month = 10;//TODO: change
        },

        set_country: function(c) {
          this.time_series = c.time_series();
          this.render()
        },

        set_time: function(t) {
          var self = this;
          this.month = t;
          var data = this.time_series;
          var x = this.x_scale;
          var y = this.y_scale;

          //TODO: move marker
          this.vis.select('.time_line')
            .transition()
            .attr("x1", x(this.month))
            .attr("y1", 0)
            .attr("x2", x(this.month))
            .attr("y2", -1* (this.h));

          this.vis.select('.time_circle')
            .transition()
            .attr("cx", x(this.month))
            .attr("cy",  function(d) { return -1*y(data[self.month]); })
        },

        render: function() {
          var self = this;
          var data = this.time_series;
          this.vis.selectAll().remove();

          var g = this.vis.append("svg:g")
            .attr("transform", "translate(0, 300)");

          var y = d3.scale.linear()
            .domain([0, d3.max(data)])
            .range([0, this.h - 30]);


          var x = d3.scale.linear()
              .domain([0, data.length])
              .range([0,this.w]);
          this.x_scale = x;
          this.y_scale = y;


          var line = d3.svg.line()
            .x(function(d,i) { return x(i); })
            .y(function(d) { return -1 * y(d); });

          g.append("svg:path").attr("d", line(data))
              .style('stroke', '#FF2222')
              .style('fill', 'none')
              .style('stroke-width', 2);

          // time marker
          g.append("svg:line")
            .attr("class", "time_line")
            .style('stroke', '#FF2222')
            .style('stroke-dasharray', "5,5")
            .style('fill', 'none')
            .style('stroke-width', 1)
            .attr("x1", x(this.month))
            .attr("y1", 0)
            .attr("x2", x(this.month))
            .attr("y2", -1* (this.h));

          g.append("svg:circle")
            .attr('class', 'time_circle')
            .style('fill', '#FF2222')
            .attr("cx", x(this.month))
            .attr("cy",  function(d) { return -1*y(data[self.month]); })
            .attr("r", 3)
        }
    });

    /**
     * contry model from gadm0 table in cartodb
     */

    // the app
    app.WRI = Class.extend({

        init: function() {
            _.bindAll(this, 'on_route');
            $('html,body').css({overflow: 'hidden'});
        },

        run: function() {
            _.bindAll(this, 'on_route_to', '_state_url', 'set_state');
            var self = this;

            // set a global bus
            this.bus = new app.Bus();
            app.bus = this.bus;

            // the map
            this.map = new app.Map(this.bus);

            // init routing and app state
            this.router = new Router();
            this.router.bind('route:country', this.on_route);
            this.app_state = new app.State();
            this.app_state.set_router(this.router);
            this.state_url = _.debounce(this._state_url, 200);

            //graph
            this.graph = new Graph({el: $('#graph')});

            this.state = [];
            this.level = 0;

            // slider
            this.slider = new Slider({el: $(".slider")});
            this.slider.bind('change', function(v) {
                // timestamp to month
                var start = new Date(2006, 1, 1).getTime();
                var d = v - start;
                var months = d/(3600*1000*24*30);
                self.map.set_time(months>>0);
                self.graph.set_time(months>>0);
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

       on_route: function(country, state) {
            var self = this;

            if(state) {
                this.app_state.fetch(state);
            } else {
                var c = new app.Country({'name_engli': country});
                c.fetch();
                c.bind('change', function() {
                    self.map.center_map_on(c.get('bbox'));
                    self.graph.set_country(c);
                });
            }

            //TODO: make a method
            self.map.show_country(country);
        },

        on_route_to: function(route) {
            app.Log.debug("route => ", route);
            this.router.navigate(route, true);
        }

    });
};


