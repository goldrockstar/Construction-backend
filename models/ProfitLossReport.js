const mongoose = require('mongoose');

// Sub-schema for summarizing materials expenditure
const reportMaterialBreakdownSchema = new mongoose.Schema({
    materialName: { type: String, required: true },
    totalCost: { type: Number, required: true, default: 0 },
});

// Sub-schema for summarizing other project expenditures/expenses
const reportExpenditureBreakdownSchema = new mongoose.Schema({
    expenditureName: { type: String, required: true },
    totalCost: { type: Number, required: true, default: 0 },
});

// Sub-schema for summarizing key transaction data
const reportTransactionSummarySchema = new mongoose.Schema({
    transactionType: { type: String, required: true }, // e.g., 'Receipt', 'Payment'
    transactionDate: { type: Date, required: true },
    amount: { type: Number, required: true },
    description: { type: String },
});

// Sub-schema for summarizing key invoice data
const reportInvoiceSummarySchema = new mongoose.Schema({
    invoiceNumber: { type: String, required: true },
    invoiceDate: { type: Date, required: true },
    totalAmount: { type: Number, required: true },
    status: { type: String, required: true }, // e.g., 'Draft', 'Sent', 'Accepted', 'Paid'
});


const profitLossReportSchema = new mongoose.Schema({
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },

    reportDate: {
        type: Date,
        default: Date.now
    },

    fromDate: {
        type: Date,
        required: true
    },
    toDate: {
        type: Date,
        required: true
    },

    // --- P&L Summary (Balance Sheet Overview) ---

    // Total Revenue (Billed + Receipts)
    totalRevenue: {
        type: Number,
        default: 0
    },

    // Total Cost of Goods/Services (Materials + Project Expenditure)
    totalCost: {
        type: Number,
        default: 0
    },

    // Calculated Net Profit or Loss for the period
    netProfitLoss: {
        type: Number,
        default: 0
    },

    // --- Invoice & Payment Summary (from InvoiceSchema and partial AmountTransactionSchema) ---

    // Total amount billed across all relevant invoices (Revenue)
    totalInvoicedAmount: {
        type: Number,
        default: 0
    },

    // Total amount received against invoices (A portion of cash flow)
    totalPaymentsReceived: {
        type: Number,
        default: 0
    },

    // Outstanding amount on invoices (Accounts Receivable)
    totalOutstandingAmount: {
        type: Number,
        default: 0
    },

    // Detailed summary of invoices
    invoiceSummaries: {
        type: [reportInvoiceSummarySchema],
        default: []
    },

    // --- Expense & Transaction Breakdown (from InvoiceSchema and AmountTransactionSchema) ---

    // Total project related payments/expenses outside of specific invoice materials/expenditures
    otherProjectPaymentsTotal: {
        type: Number,
        default: 0
    },

    // Detailed breakdown of non-invoice transactions (e.g., deposits, external payments)
    transactionBreakdown: {
        type: [reportTransactionSummarySchema],
        default: []
    },
    
    // Breakdown of material costs (from Invoice.materials)
    materialBreakdown: {
        type: [reportMaterialBreakdownSchema],
        default: []
    },

    // Breakdown of other expenditures (from Invoice.expenditures)
    expenditureBreakdown: {
        type: [reportExpenditureBreakdownSchema],
        default: []
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('ProfitLossReport', profitLossReportSchema);