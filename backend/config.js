// backend/config.js
const path = require('path');
const fs = require('fs');

const PROJECT_ROOT = path.resolve(__dirname, '..');          // project root (one level up)
const VENV_PATH = path.join(PROJECT_ROOT, 'venv');
const PYTHON_PATH = process.env.PYTHON_PATH || path.join(VENV_PATH, 'bin', 'python');
const SCHEDULER_MODULE = 'scheduler';

// Verify Python interpreter
if (!fs.existsSync(PYTHON_PATH)) {
    console.error(`❌ ERROR: Python interpreter not found at ${PYTHON_PATH}`);
    console.error(`   Please set PYTHON_PATH environment variable or ensure the virtual environment exists.`);
}

// Verify the scheduler module exists
const schedulerInit = path.join(PROJECT_ROOT, SCHEDULER_MODULE, '__init__.py');
if (!fs.existsSync(schedulerInit)) {
    console.error(`❌ ERROR: Scheduler module not found at ${path.join(PROJECT_ROOT, SCHEDULER_MODULE)}`);
    console.error(`   Expected to find '__init__.py' inside the scheduler directory.`);
}

module.exports = {
    PROJECT_ROOT,
    VENV_PATH,
    PYTHON_PATH,
    SCHEDULER_MODULE,
};