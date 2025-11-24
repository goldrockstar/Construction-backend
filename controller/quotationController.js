// Import necessary modules and models
const Quotation = require('../models/Quotation');
const Project = require('../models/Project'); // Assuming you have this model
const Profile = require('../models/User') // Assuming 'Profile' model is alias for 'User' model
const Client = require('../models/Client'); // Assuming you have this model

const path = require('path');
const fs = require('fs');

// Ensure the uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

/**
 * Function to generate a unique quotation number (e.g., Q2511-0001)
 */
const generateQuotationNumber = async () => {
    let quotationNumber;
    let isUnique = false;
    let retries = 0;
    const maxRetries = 5;

    do {
        try {
            // Get the total count of documents to generate the next sequence number
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


/**
 * GET: Retrieve all quotations
 */
exports.getAllQuotations = async (req, res) => {
    try {
        const quotations = await Quotation.find()
            .populate({ path: 'projectId', select: 'projectName' })
            .populate({ path: 'quotationFrom.profileId', model: 'User', select: 'companyName' })
            .populate({ path: 'quotationTo.clientId', select: 'clientName' })
            .sort({ createdAt: -1 });

        res.status(200).json(quotations);
    } catch (err) {
        console.error('Error fetching quotations:', err.message);
        res.status(500).json({ message: 'Server Error fetching quotations', error: err.message });
    }
};

/**
 * GET: Retrieve quotation by ID
 */
exports.getQuotationById = async (req, res) => {
    try {
        const quotation = await Quotation.findById(req.params.id)
            .populate({ path: 'projectId', select: 'projectName' })
            .populate({ path: 'quotationFrom.profileId', model: 'User', select: 'companyName' })
            .populate({ path: 'quotationTo.clientId', select: 'clientName' });

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

/**
 * POST: Create a new quotation
 */
exports.createQuotation = async (req, res) => {
    let {
        projectId,
        quotationFrom,
        quotationTo,
        items, 
        quotationDate,
        dueDate,
        signedDate,
        termsAndConditions,
        status,
        notes
    } = req.body;

    // Fix for Multer: Parse stringified nested objects and arrays
    try {
        if (typeof quotationFrom === 'string') quotationFrom = JSON.parse(quotationFrom);
        if (typeof quotationTo === 'string') quotationTo = JSON.parse(quotationTo);
        if (typeof items === 'string') items = JSON.parse(items); // Parse items array
    } catch (e) {
        // Delete the uploaded file if JSON parsing fails after upload
        if (req.file) {
            fs.unlink(req.file.path, (err) => {
                if (err) console.error("Failed to delete orphaned signature file:", err);
            });
        }
        console.error('JSON parsing error in createQuotation:', e.message);
        return res.status(400).json({ message: 'Invalid JSON format for nested fields (quotationFrom, quotationTo, or items).', error: e.message });
    }

    if (!projectId || !quotationFrom?.profileId || !quotationTo?.clientId || !items || items.length === 0) {
        return res.status(400).json({ message: 'Missing required fields: projectId, profileId, clientId, and at least one item are required.' });
    }

    try {
        // Fetch Profile and Client details to populate nested sub-documents
        const userProfile = await Profile.findById(quotationFrom.profileId);
        const clientInfo = await Client.findById(quotationTo.clientId);

        if (!userProfile) {
            return res.status(404).json({ message: 'Profile (quotationFrom) not found.' });
        }
        if (!clientInfo) {
            return res.status(404).json({ message: 'Client (quotationTo) not found.' });
        }

        const quotationNumber = await generateQuotationNumber();

        const newQuotation = new Quotation({
            quotationNumber,
            projectId,
            // Populate quotationFrom fields from Profile data
            quotationFrom: {
                profileId: userProfile._id,
                companyName: userProfile.companyName || quotationFrom.companyName || 'N/A', // Use request body fallback if profile is missing
                gst: userProfile.gst || quotationFrom.gst,
                address: userProfile.address || quotationFrom.address,
                contactNumber: userProfile.contactNumber || quotationFrom.contactNumber
            },
            // Populate quotationTo fields from Client data
            quotationTo: {
                clientId: clientInfo._id,
                clientName: clientInfo.clientName,
                gst: clientInfo.gst || quotationTo.gst,
                address: clientInfo.address || quotationTo.address,
                phone: clientInfo.phone || quotationTo.phone
            },
            items, // Include the items array from request body
            quotationDate,
            dueDate,
            signedDate,
            signature: req.file ? req.file.path : null, // Store file path if uploaded
            termsAndConditions,
            status,
            notes
        });

        // The pre('save') hook in the model will automatically calculate all totals.
        const savedQuotation = await newQuotation.save();
        res.status(201).json(savedQuotation);
    } catch (err) {
        // Delete uploaded file on server error
        if (req.file) {
            fs.unlink(req.file.path, (e) => {
                if (e) console.error("Failed to delete orphaned signature file:", e);
            });
        }
        console.error('Error creating quotation:', err.message);
        if (err.code === 11000) {
            return res.status(409).json({ message: 'Duplicate quotation number. Please try again.' });
        }
        res.status(500).json({ message: 'Server Error creating quotation', error: err.message });
    }
};

/**
 * PUT: Update an existing quotation
 */
exports.updateQuotation = async (req, res) => {
    if (!req.params.id) {
        return res.status(400).json({ message: 'Quotation ID is required in the URL.' });
    }

    const fileToDelete = req.file ? req.file.path : null; // Path of the newly uploaded file if error occurs

    try {
        const existingQuotation = await Quotation.findById(req.params.id);

        if (!existingQuotation) {
            // Delete the new file if quotation is not found
            if (fileToDelete) fs.unlinkSync(fileToDelete);
            return res.status(404).json({ message: 'Quotation not found' });
        }

        const updateData = { ...req.body };

        // Fix for Multer: Parse stringified nested objects and the items array
        try {
            if (updateData.quotationFrom && typeof updateData.quotationFrom === 'string') {
                updateData.quotationFrom = JSON.parse(updateData.quotationFrom);
            }
            if (updateData.quotationTo && typeof updateData.quotationTo === 'string') {
                updateData.quotationTo = JSON.parse(updateData.quotationTo);
            }
            if (updateData.items && typeof updateData.items === 'string') { 
                updateData.items = JSON.parse(updateData.items);
            }
        } catch (e) {
            // Delete the new file if JSON parsing fails
            if (fileToDelete) fs.unlinkSync(fileToDelete);
            console.error('JSON parsing error in updateQuotation:', e.message);
            return res.status(400).json({ message: 'Invalid JSON format for nested fields in update (quotationFrom, quotationTo, or items).', error: e.message });
        }

        // Handle signature file update
        if (req.file) {
            // Delete old signature file if it exists
            if (existingQuotation.signature && fs.existsSync(existingQuotation.signature)) {
                fs.unlink(existingQuotation.signature, (err) => {
                    if (err) console.error("Failed to delete old signature file:", err);
                });
            }
            updateData.signature = req.file.path;
        }

        // --- Update 'quotationFrom' with Profile data ---
        if (updateData.quotationFrom?.profileId) {
            const userProfile = await Profile.findById(updateData.quotationFrom.profileId);
            if (userProfile) {
                updateData.quotationFrom = {
                    profileId: userProfile._id,
                    companyName: userProfile.companyName || updateData.quotationFrom.companyName,
                    gst: userProfile.gst || updateData.quotationFrom.gst,
                    address: userProfile.address || updateData.quotationFrom.address,
                    contactNumber: userProfile.contactNumber || updateData.quotationFrom.contactNumber
                };
            }
        } else if (existingQuotation.quotationFrom.profileId) {
            // Ensure profileId is maintained even if only other fields are updated
             updateData.quotationFrom = updateData.quotationFrom || {};
             updateData.quotationFrom.profileId = existingQuotation.quotationFrom.profileId;
        }

        // --- Update 'quotationTo' with Client data ---
        if (updateData.quotationTo?.clientId) {
            const clientInfo = await Client.findById(updateData.quotationTo.clientId);
            if (clientInfo) {
                updateData.quotationTo = {
                    clientId: clientInfo._id,
                    clientName: clientInfo.clientName || updateData.quotationTo.clientName,
                    gst: clientInfo.gst || updateData.quotationTo.gst,
                    address: clientInfo.address || updateData.quotationTo.address,
                    phone: clientInfo.phone || updateData.quotationTo.phone
                };
            }
        } else if (existingQuotation.quotationTo.clientId) {
            // Ensure clientId is maintained even if only other fields are updated
             updateData.quotationTo = updateData.quotationTo || {};
             updateData.quotationTo.clientId = existingQuotation.quotationTo.clientId;
        }
        
        // Use findByIdAndUpdate to trigger the pre('save') hook (must use save() method after fetch or use findOneAndUpdate/updateMany/etc with middleware option)
        // Since we are using $set, we should use findByIdAndUpdate with runValidators: true
        // However, findByIdAndUpdate with $set only partially works for nested schemas and does not trigger the pre('save') correctly on all fields.
        // The safest method to guarantee the pre('save') hook runs and updates the calculated totals is:

        Object.assign(existingQuotation, updateData);
        
        // The pre('save') hook will handle recalculation of totals when save() is called.
        const updatedQuotation = await existingQuotation.save();

        res.status(200).json(updatedQuotation);
    } catch (err) {
        // Delete the new file if server error occurs during update
        if (fileToDelete) fs.unlinkSync(fileToDelete);

        console.error('Error updating quotation:', err.message);
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid Quotation ID format' });
        }
        res.status(500).json({ message: 'Server Error updating quotation', error: err.message });
    }
};

/**
 * DELETE: Delete a quotation
 */
exports.deleteQuotation = async (req, res) => {
    try {
        const quotation = await Quotation.findById(req.params.id);

        if (!quotation) {
            return res.status(404).json({ message: 'Quotation not found' });
        }

        // Delete signature file if it exists
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