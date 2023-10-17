// --------------- Helper functions ---------------

async function isNameExists(name) {
    const existingProfiles = await browser.storage.local.get();
    return Object.values(existingProfiles).some(profile => profile.profileName === name);
}

function displayError(message) {
    const errorMsg = document.getElementById('errorMsg');
    errorMsg.innerText = message;
    errorMsg.style.display = "block";
}

function displayNamesPasswords(items) {
    // console.log('displayNamesPasswords -> found those items(all items in local): ', items);

    // Filter out items with keys that don't start with "firefox-container-"
    const profiles = Object.entries(items)
                            .filter(([key]) => key.startsWith("firefox-container-"))
                            .map(([key, value]) => value);
    
    // console.log('Profiles found in local: ', profiles);

    const outputDiv = document.getElementById('namesPasswords');
    outputDiv.innerHTML = profiles.length ? 
                          profiles.map(item => `<div>Name: ${item.profileName}, Password: ${item.password}</div>`).join('') :
                          '<div>No profiles yet</div>';
    outputDiv.style.display = 'block';
}


// --------------- Event Listeners ---------------

document.getElementById('createProfile').addEventListener('click', handleCreateProfile);
document.getElementById('profileName').addEventListener('keydown', handleEnterKeyForProfile);
document.getElementById('profilePassword').addEventListener('keydown', handleEnterKeyForProfile);
document.getElementById('showNamesPasswords').addEventListener('click', handleShowNamesPasswords);
document.getElementById('switchProfile').addEventListener('click', handleSwitchProfile);
document.getElementById('deleteProfile').addEventListener('click', handleDeleteProfile);
document.getElementById('openHistory').addEventListener('click', handleOpenHistory);
document.getElementById('deleteAllContainers').addEventListener('click', handleDeleteAllContainers);

async function handleCreateProfile() {
    // console.log('create profile called from popup');
    const profileName = document.getElementById('profileName').value;
    const profilePassword = document.getElementById('profilePassword').value;

    if (!profileName) return displayError("Name must be filled!");
    if (await isNameExists(profileName)) return displayError("Name already exists!");

    const response = await browser.runtime.sendMessage({ 
        command: "createContainer", 
        name: profileName,
        password: profilePassword 
    });

    if (response) populateDeleteDropdown();
}

function handleEnterKeyForProfile(e) {
    if (e.key === "Enter") document.getElementById('createProfile').click();
}

async function handleShowNamesPasswords() {
    displayNamesPasswords(await browser.storage.local.get());
}

async function handleSwitchProfile() {
    const selectedProfileKey = document.getElementById('profileSwitchSelect').value;
    const existingProfiles = await browser.storage.local.get();
    
    // Filtering based on the key pattern.
    const filteredProfiles = Object.keys(existingProfiles).filter(key => key.startsWith("firefox-container-"));
    
    if (!filteredProfiles.length) return displayError("No profiles to switch!");
    if (!selectedProfileKey) return displayError("Please select a profile to switch.");

    browser.tabs.create({
        cookieStoreId: existingProfiles[selectedProfileKey].cookieStoreId
    });
}


async function handleDeleteProfile() {
    const selectedProfileKey = document.getElementById('profileDeleteSelect').value;
    const existingProfiles = await browser.storage.local.get();
    
    // Filtering based on the key pattern.
    const filteredProfiles = Object.keys(existingProfiles).filter(key => key.startsWith("firefox-container-"));

    if (!filteredProfiles.length) return displayError("No profiles to delete!");
    if (!selectedProfileKey) return;

    // Code for handling deletion (extracted to keep things organized)
    // console.log('handleDeleteProfile -> found those profiles: ', filteredProfiles);
    await executeProfileDeletion(selectedProfileKey, existingProfiles);

    populateDeleteDropdown();
    displayNamesPasswords(await browser.storage.local.get());
}

function handleOpenHistory() {
    browser.windows.create({
        url: browser.runtime.getURL('history.html'),
        type: "popup",
        height: 400,
        width: 600
    });
}

async function handleDeleteAllContainers() {
    if (!confirm("Are you sure you want to delete ALL containers?")) return;

    const allContainers = await browser.contextualIdentities.query({});
    for (let container of allContainers) {
        await browser.contextualIdentities.remove(container.cookieStoreId);
    }
    await browser.storage.local.clear();
    populateDeleteDropdown();
    displayNamesPasswords(await browser.storage.local.get());
}

// --------------- Initialization ---------------

populateDeleteDropdown();

// --------------- Helper Functions for Deletion and Dropdowns (to further clean things up) ---------------

async function executeProfileDeletion(selectedProfileKey, existingProfiles) {
    if (selectedProfileKey === "allProfiles") {
        if (!confirm("Are you sure you want to delete all profiles?")) return;

        const keysToDelete = Object.keys(existingProfiles);
        for (let key of keysToDelete) {
            try {
                await browser.contextualIdentities.remove(existingProfiles[key].cookieStoreId);
            } catch (error) {
                console.error(`Failed to delete container with ID: ${existingProfiles[key].cookieStoreId}. Error: ${error.message}`);
            }
        }
        await browser.storage.local.remove(keysToDelete);
    } else {
        const containerIdToDelete = existingProfiles[selectedProfileKey].cookieStoreId;
        if (!containerIdToDelete) {
            console.error("No container ID found for the selected profile. Cannot delete.");
            return;
        }
        await browser.contextualIdentities.remove(containerIdToDelete);
        await browser.storage.local.remove(selectedProfileKey);
    }
}

async function populateDeleteDropdown() {
    const existingProfiles = await browser.storage.local.get();
    const profileDeleteSelect = document.getElementById('profileDeleteSelect');
    profileDeleteSelect.innerHTML = '';

    let allProfilesOption = document.createElement('option');
    allProfilesOption.value = "allProfiles";
    allProfilesOption.innerText = "All Profiles";
    profileDeleteSelect.appendChild(allProfilesOption);

    // Filtering based on the key pattern.
    for (let key in existingProfiles) {
        if (!key.startsWith("firefox-container-")) continue;
        
        let option = document.createElement('option');
        option.value = key;
        option.innerText = existingProfiles[key].profileName;
        profileDeleteSelect.appendChild(option);
    }

    populateSwitchDropdown();
}

async function populateSwitchDropdown() {
    const existingProfiles = await browser.storage.local.get();
    const profileSwitchSelect = document.getElementById('profileSwitchSelect');
    profileSwitchSelect.innerHTML = '';

    const filteredProfiles = Object.keys(existingProfiles).filter(key => key.startsWith("firefox-container-"));
    
    if (filteredProfiles.length === 0) {
        let noProfileOption = document.createElement('option');
        noProfileOption.value = "";
        noProfileOption.innerText = "No profiles yet";
        profileSwitchSelect.appendChild(noProfileOption);
    } else {
        for (let key in existingProfiles) {
            if (!key.startsWith("firefox-container-")) continue;
            
            let option = document.createElement('option');
            option.value = key;
            option.innerText = existingProfiles[key].profileName;
            profileSwitchSelect.appendChild(option);
        }
    }
}

