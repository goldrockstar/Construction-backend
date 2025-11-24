const ProjectExpenditure = require('../models/ProjectExpenditure');
const Project = require('../models/Project');
const Manpower = require('../models/Manpower'); // Manpower Model-ஐ இறக்குமதி செய்யவும்
const path = require('path');
const fs = require('fs');

// Helper function to calculate the number of days between two dates (inclusive)
const calculateDays = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    // Ensure the time component is zeroed out for accurate day calculation
    startDate.setUTCHours(0, 0, 0, 0);
    endDate.setUTCHours(0, 0, 0, 0);

    const diffTime = Math.abs(endDate - startDate);
    // Calculate difference in days and add 1 to include both start and end dates
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; 
    return diffDays;
};

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
            
        res.json(projectExpenditures);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid Project ID' });
        }
        res.status(500).json({ message: 'Server Error fetching project expenditures', error: err.message });
    }
};


// @desc Create a new project expenditure (SIMPLIFIED FOR SALARY ONLY)
// @route POST /api/expenditures
// @access Public
exports.createProjectExpenditure = async (req, res) => {
    const { projectId, manpowerId, fromDate, toDate } = req.body;

    try {
        // 1. Manpower details-ஐப் பெறவும்
        const manpower = await Manpower.findById(manpowerId);
        if (!manpower) {
            return res.status(404).json({ message: 'Manpower employee not found' });
        }

        // 2. Working Days-ஐ கணக்கிடவும் (Calculate Working Days)
        const workingDays = calculateDays(fromDate, toDate);
        
        // 3. Wages-ஐ கணக்கிடவும் (PayRate * WorkingDays) (Calculate Wages)
        const payRate = manpower.payRate; 
        const totalWages = payRate * workingDays;
        
        // 4. செலவு தரவை உருவாக்கவும் (Create Expenditure Data)
        const dataToSave = {
            projectId,
            manpowerId,
            fromDate,
            toDate,
            // Manpower model-லிருந்து பெறப்பட்ட புலங்கள் (Fields fetched from Manpower model)
            employeeName: manpower.name, 
            designation: manpower.roleName, // <-- திருத்தம்: roleName பயன்படுத்தப்படுகிறது
            payType: manpower.payRateType,   // <-- திருத்தம்: payRateType பயன்படுத்தப்படுகிறது
            payRate: payRate,
            // கணக்கிடப்பட்ட புலங்கள்
            WorkingDays: workingDays,
            totalWages: totalWages,
        };
        
        // 5. செலவை சேமிக்கவும்
        const newProjectExpenditure = new ProjectExpenditure(dataToSave);
        const projectExpenditure = await newProjectExpenditure.save();
        res.status(201).json(projectExpenditure);

    } catch (err) {
        console.error('Error creating project expenditure:', err.message);
        // Mongoose validation errors
        if (err.name === 'ValidationError') {
            return res.status(400).json({ message: 'Validation Error', errors: err.errors });
        }
        res.status(500).json({ message: 'Server Error creating project expenditure', error: err.message });
    }
};

// @desc Update a project expenditure (SIMPLIFIED FOR SALARY ONLY)
// @route PUT /api/expenditures/:id
// @access Public
exports.updateProjectExpenditure = async (req, res) => {
    const { projectId, manpowerId, fromDate, toDate } = req.body;
    
    try {
        let projectExpenditure = await ProjectExpenditure.findById(req.params.id);
        if (!projectExpenditure) {
            return res.status(404).json({ message: 'Project expenditure not found' });
        }
        
        // Determine which manpower details to use (newly provided or existing)
        const currentManpowerId = manpowerId || projectExpenditure.manpowerId;
        const currentFromDate = fromDate || projectExpenditure.fromDate;
        const currentToDate = toDate || projectExpenditure.toDate;

        // 1. Manpower details-ஐப் பெறவும்
        const manpower = await Manpower.findById(currentManpowerId);
        if (!manpower) {
            return res.status(404).json({ message: 'Manpower employee not found or invalid ID' });
        }

        // 2. Working Days-ஐ கணக்கிடவும் (Calculate Working Days)
        const workingDays = calculateDays(currentFromDate, currentToDate);
        
        // 3. Wages-ஐ கணக்கிடவும் (PayRate * WorkingDays) (Calculate Wages)
        const payRate = manpower.payRate; 
        const totalWages = payRate * workingDays;

        // 4. புதுப்பித்த தரவை உருவாக்கவும்
        const updateData = {
            projectId: projectId || projectExpenditure.projectId, // Use new projectId or existing
            manpowerId: currentManpowerId,
            fromDate: currentFromDate,
            toDate: currentToDate,
            // Manpower model-லிருந்து பெறப்பட்ட புலங்கள்
            employeeName: manpower.name, 
            designation: manpower.roleName, // <-- திருத்தம்: roleName பயன்படுத்தப்படுகிறது
            payType: manpower.payRateType,   // <-- திருத்தம்: payRateType பயன்படுத்தப்படுகிறது
            payRate: payRate,
            // கணக்கிடப்பட்ட புலங்கள்
            WorkingDays: workingDays,
            totalWages: totalWages,
        };

        // 5. Mongoose update
        projectExpenditure = await ProjectExpenditure.findByIdAndUpdate(
            req.params.id, 
            updateData, 
            { new: true, runValidators: true } // Return the updated document and run validation
        );
        
        res.json(projectExpenditure);

    } catch (err) {
        console.error('Error updating project expenditure:', err.message);
        if (err.name === 'ValidationError') {
            return res.status(400).json({ message: 'Validation Error', errors: err.errors });
        }
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid Project Expenditure ID or Manpower ID' });
        }
        res.status(500).json({ message: 'Server Error updating project expenditure', error: err.message });
    }
};

// @desc Delete a project expenditure
// @route DELETE /api/expenditures/:id
// @access Public
exports.deleteProjectExpenditure = async (req, res) => {
    try {
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