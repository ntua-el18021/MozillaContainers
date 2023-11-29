import {populateContainerList} from '../mainPopup/helperFunctions.js';


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