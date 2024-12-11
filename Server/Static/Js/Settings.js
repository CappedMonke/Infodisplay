document.getElementById('saveButton').addEventListener('click', function() {
    const formData = new FormData(document.getElementById('settingsForm'));

    fetch('/save_settings', {
        method: 'POST',
        body: formData
    })
});