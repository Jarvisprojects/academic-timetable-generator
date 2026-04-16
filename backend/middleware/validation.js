// Input Validation Middleware - Prevents SQL injection, format attacks, buffer overflow
const { body, validationResult, param } = require('express-validator');

// Middleware to check validation results and return errors
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.warn('Validation errors:', errors.array());
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array().map(err => ({
                field: err.param,
                message: err.msg
            }))
        });
    }
    next();
};

// Validation chain for username: 3-20 chars, alphanumeric + underscore
const validateUsername = () => [
    body('username')
        .trim()
        .notEmpty().withMessage('Username is required')
        .isLength({ min: 3, max: 20 }).withMessage('Username must be 3-20 characters')
        .if((value) => value && value.length >= 3)
        .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores')
];

// Validation chain for email: valid email format
const validateEmail = () => [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format')
        .normalizeEmail()
        .isLength({ max: 255 }).withMessage('Email is too long')
];

// Validation chain for password: at least 8 chars for security
const validatePassword = () => [
    body('password')
        .notEmpty().withMessage('Password is required and must be 8+ characters')
        .isLength({ min: 8, max: 255 }).withMessage('Password must be 8-255 characters')
];

// Validation chain for name
const validateName = () => [
    body('name')
        .trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ min: 1, max: 100 }).withMessage('Name must be 1-100 characters')
];

// Validation chain for description
const validateDescription = () => [
    body('description')
        .optional()
        .trim()
        .isLength({ max: 1000 }).withMessage('Description must be max 1000 characters')
];

// Validation chain for ID param
const validateId = () => [
    param('id')
        .isInt({ min: 1 }).withMessage('Invalid ID format - must be a positive integer')
        .toInt()
];

// Optional validation chains for PATCH/PUT operations
const validateUsernameOptional = () => [
    body('username')
        .optional()
        .trim()
        .isLength({ min: 3, max: 20 }).withMessage('Username must be 3-20 characters')
        .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores')
];

const validateEmailOptional = () => [
    body('email')
        .optional()
        .trim()
        .isEmail().withMessage('Invalid email format')
        .normalizeEmail()
        .isLength({ max: 255 }).withMessage('Email is too long')
];

const validatePasswordOptional = () => [
    body('password')
        .optional()
        .isLength({ min: 8, max: 255 }).withMessage('Password must be 8-255 characters')
];

// Validation rule Objects (for compatibility with string names)
const validations = {
    username: validateUsername(),
    email: validateEmail(),
    password: validatePassword(),
    name: validateName(),
    description: validateDescription(),
    id: validateId(),
    usernameOptional: validateUsernameOptional(),
    emailOptional: validateEmailOptional(),
    passwordOptional: validatePasswordOptional(),
};

// JSON validation middleware - prevent prototype pollution
const validateJsonInput = (req, res, next) => {
    if (req.is('json')) {
        const body = req.body;
        
        // Check for prototype pollution attempts
        if (body.hasOwnProperty('__proto__') || 
            body.hasOwnProperty('constructor') ||
            body.hasOwnProperty('prototype')) {
            return res.status(400).json({
                error: 'Invalid request'
            });
        }
        
        // Check body size (max 10MB)
        const bodySize = JSON.stringify(body).length;
        if (bodySize > 10 * 1024 * 1024) {
            return res.status(413).json({
                error: 'Request body too large'
            });
        }
    }
    next();
};

// Input sanitization - remove potentially dangerous characters
const sanitizeInput = (str) => {
    if (typeof str !== 'string') return str;
    return str
        .replace(/[<>]/g, '') // Remove angle brackets
        .replace(/["'`]/g, '') // Remove quotes
        .trim();
};

module.exports = {
    validations,
    handleValidationErrors,
    validateJsonInput,
    sanitizeInput
};
