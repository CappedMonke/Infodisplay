document.addEventListener('DOMContentLoaded', function() {
    // Hide all forms
    document.querySelectorAll('.forms-content-page form').forEach(form => {
        form.style.display = 'none';
    });


    // Hide the save button
    const saveButton = document.getElementById('saveButton');
    saveButton.style.display = 'none';


    // Show the form for the selected content type
    let formToShow = null;
    document.getElementById('contentTypeSelect').addEventListener('change', function() {
        if (formToShow !== null)
            formToShow.style.display = 'none';
        else
            saveButton.style.display = 'block';
        const contentType = document.getElementById('contentTypeSelect').value;
        formToShow = document.getElementById(`${contentType}ContentForm`);
        formToShow.style.display = 'block';
    });

    
    // Save the content
    saveButton.addEventListener('click', function() {
        const contentType = document.getElementById('contentTypeSelect').value;
        const capitalizedContentType = contentType.charAt(0).toUpperCase() + contentType.slice(1);
        const formData = new FormData(document.getElementById(`${contentType}ContentForm`));
        
        let contentDict = {};
        formData.forEach((value, key) => {
            if (key !== 'duration' && key !== 'title') {
                contentDict[key] = value;
            }
        });

        const data = {
            title: formData.get('title'),
            duration: formData.get('duration'),
            content: contentDict,
            type: `${capitalizedContentType}Content`
        };

        fetch('/add_content', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        
        const updatedToast = document.getElementById('updatedToast');
        const toastBootstrap = bootstrap.Toast.getOrCreateInstance(updatedToast);
        toastBootstrap.show();
    });
});

