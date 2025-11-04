const Role = require('../models/Role'); 

const getRoles = async (req, res) => {
    try {
        const roles = await Role.find();
        res.json(roles);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


const createRole = async (req, res) => {
    const { name, description, permissions } = req.body; 

    if (!name) {
        return res.status(400).json({ message: "Role Name is required." });
    }

    try {
        const roleExists = await Role.findOne({ name });
        if (roleExists) {
            return res.status(400).json({ message: "இந்த ரோல் பெயர் ஏற்கனவே உள்ளது." });
        }

        const newRole = new Role({
            name,
            description,
            permissions: permissions || [],
            createdAt: req.body.createdAt || Date.now()
        });

        const savedRole = await newRole.save();
        res.status(201).json(savedRole);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


const updateRole = async (req, res) => {
    const { id } = req.params;
    const { name, description, permissions } = req.body;

    try {
        const role = await Role.findById(id);

        if (!role) {
            return res.status(404).json({ message: 'ரோல் காணப்படவில்லை.' });
        }

        if (name && name !== role.name) {
            const existingRole = await Role.findOne({ name });
            if (existingRole && existingRole._id.toString() !== id) {
                return res.status(400).json({ message: "இந்த ரோல் பெயர் ஏற்கனவே உள்ளது." });
            }
        }

        role.name = name || role.name;
        role.description = description || role.description;
        role.permissions = permissions !== undefined ? permissions : role.permissions;

        const updatedRole = await role.save();
        res.json(updatedRole);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


const deleteRole = async (req, res) => {
    const { id } = req.params;

    try {
        const role = await Role.findById(id);

        if (!role) {
            return res.status(404).json({ message: 'ரோல் காணப்படவில்லை.' });
        }
        
        await role.deleteOne();

        res.json({ message: 'ரோல் வெற்றிகரமாக நீக்கப்பட்டது.' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = {
    getRoles,
    createRole,
    updateRole,
    deleteRole
};