const mongoose = require('mongoose');

/**
 * Validates that a route parameter is a valid MongoDB ObjectId.
 * Usage: router.get('/:id', validateObjectId('id'), controller)
 */
const validateObjectId = (paramName = 'id') => (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params[paramName])) {
    return res.status(400).json({ message: `Invalid ${paramName} format.` });
  }
  next();
};

module.exports = { validateObjectId };
