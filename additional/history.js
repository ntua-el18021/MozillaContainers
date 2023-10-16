const containerSelect = document.getElementById('containerSelect');
const historyList = document.getElementById('historyList');

// Fetch histories from storage
browser.storage.local.get('containerHistories').then(data => {
    const containerHistories = data.containerHistories;

    // Populate the container dropdown
    for (let containerId in containerHistories) {
        const option = document.createElement('option');
        option.value = containerId;
        option.textContent = containerHistories[containerId].name;  // Use the friendly name
        containerSelect.appendChild(option);
    }

    // Update the history list when the dropdown changes
    containerSelect.addEventListener('change', (e) => {
        const selectedContainer = e.target.value;
        updateHistoryList(containerHistories[selectedContainer].history);  // Access the .history property
    });

    // Show the history for the first container by default
    if (Object.keys(containerHistories).length > 0) {
        updateHistoryList(containerHistories[Object.keys(containerHistories)[0]].history);
    }
})
.catch(error => {
    console.error('Error while fetching containerHistories:', error);
});

function updateHistoryList(history) {
    historyList.innerHTML = '';  // Clear previous entries

    for (let url of history) {
        const li = document.createElement('li');
        li.textContent = url;
        historyList.appendChild(li);
    }
}
