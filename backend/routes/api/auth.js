const express = require('express');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const User = require('../../models/User');
const { validations, handleValidationErrors, validateJsonInput } = require('../../middleware/validation');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;

// Rate limiting: Login specific (20 attempts per 15 minutes)
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: 'Too many login attempts. Please try again in 15 minutes',
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.body.username || req.ip,
    skip: (req) => req.method !== 'POST',
    handler: (req, res) => {
        res.status(429).json({ error: 'Too many login attempts. Please try again later.' });
    }
});

// Apply JSON validation to all routes
router.use(validateJsonInput);

router.post('/login', loginLimiter, ...validations.username, ...validations.password, handleValidationErrors, async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findByUsername(username);
        if (!user || !(await User.verifyPassword(user, password))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const token = jwt.sign(
            { id: user.id, username: user.username, is_admin: user.is_admin },
            JWT_SECRET,
            { expiresIn: '2h' }
        );
        res.cookie('token', token, {
            httpOnly: true,
            maxAge: 2 * 60 * 60 * 1000,
            sameSite: 'strict',
            secure: process.env.NODE_ENV === 'production',
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