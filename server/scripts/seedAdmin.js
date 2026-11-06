/**
 * Seed Script: Admin User
 * Creates the initial admin account from environment variables.
 * Safe to run multiple times — skips creation if the admin already exists.
 *
 * Usage: npm run seed:admin
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

    if (!ADMIN_EMAIL || !ADMIN_PASSWORD || !ADMIN_NAME) {
      console.error('Error: ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD must be set in .env');
      process.exit(1);
    }
    if (ADMIN_PASSWORD.length < 8) {
      console.error('Error: ADMIN_PASSWORD must be at least 8 characters.');
      process.exit(1);
    }

    const existing = await User.findOne({ email: ADMIN_EMAIL.toLowerCase().trim() });
    if (existing) {
      console.log(`Admin account already exists for ${ADMIN_EMAIL}. Skipping.`);
      await mongoose.disconnect();
      return;
    }

    await User.create({
      name: ADMIN_NAME.trim(),
      email: ADMIN_EMAIL.toLowerCase().trim(),
      passwordHash: ADMIN_PASSWORD, // pre-save hook hashes this
      role: 'Admin',
      isActive: true,
    });

    console.log(`Admin account created successfully: ${ADMIN_EMAIL}`);
    await mongoose.disconnect();
  } catch (err) {
    console.error('Seed error:', err.message);
    process.exit(1);
  }
})();
