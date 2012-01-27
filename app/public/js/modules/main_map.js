
/**
 * bubbels map
 */
App.modules.MainMap = function(app) {

        var w = 1100,
            h = 768;
            merc = d3.geo.mercator()
                .scale(1027)
                //this value is calculated using the eye, HAHAHA
                .translate([(w>>1)- 50,(h>>2) - 60]);

        var MainMap = Class.extend({

          init: function(countries) {
            _.bindAll(this, 'render');
            this.month = 0;
            this.countries = countries;
            this.countries.bind('reset', this.render);
          },

          // convert deforestation related value 
          // to bubble size.
          // this is an artifact to improve visualization
          def_to_size: function(def) {
                return Math.sqrt(def)*0.1;
          },

          set_time: function(month) {
            var self = this;
            var countries = this.countries;
            this.month = month;
            // animate
            var node = this.svg
                .selectAll("g.node")
                .select("circle")
                /*.data(countries.filter(
                    function(d) { return d.get('cumm'); }
                ))*/
                //.transition()
                //.duration(30)
                .attr("r", function(d) {
                        return self.def_to_size(d.time_series()[month]);
                });
          },

          render: function() { 
            var self = this;
            //var min_distance = Math.sqrt(get_min_distance(countries.features));
            //var r = min_distance/2;
            var countries = this.countries;
            var svg = d3.select(".bubble_map").append("svg:svg")
               .attr("width",  w)
               .attr("height", h);

            this.svg = svg;
            var node = svg.selectAll("g.node")
                .data(countries.filter(
                    function(d) { return d.get('cumm'); }
                ))
                .enter()
                .append("g")
                .attr("class", "node")
                .attr("transform", function(p) { 
                    var ll = p.center();
                    return "translate(" + merc(ll).join(',') + ")"; 
                });

            node.append("circle")
                .attr("r", function(d) {
                        return self.def_to_size(d.time_series()[self.month]);
                });

            node.append('a')
                    .attr('xlink:href', function(d) {
                        return "/#" + d.slug();
                    })
                .append("text")
                .attr("text-anchor", "middle")
                .text(function(d) {
                    return d.get('name_engli');
                });

            node.append("text")
                .attr("text-anchor", "middle")
                .attr('class', 'small')
                .attr("transform", 'translate (0, 10)')
                .text(function(d) {
                    return "123123 events";
                });



            svg.selectAll('g.node')
                .on('mouseover', function(data, i) {
                    var ll = data.center();
                    //var t = "translate(" + merc(ll).join(',') + ") scale(3, 3)";
                    var node = d3.select(this);
                    //move node to the back to be rendered first
                    svg.selectAll('g.node').sort(function(a, b) {
                        if (a.cid == data.cid)
                            return 1;
                        else if(b.cid == data.cid)
                            return -1;
                        return 0;

                    });

                    d3.select(this)
                        .transition()
                        //.attr('transform', t)
                        .select('circle')
                            .attr('r', 100);

                    d3.select(this)
                        .selectAll('text')
                            .transition()
                            .delay(100)
                            .style('opacity', 1.0);

                })
                .on('mouseout', function(data, i) {
                    d3.select(this)
                        .transition()
                        //.attr('transform', t)
                        .select('circle')
                            .attr('r', function(d) {
                                return self.def_to_size(d.time_series()[self.month]);
                            });

                    d3.select(this)
                        .selectAll('text')
                            .transition()
                            .delay(100)
                            .style('opacity', 0.0);

                });
          }
        });

        _.extend(MainMap.prototype, Backbone.Event);
        app.MainMap = MainMap;


        /*

            var get_min_distance = function(countries) {
                var min_distance = 1000000;
                for(var i = 0, l = countries.length; i < l-1; ++i) {
                    for(var j = i + 1; j < l; ++j) {
                        var p1 = merc(countries[i].geometry.coordinates);
                        var p2 = merc(countries[j].geometry.coordinates);
                        var dx = p1[0] - p2[0];
                        var dy = p1[1] - p2[1];
                        min_distance = Math.min(min_distance, dx*dx + dy*dy);
                    }
                }
                return min_distance;
            }
            */

}

