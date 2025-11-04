const SalaryReport = require('../models/SalaryReport');
const SalaryConfig = require('../models/SalaryConfig');
const Project = require('../models/Project');

const generateSalaryReportData = async (projectId, fromDate, toDate) => {
    const salaryConfigs = await SalaryConfig.find({
            projectId: projectId,
            fromDate: { $gte: new Date(fromDate) },
            toDate: { $lte: new Date(toDate) }
        })
        .populate('manpowerId', 'manpowerName')
        .populate('roleId', 'roleName');

    let totalProjectSalary = 0;
    const manpowerDetails = [];

    salaryConfigs.forEach(config => {
        totalProjectSalary += config.totalSalary;
        manpowerDetails.push({
            manpowerId: config.manpowerId._id,
            manpowerName: config.manpowerId.manpowerName,
            roleId: config.roleId._id,
            roleName: config.roleId.roleName,
            totalManpowerSalary: config.totalSalary
        });
    });

    return { totalProjectSalary, manpowerDetails };
};

exports.getAllSalaryReports = async (req, res) => {
    try {
        const salaryReports = await SalaryReport.find()
            .populate('projectId', 'projectName') 
            .sort({ reportDate: -1 });
        res.json(salaryReports);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server Error fetching salary reports', error: err.message });
    }
};
exports.getSalaryReportById = async (req, res) => {
    try {
        const salaryReport = await SalaryReport.findById(req.params.id)
            .populate('projectId', 'projectName');
        
        if (!salaryReport) {
            return res.status(404).json({ message: 'Salary Report not found' });
        }
        res.json(salaryReport);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid Salary Report ID' });
        }
        res.status(500).json({ message: 'Server Error fetching salary report', error: err.message });
    }
};

exports.createSalaryReport = async (req, res) => {
    const { projectId, fromDate, toDate } = req.body;

    if (!projectId || !fromDate || !toDate) {
        return res.status(400).json({ message: 'Project ID, From Date, and To Date are required.' });
    }

    try {
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ message: 'Project not found.' });
        }

        const { totalProjectSalary, manpowerDetails } = await generateSalaryReportData(projectId, fromDate, toDate);

        const newSalaryReport = new SalaryReport({
            projectId,
            fromDate,
            toDate,
            totalProjectSalary,
            manpowerDetails
        });

        const savedReport = await newSalaryReport.save();
        res.status(201).json(savedReport);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server Error creating salary report', error: err.message });
    }
};

exports.deleteSalaryReport = async (req, res) => {
    try {
        const salaryReport = await SalaryReport.findById(req.params.id);

        if (!salaryReport) {
            return res.status(404).json({ message: 'Salary Report not found' });
        }

        await SalaryReport.deleteOne({ _id: req.params.id });
        res.json({ message: 'Salary Report removed' });
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid Salary Report ID' });
        }
        res.status(500).json({ message: 'Server Error deleting salary report', error: err.message });
    }
};
