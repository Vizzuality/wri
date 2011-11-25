
/*
//=======================================
// map layer
//
//  a map layer is defined by its name and its source
//=======================================
var Layer = Class.extend({

    init: function() {
    }

});
*/

// google maps map
var MapView = Backbone.View.extend({
    mapOptions: {
            zoom: 2,
            center: new google.maps.LatLng(26.44106, 63.48967773437),
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            disableDefaultUI: true,
            //disableDoubleClickZoom: true,
            draggableCursor:'default',
            scrollwheel: false,
            mapTypeControl:false
            /*mapTypeControlOptions: {
                style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
                position: google.maps.ControlPosition.BOTTOM_LEFT
            }*/
    },

    events: {
            'click .zoom_in': 'zoom_in',
            'click .zoom_out': 'zoom_out'
    },
    //el: $("#map"),

    initialize: function() {
        _.bindAll(this, 'center_changed', 'ready', 'click', 'set_center', 'zoom_changed', 'zoom_in', 'zoom_out', 'adjustSize', 'set_zoom_silence', 'set_center_silence');
       var self = this;
       this.layers = {};
       this.layers_order = [];
       // hide controls until map is ready
       this.hide_controls();
       this.map = new google.maps.Map(this.$('.map')[0], this.mapOptions);
       google.maps.event.addListener(this.map, 'center_changed', this.center_changed);
       google.maps.event.addListener(this.map, 'zoom_changed', this.zoom_changed);
       google.maps.event.addListener(this.map, 'click', this.click);
       google.maps.event.addListener(this.map, 'mousemove', function(e) { self.trigger('mousemove', e);});
       this.projector = new Projector(this.map);
       this.projector.draw = this.ready;
       this.signals_on = true;
       this.map.setOptions({'styles':[ { featureType: "water", stylers: [ { hue: "#00eeff" }, { saturation: -44 }, { lightness: 40 } ] },{ featureType: "road", stylers: [ { saturation: -81 }, { visibility: "simplified" }, { lightness: 50 } ] },{ featureType: "road", elementType: "labels", stylers: [ { visibility: "off" } ] },{ featureType: "poi.business", stylers: [ { visibility: "off" } ] },{ featureType: "poi.school", elementType: "labels", stylers: [ { visibility: "off" } ] },{ featureType: "poi.medical", stylers: [ { visibility: "off" } ] },{ featureType: "administrative.neighborhood", stylers: [ { visibility: "off" } ] },{ featureType: "administrative.land_parcel", stylers: [ { visibility: "off" } ] },
       { featureType: "administrative.locality", stylers: [ { visibility: "on" } ] },
       {
           featureType: "poi.park",
           stylers: [
             { visibility: "off" }
           ]
         },
         {
             featureType: "poi.attraction",
             stylers: [
               { visibility: "off" }
             ]
           }
           
        ]
       });
    },

    adjustSize: function() {
        google.maps.event.trigger(this.map, "resize");
    },

    hide_controls: function() {
        this.$('.layer_editor').hide();
        this.$('.zoom_control').hide();
    },

    show_zoom_control: function() {
        this.$('.zoom_control').show();
    },

    hide_zoom_control: function() {
        this.$('.zoom_control').hide();
    },

    show_layers_control: function() {
        this.$('.layer_editor').show();
    },

    hide_layers_control: function() {
        this.$('.layer_editor').hide();
    },

    show_controls: function() {
        this.$('.layer_editor').show();
        this.$('.zoom_control').show();
    },

    center_changed: function() {
        if(this.signals_on) {
            this.trigger('center_changed', this.map.getCenter());
        }
    },

    zoom_in: function(e) {
        e.preventDefault();
        this.map.setZoom(this.map.getZoom() + 1);
    },

    zoom_out: function(e) {
        e.preventDefault();
        this.map.setZoom(this.map.getZoom() - 1);
    },

    zoom_changed: function() {
        if(this.signals_on) {
            this.trigger('zoom_changed', this.map.getZoom());
        }
    },

    set_center: function(c, s) {
        this.signals_on = s === undefined? true: s;
        this.map.setCenter(c);
        this.signals_on = true;
    },

    set_center_silence: function(c) {
        this.set_center(c, false);
    },

    get_center: function() {
        return this.map.getCenter();
    },

    set_zoom: function(z, s) {
        this.signals_on = s === undefined? true: s;
        this.map.setZoom(z);
        this.signals_on = true;
    },
    
    get_zoom: function() { return this.map.getZoom(); },

    set_zoom_silence: function(z) {
        this.set_zoom(z, false);
    },

    click: function(e) {
        this.trigger('click', e);
    },

    crosshair: function(onoff) {
        var c = this.$('.crosshair');
        if(onoff) {
            c.show();
        } else {
            c.hide();
        }
    },

    // called when map is ready
    // its a helper method to avoid calling getProjection whiout map loaded
    ready: function() {
            this.projector.draw = function(){};
            //this.show_controls();
            this.trigger('ready');
    },

    // add a new tiled layer
    add_layer: function(name, layer_info) {
          var opacity = 1.0;
          if(layer_info.opacity !== undefined) {
            opacity = layer_info.opacity;
          }
          var layer = new google.maps.ImageMapType({
              getTileUrl: function(tile, zoom) {
                var y = tile.y;
                var tileRange = 1 << zoom;
                if (y < 0 || y  >= tileRange) {
                  return null;
                }
                var x = tile.x;
                if (x < 0 || x >= tileRange) {
                  x = (x % tileRange + tileRange) % tileRange;
                }
                return this.urlPattern.replace("{X}",x).replace("{Y}",y).replace("{Z}",zoom);
              },
              tileSize: new google.maps.Size(256, 256),
              opacity: opacity,
              isPng: true,
              urlPattern:layer_info.url
         });
         this.layers[name] = {
            layer: layer,
            name: name
         };
         this.layers_order.push(name);
         this.reorder_layers();
    },

    get_layers: function() {
        var self = this;
        return _(this.layers_order).map(function(name) {
            return self.layers[name];
        });
    },

    enable_layer: function(name, enable) {
        this.layers[name].enabled = enable;
        this.reorder_layers();
    },

    reorder_layers: function(names) {
        var self = this;
        var idx = 0;
        this.layers_order = names || this.layers_order;
        self.map.overlayMapTypes.clear();
        var order = _.clone(this.layers_order).reverse();
        _(order).each(function(name) {
            var layer = self.layers[name];
            if(layer.enabled) {
                self.map.overlayMapTypes.setAt(idx, layer.layer);
            }
            idx++;
        });
    },


    remove_layer: function(name) {
        //TODO
    }

});
