// Populate form with data
console.log('populate.js loaded');

// Populate form from object
function populateForm(formData, formElement = document) {
  Object.keys(formData).forEach(key => {
    const input = formElement.querySelector(`[name="${key}"]`);
    if (input) {
      if (input.type === 'checkbox') {
        input.checked = formData[key];
      } else if (input.type === 'radio') {
        const radio = formElement.querySelector(`[name="${key}"][value="${formData[key]}"]`);
        if (radio) radio.checked = true;
      } else {
        input.value = formData[key];
      }
    }
  });
}

// Get form data as object
function getFormData(formElement = document.querySelector('form')) {
  if (!formElement) return {};
  
  const formData = new FormData(formElement);
  const data = {};
  
  for (let [key, value] of formData.entries()) {
    if (data[key]) {
      // Handle multiple values (checkboxes, multi-select)
      if (Array.isArray(data[key])) {
        data[key].push(value);
      } else {
        data[key] = [data[key], value];
      }
    } else {
      data[key] = value;
    }
  }
  
  return data;
}

// Clear form
function clearForm(formElement = document.querySelector('form')) {
  if (formElement) {
    formElement.reset();
  }
}

// Disable form (disable all inputs)
function disableForm(formElement = document.querySelector('form'), disable = true) {
  const inputs = formElement.querySelectorAll('input, textarea, select, button');
  inputs.forEach(input => {
    input.disabled = disable;
  });
}
