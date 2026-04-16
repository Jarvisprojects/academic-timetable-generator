// Dynamic form builder
console.log('form-builder.js loaded');

// Create form input element
function createFormField(name, type = 'text', label = '', required = false) {
  const formGroup = document.createElement('div');
  formGroup.className = 'form-group mb-4';
  
  const labelEl = document.createElement('label');
  labelEl.htmlFor = name;
  labelEl.textContent = label || name;
  labelEl.className = 'block text-sm font-medium text-gray-700 mb-1';
  
  const input = document.createElement('input');
  input.type = type;
  input.name = name;
  input.id = name;
  input.required = required;
  input.className = 'w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500';
  
  formGroup.appendChild(labelEl);
  formGroup.appendChild(input);
  
  return formGroup;
}

// Create select element
function createSelectField(name, label, options = []) {
  const formGroup = document.createElement('div');
  formGroup.className = 'form-group mb-4';
  
  const labelEl = document.createElement('label');
  labelEl.htmlFor = name;
  labelEl.textContent = label || name;
  labelEl.className = 'block text-sm font-medium text-gray-700 mb-1';
  
  const select = document.createElement('select');
  select.name = name;
  select.id = name;
  select.className = 'w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500';
  
  options.forEach(opt => {
    const option = document.createElement('option');
    option.value = opt.value || opt;
    option.textContent = opt.label || opt;
    select.appendChild(option);
  });
  
  formGroup.appendChild(labelEl);
  formGroup.appendChild(select);
  
  return formGroup;
}

// Create textarea
function createTextarea(name, label, placeholder = '') {
  const formGroup = document.createElement('div');
  formGroup.className = 'form-group mb-4';
  
  const labelEl = document.createElement('label');
  labelEl.htmlFor = name;
  labelEl.textContent = label || name;
  labelEl.className = 'block text-sm font-medium text-gray-700 mb-1';
  
  const textarea = document.createElement('textarea');
  textarea.name = name;
  textarea.id = name;
  textarea.placeholder = placeholder;
  textarea.className = 'w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500';
  textarea.rows = 4;
  
  formGroup.appendChild(labelEl);
  formGroup.appendChild(textarea);
  
  return formGroup;
}
