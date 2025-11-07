const ProjectExpenditure = require('../models/ProjectExpenditure');
const Project = require('../models/Project');
const Manpower = require('../models/Manpower');

// @desc Get all project expenditures
// @route GET /api/expenditures
// @access Public
exports.getAllProjectExpenditures = async (req, res) => {
    try {
        const { projectId } = req.query;

        let filter = {};

        if (projectId) {
            filter.projectId = projectId;
        }

        const projectExpenditures = await ProjectExpenditure.find(filter)
            .populate('projectId', 'projectName')
            .populate('manpowerId', 'name')
            .sort({ createdAt: -1 });
        res.json(projectExpenditures);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server Error fetching project expenditures', error: err.message });
    }
};

// @desc Get a single project expenditure by ID
// @route GET /api/expenditures/:id
// @access Public
exports.getProjectExpenditureById = async (req, res) => {
    try {
        const projectExpenditure = await ProjectExpenditure.findById(req.params.id)
            .populate('projectId', 'projectName')
            .populate('manpowerId', 'name');
        if (!projectExpenditure) {
            return res.status(404).json({ message: 'Project expenditure not found' });
        }
        res.json(projectExpenditure);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid Project Expenditure ID' });
        }
        res.status(500).json({ message: 'Server Error fetching project expenditure', error: err.message });
    }
};

// @desc Get project expenditures by project ID
// @route GET /api/expenditures/project/:projectId
// @access Public
exports.getProjectExpendituresByProjectId = async (req, res) => {
    try {
        const projectExpenditures = await ProjectExpenditure.find({ projectId: req.params.projectId })
            .populate('projectId', 'projectName')
            .populate('manpowerId', 'name')
            .sort({ createdAt: -1 });
        if (!projectExpenditures) {
            return res.status(404).json({ message: 'No project expenditures found for this project' });
        }
        res.json(projectExpenditures);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid Project ID' });
        }
        res.status(500).json({ message: 'Server Error fetching project expenditures', error: err.message });
    }
};

// @desc Create a new project expenditure
// @route POST /api/expenditures
// @access Public
exports.createProjectExpenditure = async (req, res) => {
    const { projectId, expenditureType, expenditureName, manpowerId, manpowerName, fromDate, toDate, amount, description } = req.body;

    try {
        // Create an object to hold the fields based on expenditureType
        const fieldsToSave = {
            projectId,
            expenditureType,
            amount,
            description,
            fromDate,
            toDate,
        };

        if (expenditureType === 'Salary') {
            fieldsToSave.manpowerId = manpowerId;
            fieldsToSave.manpowerName = manpowerName;
        } else if (expenditureType === 'Other') {
            fieldsToSave.expenditureName = expenditureName;
        }

        const newProjectExpenditure = new ProjectExpenditure(fieldsToSave);
        const projectExpenditure = await newProjectExpenditure.save();
        res.status(201).json(projectExpenditure);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server Error creating project expenditure', error: err.message });
    }
};

// @desc Update a project expenditure
// @route PUT /api/expenditures/:id
// @access Public
exports.updateProjectExpenditure = async (req, res) => {
    const { projectId, expenditureType, expenditureName, manpowerId, manpowerName, fromDate, toDate, amount, description } = req.body;

    try {
        let projectExpenditure = await ProjectExpenditure.findById(req.params.id);
        if (!projectExpenditure) {
            return res.status(404).json({ message: 'Project expenditure not found' });
        }

        // Update fields
        projectExpenditure.projectId = projectId || projectExpenditure.projectId;
        projectExpenditure.expenditureType = expenditureType || projectExpenditure.expenditureType;
        projectExpenditure.amount = amount !== undefined ? amount : projectExpenditure.amount;
        projectExpenditure.description = description || projectExpenditure.description;
        projectExpenditure.fromDate = fromDate || projectExpenditure.fromDate;
        projectExpenditure.toDate = toDate || projectExpenditure.toDate;
        
        // Reset and set conditional fields based on the new expenditureType
        projectExpenditure.manpowerId = undefined;
        projectExpenditure.manpowerName = undefined;
        projectExpenditure.expenditureName = undefined;

        if (projectExpenditure.expenditureType === 'Salary') {
            projectExpenditure.manpowerId = manpowerId;
            projectExpenditure.manpowerName = manpowerName;
        } else if (projectExpenditure.expenditureType === 'Other') {
            projectExpenditure.expenditureName = expenditureName;
        }

        await projectExpenditure.save();
        res.json(projectExpenditure);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid Project Expenditure ID' });
        }
        res.status(500).json({ message: 'Server Error updating project expenditure', error: err.message });
    }
};

// @desc Delete a project expenditure
// @route DELETE /api/expenditures/:id
// @access Public
exports.deleteProjectExpenditure = async (req, res) => {
    try {
        console.log("Attempting to delete ID:", req.params.id);
        const projectExpenditure = await ProjectExpenditure.findById(req.params.id);

        if (!projectExpenditure) {
            return res.status(404).json({ message: 'Project expenditure not found' });
        }

        await ProjectExpenditure.deleteOne({ _id: req.params.id });
        res.json({ message: 'Project expenditure removed' });
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid Project Expenditure ID' });
        }
        res.status(500).json({ message: 'Server Error deleting project expenditure', error: err.message });
    }
};
