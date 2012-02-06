

// application config
App.modules.Config = function(app) {

    app.Config = {
        API_URL: '/api/v0/m',
        LOCAL_STORAGE: false,
        MAP_LAYERS: [
          /*{
            name: "m0",
            url: "https://wri-01.cartodb.com/tiles/gadm0/{Z}/{X}/{Y}.png?cache_buster=0&sql=SELECT%20*%20FROM%20gadm0%20WHERE%20forma=true"
          }*/
          /*
          {
            name: "m1",
            url: "https://wri-01.cartodb.com/tiles/gadm1/{Z}/{X}/{Y}.png?cache_buster=0&sql=SELECT%20*%20FROM%20gadm1%20WHERE%20forma=true"
          },
          {
            name: "m2",
            url: "https://wri-01.cartodb.com/tiles/gadm2/{Z}/{X}/{Y}.png?cache_buster=0&sql=SELECT%20*%20FROM%20gadm2%20WHERE%20forma=true"
          }*/
        ]

    };

}
