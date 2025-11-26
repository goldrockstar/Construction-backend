const asyncHandler = require('express-async-handler');
const Client = require('../models/Client');

// @desc    Create a new client
// @route   POST /api/clients
// @access  Private
const createClient = asyncHandler(async (req, res) => {
    // projectId தேவையில்லை, நேரடியாக கிளையன்ட் விவரங்களை மட்டும் எடுக்கிறோம்
    const { clientName, phoneNumber, gstNo, email, address, description } = req.body;
    
    // போட்டோ இருந்தால் அதன் path-ஐ எடுக்கிறோம்
    const photo = req.file ? `/uploads/${req.file.filename}` : null;

    // Schema-வில் required: true உள்ளவற்றுக்கு மட்டும் கட்டாய சரிபார்ப்பு (Validation)
    if (!clientName || !phoneNumber) {
        res.status(400);
        throw new Error('Client Name and Phone Number are required.');
    }

    // புதிய கிளையன்ட் உருவாக்கம்
    const newClient = new Client({
        clientName,
        phoneNumber,
        gstNo,
        email,
        address,
        description,
        photo,
        user: req.user.id, // லாகின் செய்த பயனரின் ID
    });

    const savedClient = await newClient.save();
    res.status(201).json(savedClient);
});

// @desc    Update existing client
// @route   PUT /api/clients/:id
// @access  Private
const updateClient = asyncHandler(async (req, res) => {
    const { id } = req.params; // projectId-க்கு பதில் நேரடியாக clientId (id) மட்டும் போதும்
    const { clientName, phoneNumber, gstNo, email, address, description } = req.body;
    const photo = req.file ? `/uploads/${req.file.filename}` : null;

    const client = await Client.findById(id);

    if (!client) {
        res.status(404);
        throw new Error('கிளையன்ட் கிடைக்கவில்லை.');
    }

    // பயனர் அங்கீகாரம் (User Authorization) - தேவைப்பட்டால் இதை அன்கமெண்ட் செய்யவும்
    // if (client.user.toString() !== req.user.id) {
    //     res.status(401);
    //     throw new Error('User not authorized');
    // }

    // விபரங்களை அப்டேட் செய்தல்
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

// @desc    Delete client
// @route   DELETE /api/clients/:id
// @access  Private
const deleteClient = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const client = await Client.findById(id);

    if (!client) {
        res.status(404);
        throw new Error('கிளையன்ட் கிடைக்கவில்லை.');
    }

    // Project-ல் உள்ள குறிப்பை நீக்க வேண்டிய அவசியம் இருந்தால் இங்கே தனியாக எழுதலாம்.
    // ஆனால் நீங்கள் projectId வேண்டாம் என்று சொன்னதால், கிளையன்டை மட்டும் நீக்குகிறோம்.

    await client.deleteOne();

    res.status(200).json({ message: 'கிளையன்ட் வெற்றிகரமாக நீக்கப்பட்டது.' });
});

// @desc    Get all clients
// @route   GET /api/clients
// @access  Private
const getAllClients = asyncHandler(async (req, res) => {
    // லாகின் செய்த பயனரால் உருவாக்கப்பட்ட கிளையன்ட்களை மட்டும் எடுக்க:
    const clients = await Client.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(clients);
});

// @desc    Get single client by ID
// @route   GET /api/clients/:id
// @access  Private
const getClientById = asyncHandler(async (req, res) => {
    const client = await Client.findById(req.params.id);

    if (!client) {
        res.status(404);
        throw new Error('Client not found');
    }

    res.status(200).json(client);
});

module.exports = {
    createClient,
    updateClient,
    deleteClient,
    getAllClients,
    getClientById
};