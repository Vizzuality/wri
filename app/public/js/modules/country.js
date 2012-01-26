
App.modules.Country = function(app) {

    var Country = app.CartoDB.CartoDBModel.extend({
      table: 'country_attributes_live',
      columns: {
        'id': 'cartodb_id',
        'name': 'name_engli',
        'center': 'ST_Centroid(the_geom)',
        'bbox': 'ST_Envelope(the_geom)',
		'unregion1': 'unregion1',
		'unregion2': 'unregion2',
		'cumm': 'cumm',
		'total_incr': 'total_incr',
		'start_value': 'start_value'
      },
      what: 'name_engli',
	  center: function() {
			c = this.get('center');
			if(c) return c;
			return JSON.parse(this.get('the_geom')).coordinates;
	  },
	  time_series: function() {
			return this.get('cumm');
	  }
    });


    /**
     * countries collection
     */
    var Countries = app.CartoDB.CartoDBCollection.extend({
	  model: Country,
      table: 'country_attributes_live',
      columns: [
		'unregion1',
		'unregion2',
		'name_engli',
		'cumm',
		'total_incr',
		'start_value',
		'ST_AsGeoJSON(ST_Centroid(the_geom)) as the_geom'
	  ],
      cache: true,
      inside: function(area) {
        return this.filter(function(c) {
          return c.get('unregion1') === area;
        });
      }
    });

	app.Country = Country;
	app.Countries = Countries;
}
