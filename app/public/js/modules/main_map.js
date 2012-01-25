
/**
 * bubbels map
 */
App.modules.MainMap = function(app) {
        var CARTODB= 'https://wri-01.cartodb.com/api/v1/sql?q=SELECT ST_Centroid(the_geom) as the_geom, name_engli, random() as deforest FROM gadm0_simple where forma = true&format=geojson';

        app.MainMap = function() {

              var w = 1260,
                  h = 768;
                 merc = d3.geo.mercator()
                    .scale(1027)
                    .translate([w>>1,h>>1]);


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

            d3.json(encodeURI(CARTODB), function(countries) {
                /*d3.select('body')
                    .data(countries.features)
                    .enter()
                    .append('p')
                    .text(function(data) {
                        return data.properties.name_engli + data.geometry.coordinates
                    });*/

                var min_distance = Math.sqrt(get_min_distance(countries.features));
                var r = min_distance/2;

                var svg = d3.select(".buble_map").append("svg:svg")
                   .attr("width",  w)
                   .attr("height", h);

                var node = svg.selectAll("g.node")
                    .data(countries.features)
                    .enter().append("g")
                    .attr("class", "node")
                    .attr("transform", function(p) { 
                        var ll = p.geometry.coordinates;
                        return "translate(" + merc(ll).join(',') + ")"; 
                    });
                node.append("circle")
                    .attr("r", function(d) {
                            return d.properties.deforest*30;
                    });

                node.append("text")
                    .attr("text-anchor", "middle")
                    .text(function(d) {
                        return d.properties.name_engli;
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
                        var ll = data.geometry.coordinates;
                        var t = "translate(" + merc(ll).join(',') + ") scale(3, 3)";
                        d3.select(this)
                            .transition()
                            .attr('transform', t)
                            .selectAll('text')
                                .transition()
                                .delay(100)
                                .style('opacity', 1.0);
                    })
                    .on('mouseout', function(data, i) {
                        var ll = data.geometry.coordinates;
                        var t = "translate(" + merc(ll).join(',') + ") scale(1, 1)";
                        d3.select(this)
                            .transition()
                            .attr('transform', t)
                            .selectAll('text')
                                .transition()
                                .delay(0.2)
                                .style('opacity', 0.0);
                    });

            });
        }
}

