

App.modules.WRIAbout= function(app) {

    app.WRIAbout = Class.extend({
        init: function() {
        },

        run: function() {
            var countries = new app.Countries();
            var stories = new app.Stories();

            var search = new app.Search({
              el: $('#autocomplete'),
              countries: countries
            });

            var stories_dropdown = new app.StoryListView({
                el: $('#stories_drop'),
                stories: stories
            });
            countries.fetch();
            stories.fetch();
        }
    });
};
