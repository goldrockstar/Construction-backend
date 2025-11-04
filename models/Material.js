// models/Material.js
const mongoose = require('mongoose');

const MaterialSchema = new mongoose.Schema({
    categoryName: {
        type: String,
        required: [true, 'Category name is required'],
        trim: true,
        unique: true // Category name should be unique
    },
    materialNames: {
        type: [String], // Array of strings for material names (tags)
        required: [true, 'At least one material name is required'],
        validate: {
            validator: function(v) {    
                return v && v.length > 0;
            },
            message: 'Material names cannot be empty.'
        }
    },
    unit: { // புதியது
        type: String,
        required: [true, 'Unit is required'],
        trim: true
    },
    rate: { // புதியது
        type: Number,
        required: [true, 'Rate is required'],
        min: [0, 'Rate cannot be negative']
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true // Automatically adds createdAt and updatedAt
});

// Ensure categoryName is unique
MaterialSchema.index({ categoryName: 1 }, { unique: true });

module.exports = mongoose.model('Material', MaterialSchema);