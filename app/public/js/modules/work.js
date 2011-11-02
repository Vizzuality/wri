

App.modules.Data = function(app) {


    var Report = Backbone.Model.extend({

        defaults: function() {
            return {
                "polygons": new Array()
            };
        },


        initialize: function() {
        },

        save: function() {
            return this.collection.save();
        },

        update_polygon: function(index, path) {
            this.get('polygons')[index] = path;
            this.trigger('change:polygons', this);
            this.trigger('change', this);
            this.save();
        },

        remove_polygon: function(index) {
            this.get('polygons').splice(index, 1);
            this.trigger('change:polygons', this);
            this.trigger('change', this);
            this.save();
        },

        add_polygon: function(path) {
            if(this.get('total')) {
                app.Log.error("can't add polygons to total");
                return;
            }
            this.get('polygons').push(path);
            // activate the signal machinery
            this.trigger('change:polygons', this);
            this.trigger('change', this);
            this.save();
        },

        fetch: function() {
            // get data using polygons
        },

        toJSON: function() {
            //TODO: optimize this using a real shallow copy
            return JSON.parse(JSON.stringify(this.attributes));
        }

    });

    var WorkModel = Backbone.Collection.extend({

        API_URL: app.config.API_URL,
        model: Report,

        initialize: function() {
            _.bindAll(this, 'on_report_change', 'on_add', 'on_add_all');
            this.bind('add', this.on_add);
            this.bind('reset', this.on_add_all);
        },

        set_work_id: function(id) {
            this.work_id = id;
            if(app.config.LOCAL_STORAGE) {
                this.localStorage = new Store(this.work_id);
            }
        },

        url: function() {
            return this.API_URL + '/' + this.work_id;
        },

        create: function(success, fail) {
            var self = this;
            function _done(data) {
                // default data
                self.set_work_id(data.id);
                self.new_report({total: true});
                self.new_report();
                self.save({
                    success: function() {
                        success(data.id);
                    }
                });
            }
            if(!app.config.LOCAL_STORAGE) {
                $.ajax({
                    url: this.API_URL,
                    type: 'POST'})
                .done(_done)
                .fail(fail);
            } else {
                // simulte some lag
                setTimeout(function() {
                    _done({id: S4() + S4()});
                }, 500);
            }
        },

        // create empty report
        new_report: function(defaults, options) {
            var r = new Report();
            r.set(defaults);
            this.add(r);
            return r.cid;
        },

        on_add: function(r) {
            r.bind('change', this.on_report_change);
        },

        on_add_all: function() {
            var self = this;
            this.each(function(r) { self.on_add(r); });
        },

        delete_report: function(rid) {
            var r = this.at(rid);
            this.remove(r);
            r.unbind('change', this.on_report_change);
            r.remove();
            this.save();
        },

        on_report_change: function(r) {
            this.trigger('report_change', r);
        },

        save: function(options) {
            Backbone.sync('update', this, options);
        },

        polygon_count: function() {
            return this.reduce(function(memo, r) {
                return memo + r.get('polygons').length;
            }, 0);
        }

    });

    app.Work = Class.extend({

        init: function(bus) {
            var self = this;
            _.bindAll(this, 'on_polygon', 'on_work', 'on_new_report','add_report', 'on_create_work', 'active_report', 'on_remove_polygon', 'on_update_polygon');
            this.bus = bus;
            this.work = new WorkModel();
            this.active_report_id = -1;
            this.bus.link(this, {
                'polygon': 'on_polygon',
                'work': 'on_work',
                'model:add_report': 'add_report',
                'model:create_work': 'on_create_work',
                'model:active_report': 'active_report',
                'model:remove_polygon': 'on_remove_polygon',
                'model:update_polygon': 'on_update_polygon'
            });

            this.work.bind('add', this.on_new_report);
            this.work.bind('reset', function() {
                app.Log.log("reset", this.models);
                self.bus.emit('view:remove_all');
                this.each(function(r) {
                    self.on_new_report(r);
                });
            });
            this.work.bind('report_change', function(r) {
                self.bus.emit('view:update_report', r.cid, r.toJSON());
            });
        },

        on_remove_polygon: function(rid, index) {
            var r = this.work.getByCid(rid);
            if(r) {
                r.remove_polygon(index);
            } else {
                app.Log.error("can't get report: ", rid);
            }
        },

        on_update_polygon: function(rid, index, new_path) {
            var r = this.work.getByCid(rid);
            if(r) {
                r.update_polygon(index, new_path);
            } else {
                app.Log.error("can't get report: ", rid);
            }
        },

        on_polygon: function(polygon) {
            // append polygon to current report
            var r = this.work.getByCid(this.active_report_id);
            r.add_polygon(polygon.paths[0]);
        },

        on_work: function(work_id) {
            var self = this;
            app.Log.log("on work: ", work_id);
            this.work.set_work_id(work_id);
            this.work.fetch({
                success: function() {
                    self.bus.emit("app:work_loaded");
                }
            });
            //TODO: does not exists
        },

        on_new_report: function(r) {
            this.bus.emit('view:new_report', r.cid, r.toJSON());
            this.active_report(r.cid);
        },

        on_create_work: function() {
            var self = this;
            this.work.create(function(id) {
                self.bus.emit("app:route_to", "w/" + id);
            }, function() {
                app.Log.error("failed creating work id");
            });

        },

        add_report: function() {
            this.work.new_report();
            this.work.save();
        },

        update_report: function() {
        },

        active_report: function(rid) {
            this.active_report_id = rid;
            var r = this.work.getByCid(rid);
            this.bus.emit('view:show_report', rid, r.toJSON());
        },

        select_report: function() {
        }
    
    });
};
