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
let currentContent = null; // Define currentContent globally

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
    console.log("Current content:", currentContent);

    // Hide currently visible content
    if (currentlyVisibleContentContainer) {
        currentlyVisibleContentContainer.style.display = 'none';
        currentlyVisibleContentContainer.classList.add('d-none');
    }

    // Get the appropriate container for the given content type
    currentlyVisibleContentContainer = contentContainers[currentContent.type];
    
    if (currentlyVisibleContentContainer) {
        currentlyVisibleContentContainer.style.display = 'flex';
        currentlyVisibleContentContainer.classList.remove('d-none');

        switch (currentContent.type) {
            case 'TextContent':
                currentlyVisibleContentContainer.innerHTML = currentContent.content.text;
                break;
            case 'ImageContent':
                const imageElement = document.getElementById('imageElement');
                const imageUrl = `get_file/${currentContent.id}/${currentContent.content.files[0]}`;
                imageElement.src = imageUrl;
                break;
            case 'VideoContent':
                const videoElement = document.getElementById('videoElement');
                const videoUrl = `get_file/${currentContent.id}/${currentContent.content.files[0]}`;
                videoElement.src = videoUrl;
                videoElement.play(); // Video will only play if window is focused
                videoElement.controls = false; // Hide controls
                break;
            case 'PdfContent':
                const pdfUrl = `get_file/${currentContent.id}/${currentContent.content.files[0]}`;
                renderPdf(pdfUrl);
                break;
            // Add more cases as needed for other content types
            default:
                console.error("Undefined content type. Content: ", currentContent);
        }
        
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
        if (content.length > 0) {
            contentTimer = setTimeout(() => {
            showNextContent();
            startContentTimer();
            }, content[currentContentIndex].duration * 1000);
        }
    }
}

function renderPdf(url) {
    const pdfCanvas = document.getElementById('pdfCanvas');
    const pdfContext = pdfCanvas.getContext('2d');

    pdfjsLib.getDocument(url).promise.then(pdf => {
        pdf.getPage(1).then(page => {
            const viewport = page.getViewport({ scale: 1.5 });
            pdfCanvas.height = viewport.height;
            pdfCanvas.width = viewport.width;

            const renderContext = {
                canvasContext: pdfContext,
                viewport: viewport
            };
            page.render(renderContext);
        });
    });
}

/* -------------------------------------------------------------------------- */
/*                              DOMContentLoaded                              */
/* -------------------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', function() {
    console.log(content);
    console.log('socketIoUrl: ' + socketIoUrl)

    /* ------------------------------- Containers ------------------------------- */
    contentContainers = {
        'TextContent': document.getElementById('textContent'),
        'ImageContent': document.getElementById('imageContent'),
        'ImageTextContent': document.getElementById('imageTextContent'),
        'VideoContent': document.getElementById('videoContent'),
        'SlideshowContent': document.getElementById('slideshowContent'),
        'PdfContent': document.getElementById('pdfContent'),
        'ExcelContent': document.getElementById('excelContent'),
        'ProgramContent': document.getElementById('programContent'),
        'BirthdayContent': document.getElementById('birthdayContent'),
        'WeatherContent': document.getElementById('weatherContent'),
        'NewsContent': document.getElementById('newsContent'),
        'GameContent': document.getElementById('gameContent')
    };

    // Hide the navbar if showNavbar is set to off
    if (showNavbar === 'off') {
        document.querySelector('.base-navbar').style.display = 'none';
        document.querySelector('.below-navbar').style.marginTop = '0';
        document.querySelectorAll('.centered-content').forEach(element => {
            element.style.height = '100vh';
        });
    }

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
/*                                  SocketIO Server                           */
/* -------------------------------------------------------------------------- */
function connectSocketIo() {
    const socket = io(socketIoUrl);

    socket.on('connect', () => {
        console.log('Connected to SocketIO server');
    });
    
    socket.on('content_updated', (newContent) => {
        console.log('Content updated:', newContent);
        const wasContentEmpty = content.length === 0;
        const isContentEmpty = newContent.length === 0;
        content = newContent;

        // If content was empty and but now is not empty, start rendering
        if (wasContentEmpty && !isContentEmpty) {
            currentContentIndex = 0;
            renderContent();
        }
    });
    
    socket.on('disconnect', () => {
        console.log('Disconnected from SocketIO server');
    });
}
connectSocketIo();


/* -------------------------------------------------------------------------- */
/*                                  Websocket Gesture Recognition             */
/* -------------------------------------------------------------------------- */
let socket;
let reconnectInterval = 10000; // Time to wait before retrying (in milliseconds)
let maxRetries = 3;
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
            showPreviousContent();
        } else if (event.data === 'switch_content_next') {
            highlightButton('nextContentButton');
            showNextContent();
        } else if (event.data === 'toggle_freeze'){
            toggle_freeze();
        } else if (event.data === 'ok' && currentContent && currentContent.type === 'GameContent') {
            isFrozen = true;
            freezeButton.classList.remove('btn-dark');
            freezeButton.classList.add('btn-primary');
            if (contentTimer) {
                clearTimeout(contentTimer);
            }
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