#!/usr/bin/python3

import json
import sys
import math
from pathlib import Path
import argparse
import importlib

import mutagen
from mutagen.easyid3 import EasyID3
import fasteners

#import random
from random import SystemRandom
random = SystemRandom()

# How you know a python coder started out life coding C...
def main():
    # Figure out the root of the 'radio' directory (assumes this script is
    # located in the 'tools' directory of said directory) to work out default
    # paths
    path = Path( __file__ ).absolute().parent.parent

    parser = argparse.ArgumentParser( description=
                                     'Select the next song to play' )
    parser.add_argument( 
                        '-s', '--state', 
                        default=path / 'configs' / 'state.json',
                        help="Path to file to save state in between calls"
                        )
    parser.add_argument( 
                        '-l', '--library', 
                        default=path / 'library',
                        help="Path to music library"
                        )
    parser.add_argument( 
                        '-u', '--update', 
                        action='store_true',
                        help="Update library without choosing track"
                        )
    parser.add_argument( 
                        '-U', '--update-all', 
                        action='store_true',
                        help="Update library, including unchanged files"
                        )
    args = parser.parse_args()
    if args.update_all: args.update = True

    global selector
    selpath = path / 'tools' / 'selector.py'
    if selpath.exists():
        import selector as customselector
        selector = customselector.Selector()
        # perror( "Loaded custom selector" )
    else:
        selector = Selector()
        # perror( "Loaded basic selector" )

    library = Path( args.library )
    statepath = Path( args.state )
    lockpath = statepath.with_name( statepath.name + ".lock" )
    lock = fasteners.InterProcessLock( lockpath )

    with lock:
        try:
            with open( statepath ) as fp:
                state = json.load( fp )
        except FileNotFoundError:
            state = {}

        state.setdefault( 'version', 1 )
        state.setdefault( 'time', 0 )
        state.setdefault( 'files', {} )

        removes = {} # Files formerly in library that no longer exist
        adds = {}    # Files just added to library

        # Remove files from the database that no longer exist. But, save a
        # record of them in case they are later found in another folder.
        for file in list( state['files'].keys() ):
            path = library / file
            if not path.exists(): 
                perror( f"Removing {file}" )
                removes[str( path.name )] = state['files'][file]
                del state['files'][file]

        # perror( removes )

        # Load the library
        files = getFiles( library )

        for file in files:
            sfile = str( file )     # Relative path to file, as string
            path = library / file   # Full path to file
            if sfile not in state['files']:
                if str( file.name ) in removes:
                    # If a file with the same name was deleted in the same run,
                    # consider it 'moved'
                    perror( f"Moving {file}" )
                    state['files'][sfile] = removes[str( file.name )]
                    state['files'][sfile]['folders'] = file.parent.parts
                else:
                    perror( f"Adding {file}" )
                    id3, easy = mp3Info( path )
                    state['files'][sfile] = {
                        'lastplay': None,
                        'added': state['time'],
                        'folders': file.parent.parts,
                        'modified': path.stat().st_mtime,
                        'len': id3.info.length
                        } 
                    selector.readTrack( sfile, state, id3, easy )
                        
            elif( 'modified' not in state['files'][sfile] or
                 state['files'][sfile]['modified'] < path.stat().st_mtime or
                 args.update_all ):
                perror( f"Updating {file}" )
                state['files'][sfile]['modified'] = path.stat().st_mtime
                id3, easy = mp3Info( path )
                state['files'][sfile]['len'] = id3.info.length
                selector.readTrack( sfile, state, id3, easy )


        # perror( json.dumps( state, indent=2 ))

        if not args.update:
            # perror( f"Time is {state['time']}" )

            selection = selectTrack( state )

            result = selector.postSelect( selection, state )
            if not result:
                result = (selection,)
            for selection in result:
                state['files'][selection]['lastplay'] = state['time']
                state['time'] += state['files'][selection]['len']
                print( library / selection )

        # Write the state file

        with open( statepath, 'w' ) as fp:
            json.dump( state, fp, indent=2 )

def getFiles( base, sub=Path() ):
    """Recursively get a list of all mp3 files in a directory

    base: The directory to search for files. All paths returned will be
        relative to this directory.
    sub: The subdirectory to search, relative to the base
    """

    base = Path( base )
    current = base
    files = []

    current = current / sub
    files.extend( [sub / x.name for x in current.glob( "*.mp3" )] )
    for dir in [x for x in current.glob( "*/" ) if x.is_dir()]:
        path = sub / dir.name
        files.extend( getFiles( base, path ))

    return files
    
def selectTrack( state ):
    """Select the next track to play.

    Runs through each track in the database, weighing and prioritizing it
    according to the selector module.
    """

    selector.preSelect( state )

    tracks = {}   # List of tracks, grouped by priority
    weights = {}  # Weights of said tracks, in same order and grouping

    for file, info in state['files'].items():
        (pri, weight) = selector.weighTrack( file, state )
        info['lastweight'] = f"{pri}.{weight}"
        tracks.setdefault( pri, [] ).append( file )
        weights.setdefault( pri, [] ).append( weight )

    # Find the highest priority among the listed tracks
    pris = list( tracks.keys() )
    pris.sort()
    toppri = pris[0]

    selection = random.choices( tracks[toppri], weights[toppri] )[0]
    return selection

def mp3Info( f ):
    """Get information on an MP3.

    f: Path to the file

    Return:
    A 2-tuple containing the information as returned by Mutagen, followed by
    the information returned by Mutagen.EasyID3.
    """

    id3 = None
    easy= None

    try:
        id3 = mutagen.File( f )
    except Exception as e:
        perror( e )

    try:
        easy = EasyID3( f )
    except Exception as e:
        perror( e )

    return id3, easy

def perror( *args ):
    """Print information to stderr."""

    print( *args, file=sys.stderr )
    
class Selector:
    """Select the next track to play."""

    def readTrack( self, track, state, id3, easy ):
        """Extract relevant data from a track when added to the database.

        When an MP3 is added to the database, or updated, this routine is called to
        extract any needed information from the ID3 data, etc.

        track: Path to the track (relative to library folder)
        state: State database (see weighTrack for details)
        id3: ID3 information, as provided by Mutagen
        easy: ID3 information, as provided by Mutagen.easyid3

        The base selector (this class) also populates the state database with
        some common information from the ID3 tags. This is documented with the
        rest of the state databse in the weighTrack function

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

        if 'albumartist' in easy:
            info['aartist'] = easy['albumartist'][0]
        else:
            info['aartist'] = info['artist']

        # Convert NN or NN/NN format into just a plain int
        if 'tracknumber' in easy:
            tracknum = easy['tracknumber'][0]
            tracknum = tracknum.partition( '/' )[0]
            tracknum = int( tracknum )
            info['track'] = tracknum
        else:
            tracknum = None
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

        # Create an index of tracks by album and track number
        index = (state.setdefault( 'trackindex', {} )
                 .setdefault( info['aartist'], {} )
                 .setdefault( info['album'], [] ))

        if tracknum and len( index ) < tracknum:
            index.extend( (None,) * (tracknum - len( index )))
        index[tracknum - 1] = track

    def preSelect( self, state ):
        """Perform any needed functions before selecting a track.

        The base selector (this class) does nothing here."""

        # Not doing any preselect tasks at the moment

    def weighTrack( self, track, state ):
        """Assign a priority and weight to a track

        Tracks with lower priority will always be rejected in facor of tracks with
        higher priority. Priority in this case is in ascending order: Priority 1 is
        higher than Priority 2.

        Tracks with a higher weight are more likely to be chosen than tracks with
        lower weight.

        Arguments:
        track -- Path to the track, relative to the library folder
        state -- The global state database

        The state database is a dict that contains the following:

        version: The version number of the file.
        time: The 'internal' time of the station, in seconds. This is not directly
            related to actual real world time, but is actually the number of
            seconds elapsed since the station started broadcasting. Each time a
            track is selected, this is updated based on the length of the
            track. A subsequent call to nextrak will behave as if the duration
            of the track has passed, whether or not that amount of real world
            time has passed. In this way, this script can be called repeatedly
            for testing purposes, and it will simulate an actual set of
            selections, regardless of 'real' time.
        files: A dict containing the files in the library. The key is the path to
            the file (relative to the library root). This is the same format as
            passed in the 'track' parameter, so one can simply refer to
            `state['files'][track]` to get the track's information.

            nextrak itself adds the following values:

            lastplay: The time the track was last played, in 'internal' time
            added: The time the track was added, in 'internal' time
            folders: A list of folders the track appears in. If it exists in the
                folder 'foo/bar', the list will contain ['foo', 'bar']
            modified: The time the file was last modified, in 'unix' time. Used by
                nextrak to detect when a file has been updated.
            len: The duration of the track in (fractional) seconds

            The base selector (this class) adds the following:

            artist: Performing artist
            album: Album track is from
            title: Name of the track
            track: Track number
            aartist: Album Artist. Usually this is either the same as the
              artist, or "Various Artists" in the case of compilation albums.
              If not present in the ID3 tags, set to the same as `artist`.
            skip: Whether this track is marked to never be played (boolean)
            follow: Whether this tracks follows another one (boolean)

            Any such details not in the ID3 tags will be filled with None.

        The base selector also adds the following:
            trackindex: A dict of artists, each containing a dict of albums, each
                containing an array of files on the album. This can be used to look
                up a file by album and track number, as used by the follow
                code. Note that this uses the Album Artist tag, to properly
                track songs on compilation albums.
            lastplay: A dict storing the last time a file in a given subfolder was
                played, in 'internal' time. These subfolders are the same
                folders as populate the 'folders' field in a track's info.
            artistlast: A dict storing the last time a file by a particular artist
                was played, in 'internal' time

        You can also add items to this dict as part of the selection (or pre- or
        post-selection) process. The only requirement is that the items added are
        properly JSON serializable.

        Return:
        A tuple containing priority and weight, in that order.

        The default selector returns a priority of 100 for tracks with the skip
        or follow tags, a priority of -5 for the next track in the queue, and 0
        otherwise. The default weight is 100.  
        """

        priority = 0
        weight = 100
        info = state['files'][track]

        # If a track is first in the queue, prioritize it
        queue = state.setdefault( 'queue', [] )
        if queue and queue[0] == track:
            return (-5, 100)

        # If a track is marked as 'skip', never play it
        if info['skip']:
            return (1000, 100)
        # 'follow' tracks are just skipped, as they're handled differently now
        if info['follow']:
            return (1000, 100)

        return (priority, weight)

    def postSelect( self, track, state ):
        """Perform any needed functions after selecting a track.

        track: The path to the file that was selected
        state: The state database

        Return:
        May be None, in which case the selected file will be played as expected.
        Otherwise, should be a list giving a set of files to be played as a unit.

        The base selector will return None if the selected track is not part of
        a follow group (as indicated by the Follow tags in the MP3 files).
        Otherwise, it will figure out what tracks should come next, gather them
        into a list, and return it. It will also remove the track from the
        queue if it was part of it, and updates the various default 'last
        played' entries
        """

        # Record the last time a track in a particular folder was played
        state.setdefault( 'lastplay', {} )

        for folder in state['files'][track]['folders']:
            state['lastplay'][folder] = state['time']

        info = state['files'][track]

        # Record the last time a track from this artist was played
        state.setdefault( 'artistlast', {} )[info['artist']] = state['time']

        # If this is top of queue, pop it
        queue = state.setdefault( 'queue', [] )
        if queue and queue[0] == track:
            queue.pop( 0 )

        # Check if this is the start of a follow group
        try:
            index = state['trackindex'][info['artist']][info['album']]
            i = info['track']
            if i and len( index ) > i and state['files'][index[i]]['follow']:
                group = [track]
                while len( index ) > i and state['files'][index[i]]['follow']:
                    group.append( index[i] )
                    i += 1
                return group
        except KeyError:
            # If there's no track number, this will fail. Just ignore it.
            pass


if __name__ == "__main__":
    main()

