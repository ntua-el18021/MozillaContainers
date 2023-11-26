async function getExistingProfiles() {
    const existingProfiles = await browser.storage.local.get();
    return Object.keys(existingProfiles)
        .filter(key => key.startsWith("firefox-container-")) // Adjust this filter as necessary
        .map(key => ({ profileName: existingProfiles[key].profileName, ...existingProfiles[key] }));
}

async function populateProfileDropdown() {
    const profiles = await getExistingProfiles();
    const profileSelectElement = document.getElementById('profileSelect');

    // Clear existing options
    profileSelectElement.length = 0;
    
    // Add a placeholder option
    const placeholderOption = document.createElement('option');
    placeholderOption.textContent = "Select your profile";
    placeholderOption.disabled = true;
    placeholderOption.selected = true;
    profileSelectElement.appendChild(placeholderOption);

    // Populate the dropdown with profiles
    profiles.forEach(profile => {
        const option = document.createElement('option');
        option.value = profile.profileName;
        option.textContent = profile.profileName;
        profileSelectElement.appendChild(option);
    });

    // Add the event listener for profile selection change
    profileSelectElement.addEventListener('change', async (event) => {
        const selectedProfileName = event.target.value;
        displayProfileHistory(selectedProfileName);
    });
}

function groupHistoryByDate(historyEntries) {
    const groupedHistory = {
        today: [],
        yesterday: [],
        last7Days: [],
        thisMonth: [],
        // Add additional groups for each month and "older than 6 months"
    };

    // Helper to get the start of the current month
    const startOfThisMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);
    const startOfLast6Months = new Date(new Date().setMonth(new Date().getMonth() - 6));
    
    // Initialize groups for months
    const months = {};
    for (let i = 0; i <= 5; i++) { // Last 6 months
        let monthDate = new Date(new Date().setMonth(new Date().getMonth() - i));
        months[monthDate.toLocaleString('default', { month: 'long' })] = [];
    }

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const last7Days = new Date(today);
    last7Days.setDate(last7Days.getDate() - 7);

    for (const entry of historyEntries) {
        const entryDate = new Date(entry.timestamp);

        if (entryDate.toDateString() === today.toDateString()) {
            groupedHistory.today.push(entry);
        } else if (entryDate.toDateString() === yesterday.toDateString()) {
            groupedHistory.yesterday.push(entry);
        } else if (entryDate > last7Days) {
            groupedHistory.last7Days.push(entry);
        } else if (entryDate >= startOfThisMonth(today)) {
            groupedHistory.thisMonth.push(entry);
        } else {
            // Check which month the entry belongs to
            const monthName = entryDate.toLocaleString('default', { month: 'long' });
            if (months[monthName]) {
                months[monthName].push(entry);
            } else if (entryDate < startOfLast6Months) {
                if (!groupedHistory.olderThan6Months) {
                    groupedHistory.olderThan6Months = [];
                }
                groupedHistory.olderThan6Months.push(entry);
            }
        }
    }

    // Combine the standard groups with the monthly groups
    return { ...groupedHistory, ...months };
}



async function fetchAndDisplayHistory() {
    try {
        // Fetch the current profile name based on the active tab's cookie store ID
        const [currentTab] = await browser.tabs.query({ active: true, currentWindow: true });
        const storedData = currentTab && await browser.storage.local.get(currentTab.cookieStoreId);
        const currentProfileName = storedData && storedData[currentTab.cookieStoreId]?.profileName || "Unknown Profile";

        // Fetch and display history for the current profile
        await displayProfileHistory(currentProfileName);

        // Fetch all existing profiles from storage
        const existingProfiles = await getExistingProfiles(); 

        // Display history for other profiles, excluding the current profile
        for (const profile of existingProfiles) {
            if (profile.profileName !== currentProfileName) {
                await displayProfileHistory(profile.profileName);
            }
        }
    } catch (error) {
        console.error("Error in fetchAndDisplayHistory:", error);
    }
}

async function displayProfileHistory(profileName) {
    const dbName = profileName; // The database name for the profile
    const db = await openDatabase(dbName);
    const transaction = db.transaction('history', 'readonly');
    const store = transaction.objectStore('history');
    const request = store.getAll();

    request.onsuccess = () => {
        const groupedEntries = groupHistoryByDate(request.result);
        displayGroupedHistoryEntries(groupedEntries, profileName);
        db.close();
    };

    request.onerror = (event) => {
        console.error("Error fetching history entries for profile", dbName + ":", event.target.error);
    };
}

function displayGroupedHistoryEntries(groupedEntries, profileName) {
    const historyEntriesContainer = document.getElementById('historyEntriesContainer');
    historyEntriesContainer.innerHTML = ''; // Clear existing entries

    // Add profile header
    const profileHeader = document.createElement('h3');
    profileHeader.textContent = `History for ${profileName}`;
    historyEntriesContainer.appendChild(profileHeader);

    for (const group in groupedEntries) {
        if (groupedEntries[group].length > 0) {
            const groupHeader = document.createElement('h4');
            groupHeader.textContent = group.charAt(0).toUpperCase() + group.slice(1); // Capitalize group name
            historyEntriesContainer.appendChild(groupHeader);

            for (const entry of groupedEntries[group]) {
                const historyEntryDiv = createHistoryEntryDiv(entry);
                historyEntriesContainer.appendChild(historyEntryDiv);
            }
        }
    }
}

function createHistoryEntryDiv(entry) {
    const div = document.createElement('div');
    div.className = 'history-entry';
    div.innerHTML = `
        <img src="${entry.icon || 'default-icon.png'}" alt="Favicon" class="favicon">
        <a href="${entry.url}" target="_blank">${entry.title || entry.url}</a>
    `;
    return div;
}





export { fetchAndDisplayHistory, populateProfileDropdown, displayProfileHistory };