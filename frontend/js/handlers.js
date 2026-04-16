// Event handlers for timetable form
console.log('handlers.js loaded');

// Handle form submission
function handleFormSubmit(event) {
  event.preventDefault();
  console.log('Form submitted');
}

// Handle input changes
function handleInputChange(event) {
  const { name, value } = event.target;
  console.log(`Input changed: ${name} = ${value}`);
}

// Handle delete action
function handleDelete(id) {
  if (confirm('Are you sure you want to delete this?')) {
    console.log('Deleting:', id);
  }
}

// Handle edit action
function handleEdit(id) {
  console.log('Editing:', id);
}

// Handle save action
function handleSave(data) {
  console.log('Saving data:', data);
}
