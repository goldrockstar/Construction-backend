const mongoose = require('mongoose');


const invoiceFromSchema = new mongoose.Schema({
    profileId: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile' },
    companyName: { type: String, required: true },
    gst: { type: String },
    address: { type: String },
    contactNumber: { type: String }
})

const invoiceToSchema = new mongoose.Schema({
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
    clientName: { type: String, required: true },
    gst: { type: String },
    address: { type: String },
    phone: { type: String }
})

const materialSubSchema = new mongoose.Schema({
    materialName: { type: String, required: true },
    quantity: { type: Number, required: true },
    unit: { type: String, required: true },
    amount: { type: Number, required: true },
    gst : { type: String },
    finalAmount: { type: Number, default: 0 }
}) 

const expenditureSubSchema = new mongoose.Schema({
    expenditureName: { type: String, required: true },
    role : { type: String },
    description: { type: String, },
    amount: { type: Number, required: true },
})



const invoiceSchema = new mongoose.Schema({
    invoiceNumber: {type: String, required: true, unique: true},
    projectId: {type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true},
    invoiceFrom : {type: invoiceFromSchema, required: true},
    invoiceTo : {type: invoiceToSchema, required: true},
    invoiceDate: {type: Date, default: Date.now},
    dueDate : {type: Date},
    materials : {type: [materialSubSchema]},
    expenditures : {type: [expenditureSubSchema]},
    totalAmount : {type: Number, default: 0},
    signedDate : {type: Date},
    signature : {type: String},
    termsAndConditions: {type: String},
    status : {type: String, enum: ['Draft', 'Sent', 'Accepted', 'Rejected', 'Expired'], default: 'Draft'},
    createdAt : {type: Date, default: Date.now},

}, {
    timestamps: true
});

invoiceSchema.pre('save', function(next) {
   this.materials.forEach(item => {
       item.finalAmount = item.quantity * item.amount
   });

    const materialTotal = this.materials.reduce((sum, item) => sum + item.finalAmount, 0);

    const expenditureTotal = this.expenditures.reduce((sum, item) => sum + item.amount, 0);

    this.totalAmount = materialTotal + expenditureTotal;

    next();
});


module.exports = mongoose.model('Invoice', invoiceSchema);
