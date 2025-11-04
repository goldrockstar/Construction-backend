const StockReport = require('../models/StockReport');
const MaterialMapping = require('../models/MaterialMapping');
const Project = require('../models/Project');
const Material = require('../models/Material');

const generateStockReportData = async (projectId, fromDate, toDate) => {
    // Convert to Date objects and handle invalid dates
    const start = new Date(fromDate);
    const end = new Date(toDate);

    if (isNaN(start) || isNaN(end)) {
        throw new Error('Invalid date format provided.');
    }

    const materialData = await MaterialMapping.find({
        projectId: projectId,
        date: { $gte: start, $lte: end }
    })
    .populate('materialId', 'materialName');

    let totalStockIn = 0;
    let totalStockOut = 0;
    const stockDetails = [];

    materialData.forEach(item => {
        totalStockIn += item.stockIn;
        totalStockOut += item.stockOut;
        stockDetails.push({
            materialId: item.materialId._id,
            materialName: item.materialId.materialName,
            stockIn: item.stockIn,
            stockOut: item.stockOut,
            date: item.date
        });
    });

    const remainingStock = totalStockIn - totalStockOut;

    return { totalStockIn, totalStockOut, remainingStock, stockDetails };
};

exports.getAllStockReports = async (req, res) => {
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

exports.getStockReportById = async (req, res) => {
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

exports.createStockReport = async (req, res) => {
    const { projectId, fromDate, toDate } = req.body;

    if (!projectId || !fromDate || !toDate) {
        return res.status(400).json({ message: 'Project ID, From Date, and To Date are required.' });
    }

    try {
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ message: 'Project not found.' });
        }

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

exports.deleteStockReport = async (req, res) => {
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

// New function to handle stock report search
exports.searchStockReport = async (req, res) => {
    try {
        const { projectId, materialId, fromDate, toDate } = req.query;

        // Basic validation for required fields
        if (!projectId || !fromDate || !toDate) {
            return res.status(400).json({ message: 'Project ID, From Date, and To Date are required for a search.' });
        }

        const query = {
            projectId: projectId,
            createdAt: { $gte: new Date(fromDate), $lte: new Date(toDate) }
        };

        if (materialId !== 'All' && materialId) {
            query.materialId = materialId;
        }

        // Fetch both 'stock in' and 'stock out' data concurrently
        const [fetchedMappings, fetchedUsages] = await Promise.all([
            MaterialMapping.find(query).populate('materialId'),
            MaterialUsage.find(query).populate('materialId')
        ]);

        // Combine and summarize the data
        const stockSummary = {};
        
        // Process 'Stock In' data
        fetchedMappings.forEach(item => {
            const matId = item.materialId._id.toString();
            if (!stockSummary[matId]) {
                stockSummary[matId] = {
                    materialName: item.materialId.materialName,
                    unit: item.materialId.unit,
                    stockIn: 0,
                    stockOut: 0,
                };
            }
            stockSummary[matId].stockIn += item.numberOfQuantity || 0;
        });

        // Process 'Stock Out' data
        fetchedUsages.forEach(item => {
            const matId = item.materialId._id.toString();
            if (!stockSummary[matId]) {
                stockSummary[matId] = {
                    materialName: item.materialId.materialName,
                    unit: item.materialId.unit,
                    stockIn: 0,
                    stockOut: 0,
                };
            }
            stockSummary[matId].stockOut += item.quantity || 0;
        });

        const formattedReportData = Object.keys(stockSummary).map(materialId => {
            const summary = stockSummary[materialId];
            return {
                materialId: materialId,
                materialName: summary.materialName,
                stockIn: summary.stockIn,
                stockOut: summary.stockOut,
                remaining: summary.stockIn - summary.stockOut,
                unit: summary.unit,
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
