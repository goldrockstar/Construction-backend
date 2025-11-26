const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
    clientName: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    gstNo: { type: String },
    email: {
        type: String,
        match: [/.+@.+\..+/, "தகுந்த மின்னஞ்சல் முகவரியை உள்ளிடவும்."],
    },
    photo: { type: String },
    address: { type: String },
    description: { type: String },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Client', clientSchema);