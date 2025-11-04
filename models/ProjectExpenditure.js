const mongoose = require('mongoose');

const ProjectExpenditureSchema = new mongoose.Schema({
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: [true, 'Project ID is required.'],
    },
    expenditureType: {
        type: String,
        enum: ['Salary', 'Other'],
        required: [true, 'Expenditure Type is required.'],
    },
    expenditureName: {
        type: String,
        required: function() {
            // 'expenditureName' is only required if the expenditureType is 'Other'
            return this.expenditureType === 'Other';
        }
    },
    manpowerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Manpower',
        required: function() {
            // 'manpowerId' is only required if the expenditureType is 'Salary'
            return this.expenditureType === 'Salary';
        }
    },
    manpowerName: {
        type: String,
        required: function() {
            // 'manpowerName' is only required if the expenditureType is 'Salary'
            return this.expenditureType === 'Salary';
        }
    },
    fromDate: {
        type: Date,
        required: [true, 'From Date is required.'],
    },
    toDate: {
        type: Date,
        required: [true, 'To Date is required.'],
    },
    amount: {
        type: Number,
        required: [true, 'Amount is required.'],
        min: [0, 'Amount must be a positive number.']
    },
    description: {
        type: String,
        default: ''
    }
}, { timestamps: true });

module.exports = mongoose.model('ProjectExpenditure', ProjectExpenditureSchema);
