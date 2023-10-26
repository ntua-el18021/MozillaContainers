/**
 * The main popup script.
 * Most functions are  contained in this file (and the helperFunctions.js file)
 * However there are certain aspects covered in the background.js file
 * Those are:
 * - Creating a new container '(sendMessage(createContainer))'
 * - Opening the history for the last active tab 'openHistoryForActiveTab()' 
 */

import {isNameExists, displayError, getExistingProfiles, populateDeleteDropdown, executeProfileDeletion} from './helperFunctions.js'

// --------------- Cached DOM Elements ---------------

const mainView = document.getElementById('popupMainId');
const createView = document.getElementById('createProfilePageId');





const profileNameInput = document.getElementById('profileName');
const createProfileButton = document.getElementById('createProfile');
const profileSwitchSelect = document.getElementById('profileSwitchSelect');
const profileDeleteSelect = document.getElementById('profileDeleteSelect');
const deleteProfileButton = document.getElementById('deleteProfile');
const openHistoryButton = document.getElementById('openHistory');
const switchProfileButton = document.getElementById('switchProfile');


// --------------- Create Profile Handlers ---------------


const handleCreateProfile = () => {
    mainView.style.display = 'none';
    createView.style.display = 'block';
}
// const handleCreateProfile = async () => {
//     browser.windows.getCurrent().then((currentWindow) => {
//         const popupWidth = 400;
//         const assumedBookmarksBarHeight = 80; // This is a guess; you might need to adjust

//         const leftPosition = currentWindow.width - popupWidth -50;
//         const topPosition = assumedBookmarksBarHeight;

//         browser.windows.create({
//             url: browser.runtime.getURL('../../views/profile.html'),
//             type: "panel",
//             height: 420,
//             width: popupWidth,
//             left: leftPosition,
//             top: topPosition
//         });
//     });
// }


// const handleCreateProfile = async () => {
//     const profileName = profileNameInput.value.trim();
//     if (!profileName) return displayError("Name must be filled!");
//     if (await isNameExists(profileName)) return displayError("Name already exists!");

//     const response = await browser.runtime.sendMessage({ 
//         command: "createContainer", 
//         name: profileName,
//     });

//     if (response) populateDeleteDropdown();
// }

// --------------- Enter Key Handlers ---------------
const handleEnterKeyForProfile = (e) => {
    if (e.key === "Enter") {
        e.preventDefault();
        createProfileButton.click();
    }
};

// --------------- Switch Profile Handlers ---------------
const handleSwitchProfile = async () => {
    const selectedProfileKey = profileSwitchSelect.value;
    const profiles = await getExistingProfiles();

    if (profiles.length === 0) return displayError("No profiles to switch!");
    if (!selectedProfileKey) return displayError("Please select a profile to switch.");

    try {
        await browser.tabs.create({
            cookieStoreId: profiles.find(profile => profile.key === selectedProfileKey).cookieStoreId
        });
    } catch (error) {
        console.error("Error switching profile:", error);
        displayError("Failed to switch profile. Please try again.");
    }
};

// --------------- Delete Profile Handlers ---------------
const handleDeleteProfile = async () => {
    const selectedProfileKey = profileDeleteSelect.value;
    const profiles = await getExistingProfiles();

    if (profiles.length === 0) return displayError("No profiles to delete!");
    if (!selectedProfileKey) return;

    try {
        await executeProfileDeletion(selectedProfileKey, profiles);
        await populateDeleteDropdown();
    } catch (error) {
        console.error("Error deleting profile:", error);
        displayError("Failed to delete profile. Please try again.");
    }
};

// --------------- Open History Handlers ---------------
const handleOpenHistory = () => {
    openHistoryForActiveTab(); 
};


// --------------- Event Listeners ---------------
createProfileButton.addEventListener('click', handleCreateProfile);
profileNameInput.addEventListener('keydown', handleEnterKeyForProfile);
switchProfileButton.addEventListener('click', handleSwitchProfile);
deleteProfileButton.addEventListener('click', handleDeleteProfile);
openHistoryButton.addEventListener('click', handleOpenHistory);

// --------------- Initialization ---------------
populateDeleteDropdown();