const Receipt = require('../models/Receipt');

exports.getAllReceipts = async (req, res) => {
    try {
        const receipts = await Receipt.find().sort({ date: -1, createdAt: -1 });
        res.json(receipts);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server Error fetching receipts', error: err.message });
    }
};

exports.getReceiptById = async (req, res) => {
    try {
        const receipt = await Receipt.findById(req.params.id);
        if (!receipt) {
            return res.status(404).json({ message: 'Receipt not found' });
        }
        res.json(receipt);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid Receipt ID' });
        }
        res.status(500).json({ message: 'Server Error fetching receipt', error: err.message });
    }
};

exports.createReceipt = async (req, res) => {
    const { receiptNo, date, amount, description, signedDate, signatureImage } = req.body;

    if (!receiptNo || amount === undefined) {
        return res.status(400).json({ message: 'Receipt Number and Amount are required.' });
    }

    try {
        const newReceipt = new Receipt({
            receiptNo,
            date,
            amount,
            description,
            signedDate,
            signatureImage
        });

        const receipt = await newReceipt.save();
        res.status(201).json(receipt);
    } catch (err) {
        console.error(err.message);
        if (err.code === 11000) { 
            return res.status(400).json({ message: 'Receipt Number must be unique.' });
        }
        res.status(500).json({ message: 'Server Error creating receipt', error: err.message });
    }
};

exports.updateReceipt = async (req, res) => {
    const { receiptNo, date, amount, description, signedDate, signatureImage } = req.body;

    try {
        let receipt = await Receipt.findById(req.params.id);

        if (!receipt) {
            return res.status(404).json({ message: 'Receipt not found' });
        }

        receipt.receiptNo = receiptNo || receipt.receiptNo;
        receipt.date = date || receipt.date;
        receipt.amount = amount !== undefined ? amount : receipt.amount;
        receipt.description = description || receipt.description;
        receipt.signedDate = signedDate || receipt.signedDate;
        receipt.signatureImage = signatureImage || receipt.signatureImage;

        await receipt.save();
        res.json(receipt);

    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid Receipt ID' });
        }
        if (err.code === 11000) { 
            return res.status(400).json({ message: 'Receipt Number must be unique.' });
        }
        res.status(500).json({ message: 'Server Error updating receipt', error: err.message });
    }
};

exports.deleteReceipt = async (req, res) => {
    try {
        const receipt = await Receipt.findById(req.params.id);

        if (!receipt) {
            return res.status(404).json({ message: 'Receipt not found' });
        }

        await Receipt.deleteOne({ _id: req.params.id });
        res.json({ message: 'Receipt record removed' });
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid Receipt ID' });
        }
        res.status(500).json({ message: 'Server Error deleting receipt', error: err.message });
    }
};
