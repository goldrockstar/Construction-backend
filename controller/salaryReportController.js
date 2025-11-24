const asyncHandler = require('express-async-handler');
const Project = require('../models/Project');
const Transaction = require('../models/AmountTransaction');
// MaterialMapping மற்றும் ProjectExpenditure நீக்கப்பட்டது

// Helper function to determine which projects the user is authorized to view
const getAuthorizedProjectIds = async (req) => {
    if (req.user.role === 'admin' || req.user.role === 'manager') {
        return null; 
    }
    const userProjects = await Project.find({ user: req.user.id }).select('_id');
    return userProjects.map(project => project._id);
};

// @desc      1. Get Monthly Income vs. Expenditure Report (Transactions Only)
// @route     GET /api/reports/financial-summary
// @access    Private (Admin/Manager/Owner)
const getMonthlyFinancialSummary = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end.getFullYear() - 1, end.getMonth(), end.getDate());

    const authorizedProjectIds = await getAuthorizedProjectIds(req);

    let projectFilter = {};
    if (authorizedProjectIds) {
        if (authorizedProjectIds.length === 0) {
            return res.status(200).json({ summary: [], message: 'No authorized projects found for this user.' });
        }
        projectFilter = { $in: authorizedProjectIds };
    }

    // --- General Transactions Only (Income & Expense) ---
    const generalTransactions = await Transaction.aggregate([
        { 
            $match: {
                transactionDate: { $gte: start, $lte: end },
                project: authorizedProjectIds ? projectFilter : { $exists: true } 
            }
        },
        { 
            $project: {
                month: { $dateToString: { format: "%Y-%m", date: "$transactionDate" } },
                income: { $cond: { if: { $eq: ["$type", "Income"] }, then: "$amount", else: 0 } },
                expense: { $cond: { if: { $eq: ["$type", "Expense"] }, then: "$amount", else: 0 } },
            }
        }
    ]);

    // Group and sum up income and expense by month
    const monthlySummaryMap = generalTransactions.reduce((acc, record) => {
        const month = record.month;
        acc[month] = acc[month] || { month, totalIncome: 0, totalExpense: 0 };
        acc[month].totalIncome += record.income || 0;
        acc[month].totalExpense += record.expense || 0;
        return acc;
    }, {});

    const monthlySummary = Object.values(monthlySummaryMap)
        .map(item => ({
            ...item,
            netProfit: item.totalIncome - item.totalExpense
        }))
        .sort((a, b) => a.month.localeCompare(b.month));

    res.json({ startDate: start.toISOString().split('T')[0], endDate: end.toISOString().split('T')[0], summary: monthlySummary });
});


// @desc      2. Get Top Profit-Making Projects Report (Transactions Only)
// @route     GET /api/reports/top-profit-projects
// @access    Private (Admin/Manager/Owner)

const getSalaryReport = asyncHandler(async (req, res) => {
    const { project, fromDate, toDate } = req.body;

    const authorizedProjectIds = await getAuthorizedProjectIds(req);

    let matchQuery = {};

    // Project filter with authorization
    if (project && project !== "all") {
        matchQuery.project = project;
    } else if (authorizedProjectIds) {
        if (authorizedProjectIds.length === 0) {
            return res.status(200).json({ records: [], totalIncome: 0, totalExpense: 0 });
        }
        matchQuery.project = { $in: authorizedProjectIds };
    }

    // Date filter
    if (fromDate && toDate) {
        matchQuery.transactionDate = {
            $gte: new Date(fromDate),
            $lte: new Date(toDate)
        };
    }

    // Fetch all transactions (Income + Expense)
    const transactions = await Transaction.find(matchQuery).sort({ transactionDate: -1 });

    // Calculate totals
    const totalIncome = transactions
        .filter(t => t.type === "Income")
        .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = transactions
        .filter(t => t.type === "Expense")
        .reduce((sum, t) => sum + t.amount, 0);

    res.json({
        project,
        totalIncome,
        totalExpense,
        records: transactions
    });
});
const getTopProfitProjects = asyncHandler(async (req, res) => {
    const authorizedProjectIds = await getAuthorizedProjectIds(req);
    
    let matchFilter = {};
    if (authorizedProjectIds) {
        if (authorizedProjectIds.length === 0) {
            return res.status(200).json({ projects: [], message: 'No authorized projects found for this user.' });
        }
        matchFilter = { _id: { $in: authorizedProjectIds } };
    }

    const projectSummaryPipeline = [
        { $match: matchFilter }, 
        {
            $lookup: {
                from: 'amounttransactions',
                localField: '_id',
                foreignField: 'project',
                as: 'transactions'
            }
        },
        {
            $project: {
                projectName: 1,
                client: 1,
                totalIncome: {
                    $sum: {
                        $map: {
                            input: "$transactions",
                            as: "t",
                            in: { $cond: { if: { $eq: ["$$t.type", "Income"] }, then: "$$t.amount", else: 0 } }
                        }
                    }
                },
                totalExpense: { // Now only considers General Expenses from Transactions
                    $sum: {
                        $map: {
                            input: "$transactions",
                            as: "t",
                            in: { $cond: { if: { $eq: ["$$t.type", "Expense"] }, then: "$$t.amount", else: 0 } }
                        }
                    }
                }
            }
        },
        {
            $addFields: {
                netProfit: { $subtract: ["$totalIncome", "$totalExpense"] }
            }
        },
        { $sort: { netProfit: -1 } }, 
        { $limit: 10 } 
    ];

    const topProjects = await Project.aggregate(projectSummaryPipeline);

    res.json({ projects: topProjects, topN: 10 });
});


// @desc      3. Get Transaction Utilization/Report (Replaces Manpower Utilization)
// @route     GET /api/reports/manpower-utilization
// Note: Since we removed ProjectExpenditure, this now fetches from Transactions based on filters
const getManpowerUtilizationReport = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;

    const authorizedProjectIds = await getAuthorizedProjectIds(req);

    let matchQuery = {};
    if (authorizedProjectIds) {
         if (authorizedProjectIds.length === 0) {
            return res.status(200).json({ utilization: [] });
        }
        matchQuery.project = { $in: authorizedProjectIds };
    }

    if (startDate && endDate) {
        matchQuery.transactionDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    
    // Optional: Filter only 'Expense' types if this is strictly for Salary/Cost reporting
    // matchQuery.type = 'Expense'; 

    // Aggregate Transactions
    const utilizationReport = await Transaction.aggregate([
        { $match: matchQuery },
        {
            $lookup: {
                from: 'projects',
                localField: 'project',
                foreignField: '_id',
                as: 'projectDetails'
            }
        },
        { $unwind: "$projectDetails" },
        {
            $project: {
                _id: "$_id",
                transactionDate: 1,
                amount: 1,
                type: 1,
                description: 1, // Contains remarks/details
                projectName: "$projectDetails.projectName",
                projectId: "$project"
            }
        },
        { $sort: { transactionDate: -1 } }
    ]);
    
    res.json({ reportPeriod: { startDate, endDate }, utilization: utilizationReport });
});


module.exports = {
    getMonthlyFinancialSummary,
    getTopProfitProjects,
    getSalaryReport,
    getManpowerUtilizationReport
};