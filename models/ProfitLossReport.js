const mongoose = require('mongoose');

const profitLossReportSchema = new mongoose.Schema({
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },

    reportDate: {
        type: Date,
        default: Date.now
    },

    fromDate: {
        type: Date,
        required: true
    },
    toDate: {
        type: Date,
        required: true
    },

    totalBudget: {
        type: Number,
        required: true
    },

    totalExpenditure: {
        type: Number,
        required: true
    },

    remainingBudget: {
        type: Number,
        required: true
    },
    materialExpenditure: {
        total: { type: Number, default: 0 },
        details: [{
            materialId: { type: mongoose.Schema.Types.ObjectId, ref: 'Material' },
            materialName: { type: String },
            date: { type: Date },
            amount: { type: Number },
        }]
    },

    salaryExpenditure: {
        total: { type: Number, default: 0 },
        details: [{
            manpowerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Manpower' },
            manpowerName: { type: String },
            fromDate: { type: Date },
            toDate: { type: Date },
            amount: { type: Number },
        }]
    },
    
    otherExpenditure: {
        total: { type: Number, default: 0 },
        details: [{
            name: { type: String },
            fromDate: { type: Date },
            toDate: { type: Date },
            amount: { type: Number },
        }]
    },
    
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('ProfitLossReport', profitLossReportSchema);
