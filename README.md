# What is the WRI project?

The WRI project aims to build a web app that rides on FORMA data to explain the story of deforestation over time.

# Development setup

See the app [README](https://github.com/Vizzuality/wri/blob/master/app/README.md).

## Data sources

### CartoDB

Smoothed GADM layers for countries ([names](https://wri-01.cartodb.com/api/v1/queries?sql=SELECT%20name_engli,%20iso%20FROM%20gadm0%20WHERE%20forma=true), [map](https://wri-01.cartodb.com/tables/gadm0/embed_map?sql=SELECT%20*%20FROM%20gadm0%20WHERE%20forma=true)), provinces ([names](https://wri-01.cartodb.com/api/v1/queries?sql=SELECT%20name_1%20FROM%20gadm1%20WHERE%20forma=true), [map](https://wri-01.cartodb.com/tables/gadm1/embed_map?sql=SELECT%20*%20FROM%20gadm1%20WHERE%20forma=true)), and sub-provinces ([names](https://wri-01.cartodb.com/api/v1/queries?sql=SELECT%20name_2%20FROM%20gadm2%20WHERE%20forma=true), [map](https://wri-01.cartodb.com/tables/gadm2/embed_map?sql=SELECT%20*%20FROM%20gadm2%20WHERE%20forma=true)) are now in CDB (http://wri-01.cartodb.com). See tables gadm0, gadm1, and gadm2, respectively. Note that each table has a `forma` column. If it’s true, we have deforestation data for it. 

Quick note: Deforestation data is stored in the `forma` table in a column named `defor_idx`. It represents the number of pixels with greater than 50% probability of deforestation. It is stored by sub-province. 

To get the province-level or country-level index, we simply sum the sub-province `defor_idx` values that fall into the province or country. Here's a [real query](http://goo.gl/EFZ2h) for the deforestation of the Riau province of Indonesia..

### Polygon attribute schema

An evolving list of attributes for polygons are in the [FORMA CartoDB Schema](https://docs.google.com/spreadsheet/ccc?key=0AtcqIeX872a_dDhONWlzYURCbF9wNGRCRnh6VTFzUEE&hl=en_US#gid=0) Google Spreadsheet. Attributes that should be visible to the user are marked as `x` in the `ui` column.




