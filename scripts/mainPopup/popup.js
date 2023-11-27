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
import {  populateProfileDropdown , displayProfileHistory} from './historyFunctions.js';

import{} from './actionsFunctions.js'
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

document.getElementById('searchHistory').addEventListener('input', handleSearchHistory);

// ===========================================================
document.getElementById('containerSearchId').addEventListener('input', (event) => {
    filterContainerList(event.target.value, 'containerListId');
});

document.getElementById('manageProfilesSearchId').addEventListener('input', (event) => {
    filterContainerList(event.target.value, 'manageContainerListId');
});

document.getElementById('containersListViewSearchId').addEventListener('input', (event) => {
    filterContainerList(event.target.value, 'containersListViewId');
});

function filterContainerList(searchTerm, containerListId) {
    const searchLower = searchTerm.toLowerCase();
    const containerList = document.getElementById(containerListId);
    const containerDivs = containerList.querySelectorAll('div[data-key]'); // Assuming each container div has a data-key attribute

    containerDivs.forEach(div => {
        const profileName = div.querySelector('span').textContent.toLowerCase();
        if (profileName.includes(searchLower)) {
            div.style.display = ''; // Show the container
        } else {
            div.style.display = 'none'; // Hide the container
        }
    });
}




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

    // Fetches the current tab's information to find the profile name.
    const [currentTab] = await browser.tabs.query({ active: true, currentWindow: true });
    let profileName = "Unknown Profile";
    if (currentTab) {
        const storedData = await browser.storage.local.get(currentTab.cookieStoreId);
        profileName = storedData[currentTab.cookieStoreId]?.profileName || "Unknown Profile";
    }

    // Populate the dropdown and set the current profile as selected
    await populateProfileDropdown(profileName);

    // Fetch and display history for the current profile.
    await displayProfileHistory(profileName);
};

// ----------------- History Search -----------------
let initialGroupStates = {}; // Global variable to store initial group states

function findParentGroup(element) {
    // Helper function to find the parent group ID
    const groupDiv = element.closest('.historyGroup');
    if (groupDiv) {
        const checkbox = groupDiv.querySelector('.toggleCheckbox');
        return checkbox.id;
    }
    return null;
}

function handleSearchHistory(event) {
    const searchTerm = event.target.value.toLowerCase();
    const historyEntries = document.querySelectorAll('.historyEntry');
    const groupsToExpand = new Set(); 

    if (searchTerm && Object.keys(initialGroupStates).length === 0) {
        document.querySelectorAll('.historyGroup .toggleCheckbox').forEach(checkbox => {
            initialGroupStates[checkbox.id] = checkbox.checked;
        });
    }

    historyEntries.forEach(entry => {
        const title = entry.querySelector('a').textContent.toLowerCase();
        const url = entry.querySelector('a').href.toLowerCase();
        
        if (title.includes(searchTerm) || url.includes(searchTerm)) {
            entry.style.display = ''; 
            const parentGroupId = findParentGroup(entry);
            if (parentGroupId) {
                groupsToExpand.add(parentGroupId);
            }
        } else {
            entry.style.display = 'none'; 
        }
    });

    groupsToExpand.forEach(groupId => {
        const checkbox = document.getElementById(groupId);
        if (checkbox) {
            checkbox.checked = true;
        }
    });

    if (searchTerm === '') {
        for (const [groupId, isChecked] of Object.entries(initialGroupStates)) {
            const checkbox = document.getElementById(groupId);
            if (checkbox) {
                checkbox.checked = isChecked;
            }
        }
        initialGroupStates = {}; 
    }
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