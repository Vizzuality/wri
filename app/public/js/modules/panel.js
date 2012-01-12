/*
 ===============================================
 information panel control
 ===============================================
*/


App.modules.Panel = function(app) {

    var StatsPanel = Backbone.View.extend({

        initialize: function() {
        },

        set_info: function(info) {
            var info_el = this.$('.info');
            info_el.html('');
            for(var i in info) {
                var a = "<dl><DT>" + i;
                a += "<DD>" + info[i] + "</dl>";
                info_el.append(a);
            }
        }

    });


    // export
    app.StatsPanel = StatsPanel;


};
