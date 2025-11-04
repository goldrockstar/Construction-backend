const mongoose = require('mongoose');

const receiptSchema = new mongoose.Schema({
    receiptNo : {type: String, required: true, unique: true},
    date: {type: Date, default: Date.now},
    amount : {type: Number, required: true, min: 0},
    description : {type: String},
    signedDate : {type: Date},
    signatureImage: {type: String},
    createdAt : {type: Date, default: Date.now},
});

module.exports = mongoose.model('Receipt', receiptSchema);
