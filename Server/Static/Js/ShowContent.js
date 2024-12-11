/* -------------------------------------------------------------------------- */
/*                                  Websocket                                 */
/* -------------------------------------------------------------------------- */
let socket;
let reconnectInterval = 10000; // Time to wait before retrying (in milliseconds)
let maxRetries = 10;
let retryCount = 0;
function connectWebSocket() {
    socket = new WebSocket('ws://localhost:9001');

    // Connection opened
    socket.addEventListener('open', () => {
        retryCount = 0;
    });

    // Handle messages from the server
    socket.addEventListener('message', (event) => {
        console.log('Message from server:', event.data);
    });

    // Handle connection errors
    socket.addEventListener('error', (error) => {
        console.error('WebSocket error:', error);
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


/* -------------------------------------------------------------------------- */
/*                              DOMContentLoaded                              */
/* -------------------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', function() {
    // Show previous content on button click
    document.getElementById('previousContentButton').addEventListener('click', function() {

    });
    
    // Show next content on button click
    document.getElementById('nextContentButton').addEventListener('click', function() {

    });


    let isFrozen = false;
    document.getElementById('toggleFreezeButton').addEventListener('click', function() {
        isFrozen = !isFrozen;
        const button = document.getElementById('toggleFreezeButton');
        if (isFrozen) {
            button.classList.remove('btn-dark');
            button.classList.add('btn-primary');
        } else {
            button.classList.remove('btn-primary');
            button.classList.add('btn-dark');
        }
    });
});