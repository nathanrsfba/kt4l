# Deliria #
A website that runs music

# Structure #
The following folders will be found here:

* htdocs: Contains the web content that appears in the root of the web site. Apache (or whatever) should use this as the web root.
* configs: Configuration files for stuff like icecast and ezstream
* tools: Miscellaneous shell scripts and other tools for managing the station

Other stuff that lives here but isn't under version control:
* library: Music library, presumably in the form of MP3 files
* log: Log files.

# Software #

The following software is employed in the implementation of this project:

* Icecast
* EZStream
* lame
* Madplay
