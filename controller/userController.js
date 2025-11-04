// Import required libraries
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

const getUsers = asyncHandler(async (req, res) => {
    const users = await User.find({}).select('-password');
    res.status(200).json(users);
});

const getUserById = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    if (req.user.role === 'admin' || req.user.role === 'manager' || req.user.id === req.params.id) {
        res.status(200).json(user);
    } else {
        res.status(403);
        throw new Error('Not authorized to view this user profile');
    }
});

const getOwnProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }
    res.status(200).json(user);
});

const updateProfile = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const {
        firstName, lastName, companyName, contactNumber, gst, tinNumber,
        address, natureOfWork, logo,
    } = req.body;

    const user = await User.findById(userId);

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    user.profile = {
        firstName: firstName || user.profile.firstName,
        lastName: lastName || user.profile.lastName,
        companyName: companyName || user.profile.companyName,
        contactNumber: contactNumber || user.profile.contactNumber,
        gst: gst || user.profile.gst,
        tinNumber: tinNumber || user.profile.tinNumber,
        address: address || user.profile.address,
        natureOfWork: natureOfWork || user.profile.natureOfWork,
        logo: logo || user.profile.logo
    };

    if (req.body.username && req.body.username !== user.username) {
        user.username = req.body.username;
    }

    if (req.body.email && req.body.email !== user.email) {
        const emailExists = await User.findOne({ email: req.body.email, _id: { $ne: userId } });
        if (emailExists) {
            res.status(400);
            throw new Error('Email is already taken by another user');
        }
        user.email = req.body.email;
    }

    const updatedUser = await user.save();
    res.status(200).json({
        _id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role,
        profile: updatedUser.profile,
    });
});

const updatePassword = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        res.status(400);
        throw new Error('Please provide current and new passwords');
    }

    const user = await User.findById(userId);

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    if (!(await user.matchPassword(currentPassword))) {
        res.status(401);
        throw new Error('Current password is incorrect');
    }

    user.password = newPassword;
    await user.save();
    res.status(200).json({ message: 'Password updated successfully' });
});

const updateUserRole = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;

    const user = await User.findById(id);

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    if (user._id.toString() === req.user.id && role !== 'admin') {
        res.status(403);
        throw new Error('Admin cannot change their own role');
    }

    const validRoles = ['admin', 'manager', 'employee', 'client'];
    if (!validRoles.includes(role)) {
        res.status(400);
        throw new Error('Invalid role specified');
    }

    user.role = role;
    const updatedUser = await user.save();
    res.status(200).json({
        _id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role,
    });
});

const deleteUser = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    if (user._id.toString() === req.user.id) {
        res.status(403);
        throw new Error('Admin cannot delete own account');
    }

    await User.deleteOne({ _id: id });
    res.status(200).json({ message: 'User removed' });
});

module.exports = {
    getUsers,
    getUserById,
    getOwnProfile,
    updateProfile,
    updatePassword,
    updateUserRole,
    deleteUser
};
