// Synchronize form data between browser and server
console.log('sync.js loaded');

const SYNC_INTERVAL = 30000; // 30 seconds
let syncTimer = null;
let lastSyncData = null;

// Auto-sync form data periodically
function startAutoSync(formElement = document.querySelector('form'), endpoint = '/api/timetables/draft') {
  if (syncTimer) clearInterval(syncTimer);
  
  syncTimer = setInterval(() => {
    if (formElement) {
      const currentData = getFormData(formElement);
      if (JSON.stringify(currentData) !== JSON.stringify(lastSyncData)) {
        syncData(currentData, endpoint);
      }
    }
  }, SYNC_INTERVAL);
}

// Stop auto-sync
function stopAutoSync() {
  if (syncTimer) {
    clearInterval(syncTimer);
    syncTimer = null;
  }
}

// Sync data to server
async function syncData(data, endpoint = '/api/timetables/draft') {
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(data),
      credentials: 'include'
    });
    
    if (response.ok) {
      lastSyncData = data;
      console.log('✓ Data synced successfully');
      return await response.json();
    } else {
      console.error('Sync failed:', response.status);
    }
  } catch (error) {
    console.error('Sync error:', error);
  }
}

// Manually trigger sync
function manualSync(formElement = document.querySelector('form')) {
  if (formElement) {
    const data = getFormData(formElement);
    return syncData(data);
  }
}
