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
        const formElement = document.getElementById(`${contentType}ContentForm`);
        const formData = new FormData(formElement);
        
        let contentDict = {};
        formData.forEach((value, key) => {
            if (key !== 'duration' && key !== 'title' && !(value instanceof File)) {
                contentDict[key] = value;
            }
        });

        const data = {
            id: crypto.randomUUID(),
            title: formData.get('title'),
            duration: formData.get('duration'),
            content: contentDict,
            type: `${capitalizedContentType}Content`
        };

        // Append file inputs to FormData
        formElement.querySelectorAll('input[type="file"]').forEach(input => {
            if (input.files.length > 0) {
                formData.append(input.name, input.files[0]);
            }
        });

        fetch('/add_content', {
            method: 'POST',
            body: formData // Send FormData directly
        })
        
        const updatedToast = document.getElementById('updatedToast');
        const toastBootstrap = bootstrap.Toast.getOrCreateInstance(updatedToast);
        toastBootstrap.show();
    });
});

