# Setting up the dev environment

Setting up the development environment for the WRI app is super easy. 

## Ubuntu and Mac OS X

First check out the WRI project code by firing up your command line and typing:

```bash
$ git clone git@github.com:Vizzuality/wri.git
```

The WRI app rides on [Django](https://www.djangoproject.com/) which is a super clean Python web framework. You'll need to install version 1.2.4 using [PIP](https://www.djangoproject.com), an easy to use Python package manager:

```bash
$ sudo pip install django==1.2.4
```

Next we'll create the models:

```bash
$ cd app && python manage.py syncdb
```

And that's it! Start the server and view [http://localhost:8000]( http://localhost:8000).

```bash
 $ cd app && python manage.py runserver
```

## Extra credit 

If you want to change application style that gets reflected on a browser refresh, you'ill need [Compass](http://compass-style.org), the CSS Authoring Framework. This depends on Ruby and Gem being installed:

```bash
$ gem install compass
$ gem install html5-boilerplate
```

Finally:

```bash
$ cd app && compass watch
```

This will compile every change you do in css_src folder css files.
