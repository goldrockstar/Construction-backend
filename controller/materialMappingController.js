const MaterialMapping = require('../models/MaterialMapping');
const asyncHandler = require('express-async-handler'); // asyncHandler-ஐ இறக்குமதி செய்யவும்

// @route   GET /api/projectMaterialMappings
// @desc    Get all material mappings
// @access  Private
const getMaterialMappings = asyncHandler(async (req, res) => {
    const materialMappings = await MaterialMapping.find()
        .populate('projectId', 'projectName')
        .sort({ createdAt: -1 });
    res.json(materialMappings);
});

// @route   GET /api/projectMaterialMappings/:id
// @desc    Get material mapping by ID
// @access  Private
const getMaterialMappingById = asyncHandler(async (req, res) => {
    const materialMapping = await MaterialMapping.findById(req.params.id)
        .populate('projectId', 'projectName');
    if (!materialMapping) {
        res.status(404);
        throw new Error('Material mapping not found');
    }
    res.json(materialMapping);
});

// @route   GET /api/projectMaterialMappings/project/:projectId
// @desc    Get all material mappings for a specific project
// @access  Private
const getMaterialMappingsByProjectId = asyncHandler(async (req, res) => {
    const materialMappings = await MaterialMapping.find({ projectId: req.params.projectId })
        .populate('projectId', 'projectName')
        .sort({ dateMapped: -1 });
    if (!materialMappings) {
        res.status(404);
        throw new Error('No material mappings found for this project');
    }
    res.json(materialMappings);
});

// @route   POST /api/projectMaterialMappings
// @desc    Create a new material mapping
// @access  Private
const createMaterialMapping = asyncHandler(async (req, res) => {
    const { projectId, materialName, quantity, unit, dateMapped, vendorName, vendorAddress, purchaseDate, gst, amount, gstApplicable, description } = req.body;

    // Basic validation
    if (!projectId || !materialName || quantity === undefined || !unit || amount === undefined) {
        res.status(400);
        throw new Error('Project ID, Material Name, Quantity, Unit, and Amount are required.');
    }

    // finalAmount-ஐ நேரடியாக கண்ட்ரோலரில் கணக்கிடுதல்
    let finalAmount = quantity * amount;
    if (gstApplicable && gst) {
        const gstRate = parseFloat(gst);
        if (!isNaN(gstRate)) {
            finalAmount += finalAmount * (gstRate / 100);
        }
    }

    const newMaterialMapping = new MaterialMapping({
        projectId,
        materialName,
        quantity,
        unit,
        dateMapped,
        vendorName,
        vendorAddress,
        purchaseDate,
        gst,
        amount,
        finalAmount, // கணக்கிடப்பட்ட finalAmount-ஐ சேர்த்தல்
        gstApplicable,
        description,
        user: req.user.id
    });

    const materialMapping = await newMaterialMapping.save();
    res.status(201).json(materialMapping);
});

// @route   PUT /api/projectMaterialMappings/:id
// @desc    Update a material mapping
// @access  Private
const updateMaterialMapping = asyncHandler(async (req, res) => {
    const { projectId, materialName, quantity, unit, dateMapped, vendorName, vendorAddress, purchaseDate, gst, amount, gstApplicable, description } = req.body;

    let materialMapping = await MaterialMapping.findById(req.params.id);

    if (!materialMapping) {
        res.status(404);
        throw new Error('Material mapping not found');
    }

    // Ensure the user has permission to edit this mapping
    if (materialMapping.user.toString() !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'manager') {
        res.status(401);
        throw new Error('Not authorized to update this mapping.');
    }

    // Update fields
    materialMapping.projectId = projectId || materialMapping.projectId;
    materialMapping.materialName = materialName || materialMapping.materialName;
    materialMapping.quantity = quantity !== undefined ? quantity : materialMapping.quantity;
    materialMapping.unit = unit || materialMapping.unit;
    materialMapping.dateMapped = dateMapped || materialMapping.dateMapped;
    materialMapping.vendorName = vendorName || materialMapping.vendorName;
    materialMapping.vendorAddress = vendorAddress || materialMapping.vendorAddress;
    materialMapping.purchaseDate = purchaseDate || materialMapping.purchaseDate;
    materialMapping.gst = gst || materialMapping.gst;
    materialMapping.amount = amount !== undefined ? amount : materialMapping.amount;
    materialMapping.gstApplicable = gstApplicable !== undefined ? gstApplicable : materialMapping.gstApplicable;
    materialMapping.description = description || materialMapping.description;

    // அனைத்து ஃபீல்டுகளும் அப்டேட் ஆன பிறகு finalAmount-ஐ கணக்கிடுதல்
    let total = materialMapping.quantity * materialMapping.amount;
    if (materialMapping.gstApplicable && materialMapping.gst) {
        const gstRate = parseFloat(materialMapping.gst);
        if (!isNaN(gstRate)) {
            materialMapping.finalAmount = total + (total * (gstRate / 100));
        } else {
            materialMapping.finalAmount = total;
        }
    } else {
        materialMapping.finalAmount = total;
    }

    const updatedMapping = await materialMapping.save();
    res.json(updatedMapping);
});

// @route   DELETE /api/projectMaterialMappings/:id
// @desc    Delete a material mapping
// @access  Private
const deleteMaterialMapping = asyncHandler(async (req, res) => {
    const materialMapping = await MaterialMapping.findById(req.params.id);

    if (!materialMapping) {
        res.status(404);
        throw new Error('Material mapping not found');
    }

    // Ensure the user has permission to delete this mapping
    if (materialMapping.user.toString() !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'manager') {
        res.status(401);
        throw new Error('Not authorized to delete this mapping.');
    }

    await MaterialMapping.deleteOne({ _id: req.params.id });
    res.json({ message: 'Material mapping removed' });
});

module.exports = {
    getMaterialMappings,
    getMaterialMappingById,
    getMaterialMappingsByProjectId,
    createMaterialMapping,
    updateMaterialMapping,
    deleteMaterialMapping
};