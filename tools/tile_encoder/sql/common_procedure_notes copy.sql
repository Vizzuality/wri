--procedure to create all the values from just 3562 into a table
DELETE FROM asia_500m_18_jan_4x_grid;
SELECT AXH_Griddify(rast, 4, 'asia_500m_18_jan_4x_grid', rid) FROM asia_500m_18_jan WHERE rid = 3562;
UPDATE asia_500m_18_jan_4x_grid SET the_geom = ST_Multi(ST_Transform(boxpoly,4326));

--procedure to create all the values for all tiles showing deforestation
DELETE FROM asia_500m_18_jan_4x_grid;
SELECT test_griddify(rast, 4, rid) FROM asia_500m_18_jan WHERE rid in (SELECT rid FROM asia_500m_18_jan WHERE (st_summarystats(rast))."sum" > 0);

