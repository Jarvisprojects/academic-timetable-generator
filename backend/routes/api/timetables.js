const express = require('express');
const pool = require('../../models/db');
const Timetable = require('../../models/Timetable');
const { runSolver } = require('../../run');
const { validations, handleValidationErrors, validateJsonInput } = require('../../middleware/validation');
const router = express.Router();

// Apply JSON validation to all routes
router.use(validateJsonInput);

// Helper to get internal user ID from req.user (set by authenticate middleware)
function setUser(req, res, next) {
    if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    req.internalUserId = req.user.id;
    req.internalUser = req.user;
    next();
}

router.use(setUser);

// GET /api/timetables
router.get('/', async (req, res) => {
    try {
        const timetables = await Timetable.findByUserId(req.internalUserId);
        res.json(timetables);
    } catch (err) {
        console.error('Error fetching timetables:', err);
        res.status(500).json({ error: 'Failed to fetch timetables' });
    }
});

// GET /api/timetables/teachers
router.get('/teachers', async (req, res) => {
    try {
        res.json([]);
    } catch (err) {
        console.error('Error fetching teachers:', err);
        res.status(500).json({ error: 'Failed to fetch teachers' });
    }
});

// GET /api/timetables/rooms
router.get('/rooms', async (req, res) => {
    try {
        res.json([]);
    } catch (err) {
        console.error('Error fetching rooms:', err);
        res.status(500).json({ error: 'Failed to fetch rooms' });
    }
});

// GET /api/timetables/labs
router.get('/labs', async (req, res) => {
    try {
        res.json([]);
    } catch (err) {
        console.error('Error fetching labs:', err);
        res.status(500).json({ error: 'Failed to fetch labs' });
    }
});

// GET /api/timetables/:id
router.get('/:id', ...validations.id, handleValidationErrors, async (req, res) => {
    try {
        const timetable = await Timetable.findById(req.params.id);
        if (!timetable || timetable.user_id !== req.internalUserId) {
            return res.status(404).json({ error: 'Not found' });
        }
        res.json(timetable);
    } catch (err) {
        console.error('Error fetching timetable:', err);
        res.status(500).json({ error: 'Failed to fetch timetable' });
    }
});

// GET /api/timetables/:id/status
router.get('/:id/status', ...validations.id, handleValidationErrors, async (req, res) => {
    try {
        const timetable = await Timetable.findById(req.params.id);
        if (!timetable || timetable.user_id !== req.internalUserId) {
            return res.status(404).json({ error: 'Not found' });
        }
        res.json({ status: timetable.status, error: timetable.error_message });
    } catch (err) {
        console.error('Error fetching timetable status:', err);
        res.status(500).json({ error: 'Failed to fetch status' });
    }
});

// POST /api/timetables – create new
router.post('/', ...validations.name, ...validations.description, handleValidationErrors, async (req, res) => {
    const { name, description, inputJson } = req.body;
    let inputObj;
    try {
        inputObj = JSON.parse(inputJson);
    } catch (e) {
        return res.status(400).json({ error: 'Invalid JSON' });
    }

    try {
        const id = await Timetable.create(req.internalUserId, name, description, inputObj);
        console.log(`Timetable created with ID: ${id}`);
        runSolver(id, inputObj).catch(err => {
            console.error(`[Timetable ${id}] Unhandled error in runSolver:`, err);
        });
        res.json({ id, status: 'pending' });
    } catch (err) {
        console.error('Error creating timetable:', err);
        res.status(500).json({ error: 'Failed to create timetable' });
    }
});

// DELETE /api/timetables/:id
router.delete('/:id', ...validations.id, handleValidationErrors, async (req, res) => {
    try {
        const timetable = await Timetable.findById(req.params.id);
        if (!timetable || timetable.user_id !== req.internalUserId) {
            return res.status(404).json({ error: 'Not found' });
        }
        await Timetable.delete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        console.error('Error deleting timetable:', err);
        res.status(500).json({ error: 'Failed to delete timetable' });
    }
});

// Download endpoints
router.get('/:id/download/input', ...validations.id, handleValidationErrors, async (req, res) => {
    try {
        const timetable = await Timetable.findById(req.params.id);
        if (!timetable || timetable.user_id !== req.internalUserId) {
            return res.status(404).send('Not found');
        }
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="input-${req.params.id}.json"`);
        res.send(JSON.stringify(timetable.input_json, null, 2));
    } catch (err) {
        console.error('Error downloading input:', err);
        res.status(500).send('Failed to download input');
    }
});

router.get('/:id/download/output', ...validations.id, handleValidationErrors, async (req, res) => {
    try {
        const timetable = await Timetable.findById(req.params.id);
        if (!timetable || timetable.user_id !== req.internalUserId) {
            return res.status(404).send('Not found');
        }
        if (!timetable.output_json) {
            return res.status(404).send('No output yet');
        }
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="output-${req.params.id}.json"`);
        res.send(JSON.stringify(timetable.output_json, null, 2));
    } catch (err) {
        console.error('Error downloading output:', err);
        res.status(500).send('Failed to download output');
    }
});

module.exports = router;