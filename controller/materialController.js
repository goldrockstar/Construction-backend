const asyncHandler = require('express-async-handler');
const Material = require('../models/Material');

// --- Helper: Generate Material ID (Format: MAT-0001) ---
const generateMaterialId = async () => {
    const lastMaterial = await Material.findOne().sort({ createdAt: -1 });

    if (!lastMaterial || !lastMaterial.materialId) {
        return 'MAT-0001';
    }

    // எண்களை மட்டும் பிரித்து எடுக்கிறோம் (MAT-0005 -> 5)
    const lastIdString = lastMaterial.materialId.replace(/\D/g, ''); 
    const lastIdNumber = parseInt(lastIdString, 10);
    
    if (isNaN(lastIdNumber)) return 'MAT-0001'; // Fallback

    const nextIdNumber = lastIdNumber + 1;
    return `MAT-${String(nextIdNumber).padStart(4, '0')}`;
};

// --- API: Get Next ID for Frontend ---
const getNextMaterialId = asyncHandler(async (req, res) => {
    try {
        const nextId = await generateMaterialId();
        res.status(200).json({ materialId: nextId });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Create new material
const createMaterial = asyncHandler(async (req, res) => {
    const { materialNames, unitofMeasure, availableQuantity, reorderedLevel, purchasePrice, supplierName, status } = req.body;

    // Basic Validation
    if (!materialNames || !unitofMeasure || availableQuantity === undefined || purchasePrice === undefined) {
        res.status(400);
        throw new Error('Please fill all required fields');
    }

    // Generate ID Automatically
    const newMaterialId = await generateMaterialId();

    const newMaterial = new Material({
        materialId: newMaterialId, // Auto-generated
        materialNames,
        unitofMeasure,
        availableQuantity, 
        reorderedLevel,
        purchasePrice,
        supplierName,
        status: status || 'Available',
    });

    const savedMaterial = await newMaterial.save();
    res.status(201).json(savedMaterial);
});

// ... (Update, Delete, Get All, Get By ID ஆகியவை பழையபடியே இருக்கட்டும்) ...
// மற்ற கன்ட்ரோலர்களை (getAllMaterials, getMaterialById, etc.) மாற்ற வேண்டாம்.

const getAllMaterials = asyncHandler(async (req, res) => {
    const materials = await Material.find().sort({ materialNames: 1 });
    res.json(materials);
});

const getMaterialById = asyncHandler(async (req, res) => {
    const material = await Material.findById(req.params.id);
    if(!material) {
        res.status(404);
        throw new Error('Material not found');
    }
    res.json(material);
});

const updateMaterial = asyncHandler(async (req, res) => {
    const material = await Material.findById(req.params.id);
    if (!material) {
        res.status(404);
        throw new Error('Material not found.');
    }
    
    // Update fields directly from body
    Object.assign(material, req.body);
    
    const updatedMaterial = await material.save();
    res.json(updatedMaterial);
});

const deleteMaterial = asyncHandler(async (req, res) => {
    const material = await Material.findById(req.params.id);
    if (!material) {
        res.status(404);
        throw new Error('Material not found.');
    }
    await material.deleteOne();
    res.json({ message: 'Material deleted successfully.' });
});

module.exports = {
    getNextMaterialId, // Export this
    getAllMaterials,
    getMaterialById,
    createMaterial,
    updateMaterial,
    deleteMaterial
};