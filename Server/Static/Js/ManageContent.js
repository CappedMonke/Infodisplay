document.addEventListener('DOMContentLoaded', function() {
    const sortableList = document.getElementById('sortableList');
    Sortable.create(sortableList, {
        animation: 50,
    });

    // Add content to the list
    content.forEach(item => {
        const div = document.createElement('div');
        div.className = 'list-group-item';
        div.textContent = item.title;
        sortableList.appendChild(div);
    });
});
