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


// -------------- Execute Profile Deletion --------------
const executeProfileDeletion = async (selectedProfileKey, profiles) => {
    if (selectedProfileKey === "allProfiles") {
        if (!confirm("Are you sure you want to delete all profiles?")) return;

        const keysToDelete = profiles.map(profile => profile.key);
        for (let profile of profiles) {
            try {
                await browser.contextualIdentities.remove(profile.cookieStoreId);
            } catch (error) {
                console.error(`Failed to delete container with ID: ${profile.cookieStoreId}. Error: ${error.message}`);
            }
        }
        await browser.storage.local.remove(keysToDelete);
    } else {
        const profileToDelete = profiles.find(profile => profile.key === selectedProfileKey);
        if (!profileToDelete) {
            console.error("No profile found for the selected key. Cannot delete.");
            return;
        }
        await browser.contextualIdentities.remove(profileToDelete.cookieStoreId);
        await browser.storage.local.remove(selectedProfileKey);
    }
};

export {isNameExists, displayError, getExistingProfiles, populateDeleteDropdown, executeProfileDeletion};