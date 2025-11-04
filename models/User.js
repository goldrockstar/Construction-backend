const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    email: {
        type: String,
        unique: true,
        sparse: true, 
        match: [/.+@.+\..+/, 'Please use a valid email address']
    },
    role: {
        type: String,
        enum: ['admin', 'manager', 'employee', 'client'],
        default: 'admin'
    },
    profile: {
        firstName: String,
        lastName: String,
        companyName: String,
        contactNumber: String,
        gst: String,
        tinNumber: String,
        address: String,
        natureOfWork: String,
        logo: String 
    },
    createdAt: { type: Date, default: Date.now }
});

userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next(); 
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);