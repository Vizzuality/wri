

// application config
App.modules.Config = function(app) {

    app.config = {
        API_URL: '/api/v0/work',
        LOCAL_STORAGE: false,
        MAP_LAYERS: [{
             name: 'protected',
             url: 'http://184.73.201.235/blue/{Z}/{X}/{Y}',
             opacity: 0.4
          }, {
             name: 'carbon',
             opacity: 0.4,
             url: 'http://lifeweb-maps.unep-wcmc.org/ArcGIS/rest/services/lifeweb/carbon/MapServer/tile/{Z}/{Y}/{X}'
          }, {
            name: 'carbon sequestration',
            opacity: 0.4,
            url: 'http://lifeweb-maps.unep-wcmc.org/ArcGIS/rest/services/lifeweb/carb_seq/MapServer/tile/{Z}/{Y}/{X}'
          }, {
            name: 'restoration potential',
            opacity: 0.4,
            url: 'http://lifeweb-maps.unep-wcmc.org/ArcGIS/rest/services/lifeweb/rest_pot/MapServer/tile/{Z}/{Y}/{X}'
          }, {
            name: 'forest',
            url: 'http://lifeweb-maps.unep-wcmc.org/ArcGIS/rest/services/lifeweb/forest_intact/MapServer/tile/{Z}/{Y}/{X}',
            opacity: 0.4
          }

        ]
    };

}
