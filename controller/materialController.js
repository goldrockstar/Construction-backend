const Material = require('../models/Material');

const getAllMaterials = async (req, res) => {
    try {
        const materials = await Material.find();
        res.json(materials);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const getMaterialById = async (req, res) => {
    try {
        const material = await Material.findById(req.params.id);
        if(!material) {
            return res.status(404).json({ message: 'Material not found' });
        }
        res.json(material);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}
const createMaterial = async (req, res) => {
    const { categoryName, materialNames, unit, rate } = req.body; // unit and rate added

    try {
        // Check if category name already exists
        const existingMaterial = await Material.findOne({ categoryName: categoryName });
        if (existingMaterial) {
            return res.status(400).json({ message: 'This category name already exists.' });
        }

        const newMaterial = new Material({
            categoryName,
            materialNames,
            unit, // added
            rate, // added
            createdAt: new Date(),
            updatedAt: new Date()
        });

        const savedMaterial = await newMaterial.save();
        res.status(201).json(savedMaterial);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};


const updateMaterial = async (req, res) => {
    const { categoryName, materialNames, unit, rate } = req.body; // unit and rate added

    try {
        const material = await Material.findById(req.params.id);
        if (!material) {
            return res.status(404).json({ message: 'Material not found.' });
        }

        // Check if category name is being changed to an existing one
        if (categoryName && categoryName !== material.categoryName) {
            const existingMaterial = await Material.findOne({ categoryName: categoryName });
            if (existingMaterial && existingMaterial._id.toString() !== req.params.id) {
                return res.status(400).json({ message: 'This category name already exists.' });
            }
        }

        material.categoryName = categoryName || material.categoryName;
        material.materialNames = materialNames || material.materialNames;
        material.unit = unit || material.unit; // added
        material.rate = rate || material.rate; // added
        material.updatedAt = new Date();

        const updatedMaterial = await material.save();
        res.json(updatedMaterial);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

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