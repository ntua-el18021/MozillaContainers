let containerHistories = {};

// Set the extension icon
browser.action.setIcon({ path: "icons/history-mod.png" });

// Create a new container.
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
            password: password
        };
        await browser.storage.local.set(containerData);
        return true; // Successfully created container and saved to storage
    } catch (error) {
        console.error("Error in createContainer:", error);
        return false; // Error occurred
    }
}

// Handle messages from popup.js
browser.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    if (message.command === "createContainer") {
        const success = await createContainer(message.name, message.password);
        if (success) {
            sendResponse({ success: true }); // Send success response to popup
        } else {
            sendResponse({ success: false }); // Send failure response to popup
        }
    }
    // Need to return true for asynchronous sendResponse usage
    return true; 
});
