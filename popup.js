// Helper functions
async function isNameExists(name) {
    const existingProfiles = await browser.storage.local.get();
    for (let key in existingProfiles) {
        if (existingProfiles[key].profileName === name) {
            return true;
        }
    }
    return false;
}

function displayError(message) {
    const errorMsg = document.getElementById('errorMsg');
    errorMsg.innerText = message;
    errorMsg.style.display = "block";
}

function displayNamesPasswords(items) {
    const outputDiv = document.getElementById('namesPasswords');
    outputDiv.innerHTML = '';
    if (Object.keys(items).length === 0) {
        outputDiv.innerHTML = '<div>No profiles yet</div>';
    } else {
        for (let key in items) {
            const name = items[key].profileName;
            const password = items[key].password;
            outputDiv.innerHTML += `<div>Name: ${name}, Password: ${password}</div>`;
        }
    }
    outputDiv.style.display = 'block';
}

// Profile Creation functionality
document.getElementById('createProfile').addEventListener('click', async () => {
    const profileName = document.getElementById('profileName').value;
    const profilePassword = document.getElementById('profilePassword').value;

    if (!profileName) {
        displayError("Name must be filled!");
        return;
    }

    if (await isNameExists(profileName)) {
        displayError("Name already exists!");
        return;
    }

    const response = await browser.runtime.sendMessage({ 
        command: "createContainer", 
        name: profileName,
        password: profilePassword // <-- Send password to background script
    });

    if (response) {
        populateDeleteDropdown();
    }
});

document.getElementById('profileName').addEventListener('keydown', function(e) {
    if (e.key === "Enter") {
        document.getElementById('createProfile').click();
    }
});

document.getElementById('profilePassword').addEventListener('keydown', function(e) {
    if (e.key === "Enter") {
        document.getElementById('createProfile').click();
    }
});

// Show Names and Passwords
document.getElementById('showNamesPasswords').addEventListener('click', async () => {
    const items = await browser.storage.local.get();
    displayNamesPasswords(items);
});

// Populate the dropdown list with profile names for switching
async function populateSwitchDropdown() {
    const existingProfiles = await browser.storage.local.get();
    const profileSwitchSelect = document.getElementById('profileSwitchSelect');
    profileSwitchSelect.innerHTML = '';

    if (Object.keys(existingProfiles).length === 0) {
        let noProfileOption = document.createElement('option');
        noProfileOption.value = "";
        noProfileOption.innerText = "No profiles yet";
        profileSwitchSelect.appendChild(noProfileOption);
    } else {
        for (let key in existingProfiles) {
            let option = document.createElement('option');
            option.value = key;
            option.innerText = existingProfiles[key].profileName;
            profileSwitchSelect.appendChild(option);
        }
    }
}

// Switching profiles
document.getElementById('switchProfile').addEventListener('click', async () => {
    const selectedProfileKey = document.getElementById('profileSwitchSelect').value;
    const existingProfiles = await browser.storage.local.get();

    if (Object.keys(existingProfiles).length === 0) {
        displayError("No profiles to switch!");
        return;
    }

    if (!selectedProfileKey) {
        displayError("Please select a profile to switch.");
        return;
    }

    const selectedProfile = existingProfiles[selectedProfileKey];
    browser.tabs.create({
        cookieStoreId: selectedProfile.cookieStoreId
    });

    console.log("Switching to profile:", selectedProfile.profileName);
});

// Populate the dropdown list with profile names for deletion
async function populateDeleteDropdown() {
    const existingProfiles = await browser.storage.local.get();
    const profileDeleteSelect = document.getElementById('profileDeleteSelect');
    profileDeleteSelect.innerHTML = '';

    let allProfilesOption = document.createElement('option');
    allProfilesOption.value = "allProfiles";
    allProfilesOption.innerText = "All Profiles";
    profileDeleteSelect.appendChild(allProfilesOption);

    for (let key in existingProfiles) {
        let option = document.createElement('option');
        option.value = key;
        option.innerText = existingProfiles[key].profileName;
        profileDeleteSelect.appendChild(option);
    }

    populateSwitchDropdown();
}

// Profile deletion
document.getElementById('deleteProfile').addEventListener('click', async () => {
    const selectedProfileKey = document.getElementById('profileDeleteSelect').value;
    const existingProfiles = await browser.storage.local.get();

    if (Object.keys(existingProfiles).length === 0) {
        displayError("No profiles to delete!");
        return;
    }

    if (!selectedProfileKey) {
        console.log("No profile selected for deletion.");
        return;
    }

    if (selectedProfileKey === "allProfiles") {
        const confirmDelete = confirm("Are you sure you want to delete all profiles?");
        if (confirmDelete) {
            const keysToDelete = Object.keys(existingProfiles);
            for (let key of keysToDelete) {
                console.log("All existing profiles:", existingProfiles);
                console.log("Attempting to delete container with ID:", existingProfiles[key].cookieStoreId);
                // This line deletes the associated container for each profile
                try {
                    await browser.contextualIdentities.remove(existingProfiles[key].cookieStoreId);
                } catch (error) {
                    console.error(`Failed to delete container with ID: ${existingProfiles[key].cookieStoreId}. Error: ${error.message}`);
                }
                            }
            await browser.storage.local.remove(keysToDelete);
            displayNamesPasswords(await browser.storage.local.get());
        }    
    } else {
        console.log("Selected profile key:", selectedProfileKey);
        console.log("Profile data for selected key:", existingProfiles[selectedProfileKey]);
        const containerIdToDelete = existingProfiles[selectedProfileKey].cookieStoreId;
        if (!containerIdToDelete) {
            console.error("No container ID found for the selected profile. Cannot delete.");
            return;
        }
        console.log("Attempting to delete container with ID:", containerIdToDelete);
        await browser.contextualIdentities.remove(existingProfiles[selectedProfileKey].cookieStoreId); // <-- delete the associated container
        await browser.storage.local.remove(selectedProfileKey);
        displayNamesPasswords(await browser.storage.local.get());
    }

    populateDeleteDropdown();
});


// Initialize the dropdown list on popup load
populateDeleteDropdown();

// Open history in a new window
document.getElementById('openHistory').addEventListener('click', () => {
    browser.windows.create({
        url: browser.runtime.getURL('history.html'),
        type: "popup",
        height: 400,
        width: 600
    });
});

// Delete all containers
document.getElementById('deleteAllContainers').addEventListener('click', async () => {
    const confirmDelete = confirm("Are you sure you want to delete ALL containers?");
    if (confirmDelete) {
        const allContainers = await browser.contextualIdentities.query({});
        for (let container of allContainers) {
            await browser.contextualIdentities.remove(container.cookieStoreId);
        }
        const allProfileKeys = Object.keys(await browser.storage.local.get());
        await browser.storage.local.remove(allProfileKeys);
        populateDeleteDropdown();
        displayNamesPasswords(await browser.storage.local.get());
    }
});
