

function CanvasOverlay(map){
    var self = this;
    this.bounds = null;
    this.projection = new MercatorProjection();
    self.setMap(map);
}

CanvasOverlay.prototype = new google.maps.OverlayView();

/**
 * set new bounds for canvas element
 */
CanvasOverlay.prototype.setBounds = function(x, y, w, h) {
    var style = this.el.style;
    var canvas = this.canvas;

    style.left = x + 'px';
    style.top = y + 'px';
    style.width = w + "px";
    style.height = h + "px";
    canvas.width = w;
    canvas.height = h;
    this.width = w;
    this.height = h;
}

CanvasOverlay.prototype.onAdd = function() {
    var self = this;
    var panes = this.getPanes(),
        w = this.getMap().getDiv().clientWidth,
        h = this.getMap().getDiv().clientHeight,
    el = document.createElement("div");

    this.el = el;

    el.style.position = "absolute";
    el.style.border = 0;

    // canvas
    var canvas = this.canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = w;
    el.appendChild(canvas);

    this.setBounds(0, 0, w, h);

    panes.overlayLayer.appendChild(el);
    this.ctx = this.canvas.getContext('2d');

    google.maps.event.addListener(this.getMap(), 'bounds_changed', function() { self.draw(); });
}


CanvasOverlay.prototype.render = function() { }


CanvasOverlay.prototype.draw = function() {
     var projection = this.getProjection();
     var currentBounds = this.map.getBounds();

     if (currentBounds.equals(this.bounds)) {
        //bounds didnt changed
        return;
     }
     this.bounds = currentBounds;

     // the map has moved, relocate canvas in the correct place
    var ne = projection.fromLatLngToDivPixel(currentBounds.getNorthEast()),
        sw = projection.fromLatLngToDivPixel(currentBounds.getSouthWest()),
        topY = ne.y,
        leftX = sw.x,
        h = sw.y - ne.y,
        w = ne.x - sw.x;
    this.setBounds(leftX, topY, w, h);
    this.render();

    //this.ctx.fillRect(0, 0, 200, 200);
}


function CanvasTileOverlay(map, layer) {
    var self = this;
    CanvasOverlay.call(this, map);
    this.layer = layer;
    this.tiles = {};
    google.maps.event.addListener(this.getMap(), 'bounds_changed', function() { self.bounds_changed(); });
    google.maps.event.addListener(this.getMap(), 'zoom_changed', function() { self.bounds_changed(); });
}

CanvasTileOverlay.prototype = new CanvasOverlay();

CanvasTileOverlay.prototype.bounds_changed = function() {
    var canvas = this.canvas;
    var bounds = this.bounds;
    var new_tiles = this.tilesInBounds(bounds, this.layer.tileSize, canvas.width, canvas.height);
    //todo: manage tiles outside
    this.tiles = new_tiles;
}

CanvasTileOverlay.prototype.tilesInBounds = function(bounds, tileSize, width, height) {
    var ne = bounds.getNorthEast();
    var sw = bounds.getSouthWest();
    var ll = new google.maps.LatLng(ne.lat(), sw.lng());
    var zoom = this.map.getZoom();
    var originTile = this.projection.latLngToTile(ll, this.map.getZoom());
    var tileOffsetPixel = this.projection.latLngToTilePoint(ll, originTile.x, originTile.y, zoom);

    var num_tiles_x = Math.ceil((tileOffsetPixel.x + width)/tileSize);
    var num_tiles_y = Math.ceil((tileOffsetPixel.y + height)/tileSize);

    var tiles = [];
    for(var i = 0; i < num_tiles_x; ++i) {
        for(var j = 0; j < num_tiles_y; ++j) {
            var tile_x = originTile.x + i;
            var tile_y = originTile.y + j;
            tiles.push({
                x: tile_x,
                y: tile_y
            });
        }
    }
    console.log(tiles.length);
    return tiles;

};

CanvasTileOverlay.prototype.render = function() {
    var tile, x, y;
    var layer = this.layer;
    var ctx = this.ctx;
    var bounds = this.bounds;
    var projection = this.projection;
    var ne = bounds.getNorthEast();
    var sw = bounds.getSouthWest();
    var zoom = this.map.getZoom();

    var ll = new google.maps.LatLng(ne.lat(), sw.lng());
    var tileOrigin = projection.latLngToTile(ll, zoom);
    var tileOffsetPixel = projection.latLngToTilePoint(ll, tileOrigin.x, tileOrigin.y, zoom);
    /*
    var originTile = this.latLngToTile(ll, this.map.getZoom());

    var numTiles = 1 << this.map.getZoom();
    var worldCoordinate = projection.fromLatLngToPoint(ll);
    var pixelCoordinate = new google.maps.Point(
            worldCoordinate.x * numTiles,
            worldCoordinate.y * numTiles
    );

    var tile_x = originTile.x*layer.tileSize;
    var tile_y = originTile.y*layer.tileSize;
    var ox = pixelCoordinate.x - tile_x;
    var oy = pixelCoordinate.y - tile_y;
    */

    for(var t in this.tiles) {
        tile = this.tiles[t];
        // get the tile canvas position
        x = layer.tileSize*(tile.x - tileOrigin.x);
        y = layer.tileSize*(tile.y - tileOrigin.y);
        layer.renderTile(ctx, x - tileOffsetPixel.x, y - tileOffsetPixel.y);
    }

};


