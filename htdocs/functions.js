const SITE = "KT4L";  // Site title
const WIDTH = 42;              // Player width in chars
/* Note that this is the width, minus the side borders, and minus 2 spaces on
 * each side. Code will adjust as necessary */
const STREAMURL = "/radio2/stream";       // Stream URL
const STATURL = "/radio2/status-json.xsl" // Status URL

var volume = 100; // Current volume, 0-100
var current = ''  // Current track

// Callback for when icecast metadata changes
const onMetadata = (metadata) => {
    if( current == metadata.StreamTitle ) return;
    if( current != '' ) pushRecent( current );
    current = metadata.StreamTitle;
    var artist = current.split( " - " )[0];
    var title  = current.split( " - " )[1];
    document.getElementById("artist").innerHTML = 
	` ${artist.padEnd( WIDTH + 1 )}`;
    document.getElementById("title").innerHTML  = 
	` ${title.padEnd( WIDTH + 1 )}`;
    document.title = `${metadata.StreamTitle} [${SITE}]`;
    if( "mediaSession" in navigator ) 
    {
	navigator.mediaSession.metadata = new MediaMetadata({
	    title: title,
	    artist: artist,
	    album: SITE
	});
    }
};

// Push given track onto the recently played list
function pushRecent( track )
{
    if( track == '' ) return;

    document.getElementById( "recenthead" ).innerHTML = 
	"Recently played: ".padEnd( WIDTH );
    recent1 = document.getElementById( "recent1" );
    recent2 = document.getElementById( "recent2" );
    recent3 = document.getElementById( "recent3" );

    recent3.innerHTML = recent2.innerHTML;
    recent2.innerHTML = recent1.innerHTML;
    recent1.innerHTML = track.substring( 0, WIDTH ).padEnd( WIDTH );
}

// Clear the Recents list
function clearRecent()
{
    document.getElementById( "recenthead" ).innerHTML = ' '.repeat( WIDTH );
    for( var i = 0; i < 3; i++ )
    {
	document.getElementById( `recent${i + 1}` ).innerHTML = ' '.repeat( WIDTH );
    }
}

// Callback for when keys pressed, to implement keyboard shortcuts
document.addEventListener( "keypress", (e) => {
    e = e || window.event;
    e.preventDefault();

    if( e.key == "+" || e.key == "=" )
    {
	changeVol( 5 );
    }
    if( e.key == "-" )
    {
	changeVol( -5 );
    }
    if( e.key == " " )
    {
	playPause();
    }
}, false );

// Change the volume by the given amount (signed)
function changeVol( delta ) 
{
    setVol( volume + delta );
}

// Set the volume to the given value
function setVol( newVal ) 
{
    volume = Math.floor( newVal );
    if( volume > 100 ) volume = 100;
    if( volume < 0 ) volume = 0;
    player.audioElement.volume = volume / 100;

    // console.log(volume)
    const vwidth = WIDTH - 12;
    if( volume == 0 )
    {
	document.getElementById( "volslid" ).innerHTML = " AUDIO MUTED".padEnd( vwidth );
    }
    else
    {
        var ptr = Math.floor( volume * (vwidth - 1) / 100 );
	document.getElementById( "volslid" ).innerHTML = 
	    `${"&#x2550;".repeat( ptr )}&#x256a;${"&#x2550;".repeat( vwidth - ptr - 1 )}`;
    }
}

// Start or stop the audio
function playPause()
{
    console.log( "We're in PlayPause" );
    if( player.state == "stopped" )
    {
	document.getElementById( "playing" ).innerHTML = "  &#x258c;&#x258c; ";
	document.getElementById( "artist" ).innerHTML = "  Loading..." + " ".repeat( WIDTH - 10 );
	if( "mediaSession" in navigator ) 
	{
	    navigator.mediaSession.metadata = new MediaMetadata({
		title: "Loading...",
		artist: "",
		album: SITE
	    });
	}
        console.log( "Starting player..." );
	player.play();
	clearRecent();
    }
    if( player.state == "playing" )
    {
	document.getElementById( "playing" ).innerHTML = "  &#x25ba;  ";
	document.getElementById( "artist" ).innerHTML = " ".repeat( WIDTH + 2 );
	document.getElementById( "title" ).innerHTML = " ".repeat( WIDTH + 2 );
	document.title = `[${SITE}]`;
	player.stop();
	pushRecent( current );
	current = "";
    }
}

// Update stats
function updateStats() {
    const xhr = new XMLHttpRequest();
    xhr.open( "GET", STATURL );
    xhr.send();
    xhr.responseType = "json";
    xhr.onload = () => {
	if( xhr.readyState == 4 && xhr.status == 200 ) 
	{
	    var stats = xhr.response;
	    var listeners = stats.icestats.source.listeners;
	    document.getElementById( "listeners" ).innerHTML = 
		` Current Listeners: ${String( listeners ).padEnd( WIDTH - 19 )}`;
	    // console.log( stats );
	} 
	else 
	{
	    document.getElementById( "listeners" ).innerHTML = "";
	    console.log( `Error: ${xhr.status}` );
	}
    };
}

// Callback when stream starts playing
function onPlay()
{
    updateStats();
}

// Initialize player
const player = 
    new IcecastMetadataPlayer( STREAMURL,
	{ 
	    metadataTypes: ["icy", "ogg"],
	    onMetadata,
	    onPlay
	}
    );


var stage = document.getElementById( 'volctl' ); // Volume slider canvas
var dragging = false; // Are we currently dragging the volume slider?

// Start dragging and set volume when slider clicked
stage.addEventListener( "mousedown", function( e ) {
    dragging = true;
    sliderClick( e );
}, true );

// Stop dragging when mouse released
stage.addEventListener( "mouseup", function( e ) {
    dragging = false;
}, true );

// Stop dragging when mouse leaves slider
stage.addEventListener( "mouseout", function( e ) {
    dragging = false;
}, true );

// Start dragging if mouse enters slider with buttons pressed
stage.addEventListener( "mouseover", function( e ) {
    if( e.buttons != 0 ) dragging = true;
}, true );

// Set volume if dragging over slider
stage.addEventListener( "mousemove", function( e ){
    if( !dragging ) return;

    sliderClick( e );
});

// Actually set volume when slider is clicked/dragged
function sliderClick( e ) 
{
    var context = stage.getContext( '2d' );
    if( !e ) e = window.event;
    var ctx = stage.getContext( "2d" );
    var x = e.offsetX == undefined ? e.layerX : e.offsetX;
    var slider = document.getElementById( 'volslid' );
    var width = stage.getBoundingClientRect().width;
    /*
	var left = Math.floor( x * 30 / width );
	var right = 29 - left;
	if( right < 0 ) right = 0;
	volslid.innerHTML = "=".repeat( left ) + "|" + "-".repeat( right );
	*/
    setVol( x * 100 / width );
    // player.audioElement.volume = volume / 100;
}

// Bind media player keys to stream control
if( "mediaSession" in navigator ) 
{
    navigator.mediaSession.setActionHandler( "play", () => { playPause(); } );
    navigator.mediaSession.setActionHandler( "pause", () => { playPause(); } );
    navigator.mediaSession.setActionHandler( "stop", () => { playPause(); } );
}

// Set up stats update callback
setInterval( updateStats, 30000 );

// Populate the intial stats info
updateStats();
