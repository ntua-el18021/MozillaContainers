/**
 * On call of the history.html, this script will fetch the history for the last active tab
 * The info for the last active tab are logged in the background script
 * It will only show histories for profiles created from the addon
 */

(async function () {
  const params = new URLSearchParams(window.location.search);
  const lastActiveTabId = params.get('lastActiveTabId');
  if (!lastActiveTabId) {
    console.error('No last active tab ID found');
    return;
  }

  const storedData = await browser.storage.local.get(lastActiveTabId);
  const profileName = storedData[lastActiveTabId]?.profileName || "Unknown Profile";

  try {
    const allHistory = await fetchHistoryFromIndexedDB(profileName);
    if (allHistory.length > 0) {
      displayHistory(allHistory, profileName);
    }
  } catch (error) {
    console.log('Error while fetching history from IndexedDB:', error);
  }
})();

populateProfileDropdown();

// --------------- Populate Profile Dropdown ---------------
async function populateProfileDropdown() {
const profiles = await getExistingProfiles(); 
const dropdown = document.getElementById('profileSelect');

profiles.forEach(profile => {
  const option = document.createElement('option');
  option.value = profile.profileName;
  option.text = profile.profileName;
  dropdown.appendChild(option);
});

dropdown.addEventListener('change', async () => {
  const selectedProfile = dropdown.value;
  const allHistory = await fetchHistoryFromIndexedDB(selectedProfile);
  displayHistory(allHistory, selectedProfile);
});
}

// --------------- Fetch History from IndexedDB ---------------
async function fetchHistoryFromIndexedDB(dbName) {
const db = await openDatabase(dbName);
const transaction = db.transaction('history', 'readonly');
const objectStore = transaction.objectStore('history');
const request = objectStore.getAll();

return new Promise((resolve, reject) => {
  request.onsuccess = () => {
    db.close();
    resolve(request.result);
  };

  request.onerror = (event) => {
    reject(event.target.error);
  };
});
}

// --------------- Open IndexedDB ---------------
function openDatabase(dbName) {
const version = 1;
return new Promise((resolve, reject) => {
  const request = indexedDB.open(dbName, version);

  request.onerror = function (event) {
    console.error("Database error: ", event.target.error);
    reject(event.target.error);
  };

  request.onsuccess = function (event) {
    resolve(event.target.result);
  };
});
}

// --------------- History HTML Populator  ---------------
function displayHistory(history, profileName) {
const historyDiv = document.getElementById('historyList');
historyDiv.textContent = '';  // Clear previous history

history.forEach(item => {
  const itemDiv = document.createElement('div');
  itemDiv.className = "history-item";
  itemDiv.innerHTML = `
      <div><strong>URL:</strong> ${item.url}</div>
      <div><strong>Title:</strong> ${item.title}</div>
      <div><strong>Profile:</strong> ${profileName}</div>
      <div><strong>Visited:</strong> ${formatDate(item.timestamp)}</div>
  `;
  historyDiv.appendChild(itemDiv);
});
}

function formatDate(timestamp) {
const date = new Date(timestamp);
const formattedDate = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')} ${date.getHours() >= 12 ? 'PM' : 'AM'}`;
return formattedDate;
}

// ---------------------- Replicated getExistingProfiles Function ----------------------
async function getExistingProfiles (){
  const existingProfiles = await browser.storage.local.get();
  console.log('existingProfiles: ', existingProfiles);
  return Object.keys(existingProfiles)
      .filter(key => key.startsWith("firefox-container-"))
      .map(key => ({ key, ...existingProfiles[key] }));
};