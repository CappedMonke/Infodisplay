document.addEventListener('DOMContentLoaded', function() {
    // Hide all forms
    document.querySelectorAll('.forms-content-page form').forEach(form => {
        form.style.display = 'none';
    });


    
    // Show the form for the selected content type
    let formToShow = null;
    document.getElementById('contentTypeSelect').addEventListener('change', function() {
        const contentType = document.getElementById('contentTypeSelect').value;
        formToShow = document.getElementById(`${contentType}ContentForm`);
        formToShow.style.display = 'block';
    });


    

    document.getElementById('saveButton').addEventListener('click', function() {
        const formData = new FormData(formToShow);
        const contentType = document.getElementById('contentTypeSelect').value;
        const capitalizedContentType = contentType.charAt(0).toUpperCase() + contentType.slice(1);
        formData.append('type', `${capitalizedContentType}Content`);

        fetch('/add_content', {
            method: 'POST',
            body: formData
        })
        
        const updatedToast = document.getElementById('updatedToast');
        const toastBootstrap = bootstrap.Toast.getOrCreateInstance(updatedToast);
        toastBootstrap.show();
    });
});

