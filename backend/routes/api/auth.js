const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findByUsername(username);
        if (!user || !(await User.verifyPassword(user, password))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const token = jwt.sign(
            { id: user.id, username: user.username, is_admin: user.is_admin },
            JWT_SECRET,
            { expiresIn: '7d' }
        );
        res.cookie('token', token, {
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1000,
            sameSite: 'lax',
            secure: false,
            path: '/'
        });
        res.json({ success: true, token, is_admin: user.is_admin });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/me', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token' });
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        res.json({ user: decoded });
    } catch (err) {
        res.status(401).json({ error: 'Invalid token' });
    }
});

router.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ success: true });
});

module.exports = router;