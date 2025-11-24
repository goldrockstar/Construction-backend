const mongoose = require('mongoose');

// This schema represents the log of materials issued/used for a specific project
const materialMappingSchema = new mongoose.Schema({
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    
    // Link to the main Material Inventory Item (Material Model's _id)
    materialId: { type: mongoose.Schema.Types.ObjectId, ref: 'Material', required: true }, 
    
    // Non-linked fields for historical record
    materialName: { type: String, required: true }, 
    unit: { type: String, required: true },

    // Core fields for tracking issue and usage
    quantityIssued: { type: Number, required: true, min: 0 }, // Total quantity issued for this record (deducted from Material inventory)
    quantityUsed: { type: Number, required: true, min: 0 },   // Actual quantity used (consumed for cost calculation)
    unitPrice: { type: Number, required: true, min: 0 },       // Unit price at time of issue

    // Calculated fields (based on user requirement)
    balanceQuantity: { type: Number, required: true, min: 0 }, // Calculated: quantityIssued - quantityUsed
    totalCost: { type: Number, required: true, min: 0 },       // Calculated: quantityUsed * unitPrice
    
    // Other fields
    date: { type: Date, default: Date.now },
    
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now },
});

// Pre-validate hook to ensure calculated fields are correct before saving
materialMappingSchema.pre('validate', function(next) {
    // 1. Calculate balanceQuantity (issued - used)
    this.balanceQuantity = this.quantityIssued - this.quantityUsed;

    // 2. Calculate totalCost (used * unitPrice)
    this.totalCost = this.quantityUsed * this.unitPrice;
    
    // Check for negative balance
    if (this.balanceQuantity < 0) {
        return next(new Error("Quantity Used cannot exceed Quantity Issued."));
    }
    
    next();
});

const MaterialMapping = mongoose.model('MaterialMapping', materialMappingSchema);
module.exports = MaterialMapping;