
Premise
=================

We are dealing with summarizing pixels that are either 0 or 1, not any scale. My idea was to invert it and not store the value at each month, but only the months it increments. Saving a lot of space.

Starting info
=================

4x4 tiles
16 pixels
~150 months

encoding
--------

- Here is what my schema for a tile would look like

    [0] = reserved value in the array for a starting value of the tile
    
- so an array

    [4, 1, 2, 5....] 

    means that the tile began with a value = 4

- Then, the length of our array varies according to how much the tile changes over time.

    [4, 1] 

    Is a tile with a starting value of 4 and on the first month, it incremented by one, so 5

- Another example

    [3, 3, 6, 7]

    Is a tile with a starting value of 3, on the 3rd month it became 4, on the 6th month it became 5, on the 7th month it became 6

- The maximum size array we would require is 16 plus our starting value, so 17

    [0,1,4,11,12,13,15,17,20,21,22,28,30,32,33,36,40]

    This is a tile where by the 40th month, every pixel has been detected to have deforestation action (it had a starting value of 0)

- Now you might ask, what happens when many pixels are hit on the same month?

    [0,1,4,11,12,12,12,12,12,12,12,12,13]

    Here is an example, so by the 11th month the value is 3 and then on the 12th month it gets hit 8 times for a value of 11 and then no more are detected after the 13th month, so a value of 12.

- This is also nice in tiles where no deforestation is ever detected,

    [0]
