const mongoose = require('mongoose');

const manpowerSchema = new mongoose.Schema({
    name: {type: String, required: true},
    roleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Role', required: true },
    roleName: {type: String,},
    phoneNumber: {type: String, },
    address : {type: String},
    description: {type: String},
    photo : {type: String},
    createdAt: {type: Date, default: Date.now}
});

module.exports = mongoose.model('Manpower', manpowerSchema);