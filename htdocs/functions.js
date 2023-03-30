var volume = 100; // Current volume, 0-100
var current = ''  // Current track

// Callback for when icecast metadata changes
const onMetadata = (metadata) => {
    if( current != '' ) pushRecent( current );
    current = metadata.StreamTitle;
    var artist = current.split( " - " )[0];
    var title  = current.split( " - " )[1];
    document.getElementById("artist").innerHTML = 
	` ${artist.padEnd( 43 )}`;
    document.getElementById("title").innerHTML  = 
	` ${title.padEnd( 43 )}`;
    document.title = metadata.StreamTitle + " [Deliria Radio]";
    if( "mediaSession" in navigator ) 
    {
	navigator.mediaSession.metadata = new MediaMetadata({
	    title: title,
	    artist: artist,
	    album: "Deliria Radio"
	});
    }
};

// Push given track onto the recently played list
function pushRecent( track )
{
    if( track == '' ) return;

    document.getElementById( "recenthead" ).innerHTML = 
	"Recently played: ".padEnd( 42 );
    recent1 = document.getElementById( "recent1" );
    recent2 = document.getElementById( "recent2" );
    recent3 = document.getElementById( "recent3" );

    recent3.innerHTML = recent2.innerHTML;
    recent2.innerHTML = recent1.innerHTML;
    recent1.innerHTML = track.substring( 0, 42 ).padEnd( 42 );
}

// Clear the Recents list
function clearRecent()
{
    document.getElementById( "recenthead" ).innerHTML = ' '.repeat( 42 );
    for( var i = 0; i < 3; i++ )
    {
	document.getElementById( `recent${i + 1}` ).innerHTML = ' '.repeat( 42 );
    }
}

// Callback for when keys pressed, to implement keyboard shortcuts
document.onkeypress = function ( e ) {
    e = e || window.event;
    e.preventDefault();

    // use e.keyCode
    if( e.keyCode == 43 )
    {
	changeVol( -5 );
    }
    if (e.keyCode == 45 )
    {
	changeVol( 5 );
    }
    if( e.keyCode == 32 )
    {
	playPause();
    }
};

// Change the volume by the given amount (signed)
function changeVol( delta ) 
{
    setVol( volume - delta );
}

// Set the volume to the given value
function setVol( newVal ) 
{
    volume = Math.floor( newVal );
    if( volume > 100 ) volume = 100;
    if( volume < 0 ) volume = 0;
    player.audioElement.volume = volume / 100;

    // console.log(volume)
    if( volume == 0 )
    {
	document.getElementById( "volslid" ).innerHTML = " AUDIO MUTED                  ";
    }
    else
    {
	document.getElementById( "volslid" ).innerHTML = 
	    `${"&#x2550;".repeat(Math.ceil(((volume/10)*3)-1))}&#x256a;${"&#x2550;".repeat(3*(10 - (volume/10)))}`;
    }
}

// Start or stop the audio
function playPause()
{
    if( player.state == "stopped" )
    {
	document.getElementById( "playing" ).innerHTML = "  &#x258c;&#x258c; ";
	document.getElementById( "artist" ).innerHTML = "  Loading..." + " ".repeat( 32 );
	if( "mediaSession" in navigator ) 
	{
	    navigator.mediaSession.metadata = new MediaMetadata({
		title: "Loading...",
		artist: "",
		album: "Deliria Radio"
	    });
	}
	player.play();
	clearRecent();
    }
    if( player.state == "playing" )
    {
	document.getElementById( "playing" ).innerHTML = "  &#x25ba;  ";
	document.getElementById( "artist" ).innerHTML = " ".repeat( 44 );
	document.getElementById( "title" ).innerHTML = " ".repeat( 44 );
	document.title = "[Deliria Radio]";
	player.stop();
	pushRecent( current );
	current = "";
    }
}

// Update stats
function updateStats() {
    const xhr = new XMLHttpRequest();
    xhr.open( "GET", "/radio/status-json.xsl" );
    xhr.send();
    xhr.responseType = "json";
    xhr.onload = () => {
	if( xhr.readyState == 4 && xhr.status == 200 ) 
	{
	    var stats = xhr.response;
	    var listeners = stats.icestats.source.listeners;
	    document.getElementById( "listeners" ).innerHTML = 
		` Current Listeners: ${String( listeners ).padEnd( 23 )}`;
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
    new IcecastMetadataPlayer( "/radio/stream",
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
