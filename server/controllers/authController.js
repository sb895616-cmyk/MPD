const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Send a JWT as an HttpOnly cookie and return user info.
 */
const sendTokenCookie = (res, user, statusCode) => {
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

  const isProduction = process.env.NODE_ENV === 'production';

  res.cookie('token', token, {
    httpOnly: true,
    secure: isProduction,          // HTTPS only in production
    sameSite: isProduction ? 'Strict' : 'Lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  });

  res.status(statusCode).json({
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    },
  });
};

// POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: 'All fields are required.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match.' });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    // Role is always Analyst on public registration — never trust the request body
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash: password, // pre-save hook hashes this
      role: 'Analyst',
    });

    sendTokenCookie(res, user, 201);
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    // Include passwordHash explicitly since it's select:false on the model
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+passwordHash');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }
    if (!user.isActive) {
      return res.status(403).json({ message: 'Your account has been deactivated. Contact an administrator.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    sendTokenCookie(res, user, 200);
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/logout
const logout = (req, res) => {
  res.clearCookie('token', { httpOnly: true, sameSite: 'Lax' });
  res.json({ message: 'Logged out successfully.' });
};

// GET /api/auth/me
const getMe = (req, res) => {
  // req.user is already attached by the protect middleware (no passwordHash)
  res.json({ user: req.user });
};

module.exports = { register, login, logout, getMe };
