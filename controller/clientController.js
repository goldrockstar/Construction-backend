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

const deleteClient = asyncHandler(async (req, res) => {
    console.log("---------------- DELETE DEBUG START ----------------");

    // 1. Route Params என்ன வருகிறது என்று பார்ப்போம்
    console.log("Full Req Params:", req.params);

    const { id } = req.params;
    console.log("Extracted ID:", id);

    // ID 'undefined' என்று வந்தால், Route ஃபைலில் தவறு உள்ளது என்று அர்த்தம்.
    if (!id) {
        console.log("ERROR: ID is undefined. Check route parameter name.");
        return res.status(400).json({ message: "Bad Request: ID missing" });
    }

    // 2. Database-ல் தேடுதல்
    const client = await Client.findById(id);

    if (!client) {
        console.log("ERROR: Client NOT FOUND in Database for ID:", id);
        console.log("---------------- DELETE DEBUG END ----------------");
        // இதுதான் 404 எரரை அனுப்புகிறது
        return res.status(404).json({ message: 'Client not found in DB' });
    }

    // 3. அழித்தல்
    await client.deleteOne();
    console.log("SUCCESS: Client Deleted");
    console.log("---------------- DELETE DEBUG END ----------------");

    res.status(200).json({ message: 'Deleted Successfully' });
});

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