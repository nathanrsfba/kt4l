var volume = 100; // Current volume, 0-100

// Callback for when icecast metadata changes
const onMetadata = (metadata) => {
    var artist = metadata.StreamTitle.split( " - " )[0];
    var title  = metadata.StreamTitle.split( " - " )[1];
    document.getElementById("artist").innerHTML = 
	`${" ".repeat(2)}${artist}${" ".repeat((44-(artist.length)))}`;
    document.getElementById("title").innerHTML  = 
	`${" ".repeat(2)}${title}${" ".repeat((44-(title.length)))}`;
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
	    `${"=".repeat(Math.ceil(((volume/10)*3)-1))}|${"-".repeat(3*(10 - (volume/10)))}`;
    }
}

// Start or stop the audio
function playPause()
{
    if( player.state == "stopped" )
    {
	document.getElementById( "playing" ).innerHTML = " ||";
	document.getElementById("artist").innerHTML = "  Loading..." + " ".repeat( 34 );
	player.play();
    }
    if( player.state == "playing" )
    {
	document.getElementById( "playing" ).innerHTML = " [>";
	document.getElementById("artist").innerHTML = " ".repeat( 46 );
	document.getElementById("title").innerHTML = " ".repeat( 46 );
	document.title = "[Deliria Radio]";
	player.stop();
    }
}

// Initialize player
const player = 
    new IcecastMetadataPlayer( "/radio/stream",
	{ 
	    metadataTypes: ["icy", "ogg"],
	    onMetadata 
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
