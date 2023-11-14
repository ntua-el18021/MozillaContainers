/**
 * The main popup script.
 * Most functions are  contained in this file (and the helperFunctions.js file)
 * However there are certain aspects covered in the background.js file
 * Those are:
 * - Creating a new container '(sendMessage(createContainer))'
 * - Opening the history for the last active tab 'openHistoryForActiveTab()' 
 */

import {isNameExists, displayError,displayExistingProfileError, getExistingProfiles, executeProfileDeletion, populateContainerList, iconMapping} from './helperFunctions.js'
import {handleProfileCardFocusIn, handleProfileCardFocusOut, handleProfileCardClick} from './profileViewHandlerFunctions.js'


 
// --------------- Cached DOM Elements ---------------

const profileCardElements = document.getElementById('createProfilePageId');

const mainView = document.getElementById('popupMainId');
const createView = document.getElementById('createProfilePageId');
const manageProfilesView = document.getElementById('manageProfilesPageId');


const goToProfileViewButton = document.getElementById('goToProfileView');
const goToMainViewButton = document.getElementById('backButtonId');
const manageGoToMainViewButton = document.getElementById('manageBackButtonId');



const createProfileButton = document.getElementById('createProfileOkButton');


const profileNameInput = document.getElementById('profileName');
// const profileSwitchSelect = document.getElementById('profileSwitchSelect');
// const profileDeleteSelect = document.getElementById('goToInfoView');
// const deleteProfileButton = document.getElementById('goToInfoView');
const openHistoryButton = document.getElementById('goToHistoryView');
// const switchProfileButton = document.getElementById('switchProfile');

// Manage profiles
const goToManageProfiles = document.getElementById('manageProfiles');
const deleteProfileButton = document.getElementById('deleteAllProfiles');


const profileCardQuerySelector = document.querySelector('.profile-card');
// -----------------------------------------------------------------------------------------------------------




// --------------- View Handlers ---------------
const handleGoToProfileView = () => {
    mainView.style.display = 'none';
    createView.style.display = 'block';
    manageProfilesView.style.display = 'none';

}
const handleGoToMainView = () => {
    mainView.style.display = 'block';
    createView.style.display = 'none';
    manageProfilesView.style.display = 'none';

}
const handleGoToManageProfiles = () => {
    mainView.style.display = 'none';
    createView.style.display = 'none';
    manageProfilesView.style.display = 'block';
}






// --------------- Create Profile Handlers ---------------
const handleCreateProfile = async () => {
    const profileName = profileNameInput.value.trim();
    profileNameInput.value = '';
    if (!profileName) return displayExistingProfileError("Something is missing...");
    if (await isNameExists(profileName)) return displayExistingProfileError("Be more unique!");

    // Capture the selected color
    const selectedColorBehindElement = document.querySelector('.colorGroup .colors .colorWrapper .colorBehind.selected');

    let selectedColor = "blue"; // default color
    if (selectedColorBehindElement) {
        const associatedColorElement = selectedColorBehindElement.parentElement.querySelector('.color');
        if (associatedColorElement && associatedColorElement.id) {
            selectedColor = associatedColorElement.id;
        }
    }

    // Capture the selected icon
    const selectedIconElement = document.querySelector('.iconGroup .icons .material-icons.selected, .iconGroup .icons .material-symbols-outlined.selected');
    const selectedIcon = selectedIconElement ? selectedIconElement.textContent : "fingerprint"; // Using the icon's text content
    const containerIcon = iconMapping[selectedIcon];

    const response = await browser.runtime.sendMessage({ 
        command: "createContainer", 
        name: profileName,
        color: selectedColor,      
        icon: containerIcon         
    });
    if (response) {
        // populateDeleteDropdown();
        populateContainerList();
    }
    console.log('profile created: ', response, ' with name: ', profileName, ' color: ', selectedColor, ' icon: ', selectedIcon);
    resetSelections();
}

const resetSelections = () => {
    // Deselect colors
    document.querySelectorAll('.colorGroup .colors .colorBehind').forEach(el => el.classList.remove('selected'));
    // Deselect icons
    document.querySelectorAll('.iconGroup .icons .material-icons, .iconGroup .icons .material-symbols-outlined').forEach(el => el.classList.remove('selected'));
};

// --------------- Enter Key Handlers ---------------
const handleEnterKeyForProfile = (e) => {
    if (e.key === "Enter") {
        e.preventDefault();
        createProfileButton.click();
        resetSelections();
    }
};

// --------------- Switch Profile Handlers ---------------
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
manageGoToMainViewButton.addEventListener('click', handleGoToMainView);
goToManageProfiles.addEventListener('click', handleGoToManageProfiles);


// --------------- Event Listeners ---------------
createProfileButton.addEventListener('click', handleCreateProfile);
profileNameInput.addEventListener('keydown', handleEnterKeyForProfile);
// switchProfileButton.addEventListener('click', handleSwitchProfile);
deleteProfileButton.addEventListener('click', handleDeleteProfile);
openHistoryButton.addEventListener('click', handleOpenHistory);

profileCardQuerySelector.addEventListener('click', handleProfileCardClick);
profileCardQuerySelector.addEventListener('focusin', handleProfileCardFocusIn);
profileCardQuerySelector.addEventListener('focusout', handleProfileCardFocusOut);


profileCardElements.addEventListener('click', handleProfileCardClick);
// --------------- Initialization ---------------
// populateDeleteDropdown();
populateContainerList();

export{handleSwitchProfile}