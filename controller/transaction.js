const asyncHandler = require('express-async-handler');
const Transaction = require('../models/AmountTransaction');
const Project = require('../models/Project');
const Client = require('../models/Client');
// சுருக்க செயல்பாட்டிற்குத் (Summary function) தேவையான கூடுதல் மாதிரிகள் (Models)
const MaterialMapping = require('../models/MaterialMapping');
const ProjectExpenditure = require('../models/ProjectExpenditure');
const Material = require('../models/Material');
const Manpower = require('../models/Manpower');


// @desc    Get all transactions
// @route   GET /api/transactions
// @access  Private
const getTransactions = asyncHandler(async (req, res) => {
    let query = {};
    // Admin மற்றும் Manager-ஐத் தவிர, மற்றவர்களுக்கு அவர்களின் திட்டங்களுடன் தொடர்புடைய பரிவர்த்தனைகள் மட்டும் காட்டப்படும்.
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

    if (!transaction.project) {
        res.status(404);
        throw new Error('Associated project not found for this transaction');
    }

    const associatedProject = await Project.findById(transaction.project._id);
    // அங்கீகாரம் சரிபார்ப்பு
    if (!associatedProject || (associatedProject.user?.toString() !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'manager')) {
        res.status(401);
        throw new Error('Not authorized to view this transaction');
    }

    res.status(200).json(transaction);
});

// @desc    Create a new transaction
// @route   POST /api/transactions
// @access  Private
const createTransaction = asyncHandler(async (req, res) => {
    // type field விடுபட்டுள்ளது, எனவே அதை req.body-இல் இருந்து பிரித்தெடுக்க வேண்டும்
    const { project, type, amount, transactionDate, description } = req.body;

    if (!project || !amount || !type) {
        res.status(400);
        throw new Error('Please add project, type, and amount');
    }

    const existingProject = await Project.findById(project);
    // அங்கீகாரம் சரிபார்ப்பு: திட்டத்தின் உரிமையாளர் அல்லது Admin/Manager-ஆ என்று பார்க்கிறது
    if (!existingProject || (existingProject.user?.toString() !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'manager')) {
        res.status(400);
        throw new Error('Invalid project ID or project does not belong to user / not authorized');
    }

    const transaction = await Transaction.create({
        project,
        type, // type இப்போது சரியாகப் பயன்படுத்தப்படுகிறது
        amount,
        transactionDate: transactionDate || Date.now(),
        description,
        user: req.user.id
    });

    res.status(201).json(transaction);
});

// @desc    Update a transaction
// @route   PUT /api/transactions/:id
// @access  Private
const updateTransaction = asyncHandler(async (req, res) => {
    const { project, type, amount, transactionDate, description } = req.body;

    let transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
        res.status(404);
        throw new Error('Transaction not found');
    }

    if (!transaction.project) {
        res.status(404);
        throw new Error('Associated project not found for this transaction');
    }

    const associatedProject = await Project.findById(transaction.project._id);
    // அங்கீகாரம் சரிபார்ப்பு
    if (!associatedProject || (associatedProject.user?.toString() !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'manager')) {
        res.status(401);
        throw new Error('Not authorized to update this transaction');
    }

    // திட்ட மாற்றத்திற்கான அங்கீகாரம் சரிபார்ப்பு
    if (project && transaction.project && project.toString() !== transaction.project.toString()) {
        const newProject = await Project.findById(project);
        if (!newProject || (newProject.user?.toString() !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'manager')) {
            res.status(400);
            throw new Error('New project ID is invalid or not authorized');
        }
        transaction.project = project;
    }
    
    // தரவைப் புதுப்பித்தல்
    transaction.type = type !== undefined ? type : transaction.type;
    transaction.amount = amount !== undefined ? amount : transaction.amount;
    transaction.transactionDate = transactionDate !== undefined ? transactionDate : transaction.transactionDate;
    transaction.description = description !== undefined ? description : transaction.description;

    const updatedTransaction = await transaction.save();

    res.status(200).json(updatedTransaction);
});

// @desc    Delete a transaction
// @route   DELETE /api/transactions/:id
// @access  Private
const deleteTransaction = asyncHandler(async (req, res) => {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
        res.status(404);
        throw new Error('Transaction not found');
    }

    if (!transaction.project) {
        res.status(404);
        throw new Error('Associated project not found for this transaction');
    }

    const associatedProject = await Project.findById(transaction.project._id);
    // அங்கீகாரம் சரிபார்ப்பு
    if (!associatedProject || (associatedProject.user?.toString() !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'manager')) {
        res.status(401);
        throw new Error('Not authorized to delete this transaction');
    }

    await Transaction.deleteOne({ _id: req.params.id });

    res.status(200).json({ message: 'Transaction removed' });
});

// @desc    Get transactions by project ID
// @route   GET /api/transactions/project/:projectId
// @access  Private
const getTransactionsByProject = asyncHandler(async (req, res) => {
    const { projectId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) {
        res.status(404);
        throw new Error('Project not found');
    }

    // அங்கீகாரம் சரிபார்ப்பு
    if (project.user?.toString() !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'manager') {
        res.status(401);
        throw new Error('Not authorized to view transactions for this project');
    }

    const transactions = await Transaction.find({ project: projectId }).populate('project', 'projectName');
    res.status(200).json(transactions);
});

// @desc    Get project comprehensive financial summary (General, Material, Manpower)
// @route   GET /api/transactions/summary/:projectId
// @access  Private
const getProjectTransactionsSummary = asyncHandler(async (req, res) => {
    const { projectId } = req.params;

    // திட்ட விவரங்களை (Project details) பெறுகிறது
    const project = await Project.findById(projectId).populate('client').populate('user', 'username email');

    if (!project) {
        res.status(404);
        throw new Error('Project not found');
    }

    // அங்கீகாரம் சரிபார்ப்பு (Authorization Check)
    const isAuthorizedAsClient = (req.user.role === 'client' && project.client && project.client._id?.toString() === req.user.id);

    if (project.user?.toString() !== req.user.id &&
        req.user.role !== 'admin' &&
        req.user.role !== 'manager' &&
        !isAuthorizedAsClient) {
        res.status(401);
        throw new Error('Not authorized to view this project summary');
    }

    // --- 1. பொதுவான பரிவர்த்தனைகள் (General Transactions) ---
    const generalTransactions = await Transaction.find({ project: projectId });

    const mappedTransactions = generalTransactions.map(t => ({
        id: t._id,
        date: t.transactionDate,
        amount: t.amount || 0,
        type: t.type, // 'Income' or 'Expense'
        description: t.description || (t.type === 'Income' ? 'Client Payment' : 'General Expense'),
        source: 'General',
        // கூடுதல் தரவு (No extra data needed)
    }));

    // --- 2. மூலப்பொருள் செலவுகள் (Material Expenses from MaterialMapping) ---
    // NOTE: In a real app, MaterialMapping should probably be populated or joined with Material data for richer descriptions.
    const materialMappings = await MaterialMapping.find({ projectId: projectId });

    const mappedMaterials = materialMappings.map(m => ({
        id: m._id,
        date: m.date,
        amount: m.totalCost || 0, // செலவுக்கு totalCost பயன்படுத்தப்படுகிறது
        type: 'Expense',
        description: `Material: ${m.materialName} (${m.quantityUsed} units)`,
        source: 'Material',
        // பயனர் கோரிய கூடுதல் புலங்கள் (Extra fields requested by user)
        materialName: m.materialName,
        quantityUsed: m.quantityUsed,
        totalCost: m.totalCost || 0,
    }));

    // --- 3. பணியாளர் செலவுகள் (Manpower Expenses from ProjectExpenditure) ---
    const projectExpenditures = await ProjectExpenditure.find({ projectId: projectId });

    const mappedExpenditures = projectExpenditures.map(e => ({
        id: e._id,
        date: e.toDate, // toDate-ஐ பிரதான தேதியாக பயன்படுத்துகிறது
        amount: e.totalWages || 0, // செலவுக்கு totalWages பயன்படுத்தப்படுகிறது
        type: 'Expense',
        description: `Manpower: ${e.employeeName} (Wages paid)`,
        source: 'Manpower',
        // பயனர் கோரிய கூடுதல் புலங்கள் (Extra fields requested by user)
        employeeName: e.employeeName,
        totalWages: e.totalWages || 0,
    }));

    // --- 4. அனைத்து பரிவர்த்தனைகளையும் ஒருங்கிணைத்து தேதியின்படி வரிசைப்படுத்துதல் ---
    const allTransactions = [
        ...mappedTransactions,
        ...mappedMaterials,
        ...mappedExpenditures
    ].sort((a, b) => new Date(b.date) - new Date(a.date)); // சமீபத்தியது முதலில் (Newest first)

    // --- 5. மொத்த நிதி சுருக்கத்தை கணக்கிடுதல் (Calculate Total Financial Summary) ---
    
    // A. மொத்த வருமானம் (Total Income)
    const newTotalIncome = mappedTransactions
        .filter(t => t.type === 'Income')
        .reduce((sum, t) => sum + (t.amount || 0), 0);

    // B. மொத்த செலவு (Total Expense)
    const generalExpensesTotal = mappedTransactions
        .filter(t => t.type === 'Expense')
        .reduce((sum, t) => sum + (t.amount || 0), 0);

    const materialCostsTotal = mappedMaterials
        .reduce((sum, m) => sum + (m.totalCost || 0), 0);

    const manpowerWagesTotal = mappedExpenditures
        .reduce((sum, e) => sum + (e.totalWages || 0), 0);
        
    // அனைத்து செலவுகளின் மொத்தம்
    const newTotalExpense = generalExpensesTotal + materialCostsTotal + manpowerWagesTotal;

    // C. நிகர லாபம் / நஷ்டம் (Net Profit / Loss)
    const newNetProfitLoss = newTotalIncome - newTotalExpense;
    
    // சுருக்கத்தை மிகவும் தெளிவாக அமைக்கவும்
    const summary = {
        projectName: project.projectName || 'N/A',
        clientName: project.client ? project.client.clientName : 'N/A',
        projectOwner: project.user ? project.user.username : 'N/A',
        
        // விரிவான நிதித் தரவு
        totalIncome: newTotalIncome, // அனைத்து வரவுகளின் மொத்தம்
        totalExpense: newTotalExpense, // அனைத்து செலவுகளின் மொத்தம்
        netProfitLoss: newNetProfitLoss, // நிகர லாபம் / நஷ்டம்
    };

    // allTransactions-இல் அனைத்து வகையான பரிவர்த்தனைகளும் உள்ளன
    res.json({ allTransactions: allTransactions, summary: summary });
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