// Safe DOM Manipulation Utilities - prevents XSS attacks
const DOMSafe = {
    // Create a safe element with text content (no HTML injection)
    createElement: (tag, className, textContent) => {
        const el = document.createElement(tag);
        if (className) el.className = className;
        if (textContent) el.textContent = textContent; // textContent is safe - doesn't parse HTML
        return el;
    },

    // Safely set text content (no HTML)
    setText: (elementId, text) => {
        const el = document.getElementById(elementId);
        if (el) el.textContent = text;
    },

    // Safely append text to element
    appendText: (elementId, text) => {
        const el = document.getElementById(elementId);
        if (el) el.appendChild(document.createTextNode(text));
    },

    // Safely create HTML from sanitized content (only use with trusted HTML)
    createFromHTML: (htmlString) => {
        const div = document.createElement('div');
        div.innerHTML = htmlString;
        return div.firstElementChild;
    },

    // Escape HTML special characters to prevent injection
    escapeHtml: (text) => {
        if (typeof text !== 'string') return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    // Create a safe toast with text content only
    safeToast: (message, type = 'info') => {
        const toast = document.createElement('div');
        toast.className = `toast ${type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'} text-white rounded-lg p-4 shadow-lg flex items-center gap-3 max-w-sm`;
        
        // Create icon SVG
        const icons = {
            success: '<svg class="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" /></svg>',
            error: '<svg class="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" /></svg>',
            warning: '<svg class="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" /></svg>',
            info: '<svg class="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0 1 1 0 012 0zm-1 4a1 1 0 10-2 0v4a1 1 0 102 0V3z" clip-rule="evenodd" /></svg>'
        };
        
        const iconDiv = document.createElement('div');
        iconDiv.innerHTML = icons[type] || icons.info;
        toast.appendChild(iconDiv.firstChild);
        
        const msgSpan = document.createElement('span');
        msgSpan.textContent = message;
        toast.appendChild(msgSpan);
        
        const closeBtn = document.createElement('button');
        closeBtn.className = 'ml-auto hover:opacity-75';
        closeBtn.innerHTML = '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>';
        closeBtn.onclick = () => {
            toast.classList.add('exit');
            setTimeout(() => toast.remove(), 300);
        };
        toast.appendChild(closeBtn);
        
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.classList.add('exit');
            setTimeout(() => toast.remove(), 300);
        }, 4000);
        
        return toast;
    }
};

window.DOMSafe = DOMSafe;
