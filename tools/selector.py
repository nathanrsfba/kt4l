#!/usr/bin/python3

import sys
import math

def preSelect( state ):
    """Perform any needed functions before selecting a track"""

    # Not doing any preselect tasks at the moment

def weighTrack( track, state ):
    """Assign a priority and weight to a track

    Tracks with lower priority will always be rejected in facor of tracks with
    higher priority. Priority in this case is in ascending order: Priority 1 is
    higher than Priority 2.

    Tracks with a higher weight are more likely to be chosen than tracks with
    lower weight.

    Arguments:
    track -- Filename of the track
    state -- The global state database

    The state database is a dict that contains the following:

    version: The version number of the file.
    time: The 'internal' time of the station, in seconds. This is not directly
        related to actual real world time, but is actually the number of
        seconds elapsed since the station started broadcasting. Each time a
        track is selected, this is updated based on the length of the track. In
        this way, this script can be called repeatedly for testing purposes,
        and it will simulate an actual set of selections, regardless of 'real'
        time.
    file: A dict containing the files in the library. The key is the path to
        the file (relative to the library root). Values include:

        lastplay: The time the track was last played, in 'internal' time
        added: The time the track was added, in 'internal' time
        folders: A list of folders the track appears in. If it exists in the
        folder 'foo/bar', the list will contain ['foo', 'bar']
        modified: The time the file was last modified, in 'unix' time. Used by
        the main program to detect when a file has been updated.
        title: The track title from ID3
        artist: The track artist from ID3
        album: The track album from ID3

        This will also include raw ID3V2 keys, in addition to the above. For
        instance, there might be a 'TSSE' tag giving the file encoder, or
        perhaps any other custom tag you'd care to add. In the event that there
        are multiple tags of the same time, only the first is saved.

    You can also add items to this dict as part of the selection (or pre- or
    post-selection) process. The only requirement is that the items added are
    properly JSON serializable.

    Return:
    A tuple containing priority and weight, in that order
    """

    priority = 0
    weight = 100
    info = state['files'][track]

    if( info['lastplay'] != None and 
       info['lastplay'] + (60 * 60 * 3) > state['time'] ):
            # perror( f"Rejecting {track}, too recent" )
            return (100, 100)
    # perror( f"Setting normal weight for {track}" )
    if 'deliria' in info['folders']: weight = 50
    return (1, weight)

def postSelect( track, state ):
    """Perform any needed functions after selecting a track"""

    # Record the last time a track in a particular folder was played
    state.setdefault( 'lastplay', {} )

    for folder in state['files'][track]['folders']:
        state['lastplay'][folder] = state['time']


def perror( *args ):
    print( *args, file=sys.stderr )
    
if __name__ == "__main__":
    print( "This should be imported as a module." )
