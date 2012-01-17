
function App() {
    this.canvas = null;
    this.ctx = null;
    this.threshold = 50;
    this.fadeDist = 1;
    this.radius = 10;
    this.alphaLow = 180;
    this.alphaHigh = 255;
    this.maxAlpha = 0.11;
    this.postProccess = true;
    this.circle = true;
}

function get_image_data(img, callback) {
    var image = new Image();
    image.src = img;
    image.onload = function() {
        var canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        //document.body.appendChild(canvas);
        var ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0);
        var data = ctx.getImageData(0, 0, canvas.width, canvas.height);
        callback(data);
    }
}



App.prototype.init = function() {
    var self = this;
    this.canvas = document.getElementById('c');
    this.canvas.width = 256*4;
    this.canvas.height = 256*4;
    this.ctx = this.canvas.getContext('2d');

    get_image_data('pico.png', function(data) {
        self.deforestation = data;
    });

    var range = document.getElementById('range');
    range.onchange = function(v) {
        self.threshold = parseInt(range.value, 10);
        self.render();
    }
};

function draw_circle(ctx, xo, yo, r, alpha, c) {
    var x = xo - r;
    var y = yo - r;
    var rgr = ctx.createRadialGradient(xo, yo, 0 , xo, yo, r);
    rgr.addColorStop(0, 'rgba(00,0,0,' + alpha + ')');
    rgr.addColorStop(1, 'rgba(0,0,0,0)');
    if(c) {
        ctx.fillStyle = rgr;
    } else {
        ctx.fillStyle = 'rgba(0,0,0,' + alpha + ')';
    }

    var d = r*2;

    ctx.fillRect(x, y, d, d);
}

App.prototype.render = function() {
    var i,j, pixel_pos;
    var self = this;
    self.canvas.width = self.canvas.width;
    var th = self.threshold;
    var def = self.deforestation;
    var pixels = def.data;
    var w = def.width;
    var ctx = self.ctx;
    var d;
    ctx.fillStyle = '#FFF';//'rgb(20, 100, 0)';
    ctx.fillRect(0, 0 , self.canvas.width, self.canvas.height);
    for(i=0; i < def.width; ++i) {
        for(j=0; j < def.height; ++j) {
             pixel_pos = (j*w + i) * 4;
             if (pixels[pixel_pos+3] !== 0 &&
                 pixels[pixel_pos+2] !== 0) {
                 d = th - pixels[pixel_pos + 2];
                 if(d > 0) {
                     var a = self.maxAlpha*Math.min(10, d)/self.fadeDist;
                     draw_circle(self.ctx, i*4, j*4, self.radius, a, self.circle);
                     //self.ctx.fillRect(i*4, j*4, 4, 4);
                 }
             }
        }
    }
    // postprocess
    if(!self.postProccess)  return;
    var canvas = self.canvas;
    var backBuffer = ctx.getImageData(0, 0, canvas.width, canvas.height);
    pixels = backBuffer.data;
    var w = canvas.width;
    for(i=0; i < canvas.width; ++i) {
        for(j=0; j < canvas.height; ++j) {
             pixel_pos = (j*w + i) * 4;
             var a = pixels[pixel_pos];
             if(a < 254) {
                 if( self.alphaLow < a && self.alphaHigh > a) {
                     d = a - self.alphaLow;
                     pixels[pixel_pos+0] = 255;
                     pixels[pixel_pos+1] = 0;
                     pixels[pixel_pos+2] = 0;
                     pixels[pixel_pos+3] = 80;
                 } else {
                     pixels[pixel_pos+0] = 00;
                     pixels[pixel_pos+1] = 0;
                     pixels[pixel_pos+2] = 0;
                     pixels[pixel_pos+3] = 255;
                 }
             }
        }
    }
    ctx.putImageData(backBuffer, 0, 0);

}


App.prototype.run = function() {
    var self = this;
    if(self.deforestation) {
        self.render();
            //self.threshold = (self.threshold + 1)%67;
    }
}
