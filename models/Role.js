// models/Role.js
const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
    roleId: {
        type: String,
        required: true,
        unique: true
    },
    name: { 
        type: String, 
        required: true, 
        unique: true,
        trim: true
    }, 
    description: { 
        type: String, 
        default: '' 
    },
    permissions: [{ 
        type: String,
        trim: true
    }],
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

module.exports = mongoose.model('Role', roleSchema);