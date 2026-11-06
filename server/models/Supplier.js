const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema(
  {
    supplierCode: {
      type: String,
      required: [true, 'Supplier code is required'],
      unique: true,
      trim: true,
      uppercase: true,
      maxlength: [20, 'Supplier code cannot exceed 20 characters'],
    },
    name: {
      type: String,
      required: [true, 'Supplier name is required'],
      trim: true,
      maxlength: [150, 'Name cannot exceed 150 characters'],
    },
    contactPerson: {
      type: String,
      trim: true,
      maxlength: [100, 'Contact person name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
    },
    phone: {
      type: String,
      trim: true,
      maxlength: [20, 'Phone cannot exceed 20 characters'],
    },
    industry: {
      type: String,
      trim: true,
      maxlength: [80, 'Industry cannot exceed 80 characters'],
    },
    country: {
      type: String,
      trim: true,
      maxlength: [80, 'Country cannot exceed 80 characters'],
    },
    city: {
      type: String,
      trim: true,
      maxlength: [80, 'City cannot exceed 80 characters'],
    },
    address: {
      type: String,
      trim: true,
      maxlength: [250, 'Address cannot exceed 250 characters'],
    },
    yearsInOperation: {
      type: Number,
      min: [0, 'Years in operation cannot be negative'],
      max: [500, 'Years in operation value is unrealistic'],
    },
    annualContractValue: {
      type: Number,
      min: [0, 'Annual contract value cannot be negative'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

// Index for fast searches by name or code
supplierSchema.index({ name: 'text', supplierCode: 'text' });

module.exports = mongoose.model('Supplier', supplierSchema);
