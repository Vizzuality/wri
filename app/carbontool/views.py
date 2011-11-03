# -*- encoding: utf-8 -*-

"""
this module contains views that serve the REST-like API 
for client-side backbone application
"""

import logging
import json

from django.http import HttpResponse, Http404
from django.views.decorators.csrf import csrf_exempt

from baseconv import base62
from models import Work

from cartodb import CartoDB, polygon_text

BASE_ID = 123456
@csrf_exempt
def work(request, work_hash=None):

    status = 200
    work = None
    if work_hash:
        id = base62.to_decimal(work_hash)
        work = Work.get_by_id(id - BASE_ID)
        if not work:
            raise Http404

    # create work
    if request.method == "POST":
        w = Work()
        w.put();
        data = json.dumps({'id': base62.from_decimal(BASE_ID + w.unique_id())})

    # update
    elif request.method == "PUT":
        if work:
            work.json = request.raw_post_data
            work.put()
            data = request.raw_post_data
        pass
    # remove
    elif request.method == "DELETE":
        work.delete();
        status = 204
        data = ''
        pass
    # get
    else:
        data = work.json
        pass

    return HttpResponse(data, status=status, mimetype='application/json')

@csrf_exempt
def stats(request): 
    data = { 'error': 'you should use POST' }
    if request.method == "POST":
        #TODO: error control
        polygons = json.loads(request.raw_post_data)['polygons']
        c = CartoDB()
        try:
            carbon = c.carbon(polygon_text(polygons[0]))
        except Exception as e:
            data['error'] = str(e)
        else:
            data = {
                'carbon': {
                    'qty': carbon
                }
            }
    return HttpResponse(json.dumps(data), mimetype='application/json')




