// Import necessary modules and models
const Quotation = require('../models/Quotation');
const MaterialMapping = require('../models/MaterialMapping');
const ExpenditureMapping = require('../models/ProjectExpenditure'); // Used for fetching actual expenses
const Project = require('../models/Project');
const Profile = require('../models/User') // Assuming 'Profile' model is alias for 'User' model
const Client = require('../models/Client');

const path = require('path');
const fs = require('fs');

const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// ... generateQuotationNumber function (Remains unchanged and correct)
const generateQuotationNumber = async () => {
    let quotationNumber;
    let isUnique = false;
    let retries = 0;
    const maxRetries = 5;

    do {
        try {
            const count = await Quotation.countDocuments();
            const date = new Date();
            const year = date.getFullYear().toString().slice(-2);
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const nextCount = count + retries + 1;

            quotationNumber = `Q${year}${month}-${nextCount.toString().padStart(4, '0')}`;

            const existingQuotation = await Quotation.findOne({ quotationNumber });
            if (!existingQuotation) {
                isUnique = true;
            } else {
                retries++;
                console.warn(`Quotation number ${quotationNumber} already exists. Retrying...`);
            }
        } catch (err) {
            console.error("Error generating quotation number:", err);
            throw new Error("Failed to generate quotation number");
        }
    } while (!isUnique && retries < maxRetries);

    if (!isUnique) {
        throw new Error("Failed to generate a unique quotation number after multiple retries.");
    }

    return quotationNumber;
};


// ... getAllQuotations function (Remains unchanged and correct)
exports.getAllQuotations = async (req, res) => {
    try {
        const quotations = await Quotation.find()
            .populate({
                path: 'projectId',
                select: 'projectName'
            })
            .populate({
                path: 'quotationFrom.profileId',
                model: 'User',
                select: 'companyName'
            })
            .populate({
                path: 'quotationTo.clientId',
                select: 'clientName'
            })
            .sort({ createdAt: -1 });

        res.status(200).json(quotations);
    } catch (err) {
        console.error('Error fetching quotations:', err.message);
        res.status(500).json({ message: 'Server Error fetching quotations', error: err.message });
    }
};

// ... getQuotationById function (Remains unchanged and correct)
exports.getQuotationById = async (req, res) => {
    try {
        const quotation = await Quotation.findById(req.params.id)
            .populate({
                path: 'projectId',
                select: 'projectName'
            })
            .populate({
                path: 'quotationFrom.profileId',
                model: 'User',
                select: 'companyName'
            })
            .populate({
                path: 'quotationTo.clientId',
                select: 'clientName'
            });

        if (!quotation) {
            return res.status(404).json({ message: 'Quotation not found' });
        }
        res.status(200).json(quotation);
    } catch (err) {
        console.error('Error fetching quotation by ID:', err.message);
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid Quotation ID format' });
        }
        res.status(500).json({ message: 'Server Error fetching quotation', error: err.message });
    }
};

// ... getProjectMaterialsAndExpenditures function (Remains unchanged and correct, but unused by FE, as FE calls individual APIs)
exports.getProjectMaterialsAndExpenditures = async (req, res) => {
    try {
        const { projectId } = req.params;

        if (!projectId) {
            return res.status(400).json({ message: 'Project ID is required.' });
        }

        const materials = await MaterialMapping.find({ projectId: projectId });
        const expenditures = await ExpenditureMapping.find({ projectId: projectId });

        res.status(200).json({ materials, expenditures });
    } catch (err) {
        console.error('Error fetching project data:', err.message);
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid Project ID format' });
        }
        res.status(500).json({ message: 'Server Error fetching project data', error: err.message });
    }
};

// ... createQuotation function (Remains unchanged and correct)
exports.createQuotation = async (req, res) => {
    const {
        projectId,
        quotationFrom,
        quotationTo,
        quotationDate,
        dueDate,
        materials,
        expenditures,
        signedDate,
        termsAndConditions,
        status,
        notes
    } = req.body;

    if (!projectId || !quotationFrom?.profileId || !quotationTo?.clientId) {
        return res.status(400).json({ message: 'Missing required fields: projectId, quotationFrom.profileId, and quotationTo.clientId are required.' });
    }

    try {
        const userProfile = await Profile.findById(quotationFrom.profileId);
        const clientInfo = await Client.findById(quotationTo.clientId);

        if (!userProfile) {
            return res.status(404).json({ message: 'Profile not found.' });
        }
        if (!clientInfo) {
            return res.status(404).json({ message: 'Client not found.' });
        }

        const quotationNumber = await generateQuotationNumber();

        const newQuotation = new Quotation({
            quotationNumber,
            projectId,
            quotationFrom: {
                profileId: userProfile._id,
                companyName: userProfile.companyName || 'N/A',
                gst: userProfile.gst,
                address: userProfile.address,
                contactNumber: userProfile.contactNumber
            },
            quotationTo: {
                clientId: clientInfo._id,
                clientName: clientInfo.clientName,
                gst: clientInfo.gst,
                address: clientInfo.address,
                phone: clientInfo.phone
            },
            quotationDate,
            dueDate,
            materials,
            expenditures,
            signedDate,
            signature: req.file ? req.file.path : null,
            termsAndConditions,
            status,
            notes
        });

        const savedQuotation = await newQuotation.save();
        res.status(201).json(savedQuotation);
    } catch (err) {
        console.error('Error creating quotation:', err.message);
        if (err.code === 11000) {
            return res.status(409).json({ message: 'Duplicate quotation number. Please try again.' });
        }
        res.status(500).json({ message: 'Server Error creating quotation', error: err.message });
    }
};

// ... updateQuotation function (Remains unchanged and correct)
exports.updateQuotation = async (req, res) => {
    if (!req.params.id) {
        return res.status(400).json({ message: 'Quotation ID is required in the URL.' });
    }

    try {
        const existingQuotation = await Quotation.findById(req.params.id);

        if (!existingQuotation) {
            return res.status(404).json({ message: 'Quotation not found' });
        }

        const updateData = { ...req.body };

        if (req.file) {
            if (existingQuotation.signature && fs.existsSync(existingQuotation.signature)) {
                fs.unlink(existingQuotation.signature, (err) => {
                    if (err) console.error("Failed to delete old signature file:", err);
                });
            }
            updateData.signature = req.file.path;
        }

        if (req.body.quotationFrom?.profileId) {
            const userProfile = await Profile.findById(req.body.quotationFrom.profileId);
            if (userProfile) {
                updateData.quotationFrom = {
                    profileId: userProfile._id,
                    companyName: userProfile.companyName,
                    gst: userProfile.gst,
                    address: userProfile.address,
                    contactNumber: userProfile.contactNumber
                };
            }
        }

        if (req.body.quotationTo?.clientId) {
            const clientInfo = await Client.findById(req.body.quotationTo.clientId);
            if (clientInfo) {
                updateData.quotationTo = {
                    clientId: clientInfo._id,
                    clientName: clientInfo.clientName,
                    gst: clientInfo.gst,
                    address: clientInfo.address,
                    phone: clientInfo.phone
                };
            }
        }

        const updatedQuotation = await Quotation.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        res.status(200).json(updatedQuotation);
    } catch (err) {
        console.error('Error updating quotation:', err.message);
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid Quotation ID format' });
        }
        res.status(500).json({ message: 'Server Error updating quotation', error: err.message });
    }
};

// ... deleteQuotation function (Remains unchanged and correct)
exports.deleteQuotation = async (req, res) => {
    try {
        console.log("Attempting to delete Quotation ID:", req.params.id);

        console.log("User attempting delete:", req.user._id, " Role:", req.user.role);

        const quotation = await Quotation.findById(req.params.id);

        if (!quotation) {
            return res.status(404).json({ message: 'Quotation not found' });
        }

        if (quotation.signature) {
            fs.unlink(quotation.signature, (err) => {
                if (err) {
                    console.error("Failed to delete signature file:", err);
                }
            });
        }

        
        await Quotation.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Quotation successfully removed' });
    } catch (err) {
        console.error('Error deleting quotation:', err.message);
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid Quotation ID format' });
        }
        res.status(500).json({ message: 'Server Error deleting quotation', error: err.message });
    }
};