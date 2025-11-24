const mongoose = require('mongoose');

const ProjectExpenditureSchema = new mongoose.Schema({
    
    manpowerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Manpower',
        required: [true, 'Manpower ID is required.'],
    },
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: [true, 'Project ID is required.'],
    },
    employeeName: {
        type: String,
        required: [true, 'Employee name is required.'],
    },
    designation: {
        type: String,
        required: [true, 'Designation is required.'],
    },
    fromDate: {
        type: Date,
        required: [true, 'From date is required.'],
    },
    toDate: {
        type: Date,
        required: [true, 'To date is required.'],
    },
    payType: {
        type: String,
        required: [true, 'Pay type is required.'],
    },
    payRate: {
        type: Number,
        required: [true, 'Pay rate is required.'],
    },
    WorkingDays: {
        type: Number,
        required: [true, 'Number of working days is required.'],
    },
    totalWages: {
        type: Number,
        required: [true, 'Total wages is required.'],
    },  
}, { timestamps: true });

module.exports = mongoose.model('ProjectExpenditure', ProjectExpenditureSchema);
