const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    client: { // Reference to the new Client model
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
    },
    projectName: { type: String, required: true },
    scope: { type: String },
    startDate: { type: Date },
    endDate: { type: Date },
    date: { type: Date },
    gst: { type: String },
    totalCost: { type: Number, required: true },
    description: { type: String },
    status: { type: String, enum: ['Planning', 'In Progress', 'On Hold', 'Completed'], default: 'Planning' },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Project', projectSchema);
