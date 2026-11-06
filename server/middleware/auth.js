const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protect middleware — verifies the JWT from the HttpOnly cookie.
 * Attaches req.user if valid; rejects with 401 otherwise.
 */
const protect = async (req, res, next) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      return res.status(401).json({ message: 'Not authenticated. Please log in.' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ message: 'Session expired or invalid. Please log in again.' });
    }

    // Fetch user and check account is still active
    const user = await User.findById(decoded.id).select('-passwordHash');
    if (!user) {
      return res.status(401).json({ message: 'User no longer exists.' });
    }
    if (!user.isActive) {
      return res.status(403).json({ message: 'Your account has been deactivated. Contact an administrator.' });
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Authorize middleware factory — restricts access to specified roles.
 * Must be used after protect.
 * @param {...string} roles - Allowed roles, e.g. 'Admin'
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. Requires one of: ${roles.join(', ')}.`,
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
