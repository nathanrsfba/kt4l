#!/usr/bin/python3

import sys
import math

# Some time constants
second = 1
minute = 60 * second
hour = 60 * minute
day = 24 * hour
week = 7 * day

def readTrack( track, state, id3, easy ):
    """Extract relevant data from a track when added to the database.

    When an MP3 is added to the database, or updated, this routine is called to
    extract any needed information from the ID3 data, etc.

    track: Path to the track (relative to library folder)
    state: State database (see weighTrack for details)
    id3: ID3 information, as provided by Mutagen
    easy: ID3 information, as provided by Mutagen.easyid3

    Return:
    None expected. Function is expected to insert information into state
    database as needed.
    """

    info = state['files'][track]

    # Convert some information into a standard format
    for field in ('artist', 'title', 'album'):
        if field in easy:
            info[field] = easy[field][0]
        else:
            info[field] = None

    # Convert NN or NN/NN format into just a plain int
    if 'tracknumber' in easy:
        track = easy['tracknumber'][0]
        track = track.partition( '/' )[0]
        track = int( track )
        info['track'] = track
    else:
        info['track'] = None

    # Extract boolean flags
    for field in ('Skip', 'Follow'):
        fieldl = field.lower()
        if f"TXXX:{field}" in id3:
            data = id3[f"TXXX:{field}"][0]
            if data.lower() in ('1', 't', 'true', 'y', 'yes', 'on'):
                info[fieldl] = True
            else:
                info[fieldl] = False
        else:
            info[fieldl] = False

    # Create links for 'follow' tracks.
    # followid contains the artist, album, and track number. This is
    # stored in the database whenever the track is played. link contains
    # (if a track is marked as 'follow') the followid for the track
    # preceeding it
    info['followid'] = f"{info['artist']}:{info['album']}:{info['track']}"
    if info['follow']:
        info['link'] = f"{info['artist']}:{info['album']}:{info['track'] - 1}"


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
    files: A dict containing the files in the library. The key is the path to
        the file (relative to the library root). Values include:

        lastplay: The time the track was last played, in 'internal' time
        added: The time the track was added, in 'internal' time
        folders: A list of folders the track appears in. If it exists in the
            folder 'foo/bar', the list will contain ['foo', 'bar']
        modified: The time the file was last modified, in 'unix' time. Used by
            the main program to detect when a file has been updated.
        len: The duration of the track in seconds

        Note that this does not include ID3 information about the track by
        default. Any such information needed by the selection algorithm should
        be added by the readTrack function.

    You can also add items to this dict as part of the selection (or pre- or
    post-selection) process. The only requirement is that the items added are
    properly JSON serializable.

    Return:
    A tuple containing priority and weight, in that order
    """

    # This is just a dummy that cals doWeighTrack to do the actual work, and
    # stores some info in the 'debug' field for grepping out of the state file

    res = doWeighTrack( track, state )
    state['files'][track]['debug'] = f"{track}:{res[0]}.{res[1]}"
    return res

def doWeighTrack( track, state ):
    priority = 0
    weight = 100
    info = state['files'][track]

    # If a track is marked as 'skip', never play it
    if info['skip']:
        return (1000, 100)
    # If a track is marked as 'follow', never play it, unless the previous track
    # just played, in which case, play it above all other priorities
    if info['follow']:
        if info['link'] == state.setdefault( 'lasttrack', '' ):
            return (-1000, 100)
        else:
            return (1000,100)

    # If a track has been played in the last 3 hours, don't play it
    if( info['lastplay'] != None and 
       info['lastplay'] + (3 * hour) > state['time'] ):
            return (100, 100)

    # If part of the 'deliria' folder, reduce its weight
    if 'deliria' in info['folders']: weight = 50

    return (1, weight)

def postSelect( track, state ):
    """Perform any needed functions after selecting a track"""

    # Record the last time a track in a particular folder was played
    state.setdefault( 'lastplay', {} )

    for folder in state['files'][track]['folders']:
        state['lastplay'][folder] = state['time']

    info = state['files'][track]

    # Record the selected track's follow id, to facilitate playing successor
    # track
    state['lasttrack'] = info['followid']

def perror( *args ):
    print( *args, file=sys.stderr )
    
if __name__ == "__main__":
    print( "This should be imported as a module." )
