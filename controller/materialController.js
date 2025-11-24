const Material = require('../models/Material');
const asyncHandler = require('express-async-handler');

const getAllMaterials = asyncHandler(async  (req, res) => {
    try {
        const materials = await Material.find().sort({ materialNames: 1 });
        res.json(materials);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

const getMaterialById = asyncHandler(async (req, res)  => {
    try {
        const material = await Material.findById(req.params.id);
        if(!material) {
            return res.status(404).json({ message: 'Material not found' });
        }
        res.json(material);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
const createMaterial = asyncHandler(async (req, res) => {
    const { materialId, materialNames, unitofMeasure, availableQuantity, reorderedLevel, purchasePrice, supplierName, status } = req.body; 

    // Basic Validation
    if (!materialId || !materialNames || !unitofMeasure || availableQuantity === undefined || purchasePrice === undefined) {
        res.status(400);
        throw new Error('Material ID, Name, Unit of Measure, Initial Quantity, and Purchase Price are required.');
    }

    // Check if materialId already exists
    const existingMaterial = await Material.findOne({ materialId: materialId });
    if (existingMaterial) {
        res.status(400);
        throw new Error(`Material ID '${materialId}' already exists.`);
    }

    const newMaterial = new Material({
        materialId,
        materialNames,
        unitofMeasure,
        // The availableQuantity is set by the user during initial creation/purchase
        availableQuantity: availableQuantity, 
        reorderedLevel,
        purchasePrice,
        supplierName,
        status,
    });

    const savedMaterial = await newMaterial.save();
    res.status(201).json(savedMaterial);
});


const updateMaterial = asyncHandler(async (req, res) => {
    const { materialId, materialNames, unitofMeasure, availableQuantity, reorderedLevel, purchasePrice, supplierName, status } = req.body;

    const material = await Material.findById(req.params.id);
    
    if (!material) {
        res.status(404);
        throw new Error('Material not found.');
    }

    // Check if materialId is being changed to an existing one
    if (materialId && materialId !== material.materialId) {
        const existingMaterial = await Material.findOne({ materialId: materialId });
        if (existingMaterial && existingMaterial._id.toString() !== req.params.id) {
            res.status(400);
            throw new Error('This Material ID already exists.');
        }
    }

    // Update fields
    material.materialId = materialId || material.materialId;
    material.materialNames = materialNames || material.materialNames;
    material.unitofMeasure = unitofMeasure || material.unitofMeasure;
    material.availableQuantity = availableQuantity !== undefined ? availableQuantity : material.availableQuantity; 
    material.reorderedLevel = reorderedLevel !== undefined ? reorderedLevel : material.reorderedLevel; 
    material.purchasePrice = purchasePrice !== undefined ? purchasePrice : material.purchasePrice; 
    material.supplierName = supplierName || material.supplierName;
    material.status = status || material.status; 

    // Pre-save hook will update 'updatedAt' and 'status'
    const updatedMaterial = await material.save();
    res.json(updatedMaterial);
});

const deleteMaterial = async (req, res) => {
    try {
        const result = await Material.deleteOne({ _id: req.params.id });
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Material not found.' });
        }
        res.json({ message: 'Material deleted successfully.' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


module.exports = {
    getAllMaterials,
    getMaterialById,
    createMaterial,
    updateMaterial,
    deleteMaterial
};