// projectController.js
const asyncHandler = require('express-async-handler');
const Project = require('../models/Project');
const Client = require('../models/Client');

const getProjects = asyncHandler(async (req, res) => {
    let query = {};
    if (req.user.role === 'admin' || req.user.role === 'manager') {
    } else {
        query.user = req.user.id;
    }
    const projects = await Project.find(query).populate('client');
    res.status(200).json(projects);
});

const getProjectsByStatus = asyncHandler(async (req, res) => {
    const projectStatus = req.params.status;
    let query = { status: projectStatus };

    if (req.user.role === 'admin' || req.user.role === 'manager') {
    } else {
        query.user = req.user.id;
    }

    const projects = await Project.find(query).populate('client');

    if (projects.length === 0) {
        res.status(404);
        throw new Error(`No projects found with status: ${projectStatus}`);
    }

    res.status(200).json(projects);
});

const getProjectById = asyncHandler(async (req, res) => {
    const project = await Project.findById(req.params.id).populate('client');
    if (!project) {
        res.status(404);
        throw new Error('Project not found');
    }
    if (project.user && project.user.toString() !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'manager') {
        res.status(401);
        throw new Error('Not authorized to view this project');
    }
    res.status(200).json(project);
});

const createProject = asyncHandler(async (req, res) => {
    const { projectName, scope, startDate, endDate, date, gst, totalCost, description, status, clientId } = req.body;
    if (!projectName || !totalCost) {
        res.status(400);
        throw new Error('Please add project name and total cost');
    }
    if (clientId) {
        const clientExists = await Client.findById(clientId);
        if (!clientExists) {
            res.status(400);
            throw new Error('Invalid client ID provided');
        }
    }
    const project = await Project.create({
        projectName,
        scope,
        startDate,
        endDate,
        date,
        gst,
        totalCost,
        description,
        status,
        client: clientId || null,
        user: req.user.id
    });
    res.status(201).json(project);
});

const updateProject = asyncHandler(async (req, res) => {
    const { projectName, scope, startDate, endDate, date, gst, totalCost, description, status, clientId } = req.body;
    let project = await Project.findById(req.params.id);
    if (!project) {
        res.status(404);
        throw new Error('Project not found');
    }
    if (project.user && project.user.toString() !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'manager') {
        res.status(401);
        throw new Error('Not authorized to update this project');
    }

    if (clientId && project.client && clientId.toString() !== project.client.toString()) {
        const clientExists = await Client.findById(clientId);
        if (!clientExists) {
            res.status(400);
            throw new Error('Invalid client ID provided');
        }
    } else if (clientId && !project.client) {
        const clientExists = await Client.findById(clientId);
        if (!clientExists) {
            res.status(400);
            throw new Error('Invalid client ID provided');
        }
    }

    project.projectName = projectName !== undefined ? projectName : project.projectName;
    project.scope = scope !== undefined ? scope : project.scope;
    project.startDate = startDate !== undefined ? startDate : project.startDate;
    project.endDate = endDate !== undefined ? endDate : project.endDate;
    project.date = date !== undefined ? date : project.date;
    project.gst = gst !== undefined ? gst : project.gst;
    project.totalCost = totalCost !== undefined ? totalCost : project.totalCost;
    project.description = description !== undefined ? description : project.description;
    project.status = status !== undefined ? status : project.status;
    project.client = clientId !== undefined ? clientId : project.client;
    const updatedProject = await project.save();
    res.status(200).json(updatedProject);
});

const deleteProject = asyncHandler(async (req, res) => {
    const project = await Project.findById(req.params.id);
    if (!project) {
        res.status(404);
        throw new Error('Project not found');
    }
    if (project.user && project.user.toString() !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'manager') {
        res.status(401);
        throw new Error('Not authorized to delete this project');
    }
    await Project.deleteOne({ _id: req.params.id });
    res.status(200).json({ message: 'Project removed' });
});

module.exports = {
    getProjects,
    getProjectsByStatus,
    getProjectById,
    createProject,
    updateProject,
    deleteProject
};
