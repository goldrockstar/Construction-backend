const asyncHandler = require('express-async-handler');
const Client = require('../models/Client');

// --- Helper Function: Generate Client ID (Robust Version) ---
const generateClientId = async () => {
    try {
        // கடைசியாக உருவாக்கப்பட்ட கிளையன்டை எடுக்கிறோம்
        const lastClient = await Client.findOne().sort({ createdAt: -1 });

        // கிளையன்ட் எதுவும் இல்லை என்றால், இதுதான் முதல் ஐடி
        if (!lastClient || !lastClient.clientId) {
            return 'CL-0001';
        }

        // ஐடியில் உள்ள எண்களை மட்டும் பிரிக்கிறோம் (CL-0005 -> 5)
        const lastIdString = lastClient.clientId.replace(/\D/g, ''); // Remove non-digits
        const lastIdNumber = parseInt(lastIdString, 10);

        if (isNaN(lastIdNumber)) {
            // பழைய ஐடி தவறான பார்மட்டில் இருந்தால் (எ.கா: "TEST-ID"), புதிய தொடரை ஆரம்பிக்கவும்
            return 'CL-0001';
        }

        const nextIdNumber = lastIdNumber + 1;
        // 4 இலக்கங்களாக மாற்றுகிறோம் (0001)
        return `CL-${String(nextIdNumber).padStart(4, '0')}`;
    } catch (error) {
        console.error("Error generating Client ID:", error);
        return 'CL-ERROR'; // Fallback
    }
};

// --- API: Get Next ID ---
const getNextClientId = asyncHandler(async (req, res) => {
    const nextId = await generateClientId();
    res.status(200).json({ clientId: nextId });
});

// @desc    Create a new client
const createClient = asyncHandler(async (req, res) => {
    const { clientName, phoneNumber, gstNo, email, address, description } = req.body;
    const photo = req.file ? `/uploads/${req.file.filename}` : null;

    if (!clientName || !phoneNumber) {
        res.status(400);
        throw new Error('Client Name and Phone Number are required.');
    }

    // Generate ID here
    const newClientId = await generateClientId();

    const newClient = new Client({
        clientId: newClientId,
        clientName,
        phoneNumber,
        gstNo,
        email,
        address,
        description,
        photo,
        user: req.user.id,
    });

    const savedClient = await newClient.save();
    res.status(201).json(savedClient);
});

// @desc    Update existing client
const updateClient = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { clientName, phoneNumber, gstNo, email, address, description } = req.body;
    const photo = req.file ? `/uploads/${req.file.filename}` : null;

    const client = await Client.findById(id);

    if (!client) {
        res.status(404);
        throw new Error('Client not found.');
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

// @desc    Delete client
const deleteClient = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const client = await Client.findById(id);

    if (!client) {
        res.status(404);
        throw new Error('Client not found in DB');
    }

    await client.deleteOne();
    res.status(200).json({ message: 'Deleted Successfully' });
});

// @desc    Get all clients
const getAllClients = asyncHandler(async (req, res) => {
    const clients = await Client.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(clients);
});

// @desc    Get single client by ID
const getClientById = asyncHandler(async (req, res) => {
    const client = await Client.findById(req.params.id);

    if (!client) {
        res.status(404);
        throw new Error('Client not found');
    }

    res.status(200).json(client);
});

module.exports = {
    getNextClientId,
    createClient,
    updateClient,
    deleteClient,
    getAllClients,
    getClientById
};