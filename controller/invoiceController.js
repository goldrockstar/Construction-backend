const Invoice = require('../models/Invoice');
const MaterialMapping = require('../models/MaterialMapping');
const ExpenditureMapping = require('../models/ProjectExpenditure');
const Project = require('../models/Project');
const Profile = require('../models/User')
const Client = require('../models/Client');

const fs = require('fs');
const path = require('path');

const uploadPath = path.join(__dirname, '../uploads');

if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath);
}

const generateInvoiceNumber = async () => {
    let invoiceNumber = 1;
    let isUnique = false;
    let retries = 0;
    const maxRetries = 5;

    do {
        try {
            const count = await Invoice.countDocuments();
            const date = new Date();
            const year = date.getFullYear().toString().slice(-2);
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const nextCount = count + retries + 1;

            invoiceNumber = `Q${year}${month}-${nextCount.toString().padStart(4, '0')}`;

            const existingInvoice = await Invoice.findOne({ invoiceNumber });
            if (!existingInvoice) {
                isUnique = true;
            } else {
                retries++;
                console.warn(`Invoice number ${invoiceNumber} already exists. Retrying...`);
            }
        } catch (error) {
            console.error("Error generating invoice number:", error);
            throw new Error("Failed to generate invoice number");
        }
    } while (!isUnique && retries < maxRetries);

    if (!isUnique) {
        throw new Error("Failed to generate unique invoice number after retries");
    }
    return invoiceNumber;
};

exports.getAllInvoices = async (req, res) => {
    try {
        const invoices = await Invoice.find()
            .populate({
                path: 'projectId',
                select: 'projectName'
            })
            .populate({
                path: 'invoiceFrom.profileId',
                select: 'companyName'
            })
            .populate({
                path: 'invoiceTo.clientId',
                select: 'clientName'
            })
            .sort({ createdAt: -1});
            res.status(200).json(invoices);
    } catch (err) {
        console.error('Error fetching invoices:', err.message);
        res.status(500).json({ message: 'Server Error fetching invoices', error: err.message });
    }
};


exports.getInvoiceById = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id)
            .populate({
                path: 'projectId',
                select: 'projectName'
            })
            .populate({
                path: 'invoiceFrom.profileId',
                select: 'companyName'
            })
            .populate({
                path: 'invoiceTo.clientId',
                select: 'clientName'
            });

        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }
        res.status(200).json(invoice);
    } catch (error) {
        console.error('Error fetching invoice by ID:', error.message);
        if (error.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid Invoice ID format' });
        }
        res.status(500).json({ message: 'Server Error fetching invoice', error: error.message });
    }
};

exports.getProjectMaterialsAndExpenditures = async (req, res) => {
    try {
        const { projectId } = req.params;

        if (!projectId) {
            return res.status(400).json({ message: 'Project ID is required.' });
        }

        const materials = await MaterialMapping.find({ projectId });
        const expenditures = await ExpenditureMapping.find({ projectId });

        res.status(200).json({ materials, expenditures });
    } catch (error) {
       console.error('Error fetching project data:', error.message);
        if (error.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid Project ID format' });
        } 
        res.status(500).json({ message: 'Server Error fetching project data', error: error.message });
    }
};

exports.createInvoice = async (req, res) => {
    // Destructure the fields from the request body.
    // The frontend sends profileId and invoiceTo (client ID) as top-level properties.
    const { projectId, profileId, invoiceTo, invoiceDate, dueDate, materials, expenditures, signedDate, signature , termsAndConditions, status, notes } = req.body;

    if (!projectId || !profileId || !invoiceTo ) {
        return res.status(400).json({ message: 'Project ID, Profile ID, and Client ID are required.' });
    }

    try {
        const userProfile = await Profile.findById(profileId);
        const clientInfo = await Client.findById(invoiceTo);

        if (!userProfile) {
            return res.status(404).json({ message: 'Profile not found.' });
        }

        if (!clientInfo) {
            return res.status(404).json({ message: 'Client not found.' });
        }

        const invoiceNumber = await generateInvoiceNumber();

        const newInvoice = new Invoice({
            invoiceNumber,
            projectId,
            invoiceFrom: { // Use the fetched userProfile data to create the nested object
                profileId: userProfile._id,
                companyName: userProfile.companyName,
                gst: userProfile.gst,
                address: userProfile.address,
                contactNumber: userProfile.contactNumber
            },
            invoiceTo: { // Use the fetched clientInfo data to create the nested object
                clientId: clientInfo._id,
                clientName: clientInfo.clientName,
                gst: clientInfo.gst,
                address: clientInfo.address,
                phone: clientInfo.phone
            },
            invoiceDate,
            dueDate,
            materials,
            expenditures,
            signedDate,
            signature: req.file ? req.file.path : null,
            termsAndConditions,
            status,
            notes
        });

        const savedInvoice = await newInvoice.save();
        res.status(200).json(savedInvoice);
    } catch (error) {
        console.error('Error creating invoice:', error.message);
        if (error.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid Profile ID or Client ID format' });
        }
        res.status(500).json({ message: 'Server Error creating invoice', error: error.message });
    }
};

exports.updateInvoice = async (req, res) => {
    const { projectId, profileId, invoiceTo, invoiceDate, dueDate, materials, expenditures, signedDate, signature, termsAndConditions, status, notes } = req.body;

    if (!req.params.id) {
        return res.status(400).json({ message: 'Invoice ID is required in the URL.' });
    }

    try {
        const existingInvoice = await Invoice.findById(req.params.id);

        if (!existingInvoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        const updateData = { ...req.body };

        if (req.file) {
            if (existingInvoice.signature && fs.existsSync(existingInvoice.signature)) {
                fs.unlink(existingInvoice.signature, (err) => {
                    if (err) console.error('Failed to delete signature file:', err);
                });
            }
            updateData.signature = req.file.path;
        }
        
        // This block ensures that even if invoiceFrom and invoiceTo are sent as empty strings,
        // we populate them correctly using the top-level IDs.
        if (profileId) {
            const userProfile = await Profile.findById(profileId);
            if (userProfile) {
                updateData.invoiceFrom = {
                    profileId: userProfile._id,
                    companyName: userProfile.companyName,
                    gst: userProfile.gst,
                    address: userProfile.address,
                    contactNumber: userProfile.contactNumber
                };
            }
        }

        if (invoiceTo) {
            const clientInfo = await Client.findById(invoiceTo);
            if (clientInfo) {
                updateData.invoiceTo = {
                    clientId: clientInfo._id,
                    clientName: clientInfo.clientName,
                    gst: clientInfo.gst,
                    address: clientInfo.address,
                    phone: clientInfo.phone
                };
            }
        }

        const updatedInvoice = await Invoice.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        res.status(200).json(updatedInvoice);
    } catch (error) {
        console.error('Error updating invoice:', error.message);
        if (error.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid Invoice ID format' });
        }
        res.status(500).json({ message: 'Server Error updating invoice', error: error.message });
    }
};

exports.deleteInvoice = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id);

        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        if (invoice.signature) {
            fs.unlink(invoice.signature, (err) => {
                if (err) {
                    console.error("Failed to delete signature file:", err);
                }
            });
        }

        await Invoice.findOneAndDelete( req.params.id );
        res.status(200).json({ message: 'Invoice Successfully Deleted' });
    } catch (err) {
        console.error('Error deleting invoice:', err.message);
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid Invoice ID' });
        }
        res.status(500).json({ message: 'Server Error deleting invoice', error: err.message });
    }
};
