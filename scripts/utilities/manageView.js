import {populateContainerList} from '../utilities/general.js';


async function closeTabsForProfile(profileToDelete) {
    try {
        const tabs = await browser.tabs.query({});
        const tabsToClose = [];

        for (const tab of tabs) {
            const storedData = await browser.storage.local.get(tab.cookieStoreId);

            const profileName = storedData[tab.cookieStoreId]?.profileName || "Unknown Profile";
            if (profileName === profileToDelete) {
                tabsToClose.push(tab.id);
            }
        }
        if (tabsToClose.length) {
            await browser.tabs.remove(tabsToClose);
        }
    } catch (error) {
        console.error('Error while closing tabs for profile:', error);
    }
}

const deleteIndexedDBHistory = async (profile) => {
    const dbName = profile.profileName;
    return new Promise((resolve, reject) => {
        const request = indexedDB.deleteDatabase(dbName);
        request.onsuccess = () => {
            // console.log(`IndexedDB database '${dbName}' deleted successfully.`);
            resolve();
        };
        request.onerror = () => {
            console.error(`Failed to delete IndexedDB database '${dbName}'.`);
            reject(request.error);
        };
    });
};

const executeProfileDeletion = async (selectedProfileKey, profiles) => {
    try {
        if (selectedProfileKey === "allProfiles") {
            if (!confirm("Are you sure you want to delete all profiles?")) return;
            
            for (let profile of profiles) {
                await closeTabsForProfile(profile.profileName);
                await deleteIndexedDBHistory(profile);
                await browser.contextualIdentities.remove(profile.cookieStoreId);
                await browser.storage.local.remove(profile.key);
            }
        } else {
            const profileToDelete = profiles.find(profile => profile.key === selectedProfileKey);
            if (!profileToDelete) {
                throw new Error("No profile found for the selected key. Cannot delete.");
            }
            await closeTabsForProfile(profileToDelete.profileName);
            await deleteIndexedDBHistory(profileToDelete);
            await browser.contextualIdentities.remove(profileToDelete.cookieStoreId);
            await browser.storage.local.remove(selectedProfileKey);
        }

        // console.log("Profile(s) deleted successfully!");
    } catch (error) {
        console.error("Error deleting profile:", error);
        displayError("Failed to delete profile(s). Please try again.");
    }
};

const handleDeleteProfile = async () => {
    // const selectedProfileKey = profileDeleteSelect.value;
    const selectedProfileKey = "allProfiles";
    const profiles = await getExistingProfiles();

    if (profiles.length === 0) return displayError("No profiles to delete!");
    if (!selectedProfileKey) return;

    try {
        await executeProfileDeletion(selectedProfileKey, profiles);
        // await populateDeleteDropdown();
        await populateContainerList();  
    } catch (error) {
        console.error("Error deleting profile:", error);
        displayError("Failed to delete profile. Please try again.");
    }
};

