from django.conf.urls.defaults import *
from django.views.generic.simple import redirect_to

import views

urlpatterns = patterns('',
    url(r'^m$', views.json_data, name='api_index'),
    url(r'^m/(?P<obj_hash>[a-zA-Z0-9]+)$', views.json_data, name='api_obj'),
    url(r'^proxy/(?P<host>.*)$', views.proxy, name='api_proxy'),
    url(r'^error$', views.error, name='api_error'),
    url(r'^error/text$', views.errors),
)

