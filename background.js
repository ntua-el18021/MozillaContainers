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
    // console.log('Create container called for name: ', name);
    try {
        if (!name) {
            console.error("Trying to create a container with no name!");
            return;
        }
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
        // console.log('Container Created with ID: ', context.cookieStoreId);
        return true; 
    } catch (error) {
        console.error("Error in createContainer:", error);
        return false; 
    }
}

browser.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    if (message.command === "createContainer") {
        try {
            // console.log('Listener for Create Container called with message: ', message);
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
    // console.log("Visited URL:", tab.url);

    const containerId = tab.cookieStoreId;
    console.log('BACKGROUND-Completed loading for url for profile with id: ', containerId);
    // Retrieve the profile data from storage
    const storedData = await browser.storage.local.get();

    // Check if the navigation occurred within a known profile container
    if (!storedData[containerId]) {
        console.log("BACKGROUND-Navigation occurred in a non-profile-specific container:", containerId);
        console.log('BACKGROUND-This is its id: ', storedData[containerId].cookieStoreId);
        return;  // Skip recording this navigation
    }

    console.log('BACKGROUND-Navigation occured in PROFILE with id: ', storedData[containerId].cookieStoreId);
    console.log('BACKGROUND-Profile assumed named: ', storedData[containerId].profileName);
    
    let profileName = storedData[containerId].profileName
    // let profileName = storedData[containerId].profileName || "Unknown Profile";
    
    const historyEntry = {
        url: tab.url,
        title: tab.title,
        timestamp: Date.now(),
        profileName: profileName,  // Add profile name to the history entry
        cookieStoreId: containerId  // Add this line
    };

    const demoData = await browser.storage.local.get();
    console.log("BACKGROUND-Retrived local storage ALL: ", demoData)

    const historyData = await browser.storage.local.get("history");
    console.log('BACKGROUND-Retrieved History Data:', historyData);
    console.log('\n\n');
    let history = historyData.history || {};

    history[containerId] = history[containerId] || [];
    history[containerId].push(historyEntry);
    await browser.storage.local.set({ history });
});


