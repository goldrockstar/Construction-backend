const StockReport = require('../models/StockReport');
const MaterialMapping = require('../models/MaterialMapping');
const Project = require('../models/Project');
const Material = require('../models/Material'); // Needed for current inventory check
const asyncHandler = require('express-async-handler'); // Re-using if available

// Helper function to generate detailed and summarized stock report data (Used by createStockReport)
const generateStockReportData = async (projectId, fromDate, toDate) => {
    // Convert to Date objects and handle invalid dates
    const start = new Date(fromDate);
    const end = new Date(toDate);

    if (isNaN(start) || isNaN(end)) {
        throw new Error('Invalid date format provided.');
    }

    // Fetch all relevant material movements (MaterialMappings) within the date range
    const materialMappings = await MaterialMapping.find({
        projectId: projectId,
        // Assuming MaterialMapping uses a 'date' field to track movement time
        date: { $gte: start, $lte: end }
    })
    .populate('materialId', 'materialNames unitofMeasure availableQuantity');

    let totalStockIn = 0;
    let totalStockOut = 0;
    const stockSummary = {};

    materialMappings.forEach(item => {
        const materialId = item.materialId._id.toString();
        // quantityIssued என்பது திட்டத்திற்கான Stock In
        const stockIn = item.quantityIssued || 0; 
        // quantityUsed என்பது திட்டத்தில் பயன்படுத்தப்பட்ட Stock Out 
        const stockOut = item.quantityUsed || 0; 
        
        // Aggregate totals for the overall report summary
        totalStockIn += stockIn;
        totalStockOut += stockOut;
        
        // Aggregate per material for detailed report
        if (!stockSummary[materialId]) {
            const materialInventory = item.materialId;
            
            stockSummary[materialId] = {
                materialId: materialInventory._id,
                materialName: materialInventory.materialNames && materialInventory.materialNames.length > 0 
                              ? materialInventory.materialNames[0] 
                              : 'N/A',
                unit: materialInventory.unitofMeasure,
                currentAvailableQuantity: materialInventory.availableQuantity, 
                totalStockInPeriod: 0,
                totalStockOutPeriod: 0,
                details: []
            };
        }
        
        // Update summary totals for the period
        stockSummary[materialId].totalStockInPeriod += stockIn;
        stockSummary[materialId].totalStockOutPeriod += stockOut;
        
        // Store individual movement details
        stockSummary[materialId].details.push({
            date: item.date,
            quantityIssued: stockIn,
            quantityUsed: stockOut, 
            mappingId: item._id
        });
    });

    const detailedStockReport = Object.values(stockSummary);
    const remainingStock = totalStockIn - totalStockOut;

    return { totalStockIn, totalStockOut, remainingStock, stockDetails: detailedStockReport };
};

// --- CRUD Operations for Stock Reports (Defined using const for proper export) ---

const getAllStockReports = async (req, res) => {
    try {
        const stockReports = await StockReport.find()
            .populate('projectId', 'projectName')
            .sort({ reportDate: -1 });
        res.json(stockReports);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server Error fetching stock reports', error: err.message });
    }
};

const getStockReportById = async (req, res) => {
    try {
        const stockReport = await StockReport.findById(req.params.id)
            .populate('projectId', 'projectName');
        
        if (!stockReport) {
            return res.status(404).json({ message: 'Stock Report not found' });
        }
        res.json(stockReport);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid Stock Report ID' });
        }
        res.status(500).json({ message: 'Server Error fetching stock report', error: err.message });
    }
};

const createStockReport = async (req, res) => {
    const { projectId, fromDate, toDate } = req.body;

    if (!projectId || !fromDate || !toDate) {
        return res.status(400).json({ message: 'Project ID, From Date, and To Date are required.' });
    }

    try {
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ message: 'Project not found.' });
        }

        // Use the updated helper function
        const { totalStockIn, totalStockOut, remainingStock, stockDetails } = await generateStockReportData(projectId, fromDate, toDate);

        const newStockReport = new StockReport({
            projectId,
            fromDate,
            toDate,
            totalStockIn,
            totalStockOut,
            remainingStock,
            stockDetails 
        });

        const savedReport = await newStockReport.save();
        res.status(201).json(savedReport);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server Error creating stock report', error: err.message });
    }
};

const deleteStockReport = async (req, res) => {
    try {
        const stockReport = await StockReport.findById(req.params.id);

        if (!stockReport) {
            return res.status(404).json({ message: 'Stock Report not found' });
        }

        await StockReport.deleteOne({ _id: req.params.id });
        res.json({ message: 'Stock Report removed' });
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid Stock Report ID' });
        }
        res.status(500).json({ message: 'Server Error deleting stock report', error: err.message });
    }
};

// --- Material Report Endpoints (Defined using const for proper export) ---

// 1. Stock Summary / In-Out Report (Summary View) - Existing function covers this
const searchStockReport = async (req, res) => {
    try {
        const { projectId, materialId, fromDate, toDate } = req.query;

        if (!projectId || !fromDate || !toDate) {
            return res.status(400).json({ message: 'Project ID, From Date, and To Date are required for a search.' });
        }
        
        const start = new Date(fromDate);
        const end = new Date(toDate);

        if (isNaN(start) || isNaN(end)) {
            return res.status(400).json({ message: 'Invalid date format provided.' });
        }

        const query = {
            projectId: projectId,
            date: { $gte: start, $lte: end }
        };

        if (materialId !== 'All' && materialId) {
            query.materialId = materialId;
        }

        // Fetch all relevant material mappings (Stock In / Stock Out transactions)
        const fetchedMappings = await MaterialMapping.find(query)
            .populate('materialId', 'materialNames unitofMeasure availableQuantity'); 

        const stockSummary = {};
        
        fetchedMappings.forEach(item => {
            const matId = item.materialId._id.toString();
            const stockIn = item.quantityIssued || 0;
            const stockOut = item.quantityUsed || 0; // Quantity Used (Stock Out)
            
            if (!stockSummary[matId]) {
                const materialInventory = item.materialId;
                stockSummary[matId] = {
                    materialId: matId,
                    materialName: materialInventory.materialNames && materialInventory.materialNames.length > 0 
                                  ? materialInventory.materialNames[0] 
                                  : 'N/A',
                    unit: materialInventory.unitofMeasure,
                    currentAvailableQuantity: materialInventory.availableQuantity, 
                    stockInPeriod: 0, 
                    stockOutPeriod: 0, 
                };
            }

            stockSummary[matId].stockInPeriod += stockIn;
            stockSummary[matId].stockOutPeriod += stockOut;
        });

        const formattedReportData = Object.keys(stockSummary).map(materialId => {
            const summary = stockSummary[materialId];
            return {
                materialId: materialId,
                materialName: summary.materialName,
                unit: summary.unit,
                currentAvailableQuantity: summary.currentAvailableQuantity, 
                stockInPeriod: summary.stockInPeriod,
                stockOutPeriod: summary.stockOutPeriod,
                netChangeInProject: summary.stockInPeriod - summary.stockOutPeriod, 
            };
        });

        if (formattedReportData.length === 0) {
            return res.status(404).json({ message: 'No stock data found for the specified criteria.' });
        }
        
        res.json(formattedReportData);

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server Error during stock report search', error: err.message });
    }
};

// 2. Stock in/out report (Detailed Transaction View)
const getDetailedStockInOutReport = async (req, res) => {
    try {
        const { projectId, fromDate, toDate } = req.query;

        if (!projectId || !fromDate || !toDate) {
            return res.status(400).json({ message: 'Project ID, From Date, and To Date are required.' });
        }

        const start = new Date(fromDate);
        const end = new Date(toDate);

        if (isNaN(start) || isNaN(end)) {
            return res.status(400).json({ message: 'Invalid date format provided.' });
        }

        // Fetch raw material mapping entries for the period
        const transactions = await MaterialMapping.find({
            projectId: projectId,
            date: { $gte: start, $lte: end }
        })
        .populate('materialId', 'materialNames unitofMeasure')
        .sort({ date: 1 });

        // Format for a clear transaction list
        const detailedReport = transactions.map(item => ({
            transactionId: item._id,
            date: item.date,
            materialId: item.materialId._id,
            materialName: item.materialId.materialNames && item.materialId.materialNames.length > 0 
                          ? item.materialId.materialNames[0] 
                          : 'N/A',
            unit: item.materialId.unitofMeasure,
            stockIn: item.quantityIssued || 0, // Stock In for the project
            stockOut: item.quantityUsed || 0,  // Stock Out/Consumption from the project
            // balanceQuantity: item.balanceQuantity, // If you want to include the calculated balance
        }));

        if (detailedReport.length === 0) {
            return res.status(404).json({ message: 'No detailed stock transactions found for the specified criteria.' });
        }

        res.json(detailedReport);

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server Error fetching detailed stock report', error: err.message });
    }
};

// 3. Material consumption by project
const getMaterialConsumptionByProject = async (req, res) => {
    try {
        const { projectId, fromDate, toDate } = req.query;

        if (!projectId || !fromDate || !toDate) {
            return res.status(400).json({ message: 'Project ID, From Date, and To Date are required.' });
        }

        const start = new Date(fromDate);
        const end = new Date(toDate);

        if (isNaN(start) || isNaN(end)) {
            return res.status(400).json({ message: 'Invalid date format provided.' });
        }

        // Fetch material consumption entries (MaterialMappings)
        const mappings = await MaterialMapping.find({
            projectId: projectId,
            date: { $gte: start, $lte: end }
        })
        .populate('materialId', 'materialNames unitofMeasure');

        const consumptionSummary = {};

        mappings.forEach(item => {
            const matId = item.materialId._id.toString();
            const quantityConsumed = item.quantityUsed || 0;
            
            if (!consumptionSummary[matId]) {
                const materialInfo = item.materialId;
                consumptionSummary[matId] = {
                    materialId: matId,
                    materialName: materialInfo.materialNames && materialInfo.materialNames.length > 0 
                                  ? materialInfo.materialNames[0] 
                                  : 'N/A',
                    unit: materialInfo.unitofMeasure,
                    totalConsumed: 0,
                };
            }

            consumptionSummary[matId].totalConsumed += quantityConsumed;
        });

        const consumptionReport = Object.values(consumptionSummary);

        if (consumptionReport.length === 0) {
            return res.status(404).json({ message: 'No material consumption recorded for the specified criteria.' });
        }
        
        // Sort by total consumed quantity (highest first)
        consumptionReport.sort((a, b) => b.totalConsumed - a.totalConsumed);

        res.json(consumptionReport);

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server Error fetching consumption report', error: err.message });
    }
};

// 4. Low stock & reorder report
const getLowStockReorderReport = async (req, res) => {
    try {
        // Query the main Material (Inventory) collection
        const lowStockMaterials = await Material.find({
            // Check where available quantity is less than or equal to the reorder level
            $expr: { $lte: ['$availableQuantity', '$reorderedLevel'] }
        })
        .select('materialId materialNames unitofMeasure availableQuantity reorderedLevel supplierName status');

        const reorderReport = lowStockMaterials.map(material => ({
            materialId: material.materialId,
            materialName: material.materialNames && material.materialNames.length > 0 
                          ? material.materialNames[0] 
                          : 'N/A',
            unit: material.unitofMeasure,
            currentStock: material.availableQuantity,
            reorderLevel: material.reorderedLevel,
            status: 'LOW STOCK', // Explicitly set status for clarity
            supplierName: material.supplierName || 'N/A'
        }));

        if (reorderReport.length === 0) {
            return res.status(200).json({ message: 'All materials are currently above their reorder levels.', report: [] });
        }
        
        res.json(reorderReport);

    } catch (err) {
        console.error(err.message);
        // Assuming asyncHandler is not used here, catch manually
        res.status(500).json({ message: 'Server Error fetching low stock report', error: err.message });
    }
};

// Export all functions (Now possible because all functions are defined as local consts)
module.exports = {
    // Existing CRUD exports
    getAllStockReports,
    getStockReportById,
    createStockReport,
    deleteStockReport,
    
    // Existing Search/Summary Report
    searchStockReport,
    
    // New Material Report exports
    getDetailedStockInOutReport,
    getMaterialConsumptionByProject,
    getLowStockReorderReport
};