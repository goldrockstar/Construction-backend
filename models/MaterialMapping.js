const mongoose = require('mongoose');

const materialMappingSchema = new mongoose.Schema({
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    materialName: { type: String, required: true },
    quantity: { type: Number, required: true, min: 0 },
    unit: { type: String, required: true },
    dateMapped: { type: Date, default: Date.now },
    vendorName: { type: String },
    vendorAddress: { type: String },
    purchaseDate: { type: Date },
    gst: { type: String },
    amount: { type: Number, required: true, min: 0 },
    finalAmount: { type: Number }, 
    gstApplicable: { type: Boolean, default: false },
    description: { type: String },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now },
});


module.exports = mongoose.model('MaterialMapping', materialMappingSchema);
