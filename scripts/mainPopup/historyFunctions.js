
let openInSelectedProfile = false;
document.addEventListener('DOMContentLoaded', async () => {
    await populateProfileDropdown();
    await fetchAndDisplayHistory();
});


document.getElementById('toggleOpenInProfile').addEventListener('click', () => {
    openInSelectedProfile = !openInSelectedProfile;
    document.getElementById('toggleOpenInProfile').textContent = openInSelectedProfile ? "Open in Selected Profile" : "Open in Current Profile";
});

async function getExistingProfiles() {
    const existingProfiles = await browser.storage.local.get();
    return Object.keys(existingProfiles)
        .filter(key => key.startsWith("firefox-container-")) // Adjust this filter as necessary
        .map(key => ({ profileName: existingProfiles[key].profileName, ...existingProfiles[key] }));
}

async function populateProfileDropdown(selectedProfileName = null) {
    const profiles = await getExistingProfiles();
    const profileSelectElement = document.getElementById('profileSelect');

    // Clear existing options
    profileSelectElement.innerHTML = '';

    // Populate the dropdown with profiles
    profiles.forEach(profile => {
        const option = document.createElement('option');
        option.value = profile.profileName;
        option.textContent = profile.profileName;
        profileSelectElement.appendChild(option);

        // Set the selected profile if specified
        if (selectedProfileName && profile.profileName === selectedProfileName) {
            option.selected = true;
        }
    });

    // Event listener for profile selection change
    profileSelectElement.addEventListener('change', async (event) => {
        const selectedProfileName = event.target.value;
        await displayProfileHistory(selectedProfileName);
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

    for (const group in groupedEntries) {
        if (groupedEntries[group].length > 0) {
            // Create the group container
            const groupDiv = document.createElement('div');
            groupDiv.className = 'historyGroup';

            // Create the toggle checkbox
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = group + 'Checkbox';
            checkbox.className = 'toggleCheckbox';
            checkbox.hidden = true;

            // Create the label for the group
            const label = document.createElement('label');
            label.htmlFor = group + 'Checkbox';
            label.className = 'toggleLabel';

            const iconSpan = document.createElement('span');
            iconSpan.className = 'icon';

            const groupIcon = document.createElement('img');
            groupIcon.src = '../icons/historyIcons/clock.png';
            groupIcon.className = 'historyDisplayIcons';

            const groupName = document.createElement('span');
            groupName.textContent = group.charAt(0).toUpperCase() + group.slice(1); // Capitalize first letter

            // Append elements to label
            label.appendChild(iconSpan);
            label.appendChild(groupIcon);
            label.appendChild(groupName);

            // Create the content div
            const contentDiv = document.createElement('div');
            contentDiv.className = 'content';

            // Populate the content div with history entries
            groupedEntries[group].forEach(entry => {
                const entryDiv = createHistoryEntryDiv(entry);
                contentDiv.appendChild(entryDiv);
            });

            // Append elements to groupDiv
            groupDiv.appendChild(checkbox);
            groupDiv.appendChild(label);
            groupDiv.appendChild(contentDiv);

            // Append the groupDiv to the container
            historyEntriesContainer.appendChild(groupDiv);
        }
    }
}


function createHistoryEntryDiv(entry) {
    const div = document.createElement('div');
    div.className = 'historyEntry';

    const img = document.createElement('img');
    const faviconSize = 32; // Your preferred size
    img.src = `https://www.google.com/s2/favicons?domain=${new URL(entry.url).hostname}&sz=${faviconSize}`;
    img.alt = 'Favicon';
    img.className = 'favicon';

    const a = document.createElement('a');
    a.textContent = entry.title || entry.url;
    a.className = 'customLink';

    // Event listener for opening the link in the selected profile
    a.addEventListener('click', async (e) => {
        e.preventDefault();

        if (openInSelectedProfile) {
            // Get the selected profile name from the dropdown
            const selectedProfileName = document.getElementById('profileSelect').value;
            const profiles = await getExistingProfiles();
            const selectedProfile = profiles.find(p => p.profileName === selectedProfileName);

            if (selectedProfile) {
                try {
                    await browser.tabs.create({
                        url: entry.url,
                        cookieStoreId: selectedProfile.cookieStoreId // Open in the selected profile container
                    });
                } catch (error) {
                    console.error("Error opening link in profile:", error);
                }
            }
        } else {
            window.open(entry.url, '_blank'); // Open in current profile
        }
    });

    div.appendChild(img);
    div.appendChild(a);

    return div;
}








export { populateProfileDropdown, displayProfileHistory };