#!/bin/bash
PSQL="psql -A -t -U cartodb_user_2 -d cartodb_user_2_db"
DELT=$($PSQL -c "DELETE FROM asia_500m_18_jan_4x_grid")
RIDLIST=$($PSQL -c "SELECT rid FROM asia_500m_18_jan WHERE (st_summarystats(rast)).\"count\" > 0")
for RID in $RIDLIST; do
 OUT=$($PSQL -c "SELECT AXH_Griddify(rast, 4, 'asia_500m_18_jan_4x_grid', rid) FROM asia_500m_18_jan WHERE rid = $RID")
 echo $OUT;
done
FINT=$($PSQL -c "UPDATE asia_500m_18_jan_4x_grid SET the_geom = ST_Multi(ST_Transform(boxpoly,4326));")
exit 0