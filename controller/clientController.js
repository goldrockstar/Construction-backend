const asyncHandler = require('express-async-handler');
const Client = require('../models/Client');
const Project = require('../models/Project');

const createProjectClient = asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const { clientName, phoneNumber, gstNo ,email, address, description } = req.body;
    const photo = req.file ? `/uploads/${req.file.filename}` : null;

    if (!clientName || !phoneNumber  || !gstNo || !email) {
        res.status(400);
        throw new Error('Client Name, Phone Number, GSTNo , and Email are required.');
    }

    const project = await Project.findById(projectId);
    if (!project) {
        res.status(404);
        throw new Error('திட்டம் கிடைக்கவில்லை.');
    }

    if (project.client) {
        res.status(400);
        throw new Error('இந்த திட்டத்திற்கு ஏற்கனவே ஒரு கிளையன்ட் உள்ளது. தயவுசெய்து புதுப்பித்தல் செயல்பாட்டைப் பயன்படுத்தவும்.'); 
    }

    const newClient = new Client({
        clientName,
        phoneNumber,
        gstNo,
        email,
        address,
        description,
        photo,
        projectId: projectId,
        user: req.user.id,
    });

    const savedClient = await newClient.save();

    project.client = savedClient._id;
    await project.save();

    res.status(201).json(savedClient);
});

const updateProjectClient = asyncHandler(async (req, res) => {
    const { clientId } = req.params;
    const { clientName, phoneNumber, gstNo , email, address, description } = req.body;
    const photo = req.file ? `/uploads/${req.file.filename}` : null;

    const client = await Client.findById(clientId);

    if (!client) {
        res.status(404);
        throw new Error('கிளையன்ட் கிடைக்கவில்லை.'); 
    }

    if (!clientName && !phoneNumber && !gstNo && !email && !address && !description && !photo) {
        res.status(400);
        throw new Error('At least one field (Client Name, Phone Number, or Email) must be provided for update.');
    }


    client.clientName = clientName || client.clientName;
    client.phoneNumber = phoneNumber || client.phoneNumber;
    client.gstNo = gstNo || client.gstNo;
    client.email = email || client.email;
    client.address = address || client.address;
    client.description = description || client.description;
    if (photo) {
        client.photo = photo;
    }

    const updatedClient = await client.save();
    res.status(200).json(updatedClient);
});

const deleteProjectClient = asyncHandler(async (req, res) => {
    const { projectId, clientId } = req.params;

    const client = await Client.findById(clientId);
    const project = await Project.findById(projectId);

    if (!client || !project) {
        res.status(404);
        throw new Error('கிளையன்ட் அல்லது திட்டம் கிடைக்கவில்லை.'); 
    }

    project.client = null;
    await project.save();

    await client.deleteOne();

    res.status(200).json({ message: 'திட்டத்திலிருந்து கிளையன்ட் வெற்றிகரமாக நீக்கப்பட்டது.' }); 
});

const getAllClients = asyncHandler(async (req, res) => {
    const clients = await Client.find({});
    res.status(200).json(clients);
});

const getProjectClientInfo = asyncHandler(async (req, res) => {
    const project = await Project.findById(req.params.projectId).populate('client');

    if (!project) {
        res.status(404);
        throw new Error('Project not found');
    }

    if (project.user && project.user.toString() !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'manager') {
        res.status(401);
        throw new Error('Not authorized to view this project');
    }

    if (!project.client) {
        return res.status(404).json({ message: 'Client information not found for this project' });
    }

    res.status(200).json(project.client);
});

module.exports = {
    createProjectClient,
    updateProjectClient,
    deleteProjectClient,
    getAllClients,
    getProjectClientInfo 
};
