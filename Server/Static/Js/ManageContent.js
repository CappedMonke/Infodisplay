document.addEventListener('DOMContentLoaded', function() {
    const sortableList = document.getElementById('sortableList');

    // Add content to the list
    content.forEach(item => {
        const div = document.createElement('div');
        div.className = 'list-group-item';
        div.textContent = item.title;
        div.dataset.id = item.id; // Bind the item's id using a data attribute
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
