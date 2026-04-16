// backend/config.js
const path = require('path');
const fs = require('fs');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const VENV_PATH = path.join(PROJECT_ROOT, 'venv');
const PYTHON_PATH = process.env.PYTHON_PATH || path.resolve(VENV_PATH, 'bin', 'python');
const SCHEDULER_MODULE = 'scheduler';

// ========== ENVIRONMENT VALIDATION ==========
function validateEnvironment() {
    const errors = [];
    const warnings = [];

    // Check DATABASE_URL
    if (!process.env.DATABASE_URL) {
        errors.push('DATABASE_URL environment variable is not set');
    } else {
        if (!process.env.DATABASE_URL.includes('postgresql://')) {
            warnings.push('DATABASE_URL does not look like a PostgreSQL connection string');
        }
    }

    // Check JWT_SECRET
    if (!process.env.JWT_SECRET) {
        errors.push('JWT_SECRET environment variable is not set');
    } else if (process.env.JWT_SECRET.length < 32) {
        warnings.push('JWT_SECRET is too short (should be at least 32 characters)');
    }

    // Check Python path
    if (!fs.existsSync(PYTHON_PATH)) {
        warnings.push(`Python interpreter not found at ${PYTHON_PATH}`);
        warnings.push(`Set PYTHON_PATH environment variable to correct location`);
    }

    // Check scheduler module
    const schedulerInit = path.join(PROJECT_ROOT, SCHEDULER_MODULE, '__init__.py');
    if (!fs.existsSync(schedulerInit)) {
        warnings.push(`Scheduler module not found at ${path.join(PROJECT_ROOT, SCHEDULER_MODULE)}`);
    }

    // Return results
    return { errors, warnings };
}

// ========== EXPORTS ==========
module.exports = {
    PROJECT_ROOT,
    VENV_PATH,
    PYTHON_PATH,
    SCHEDULER_MODULE,
    validateEnvironment
};