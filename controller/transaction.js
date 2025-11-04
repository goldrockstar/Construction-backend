const asyncHandler = require('express-async-handler');
const Transaction = require('../models/AmountTransaction');
const Project = require('../models/Project');
const Client = require('../models/Client');

// @desc    Get all transactions
// @route   GET /api/transactions
// @access  Private
const getTransactions = asyncHandler(async (req, res) => {
    let query = {};
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
        const userProjects = await Project.find({ user: req.user.id }).select('_id');
        const projectIds = userProjects.map(project => project._id);
        query.project = { $in: projectIds };
    }

    const transactions = await Transaction.find(query).populate('project', 'projectName');
    res.status(200).json(transactions);
});

// @desc    Get single transaction by ID
// @route   GET /api/transactions/:id
// @access  Private
const getTransactionById = asyncHandler(async (req, res) => {
    const transaction = await Transaction.findById(req.params.id).populate('project', 'projectName');

    if (!transaction) {
        res.status(404);
        throw new Error('Transaction not found');
    }

    // Fix: Ensure transaction.project is not null before proceeding
    if (!transaction.project) {
        res.status(404);
        throw new Error('Associated project not found for this transaction');
    }

    const associatedProject = await Project.findById(transaction.project._id);
    if (!associatedProject || (associatedProject.user?.toString() !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'manager')) {
        res.status(401);
        throw new Error('Not authorized to view this transaction');
    }

    res.status(200).json(transaction);
});

// @desc    Create new transaction
// @route   POST /api/transactions
// @access  Private
const createTransaction = asyncHandler(async (req, res) => {
    const { project, amount, transactionDate, description } = req.body;

    if (!project || !amount) {
        res.status(400);
        throw new Error('Please add project and amount');
    }

    const existingProject = await Project.findById(project);
    if (!existingProject || (existingProject.user?.toString() !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'manager')) {
        res.status(400);
        throw new Error('Invalid project ID or project does not belong to user / not authorized');
    }

    const transaction = await Transaction.create({
        project,
        amount,
        transactionDate: transactionDate || Date.now(),
        description,
        user: req.user.id
    });

    res.status(201).json(transaction);
});

// @desc    Update transaction
// @route   PUT /api/transactions/:id
// @access  Private
const updateTransaction = asyncHandler(async (req, res) => {
    const { project, amount, transactionDate, description } = req.body;

    let transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
        res.status(404);
        throw new Error('Transaction not found');
    }

    // Fix: Add a check for transaction.project to prevent null reference
    if (!transaction.project) {
        res.status(404);
        throw new Error('Associated project not found for this transaction');
    }

    const associatedProject = await Project.findById(transaction.project._id);
    if (!associatedProject || (associatedProject.user?.toString() !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'manager')) {
        res.status(401);
        throw new Error('Not authorized to update this transaction');
    }

    // Fix: Add a conditional check to ensure transaction.project is not null before calling toString()
    if (project && transaction.project && project.toString() !== transaction.project.toString()) {
        const newProject = await Project.findById(project);
        if (!newProject || (newProject.user?.toString() !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'manager')) {
            res.status(400);
            throw new Error('New project ID is invalid or not authorized');
        }
        transaction.project = project;
    }

    transaction.amount = amount !== undefined ? amount : transaction.amount;
    transaction.transactionDate = transactionDate !== undefined ? transactionDate : transaction.transactionDate;
    transaction.description = description !== undefined ? description : transaction.description;

    const updatedTransaction = await transaction.save();

    res.status(200).json(updatedTransaction);
});

// @desc    Delete transaction
// @route   DELETE /api/transactions/:id
// @access  Private
const deleteTransaction = asyncHandler(async (req, res) => {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
        res.status(404);
        throw new Error('Transaction not found');
    }

    // Fix: Ensure transaction.project is not null before proceeding
    if (!transaction.project) {
        res.status(404);
        throw new Error('Associated project not found for this transaction');
    }

    const associatedProject = await Project.findById(transaction.project._id);
    if (!associatedProject || (associatedProject.user?.toString() !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'manager')) {
        res.status(401);
        throw new Error('Not authorized to delete this transaction');
    }

    // இனி associatedProject-ஐ பாதுகாப்பாகப் பயன்படுத்தலாம்
    // Fix: Use optional chaining to avoid error if associatedProject.user is null
    if (associatedProject.user?.toString() !== req.user.id) {
        res.status(401);
        throw new Error('Not authorized to perform this action');
    }

    await Transaction.deleteOne({ _id: req.params.id });

    res.status(200).json({ message: 'Transaction removed' });
});

// @desc    Get all transactions for a specific project
// @route   GET /api/transactions/project/:projectId
// @access  Private
const getTransactionsByProject = asyncHandler(async (req, res) => {
    const { projectId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) {
        res.status(404);
        throw new Error('Project not found');
    }

    if (project.user?.toString() !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'manager') {
        res.status(401);
        throw new Error('Not authorized to view transactions for this project');
    }

    const transactions = await Transaction.find({ project: projectId }).populate('project', 'projectName');
    res.status(200).json(transactions);
});

// @desc    Get transactions and summary for a specific project
// @route   GET /api/transactions/summary/:projectId
// @access  Private
const getProjectTransactionsSummary = asyncHandler(async (req, res) => {
    const { projectId } = req.params;

    const project = await Project.findById(projectId).populate('client').populate('user', 'username email');

    if (!project) {
        res.status(404);
        throw new Error('Project not found');
    }

    // Fix: Use optional chaining to prevent error if project.user is null
    // Authorization logic for project summary
    const isAuthorizedAsClient = (req.user.role === 'client' && project.client && project.client._id?.toString() === req.user.id);
    
    // Fix: Use optional chaining to prevent error if project.user is null
    if (project.user?.toString() !== req.user.id &&
        req.user.role !== 'admin' &&
        req.user.role !== 'manager' &&
        !isAuthorizedAsClient) {
        res.status(401);
        throw new Error('Not authorized to view this project summary');
    }

    const transactions = await Transaction.find({ project: projectId })
        .sort({ transactionDate: -1 });

    let totalGivenAmount = 0;
    transactions.forEach(t => {
        totalGivenAmount += t.amount || 0;
    });

    const remainingAmount = project.totalCost - totalGivenAmount;

    const summary = {
        projectName: project.projectName || 'N/A',
        totalBudget: project.totalCost || 0,
        givenAmount: totalGivenAmount,
        remainingAmount: remainingAmount,
        clientName: project.client ? project.client.clientName : 'N/A',
        projectOwner: project.user ? project.user.username : 'N/A'
    };

    res.json({ data: transactions, summary: summary });
});


module.exports = {
    getTransactions,
    getTransactionById,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    getTransactionsByProject,
    getProjectTransactionsSummary
};
