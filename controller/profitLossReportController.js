const ProfitLossReport = require('../models/ProfitLossReport');
const Project = require('../models/Project');
const MaterialMapping = require('../models/MaterialMapping');
const SalaryConfig = require('../models/SalaryConfig');
const ProjectExpenditure = require('../models/ProjectExpenditure');

const generateProfitLossReportData = async (projectId, fromDate, toDate) => {
    // Frontend sends the project ID (_id), so we use findById instead of findOne
    // to find the project. This fixes the main logic mismatch.
    const project = await Project.findById(projectId);
    
    if (!project) {
        throw new Error('Project not found');
    }
    const totalBudget = project.totalCost || 0;

    // Fetch and process only Material data
    const materialData = await MaterialMapping.find({
        projectId: project._id, // Use the found project's _id for subsequent queries
        date: { $gte: new Date(fromDate), $lte: new Date(toDate) }
    }).populate('materialId', 'materialName');
    
    const materialDetails = materialData.map(item => ({
        materialId: item.materialId,
        materialName: item.materialId.materialName,
        date: item.date,
        amount: item.stockOut * item.costPerUnit,
    }));
    const totalMaterialExpenditure = materialDetails.reduce((sum, item) => sum + item.amount, 0);

    // Fetch and process only Salary data
    const salaryData = await SalaryConfig.find({
        projectId: project._id, // Use the found project's _id
        fromDate: { $gte: new Date(fromDate) },
        toDate: { $lte: new Date(toDate) }
    }).populate('manpowerId', 'manpowerName');

    const salaryDetails = salaryData.map(item => ({
        manpowerId: item.manpowerId,
        manpowerName: item.manpowerId.manpowerName,
        fromDate: item.fromDate,
        toDate: item.toDate,
        amount: item.totalSalary,
    }));
    const totalSalaryExpenditure = salaryDetails.reduce((sum, item) => sum + item.amount, 0);

    // Fetch and process only Other expenditure data
    const otherData = await ProjectExpenditure.find({
        projectId: project._id, // Use the found project's _id
        expenditureType: 'Other',
        createdAt: { $gte: new Date(fromDate), $lte: new Date(toDate) }
    });

    const otherDetails = otherData.map(item => ({
        name: item.expenditureName,
        fromDate: item.createdAt,
        toDate: item.createdAt, 
        amount: item.amount,
    }));
    const totalOtherExpenditure = otherDetails.reduce((sum, item) => sum + item.amount, 0);

    const totalExpenditure = totalMaterialExpenditure + totalSalaryExpenditure + totalOtherExpenditure;
    const remainingBudget = totalBudget - totalExpenditure;

    return {
        totalBudget,
        totalExpenditure,
        remainingBudget,
        materialExpenditure: { total: totalMaterialExpenditure, details: materialDetails },
        salaryExpenditure: { total: totalSalaryExpenditure, details: salaryDetails },
        otherExpenditure: { total: totalOtherExpenditure, details: otherDetails },
    };
};

exports.getAllProfitLossReports = async (req, res) => {
    try {
        const reports = await ProfitLossReport.find()
            .populate('projectId', 'projectName')
            .sort({ reportDate: -1 });
        res.json(reports);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server Error fetching reports', error: err.message });
    }
};

exports.createProfitLossReport = async (req, res) => {
    const { projectId, fromDate, toDate } = req.body;

    if (!projectId || !fromDate || !toDate) {
        return res.status(400).json({ message: 'Project ID, From Date, and To Date are required.' });
    }

    try {
        const reportData = await generateProfitLossReportData(projectId, fromDate, toDate);

        const newReport = new ProfitLossReport({
            projectId: projectId, // Use the projectId directly as it is now the _id
            fromDate,
            toDate,
            ...reportData
        });

        const savedReport = await newReport.save();
        res.status(201).json(savedReport);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server Error creating profit/loss report', error: err.message });
    }
};

exports.getProfitLossReportById = async (req, res) => {
    try {
        const report = await ProfitLossReport.findById(req.params.id)
            .populate('projectId', 'projectName');
        
        if (!report) {
            return res.status(404).json({ message: 'Profit/Loss Report not found' });
        }
        res.json(report);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid Report ID' });
        }
        res.status(500).json({ message: 'Server Error fetching report', error: err.message });
    }
};

exports.deleteProfitLossReport = async (req, res) => {
    try {
        const report = await ProfitLossReport.findById(req.params.id);

        if (!report) {
            return res.status(404).json({ message: 'Profit/Loss Report not found' });
        }

        await ProfitLossReport.deleteOne({ _id: req.params.id });
        res.json({ message: 'Profit/Loss Report removed' });
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid Report ID' });
        }
        res.status(500).json({ message: 'Server Error deleting report', error: err.message });
    }
};
