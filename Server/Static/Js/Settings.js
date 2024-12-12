document.addEventListener('DOMContentLoaded', function() {
    // Save settings on button click
    document.getElementById('saveButton').addEventListener('click', function() {
        const formData = new FormData(document.getElementById('settingsForm'));
        const data = {};
        formData.forEach((value, key) => {
            data[key] = value;
        });

        fetch('/save_settings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
    });
});