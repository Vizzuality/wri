/*
 ====================
 this class renders deforestation data in a given time
 ====================
*/

function TimePlayer(table) {
    this.time = 0;
    this.canvas_setup = this.get_time_data;
    this.render = this.render_time;
    this.cells = [];
    this.table = table;
    this.base_url = 'http://sql.wri-01.cartodb.com/api/v2/sql';
}

TimePlayer.prototype = new CanvasTileLayer();

TimePlayer.prototype.set_time = function(t) {
    this.time = t;
    this.redraw();
};

TimePlayer.prototype.set_table = function(table, size) {
  if(this.table === table) return;
  this.table = table;
  this.pixel_size = size;
  this.recreate();
  this.redraw();
};

TimePlayer.prototype.set_country_iso = function(country) {
  this.country = country;
  this.recreate();
  this.redraw();
}

TimePlayer.prototype.sql = function(sql, callback) {
    var self = this;
    $.getJSON(this.base_url  + "?q=" + encodeURIComponent(sql) ,function(data){
        callback(data);
    });
}

TimePlayer.prototype.pre_cache_months = function(rows) {
    var row;
    var cells = [];
    var d;
    for(var i in rows) {
      row = rows[i];
      // filter the spikes in deforestation change


      var acumm_normalized = [];
      var cumm = row.cummulative;
      var max = this.pixel_size*this.pixel_size;
      var max_p = max >>4;

      for(d = 0, l = cumm.length; d < l; ++d) {
          //acumm_normalized[d] = (4*((cumm[d] - cumm[0])/(max - cumm[0]))) >> 0;
          if((cumm[d] - cumm[0]) > max_p) {
            acumm_normalized[d] = 1 + ((3*((cumm[d] - cumm[0])/(max - cumm[0]))) >> 0);
          } else {
            acumm_normalized[d] = 0;
          }
      }

      // steps!
      var def = row.time_series;
      var steps = row.time_series;
      var last = -10;

      steps[0] = 0;
      steps[1] = 0;
      for(d = 2; d < def.length; ++d) {
        if(def[d] > 0) {
          last = d;
        }
        steps[d] = 0;
        if(acumm_normalized[d] > 0) {
            steps[d] = Math.max(0, 3 - (d - last));
        }
      }

      //var buffer = new ArrayBuffer(row.);

      cells[i] = {
        x: row.upper_left_x,
        y: row.upper_left_y,
        w: row.cell_width,
        h: row.cell_width,
        months_accum: acumm_normalized,//row.cummulative,
        months: row.time_series
      }
    }
    return cells;
}

// get time data in json format
TimePlayer.prototype.get_time_data = function(tile, coord, zoom) {
    var self = this;

    if(!self.table || !self.country)  {
        return;
    }

    var projection = new MercatorProjection();
    var bbox = projection.tileBBox(coord.x, coord.y, zoom);
    //TODO: remove not used
    var sql = "SELECT upper_left_x, upper_left_y, cell_width, cummulative, time_series FROM " + this.table;

    // inside the country
    sql += " WHERE iso = '{0}'".format(self.country);
    // get cells only tile bounding box
    sql += " AND {0}.the_geom && ST_SetSRID(ST_MakeBox2D(".format(self.table);
    sql += "ST_Point(" + bbox[0].lng() + "," + bbox[0].lat() +"),";
    sql += "ST_Point(" + bbox[1].lng() + "," + bbox[1].lat() +")), 4326)";

    // and inside the country
    //sql += " AND ST_Intersects(gadm0_simple.the_geom, {0}.the_geom)".format(self.table);

    this.sql(sql, function(data) {
        tile.cells = self.pre_cache_months(data.rows);
        self.redraw_tile(tile);
    });
}


var originShift = 2 * Math.PI* 6378137 / 2.0;
var initialResolution = 2 * Math.PI * 6378137 / 256.0;

function meterToPixels(mx, my, zoom) {
  var res = initialResolution / (1 << zoom);
  var px = (mx + originShift) / res;
  var py = (my + originShift) / res;
  return [px, py];
}

function meterToPixelsDist(mx, my, zoom) {
  var res = initialResolution / (1 << zoom);
  var px = (mx) / res;
  var py = (my) / res;
  return [px, py];
}


TimePlayer.prototype.render_time = function(tile, coord, zoom) {
    var projection = new MercatorProjection();
    var month = 1 + this.time>>0;
    var w = tile.canvas.width;
    var h = tile.canvas.height;
    var ctx = tile.ctx;
    var data, i, j, x, y, def, size;

    var total_pixels = 256 << zoom;

    var cells = tile.cells;
    if(!cells || cells.length === 0) {
      return;
    }
    var cell;
    var point;
    var x, y;

    // clear canvas
    tile.canvas.width = w;

    ctx.fillStyle = "#000";
    point = projection.tilePoint(coord.x, coord.y, zoom);

    var colors = [
        'rgba(84, 48, 59, 0.6)',
        'rgba(104, 48, 59, 0.6)',
        'rgba(170, 52, 51, 0.6)',
        'rgba(255, 51, 51, 0.9)'
    ];

    var extra = 0;
    var fillStyle;
    size = meterToPixelsDist(cells[0].w, cells[0].w, zoom);

    // render cells
    for(i = 0; i < cells.length; ++i) {

      cell = cells[i];
      extra = 0;

      //transform to local tile x/y
      pixels = meterToPixels(cell.x, cell.y, zoom);
      pixels[1] = total_pixels - pixels[1];
      x = pixels[0] - point[0];
      y = pixels[1] - point[1];

      //fillStyle = 'rgba(84, 48, 59, 0.6)';
      fillStyle = 'rgba(255, 255, 255, 1.0)';
      if(cell.months) {
        var delta =  cell.months[month];
        var a =  cell.months_accum[month];

        // when is totally red draw the pixel a little bit big
        if(delta === 3) {
          extra = 1;
        }

        //no deforestation already
        if(a === 0) {
          continue; //LO-VE-LY
        } else {
          fillStyle = colors[Math.max(0, Math.min(3, a + delta))];
        }
      }
      // render
      var s = size[0] >> 0;
      s+=extra;
      ctx.fillStyle = fillStyle;
      ctx.fillRect(x, y, s, s);
    }
};

