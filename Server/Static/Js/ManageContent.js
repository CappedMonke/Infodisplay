document.addEventListener('DOMContentLoaded', function() {
    const sortableList = document.getElementById('sortableList');

    // Add content to the list
    content.forEach(item => {
        const div = document.createElement('div');
        div.className = 'list-group-item d-flex justify-content-between align-items-center';
        div.dataset.id = item.id; // Bind the item's id using a data attribute

        // Item title
        const titleSpan = document.createElement('span');
        titleSpan.textContent = item.title;
        div.appendChild(titleSpan);

        // Button group
        const buttonGroup = document.createElement('div');

        // Toggle Visibility Button
        const toggleVisibilityBtn = document.createElement('button');
        toggleVisibilityBtn.className = `btn ${item.visible ? 'btn-primary' : 'btn-outline-primary'} me-2`;
        toggleVisibilityBtn.innerHTML = `<i class="bi ${item.visible ? 'bi-eye' : 'bi-eye-slash'}"></i>`;
        toggleVisibilityBtn.title = 'Toggle Visibility';
        toggleVisibilityBtn.addEventListener('click', function () {
            item.visible = !item.visible;
            toggleVisibilityBtn.className = `btn ${item.visible ? 'btn-primary' : 'btn-outline-primary'} me-2`;
            toggleVisibilityBtn.innerHTML = `<i class="bi ${item.visible ? 'bi-eye' : 'bi-eye-slash'}"></i>`;
        });
        buttonGroup.appendChild(toggleVisibilityBtn);

        // Edit Content Button
        const editContentBtn = document.createElement('button');
        editContentBtn.className = 'btn btn-secondary me-2';
        editContentBtn.innerHTML = `<i class="bi bi-pencil"></i>`;
        editContentBtn.title = 'Edit Content';
        editContentBtn.addEventListener('click', function () {
            // Create form data
            const formData = new FormData();
            formData.append('id', item.id)

            // Send data to server
fetch('/edit_content', {
    method: 'POST',
    body: formData
})
.then(response => response.text())
.then(html => {
    // Replace part of the page with the returned HTML
    document.getElementById('content-container').innerHTML = html;
})
        });
        buttonGroup.appendChild(editContentBtn);

        // Delete Content Button
        const deleteContentBtn = document.createElement('button');
        deleteContentBtn.className = 'btn btn-danger';
        deleteContentBtn.innerHTML = `<i class="bi bi-trash"></i>`;
        deleteContentBtn.title = 'Delete Content';
        deleteContentBtn.addEventListener('click', function () {
            if (confirm('Soll dieser Inhalt wirklich gelöscht werden?')) {
                div.remove();
            }
        });
        buttonGroup.appendChild(deleteContentBtn);

        div.appendChild(buttonGroup);
        sortableList.appendChild(div);
    });


    // Initialize SortableJS
    Sortable.create(sortableList, {
        animation: 50,
        onEnd: function() {
            // Get the updated order of IDs
            const updatedOrder = Array.from(sortableList.children).map(child => child.dataset.id);

            // Create form data
            const formData = new FormData();
            updatedOrder.forEach(id => {
                formData.append('id_list', id);
            });

            // Send data to server
            fetch('/change_order', {
                method: 'POST',
                body: formData
            })
        }
    });
});
