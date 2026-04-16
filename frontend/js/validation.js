// Client-side Validation Utilities
const Validation = {
    // Email validation
    isValidEmail: (email) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    },

    // Password strength
    getPasswordStrength: (password) => {
        if (!password) return { score: 0, label: 'Too short', color: 'red' };
        
        let score = 0;
        if (password.length >= 8) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[a-z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;
        
        if (score <= 2) return { score, label: 'Weak', color: 'red' };
        if (score === 3) return { score, label: 'Fair', color: 'yellow' };
        if (score === 4) return { score, label: 'Strong', color: 'green' };
        return { score, label: 'Very Strong', color: 'green' };
    },

    // Username validation
    isValidUsername: (username) => {
        // 3-20 chars, alphanumeric + underscore
        return /^[a-zA-Z0-9_]{3,20}$/.test(username);
    },

    // Check if passwords match
    doPasswordsMatch: (password1, password2) => {
        return password1 === password2 && password1.length > 0;
    },

    // Validate form field
    validateField: (type, value) => {
        switch(type) {
            case 'email':
                return Validation.isValidEmail(value) ? null : 'Invalid email address';
            case 'password':
                if (value.length === 0) return 'Password is required';
                return null;
            case 'username':
                if (!Validation.isValidUsername(value)) return 'Username must be 3-20 characters (letters, numbers, underscores only)';
                return null;
            case 'required':
                return value.trim().length > 0 ? null : 'This field is required';
            default:
                return null;
        }
    },

    // Real-time field validation
    setupFieldValidation: (fieldId, validationType) => {
        const field = document.getElementById(fieldId);
        if (!field) return;

        field.addEventListener('blur', () => {
            const error = Validation.validateField(validationType, field.value);
            const errorEl = field.parentElement.querySelector('.field-error');
            
            if (error && !errorEl) {
                const err = document.createElement('p');
                err.className = 'field-error mt-2 text-xs font-medium text-red-600 flex items-center gap-1';
                err.innerHTML = `<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M18.101 12.93a1 1 0 00-1.414-1.414L10 14.586l-6.687-6.687a1 1 0 00-1.414 1.414l8.1 8.1a1 1 0 001.414 0l10.1-10.1z" clip-rule="evenodd" />
                </svg> ${error}`;
                field.classList.add('border-red-500', 'focus:ring-red-500');
                field.parentElement.appendChild(err);
            } else if (!error && errorEl) {
                errorEl.remove();
                field.classList.remove('border-red-500', 'focus:ring-red-500');
            }
        });

        field.addEventListener('focus', () => {
            const errorEl = field.parentElement.querySelector('.field-error');
            if (errorEl) errorEl.remove();
            field.classList.remove('border-red-500', 'focus:ring-red-500');
        });
    }
};

window.Validation = Validation;
