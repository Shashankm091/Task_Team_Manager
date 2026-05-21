const express = require('express');
const { check } = require('express-validator');
const { registerUser, loginUser, refreshAccessToken } = require('../controllers/authController');

const router = express.Router();

// Register route
router.post(
  '/register',
  [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail().normalizeEmail(),
    check('password', 'Password must be 6 or more characters').isLength({ min: 6 }),
    check('role', 'Role must be Admin or Member').optional().isIn(['Admin', 'Member']),
  ],
  registerUser
);

// Login route
router.post(
  '/login',
  [
    check('email', 'Please include a valid email').isEmail().normalizeEmail(),
    check('password', 'Password is required').exists(),
  ],
  loginUser
);

// Token refresh route
router.post('/refresh', refreshAccessToken);

module.exports = router;
