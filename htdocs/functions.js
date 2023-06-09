var SITE = "KT4L";  // Site title
const ICECASTURL = "/radio"; // Base Icecast URL
// If you're not reverse-proxying the Icecast server, it will look
// something like the following:
// const ICECASTURL = "http://somedomain.com:someport";

var STREAMURL = `${ICECASTURL}/stream`;       // Stream URL
var STATURL = `${ICECASTURL}/status-json.xsl` // Status URL

var COOKIEEXP = 30; // Cookie shelf life in days

// If you want the player to support multiple stations, add them here, and the
// player titlebar will be converted to a dropdown that allows station selection.

/*
var stations = [
    { id: "kt4l", name: "Radio KT4L", url: "/radio/stream", stats: "/radio/status-json.xsl" },
    { id: "kt4lclassic", name: "KT4L Classic", url: "/radio3/stream", stats: "/radio3/status-json.xsl" },
    { id: "deliria", name: "Deliria Radio", url: "/radio2/stream", stats: "/radio2/status-json.xsl" }
];
*/

var volume = 100; // Current volume, 0-100
var current = ''  // Current track
var player = null;

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
function changeVol( delta, updateCookie=true ) 
{
    setVol( volume + delta, updateCookie );
}

// Set the volume to the given value
function setVol( newVal, updateCookie=true ) 
{
    volume = Math.floor( newVal );
    if( volume > 100 ) volume = 100;
    if( volume < 0 ) volume = 0;
    player.audioElement.volume = (volume / 100) ** 2;

    if( volume == 0 )
    {
	// document.getElementById( "volslid" ).innerHTML = " AUDIO MUTED".padEnd( vwidth );
    }
    else
    {
	document.getElementById( "volume" ).value = newVal;
    }

    if( updateCookie ) setCookie( "volume", `${volume}`, COOKIEEXP );
}

// Pause the audio
function pause()
{
    if( player.state != "stopped" )
    {
	document.getElementById( "playicon" ).src = "play.svg";
	document.getElementById( "playinglabel" ).innerHTML = "";
	document.getElementById( "artist" ).innerHTML = "";
	document.getElementById( "title" ).innerHTML = "";
	document.title = SITE;
	player.stop();
        document.getElementById( "playingbox" ).classList.remove( "visible" );
	pushRecent( current );
	current = "";
    }
}

// Start the audio
function play()
{
    if( player.state != "playing" )
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
	player.play();
        document.getElementById( "playingbox" ).classList.add( "visible" );
	clearRecent();
    }
}

// Play or Pause the audio
function playPause()
{
    if( player.state == "stopped" )
    {
        play();
    }
    else
    {
        pause();
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
	    var source = stats.icestats.source;
            /* If the server has more than one source, attempt to find the relevant
             * one by examining mount point */
            if( Array.isArray( source ))
            {
                var sources = source;
                source = null;
                thismount = STREAMURL.split( "/" ).slice( -1 )[0];

                for( i = 0; i < sources.length; i++ )
                {
                    mount = sources[i].listenurl.split( "/" ).slice( -1 )[0];
                    if( mount == thismount )
                    {
                        source = sources[i];
                        break;
                    }
                }
            }
            if( source )
            {
                var listeners = source.listeners;
                document.getElementById( "listeners" ).innerHTML = 
                    `Current Listeners: ${String( listeners )}`;
            }
            else
            {
                document.getElementById( "listeners" ).innerHTML = "";
            }
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

// Callback when selecting a station
function selectStation()
{
    select = document.getElementById( "station" );
    index = select.selectedIndex;

    if( index < 0 ) return;

    pause();

    SITE = stations[index].name;
    STREAMURL = stations[index].url;
    STATURL = stations[index].stats;

    initPlayer();
    updateStats();

    document.title = SITE;
    if( index > 0 || window.location.hash != "" )
    {
        window.location.hash = stations[index].id;
    }
}

// Initialize (or re-initialize) player
function initPlayer()
{
    player = 
        new IcecastMetadataPlayer( STREAMURL,
            { 
                metadataTypes: ["icy", "ogg"],
                onMetadata,
                onPlay
            }
        );
    changeVol( 0, false );
}

// Taken from https://www.w3schools.com/js/js_cookies.asp
function getCookie( cname ) 
{
    let name = cname + "=";
    let decodedCookie = decodeURIComponent( document.cookie );
    let ca = decodedCookie.split( ';' );
    for( let i = 0; i <ca.length; i++ ) 
    {
        let c = ca[i];
        while( c.charAt( 0 ) == ' ' ) 
        {
            c = c.substring( 1 );
        }
        if( c.indexOf(name) == 0 )
        {
            return c.substring( name.length, c.length );
        }
    }
    return "";
}

function setCookie( cname, cvalue, exdays ) 
{
      const d = new Date();
      d.setTime( d.getTime() + (exdays*24*60*60*1000) );
      let expires = d.toUTCString();
      document.cookie = `${cname}=${cvalue};expires=${expires};SameSite=strict`;
}

initPlayer();

volcookie = getCookie( "volume" );
if( volcookie == "" )
{
    setVol( 100 );
}
else
{
    setVol( +volcookie )
}

// Bind media player keys to stream control
if( "mediaSession" in navigator ) 
{
    navigator.mediaSession.setActionHandler( "play", () => { playPause(); } );
    navigator.mediaSession.setActionHandler( "pause", () => { playPause(); } );
    navigator.mediaSession.setActionHandler( "stop", () => { playPause(); } );
}

// Bind volume slider
var input = document.getElementById( "volume" );
input.addEventListener("input", (event) => {
    setVol( Number( event.target.value )) } );

// Set up stations list, if needed
if( typeof stations !== 'undefined' && stations.length > 1 )
{
    titlebar = document.getElementById( "stationtitle" );
    titlebar.innerHTML = "";

    select = document.createElement( 'select' );
    select.id = "station";

    index = 0;

    for( i = 0; i < stations.length; i++ )
    {
        option = document.createElement( 'option' );
        select.appendChild( option );
        option.value = stations[i].id;
        option.innerHTML = stations[i].name;

        hash = window.location.hash;
        if( hash != "" ) hash = hash.substr( 1 );
        if( hash == stations[i].id )
        {
            index = i;
        }
    }

    select.addEventListener( "change", selectStation );
    titlebar.appendChild( select );

    select.selectedIndex = index;

    selectStation();
}

// Set up stats update callback
setInterval( updateStats, 30000 );

// Populate the intial stats info
updateStats();
