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
    projectId : { type: String, required: true, unique: true },
    projectName: { type: String, required: true },
    projectType: { type: String },
    clientName: { type: String , required: true },
    startDate: { type: Date },
    expectedEndDate: { type: Date },
    actualEndDate: { type: Date },
    projectStatus: { type: String, enum: ['OnGoing', 'Completed', 'On Hold' ,'Cancelled'], default: 'OnGoing' },
    location: { type: String },
    projectManager: { type: String },
    teamMembers: { type: String },
    estimatedBudget: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Project', projectSchema);
