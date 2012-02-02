
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
            _.bindAll(this, 'render', 'set_time', 'update');
            this.month = 0;
            this.countries = countries;
            this.countries.bind('reset', this.render);
          },

          // convert deforestation related value 
          // to bubble size.
          // this is an artifact to improve visualization
          def_to_size: function(def) {
                return 15 + Math.pow(def, 0.3)*3;
          },

          update: function() {
            var self = this;
            var all = self.countries_data;
            var abs = Math.abs;
            var month = self.month;
            var delta = 0.05;
            var node = this.svg.selectAll("g.node")
                .attr("transform", function(p) { 
                    var pos = p.pos;
                    var r =  self.def_to_size(p.time_series_deltas()[month]);
                    var forces = false;
                    //adjust pos with the rest of balls 
                    //using very basic constrait
                    for(var i=0, l = all.length; i<l; ++i) {
                        var c = all[i];
                        if(p.cid !== c.cid) {
                            //distance
                            var other_pos = c.pos;
                            var dx = pos[0] - other_pos[0];
                            var dy = pos[1] - other_pos[1];
                            var len = Math.sqrt(dx*dx + dy*dy);
                            var r_other =  self.def_to_size(c.time_series_deltas()[month]);
                            var desired_len = r + r_other + 2;//5 pixels distance
                            var diff = (len - desired_len)/len;
                            if(len <= desired_len) {
                                //move each other depending on the "mass" 
                                //of the system
                                var f1 = r/desired_len;
                                var f2 = r_other/desired_len;
                                pos[0] -= delta*f2*diff*dx;
                                pos[1] -= delta*f2*diff*dy;
                                other_pos[0] += delta*f1*diff*dx;
                                other_pos[1] += delta*f1*diff*dy;
                                forces = true;
                            }
                        }

                    }
                    // if no force applied return to the original point
                    if(!forces) {
                        var original = merc(p.center());
                        pos[0] += (original[0] - pos[0])*2*delta;
                        pos[1] += (original[1] - pos[1])*2*delta;
                    }

                    return "translate(" + pos.join(',') + ")"; 
                });
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
                .transition()
                .duration(100)
                .attr("r", function(d) {
                        return self.def_to_size(d.time_series_deltas()[month]);
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

            this.countries_data = countries.filter(
                    function(d) { return d.get('cumm'); }
            );

            this.svg = svg;
            var node = svg.selectAll("g.node")
                .data(this.countries_data)
                .enter()
                .append("g")
                .attr("class", "node")
                .attr("transform", function(p) { 
                    var ll = p.center();
                    var pos = merc(ll);
                    p.pos = pos;
                    return "translate(" + pos.join(',') + ")"; 
                });

            node.append("circle")
                .attr("r", function(d) {
                        return self.def_to_size(d.time_series_deltas()[self.month]);
                });

            node.append('a')
                    .attr('xlink:href', function(d) {
                        return "/country#" + d.slug();
                    })
                .append("text")
                .attr("text-anchor", "middle")
                .text(function(d) {
                    return d.get('name_engli');
                });

            node.append("text")
                .attr("text-anchor", "middle")
                .attr('class', 'small')
                .attr("transform", 'translate (0, 14)')
                .text(function(d) {
                    return "123123 events";
                });

            setInterval(this.update, 30);



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
                                return self.def_to_size(d.time_series_deltas()[self.month]);
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

