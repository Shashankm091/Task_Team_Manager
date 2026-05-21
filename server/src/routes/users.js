const express = require('express');
const { protect, authorizeRoles } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// Get all users (Private - logged in users can see team members)
router.get('/', protect, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ name: 1 });
    res.json({ success: true, count: users.length, data: users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update a user's role (Private/Admin only)
router.put('/:id/role', protect, authorizeRoles('Admin'), async (req, res) => {
  const { role } = req.body;

  if (!role || !['Admin', 'Member'].includes(role)) {
    return res.status(400).json({ success: false, message: 'Please provide a valid role: Admin or Member' });
  }

  try {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Prevent self-demotion
    if (targetUser._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot change your own role' });
    }

    targetUser.role = role;
    await targetUser.save();

    res.json({
      success: true,
      message: `User role updated to ${role}`,
      data: {
        id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
