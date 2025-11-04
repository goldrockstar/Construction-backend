const mongoose = require('mongoose');

const materialUsageSchema = new mongoose.Schema({
    projectId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Project', 
        required: true 
    },
    // Changed to materialId for a robust link to the Material model
    materialId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Material',
        required: true
    },
    // Added materialName to the schema to cache the name for easier access
    materialName: {
        type: String,
        required: true
    },
    quantityUsed: { 
        type: Number, 
        required: true, 
        min: 0 
    },
    unit: { 
        type: String, 
        required: true 
    },
    fromDate: { 
        type: Date, 
        default: Date.now 
    },
    toDate: {
        type: Date,
        default: Date.now
    },
    notes: { 
        type: String 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
});

module.exports = mongoose.model('MaterialUsage', materialUsageSchema);