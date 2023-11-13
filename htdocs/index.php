<html>
    <head>
	<title>Deliria Radio</title>
	<script src="icecast-metadata-player-1.14.3.min.js"></script>
	<script defer src="functions.js"></script>
	<link rel="stylesheet" href="style.css">
	<link rel="icon" type="image/x-icon" href="/icon.png">
	<meta name="viewport" content="width=device-width, initial-scale=1.0"> 
    </head>
    <body class="main">

	<pre class="player">
<span class="border">&#x2554;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550&#x2566;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2561;</span><span class="titlebar"> Deliria Player </span><span class="border">&#x255e;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2557;</span>
<span class="border">&#x2551;</span><span id="playing" onClick="playPause()">  &#x25ba;  </span><span class="border">&#x2551;</span> <span class="volbtn" onClick="changeVol(-5)"> &#x25bc; </span> <span id="volume"><canvas id="volctl"></canvas><span id="volslid">&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x256a;</span></span> <span class="volbtn" onClick="changeVol(5)"> &#x25b2; </span> <span class="border">&#x2551;</span>
<span class="border">&#x2560;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2569;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2563;</span>
<span class="border">&#x2551;</span>                                              <span class="border">&#x2551;</span>
<span class="border">&#x2551;</span> <span id="artist">                                            </span> <span class="border">&#x2551;</span>
<span class="border">&#x2551;</span> <span id="title">                                            </span> <span class="border">&#x2551;</span>
<span class="border">&#x2551;</span>                                              <span class="border">&#x2551;</span>
<span class="border">&#x2551;</span>  <span id="recenthead">                                          </span>  <span class="border">&#x2551;</span>
<span class="border">&#x2551;</span>  <span id="recent1">                                          </span>  <span class="border">&#x2551;</span>
<span class="border">&#x2551;</span>  <span id="recent2">                                          </span>  <span class="border">&#x2551;</span>
<span class="border">&#x2551;</span>  <span id="recent3">                                          </span>  <span class="border">&#x2551;</span>
<span class="border">&#x2551;</span>                                              <span class="border">&#x2551;</span>
<span class="border">&#x2551;</span> <span id="listeners">                                           </span>  <span class="border">&#x2551;</span>
<span class="border">&#x2551;</span>                                              <span class="border">&#x2551;</span>
<span class="border">&#x255a;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x2550;&#x255d;</span>
</pre>

	<div id="stats">
	</div>
	<div class="info">
	<pre class="sat">
         ooo
        / : \
       / o0o \
 _____"~~~~~~~"_____
 \+###|DELIRIA|###+/
  \...!(RADIO)!.../
   ^^^^o|   |o^^^^
+=====}:^^^^^:{=====+#
.____  .|!!!|.  ____.
|#####:/" " "\:#####|
|#####=|  O  |=#####|
|#####&lt;\_____/&gt;#####|
 ^^^^^   | |   ^^^^^
         o o
</pre>

	    <div class="about">
                Deliria is an online internet radio station run by Nathan
                Roberts	and Owen Rummage. It's a community project featuring
               	Nathan's tracker music collection. Tune in and listen to the
               	sound of the 90s on the internet with original mods from that
               	era, and beyond! Join us and just chill out!
	    </div>

            <pre class="news">
     __
  /\ \ \_____      _____ 
 /  \/ / _ \ \ /\ / / __|
/ /\  /  __/\ V  V /\__ \
\_\ \/ \___| \_/\_/ |___/
------------------------
The latest from the <a href="/blog" target="_blank">Blog</a></pre>

            <div class="news">
                <?php
                global $wpdb;
                define('WP_USE_THEMES', false);
                require('/srv/radio/deliria/htdocs/blog/wp-blog-header.php');
                query_posts('posts_per_page=3');
                ?>

                <?php while (have_posts()): the_post(); ?>
                <div class="post">
                <div class="title"><a href="<?php the_permalink(); ?>" class="red" target="_blank"><?php the_title(); ?></a>
                </div>
                <?php the_excerpt(); ?>
                <?php the_date( '', "<div class='date'>", "</div>" ); ?>
                </div>
                <?php endwhile; ?>
            </div>

	    <pre class="listen">
   __ _     _             
  / /(_)___| |_ ___ _ __  
 / / | / __| __/ _ \ '_ \ 
/ /__| \__ \ ||  __/ | | |
\____/_|___/\__\___|_| |_|
--------------------------
</pre>
	    <div class="listen">
		<p>
		There's a few options for listening to Deliria Radio. 
		You can listen using the web player above, or you can play it 
		in a media player app that supports streaming:

		<ul>
		    <li><a href="/radio/stream.m3u">M3U Link</a> 
			to open in your favorite media app</li>
		    <li><a href="/radio/stream.xspf">XSPF Link</a> 
			to open in your favorite media app</li>
		    <li><a href="/radio/stream">Listen</a> to the stream in your browser</li>
		    <li>Or copy the following URL into your media player: http://deliria.live:7777/stream</li>
		</ul>
		</p>
	    </div>

	    <pre class="stuff">
 __ _          __  __ 
/ _\ |_ _   _ / _|/ _|
\ \| __| | | | |_| |_ 
_\ \ |_| |_| |  _|  _|
\__/\__|\__,_|_| |_|  
----------------------
</pre>
	    <div class="stuff">

		<p>
		Check out our really crappy <a target="_blank"
		    href="/blog">blog</a>! Read about updates to the
		library, and some general information about the site, and
		tracker music in general
		</p>

		<p>
		You can view a <a target="_blank" href="/library">list of songs
		    currently in rotation</a>, and even download ones you like.
		</p>

                <!--
		<p>
		If you're a nerd and want to see some stats, you can view the
		<a target="_blank" href="http://deliria.live:49365">server
		status page</a>.
		</p>
                -->

		<p>
		Like what you're hearing? Check out <a target="_blank"
		    href="https://modarchive.org/">The Mod Archive</a> for a
		near-endless supply of more tracker music.
		</p>

		<p>
		This project is powered by the following software:

		<ul>
		    <li><a target="_blank" href="https://www.linux.org/">Linux</a>: Web site OS</li>
		    <li><a target="_blank" href="https://www.apache.org/">Apache</a>: Web server</li>
		    <li><a target="_blank" 
			    href="https://www.npmjs.com/package/icecast-metadata-player">icecast-metadata-player</a>:
			Web media player with metadata support</li>
		    <li><a target="_blank" href="https://github.com/libxmp/xmp-cli">XMP</A>:
			Decoding module files</li>
		    <li><a target="_blank" href="https://lame.sourceforge.io/">LAME</a>:
			Encoding MP3 files</li>
		    <li><a target="_blank" href="https://www.underbit.com/products/mad/">MAD</a>:
			Decoding MP3 files</li>
		    <li><a target="_blank" href="https://icecast.org/">Icecast</a>:
			Media streaming server</li>
		    <li><a target="_blank" href="https://icecast.org/ezstream/">EZStream</a>:
			Media broadcasting software</li>
		    <li><a target="_blank" 
			    href="https://int10h.org/blog/2018/05/flexi-ibm-vga-scalable-truetype-font/"</a>Flexi
			IBM VGA</a>: A VGA console-style font</li>
		</ul>
		</p>
	    </div>
	</div>

    </body>
</html>
