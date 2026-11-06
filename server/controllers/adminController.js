const User = require('../models/User');

// GET /api/admin/users
const getUsers = async (req, res, next) => {
  try {
    const { search = '', role, status, page = 1, limit = 10 } = req.query;

    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    if (role) filter.role = role;
    if (status !== undefined) {
      filter.isActive = status === 'active';
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit)),
      User.countDocuments(filter),
    ]);

    res.json({
      data: users,
      pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/users/:id
const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json({ data: user });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/admin/users/:id/status
const updateUserStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ message: 'isActive must be a boolean.' });
    }

    const targetUser = await User.findById(req.params.id);
    if (!targetUser) return res.status(404).json({ message: 'User not found.' });

    // Prevent admin from deactivating their own account
    if (targetUser._id.toString() === req.user._id.toString() && !isActive) {
      return res.status(400).json({ message: 'You cannot deactivate your own account.' });
    }

    // Prevent deactivating the last active admin
    if (targetUser.role === 'Admin' && !isActive) {
      const activeAdminCount = await User.countDocuments({ role: 'Admin', isActive: true });
      if (activeAdminCount <= 1) {
        return res.status(400).json({ message: 'Cannot deactivate the last active administrator.' });
      }
    }

    targetUser.isActive = isActive;
    await targetUser.save();

    res.json({ data: targetUser });
  } catch (err) {
    next(err);
  }
};

module.exports = { getUsers, getUser, updateUserStatus };
