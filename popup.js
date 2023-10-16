// Attach an event listener to the 'createProfile' button
document.getElementById('createProfile').addEventListener('click', async () => {
    const errorMsg = document.getElementById('errorMsg');
    const profileName = document.getElementById('profileName').value;
    const password = document.getElementById('profilePassword').value;

    if (!profileName) {
        displayError("Name must be filled!");
        return;
    }

    if (await isNameExists(profileName)) {
        displayError("Name already exists!");
        return;
    }

    errorMsg.style.display = "none"; // Clear any previous error messages

    const response = await browser.runtime.sendMessage({ 
        command: "createContainer", 
        name: profileName, 
        password: password 
    });

    if (response === true) {
        populateDeleteDropdown();
    }
});

// Attach an event listener for 'Enter' key
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

// Attach an event listener to the 'showNamesPasswords' button
document.getElementById('showNamesPasswords').addEventListener('click', async () => {
    const items = await browser.storage.local.get();
    displayNamesPasswords(items);
});

// Populate the dropdown list with profile names
async function populateDeleteDropdown() {
    const existingProfiles = await browser.storage.local.get();
    const profileDeleteSelect = document.getElementById('profileDeleteSelect');
    profileDeleteSelect.innerHTML = '';

    // Add the "All Profiles" option
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
}

// Attach an event listener to the 'deleteProfile' button
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
            await browser.storage.local.remove(keysToDelete);
            displayNamesPasswords(await browser.storage.local.get());
        }
    } else {
        await browser.storage.local.remove(selectedProfileKey);
        displayNamesPasswords(await browser.storage.local.get());
    }

    populateDeleteDropdown();
});



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

    for (let key in items) {
        const name = items[key].profileName;
        const password = items[key].password;
        outputDiv.innerHTML += `<div>Name: ${name}, Password: ${password}</div>`;
    }

    outputDiv.style.display = 'block';
}

// Initialize the dropdown list on popup load
populateDeleteDropdown();
