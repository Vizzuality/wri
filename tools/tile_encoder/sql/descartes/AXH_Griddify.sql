DROP FUNCTION IF EXISTS AXH_Griddify(rast raster, s int, tbl text, tile_id int);
CREATE OR REPLACE FUNCTION AXH_Griddify(rast raster, s int, tbl text, tile_id int) 
    RETURNS boolean AS $$
    DECLARE 
        --only works on CartoDB for certain because postgis tiles are guaranteed to be 200x200, so divisible by our stepping values
        --position
        x int := 1;
        y int := 1;
        i int := 1;
        a int; b int;
        mx int; my int;
        ix int; iy int;
        --raster and raster dimensions
        rastw int := ST_Width(rast);
        rasth int := ST_Height(rast);
        --grid cell and grid cell dimensions
        upperleftx numeric;
        upperlefty numeric;
        --time extents zlow will be the date at Array[1]
        --NOT IMPLEMENTED
        zlow int := 0;
        zhigh int := 254;
        --the value on pixels that should be ignored
        null_val int := 255;
        --the array we will build
        holder_init int[] := ARRAY(SELECT 0 FROM generate_series(1,256));
        holder int[];
        adder int[];
        v int;
        predate int = 0; --the value assigned to months prior to forma
        tmp int;
        total_incr int;
        --indexing values for the array
        poly geometry;
        tpoly geometry;
        upper_left geometry;
        upper_left_x numeric;
        upper_left_y numeric;
        srid int := 3857;
        ct int := 0;
    BEGIN
        FOR a IN 1..(rastw-1) BY s LOOP 
            FOR b IN 1..(rasth-1) BY s LOOP 
                mx := a;
                my := b;
                holder := holder_init;
                total_incr := 0;
                --Get upper left coordinates here based on mx, my
                poly := ST_PixelAsPolygon(rast, mx, my);
                upper_left_x := ST_XMin(poly);
                upper_left_y := ST_YMax(poly);
                upper_left := ST_SetSRID(ST_Point(upper_left_x, upper_left_y), 3857);
                poly := ST_Envelope(ST_Union(poly, ST_PixelAsPolygon(rast, (mx + (s-1)), (my+(s-1)))));
                FOR ix IN 0..(s-1) LOOP
                    FOR iy IN 0..(s-1) LOOP
                        v := ST_Value(rast, (mx + ix), (my + iy));
                        IF v != null_val THEN
                            holder[v] := holder[v] + 1;
                            total_incr := total_incr + 1;
                        END IF;
                    END LOOP;
                END LOOP;
                --create an array of additive values, so at any value in array Array[x] it return cummulative value. Array[x] - Array[x-1] would result in the discrete. Less compressible than the above
                IF 0 < total_incr THEN
                    adder := holder;
                    ct := 0;
                    FOR i in array_lower(adder, 1) .. array_upper(adder, 1) LOOP
                        adder[i] := holder[i] + ct;
                        ct := holder[i] + ct;
                    END LOOP;
                    EXECUTE format('INSERT INTO %I (rid, boxpoly, upper_left, upper_left_x, upper_left_y, time_series, cummulative, total_incr, pixels, cell_width, cell_height) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)', tbl) USING tile_id, poly, upper_left, upper_left_x, upper_left_y, holder, adder, total_incr, (s*s), (s*ST_PixelWidth(rast))::int, (2*ST_PixelHeight(rast))::int;
                END IF;
            END LOOP;
        END LOOP;
        RETURN TRUE;
    END;
    $$ LANGUAGE 'plpgsql';
    
  
DELETE FROM asia_500m_18_jan_4x_grid;
SELECT AXH_Griddify(rast, 4, 'asia_500m_18_jan_4x_grid', rid) FROM asia_500m_18_jan WHERE rid = 3562;
UPDATE asia_500m_18_jan_4x_grid SET the_geom = ST_Multi(ST_Transform(boxpoly,4326));




DELETE FROM asia_500m_18_jan_4x_grid;
SELECT test_griddify(rast, 4, rid) FROM asia_500m_18_jan WHERE rid in (SELECT rid FROM asia_500m_18_jan WHERE (st_summarystats(rast))."sum" > 0);

SELECT rid FROM (SELECT rid, st_summarystats(rast) as stats FROM asia_500m_18_jan) f WHERE (stats)."sum" > 0;

SELECT count(*) FROM asia_500m_18_jan WHERE (st_summarystats(rast))."sum" > 0;


SELECT test_griddify(rast, 4, rid) FROM asia_500m_18_jan WHERE rid in (SELECT rid FROM asia_500m_18_jan WHERE (st_summarystats(rast))."sum" > 0 LIMIT 1 OFFSET 7);
UPDATE asia_500m_18_jan_4x_grid SET the_geom = ST_Multi(ST_Transform(boxpoly,4326));



DELETE FROM griddify_results;
SELECT test_griddify(rast, 4) FROM amc WHERE rid = 3562;
UPDATE griddify_results SET the_geom = ST_Multi(ST_Transform(boxpoly,4326));
SELECT * FROM griddify_results_s ORDER BY total_incr DESC;


SELECT rid FROM (SELECT rid, st_summarystats(rast) as stats FROM amc) f WHERE (stats)."sum" > 0

SELECT upper_left_x, upper_left_y, pixel_width, pixel_height, pixels, total_incr as events, cummulative, boxpoly the_geom_webmercator FROM griddify_results LIMIT 11

175063.184262466,

pixel_height: 935.163909456647,

upper_left_y: 174128.02035301,

