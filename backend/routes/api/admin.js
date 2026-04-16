const express = require('express');
const router = express.Router();
const User = require('../../models/User');
const AuditLog = require('../../models/AuditLog');

// Middleware to ensure user is authenticated and is admin
function requireAdmin(req, res, next) {
    if (!req.user || !req.user.is_admin) {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
}

// ========== USER MANAGEMENT ==========
router.get('/users', requireAdmin, async (req, res) => {
    try {
        const users = await User.findAll();
        res.json(users);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

router.post('/users', requireAdmin, async (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    try {
        // Always create regular user (is_admin = false)
        const newUser = await User.create({
            username,
            email,
            password,
            is_admin: false
        });
        await AuditLog.create({
            user_id: req.user.id,
            action: 'created',
            target_user_id: newUser.id,
            target_username: username,
            actor_username: req.user.username,
            new_data: { username, email, is_admin: false }
        });
        res.status(201).json(newUser);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

router.put('/users/:id', requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { username, email, password } = req.body;
    try {
        const user = await User.findById(id);
        if (!user) return res.status(404).json({ error: 'User not found' });
        if (user.is_admin && user.id === req.user.id) {
            return res.status(403).json({ error: 'Cannot modify own admin account' });
        }
        const updateData = {};
        if (username) updateData.username = username;
        if (email) updateData.email = email;
        if (password) updateData.password = password;
        const updatedUser = await User.update(id, updateData);
        await AuditLog.create({
            user_id: req.user.id,
            action: 'updated',
            target_user_id: user.id,
            target_username: user.username,
            actor_username: req.user.username,
            old_data: { username: user.username, email: user.email },
            new_data: { username: username || user.username, email: email || user.email, password_changed: !!password }
        });
        res.json(updatedUser);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update user' });
    }
});

router.delete('/users/:id', requireAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const user = await User.findById(id);
        if (!user) return res.status(404).json({ error: 'User not found' });
        if (user.is_admin) return res.status(403).json({ error: 'Cannot delete admin' });
        if (user.id === req.user.id) return res.status(403).json({ error: 'Cannot delete yourself' });
        await User.delete(id);
        await AuditLog.create({
            user_id: req.user.id,
            action: 'deleted',
            target_user_id: user.id,
            target_username: user.username,
            actor_username: req.user.username
        });
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

// ========== AUDIT LOGS ==========
router.get('/audit-logs', requireAdmin, async (req, res) => {
    try {
        const logs = await AuditLog.findAll();
        res.json(logs);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch logs' });
    }
});

router.delete('/audit-logs', requireAdmin, async (req, res) => {
    try {
        await AuditLog.clearAll();
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to clear logs' });
    }
});

module.exports = router;