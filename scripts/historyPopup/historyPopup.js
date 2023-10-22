/**
 * On call of the history.html, this script will fetch the history for the last active tab
 * The info for the last active tab are logged in the background script
 * It will only show histories for profiles created from the addon
 */
(async function() {    
    const storedData = await browser.storage.local.get();
    let lastActiveTabId = "";

    try {
        const response = await browser.runtime.sendMessage({command: "getLastActiveTabInfo"});
        lastActiveTabId = response.tabInfo;
    } catch (error) {
        console.error('Error while fetching last active tab info:', error);
        return; // Exit the function if there was an error
    }

    const allHistory = storedData.history[lastActiveTabId] || [];
    const profileName = storedData[lastActiveTabId]?.profileName || "Unknown Profile";
    
    if (allHistory.length > 0) {
        displayHistory(allHistory, profileName);
    }
})();

// --------------- History HTML Populator  ---------------
function displayHistory(history, profileName) {
    const historyDiv = document.getElementById('historyList');
    historyDiv.textContent = '';  // Clear previous history

    history.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = "history-item";
        itemDiv.innerHTML = `
            <div><strong>URL:</strong> ${item.url}</div>
            <div><strong>Title:</strong> ${item.title}</div>
            <div><strong>Profile:</strong> ${profileName}</div>
            <div><strong>Visited:</strong> ${formatDate(item.timestamp)}</div>
        `;
        historyDiv.appendChild(itemDiv);
    });
}

function formatDate(timestamp) {
    const date = new Date(timestamp);
    const formattedDate = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')} ${date.getHours() >= 12 ? 'PM' : 'AM'}`;
    return formattedDate;
}
