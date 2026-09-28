/**
 * User Controller
 * Handles user profile management
 */

const User = require('../models/User');
const bcrypt = require('bcryptjs');

/**
 * Update user profile
 * PUT /api/user/profile
 */
const updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const updates = {};

    if (name) updates.name = name.trim();
    if (email) {
      // Check if new email is already taken by another user
      const emailTaken = await User.findOne({
        email: email.toLowerCase(),
        _id: { $ne: req.user._id },
      });
      if (emailTaken) {
        return res.status(409).json({ message: 'Email already in use.' });
      }
      updates.email = email.toLowerCase().trim();
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    res.json({
      message: 'Profile updated successfully!',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        totalInterviews: user.totalInterviews,
        averageScore: user.averageScore,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Failed to update profile.' });
  }
};

/**
 * Change user password
 * PUT /api/user/password
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new passwords are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters.' });
    }

    // Get user with password
    const user = await User.findById(req.user._id).select('+password');

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect.' });
    }

    user.password = newPassword; // Will be hashed by pre-save hook
    await user.save();

    res.json({ message: 'Password changed successfully!' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Failed to change password.' });
  }
};

/**
 * Get user stats (dashboard summary)
 * GET /api/user/stats
 */
const getUserStats = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({
      stats: {
        totalInterviews: user.totalInterviews,
        averageScore: user.averageScore,
      },
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ message: 'Failed to fetch stats.' });
  }
};

module.exports = { updateProfile, changePassword, getUserStats };
