
"""
this script creates an encoded image to test time range desforestation
"""

import math

GRID_SIZE = 4
COMPONENTS = 4 #rgba
IMAGE_SIZE = 256

def time_to_pixel_component(month):
    """
    >>> time_to_pixel_component(0)
    (0, 0, 0)
    >>> time_to_pixel_component(1)
    (0, 0, 1)
    >>> time_to_pixel_component(2)
    (0, 0, 2)
    >>> time_to_pixel_component(3)
    (0, 0, 3)
    >>> time_to_pixel_component(4)
    (1, 0, 0)
    >>> time_to_pixel_component(16)
    (0, 1, 0)
    >>> time_to_pixel_component(4*4*4+1)
    (4, 0, 1)

    """
    super_pixels = IMAGE_SIZE/GRID_SIZE;
    pixels = GRID_SIZE*GRID_SIZE
    months_per_grid = COMPONENTS*pixels
    grid_no = month/months_per_grid;
    a =  month%months_per_grid
    pixel_no = a/COMPONENTS
    subpy = pixel_no/GRID_SIZE
    subpx = pixel_no%GRID_SIZE
    component = a%COMPONENTS
    py = grid_no/super_pixels;
    px = grid_no%super_pixels

    return (px*GRID_SIZE + subpx, py*GRID_SIZE + subpy, component)


def pos_time_to_pixel(image_w, pixel, month):
    """
    >>> pos_time_to_pixel(64, (63, 63), 63)
    (65535, 3)

    """
    return ((pixel[1]*image_w + pixel[0])*GRID_SIZE*GRID_SIZE + month/COMPONENTS, month%COMPONENTS)




if __name__ == '__main__':
    import Image
    import random
    im = Image.new("RGB", (IMAGE_SIZE, IMAGE_SIZE), (0, 0, 0))

    pix = im.load()
    for month in xrange(4*4*3):
        for x in xrange(64):
            for y in xrange(64):
                xx = x*4
                yy = y*4
                px = month/3
                sx = px%4
                sy = px/4
                comp = month%3
                c = list(pix[xx + sx, yy + sy])
                a = math.cos(math.pi*x/64.0)
                b = math.cos(math.pi*y/64.0)
                c[comp] = random.randint(0, 3) + int(7*math.sin(20*month/48.0)*math.cos(math.pi*x/64)*a*b)
                pix[xx + sx, yy + sy] = tuple(c)
                """
                pixel, component = pos_time_to_pixel(IMAGE_SIZE/GRID_SIZE, (x, y), month)

                px = pixel%IMAGE_SIZE
                py = pixel/IMAGE_SIZE
                c = list(pix[px, py])
                c[component] = month%10
                pix[px, py] = tuple(c)
                """
    print pix[3,3]
    # test
    """
    time = 9
    for x in xrange(256):
        for y in xrange(256):
          xx = x/4
          yy = y/4
          pp = (yy*64 + xx)*16 + time/4
          c = time%4
          if pix[int(pp%256), int(math.floor(pp/256))][c] != time:
            raise "ERROR"
    """

    im.save('2.png')
