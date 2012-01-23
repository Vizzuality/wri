
var url = "http://forma-vis.s3-website-us-east-1.amazonaws.com/forma_low_zoom/";
var DeforesationLayer = {
    threshold: 0,
    maxAlpha: 0.11,
    radius: 10,
    alphaLow: 30,
    alphaThreshold: 200,

    tileSize: 256,

    getImageData: function(img) {
        var canvas = document.createElement('canvas');
        canvas.width = DeforesationLayer.tileSize;
        canvas.height = DeforesationLayer.tileSize;
        //document.body.appendChild(canvas);
        var ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        return ctx.getImageData(0, 0, canvas.width, canvas.height);
    },

    renderTile: function(ctx, tile, zoom, x, y) {
        if (!tile.img) {
            var img = new Image();
            img.onload = function() {
                tile.loaded = true;
                tile.data = DeforesationLayer.getImageData(img);
            };
            var bound = 1 << zoom;
            var yVal = (bound - tile.y - 1);
            img.src = url + zoom + "/" + tile.x + "/" + yVal + ".png";
            tile.img = img;
        }
        if(tile.loaded) {
            //ctx.drawImage(tile.img, x, y);
            DeforesationLayer.renderVis(ctx, x, y, tile.data.data);
        }
    },

    draw_circle: function(ctx, xo, yo, r, alpha, c) {
        var x = xo - r;
        var y = yo - r;
        var rgr = ctx.createRadialGradient(xo, yo, 0 , xo, yo, r);
        rgr.addColorStop(0, 'rgba(0,0,0,' + alpha + ')');
        rgr.addColorStop(1, 'rgba(0,0,0,0)');
        if(c) {
            ctx.fillStyle = rgr;
        } else {
            ctx.fillStyle = 'rgba(0,0,0,' + alpha + ')';
        }

        var d = r*2;

        ctx.fillRect(x, y, d, d);
    },

    renderVis: function(ctx, x, y, pixels) {
        //ctx.globalCompositeOperation = 'darker';
        var self = DeforesationLayer;
        var i,j, pixel_pos;
        var s = 256;
        var th = self.threshold;
        var alpha = self.maxAlpha;
        var radius = self.radius; 
        for(i=0; i < s; i+=4) {
            for(j=0; j < s; j+=4) {
                 pixel_pos = (j*s + i) * 4;
                 if (pixels[pixel_pos+3] !== 0 &&
                     pixels[pixel_pos+2] !== 0) {
                     d = th - pixels[pixel_pos + 2];
                     if(d > 0) {
                         var a = self.maxAlpha*Math.min(10, d)/3.0;
                         DeforesationLayer.draw_circle(ctx, x + i, y + j, radius, a,  true);
                         //self.ctx.fillRect(i*4, j*4, 4, 4);
                     }
                 }
            }
        }
    },

    postProcess: function(canvas, ctx) {
        var self = DeforesationLayer;
        var pixel_pos;
        var backBuffer = ctx.getImageData(0, 0, canvas.width, canvas.height);
        var pixels = backBuffer.data;
        var w = canvas.width;
        var alphaLow = self.alphaLow;
        var alphaThreshold = self.alphaThreshold;
        var i, j, d, a;
        for(i=0; i < w; ++i) {
            for(j=0; j < canvas.height; ++j) {
                 pixel_pos = (j*w + i) * 4;
                 a = pixels[pixel_pos + 3];
                 if(a > 0 && a < alphaThreshold) {
                     if( alphaLow < a) {
                         pixels[pixel_pos+0] = 0;
                         pixels[pixel_pos+1] = 0;
                         pixels[pixel_pos+2] = 0;
                         pixels[pixel_pos+3] = 255;
                     } else {
                         var x = (a - alphaLow/2);
                         d = -(x*x) + 155;
                         pixels[pixel_pos+0] = 255
                         pixels[pixel_pos+1] = 255;
                         pixels[pixel_pos+2] = 255;
                         pixels[pixel_pos+3] = d>>0;
                     }
                 } else {
                         /*pixels[pixel_pos+0] = 0;
                         pixels[pixel_pos+1] = 0;
                         pixels[pixel_pos+2] = 0;
                         pixels[pixel_pos+3] = 120;
                         */
                 }

            }
        }
        ctx.putImageData(backBuffer,0, 0);
    }

};
