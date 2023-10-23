/**
 * Contains helper functions used in mainPopup.js
 * ----------------------------------------------
 * - isNameExists
 * - displayError
 * - getExistingProfiles
 * - populateDeleteDropdown
 * - populateSwitchDropdown
 * - closeTabsForProfile
 * - executeProfileDeletion
 * - deleteIndexedDBHistory
 * ----------------------------------------------
 */

// -------------- Helper Functions -------------- 
async function isNameExists(name) {
    const existingProfiles = await browser.storage.local.get();
    return Object.values(existingProfiles).some(profile => profile.profileName === name);
}


function displayError(message) {
    const errorMsg = document.getElementById('errorMsg');
    errorMsg.innerText = message;
    errorMsg.style.display = "block";
}


// -------------- Get Existing Profiles --------------
const getExistingProfiles = async () => {
    const existingProfiles = await browser.storage.local.get();
    return Object.keys(existingProfiles)
        .filter(key => key.startsWith("firefox-container-"))
        .map(key => ({ key, ...existingProfiles[key] }));
};


// -------------- Populate Dropdowns --------------
const populateDeleteDropdown = async () => {
    const profiles = await getExistingProfiles();
    profileDeleteSelect.innerHTML = '';

    let allProfilesOption = document.createElement('option');
    allProfilesOption.value = "allProfiles";
    allProfilesOption.innerText = "All Profiles";
    profileDeleteSelect.appendChild(allProfilesOption);

    profiles.forEach(profile => {
        let option = document.createElement('option');
        option.value = profile.key;
        option.innerText = profile.profileName;
        profileDeleteSelect.appendChild(option);
    });

    populateSwitchDropdown(profiles);
};


const populateSwitchDropdown = (profiles) => {
    profileSwitchSelect.innerHTML = '';

    if (profiles.length === 0) {
        let noProfileOption = document.createElement('option');
        noProfileOption.value = "";
        noProfileOption.innerText = "No profiles yet";
        profileSwitchSelect.appendChild(noProfileOption);
    } else {
        profiles.forEach(profile => {
            let option = document.createElement('option');
            option.value = profile.key;
            option.innerText = profile.profileName;
            profileSwitchSelect.appendChild(option);
        });
    }
};

/**
 *  Delete Profile Functions
 * - closeTabsForProfile
 * - executeProfileDeletion
 * - deleteIndexedDBHistory
 */
//----------------- Close Tabs for Profile -----------------
async function closeTabsForProfile(profileToDelete) {
    try {
        // Step 1: Get all open tabs
        const tabs = await browser.tabs.query({});

        const tabsToClose = [];

        for (const tab of tabs) {
            // Get stored data for the current tab
            const storedData = await browser.storage.local.get(tab.cookieStoreId);

            // Check if the tab is associated with the profile to delete
            const profileName = storedData[tab.cookieStoreId]?.profileName || "Unknown Profile";
            if (profileName === profileToDelete) {
                tabsToClose.push(tab.id);
            }
        }

        // Step 2: Close the tabs associated with the profile to delete
        if (tabsToClose.length) {
            await browser.tabs.remove(tabsToClose);
        }

    } catch (error) {
        console.error('Error while closing tabs for profile:', error);
    }
}

// -------------- Execute Profile Deletion --------------

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

        console.log("Profile(s) deleted successfully!");
    } catch (error) {
        console.error("Error deleting profile:", error);
        displayError("Failed to delete profile(s). Please try again.");
    }
};

const deleteIndexedDBHistory = async (profile) => {
    const dbName = profile.profileName;
    console.log('Deleting IndexedDB database:', dbName);
    return new Promise((resolve, reject) => {
        const request = indexedDB.deleteDatabase(dbName);
        request.onsuccess = () => {
            console.log(`IndexedDB database '${dbName}' deleted successfully.`);
            resolve();
        };
        request.onerror = () => {
            console.error(`Failed to delete IndexedDB database '${dbName}'.`);
            reject(request.error);
        };
    });
};


export {isNameExists, displayError, getExistingProfiles, populateDeleteDropdown, executeProfileDeletion};