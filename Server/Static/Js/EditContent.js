document.addEventListener('DOMContentLoaded', function() {
    // Hide all forms
    document.querySelectorAll('.forms-content-page form').forEach(form => {
        form.style.display = 'none';
    });


    // Convert PascalCase to camelCase
    const toCamelCase = str => str.charAt(0).toLowerCase() + str.slice(1);


    // Show the form corresponding to content.type
    const formToShow = document.getElementById(`${toCamelCase(content.type)}Form`);
    if (formToShow) {
        formToShow.style.display = 'block';
    }


    document.getElementById('saveButton').addEventListener('click', function() {
        const formData = new FormData(formToShow);
        formData.append('id', content.id);
        
        fetch('/update_content', {
            method: 'POST',
            body: formData
        })

        const updatedToast = document.getElementById('updatedToast')
        const toastBootstrap = bootstrap.Toast.getOrCreateInstance(updatedToast)
        toastBootstrap.show()
    });
});