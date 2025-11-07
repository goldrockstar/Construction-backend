const mongoose = require('mongoose');

// ... (quotationFromSchema, quotationToSchema, materialSubSchema - Remain unchanged)
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

const materialSubSchema = new mongoose.Schema({
    materialName: { type: String, required: true },
    quantity: { type: Number, required: true },
    unit: { type: String, required: true },
    amount: { type: Number, required: true },
    gst: { type: String },
    finalAmount: { type: Number, default: 0 }
});

// The expenditure schema is correct and supports both 'role' (for manpower) and 'description' (for other)
const expenditureSubSchema = new mongoose.Schema({
    expenditureName: { type: String, required: true },
    role: { type: String },
    description: { type: String },
    amount: { type: Number, required: true },
    // Ensure the expenditureType field is present in the database to distinguish Manpower vs Other
    // NOTE: This field is crucial but seems missing in your model.
    // ADD THIS FIELD to make the distinction clear in the stored quotation data:
    expenditureType: {
        type: String,
        enum: ['Salary', 'Other'], // 'Salary' corresponds to Manpower, 'Other' to Other Expenditures
        required: true
    }
});

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
    materials: [materialSubSchema],
    expenditures: [expenditureSubSchema], // This array contains both Salary (Manpower) and Other
    totalAmount: {
        type: Number,
        default: 0
    },
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
    }
}, {
    timestamps: true
});

// ... pre('save') hook (Remains unchanged and correct)
quotationSchema.pre('save', function (next) {
    this.materials.forEach(item => {
        item.finalAmount = item.quantity * item.amount;
    });

    const materialTotal = this.materials.reduce((sum, item) => sum + item.finalAmount, 0);

    const expenditureTotal = this.expenditures.reduce((sum, item) => sum + item.amount, 0);

    this.totalAmount = materialTotal + expenditureTotal;

    next();
});

module.exports = mongoose.model('Quotation', quotationSchema);