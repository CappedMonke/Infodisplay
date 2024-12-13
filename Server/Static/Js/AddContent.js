document.addEventListener('DOMContentLoaded', function() {
    // Hide all forms
    document.querySelectorAll('.forms-content-page form').forEach(form => {
        form.style.display = 'none';
    });

    // Hide the save button
    const addButton = document.getElementById('addButton');
    addButton.style.display = 'none';

    // Show the form for the selected content type
    let formToShow = null;
    document.getElementById('contentTypeSelect').addEventListener('change', function() {
        // Reset all form data
        document.querySelectorAll('.forms-content-page form').forEach(form => {
            form.reset();
        });

        if (formToShow !== null)
            formToShow.style.display = 'none';
        else
            addButton.style.display = 'block';
        const contentType = document.getElementById('contentTypeSelect').value;
        formToShow = document.getElementById(`${contentType}ContentForm`);
        formToShow.style.display = 'block';
    });

    // Save the content
    addButton.addEventListener('click', function() {
        const contentType = document.getElementById('contentTypeSelect').value;
        const formElement = document.getElementById(`${contentType}ContentForm`);
        const formData = new FormData(formElement);
        const capitalizedContentType = contentType.charAt(0).toUpperCase() + contentType.slice(1) + 'Content';
        formData.append('type', capitalizedContentType);
        const id = crypto.randomUUID();
        formData.append('id', id);

        // Append file inputs to FormData
        formElement.querySelectorAll('input[type="file"]').forEach(input => {
            for (let i = 0; i < input.files.length; i++) {
                const file = input.files[i];
                const fileName = file.name.split('/').pop(); // Remove folder name
                if (contentType === 'slideshow' && file.type.startsWith('image/')) {
                    formData.append(input.name, file, fileName); // Only images are allowed in slideshows
                } else {
                    formData.append(input.name, file, fileName);
                }
            }
        });

        fetch('/add_content', {
            method: 'POST',
            body: formData // Send FormData directly
        })

        // Hide the addButton and reset the content type selection
        addButton.style.display = 'none';
        document.getElementById('contentTypeSelect').value = '';
        if (formToShow !== null) {
            formToShow.style.display = 'none';
            formToShow = null;
        }

        // Show success toast
        const updatedToast = document.getElementById('updatedToast');
        const toastBootstrap = bootstrap.Toast.getOrCreateInstance(updatedToast);
        toastBootstrap.show();
    });
});

