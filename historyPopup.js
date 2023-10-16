document.addEventListener('DOMContentLoaded', async () => {
    const currentTab = await getCurrentTab();
    if (currentTab.cookieStoreId) {
        const history = await browser.storage.local.get(currentTab.cookieStoreId);
        displayHistory(history[currentTab.cookieStoreId] || []);
    }
});

function displayHistory(history) {
    const historyDiv = document.getElementById('historyList');
    history.forEach(url => {
        let urlDiv = document.createElement('div');
        urlDiv.textContent = url;
        historyDiv.appendChild(urlDiv);
    });
}

async function getCurrentTab() {
    let queryOptions = { active: true, currentWindow: true };
    let [tab] = await browser.tabs.query(queryOptions);
    return tab;
}
