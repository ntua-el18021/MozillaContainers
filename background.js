// Set the extension icon
browser.action.setIcon({ path: "icons/history-mod.png" });

browser.commands.onCommand.addListener((command) => {
    if (command === "open_history") {
        browser.windows.create({
            url: browser.runtime.getURL('history.html'),
            type: "popup",
            height: 400,
            width: 600
        });
    }
});

async function createContainer(name, password) {
    try {
        const context = await browser.contextualIdentities.create({
            name: name,
            color: "blue",
            icon: "circle"
        });
        let containerData = {};
        containerData[context.cookieStoreId] = {
            profileName: name,
            password: password,
            cookieStoreId: context.cookieStoreId
        };

        await browser.storage.local.set(containerData);
        return true; 
    } catch (error) {
        console.error("Error in createContainer:", error);
        return false; 
    }
}

browser.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    if (message.command === "createContainer") {
        try {
            await createContainer(message.name, message.password);
            sendResponse({ success: true });
        } catch (error) {
            sendResponse({ success: false, error: error.message });
        }
    }
    return true; 
});

browser.webNavigation.onCompleted.addListener(async (details) => {
    if (details.frameId !== 0 || details.url.startsWith('moz-extension:') || details.url === "about:newtab") {
        return;
    }
    
    const tab = await browser.tabs.get(details.tabId);
    console.log("Visited URL:", tab.url);

    const containerId = tab.cookieStoreId;
    const historyEntry = {
        url: tab.url,
        title: tab.title,
        timestamp: Date.now()
    };

    const historyData = await browser.storage.local.get("history");
    console.log('Retrieved History Data:', historyData);
    let history = historyData.history || {};

    history[containerId] = history[containerId] || [];
    history[containerId].push(historyEntry);
    await browser.storage.local.set({ history });
});
