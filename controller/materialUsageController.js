const MaterialUsage = require('../models/MaterialUsage');
const Material = require('../models/Material');
const asyncHandler = require('express-async-handler');

// @desc    Get all material usage records
// @route   GET /api/material-usage
// @access  Private/Admin
exports.getAllMaterialUsages = asyncHandler(async (req, res) => {
    // This route is typically for admin access, so we would check req.user.role
    const materialUsages = await MaterialUsage.find().sort({ createdAt: -1 });
    res.json(materialUsages);
});

// @desc    Get a single material usage record by ID
// @route   GET /api/material-usage/:id
// @access  Private
exports.getMaterialUsageById = asyncHandler(async (req, res) => {
    const materialUsage = await MaterialUsage.findById(req.params.id);
    if (!materialUsage) {
        res.status(404);
        throw new Error('Material usage record not found');
    }
    // Implement authorization check here if needed (e.g., is the user part of the project?)
    res.json(materialUsage);
});

// @desc    Get material usage records for a specific project
// @route   GET /api/material-usage/project/:projectId
// @access  Private
exports.getMaterialUsagesByProjectId = asyncHandler(async (req, res) => {
    // This is the route that was failing with 403
    const materialUsages = await MaterialUsage.find({ projectId: req.params.projectId }).sort({ fromDate: -1 });
    if (!materialUsages || materialUsages.length === 0) {
        return res.status(200).json({ message: 'No material usage records found for this project', data: [] });
    }
    res.json(materialUsages);
});

// @desc    Create a new material usage record
// @route   POST /api/material-usage
// @access  Private
exports.createMaterialUsage = asyncHandler(async (req, res) => {
    console.log('Received data for material usage:', req.body);
    const { projectId, materialId, quantityUsed, unit, fromDate, toDate, materialName } = req.body;

    if (!projectId || !materialId || quantityUsed === undefined || quantityUsed === null || !unit || !materialName) {
        res.status(400);
        throw new Error('Project ID, Material ID, Quantity Used, and Unit are required.');
    }

    const materialInStock = await Material.findById(materialId);
    if (!materialInStock) {
        res.status(404);
        throw new Error('Material not found in stock.');
    }

    // Explicitly convert quantityUsed to a number
    const usedQuantityNumber = Number(quantityUsed);


    if (usedQuantityNumber > materialInStock.stockQuantity) {
        res.status(400);
        throw new Error(`Your stock value is less than the quantity requested. Available Stock: ${materialInStock.stockQuantity}`);
    }

    // Pass all required fields, including materialName, to the new document
    const newMaterialUsage = new MaterialUsage({
        projectId,
        materialId,
        materialName: materialName,
        quantityUsed: usedQuantityNumber,
        unit,
        fromDate,
        toDate,
    });

    materialInStock.stockQuantity -= usedQuantityNumber;
    await materialInStock.save();

    const materialUsage = await newMaterialUsage.save();
    res.status(201).json({ message: 'Material Usage Saved successfully', data: materialUsage });
});

// @desc    Update a material usage record
// @route   PUT /api/material-usage/:id
// @access  Private
exports.updateMaterialUsage = asyncHandler(async (req, res) => {
    const { projectId, materialId, quantityUsed, unit, fromDate, toDate } = req.body;
    const materialUsage = await MaterialUsage.findById(req.params.id);

    if (!materialUsage) {
        res.status(404);
        throw new Error('Material usage record not found');
    }

    const oldMaterialId = materialUsage.materialId;
    const oldQuantityUsed = materialUsage.quantityUsed;
    const newQuantityUsed = quantityUsed !== undefined ? quantityUsed : oldQuantityUsed;

    const materialInStock = await Material.findById(materialId);
    if (!materialInStock) {
        res.status(404);
        throw new Error('Material not found in stock.');
    }

    // Logic to handle stock updates when a material is changed or quantity is modified
    if (oldMaterialId.toString() !== materialId) {
        // Return old quantity to the old material's stock
        const oldMaterialInStock = await Material.findById(oldMaterialId);
        if (oldMaterialInStock) {
            oldMaterialInStock.stockQuantity += oldQuantityUsed;
            await oldMaterialInStock.save();
        }

        // Check stock for the new material
        if (newQuantityUsed > materialInStock.stockQuantity) {
            // Revert changes if new stock is insufficient
            if (oldMaterialInStock) {
                oldMaterialInStock.stockQuantity -= oldQuantityUsed;
                await oldMaterialInStock.save();
            }
            res.status(400);
            throw new Error(`Your stock value is less than the quantity requested for the new material. Available Stock: ${materialInStock.stockQuantity}`);
        }
        materialInStock.stockQuantity -= newQuantityUsed;
    } else {
        // Same material, just update quantity
        const quantityDifference = newQuantityUsed - oldQuantityUsed;
        if (quantityDifference > materialInStock.stockQuantity) {
            res.status(400);
            throw new Error(`Not enough stock to increase the quantity. Available Stock: ${materialInStock.stockQuantity}`);
        }
        materialInStock.stockQuantity -= quantityDifference;
    }

    await materialInStock.save();

    // Update the material usage record
    materialUsage.projectId = projectId || materialUsage.projectId;
    materialUsage.materialId = materialId || materialUsage.materialId;
    materialUsage.quantityUsed = newQuantityUsed;
    materialUsage.unit = unit || materialUsage.unit;
    materialUsage.fromDate = fromDate || materialUsage.fromDate;
    materialUsage.toDate = toDate || materialUsage.toDate; // Ensure materialName is also updated
    materialUsage.materialName = materialInStock.materialNames.join(', '); 

    await materialUsage.save();
    res.json({ message: 'Material usage record updated successfully', data: materialUsage });
});

// @desc    Delete a material usage record
// @route   DELETE /api/material-usage/:id
// @access  Private
exports.deleteMaterialUsage = asyncHandler(async (req, res) => {
    const materialUsage = await MaterialUsage.findById(req.params.id);

    if (!materialUsage) {
        res.status(404);
        throw new Error('Material usage record not found');
    }

    // Return the quantity to the material's stock
    const materialInStock = await Material.findById(materialUsage.materialId);
    if (materialInStock) {
        materialInStock.stockQuantity += materialUsage.quantityUsed;
        await materialInStock.save();
    }

    await materialUsage.deleteOne();

    res.status(200).json({ message: 'Material usage record deleted successfully' });
});

