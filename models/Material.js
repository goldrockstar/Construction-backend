const mongoose = require('mongoose');

const MaterialSchema = new mongoose.Schema({

    materialId: { type: String, required: true, unique: true }, // unique: true already handles the index
    materialNames: {
        type: [String], // Array of strings for material names (tags)
        required: [true, 'At least one material name is required'],
        validate: {
            validator: function (v) {
                return v && v.length > 0;
            },
            message: 'Material names cannot be empty.'
        }
    },
    unitofMeasure: {
        type: String,
        required: [true, 'Unit is required'],
        trim: true
    },
    availableQuantity: {
        type: Number,
        required: [true, 'Available quantity is required'],
        min: [0, 'Available quantity cannot be negative']
    },
    reorderedLevel: {
        type: Number,
        required: [true, 'Reorder level is required'],
        min: [20, 'Reorder level cannot be negative']
    },
    purchasePrice: {
        type: Number,
        required: [true, 'Purchase price is required'],
    },
    supplierName: { type: String },
    status: {
        type: String,
        required: true,
        enum: ['Available', 'Low Stock', 'Out of Stock'] // <--- These are the ONLY accepted values
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
    timestamps: true
});

module.exports = mongoose.model('Material', MaterialSchema);