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
            password: password,
            cookieStoreId: context.cookieStoreId
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
        try {
            await createContainer(message.name, message.password);
            sendResponse({ success: true });
        } catch (error) {
            sendResponse({ success: false, error: error.message });
        }
    }
    return true; 
});

