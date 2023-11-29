import {isNameExists, displayError,displayExistingProfileError, getExistingProfiles, executeProfileDeletion, populateContainerList, iconMapping} from './helperFunctions.js'
import {handleProfileCardFocusIn, handleProfileCardFocusOut, handleProfileCardClick} from './profileViewHandlerFunctions.js'
import {  populateProfileDropdown , displayProfileHistory} from './historyFunctions.js';
import { handleCreateProfile, handleEnterKeyForProfile, handleSwitchProfile, filterContainerList, handleSearchHistory} from './actionsHandlers.js'


// --------------- Global Variables ---------------
let openInSelectedProfile = false;
let initialGroupStates = {};

// --------------- Views Dom Elements ---------------
const mainView = document.getElementById('popupMainId');
const createView = document.getElementById('createProfilePageId');
const manageProfilesView = document.getElementById('manageProfilesPageId');
const containersListView = document.getElementById('containersListPageId');
const informationPageView = document.getElementById('informationPageId');
const historyPageView = document.getElementById('historyPageId');


// --------------- Load HTML ---------------
if (document.readyState === 'loading') {
    console.log('1');
    document.addEventListener('DOMContentLoaded', afterDOMLoaded);
} else {
    console.log('2');
    // The DOMContentLoaded event has already fired
    afterDOMLoaded();
}

async function afterDOMLoaded() {
    function loadHTML(url, containerId) {
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}, when loading ${url}`);
                }
                return response.text();
            })
            .then(data => {
                document.getElementById(containerId).innerHTML = data;
            })
            .catch(error => {
                console.error('Error loading the HTML file:', error, ' for div: ', containerId);
            });
    }
    try {
        loadHTML("../../views/mainView.html", "popupMainId");
        loadHTML("../../views/createView.html", "createProfilePageId");
        loadHTML("../../views/informationView.html", "informationPageId");
        loadHTML("../../views/listView.html", "containersListPageId");
        loadHTML("../../views/historyView.html", "historyPageId");
        loadHTML("../../views/manageView.html", "manageProfilesPageId");

        console.log('Views loaded successfully.');
    } catch (error) {
        console.error('Error loading views:', error);
    }

    // populateContainerList();
    // handleGoToMainView();
};

// --------------- DOM Elements ---------------
const profileCardElements = document.getElementById('createProfilePageId');
const goToProfileViewButton = document.getElementById('goToProfileView');
const goToMainViewButton = document.getElementById('backButtonId');
const manageGoToMainViewButton = document.getElementById('manageBackButtonId');
const infoGoToMainViewButton = document.getElementById('infoViewBackButtonId');
const containersListGoToMainViewButton = document.getElementById('containersListeBackButtonId');
const historyGoToMainViewButton = document.getElementById('historyBackButtonId');
const createProfileButton = document.getElementById('createProfileOkButton');
const profileNameInput = document.getElementById('profileName');
const openHistoryButton = document.getElementById('goToHistoryView');
const openInformationButton = document.getElementById('goToInformationView');
const goToCreateProfileManageProfiles = document.getElementById('manageCreateNewProfileId');
const goToManageProfiles = document.getElementById('manageProfiles');
const alwaysOpenDiv = document.getElementById('alwaysOpenDivId');
const reopenInDiv = document.getElementById('reopenInDivId');
const profileCardQuerySelector = document.querySelector('.profile-card');



// --------------- Event Listeners ---------------
document.getElementById('searchHistory').addEventListener('input', handleSearchHistory);
document.getElementById('containerSearchId').addEventListener('input', (event) => {
    filterContainerList(event.target.value, 'containerListId');
});
document.getElementById('manageProfilesSearchId').addEventListener('input', (event) => {
    filterContainerList(event.target.value, 'manageContainerListId');
});
document.getElementById('containersListViewSearchId').addEventListener('input', (event) => {
    filterContainerList(event.target.value, 'containersListViewId');
});
// ----------------- History Listeners -----------------
document.getElementById('toggleOpenInProfile').addEventListener('click', () => {
    openInSelectedProfile = !openInSelectedProfile;
    document.getElementById('toggleOpenInProfile').textContent = openInSelectedProfile ? "Open in Selected Profile" : "Open in Current Profile";
});


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
    mainView.style.display = 'none';
    createView.style.display = 'none';
    manageProfilesView.style.display = 'none';
    containersListView.style.display = 'none';
    informationPageView.style.display = 'none';
    historyPageView.style.display = 'block';

    const [currentTab] = await browser.tabs.query({ active: true, currentWindow: true });
    let profileName = "Unknown Profile";
    if (currentTab) {
        const storedData = await browser.storage.local.get(currentTab.cookieStoreId);
        profileName = storedData[currentTab.cookieStoreId]?.profileName || "Unknown Profile";
    }

    await populateProfileDropdown(profileName);
    await displayProfileHistory(profileName);
};

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
openHistoryButton.addEventListener('click', handleOpenHistoryView);
profileCardQuerySelector.addEventListener('click', handleProfileCardClick);
profileCardQuerySelector.addEventListener('focusin', handleProfileCardFocusIn);
profileCardQuerySelector.addEventListener('focusout', handleProfileCardFocusOut);
profileCardElements.addEventListener('click', handleProfileCardClick);

// --------------- Initialization ---------------
populateContainerList();

export{handleSwitchProfile, initialGroupStates}