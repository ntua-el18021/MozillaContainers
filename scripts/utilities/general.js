import {views} from '../mainPopup/popup.js';
import {profileForHistory} from '../utilities/historyView.js';


// Change Views
export async function handleGoToView(viewToShow) {
    if (viewToShow === "historyPageView") {
        console.log('Loading history view...');
        await profileForHistory();
        console.log('History view loaded');
    }
    // Iterate over each view
    Object.entries(views).forEach(([key, view]) => {
        view.style.display = (key === viewToShow) ? 'block' : 'none';
    });
}

// Lookup Tables for Icons and Colors
const reversedIconMapping = {
    "fingerprint": { icon: "fingerprint", class: "material-icons" },
    "briefcase": { icon: "work", class: "material-icons" },
    "dollar": { icon: "attach_money", class: "material-icons" },
    "cart": { icon: "shopping_cart", class: "material-icons" },
    "vacation": { icon: "flight_takeoff", class: "material-icons" },
    "gift": { icon: "card_giftcard", class: "material-icons" },
    "food": { icon: "restaurant", class: "material-icons" },
    "fruit": { icon: "nutrition", class: "material-symbols-outlined" },
    "pet": { icon: "pets", class: "material-icons" },
    "tree": { icon: "park", class: "material-symbols-outlined" },
    "chill": { icon: "eyeglasses", class: "material-symbols-outlined" },
    "fence": { icon: "fence", class: "material-symbols-outlined" }
};
const colorsMapping = {
    "blue": "#3498db", 
    "turquoise": "#40E0D0",
    "green": "#2ecc71",
    "yellow": "#f1c40f",
    "orange": "#e67e22",
    "red": "#e74c3c",
    "pink": "#e84393",
    "purple": "#9b59b6"
};
const iconMapping = {
    "fingerprint": "fingerprint",
    "work": "briefcase",
    "attach_money": "dollar",
    "shopping_cart": "cart",
    "flight_takeoff": "vacation",
    "card_giftcard": "gift",
    "restaurant": "food",
    "nutrition": "fruit",
    "pets": "pet",
    "park": "tree",
    "eyeglasses": "chill",
    "fence": "fence"
};


// Utility Functions
function displayError(message) {
    console.log('Displaying error: ', message);
}

const getExistingProfiles = async () => {
    const existingProfiles = await browser.storage.local.get();
    return Object.keys(existingProfiles)
        .filter(key => key.startsWith("firefox-container-"))
        .map(key => ({ key, ...existingProfiles[key] }));
};

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

// Populate the container Lists:
const populateContainerList = async (popupContainerList, containersListView, manageContainerList) => {

    const profiles = await getExistingProfiles();

    popupContainerList.innerHTML = '';
    containersListView.innerHTML = '';
    manageContainerList.innerHTML = '';

    profiles.forEach(profile => {
        let containerDiv = document.createElement('div');
        containerDiv.setAttribute('data-key', profile.key); // Storing the profile key
        containerDiv.onclick = () => handleSwitchProfile(profile.key); // Adding click event to switch profile

        // -------------- create the icon & profile name --------------
        let iconElement = document.createElement('i');
        let mappedIcon = reversedIconMapping[profile.icon].icon || 'fingerprint';
        iconElement.className = reversedIconMapping[profile.icon].class;
        iconElement.textContent = mappedIcon;

        if (profile.color) {
            iconElement.style.color = colorsMapping[profile.color];
        }

        let iconWrapper = document.createElement('div');
        iconWrapper.className = 'icon-wrapper';
        iconWrapper.appendChild(iconElement);

        let spanElement = document.createElement('span');
        spanElement.textContent = profile.profileName; 

        containerDiv.appendChild(iconWrapper);
        containerDiv.appendChild(spanElement);

        popupContainerList.appendChild(containerDiv);

        let containerListDiv = containerDiv.cloneNode(true);
        containersListView.appendChild(containerListDiv);

        // -------------- create the action icons div --------------
        let actionsDiv = document.createElement('div');
        actionsDiv.className = 'actionIcons';

        // -------------- create the action buttons --------------
        let customizeIconDiv = document.createElement('div');
        customizeIconDiv.className = 'manageActionIcon';
        let customizeIcon = document.createElement('img');
        customizeIcon.src = '../icons/manageIcons/customize.png';
        customizeIconDiv.appendChild(customizeIcon);

        let clearIconDiv = document.createElement('div');
        clearIconDiv.className = 'manageActionIcon';
        let clearIcon = document.createElement('img');
        clearIcon.src = '../icons/manageIcons/clear.png';
        clearIconDiv.appendChild(clearIcon);

        let trashIconDiv = document.createElement('div');
        trashIconDiv.className = 'manageActionIcon';
        let trashIcon = document.createElement('img');
        trashIcon.src = '../icons/manageIcons/trash.png';
        trashIconDiv.appendChild(trashIcon);

        actionsDiv.appendChild(customizeIconDiv);
        actionsDiv.appendChild(clearIconDiv);
        actionsDiv.appendChild(trashIconDiv);

        
        // -------------- finalize the manageDiv --------------
        let manageDiv = containerDiv.cloneNode(true);
        manageDiv.appendChild(actionsDiv);


        manageContainerList.appendChild(manageDiv);
    });
};

export {reversedIconMapping, colorsMapping, displayError, getExistingProfiles, populateContainerList, iconMapping};