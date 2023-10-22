/**
 * This script is run in the background and handles the following:
 * ------------------------------------
 * onMessage Listener: Handles messages sent from other scripts
 * - getLastActiveTabInfo: Returns the last active tab's information
 * - createContainer: Creates a new container
 * 
 * openHistoryForActiveTab: Opens the history view for the last active tab
 * - called from popup.js and keyboard shortcut
 * - opens a new popup window i.e history.html
 * - updates the lastActiveTabId variable to be used in the history.html script
 * 
 * onCommand Listeners: Handles keyboard shortcuts
 * 
 * createContainer: Creates a new container
 * - called from popup.js
 * - creates a new container and stores its information in local storage
 * - returns a boolean indicating success
 * 
 * onCompleted Listener: Handles history tracking
 * - called when a navigation is completed
 * - checks if the navigation occurred within a known container
 * - creates a new history entry and stores it in local storage
 * ------------------------------------ 
 */

// Set the browser extension icon
browser.action.setIcon({ path: "../icons/history-mod.png" });

// Variable to store the ID of the last active tab
let lastActiveTabId = null;

// --------------- onMessage Listener ---------------
// Handles messages sent from other scripts
browser.runtime.onMessage.addListener(async (message) => {
    try {
        switch(message.command){
            // Handle the request to get the last active tab's information
            case "getLastActiveTabInfo":
                const toSendLastActiveTabId = lastActiveTabId;
                lastActiveTabId = null; // Reset the lastActiveTabId after sending
                return { tabInfo: toSendLastActiveTabId };

            // Handle the request to create a new container
            case "createContainer":
                const success = await createContainer(message.name);
                return { success };

            // Handle unknown commands
            default:
                console.error('Unknown command received:', message.command);
                return { success: false, error: 'Unknown command' };
        }
    } catch (error) {
        // Log any errors that occur during message handling
        console.error('Error handling message:', message, 'Error:', error);
        return { success: false, error: error.message || 'Unknown error' };
    }
});

// --------------- Open HistoryForActive Function ---------------
// is a response to a call from popup.js or to the keyboard shortcut (see below and manifest.json)
async function openHistoryForActiveTab() {
    const [activeTab] = await browser.tabs.query({active: true, currentWindow: true});

    // Check if there is an active tab
    if (activeTab) {
        // Retrieve the container information for the active tab
        const storedData = await browser.storage.local.get(activeTab.cookieStoreId);
        const profileName = storedData[activeTab.cookieStoreId]?.profileName || "Unknown Profile";
        
        // If the active tab is within a known container, store its ID for later use
        if (profileName !== "Unknown Profile") {
            lastActiveTabId = storedData[activeTab.cookieStoreId].cookieStoreId;
        }
    }
    
    // Open the history view in a new popup window
    browser.windows.create({
        url: browser.runtime.getURL('../views/history.html'),
        type: "popup",
        height: 400,
        width: 600
    });
}

// --------------- OnCommand Listeners (i.e Keyboard Shortcut) ---------------
browser.commands.onCommand.addListener(async (command) => {
    if (command === "open_history") {
        await openHistoryForActiveTab();
    }
});


// --------------- Create Container Function ---------------
async function createContainer(name) {
    // Ensure that a name is provided
    if (!name) {
        console.error("Trying to create a container with no name!");
        return false;
    }

    try {
        // Create the new container
        const context = await browser.contextualIdentities.create({
            name: name,
            color: "blue",
            icon: "circle"
        });

        // Store the container's information
        const containerData = {
            [context.cookieStoreId]: {
                profileName: name,
                cookieStoreId: context.cookieStoreId
            }
        };

        await browser.storage.local.set(containerData);
        return true;
    } catch (error) {
        // Log any errors that occur during container creation
        console.error("Error in createContainer:", error);
        return false;
    }
}

// ----------------- History Tracking: onCompleted Listener -----------------
browser.webNavigation.onCompleted.addListener(async (details) => {
    // Ignore iframes, extension pages, and new tabs
    if (details.frameId !== 0 || details.url.startsWith('moz-extension:') || details.url === "about:newtab") {
        return;
    }

    const tab = await browser.tabs.get(details.tabId);
    const containerId = tab.cookieStoreId;
    
    // Retrieve the container information
    const storedData = await browser.storage.local.get();
    
    // If the navigation did not occur within a known container, do nothing
    if (!storedData[containerId]) {
        return;
    }
    
    const profileName = storedData[containerId].profileName;
    
    // Create a new history entry
    const historyEntry = {
        url: tab.url,
        title: tab.title,
        timestamp: Date.now(),
        profileName: profileName,
        cookieStoreId: containerId
    };

    // Retrieve the existing history, if any
    const historyData = await browser.storage.local.get("history");
    let history = historyData.history || {};

    // Add the new history entry
    history[containerId] = history[containerId] || [];
    history[containerId].push(historyEntry);
    await browser.storage.local.set({ history });
});
