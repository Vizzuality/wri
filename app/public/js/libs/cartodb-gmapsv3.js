var CartoDBLayer = function(user_name, query, table, style) {
  this.user_name = user_name;
  this.query = query || 'select * from ' + table
  this.table = table;
  this.name = table;
  this.style = style;
  this.showing = true;
  this.editable = true;
  this.create_layer();
}

CartoDBLayer.prototype.create_layer = function() {
  var self = this;
  var d = {
    tiles: {},
    getTile: function(coord, zoom) {
        var img = new Image();
        var url = 'http://' + self.user_name + '.cartodb.com/tiles/' + self.table + '/'+ zoom +'/'+ coord.x +'/'+coord.y+'.png?sql=' + self.query
        if(self.style) {
            url += "&style=" + encodeURIComponent(self.style.replace('\n',''));
        }
        img.src = url;
        var tile_id = coord.x + '_' + coord.y + '_' + zoom;
        img.setAttribute('id', tile_id);
        this.tiles[tile_id] = img;
        return img;
    },
    releaseTile: function(tile) {
        var id = tile.getAttribute('id');
        delete this.tiles[id];
    },
    show: function(s) {
        for(var t in this.tiles) {
            this.tiles[t].style.display = s?'block': 'none';
        }
        self.showing = s;
    },
    tileSize: new google.maps.Size(256, 256),
    name: this.query,
    description: false
  }
  this.layer = d;
}

CartoDBLayer.prototype.show = function(s) {
    this.layer.show(s);
}
CartoDBLayer.prototype.update_sql = function(sql) {
    this.query = sql;
}
CartoDBLayer.prototype.update = CartoDBLayer.prototype.update_sql
