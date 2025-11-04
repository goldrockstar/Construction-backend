const mongoose = require('mongoose');

const personalExpenditureSchema = new mongoose.Schema({
    userId : {type:mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
    fromDate : {type: Date, default: Date.now},
    toDate : {type: Date, default: Date.now},
    amount : {type: Number},
    description : {type: String},
    createdAt : {type: Date, default: Date.now},
});

module.exports = mongoose.model('PersonalExpenditure', personalExpenditureSchema);