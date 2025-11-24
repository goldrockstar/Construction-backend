const mongoose = require('mongoose');

// --- Sub-Schemas for Quotation Parties ---
const quotationFromSchema = new mongoose.Schema({
    profileId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    companyName: { type: String, required: true },
    gst: { type: String },
    address: { type: String },
    contactNumber: { type: String }
});

const quotationToSchema = new mongoose.Schema({
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
    clientName: { type: String, required: true },
    gst: { type: String },
    address: { type: String },
    phone: { type: String }
});

// --- Sub-Schema for Item Line Details (Line Item Breakdown) ---
const itemSchema = new mongoose.Schema({
    Name: { type: String, required: true }, // Item Name
    hsn: { type: String },                  // HSN/SAC Code
    
    // Input Fields
    gstRate: { type: Number, required: true, min: 0 },
    quantity: { type: Number, default: 0, min: 0 },
    rate: { type: Number, default: 0, min: 0 },

    // Calculated Fields (Automatically set in pre('save') hook)
    lineAmount: { type: Number, default: 0 }, // Quantity * Rate (Subtotal for this item)
    cgst: { type: Number, default: 0 },      // Calculated CGST
    sgst: { type: Number, default: 0 },      // Calculated SGST
    lineTotal: { type: Number, default: 0 }  // lineAmount + cgst + sgst
}, { _id: false });


// --- Main Quotation Schema ---
const quotationSchema = new mongoose.Schema({
    quotationNumber: {
        type: String,
        required: true,
        unique: true
    },
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    quotationFrom: { type: quotationFromSchema, required: true },
    quotationTo: { type: quotationToSchema, required: true },
    quotationDate: {
        type: Date,
        default: Date.now
    },
    dueDate: {
        type: Date
    },
    logo: {
        type : String
    },
    // --- Array for Itemized Quotation Data ---
    items: [itemSchema],

    // --- Overall Quotation Totals ---
    subTotal: {
        type: Number,
        default: 0
    }, // Total Amount before tax (Sum of all lineAmount)
    totalCGST: {
        type: Number,
        default: 0
    }, // Sum of all line item CGST
    totalSGST: {
        type: Number,
        default: 0
    }, // Sum of all line item SGST
    grandTotal: {
        type: Number,
        default: 0
    }, // subTotal + totalCGST + totalSGST

    signedDate: {
        type: Date
    },
    signature: {
        type: String
    },
    termsAndConditions: {
        type: String
    },
    status: {
        type: String,
        enum: ['Draft', 'Sent', 'Accepted', 'Rejected', 'Expired'],
        default: 'Draft'
    },
    notes: {
        type: String
    }
}, {
    timestamps: true
});

/**
 * Pre-Save Hook for Automatic Calculation
 * This hook iterates through all items, calculates line totals and GST components (CGST/SGST),
 * and updates the overall quotation totals (subTotal, totalCGST, totalSGST, grandTotal).
 */
quotationSchema.pre('save', function (next) {
    let subTotalAccumulator = 0;
    let cgstAccumulator = 0;
    let sgstAccumulator = 0;

    // 1. Iterate through each item and calculate line totals and GST
    this.items.forEach(item => {
        // Calculate Subtotal for the Line: Quantity * Rate
        const lineAmount = item.quantity * item.rate;
        item.lineAmount = lineAmount;

        // Calculate GST Components (Assuming GST/2 for CGST and SGST)
        const gstMultiplier = item.gstRate / 100; // e.g., 18% -> 0.18
        const cgstAmount = lineAmount * (gstMultiplier / 2); 
        const sgstAmount = lineAmount * (gstMultiplier / 2); 
        
        // Rounding the GST amounts to two decimal places for accuracy
        item.cgst = Math.round(cgstAmount * 100) / 100;
        item.sgst = Math.round(sgstAmount * 100) / 100;
        
        // Calculate Line Total: Subtotal + CGST + SGST
        item.lineTotal = Math.round((lineAmount + item.cgst + item.sgst) * 100) / 100;
        
        // Accumulate to overall totals
        subTotalAccumulator += lineAmount;
        cgstAccumulator += item.cgst;
        sgstAccumulator += item.sgst;
    });

    // 2. Set the overall quotation totals (Rounding the final totals)
    this.subTotal = Math.round(subTotalAccumulator * 100) / 100;
    this.totalCGST = Math.round(cgstAccumulator * 100) / 100;
    this.totalSGST = Math.round(sgstAccumulator * 100) / 100;
    this.grandTotal = Math.round((this.subTotal + this.totalCGST + this.totalSGST) * 100) / 100;

    next();
});

module.exports = mongoose.model('Quotation', quotationSchema);