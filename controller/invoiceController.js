const Invoice = require('../models/Invoice');
const Project = require('../models/Project'); 
const Profile = require('../models/User'); 
const Client = require('../models/Client');
const fs = require('fs');
const path = require('path');

const uploadPath = path.join(__dirname, '../uploads');

if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
}

// Helper: Generate Invoice Number
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

            invoiceNumber = `I${year}${month}-${nextCount.toString().padStart(4, '0')}`; 

            const existingInvoice = await Invoice.findOne({ invoiceNumber });
            if (!existingInvoice) {
                isUnique = true;
            } else {
                retries++;
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
            .populate({ path: 'projectId', select: 'projectName' })
            .populate({ path: 'invoiceFrom.profileId', select: 'companyName' })
            .populate({ path: 'invoiceTo.clientId', select: 'clientName' })
            .sort({ createdAt: -1});
            res.status(200).json(invoices);
    } catch (err) {
        res.status(500).json({ message: 'Server Error fetching invoices', error: err.message });
    }
};

exports.getInvoiceById = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id)
            .populate({ path: 'projectId', select: 'projectName' })
            .populate({ path: 'invoiceFrom.profileId', select: 'companyName' })
            .populate({ path: 'invoiceTo.clientId', select: 'clientName' });

        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
        res.status(200).json(invoice);
    } catch (error) {
        if (error.kind === 'ObjectId') return res.status(400).json({ message: 'Invalid Invoice ID format' });
        res.status(500).json({ message: 'Server Error fetching invoice', error: error.message });
    }
};

exports.createInvoice = async (req, res) => {
    try {
        // 1. JSON Parse Logic for FormData (File Uploads)
        let bodyData = { ...req.body };
        try {
            if (typeof bodyData.invoiceFrom === 'string') bodyData.invoiceFrom = JSON.parse(bodyData.invoiceFrom);
            if (typeof bodyData.invoiceTo === 'string') bodyData.invoiceTo = JSON.parse(bodyData.invoiceTo);
            if (typeof bodyData.items === 'string') bodyData.items = JSON.parse(bodyData.items);
        } catch (e) {
            console.error("JSON Parsing Error:", e);
            return res.status(400).json({ message: "Invalid Data Format" });
        }

        const { 
            projectId, invoiceDate, dueDate, signedDate, signature, 
            termsAndConditions, status, notes, items, 
            subTotal, totalCGST, totalSGST, grandTotal,
            invoiceFrom, invoiceTo 
        } = bodyData; 

        // Extract IDs
        const profileId = invoiceFrom?.profileId || req.body.profileId;
        const clientId = invoiceTo?.clientId || req.body.invoiceTo; 

        // Basic Validation
        if (!projectId || !profileId || !clientId || !items || items.length === 0) {
            return res.status(400).json({ message: 'Project ID, Profile ID, Client ID, and at least one item are required.' });
        }

        // 2. Fetch Details from DB (To ensure correct data)
        const userProfile = await Profile.findById(profileId);
        const clientInfo = await Client.findById(clientId);

        if (!userProfile) return res.status(404).json({ message: 'User Profile not found' });
        if (!clientInfo) return res.status(404).json({ message: 'Client not found' });

        const invoiceNumber = await generateInvoiceNumber();

        // 3. Create Invoice with Merged Data
        const newInvoice = new Invoice({
            invoiceNumber,
            projectId,
            
            invoiceFrom: { 
                profileId: userProfile._id,
                companyName: userProfile.companyName || invoiceFrom.companyName, 
                gst: userProfile.gst || invoiceFrom.gst,
                address: userProfile.address || invoiceFrom.address,
                contactNumber: userProfile.contactNumber || invoiceFrom.contactNumber
            },
            
            invoiceTo: { 
                clientId: clientInfo._id,
                clientName: clientInfo.clientName || invoiceTo.clientName || invoiceTo.name, 
                address: clientInfo.address || invoiceTo.address,
                phone: clientInfo.phoneNumber || clientInfo.contactNumber || invoiceTo.phone, // Check multiple fields
                
                // --- GST FIX: Check DB first, then Frontend ---
                gst: clientInfo.gst || clientInfo.gstNo || invoiceTo.gst 
            },

            invoiceDate,
            dueDate,
            items, 
            subTotal,
            totalCGST,
            totalSGST,
            grandTotal,
            signedDate,
            signature: req.file ? req.file.path : signature,
            termsAndConditions,
            status,
            notes
        });

        const savedInvoice = await newInvoice.save();
        res.status(201).json(savedInvoice);
        
    } catch (error) {
        console.error('Error creating invoice:', error.message);
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path); // Cleanup file on error
        }
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: 'Invoice validation failed', error: error.message });
        }
        res.status(500).json({ message: 'Server Error creating invoice', error: error.message });
    }
};

exports.updateInvoice = async (req, res) => {
    if (!req.params.id) return res.status(400).json({ message: 'Invoice ID is required.' });

    try {
        const existingInvoice = await Invoice.findById(req.params.id);
        if (!existingInvoice) return res.status(404).json({ message: 'Invoice not found' });

        // 1. JSON Parse Logic for Update
        let updateData = { ...req.body };
        try {
            if (typeof updateData.invoiceFrom === 'string') updateData.invoiceFrom = JSON.parse(updateData.invoiceFrom);
            if (typeof updateData.invoiceTo === 'string') updateData.invoiceTo = JSON.parse(updateData.invoiceTo);
            if (typeof updateData.items === 'string') updateData.items = JSON.parse(updateData.items);
        } catch (e) {
            console.error("JSON Parsing Error in Update:", e);
            return res.status(400).json({ message: "Invalid Data Format" });
        }

        // Handle signature file update
        if (req.file) {
            if (existingInvoice.signature && fs.existsSync(existingInvoice.signature)) {
                fs.unlink(existingInvoice.signature, (err) => { if (err) console.error(err); });
            }
            updateData.signature = req.file.path;
        }

        // 2. Refresh Client Details if Client Changed
        if (updateData.invoiceTo?.clientId) {
            const clientInfo = await Client.findById(updateData.invoiceTo.clientId);
            if (clientInfo) {
                updateData.invoiceTo = {
                    clientId: clientInfo._id,
                    clientName: clientInfo.clientName || updateData.invoiceTo.clientName,
                    
                    // --- GST FIX for Update ---
                    gst: clientInfo.gst || clientInfo.gstNo || updateData.invoiceTo.gst, 
                    
                    address: clientInfo.address || updateData.invoiceTo.address,
                    phone: clientInfo.phoneNumber || clientInfo.contactNumber || updateData.invoiceTo.phone
                };
            }
        }

        // 3. Refresh Profile Details if Profile Changed
        if (updateData.invoiceFrom?.profileId) {
            const userProfile = await Profile.findById(updateData.invoiceFrom.profileId);
            if (userProfile) {
                updateData.invoiceFrom = {
                    profileId: userProfile._id,
                    companyName: userProfile.companyName || updateData.invoiceFrom.companyName,
                    gst: userProfile.gst || updateData.invoiceFrom.gst,
                    address: userProfile.address || updateData.invoiceFrom.address,
                    contactNumber: userProfile.contactNumber || updateData.invoiceFrom.contactNumber
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
         if (error.name === 'ValidationError') {
            return res.status(400).json({ message: 'Validation failed', error: error.message });
        }
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.deleteInvoice = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id);
        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

        if (invoice.signature && fs.existsSync(invoice.signature)) {
            fs.unlink(invoice.signature, (err) => { if (err) console.error(err); });
        }

        await Invoice.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Invoice Successfully Deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Server Error deleting invoice', error: err.message });
    }
};