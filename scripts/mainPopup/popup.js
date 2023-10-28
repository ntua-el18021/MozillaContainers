/**
 * The main popup script.
 * Most functions are  contained in this file (and the helperFunctions.js file)
 * However there are certain aspects covered in the background.js file
 * Those are:
 * - Creating a new container '(sendMessage(createContainer))'
 * - Opening the history for the last active tab 'openHistoryForActiveTab()' 
 */

import {isNameExists, displayError,displayExistingProfileError, getExistingProfiles, populateDeleteDropdown, executeProfileDeletion, populateContainerList} from './helperFunctions.js'

// --------------- Cached DOM Elements ---------------

const mainView = document.getElementById('popupMainId');
const createView = document.getElementById('createProfilePageId');


const goToProfileViewButton = document.getElementById('goToProfileView');
const goToMainViewButton = document.getElementById('backButtonId');


const createProfileButton = document.getElementById('createProfileOkButton');



const profileNameInput = document.getElementById('profileName');
// const profileSwitchSelect = document.getElementById('profileSwitchSelect');
// const profileDeleteSelect = document.getElementById('goToInfoView');
const deleteProfileButton = document.getElementById('goToInfoView');
const openHistoryButton = document.getElementById('goToHistoryView');
// const switchProfileButton = document.getElementById('switchProfile');



// --------------- View Handlers ---------------
const handleGoToProfileView = () => {
    mainView.style.display = 'none';
    createView.style.display = 'block';
}
const handleGoToMainView = () => {
    mainView.style.display = 'block';
    createView.style.display = 'none';
}



// --------------- Create Profile Handlers ---------------
const handleCreateProfile = async () => {
    const profileName = profileNameInput.value.trim();
    profileNameInput.value = '';
    if (!profileName) return displayExistingProfileError("Something is missing...");
    if (await isNameExists(profileName)) return displayExistingProfileError("Be more unique!");

    const response = await browser.runtime.sendMessage({ 
        command: "createContainer", 
        name: profileName,
    });

    if (response) {
        // populateDeleteDropdown();
        populateContainerList();
    }
    console.log('profile created: ', response, ' with name: ', profileName);

}

// --------------- Enter Key Handlers ---------------
const handleEnterKeyForProfile = (e) => {
    if (e.key === "Enter") {
        e.preventDefault();
        createProfileButton.click();
    }
};

// --------------- Switch Profile Handlers ---------------
// const handleSwitchProfile = async () => {
//     const selectedProfileKey = profileSwitchSelect.value;
//     const profiles = await getExistingProfiles();

//     if (profiles.length === 0) return displayError("No profiles to switch!");
//     if (!selectedProfileKey) return displayError("Please select a profile to switch.");

//     try {
//         await browser.tabs.create({
//             cookieStoreId: profiles.find(profile => profile.key === selectedProfileKey).cookieStoreId
//         });
//     } catch (error) {
//         console.error("Error switching profile:", error);
//         displayError("Failed to switch profile. Please try again.");
//     }
// };

const handleSwitchProfile = async (profileKey) => {
    const profiles = await getExistingProfiles();

    if (profiles.length === 0) return displayError("No profiles to switch!");
    if (!profileKey) return displayError("Please select a profile to switch.");

    try {
        await browser.tabs.create({
            cookieStoreId: profiles.find(profile => profile.key === profileKey).cookieStoreId
        });
    } catch (error) {
        console.error("Error switching profile:", error);
        displayError("Failed to switch profile. Please try again.");
    }
};


// --------------- Delete Profile Handlers ---------------
const handleDeleteProfile = async () => {
    console.log('Deleting profiles');
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

// --------------- Open History Handlers ---------------
const handleOpenHistory = async () => {
   await openHistoryForActiveTab(); 
};



// ----------------- Views Event Handlers -----------------
goToProfileViewButton.addEventListener('click', handleGoToProfileView);
goToMainViewButton.addEventListener('click', handleGoToMainView);

// --------------- Event Listeners ---------------
createProfileButton.addEventListener('click', handleCreateProfile);
profileNameInput.addEventListener('keydown', handleEnterKeyForProfile);
// switchProfileButton.addEventListener('click', handleSwitchProfile);
deleteProfileButton.addEventListener('click', handleDeleteProfile);
openHistoryButton.addEventListener('click', handleOpenHistory);

// --------------- Initialization ---------------
// populateDeleteDropdown();
populateContainerList();

export{handleSwitchProfile}