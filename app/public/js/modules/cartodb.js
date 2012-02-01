
App.modules.CartoDB = function(app) {

    var resource_path= 'wri-01.cartodb.com/api/v1/sql';
    var resource_url = 'https://' + resource_path;

    function query(sql, callback, proxy) {
        var url = resource_url;
        var crossDomain = true;
        if(proxy) {
            url = 'api/v0/proxy/' + resource_url
            crossDomain = false;
        }
        if(sql.length > 1500) {
            $.ajax({
              url: url,
              crossDomain: crossDomain,
              type: 'POST',
              dataType: 'json',
              data: 'q=' + encodeURIComponent(sql),
              success: callback,
              error: function(){ 
                if(proxy) {
                    callback(); 
                } else {
                    //try fallback
                    app.Log.log("failed cross POST, using proxy");
                    query(sql, callback, true)
                }
              }
            });
        } else {
             //OK, if the server returns 400 none of the callbacks are called
             // :(
             // TODO: add timeout
             $.getJSON(resource_url + '?q=' + encodeURIComponent(sql) + '&callback=?')
             .success(callback)
             .fail(function(){ 
                    callback(); 
             }).complete(function() {
             });
        }
    }

    var cache = localStorage || {
        setItem: function(key, value) {
        },
        getItem: function(key) {
            return null;
        },
        removeItem: function(key) {
        }
    };



    var CartoDBModel = Backbone.Model.extend({

      _create_sql: function() {
        var where = " where {0} = '{1}'".format(this.what, this.get(this.what).replace("'", "''"));
        var select = [];
        for(var k in this.columns) {
          var w = this.columns[k];
          if(w.indexOf('ST_') !== -1) {
            select.push('ST_AsGeoJSON({1}) as {0}'.format(k,w));
          } else {
            select.push('{1} as {0}'.format(k, w));
          }
        }
        var sql = 'select ' + select.join(',') + ' from ' + this.table + where;
        return sql;
      },

      _parse_columns: function(row) {
        for(var k in row) {
          var v = row[k];
          var c = this.columns[k];
          if (c.indexOf('ST_') !== -1) {
            row[k] = JSON.parse(v);
          }
        }
        return row;
      },

      fetch: function() {
        var self = this;
        app.CartoDB.query(this._create_sql(), function(data) {
          self.set(self._parse_columns(data.rows[0]));
        });
      }
    });


    /**
     * cartodb collection created from a sql composed using 'columns' and
     * 'table' attributes defined in a child class
     *
     * var C = CartoDBCollection.extend({
     *  table: 'table',
     *  columns: ['c1', 'c2']
     * });
     * var c = new C();
     * c.fetch();
     */
    var CartoDBCollection = Backbone.Collection.extend({

      _create_sql: function() {
        var tables = this.table;
        if(!_.isArray(this.table)) {
            tables = [this.table];
        }
        tables = tables.join(',');
        var sql = 'select ' + this.columns.join(',') + ' from ' + tables;
        if (this.where) {
            sql += " WHERE " + this.where;

        }
        return sql;
      },

      fetch: function() {
        var self = this;
        var sql = this.sql || this._create_sql();
        if(typeof(sql) === "function") {
          sql = sql.call(this);
        }
        var item = this.cache ? cache.getItem(sql): false;
        if(!item) {
            app.CartoDB.query(sql, function(data) {
              if(this.cache) {
                  try {
                    cache.setItem(sql, JSON.stringify(data.rows));
                  } catch(e) {}
              }
              self.reset(data.rows);
            });
        } else {
            self.reset(JSON.parse(item));
        }
      }

    });


    app.CartoDB = {
      query: query,
      CartoDBCollection: CartoDBCollection,
      CartoDBModel: CartoDBModel
    };


};
