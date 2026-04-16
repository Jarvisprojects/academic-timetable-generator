// UI Helper Utilities for Toast Notifications, Loading States, etc.
const UI = {
        // Show toast notification (uses safe method)
    toast: (message, type = 'info', duration = 4000) => {
        return DOMSafe.safeToast(message, type);
    },

    // Show loading spinner on element
    showLoading: (elementId, text = 'Loading...') => {
        const el = document.getElementById(elementId);
        if (!el) return;
        
        el.innerHTML = `
            <div class="flex items-center justify-center py-8">
                <div class="spinner w-8 h-8 mr-3"></div>
                <span>${text}</span>
            </div>
        `;
    },

    // Hide loading state
    hideLoading: (elementId) => {
        const el = document.getElementById(elementId);
        if (el) el.innerHTML = '';
    },

    // Disable button with loading state
    setButtonLoading: (buttonId, loading = true) => {
        const btn = document.getElementById(buttonId);
        if (!btn) return;
        
        if (loading) {
            // Store original text if not already stored
            if (!btn._originalText) {
                btn._originalText = btn.dataset.originalText || btn.textContent || 'Submit';
            }
            btn.disabled = true;
            btn.innerHTML = `
                <svg class="w-4 h-4 spinner inline mr-2" style="width: 1rem; height: 1rem;"></svg>
                <span>Processing...</span>
            `;
            btn.classList.add('opacity-75', 'cursor-not-allowed');
        } else {
            btn.disabled = false;
            btn.innerHTML = btn._originalText || btn.dataset.originalText || 'Sign In';
            btn.classList.remove('opacity-75', 'cursor-not-allowed');
        }
    },

    // Show/hide element
    show: (elementId) => {
        const el = document.getElementById(elementId);
        if (el) el.classList.remove('hidden');
    },

    hide: (elementId) => {
        const el = document.getElementById(elementId);
        if (el) el.classList.add('hidden');
    },

    // Toggle element visibility
    toggle: (elementId) => {
        const el = document.getElementById(elementId);
        if (el) el.classList.toggle('hidden');
    },

    // Show alert in container
    showAlert: (containerId, message, type = 'info', dismissible = true) => {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        const colors = {
            success: 'bg-green-50 border-green-200 text-green-800',
            error: 'bg-red-50 border-red-200 text-red-800',
            warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
            info: 'bg-blue-50 border-blue-200 text-blue-800'
        };
        
        const alert = document.createElement('div');
        alert.className = `rounded-lg p-4 mb-4 border ${colors[type] || colors.info} flex items-center justify-between`;
        alert.innerHTML = `
            <span>${message}</span>
            ${dismissible ? '<button onclick="this.parentElement.remove()" class="text-inherit hover:opacity-75"><svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" /></svg></button>' : ''}
        `;
        
        container.appendChild(alert);
        return alert;
    },

    // Confirm dialog
    confirm: (message) => {
        return window.confirm(message);
    },

    // Format date
    formatDate: (date) => {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
    },

    // Copy to clipboard
    copyToClipboard: (text) => {
        navigator.clipboard.writeText(text).then(() => {
            UI.toast('Copied to clipboard!', 'success', 2000);
        }).catch(() => {
            UI.toast('Failed to copy', 'error');
        });
    }
};

window.UI = UI;
