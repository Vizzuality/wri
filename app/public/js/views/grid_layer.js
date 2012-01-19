/*
 ====================
 this class renders deforestation data in a given time
 ====================
*/

function TimePlayer() {
    this.time = 0;
    this.canvas_setup = this.get_time_data;
    this.render = this.render_time;
    this.cells = [];
    this.base_url = 'http://wri-01.cartodb.com/api/v2/sql';
}

TimePlayer.prototype = new CanvasTileLayer();

TimePlayer.prototype.set_time = function(t) {
    console.log(t);
    this.time = t;
    this.redraw();
};

TimePlayer.prototype.sql = function(sql, callback) {
    var self = this;
    $.getJSON(this.base_url  + "?q=" + encodeURIComponent(sql) ,function(data){
        callback(data);
    });
}

TimePlayer.prototype.pre_cache_months = function(rows) {
    var row;
    var cells = [];
    for(var i in rows) {
      row = rows[i];
      cells[i] = {
        x: row.upper_left_x,
        y: row.upper_left_y,
        months: row.cummulative
      }
    }
    return cells;
}

// get time data in json format
TimePlayer.prototype.get_time_data = function(tile, coord, zoom) {
    var self = this;

    var projection = new MercatorProjection();
    var bbox = projection.tileBBox(coord.x, coord.y, zoom);
    var sql = "SELECT upper_left_x, upper_left_y, cell_width, cell_height, pixels, total_incr as events, cummulative, boxpoly, the_geom_webmercator FROM griddify_results"

    sql += " WHERE the_geom && ST_SetSRID(ST_MakeBox2D(";
    sql += "ST_Point(" + bbox[0].lng() + "," + bbox[0].lat() +"),";
    sql += "ST_Point(" + bbox[1].lng() + "," + bbox[1].lat() +")), 4326)";

    this.sql(sql, function(data) {
        tile.cells = self.pre_cache_months(data.rows);
    });
}


var originShift = 2 * Math.PI* 6378137 / 2.0;
function meterToPixels(mx, my, zoom) {
  var initialResolution = 2 * Math.PI * 6378137 / 256.0;
  var res = initialResolution / (1 << zoom)
  px = (mx + originShift) / res
  py = (my + originShift) / res
  return [px, py];
}


TimePlayer.prototype.render_time = function(tile, coord, zoom) {
    var projection = new MercatorProjection();
    var month = this.time>>0;
    var w = tile.canvas.width;
    var h = tile.canvas.height;
    var ctx = tile.ctx;
    var data, i, j, x, y, def;

    var cells = tile.cells;
    if(!cells) return;
    var cell;
    var point;
    var x, y;

    // clear canvas
    tile.canvas.width = w;

    ctx.fillStyle = "#000";
    // render cells
    for(i=0; i < cells.length; ++i) {
      cell = cells[i];

      //transform to local tile x/y
      //TODO: precache this
      point = projection.tilePoint(coord.x, coord.y, zoom);
      pixels = meterToPixels(cell.x, cell.y, zoom);
      pixels[1] = (256 << zoom) - pixels[1];
      x = pixels[0] - point[0];
      y = pixels[1] - point[1];

      //var c = (255.0*cell.months[month]/10)>>0;
      ctx.fillStyle = '#000';
      if(cell.months) {
        var c =  cell.months[month];
        var colors = [
            'rgba(255, 51, 51, 0.9)',
            'rgba(170, 52, 51, 0.6)',
            'rgba(104, 48, 59, 0.6)',
            'rgba(84, 48, 59, 0.6)'
        ]
        if (c == 0) continue;
        var idx = 0;
        if(c < 10) idx = 0;
        if(c < 7.5) idx = 1
        if(c < 5) idx = 2;
        if(c < 2.5) idx = 3;
        ctx.fillStyle = colors[idx];//"rgb(" + c + ",0, 0)";
      }
      // render
      ctx.fillRect(x, y, 6, 6);
    }
};

