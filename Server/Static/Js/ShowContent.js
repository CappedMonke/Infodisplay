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

function onVideoEnd() {
    if (isFrozen) {
        videoElement.play();
    } else {
        videoElement.removeEventListener('ended', onVideoEnd);
        showNextContent();
    }
}

// Toggle freeze
let isFrozen = false;
let freezeButton = null
function toggle_freeze() {
    isFrozen = !isFrozen;
    if (isFrozen) {
        freezeButton.classList.remove('btn-dark');
        freezeButton.classList.add('btn-primary');
        if (currentContent) {
            if (contentTimer) {
                clearTimeout(contentTimer);

                // Handle autoplay for videos when frozen
                if (currentContent.type === 'VideoContent') {
                    const videoElement = document.getElementById('videoElement');
                    // Only bind the event listener once
                    if (!videoElement.hasAttribute('data-ended-bound')) {
                        videoElement.addEventListener('ended', onVideoEnd);
                        videoElement.setAttribute('data-ended-bound', 'true');
                    }
                }
            }
            return;
        }
    } else if (currentContent.type !== 'VideoContent') {
        startContentTimer();
    }
    freezeButton.classList.remove('btn-primary');
    freezeButton.classList.add('btn-dark');
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

        // Cache-busting query parameter
        const cacheBuster = `?v=${new Date().getTime()}`;

        switch (currentContent.type) {
            case 'TextContent':
                currentlyVisibleContentContainer.innerHTML = currentContent.content.text;
                break;
            case 'ImageContent':
                const imageElement = document.getElementById('imageElement');
                const imageUrl = `get_file/${currentContent.id}/${currentContent.content.files[0]}${cacheBuster}`;
                if (imageElement.src !== imageUrl) {
                    imageElement.src = imageUrl;
                }
                break;
            case 'VideoContent':
                const videoElement = document.getElementById('videoElement');
                const videoUrl = `get_file/${currentContent.id}/${currentContent.content.files[0]}${cacheBuster}`;
                if (videoElement.src !== videoUrl) {
                    videoElement.src = videoUrl;
                    videoElement.play(); // Video will only play if window is focused
                }
                videoElement.controls = false; // Hide controls
                if (isFrozen) {
                    videoElement.addEventListener('ended', onVideoEnd);
                }
                break;
            case 'PdfContent':
                const pdfUrl = `get_file/${currentContent.id}/${currentContent.content.files[0]}`;
                renderPdf(pdfUrl);
                break;
            case 'SlideshowContent':
                const slideshowElement = document.getElementById('slideshowElement');
                let currentSlideIndex = 0;
                const updateSlide = () => {
                    const slideUrl = `get_file/${currentContent.id}/${currentContent.content.files[currentSlideIndex]}${cacheBuster}`;
                    if (slideshowElement.src !== slideUrl) {
                        slideshowElement.src = slideUrl;
                    }
                    currentSlideIndex = (currentSlideIndex + 1) % currentContent.content.files.length;
                };
                updateSlide();
                if (!slideshowElement.hasAttribute('data-interval-set')) {
                    setInterval(updateSlide, currentContent.content.duration_per_image * 1000);
                    slideshowElement.setAttribute('data-interval-set', 'true');
                }
                break;
            case 'ExcelContent':
                const excelUrl = `get_file/${currentContent.id}/${currentContent.content.files[0]}`;
                renderExcel(excelUrl);
                break;
            case 'ProgramContent':
                renderProgram();
                break;
            case 'BirthdayContent':
                const birthdayElement = document.getElementById('birthdayElement');
                birthdayElement.innerHTML = currentContent.content.text;
                break;
            case 'WeatherContent':
                const weatherElement = document.getElementById('weatherElement');
                weatherElement.innerHTML = currentContent.content.text;
                break;
            case 'NewsContent':
                const newsImage = document.getElementById('newsImage');
                const newsTitle = document.getElementById('newsTitle');
                const newsDescription = document.getElementById('newsDescription');                
                const newsQRCode = document.getElementById('newsQRCode');

                // Ensure current_index is initialized and incremented correctly
                if (typeof currentContent.current_index === 'undefined') {
                    currentContent.current_index = 0;
                } else {
                    currentContent.current_index = (currentContent.current_index + 1) % currentContent.content.articles.length;
                }

                const article = currentContent.content.articles[currentContent.current_index];
                newsImage.src = article.urlToImage;
                newsTitle.textContent = article.title;
                newsDescription.textContent = article.description;

                // Generate QR code for the article URL
                newsQRCode.innerHTML = '';
                new QRCode(newsQRCode, {
                    text: article.url,
                    width: 128,
                    height: 128
                });

                break;
            case 'GameContent':
                const gameElement = document.getElementById('gameElement');
                const gameUrl = `get_file/${currentContent.id}/${currentContent.content.html}${cacheBuster}`;
                if (gameElement.src !== gameUrl) {
                    gameElement.src = gameUrl;
                }
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
        if (content.length > 0) { // Only start the timer if there is more than one content element
            contentTimer = setTimeout(() => {
                showNextContent();
            }, content[currentContentIndex].duration * 1000);
        }
    }
}

let pdfRenderTask = null;

function renderPdf(url) {
    const pdfCanvas = document.getElementById('pdfCanvas');
    const pdfContext = pdfCanvas.getContext('2d');

    if (pdfRenderTask) {
        pdfRenderTask.cancel();
    }

    pdfjsLib.getDocument(url).promise.then(pdf => {
        pdf.getPage(1).then(page => {
            const viewport = page.getViewport({ scale: 1.5 });
            pdfCanvas.height = viewport.height;
            pdfCanvas.width = viewport.width;

            const renderContext = {
                canvasContext: pdfContext,
                viewport: viewport
            };
            pdfRenderTask = page.render(renderContext);
            pdfRenderTask.promise.then(() => {
                pdfRenderTask = null;
            }).catch(error => {
                if (error.name !== 'RenderingCancelledException') {
                    console.error('Error rendering PDF:', error);
                }
            });
        });
    });
}

function renderExcel(url) {
    const excelElement = document.getElementById('excelContent');
    fetch(url)
        .then(response => response.arrayBuffer())
        .then(data => {
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const html = XLSX.utils.sheet_to_html(worksheet, { id: "excelTable", editable: true });

            // Create a heading element
            const heading = document.createElement('h1');
            heading.textContent = currentContent.title;
            heading.classList.add('table-heading');
            heading.style.marginBottom = '32px'; // Add margin to the heading

            // Clear previous content and append the heading and table
            excelElement.innerHTML = '';
            excelElement.appendChild(heading);
            const tableContainer = document.createElement('div');
            tableContainer.classList.add('page-table-content');
            tableContainer.style.marginBottom = '32px'; // Add margin to the table
            tableContainer.innerHTML = html;
            excelElement.appendChild(tableContainer);

            // Add Bootstrap table classes and increase font size
            const table = document.getElementById('excelTable');
            if (table) {
                table.classList.add('table', 'table-striped', 'table-bordered');
                table.querySelectorAll('th').forEach(th => th.style.fontSize = '1.2em'); // Increase font size for header
                table.querySelectorAll('td').forEach(td => td.style.fontSize = '1.1em'); // Increase font size for body

                // Make the first row bold
                const firstRow = table.querySelector('tbody tr');
                if (firstRow) {
                    firstRow.querySelectorAll('td').forEach(td => td.style.fontWeight = 'bold');
                }
            }
        })
        .catch(error => console.error('Error rendering Excel:', error));
}

function renderProgram() {
    const programElement = document.getElementById('programContent');
    const programTable = currentContent.content.programTable;

    // Create a heading element
    const heading = document.createElement('h1');
    heading.textContent = currentContent.title;
    heading.classList.add('table-heading');
    heading.style.marginBottom = '32px'; // Add margin to the heading

    // Create a table element
    const table = document.createElement('table');
    table.id = 'programTable';
    table.classList.add('table', 'table-striped', 'table-bordered');
    table.style.marginBottom = '32px'; // Add margin to the table

    // Define the order of columns and their German translations
    const columns = [
        { key: 'time', label: 'Zeit' },
        { key: 'activity', label: 'Aktivität' },
        { key: 'location', label: 'Ort' },
        { key: 'notes', label: 'Anmerkungen' }
    ];

    // Create table header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    columns.forEach(column => {
        const th = document.createElement('th');
        th.textContent = column.label;
        th.style.fontSize = '1.2em'; // Increase font size for header
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Create table body
    const tbody = document.createElement('tbody');
    const rowCount = programTable[columns[0].key].length;
    for (let i = 0; i < rowCount; i++) {
        const row = document.createElement('tr');
        columns.forEach(column => {
            const td = document.createElement('td');
            td.textContent = programTable[column.key][i];
            td.style.fontSize = '1.1em'; // Increase font size for body
            row.appendChild(td);
        });
        tbody.appendChild(row);
    }
    table.appendChild(tbody);

    // Clear previous content and append the heading and table
    programElement.innerHTML = '';
    programElement.appendChild(heading);
    const tableContainer = document.createElement('div');
    tableContainer.classList.add('page-table-content');
    tableContainer.appendChild(table);
    programElement.appendChild(tableContainer);
}

/* -------------------------------------------------------------------------- */
/*                              DOMContentLoaded                              */
/* -------------------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', function() {
    console.log('RAW CONTENT:');
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

    const imageElement = document.getElementById('imageElement');
    const videoElement = document.getElementById('videoElement');
    const slideshowElement = document.getElementById('slideshowElement');

    if (imageElement) {
        imageElement.src += '?v=' + new Date().getTime();
    }

    if (videoElement) {
        videoElement.src += '?v=' + new Date().getTime();
    }

    if (slideshowElement) {
        slideshowElement.src += '?v=' + new Date().getTime();
    }

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
            if (!isFrozen) {
                toggle_freeze();
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