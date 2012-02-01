
"""
basic project tasks
"""

import re
from fabric.api import local

def deploy():
    compile_js()
    local("appcfg.py update languages")

def _get_javascript_files(f='app/templates/base.html'):
    return re.findall('src="(.*\.js)"', open(f).read())

def concat_files(files, out):
    for x in files:
        local("cat %s >> /tmp/_concat.js" % x)

def compile_js():
    local("rm -rf /tmp/_concat.js")
    js = _get_javascript_files()
    #concat_files(['app/public/' + x for x in js if x != 'all.js'], '/tmp/_concat.js')
    local("rm -rf app/public/js/all.js")
    for f in ['app/public/' + x for x in js if x != 'all.js']:
        #local("java -jar tools/compiler.jar  --jscomp_off=internetExplorerChecks   --js %s >> app/public/js/all.js" % f)
        local("uglifyjs < %s >> app/public/js/all.js" % f)


