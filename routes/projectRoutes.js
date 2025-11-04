// projectRoutes.js
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const clientRoutes = require('./clientRoutes');

const {
    getProjects,
    getProjectById,
    getProjectsByStatus,
    createProject,
    updateProject,
    deleteProject
} = require('../controller/projectController');

router.route('/')
    .get(authenticateToken, getProjects)
    .post(authenticateToken, createProject);

router.route('/:id')
    .get(authenticateToken, getProjectById)
    .put(authenticateToken, updateProject)
    .delete(authenticateToken, deleteProject);

router.get('/status/:status', authenticateToken, getProjectsByStatus);

router.use('/:projectId/clients', clientRoutes);

module.exports = router;
