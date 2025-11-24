const mongoose = require('mongoose');

const manpowerSchema = new mongoose.Schema({
    empId : { type: String, required: true, unique: true },
    name: {type: String, required: true},
    roleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Role', required: true },
    roleName: {type: String,},
    phoneNumber: {type: String, },
    address : {type: String},
    payRateType : {type: String, enum: ['Hourly', 'Daily', 'Monthly', 'Weekly'], required: true},
    payRate : {type: Number, required: true},
    photo : {type: String},
    createdAt: {type: Date, default: Date.now}
});

module.exports = mongoose.model('Manpower', manpowerSchema);