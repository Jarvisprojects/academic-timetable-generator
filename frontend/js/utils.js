// Utility functions for timetable form
console.log('utils.js loaded');

// Validate form data
function validateFormData(data) {
  if (!data.name || data.name.trim().length === 0) {
    throw new Error('Timetable name is required');
  }
  return true;
}

// Format date to readable format
function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}

// Escape HTML to prevent XSS
function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Deep clone object
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

// Get unique values from array
function getUnique(array) {
  return [...new Set(array)];
}
