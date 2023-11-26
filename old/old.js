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