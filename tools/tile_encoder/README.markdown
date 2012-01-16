
Tile data encoder
=================

This document describes how desforestation values time series are encoded in a PNG image to render on the client as gridmap

We want to show an animation on the client showing a gridmap (4x4 pixels) of the deforestation in a map. We have information each two weeks for many years so sending an image per time is ot possible (too many images to download and a lot of memory in the client).




encoding
--------

- input: deforestation value (0 to 10) for each month for each grid cell, this is for example the data for two years, the first is January, February and so on:
    
    grid_cell_data = [ 1, 1, 1, 2, 3, 3, 5, 5, 6, 6, 7, 8,
                       8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8]

we want to encode this data in a 256x256 tile, so lets see how much data we can put in a 256x256. 

 - we have a grid ox 4x4 so we can use 16 pixels in a 256x256 tile per grid cell.
 - each pixel we have 3 channels (RGB) so we can store 16*3 = 48 values (from 0 to 255)
 - so we could store 48 months per gridcell. We subdivide image in small 4x4 subimages and store the months information starting by the first row (see the example below).

 example: each cell in the following table is a pixel of the final image:

   ----------------------------------------------------
   | (1, 1, 1) | (2, 2, 3) | (5, 5, 6) | (6, 7, 8) |
   | (8, 8, 8) | (8, 8, 8) | (8, 8, 8) | (8, 8, 8) |
   ..... more pixels

the code
--------

the test_image.py script generates a test image (some noise with sin/cos variation). It needs PIL installed (pip install PIL).


























