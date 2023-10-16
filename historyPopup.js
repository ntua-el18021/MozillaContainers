console.log("historyPopup.js loaded and executing...");

(async function() {    
    console.log("Fetching history for current container...");
    try {
        const currentTab = await getLastActiveTab();
        console.log("Current Tab URL:", currentTab.url);

        const historyData = await browser.storage.local.get("history");
        console.log("Stored History Data:", historyData);

        let allHistory = [];
        for (let profile in historyData.history) {
            allHistory.push(...historyData.history[profile]);
        }
        
        if (allHistory.length > 0) {
            console.log("Displaying all history...");
            displayHistory(allHistory);
        } else {
            console.log("No history found");
        }
    } catch (error) {
        console.error("Error fetching or displaying history:", error);
    }
})();




function displayHistory(history) {
    if (!history) return;

    const historyDiv = document.getElementById('historyList');
    historyDiv.innerHTML = '';  // Clear previous history

    history.forEach(item => {
        let itemDiv = document.createElement('div');
        itemDiv.className = "history-item";

        let urlDiv = document.createElement('div');
        urlDiv.innerHTML = `<strong>URL:</strong> ${item.url}`;
        itemDiv.appendChild(urlDiv);

        let titleDiv = document.createElement('div');
        titleDiv.innerHTML = `<strong>Title:</strong> ${item.title}`;
        itemDiv.appendChild(titleDiv);

        let date = new Date(item.timestamp);
        let formattedDate = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')} ${date.getHours() >= 12 ? 'PM' : 'AM'}`;
        let timestampDiv = document.createElement('div');
        timestampDiv.innerHTML = `<strong>Visited:</strong> ${formattedDate}`;
        itemDiv.appendChild(timestampDiv);

        historyDiv.appendChild(itemDiv);
    });
}

async function getLastActiveTab() {
    let queryOptions = { currentWindow: true };
    let tabs = await browser.tabs.query(queryOptions);
    // Assuming the active tab is the last one in the array. So, we return the second last.
    if (tabs.length > 1) {
        return tabs[tabs.length - 2];
    }
    // If there's only one tab, then return it.
    return tabs[0];
}


