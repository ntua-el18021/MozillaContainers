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

const storeName = "history";

// --------------- Open IndexedDB ---------------
function openDatabase(dbName) {
    const version = 1;
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, version);
        // handle requests returned from the database
        request.onerror = function(event) {
            console.error("Database error: ", event.target.error);
            reject(event.target.error);
        };

        request.onsuccess = function(event) {
            resolve(event.target.result);
        };

        request.onupgradeneeded = function(event) {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(storeName)) {
                db.createObjectStore(storeName, { keyPath: "id", autoIncrement: true });
            }
        };
    });
}

// --------------- Add History Entry to IndexedDB ---------------
async function addHistoryEntry(dbName, historyEntry) {
    const db = await openDatabase(dbName);
    const transaction = db.transaction(storeName, 'readwrite');
    const objectStore = transaction.objectStore(storeName);
    const request = objectStore.add(historyEntry);
    
    return new Promise((resolve, reject) => {
        request.onsuccess = () => {
            resolve();
        };
    
        request.onerror = (event) => {
            reject(event.target.error);
        };
    });
}

// --------------- onMessage Listener ---------------
browser.runtime.onMessage.addListener(async (message) => {
    try {
        switch(message.command){
            case "getLastActiveTabInfo":
                const toSendLastActiveTabId = lastActiveTabId;
                lastActiveTabId = null;
                return { tabInfo: toSendLastActiveTabId };

            case "createContainer":
                const success = await createContainer(message.name);
                return { success };

            default:
                console.error('Unknown command received:', message.command);
                return { success: false, error: 'Unknown command' };
        }
    } catch (error) {
        console.error('Error handling message:', message, 'Error:', error);
        return { success: false, error: error.message || 'Unknown error' };
    }
});

// --------------- Open HistoryForActive Function ---------------
// Checks the current tab and opens the history view for its profile!
async function openHistoryForActiveTab() {
    const [activeTab] = await browser.tabs.query({active: true, currentWindow: true});
    if (activeTab) {
        const storedData = await browser.storage.local.get(activeTab.cookieStoreId);
        const profileName = storedData[activeTab.cookieStoreId]?.profileName || "Unknown Profile";
        if (profileName !== "Unknown Profile") {
            lastActiveTabId = storedData[activeTab.cookieStoreId].cookieStoreId;
        }
    }
    
    browser.windows.create({
        url: browser.runtime.getURL('../views/history.html'),
        type: "popup",
        height: 400,
        width: 600
    });
}

// --------------- OnCommand Listeners ---------------
browser.commands.onCommand.addListener(async (command) => {
    if (command === "open_history") {
        await openHistoryForActiveTab();
    }
});

// --------------- Create Container Function ---------------
async function createContainer(name) {
    if (!name) {
        console.error("Trying to create a container with no name!");
        return false;
    }

    try {
        const context = await browser.contextualIdentities.create({
            name: name,
            color: "blue",
            icon: "circle"
        });

        const containerData = {
            [context.cookieStoreId]: {
                profileName: name,
                cookieStoreId: context.cookieStoreId
            }
        };

        await browser.storage.local.set(containerData);
        
        // Try to open database for the container
        try {
            const dbName = name; // Use the container's name as the database name
            // console.log('Trying to create database for container:', name);
            const db = await openDatabase(dbName);
            // console.log("Database opened/created successfully for container:", name);
        } catch (error) {
            console.error("Error opening/creating database for container:", name, error);
        }
        
        return true;
    } catch (error) {
        console.error("Error in createContainer:", error);
        return false;
    }
}

// ----------------- History Tracking: onCompleted Listener -----------------
browser.webNavigation.onCompleted.addListener(async (details) => {
    if (details.frameId !== 0 || details.url.startsWith('moz-extension:') || details.url === "about:newtab") {
        return;
    }

    const tab = await browser.tabs.get(details.tabId);
    const containerId = tab.cookieStoreId;
    
    const storedData = await browser.storage.local.get();
    if (!storedData[containerId]) {
        return;
    }
    
    const profileName = storedData[containerId].profileName;
    const historyEntry = {
        url: tab.url,
        title: tab.title,
        timestamp: Date.now(),
        profileName: profileName,
        cookieStoreId: containerId
    };

    // Add history entry to IndexedDB
    const dbName = profileName;
    try {
        // console.log('Trying to add history entry for container:', dbName);
        await addHistoryEntry(dbName, historyEntry);
        // console.log("History entry added successfully");
    } catch (error) {
        console.error("Error adding history entry:", error);
    }
});
