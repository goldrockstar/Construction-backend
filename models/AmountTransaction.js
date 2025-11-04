const mongoose = require('mongoose');

const AmountTransactionSchema = new mongoose.Schema({
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true,
    },
    transactionDate: {
        type: Date,
        default: Date.now,
        required: true,
    },
    amount: {
        type: Number,
        required: [true, 'Please add an amount'],
        min: [0, 'Amount cannot be negative'],
    },
    description: {
        type: String,
        trim: true,
    },
    user: { // To link transaction to a user who created it
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('AmountTransaction', AmountTransactionSchema);