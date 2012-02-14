
/**
 * graph shown in the country page
 */
var Graph = Backbone.View.extend({
    initialize: function() {
      this.w = 500;
      this.h = 160;
      var vis = d3.select(this.el[0])
        .append("svg")
          .attr("width", this.w)
          .attr("height", this.h);
      this.vis = vis;
      this.month = 10;//TODO: change
    },

    set_country: function(c) {
      this.time_series = c.time_series_deltas();
      this.render();
    },

    date_range: function() {
        var start = new Date(2006, 0, 1).getTime();
        var d = new Date().getTime() - start;
        return (d/(3600*1000*24*30))>>0;
    },

    set_time: function(t) {
      var self = this;
      this.month = t;
      var data = this.time_series;
      var x = this.x_scale;
      var y = this.y_scale;

      //TODO: move marker
      this.vis.select('.time_line')
//        .transition()
        .attr("x1", x(this.month))
        .attr("y1", 0)
        .attr("x2", x(this.month))
        .attr("y2", -1* (this.h));

      this.vis.select('.time_circle')
        //.transition()
        .attr("cx", x(this.month))
        .attr("cy",  function(d) { return -1*y(data[self.month]); })
    },

    render: function() {
      var self = this;
      var data = this.time_series;
      this.vis.selectAll().remove();

      var g = this.vis.append("svg:g")
        .attr("transform", "translate(0, " + this.h + ")");

      var y = d3.scale.linear()
        .domain([0, d3.max(data)])
        .range([0, this.h - 30]);


      var x = d3.scale.linear()
          .domain([0, self.date_range()])
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
