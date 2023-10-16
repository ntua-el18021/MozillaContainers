let containerHistories = {};

async function addHistoryEntry(cookieStoreId, url) {
    if (!containerHistories[cookieStoreId]) {
        containerHistories[cookieStoreId] = [];
    }
    containerHistories[cookieStoreId].push(url);
    await browser.storage.local.set({ [cookieStoreId]: containerHistories[cookieStoreId] });
}

browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.url && tab.cookieStoreId) {
        await addHistoryEntry(tab.cookieStoreId, changeInfo.url);
    }
});
