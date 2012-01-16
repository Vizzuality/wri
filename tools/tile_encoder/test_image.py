
"""
this script creates an encoded image to test time range desforestation
"""

import math

GRID_SIZE = 4
COMPONENTS = 3 #rgba
IMAGE_SIZE = 256


if __name__ == '__main__':

    import Image
    import random
    im = Image.new("RGB", (IMAGE_SIZE, IMAGE_SIZE), (0, 0, 0))

    pix = im.load()
    for month in xrange(4*4*3):
        for x in xrange(IMAGE_SIZE/GRID_SIZE):
            for y in xrange(IMAGE_SIZE/GRID_SIZE):
                xx = x*GRID_SIZE
                yy = y*GRID_SIZE
                px = month/COMPONENTS
                sx = px%GRID_SIZE
                sy = px/GRID_SIZE
                comp = month%COMPONENTS
                c = list(pix[xx + sx, yy + sy])

                # here we get the value for this pixel (x, y) for that month
                # in this example we generate random data + sin/cos
                a = math.cos(math.pi*x/64.0)
                b = math.cos(math.pi*y/64.0)
                c[comp] = random.randint(0, 3) + int(7*math.sin(20*month/48.0)*math.cos(math.pi*x/64)*a*b)

                
                pix[xx + sx, yy + sy] = tuple(c)

    im.save('encoded.png')
