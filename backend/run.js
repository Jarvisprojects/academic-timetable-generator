const { spawn } = require('child_process');
const Timetable = require('./models/Timetable');
const { PYTHON_PATH, SCHEDULER_MODULE, PROJECT_ROOT } = require('./config');

async function markFailed(timetableId, message) {
    try {
        await Timetable.updateStatus(timetableId, 'failed', null, message);
    } catch (dbErr) {
        console.error(`[Timetable ${timetableId}] Failed to persist error status:`, dbErr);
    }
}

async function runSolver(timetableId, inputObj) {
    await Timetable.updateStatus(timetableId, 'processing');

    return new Promise((resolve, reject) => {
        const child = spawn(PYTHON_PATH, ['-m', SCHEDULER_MODULE], {
            cwd: PROJECT_ROOT,
            env: process.env,
            stdio: ['pipe', 'pipe', 'pipe'],
        });

        // Kill the process if it takes too long (45 seconds)
        const killTimeout = setTimeout(() => {
            child.kill('SIGTERM');
        }, 45000);

        let stdout = '';
        let stderr = '';

        child.stdout.on('data', (chunk) => {
            stdout += chunk.toString();
        });

        child.stderr.on('data', (chunk) => {
            stderr += chunk.toString();
        });

        child.on('error', async (err) => {
            clearTimeout(killTimeout);
            const message = `Failed to start solver: ${err.message}`;
            await markFailed(timetableId, message);
            reject(new Error(message));
        });

        child.on('close', async (code) => {
            clearTimeout(killTimeout);
            if (code !== 0) {
                const message = `Solver exited with code ${code}${stderr ? `: ${stderr.trim()}` : ''}`;
                await markFailed(timetableId, message);
                return reject(new Error(message));
            }

            let parsed;
            try {
                parsed = JSON.parse(stdout.trim());
            } catch (parseErr) {
                const message = `Invalid solver output: ${parseErr.message}`;
                await markFailed(timetableId, message);
                return reject(new Error(message));
            }

            if (parsed && parsed.error) {
                await markFailed(timetableId, parsed.error);
                return resolve(parsed);
            }

            try {
                await Timetable.updateStatus(timetableId, 'success', parsed, null);
                return resolve(parsed);
            } catch (dbErr) {
                const message = `Failed to save solver output: ${dbErr.message}`;
                await markFailed(timetableId, message);
                return reject(new Error(message));
            }
        });

        child.stdin.write(JSON.stringify(inputObj));
        child.stdin.end();
    });
}

module.exports = { runSolver };