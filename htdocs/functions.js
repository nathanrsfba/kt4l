const SITE = "KT4L";  // Site title
const ICECASTURL = "/radio"; // Base Icecast URL
// If you're not reverse-proxying the Icecast server, it will look
// something like the following:
// const ICECASTURL = "http://somedomain.com:someport";

const STREAMURL = `${ICECASTURL}/stream`;       // Stream URL
const STATURL = `${ICECASTURL}/status-json.xsl` // Status URL

var volume = 100; // Current volume, 0-100
var current = ''  // Current track

// Callback for when icecast metadata changes
const onMetadata = (metadata) => {
    if( current == metadata.StreamTitle ) return;
    if( current != '' ) pushRecent( current );
    current = metadata.StreamTitle;
    var artist = current.split( " - " )[0];
    var title  = current.split( " - " )[1];
    document.getElementById( "playinglabel" ).innerHTML = "Now Playing:";
    document.getElementById( "artist" ).innerHTML = artist;
    document.getElementById( "title" ).innerHTML = title;
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

    document.getElementById( "recentlabel" ).innerHTML = 
	"Recently played: ";
    recent1 = document.getElementById( "recent1" );
    recent2 = document.getElementById( "recent2" );
    recent3 = document.getElementById( "recent3" );

    recent3.innerHTML = recent2.innerHTML;
    recent2.innerHTML = recent1.innerHTML;
    recent1.innerHTML = track;

    document.getElementById( "recentbox" ).classList.add( "visible" );
}

// Clear the Recents list
function clearRecent()
{
    document.getElementById( "recentlabel" ).innerHTML = "";
    for( var i = 0; i < 3; i++ )
    {
	document.getElementById( `recent${i + 1}` ).innerHTML = "";
    }
    document.getElementById( "recentbox" ).classList.remove( "visible" );
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
    player.audioElement.volume = (volume / 100) ** 2;

    // console.log(volume)
    if( volume == 0 )
    {
	// document.getElementById( "volslid" ).innerHTML = " AUDIO MUTED".padEnd( vwidth );
    }
    else
    {
	document.getElementById( "volume" ).value = newVal;
    }
}

// Start or stop the audio
function playPause()
{
    // console.log( "We're in PlayPause" );
    if( player.state == "stopped" )
    {
	document.getElementById( "playicon" ).src = "pause.svg";
	document.getElementById( "playinglabel" ).innerHTML = "Loading...";
	if( "mediaSession" in navigator ) 
	{
	    navigator.mediaSession.metadata = new MediaMetadata({
		title: "Loading...",
		artist: "",
		album: SITE
	    });
	}
        // console.log( "Starting player..." );
	player.play();
        document.getElementById( "playingbox" ).classList.add( "visible" );
	clearRecent();
    }
    if( player.state == "playing" )
    {
	document.getElementById( "playicon" ).src = "play.svg";
	document.getElementById( "playinglabel" ).innerHTML = "";
	document.getElementById( "artist" ).innerHTML = "";
	document.getElementById( "title" ).innerHTML = "";
	document.title = `[${SITE}]`;
	player.stop();
        document.getElementById( "playingbox" ).classList.remove( "visible" );
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
		` Current Listeners: ${String( listeners )}`;
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

setVol( 50 )

// Bind media player keys to stream control
if( "mediaSession" in navigator ) 
{
    navigator.mediaSession.setActionHandler( "play", () => { playPause(); } );
    navigator.mediaSession.setActionHandler( "pause", () => { playPause(); } );
    navigator.mediaSession.setActionHandler( "stop", () => { playPause(); } );
}

// Bind volume slider
{
    var input = document.getElementById( "volume" );
    input.addEventListener("input", (event) => {
        setVol( Number( event.target.value )) } );
}

// Set up stats update callback
setInterval( updateStats, 30000 );

// Populate the intial stats info
updateStats();
