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
import { fetchAndDisplayHistory, populateProfileDropdown } from './historyFunctions.js';

 
// --------------- Cached DOM Elements ---------------
// document.querySelectorAll('.dateGroupToggle').forEach(button => {
//     button.addEventListener('click', () => {
//         const historyEntries = button.nextElementSibling;
//         historyEntries.style.display = historyEntries.style.display === 'none' ? 'block' : 'none';
//     });
// });



const profileCardElements = document.getElementById('createProfilePageId');

const mainView = document.getElementById('popupMainId');
const createView = document.getElementById('createProfilePageId');
const manageProfilesView = document.getElementById('manageProfilesPageId');
const containersListView = document.getElementById('containersListPageId');
const informationPageView = document.getElementById('informationPageId');
const historyPageView = document.getElementById('historyPageId');




const goToProfileViewButton = document.getElementById('goToProfileView');

const goToMainViewButton = document.getElementById('backButtonId');
const manageGoToMainViewButton = document.getElementById('manageBackButtonId');
const infoGoToMainViewButton = document.getElementById('infoViewBackButtonId');
const containersListGoToMainViewButton = document.getElementById('containersListeBackButtonId');
const historyGoToMainViewButton = document.getElementById('historyBackButtonId');



const createProfileButton = document.getElementById('createProfileOkButton');


const profileNameInput = document.getElementById('profileName');
// const profileSwitchSelect = document.getElementById('profileSwitchSelect');
// const profileDeleteSelect = document.getElementById('goToInfoView');
// const deleteProfileButton = document.getElementById('goToInfoView');
const openHistoryButton = document.getElementById('goToHistoryView');
// const switchProfileButton = document.getElementById('switchProfile');

const openInformationButton = document.getElementById('goToInformationView');
const goToCreateProfileManageProfiles = document.getElementById('manageCreateNewProfileId');


// Manage profiles
const goToManageProfiles = document.getElementById('manageProfiles');
// const deleteProfileButton = document.getElementById('deleteAllProfiles');


const alwaysOpenDiv = document.getElementById('alwaysOpenDivId');
const reopenInDiv = document.getElementById('reopenInDivId');




const profileCardQuerySelector = document.querySelector('.profile-card');
// -----------------------------------------------------------------------------------------------------------
// async function populateProfileDropdown() {
//     const profiles = await getExistingProfiles(); 
//     const dropdown = document.getElementById('profileSelect');

//     profiles.forEach(profile => {
//         const option = document.createElement('option');
//         option.value = profile.profileName;
//         option.text = profile.profileName;
//         dropdown.appendChild(option);
//     });

//     dropdown.addEventListener('change', async () => {
//         const selectedProfile = dropdown.value;
//         const historyEntries = await fetchHistory(selectedProfile);
//         displayHistory(historyEntries);
//     });
// }



// --------------- View Handlers ---------------

const handleGoToMainView = () => {
    mainView.style.display = 'block';
    createView.style.display = 'none';
    manageProfilesView.style.display = 'none';
    containersListView.style.display = 'none';
    informationPageView.style.display = 'none';
    historyPageView.style.display = 'none';
}
const handleGoToProfileView = () => {
    mainView.style.display = 'none';
    createView.style.display = 'block';
    manageProfilesView.style.display = 'none';
    containersListView.style.display = 'none';
    informationPageView.style.display = 'none';
    historyPageView.style.display = 'none';
}
const handleGoToManageProfiles = () => {
    mainView.style.display = 'none';
    createView.style.display = 'none';
    manageProfilesView.style.display = 'block';
    containersListView.style.display = 'none';
    informationPageView.style.display = 'none';
    historyPageView.style.display = 'none';
}
const handleGoToContainerListView = () => {
    mainView.style.display = 'none';
    createView.style.display = 'none';
    manageProfilesView.style.display = 'none';
    containersListView.style.display = 'block';
    informationPageView.style.display = 'none';
    historyPageView.style.display = 'none';
}
const handleGoToInformationView = () => {
    mainView.style.display = 'none';
    createView.style.display = 'none';
    manageProfilesView.style.display = 'none';
    containersListView.style.display = 'none';
    informationPageView.style.display = 'block';
    historyPageView.style.display = 'none';
}
const handleOpenHistoryView = async () => {
    // Switch to the history view.
    mainView.style.display = 'none';
    createView.style.display = 'none';
    manageProfilesView.style.display = 'none';
    containersListView.style.display = 'none';
    informationPageView.style.display = 'none';
    historyPageView.style.display = 'block';

    // Populates the profile dropdown; assumes this function is correctly implemented.
    await populateProfileDropdown(); // Make sure this function is defined in historyFunctions.js and properly imported.

    // Fetches the current tab's information to find the profile name; assumes permissions are set.
    const [currentTab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (currentTab) {
        const storedData = await browser.storage.local.get(currentTab.cookieStoreId);
        const profileName = storedData[currentTab.cookieStoreId]?.profileName || "Unknown Profile";

        // You need to replace the following console.log statement with a call to your actual
        // function that fetches and displays the history for this profile.
        console.log("Current profile name:", profileName); // Placeholder for actual function call
        // Example: await fetchAndDisplayHistoryForProfile(profileName); // Define this function
    }
};






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
// const handleOpenHistory = async () => {
//    await openHistoryForActiveTab(); 
// };


// ----------------- Views Event Handlers -----------------
goToProfileViewButton.addEventListener('click', handleGoToProfileView);
goToMainViewButton.addEventListener('click', handleGoToMainView);
manageGoToMainViewButton.addEventListener('click', handleGoToMainView);
infoGoToMainViewButton.addEventListener('click', handleGoToMainView);
containersListGoToMainViewButton.addEventListener('click', handleGoToMainView);
historyGoToMainViewButton.addEventListener('click', handleGoToMainView);

goToManageProfiles.addEventListener('click', handleGoToManageProfiles);
openInformationButton.addEventListener('click', handleGoToInformationView);
reopenInDiv.addEventListener('click', handleGoToContainerListView);
alwaysOpenDiv.addEventListener('click', handleGoToContainerListView);

goToCreateProfileManageProfiles.addEventListener('click', handleGoToProfileView);


// --------------- Event Listeners ---------------
createProfileButton.addEventListener('click', handleCreateProfile);
profileNameInput.addEventListener('keydown', handleEnterKeyForProfile);
// switchProfileButton.addEventListener('click', handleSwitchProfile);
// deleteProfileButton.addEventListener('click', handleDeleteProfile);
openHistoryButton.addEventListener('click', handleOpenHistoryView);

profileCardQuerySelector.addEventListener('click', handleProfileCardClick);
profileCardQuerySelector.addEventListener('focusin', handleProfileCardFocusIn);
profileCardQuerySelector.addEventListener('focusout', handleProfileCardFocusOut);


profileCardElements.addEventListener('click', handleProfileCardClick);
// --------------- Initialization ---------------
// populateDeleteDropdown();
populateContainerList();

export{handleSwitchProfile}