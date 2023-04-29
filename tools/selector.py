#!/usr/bin/python3

import nextrak

# Some time constants
second = 1
minute = 60 * second
hour = 60 * minute
day = 24 * hour
week = 7 * day


class Selector( nextrak.Selector ):
    """Select the next track to be played.

    This class contains any customizations to be made regarding track
    selection, rather than more general management tasks as defined in the
    parent class.

    See the pydocs on the Selector class in nextrak.py for details on what this
    class can do.
    """
    def weighTrack( self, track, state ):
        (priority, weight) = super().weighTrack( track, state )
        info = state['files'][track]

        # If a track has been played in the last 3 hours, don't play it
        if( info['lastplay'] != None and 
           info['lastplay'] + (3 * hour) > state['time'] ):
            priority += 100

        # If an artist has been played in the last 60 mins, don't play it
        if( info['artist'] in state.setdefault( 'artistlast', {} ) and
           state['artistlast'][info['artist']] + (60 * minute) > state['time'] ):
            priority += 90

        return (priority, weight)


