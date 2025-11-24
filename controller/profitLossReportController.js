const mongoose = require('mongoose');

// --- Required Model Imports (Assuming these models are correctly defined elsewhere) ---
// Since we don't have the full model files, we use 'require' placeholders.
const ProfitLossReport = require('../models/ProfitLossReport');
const Project = require('../models/Project');
const MaterialMapping = require('../models/MaterialMapping');
const SalaryConfig = require('../models/SalaryConfig');
const ProjectExpenditure = require('../models/ProjectExpenditure');
// We need to reference Invoice and AmountTransaction models:
const Invoice = mongoose.models.Invoice || mongoose.model('Invoice', new mongoose.Schema({
    projectId: mongoose.Schema.Types.ObjectId,
    invoiceNumber: String,
    invoiceDate: Date,
    totalAmount: Number, // Total billed amount
    materials: [{ materialName: String, finalAmount: Number }], // Assuming the pre-save hook handles finalAmount
    expenditures: [{ expenditureName: String, amount: Number }],
    status: String,
    // Add other fields as needed for calculation
}));
const AmountTransaction = mongoose.models.AmountTransaction || mongoose.model('AmountTransaction', new mongoose.Schema({
    project: mongoose.Schema.Types.ObjectId,
    type: String, // 'Receipt' or 'Payment'
    transactionDate: Date,
    amount: Number,
    description: String,
}));


// Helper function to generate the P&L Report Data
const generateProfitLossReportData = async (projectId, fromDate, toDate) => {
    // Convert dates to proper Date objects for query consistency
    const startDate = new Date(fromDate);
    const endDate = new Date(toDate);

    // Filter condition for all time-based queries
    const dateFilter = { $gte: startDate, $lte: endDate };

    // --- 1. Fetch Revenue Data (Invoices) ---
    // Consider invoices that have been sent, accepted, or paid for revenue calculation
    const invoices = await Invoice.find({
        projectId: projectId,
        invoiceDate: dateFilter,
        status: { $in: ['Sent', 'Accepted', 'Paid'] }
    });

    let totalInvoicedAmount = 0;
    const invoiceSummaries = [];
    const invoiceMaterialBreakdownMap = new Map();
    const invoiceExpenditureBreakdownMap = new Map();

    invoices.forEach(invoice => {
        totalInvoicedAmount += invoice.totalAmount;
        invoiceSummaries.push({
            invoiceNumber: invoice.invoiceNumber,
            invoiceDate: invoice.invoiceDate,
            totalAmount: invoice.totalAmount,
            status: invoice.status,
        });

        // Aggregate material costs from invoices (for detailed cost breakdown)
        invoice.materials.forEach(m => {
            const name = m.materialName;
            const cost = m.finalAmount || 0;
            invoiceMaterialBreakdownMap.set(name, (invoiceMaterialBreakdownMap.get(name) || 0) + cost);
        });

        // Aggregate expenditure costs from invoices (for detailed cost breakdown)
        invoice.expenditures.forEach(e => {
            const name = e.expenditureName;
            const cost = e.amount || 0;
            invoiceExpenditureBreakdownMap.set(name, (invoiceExpenditureBreakdownMap.get(name) || 0) + cost);
        });
    });

    // --- 2. Fetch Cash Flow Data (AmountTransactions) ---
    const transactions = await AmountTransaction.find({
        project: projectId,
        transactionDate: dateFilter,
    });

    let totalPaymentsReceived = 0; // Type: 'Receipt'
    let otherProjectPaymentsTotal = 0; // Type: 'Payment' (other project costs/expenses)
    const transactionBreakdown = [];

    transactions.forEach(t => {
        if (t.type === 'Receipt') {
            totalPaymentsReceived += t.amount;
        } else if (t.type === 'Payment') {
            otherProjectPaymentsTotal += t.amount;
        }

        transactionBreakdown.push({
            transactionType: t.type,
            transactionDate: t.transactionDate,
            amount: t.amount,
            description: t.description,
        });
    });

    // Simple calculation for Outstanding Amount (Invoiced - Received)
    const totalOutstandingAmount = totalInvoicedAmount - totalPaymentsReceived;

    // --- 3. Fetch Existing Custom Cost Data (for Project Cost/Expenditure) ---

    // *A. Material Expenditure from MaterialMapping (Using existing user logic)*
    const materialData = await MaterialMapping.find({
        projectId: projectId,
        date: dateFilter
    }).populate('materialId', 'materialName');
    
    let totalMaterialExpenditure = 0;
    materialData.forEach(item => {
        const cost = item.stockOut * item.costPerUnit;
        totalMaterialExpenditure += cost;
        // Merge with invoice breakdown map (prioritizing custom cost tracking over invoice listing)
        const name = item.materialId.materialName;
        invoiceMaterialBreakdownMap.set(name, (invoiceMaterialBreakdownMap.get(name) || 0) + cost);
    });

    // *B. Salary Expenditure from SalaryConfig (Using existing user logic)*
    const salaryData = await SalaryConfig.find({
        projectId: projectId,
        fromDate: { $lte: endDate }, // Check if period overlaps
        toDate: { $gte: startDate } // Check if period overlaps
    }).populate('manpowerId', 'manpowerName');

    let totalSalaryExpenditure = 0;
    salaryData.forEach(item => {
        const cost = item.totalSalary;
        totalSalaryExpenditure += cost;
        // Add to the general expenditure breakdown map
        const name = `Salary - ${item.manpowerId.manpowerName}`;
        invoiceExpenditureBreakdownMap.set(name, (invoiceExpenditureBreakdownMap.get(name) || 0) + cost);
    });

    // *C. Other Project Expenditure from ProjectExpenditure (Using existing user logic)*
    const otherData = await ProjectExpenditure.find({
        projectId: projectId,
        expenditureType: 'Other',
        createdAt: dateFilter
    });

    let totalOtherProjectExpenditure = 0;
    otherData.forEach(item => {
        totalOtherProjectExpenditure += item.amount;
        // Add to the general expenditure breakdown map
        const name = item.expenditureName || 'Uncategorized Other Expense';
        invoiceExpenditureBreakdownMap.set(name, (invoiceExpenditureBreakdownMap.get(name) || 0) + item.amount);
    });


    // --- 4. Final Calculations and Formatting ---

    // Total Cost = All custom expenditures + payments made via AmountTransaction
    const totalCost = totalMaterialExpenditure + totalSalaryExpenditure + totalOtherProjectExpenditure + otherProjectPaymentsTotal;

    // Total Revenue = Total Invoiced Amount (main source of income)
    const totalRevenue = totalInvoicedAmount; 

    const netProfitLoss = totalRevenue - totalCost;

    // Format maps to arrays for the report schema
    const materialBreakdown = Array.from(invoiceMaterialBreakdownMap, ([materialName, totalCost]) => ({ materialName, totalCost }));
    const expenditureBreakdown = Array.from(invoiceExpenditureBreakdownMap, ([expenditureName, totalCost]) => ({ expenditureName, totalCost }));
    
    // Construct the final report object
    return {
        // P&L Summary
        totalRevenue,
        totalCost,
        netProfitLoss,

        // Invoice & Payment Summary
        totalInvoicedAmount,
        totalPaymentsReceived,
        totalOutstandingAmount,
        invoiceSummaries,

        // Expense & Transaction Breakdown
        otherProjectPaymentsTotal,
        transactionBreakdown,
        materialBreakdown,
        expenditureBreakdown,
    };
};

// --- Controller Functions (Updated to use the new return structure) ---

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

        // Map the calculated data directly to the new ProfitLossReport schema
        const newReport = new ProfitLossReport({
            projectId: projectId,
            fromDate,
            toDate,
            ...reportData
        });

        const savedReport = await newReport.save();
        res.status(201).json(savedReport);
    } catch (err) {
        console.error(err.message);
        // Log detailed error for debugging purposes
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