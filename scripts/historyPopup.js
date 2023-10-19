(async function() {    
    // const currentTab = await getLastActiveTab();
    const storedData = await browser.storage.local.get();
    let lastActiveTabId="";
    console.log('popup requesting message');
    try {
        let response = await browser.runtime.sendMessage({command: "getLastActiveTabInfo"});
        console.log('response: ',response);
        lastActiveTabId = response.tabInfo;

        console.log('Last Active Tab:', lastActiveTabId);
        // Process the last active tab info as needed
        // ...
    } catch (error) {
        console.error('Error while fetching last active tab info:', error);
    }

    
    let allHistory = [];
    for (let profile in storedData.history) {
        console.log('profile: ', profile);
        console.log('lastActiveTabId: ', lastActiveTabId);
        if(profile==lastActiveTabId){
            allHistory.push(...storedData.history[profile]);
        }
    }
    
    function getProfileName(cookieStoreId) {
        if (storedData[cookieStoreId] && storedData[cookieStoreId].profileName) {
            return storedData[cookieStoreId].profileName;
        }
        return "Unknown Profile";
    }
    

    if (allHistory.length > 0) {
        displayHistory(allHistory, getProfileName);
    } else {
        console.log("No history found");
    }
})();

function displayHistory(history, getProfileNameFn) {
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

        let profileNameDiv = document.createElement('div');
        profileNameDiv.innerHTML = `<strong>Profile:</strong> ${getProfileNameFn(item.cookieStoreId)}`;
        itemDiv.appendChild(profileNameDiv);

        let date = new Date(item.timestamp);
        let formattedDate = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')} ${date.getHours() >= 12 ? 'PM' : 'AM'}`;
        let timestampDiv = document.createElement('div');
        timestampDiv.innerHTML = `<strong>Visited:</strong> ${formattedDate}`;
        itemDiv.appendChild(timestampDiv);

        historyDiv.appendChild(itemDiv);
    });
}

// async function getLastActiveTab() {
//     let queryOptions = { currentWindow: true };
//     let tabs = await browser.tabs.query(queryOptions);
//     if (tabs.length > 1) {
//         return tabs[tabs.length - 2];
//     }
//     return tabs[0];
// }
