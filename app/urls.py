from django.conf.urls.defaults import *
from django.conf import settings
from django.views.generic.simple import redirect_to, direct_to_template

# Uncomment the next two lines to enable the admin:
# from django.contrib import admin
# admin.autodiscover()

urlpatterns = patterns('',
    # Example:
    (r'^$', direct_to_template, {'template':'home.html'}),
    (r'^country$', direct_to_template, {'template':'country.html'}),
    (r'^ie6$', direct_to_template, {'template':'ie6.html'}),
    (r'^api/v0/', include('keyvalue.urls')),

    # (r'^admin/', include(admin.site.urls)),
    (r'^(?P<path>.*)$', 'django.views.static.serve', {'document_root': settings.MEDIA_ROOT}),
)
