/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */
// Highlight button on click
function highlightButton(buttonId) {
    const button = document.getElementById(buttonId);
    button.classList.remove('btn-dark');
    button.classList.add('btn-primary');
    setTimeout(() => {
        button.classList.remove('btn-primary');
        button.classList.add('btn-dark');
    }, 800); // Highlight for 500ms
}


// Toggle freeze
let isFrozen = false;
let freezeButton = null
function toggle_freeze() {
    isFrozen = !isFrozen;
    if (isFrozen) {
        freezeButton.classList.remove('btn-dark');
        freezeButton.classList.add('btn-primary');
        if (contentTimer) {
            clearTimeout(contentTimer);
        }
    } else {
        freezeButton.classList.remove('btn-primary');
        freezeButton.classList.add('btn-dark');
        startContentTimer();
    }
}


/* -------------------------------------------------------------------------- */
/*                               Render content                               */
/* -------------------------------------------------------------------------- */
let currentContentIndex = 0
function showNextContent(){
    currentContentIndex = (currentContentIndex + 1) % content.length
    renderContent()
}


function showPreviousContent(){
    currentContentIndex = (currentContentIndex - 1 + content.length) % content.length;
    renderContent()
}


let contentContainers = {}
let currentlyVisibleContentContainer = null
// Start the timer when content is rendered
function renderContent() {
    // Exit if there is no content
    if (content.length === 0) {
        console.log("No content to display");
        return;
    }

    currentContent = content[currentContentIndex];
    console.log(currentContent)

    // Hide currently visible content
    if (currentlyVisibleContentContainer) {
        currentlyVisibleContentContainer.style.display = 'none';
    }

    // Get the appropriate container for the given content type
    currentlyVisibleContentContainer = contentContainers[currentContent.type];
    
    if (currentlyVisibleContentContainer) {
        currentlyVisibleContentContainer.style.display = 'block';
        startContentTimer();
    } else {
        console.error("Undefined content type. Content: ", currentContent);
    }
}


let contentTimer = null;
function startContentTimer() {
    if (contentTimer) {
        clearTimeout(contentTimer);
    }

    if (!isFrozen) {
        contentTimer = setTimeout(() => {
            showNextContent();
            startContentTimer();
        }, content[currentContentIndex].duration * 1000);
    }
}


/* -------------------------------------------------------------------------- */
/*                              DOMContentLoaded                              */
/* -------------------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', function() {
    /* ------------------------------- Containers ------------------------------- */
    contentContainers = {
        'TextContent': document.getElementById('textContent'),
        'ImageContent': document.getElementById('imageContent'),
        'ImageTextContent': document.getElementById('imageTextContent'),
        'VideoContent': document.getElementById('videoContent'),
        'SlideshowContent': document.getElementById('slideshowContent'),
        'PDFContent': document.getElementById('pdfContent'),
        'ExcelContent': document.getElementById('excelContent'),
        'ProgramContent': document.getElementById('programContent'),
        'BirthdayContent': document.getElementById('birthdayContent'),
        'WeatherContent': document.getElementById('weatherContent'),
        'NewsContent': document.getElementById('newsContent'),
        'GameContent': document.getElementById('gameContent')
    };


    // Show first element of content list
    renderContent()


    /* ----------------------------- Navbar buttons ----------------------------- */
    // Show previous content on button click
    document.getElementById('previousContentButton').addEventListener('click', function() {
        showPreviousContent()
    });
    

    // Show next content on button click
    document.getElementById('nextContentButton').addEventListener('click', function() {
        showNextContent()
    });


    // Bind freeze button callback to toggle_freeze
    freezeButton = document.getElementById('toggleFreezeButton');
    freezeButton.addEventListener('click', toggle_freeze);
});


/* -------------------------------------------------------------------------- */
/*                                  Websocket                                 */
/* -------------------------------------------------------------------------- */
let socket;
let reconnectInterval = 10000; // Time to wait before retrying (in milliseconds)
let maxRetries = 6;
let retryCount = 0;
function connectWebSocket() {
    socket = new WebSocket('ws://localhost:5001');


    // Connection opened
    socket.addEventListener('open', () => {
        retryCount = 0;
    });


    // Handle messages from the server
    socket.addEventListener('message', (event) => {
        if (event.data === 'switch_content_previous') {
            highlightButton('previousContentButton');
        } else if (event.data === 'switch_content_next') {
            highlightButton('nextContentButton');
        } else if (event.data === 'toggle_freeze'){
            toggle_freeze()
        }
    });

    // Handle connection closure
    socket.addEventListener('close', () => {
        console.log('WebSocket connection closed');
        if (retryCount < maxRetries) {
            console.log(`Retrying connection in ${reconnectInterval / 1000} seconds...`);
            retryCount++;
            setTimeout(connectWebSocket, reconnectInterval);
        } else {
            console.error('Maximum reconnection attempts reached. Giving up.');
        }
    });
}
// Start the WebSocket connection
connectWebSocket();