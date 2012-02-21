
App.modules.Country = function(app) {

    var Country = app.CartoDB.CartoDBModel.extend({
      table: 'country_attributes_live',
      columns: {
        'id': 'cartodb_id',
        'name': 'name_engli',
        'center': 'ST_Centroid(the_geom)',
        'bbox': 'ST_Envelope(the_geom)',
        'sqkm': 'sqkm',
        'unregion1': 'unregion1',
        'unregion2': 'unregion2',
        'cumm': 'cumm',
        'iso': 'iso',
        'total_incr': 'total_incr',
        'start_value': 'start_value',
        'description': 'description'
      },
      what: 'name_engli',

      center: function() {
            c = this.get('center');
            if(c) return c;
            return JSON.parse(this.get('the_geom')).coordinates;
      },

      time_series: function() {
            return this.get('cumm');
      },

      time_series_deltas: function() { 
          //if(this._time_series_deltas) return this._time_series_deltas;
          var ts = this.time_series();
          var deltas = [];
          //deltas.push(0);
          for(var i = 2, l = ts.length; i < l; ++i) {
              deltas.push(ts[i] - ts[i-1]);
          }
          //now some smoothing, moving average
          var crop = function(a, b, t) {
              if(t < a) return 0;
              if(t > b) return b;
              return t;
          };
          var smooth = [];
          var SMOOTH_MONTHS = 6;
          for(i = 0, l = deltas.length; i < l; ++i) {
              var sum = 0;
              for(var j=0; j < SMOOTH_MONTHS; ++j) {
                  sum += deltas[crop(0, l-1, i + j - ((SMOOTH_MONTHS/2)>>0))];
              }
              smooth.push(100000*sum/(SMOOTH_MONTHS*this.get('sqkm')));
          }
          this._time_series_deltas = smooth;
          return smooth;
      },

      slug: function() {
          return this.get('name_engli');
      },

      max_deforestation: function() {
          return _.max(this.time_series());
      },

      // given the max deforestation generates
      // time_series_normalized attribute
      gen_normalized_deforestation: function(v) {
          this.set({'time_series_normalized': 
            _(this.time_series()).map(function(def) {
                return def/v;
            })
          });
      },

      def_percent_in_month: function(month) {
            return Math.sqrt(this.get('time_series_normalized')[month])*100.0;
      },
      // return the change in a range of months
      change_since: function(month0, month1) {
          var series = this.time_series();
          var t0 = series[Math.max(0, month0)];
          var t1 = series[month1];
          return (t1 - t0)/t0;
      }

    });

    //var Region = app.CartoDB.CartoDBModel.extend({ });

    var Regions = app.CartoDB.CartoDBCollection.extend({

        cache: true,

        initialize: function() {
            this.bind('reset', function() {
                this.each(function(r) {
                    r.set({
                        'bbox': JSON.parse(r.get('bbox'))
                    }, {silent: true});
                });

            });
        },
        sql: function() {
            var s = "WITH foo AS (SELECT ST_AsGeoJSON(ST_Centroid(ST_Envelope(admin1_attributes_live.the_geom))) as center, ST_AsGeoJSON(ST_Envelope(admin1_attributes_live.the_geom)) as bbox, name_1 as name, id1 FROM admin1_attributes_live WHERE admin1_attributes_live.iso = '{0}') SELECT center, bbox, foo.name, foo.id1, sum(global_4x_grid.total_incr) as total FROM foo,global_4x_grid WHERE global_4x_grid.iso='{0}' AND global_4x_grid.id1 = foo.id1 group by foo.id1, foo.name, center, bbox ORDER BY total DESC";
            return s.format(this.country_iso);
        },

        set_iso: function(iso) {
            this.country_iso = iso;
        },

        normalize: function() {
            var values = this.map(function(r) { return r.get('total'); });
            var max = _.max(values);
            if(max > 0) {
                this.each(function(r) {
                    r.set({'normalized': r.get('total')/max});
                });
            }
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
        'sqkm',
        'total_incr',
        'start_value',
        'iso',
        'ST_AsGeoJSON(ST_Centroid(the_geom)) as the_geom'
      ],
      where: 'start_value is not NULL',
      cache: true,

      initialize: function() {
          this.bind('reset', this.normalize_deforestation);
      },

      inside: function(areas) {

        if(!_.isArray(areas)) {
            areas = [areas];
        }

        return this.filter(function(c) {
          return _.indexOf(areas, c.get('unregion1')) >= 0;
        });
      },

      normalize_deforestation: function() {
          // get the max
          var def = this.map(function(c) {
              return c.max_deforestation();
          });
          var max_def = _.max(def);
          // normalize
          this.each(function(c) {
              c.gen_normalized_deforestation(max_def);
          });
      },

      next_country: function(country) {
          var m = this.models;
          for(var i = 0; i < m.length; ++i) {
              var c = m[i];
              if(c.get('name_engli') === country) {
                  var prev = i - 1;
                  if(prev < 0) {
                      prev += m.length;
                  }
                  prev = prev % m.length;
                  var next = (i + 1) % m.length;
                  return [m[prev], m[next]];
              }
          }
          return null;
      }


    });

    app.Country = Country;
    app.Countries = Countries;
    app.Regions = Regions;
}
