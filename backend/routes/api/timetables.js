const express = require('express');
const pool = require('../../models/db');
const Timetable = require('../../models/Timetable');
const { runSolver } = require('../../run');
const router = express.Router();

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
    const timetables = await Timetable.findByUserId(req.internalUserId);
    res.json(timetables);
});

// GET /api/timetables/:id
router.get('/:id', async (req, res) => {
    const timetable = await Timetable.findById(req.params.id);
    if (!timetable || timetable.user_id !== req.internalUserId) {
        return res.status(404).json({ error: 'Not found' });
    }
    res.json(timetable);
});

// GET /api/timetables/:id/status
router.get('/:id/status', async (req, res) => {
    const timetable = await Timetable.findById(req.params.id);
    if (!timetable || timetable.user_id !== req.internalUserId) {
        return res.status(404).json({ error: 'Not found' });
    }
    res.json({ status: timetable.status, error: timetable.error_message });
});

// POST /api/timetables – create new
router.post('/', async (req, res) => {
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
        runSolver(id, inputObj);
        res.json({ id, status: 'pending' });
    } catch (err) {
        console.error('Error creating timetable:', err);
        res.status(500).json({ error: 'Failed to create timetable' });
    }
});

// DELETE /api/timetables/:id
router.delete('/:id', async (req, res) => {
    const timetable = await Timetable.findById(req.params.id);
    if (!timetable || timetable.user_id !== req.internalUserId) {
        return res.status(404).json({ error: 'Not found' });
    }
    await Timetable.delete(req.params.id);
    res.json({ success: true });
});

// Download endpoints
router.get('/:id/download/input', async (req, res) => {
    const timetable = await Timetable.findById(req.params.id);
    if (!timetable || timetable.user_id !== req.internalUserId) {
        return res.status(404).send('Not found');
    }
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="input-${req.params.id}.json"`);
    res.send(JSON.stringify(timetable.input_json, null, 2));
});

router.get('/:id/download/output', async (req, res) => {
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
});

// GET /api/teachers – dummy endpoints (you can implement real ones later)
router.get('/teachers', async (req, res) => {
    res.json([]);
});

router.get('/rooms', async (req, res) => {
    res.json([]);
});

router.get('/labs', async (req, res) => {
    res.json([]);
});

module.exports = router;