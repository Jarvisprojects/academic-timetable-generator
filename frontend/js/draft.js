// Handle draft saving and loading
console.log('draft.js loaded');

const DRAFT_STORAGE_KEY = 'timetable_draft';

// Save draft to localStorage
function saveDraftLocally(data) {
  try {
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({
      data,
      timestamp: new Date().toISOString()
    }));
    console.log('✓ Draft saved locally');
  } catch (error) {
    console.error('Error saving draft:', error);
  }
}

// Load draft from localStorage
function loadDraftLocally() {
  try {
    const draft = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (draft) {
      const parsed = JSON.parse(draft);
      console.log('✓ Draft loaded from local storage');
      return parsed.data;
    }
  } catch (error) {
    console.error('Error loading draft:', error);
  }
  return null;
}

// Clear draft from localStorage
function clearDraftLocally() {
  try {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    console.log('✓ Draft cleared');
  } catch (error) {
    console.error('Error clearing draft:', error);
  }
}

// Check if draft exists
function hasDraftLocally() {
  return localStorage.getItem(DRAFT_STORAGE_KEY) !== null;
}

// Get draft info
function getDraftInfo() {
  try {
    const draft = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (draft) {
      const parsed = JSON.parse(draft);
      return {
        exists: true,
        timestamp: parsed.timestamp,
        size: new Blob([JSON.stringify(parsed.data)]).size
      };
    }
  } catch (error) {
    console.error('Error getting draft info:', error);
  }
  return { exists: false };
}

// Auto-save draft on form changes
function enableDraftAutoSave(formElement = document.querySelector('form')) {
  if (!formElement) return;
  
  formElement.addEventListener('change', () => {
    const data = getFormData(formElement);
    saveDraftLocally(data);
  });
  
  formElement.addEventListener('input', () => {
    const data = getFormData(formElement);
    saveDraftLocally(data);
  });
}
