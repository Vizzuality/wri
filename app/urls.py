from django.conf.urls.defaults import *
from django.conf import settings
from django.views.generic.simple import redirect_to, direct_to_template

# Uncomment the next two lines to enable the admin:
# from django.contrib import admin
# admin.autodiscover()

tmpl_vars = {'PRODUCTION': settings.PRODUCTION}
urlpatterns = patterns('',
    # Example:
    (r'^$', direct_to_template, {'template':'home.html', 'extra_context': tmpl_vars}),
    (r'^country$', direct_to_template, {'template':'country.html', 'extra_context': tmpl_vars}),
    (r'^html5$', direct_to_template, {'template':'html5.html', 'extra_context': tmpl_vars}),
    (r'^about$', direct_to_template, {'template':'about.html', 'extra_context': tmpl_vars}),
    (r'^stories$', direct_to_template, {'template':'stories.html', 'extra_context': tmpl_vars}),
    (r'^javascript$', direct_to_template, {'template':'nojs.html', 'extra_context': tmpl_vars}),
    (r'^400$', direct_to_template, {'template':'404.html', 'extra_context': tmpl_vars}),
    (r'^500$', direct_to_template, {'template':'500.html', 'extra_context': tmpl_vars}),
    #(r'^api/v0/', include('keyvalue.urls')),

    # (r'^admin/', include(admin.site.urls)),
    (r'^(?P<path>.*)$', 'django.views.static.serve', {'document_root': settings.MEDIA_ROOT}),
)
