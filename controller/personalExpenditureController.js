const PersonalExpenditure = require('../models/PersonalExpenditure');
const User = require('../models/User');

exports.getAllPersonalExpenditures = async (req, res) => {
    try {
        const personalExpenditures = await PersonalExpenditure.find({ userId: req.user.id })
            .populate('userId', 'name email')
            .sort({ fromDate: -1 });
        res.json(personalExpenditures);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server Error fetching personal expenditures', error: err.message });
    }
};

exports.getPersonalExpenditureById = async (req, res) => {
    try {
        const personalExpenditure = await PersonalExpenditure.findOne({ _id: req.params.id, userId: req.user.id })
            .populate('userId', 'name email');

        if (!personalExpenditure) {
            return res.status(404).json({ message: 'Personal expenditure not found or you do not have access' });
        }
        res.json(personalExpenditure);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid Personal Expenditure ID' });
        }
        res.status(500).json({ message: 'Server Error fetching personal expenditure', error: err.message });
    }
};

exports.createPersonalExpenditure = async (req, res) => {
    const { fromDate, toDate, amount, description } = req.body;

    if (!fromDate || !toDate || amount === undefined || amount === null) {
        return res.status(400).json({ message: 'From Date, To Date, and Amount are required.' });
    }

    if (typeof amount !== 'number' || amount < 0) {
        return res.status(400).json({ message: 'Amount must be a non-negative number.' });
    }
    
    if (new Date(fromDate) > new Date(toDate)) {
        return res.status(400).json({ message: 'From Date cannot be after To Date.' });
    }

    try {
        const newPersonalExpenditure = new PersonalExpenditure({
            userId: req.user.id,
            fromDate,
            toDate,
            amount,
            description
        });

        const personalExpenditure = await newPersonalExpenditure.save();
        res.status(201).json(personalExpenditure);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server Error creating personal expenditure', error: err.message });
    }
};

exports.updatePersonalExpenditure = async (req, res) => {
    try {
        const { fromDate, toDate, amount, description } = req.body;
        const personalExpenditure = await PersonalExpenditure.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            { $set: req.body }, 
            { new: true, runValidators: true } 
        );

        if (!personalExpenditure) {
            return res.status(404).json({ message: 'Personal expenditure not found or you do not have access' });
        }

        res.json(personalExpenditure);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid Personal Expenditure ID' });
        }
        res.status(500).json({ message: 'Server Error updating personal expenditure', error: err.message });
    }
};

exports.deletePersonalExpenditure = async (req, res) => {
    try {
        const personalExpenditure = await PersonalExpenditure.findOneAndDelete({ _id: req.params.id, userId: req.user.id });

        if (!personalExpenditure) {
            return res.status(404).json({ message: 'Personal expenditure not found or you do not have access' });
        }

        res.json({ message: 'Personal expenditure removed' });
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid Personal Expenditure ID' });
        }
        res.status(500).json({ message: 'Server Error deleting personal expenditure', error: err.message });
    }
};