const MaterialMapping = require('../models/MaterialMapping');
const Material = require('../models/Material'); 
const asyncHandler = require('express-async-handler');

// @route   GET /api/projectMaterialMappings
// @desc    Get all material mappings
// @access  Private
const getMaterialMappings = asyncHandler(async (req, res) => {
    const { projectId } = req.query;

    let filter = {};
    if (projectId) {
        filter.projectId = projectId;
    }
    
    const materialMappings = await MaterialMapping.find(filter)
        .populate('projectId', 'projectName')
        // NOTE: The materialId field links to the Material model
        .populate('materialId', 'materialNames unitOfMeasure availableQuantity') 
        .sort({ createdAt: -1 });
    
    res.json(materialMappings);
});

// ----------------------------------------------------------------------

// @route   GET /api/projectMaterialMappings/:id
// @desc    Get material mapping by ID
// @access  Private
const getMaterialMappingById = asyncHandler(async (req, res) => {
    const materialMapping = await MaterialMapping.findById(req.params.id)
        .populate('projectId', 'projectName')
        .populate('materialId', 'materialNames unitOfMeasure');

    if (!materialMapping) {
        res.status(404);
        throw new Error('Material mapping not found');
    }
    res.json(materialMapping);
});

// ----------------------------------------------------------------------

// @route   GET /api/projectMaterialMappings/project/:projectId
// @desc    Get all material mappings for a specific project
// @access  Private
const getMaterialMappingsByProjectId = asyncHandler(async (req, res) => {
    const materialMappings = await MaterialMapping.find({ projectId: req.params.projectId })
        .populate('projectId', 'projectName')
        .populate('materialId', 'materialNames unitOfMeasure')
        .sort({ date: -1 }); 
    
    res.json(materialMappings);
});

// ----------------------------------------------------------------------

// @route   POST /api/projectMaterialMappings
// @desc    Create a new material mapping and update inventory stock
// @access  Private
const createMaterialMapping = asyncHandler(async (req, res) => {
    const { 
        projectId, 
        materialId, // Material Inventory Item ID
        quantityUsed, 
        date,  
    } = req.body;

    // --- 1. Inventory Check & Data Fetch ---
    const material = await Material.findById(materialId);

    if (!material) {
        res.status(404);
        throw new Error('Material Inventory Item not found.');
    }
    
    // --- 2. Inventory டேட்டாவை Project Mapping ஃபீல்டுகளுக்கு நகர்த்துதல் ---
    
    // Material Schema -> MaterialMapping Schema
    const materialName = material.materialNames[0]; // Assuming you take the first name from the array
    const unit = material.unitofMeasure;           // unitofMeasure -> unit
    const quantityIssued = material.availableQuantity; // availableQuantity -> quantityIssued (முழு இருப்பையும் issue செய்வதாகக் கருதி)
    const unitPrice = material.purchasePrice;       // purchasePrice -> unitPrice
    
    // --- 3. Validation ---
    
    // Check if enough stock is available to issue (if you intend to issue less than available, change this logic)
    // NOTE: Here we are assuming the entire available quantity is 'issued' to the project.
    if (quantityIssued <= 0) {
        res.status(400);
        throw new Error(`Cannot issue material. Available quantity for ${materialName} is ${quantityIssued}.`);
    }

    if (quantityUsed === undefined || quantityUsed === null || quantityUsed < 0) {
        res.status(400);
        throw new Error('Quantity Used must be defined and non-negative.');
    }
    
    if (quantityUsed > quantityIssued) {
         res.status(400);
         throw new Error('Quantity Used cannot be greater than Quantity Issued (Available Inventory).');
    }
    
    
    material.availableQuantity -= quantityIssued;
    // material.availableQuantity = 0; // If you want to explicitly set it to 0
    await material.save();

    const newMaterialMapping = new MaterialMapping({
        projectId,
        materialId, // Link to Material Inventory
        materialName, // Fetched from Material
        unit,         // Fetched from Material (unitofMeasure)
        quantityIssued, // Fetched from Material (availableQuantity)
        quantityUsed: quantityUsed || 0, // Using quantityUsed from request body
        unitPrice,    // Fetched from Material (purchasePrice)
        // balanceQuantity & totalCost are calculated by Mongoose
        date: date || Date.now(), 
        user: req.user.id
    });

    const materialMapping = await newMaterialMapping.save();
    
    res.status(201).json(materialMapping);
});

// ----------------------------------------------------------------------

// @route   PUT /api/projectMaterialMappings/:id
// @desc    Update a material mapping (handles stock adjustment)
// @access  Private
const updateMaterialMapping = asyncHandler(async (req, res) => {
    // balanceQuantity மற்றும் totalCost ஆகியவை தேவையில்லை. Mongoose இதை கணக்கிடும்.
    const { 
        projectId, 
        materialId,
        materialName, 
        unit, 
        quantityIssued, 
        quantityUsed, 
        unitPrice,
        date, 
    } = req.body;

    let materialMapping = await MaterialMapping.findById(req.params.id);

    if (!materialMapping) {
        res.status(404);
        throw new Error('Material mapping not found');
    }

    // Authorization check... (kept as is)
    if (materialMapping.user.toString() !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'manager') {
        res.status(401);
        throw new Error('Not authorized to update this mapping.');
    }
    
    // --- Stock Adjustment Logic ---
    let stockDifference = 0;
    let oldIssued = materialMapping.quantityIssued;
    let newIssued = quantityIssued !== undefined ? quantityIssued : oldIssued;

    // Only proceed if quantityIssued changed AND materialId wasn't changed
    if (newIssued !== oldIssued && materialMapping.materialId.toString() === (materialId || materialMapping.materialId).toString()) {
        stockDifference = newIssued - oldIssued; 
        
        const material = await Material.findById(materialMapping.materialId);
        
        if (!material) {
            res.status(500);
            throw new Error('Associated Material Inventory Item not found during update.');
        }

        // Check if there is enough stock for the increase
        if (stockDifference > 0 && material.availableQuantity < stockDifference) {
            res.status(400);
            throw new Error(`Insufficient stock to increase issue quantity. Only ${material.availableQuantity} available.`);
        }

        // Adjust stock
        material.availableQuantity -= stockDifference;
        await material.save();
    }
    
    // --- Update fields ---
    materialMapping.projectId = projectId || materialMapping.projectId;
    // NOTE: Changing materialId requires more complex stock logic (return old, deduct new)
    materialMapping.materialId = materialId || materialMapping.materialId; 
    materialMapping.materialName = materialName || materialMapping.materialName;
    materialMapping.unit = unit || materialMapping.unit;
    materialMapping.quantityIssued = newIssued; // Use the value derived above
    materialMapping.quantityUsed = quantityUsed !== undefined ? quantityUsed : materialMapping.quantityUsed;
    materialMapping.unitPrice = unitPrice !== undefined ? unitPrice : materialMapping.unitPrice;
    
    // balanceQuantity & totalCost are intentionally OMITTED here as Mongoose pre-hook will calculate them.
    
    materialMapping.date = date || materialMapping.date;
    
    const updatedMapping = await materialMapping.save();
    res.json(updatedMapping);
});

// ----------------------------------------------------------------------

// @route   DELETE /api/projectMaterialMappings/:id
// @desc    Delete a material mapping and return stock to inventory
// @access  Private
const deleteMaterialMapping = asyncHandler(async (req, res) => {
    const materialMapping = await MaterialMapping.findById(req.params.id);

    if (!materialMapping) {
        res.status(404);
        throw new Error('Material mapping not found');
    }

    // Authorization check... (kept as is)
    if (materialMapping.user.toString() !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'manager') {
        res.status(401);
        throw new Error('Not authorized to delete this mapping.');
    }

    // --- Return Issued Quantity to Inventory ---
    const materialInventory = await Material.findById(materialMapping.materialId);

    if (materialInventory) {
        // Return the total issued quantity back to the inventory
        materialInventory.availableQuantity += materialMapping.quantityIssued;
        await materialInventory.save();
        
        console.log(`Returned ${materialMapping.quantityIssued} to inventory.`);
    }

    await MaterialMapping.deleteOne({ _id: req.params.id });
    res.json({ message: 'Material mapping removed and stock returned to inventory.' });
});

module.exports = {
    getMaterialMappings,
    getMaterialMappingById,
    getMaterialMappingsByProjectId,
    createMaterialMapping,
    updateMaterialMapping,
    deleteMaterialMapping
};