// controller/salaryConfigController.js

const SalaryConfig = require('../models/SalaryConfig');
const Project = require('../models/Project');
const Role = require('../models/Role');

exports.getAllSalaryConfigs = async (req, res) => {
    try {
        const salaryConfigs = await SalaryConfig.find()
            .populate('projectId', 'projectName')
            .populate('roleId', 'name') // `name` என மாற்றப்பட்டது
            .sort({ createdAt: -1 });
        res.json(salaryConfigs);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server Error fetching salary configurations', error: err.message });
    }
};

exports.getSalaryConfigById = async (req, res) => {
    try {
        const salaryConfig = await SalaryConfig.findById(req.params.id)
            .populate('projectId', 'projectName')
            .populate('roleId', 'name'); // `name` என மாற்றப்பட்டது
        if (!salaryConfig) {
            return res.status(404).json({ message: 'Salary configuration not found' });
        }
        res.json(salaryConfig);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid Salary Configuration ID' });
        }
        res.status(500).json({ message: 'Server Error fetching salary configuration', error: err.message });
    }
};

exports.getSalaryConfigsByProjectId = async (req, res) => {
    try {
        const salaryConfigs = await SalaryConfig.find({ projectId: req.params.projectId })
            .populate('projectId', 'projectName')
            .populate('roleId'); // முழுமையான `role` ஆப்ஜெக்ட்டை `populate` செய்கிறோம்

        if (!salaryConfigs || salaryConfigs.length === 0) {
            return res.status(200).json([]);
        }

        // `roleId.name` ஃபீல்டை `roleName` என மாற்றி அனுப்புகிறோம்
        const configsWithRoleName = salaryConfigs.map(config => ({
            ...config.toObject(),
            roleName: config.roleId ? config.roleId.name : 'Unknown Role'
        }));

        res.json(configsWithRoleName);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid Project ID' });
        }
        res.status(500).json({ message: 'Server Error fetching project salary configurations', error: err.message });
    }
};

exports.createSalaryConfig = async (req, res) => {
    const { projectId, roleId, fromDate, toDate, salaryPerHead, count } = req.body;

    // `roleName` ஃபீல்டை நீக்கிவிட்டோம்
    if (!projectId || !roleId || !fromDate || !toDate || salaryPerHead === undefined || count === undefined) {
        return res.status(400).json({ message: 'All fields (Project ID, Role ID, From Date, To Date, Salary Per Head, Count) are required.' });
    }
    if (new Date(fromDate) > new Date(toDate)) {
        return res.status(400).json({ message: 'From Date cannot be after To Date.' });
    }

    try {
        const newSalaryConfig = new SalaryConfig({
            projectId,
            roleId,
            fromDate,
            toDate,
            salaryPerHead,
            count
        });

        const salaryConfig = await newSalaryConfig.save();
        res.status(201).json(salaryConfig);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server Error creating salary configuration', error: err.message });
    }
};

exports.updateSalaryConfig = async (req, res) => {
    const { projectId, roleId, fromDate, toDate, salaryPerHead, count } = req.body;

    try {
        const salaryConfig = await SalaryConfig.findByIdAndUpdate(
            req.params.id,
            {
                projectId,
                roleId,
                fromDate,
                toDate,
                salaryPerHead,
                count
            },
            { new: true, runValidators: true }
        );

        if (!salaryConfig) {
            return res.status(404).json({ message: 'Salary configuration not found' });
        }

        if (salaryConfig.salaryPerHead && salaryConfig.count) {
            salaryConfig.totalSalary = salaryConfig.salaryPerHead * salaryConfig.count;
            await salaryConfig.save();
        }

        res.json(salaryConfig);

    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid Salary Configuration ID' });
        }
        res.status(500).json({ message: 'Server Error updating salary configuration', error: err.message });
    }
};

exports.deleteSalaryConfig = async (req, res) => {
    try {
        const salaryConfig = await SalaryConfig.findByIdAndDelete(req.params.id);

        if (!salaryConfig) {
            return res.status(404).json({ message: 'Salary configuration not found' });
        }

        res.json({ message: 'Salary configuration removed' });
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid Salary Configuration ID' });
        }
        res.status(500).json({ message: 'Server Error deleting salary configuration', error: err.message });
    }
};

