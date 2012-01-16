
"""
this script creates an encoded image to test time range desforestation
"""

import math

GRID_SIZE = 4
COMPONENTS = 4 #rgba
IMAGE_SIZE = 256

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

    im.save('encoded.png')
