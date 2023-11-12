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
import { handleSwitchProfile } from "./popup.js";

// -------------- Mappings --------------
const reversedIconMapping = {
    "fingerprint": { icon: "fingerprint", class: "material-icons" },
    "briefcase": { icon: "work", class: "material-icons" },
    "dollar": { icon: "attach_money", class: "material-icons" },
    "cart": { icon: "shopping_cart", class: "material-icons" },
    "vacation": { icon: "flight_takeoff", class: "material-icons" },
    "gift": { icon: "card_giftcard", class: "material-icons" },
    "food": { icon: "restaurant", class: "material-icons" },
    "fruit": { icon: "nutrition", class: "material-symbols-outlined" },
    "pet": { icon: "pets", class: "material-icons" },
    "tree": { icon: "park", class: "material-symbols-outlined" },
    "chill": { icon: "eyeglasses", class: "material-symbols-outlined" },
    "fence": { icon: "fence", class: "material-symbols-outlined" }
};
const colorsMapping = {
    "blue": "#3498db",  // Removed the extra colon
    "turquoise": "#40E0D0",
    "green": "#2ecc71",
    "yellow": "#f1c40f",
    "orange": "#e67e22",
    "red": "#e74c3c",
    "pink": "#e84393",
    "purple": "#9b59b6"
};
const iconMapping = {
    "fingerprint": "fingerprint",
    "work": "briefcase",
    "attach_money": "dollar",
    "shopping_cart": "cart",
    "flight_takeoff": "vacation",
    "card_giftcard": "gift",
    "restaurant": "food",
    "nutrition": "fruit",
    "pets": "pet",
    "park": "tree",
    "eyeglasses": "chill",
    "fence": "fence"
};


// -------------- Helper Functions -------------- 
async function isNameExists(name) {
    const existingProfiles = await browser.storage.local.get();
    return Object.values(existingProfiles).some(profile => profile.profileName === name);
}
const getExistingProfiles = async () => {
    const existingProfiles = await browser.storage.local.get();
    return Object.keys(existingProfiles)
        .filter(key => key.startsWith("firefox-container-"))
        .map(key => ({ key, ...existingProfiles[key] }));
};


// -------------- Error Functions --------------
function displayExistingProfileError(message) {
    const errorMsg = document.getElementById('profileName');
    errorMsg.placeholder = message;
    setTimeout(() => {
        errorMsg.placeholder= "Profile Name";
    }, 6000);
}
function displayError(message) {
    console.log('Displaying error: ', message);
}


// ============= Populate Display =============
const populateContainerList = async () => {
    const profiles = await getExistingProfiles();
    const containerList = document.getElementById('containerListId');
    containerList.innerHTML = '';

    profiles.forEach(profile => {
        let containerDiv = document.createElement('div');
        containerDiv.setAttribute('data-key', profile.key); // Storing the profile key
        containerDiv.onclick = () => handleSwitchProfile(profile.key); // Adding click event to switch profile

        let iconElement = document.createElement('i');
        let mappedIcon = reversedIconMapping[profile.icon].icon || 'fingerprint';
        iconElement.className = reversedIconMapping[profile.icon].class;
        iconElement.textContent = mappedIcon;

        if (profile.color) {
            iconElement.style.color = colorsMapping[profile.color];
        }

        let iconWrapper = document.createElement('div');
        iconWrapper.className = 'icon-wrapper';
        iconWrapper.appendChild(iconElement);

        let spanElement = document.createElement('span');
        spanElement.textContent = profile.profileName; 

        containerDiv.appendChild(iconWrapper);
        containerDiv.appendChild(spanElement);

        containerList.appendChild(containerDiv);
    });
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


export {isNameExists, displayError, displayExistingProfileError, getExistingProfiles, executeProfileDeletion, populateContainerList, iconMapping};