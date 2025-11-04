const express = require('express');
const app = express();
const cors = require('cors'); // CORS middleware-ஐ இறக்குமதி செய்யவும்
const mongoose = require('mongoose');
const path = require('path');
const config = require('dotenv').config();

const UPLOAD_FOLDER = 'uploads';

// --- Core Express Middlewares ---
app.use(express.json());
app.use(express.urlencoded({ extended: false }));


const corsOptions = {
    origin: 'http://localhost:3000', 
    optionsSuccessStatus: 200 
};

app.use(cors(corsOptions)); 

app.use('/' + UPLOAD_FOLDER, express.static(path.join(__dirname, UPLOAD_FOLDER)));

// --- MongoDB Connection ---
mongoose.connect('mongodb+srv://thangeswaran:thangam1620@cluster0.nehs4.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
    .then(() => console.log("Connected to MongoDB"))
    .catch((error) => {
        console.log("MongoDB connection error:", error);
        process.exit(1);
    });

// --- Route Imports ---
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const roleRoutes = require('./routes/roleRoutes');
const materialRoutes = require('./routes/materialRoutes');
const manpowerRoutes = require('./routes/manpowerRoutes');
const projectRoutes = require('./routes/projectRoutes');
const materialMappingRoutes = require(path.join(__dirname, 'routes', 'materialMappingRoutes'));
const TransactionRoutes = require(path.join(__dirname, 'routes', 'transactionRoutes'));
const invoiceRoutes = require('./routes/invoiceRoutes');
const quotationRoutes = require('./routes/quotationRoutes');
const materialUsageRoutes = require('./routes/materialUsageRoutes');
const salaryConfigRoutes = require('./routes/salaryConfigRoutes');
const projectExpenditureRoutes = require('./routes/projectExpenditureRoutes');
const personalExpenditureRoutes = require('./routes/personalExpenditureRoutes');
const receiptRoutes = require('./routes/receiptRoutes');
const salaryReportRoutes = require('./routes/salaryReportRoutes');
const stockReportRoutes = require('./routes/stockReportRoutes');
const profitLossReportRoutes = require('./routes/profitLossReportRoutes');
const clientRoutes = require('./routes/clientRoutes');

// --- Route Usage ---
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/manpower', manpowerRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/projects', clientRoutes); // இதுதான் புதிய வரி!
app.use('/api/clients', clientRoutes);
app.use('/api/projectMaterialMappings', materialMappingRoutes);
app.use('/api/transactions', TransactionRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/material-usage', materialUsageRoutes);
app.use('/api/salary-configs', salaryConfigRoutes);
app.use('/api/expenditures', projectExpenditureRoutes);
app.use('/api/personal-expenditures', personalExpenditureRoutes);
app.use('/api/receipts', receiptRoutes);
app.use('/api/salary-reports', salaryReportRoutes);
app.use('/api/stock-reports', stockReportRoutes);
app.use('/api/profit-loss-reports', profitLossReportRoutes);

// --- Error Handling Middleware ---
app.use((err, req, res, next) => {
    console.error(err.stack);
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode).json({
        message: 'Something went wrong',
        error: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
});

// --- Base Route ---
app.get('/', (req, res) => {
    res.send('Construction Management API is running...');
});

// --- Start Server ---
app.listen(5000, () => {
    console.log(`Server is running on port 5000`);
});