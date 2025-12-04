// controllers/manpowerController.js
const Manpower = require('../models/Manpower');
const path = require('path');
const fs = require('fs');

const UPLOAD_FOLDER = process.env.UPLOAD_FOLDER || 'uploads';
const UPLOADS_PATH = path.join(__dirname, '..', UPLOAD_FOLDER);

const generateManpowerId = async () => {
    const lastManpower = await Manpower.findOne().sort({ createdAt : -1 });

    if (!lastManpower || !lastManpower.empId) {
        return 'EMP-0001';
    }

    const lastIdString = lastManpower.empId.replace('EMP-', '');
    const lastIdNumber = parseInt(lastIdString, 10);

    if (isNaN(lastIdNumber)) return 'EMP-0001';

    const nextIdNumber = lastIdNumber + 1;
    return `EMP-${String(nextIdNumber).padStart(4, '0')}`;
};


const getNextManpowerId = async (req, res) => {
    try {
        const nextId = await generateManpowerId();
        res.status(200).json({ empId: nextId });
    } catch (error) {
        res.status(500).json({ message: 'Error generating manpower ID', error: error.message });
    }
};


const getManpower = async (req, res) => {
    console.log("Attempting to fetch manpower data...");
    try {
        const manpower = await Manpower.find().populate('roleId');
        console.log("Manpower data successfully fetched.");
        res.json(manpower);
    } catch (err) {
        console.error("Error fetching manpower:", err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

const getManpowerById = async (req, res) => {
    try {
        const manpower = await Manpower.findById(req.params.id).populate('roleId');
        if (!manpower) {
            return res.status(404).json({ message: 'Manpower entry not found.' });
        }
        res.json(manpower);
    } catch (err) {
        console.error("Error fetching manpower by ID:", err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

const createManpower = async (req, res) => {
    const { empId,name, roleId, roleName, phoneNumber, address, payRateType, payRate } = req.body;
    const photoPath = req.file ? `/${UPLOAD_FOLDER}/${req.file.filename}` : undefined;

    try {
        if (!name || !roleId) {
            return res.status(400).json({ message: "Name and Role ID are required." });
        }

        const newManpower = new Manpower({
            empId,
            name,
            roleId,
            roleName,
            phoneNumber,
            address,
            payRateType,
            payRate,
            photo: photoPath
        });

        const savedManpower = await newManpower.save();
        res.status(201).json(savedManpower);
    } catch (err) {
        if (req.file) {
            fs.unlink(req.file.path, (unlinkErr) => {
                if (unlinkErr) console.error("Error deleting uploaded file:", unlinkErr);
            });
        }
        
        if (err.name === 'ValidationError') {
            let errors = {};
            Object.keys(err.errors).forEach((key) => {
                errors[key] = err.errors[key].message;
            });
            return res.status(400).json({ message: 'Manpower validation failed', errors: errors });
        }
        console.error("Error creating manpower entry:", err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

const updateManpower = async (req, res) => {
    const { id } = req.params;
    const { empId,name, roleId, roleName, phoneNumber, address, payRateType, payRate } = req.body;
    const newPhotoPath = req.file ? `/${UPLOAD_FOLDER}/${req.file.filename}` : undefined;

    try {
        const manpower = await Manpower.findById(id);
        if (!manpower) {
            if (req.file) {
                fs.unlink(req.file.path, (unlinkErr) => {
                    if (unlinkErr) console.error("Error deleting new file:", unlinkErr);
                });
            }
            return res.status(404).json({ message: 'Manpower entry not found.' });
        }

        manpower.empId = empId !== undefined ? empId : manpower.empId;
        manpower.name = name !== undefined ? name : manpower.name;
        manpower.roleId = roleId !== undefined ? roleId : manpower.roleId;
        manpower.roleName = roleName !== undefined ? roleName : manpower.roleName;
        manpower.phoneNumber = phoneNumber !== undefined ? phoneNumber : manpower.phoneNumber;
        manpower.address = address !== undefined ? address : manpower.address;
        manpower.payRateType = payRateType !== undefined ? payRateType : manpower.payRateType;
        manpower.payRate = payRate !== undefined ? payRate : manpower.payRate;

        if (newPhotoPath) {
            if (manpower.photo) {
                const oldPhotoFullPath = path.join(__dirname, '..', manpower.photo);
                if (fs.existsSync(oldPhotoFullPath)) {
                    fs.unlink(oldPhotoFullPath, (err) => {
                        if (err) console.error("Error deleting old manpower photo:", err);
                    });
                }
            }
            manpower.photo = newPhotoPath;
        } else if (req.body.photo === '') {
            if (manpower.photo) {
                const oldPhotoFullPath = path.join(__dirname, '..', manpower.photo);
                if (fs.existsSync(oldPhotoFullPath)) {
                    fs.unlink(oldPhotoFullPath, (err) => {
                        if (err) console.error("Error deleting old manpower photo on clear:", err);
                    });
                }
            }
            manpower.photo = '';
        }

        const updatedManpower = await manpower.save();
        res.json(updatedManpower);
    } catch (err) {
        if (req.file) {
            fs.unlink(req.file.path, (unlinkErr) => {
                if (unlinkErr) console.error("Error deleting uploaded file:", unlinkErr);
            });
        }
        if (err.name === 'ValidationError') {
            let errors = {};
            Object.keys(err.errors).forEach((key) => {
                errors[key] = err.errors[key].message;
            });
            return res.status(400).json({ message: 'Manpower validation failed', errors: errors });
        }
        console.error("Error updating manpower entry:", err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

const deleteManpower = async (req, res) => {
    try {
        const manpower = await Manpower.findById(req.params.id);
        if (!manpower) {
            return res.status(404).json({ message: 'Manpower entry not found.' });
        }

        if (manpower.photo) {
            const photoFullPath = path.join(__dirname, '..', manpower.photo);
            if (fs.existsSync(photoFullPath)) {
                fs.unlink(photoFullPath, (err) => {
                    if (err) console.error("Error deleting manpower photo on delete:", err);
                });
            }
        }
        
        await manpower.deleteOne();
        res.json({ message: 'Manpower entry deleted successfully.' });
    } catch (err) {
        console.error("Error deleting manpower entry:", err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

module.exports = {
    getManpower,
    getManpowerById,
    createManpower,
    updateManpower,
    deleteManpower,
    getNextManpowerId
};
