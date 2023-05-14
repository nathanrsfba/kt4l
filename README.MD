# KT4L #

A horribly overengineered, homegrown music broadcasting system, grown out of
the Deliria project

# Structure #
#
The following folders will be found here:

* htdocs: Contains the web content that appears in the root of the web site.
  Apache (or whatever) should use this as the web root.
* configs: Configuration files for stuff like icecast and ezstream
* tools: Miscellaneous shell scripts and other tools for managing the station.
  There is also a README file here documenting the individual tools.

Other stuff that lives here but isn't under version control:
* library: Music library, presumably in the form of MP3 files
* log: Log files.

# Software #

The following software is employed in the implementation of this project, and
is expected to be installed on the target server:

* Icecast
* EZStream
* lame
* mpg123
* sox

It also uses Perl, Python3 and Bash for scripting, but doesn't that come
standard nowadays?

It also uses the following Python modules:

* mutagen
* fasteners

The followng tools and scripts are included in this project:

* nextrak
* nextrak-kludge
* recode
* getmeta

Also included is Icecast Metadata Player v1.14.3, used for the web plaer.

# Installation #

1. Install the requisite software and modules listed above
2. Drop all these files into a directory on your server. The default configs
   expect it in /srv/kt4l but you can change this.
3. Set some passwords in configs/passwd.cfg.new, set it to **not
   world-readable**, and rename it to passwd.cfg
4. Edit settings.cfg, ezstream.xml, and icecast.xml and set the settings
   appropriate to your setup. The most common options are in settings.cfg, but
   you may want to consult the two .xml files for more advanced options.

   If you have multiple stations sharing configuration settings, you can
   symlink settings.cfg to a common configuration file, then add a 'local'
   configuration file to override it. The launch script will read anything with
   a .cfg extension, in asciibetical order, so name them accordingly.  
5. Make (or symlink) a directory called 'library' that has music in it
6. Run `tools/nextrak -u` to set up the database
7. To enable the web player, place the contents of htdocs into a folder on your
   web server, and edit functions.js to point to the Icecast server.

   If you have multiple stations running, you can configure the web player on a
   single instance to select between them. Just add the appropriate values to
   the (commented out by default) array at the top of functions.js. If more
   than one is running on the same server (meaning the status URLs for them
   will point to the same place) the web player will figure out what to do.

   Included in configs is an httpd.conf that sets up /srv/kt4l/htdocs as the
   web root, and reverse-proxies /radio to the localhost on port 7777 (the
   default port in the settings.) functions.js by default takes advantage of
   this setup. If you want to keep such a setup, edit httpd.conf with settings
   appropriate to your setup (and match the other settings in this setup), then
   include it from your main Apache confing.
8. The server should be ready to start. Run the tools/launch script to start
   it. launch takes RC-style 'start', 'stop', and 'restart' parameters (as well
   as 'status') and can be symlinked into an RC folder, and it should figure
   out what it needs to do.

# Overview #

The pipeline looks something like the following, from the top down:

* Icecast receives music from a source client, and broadcasts it out to
  listener clients. These could be the web player, standalone players like
  Winamp, etc.

* EZStream is the source client which sends music to Icecast. EZStream picks
  out some music, transcodes it to the configured MP3 bitrate, and sends it to
  Icecast.

* To pick a song, EZStream calls an external program to select a track to play
  next. Under the default configuration, it calls a script called
  nextrak-kludge, which is a front-end to a script called nextrak, which
  actually picks the next track. nextrak-kludge takes the track(s) returned by
  nextrak, symlinks it to a file, and returns it to EZStream. If nextrak
  selects a group of tracks to play together, these are saved to a playlist
  file, which will be referenced later in the pipeline. Furthermore, it calls a
  script called 'getmeta' which is used to provide metadata on the selected
  file(s) to EZStream.

  (As a side note: The reason nextrak doesn't just sequentially return each
  track in a group individually, is that this causes gaps in playback in
  between tracks, especially seeing as they're being run through some Sox
  filters, which causes discontinuities if they're all processed individually)

* nextrak is the script that selects the next track to play. It does most of
  the heavy lifting of this projcet. It keeps a database of files in the music
  library, and when called, assigns each track a priority and weight. It then
  takes the tracks with the highest priority rating, a makes a (weighted)
  random selection from them.

  Normally nextrak will just pick a single track and output it to stdout for
  EZStream. However, in some cases it may select a group of songs to play
  toghether as if they were a single track. (Imagine the layout of a lot of 70s
  prog rock albums where several tracks belong toghether, such as how Eclipse
  should invariably follow Brain Damage.) In either event, it will output the
  list of tracks to stdout. EZStream has no idea what to do with this, so
  nextrak-kludge saves these to a file so that scripts can pick them up later.

  The selection logic of nextrak lives in a separate file called selector.py.
  This is where any customizations to the selection algorithm should be made.

* Once a track has been selected, EZStream takes the selection and runs it
  through a transcoding process. Nominally, this passes the MP3 to Madplay to
  decode it, then re-encodes it to the specs required by the stream using Lame.
  In reality, this process is hijacked in order to insert some effects into the
  stream. To this end, EZStream is configured to run a script called 'recode'
  in place of the decode process.

  recode does a few things: 

  * First of all, it sends the tracks to mpg123 (rather than madplay) for
    decoding. If multiple tracks were selected in the previous steps, it sends
    them all to mpg123 in a single invocation.  mpg123's gapless playback
    feature (which madplay lacks) ensures they will be concatenated smoothly.
  * Next, it checks the ID3 tags for some custom tags telling it to trim the
    start and/or end of the file, and to fade it in and/or out at the start and
    end. It does the former by passing the appropriate parameters to mpg123 to
    start and end the decoding at the appropriate point, and the latter by
    sending the whole wad through Sox with appropriate fade parameters.
  * Finally, it runs everything through Sox with some predefined filters
    applied. Under the default configuration this is just a dynamic range
    compressor, making everything a relatively even volume. Other effects could
    be specified by changing the settings in the recode script.

* Once the audio has passed through recode, EZStream passes it into Lame to
  re-encode it to the appropriate specs. This part is standard for EZStream and
  no changes have been made.

* Once the track starts playing, EZStream calls an external script called
  'getmeta'. If a single track is playing, this is a straightforward process.
  If multiple tracks are being played as a group, however, EZStream has no idea
  that multiple tracks are being played, as nextrak and recode hide this magic
  'behind the curtain'. getmeta figures which track is currently playing, based
  on the current system time, the time the group started, and the duration of
  the songs.

  getmeta has an option to, under such conditions, send a signal to EZStream
  when the metadata needs updating. nextrak-kludge takes care of passing this
  option to getmeta when a track changes.

  nextrak-kludge calls getmeta

* This process then repeats for the next track.

## Radio Management Tags ##

The scripts used in this system recognize certain custom ID3v2 tags which tell
it how to process the files in the library. These all take the form of TXXX
(user-defined text fields) entries with the following descriptions and values:

* Start: The time to start the track from. This can be a number of seconds, or
  can be minutes and seconds in MM:SS format. For example, a value of 10 means
  to skip the first 10 seconds of the track.
* End: The time to stop playing the track. This can be an absolute time (so
  3:10 ends the song at the 3 minute and 10 second mark), or can be negative,
  which means it should end that many seconds from the end of the track. This
  is unaffected by the start time -- 3:10 means 3 minutes and 10 seconds from
  when the track starts, not from when the Start tag says playback should start
  at.
* FadeIn: The number of seconds to fade the track in at the start. If Start is
  specified, the fade in starts from the start time
* FadeOut: The number of seconds to gade the track out at the end. If End is
  specified, the fade out ends at the time specified.
* Skip: The track should never be selected for playback. This is a boolean
  value -- Any of the following values, case insensitive, are true: 1, y, yes,
  t, true, on. Anything else (or the absense of this tag) is considered false.
* Follow: This track is connected to the previous track on the album. It should
  never be played, unless the preceeding track has just played, in which case
  it should always play. Note that the preceeding track is determined using
  artist, album, and track number tags in the ID3 data. This is a boolean
  value, similar to the above.

Note that the descriptions of these tags are all case-sensitive.
