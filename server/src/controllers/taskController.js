const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');
const { validationResult } = require('express-validator');

// @desc    Get all tasks
// @route   GET /api/tasks
// @access  Private
const getTasks = async (req, res) => {
  const { project, assigned_to, status } = req.query;

  try {
    const query = {};

    // Apply query filters if provided
    if (project) query.project = project;
    if (assigned_to) query.assigned_to = assigned_to;
    if (status) query.status = status;

    let tasks;

    if (req.user.role === 'Admin') {
      // Admins can see all tasks matching filter
      tasks = await Task.find(query)
        .populate('project', 'name')
        .populate('assigned_to', 'name email role')
        .populate('created_by', 'name email');
    } else {
      // Members can only see tasks matching filter AND they must be either:
      // 1. Assigned to them directly
      // 2. Part of a project they are a member of
      const memberProjects = await Project.find({ members: req.user._id }).select('_id');
      const projectIds = memberProjects.map((p) => p._id);

      // Restrict query to projects the member belongs to
      if (query.project) {
        if (!projectIds.some(id => id.toString() === query.project.toString())) {
          return res.status(403).json({ success: false, message: 'Access denied to this project tasks' });
        }
      } else {
        query.project = { $in: projectIds };
      }

      tasks = await Task.find(query)
        .populate('project', 'name')
        .populate('assigned_to', 'name email role')
        .populate('created_by', 'name email');
    }

    res.json({ success: true, count: tasks.length, data: tasks });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Create a task
// @route   POST /api/tasks
// @access  Private/Admin
const createTask = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { title, description, priority, due_date, project, assigned_to } = req.body;

  try {
    // 1. Validate due date is not in the past
    const inputDate = new Date(due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // compare dates only (start of today)
    if (inputDate < today) {
      return res.status(400).json({
        success: false,
        message: 'Task due date cannot be in the past when creating',
      });
    }

    // 2. Validate project exists
    const projectDoc = await Project.findById(project);
    if (!projectDoc) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // 3. Validate assigned user exists
    const userDoc = await User.findById(assigned_to);
    if (!userDoc) {
      return res.status(404).json({ success: false, message: 'Assigned user not found' });
    }

    // 4. Validate user is a member of the project
    if (!projectDoc.members.includes(assigned_to)) {
      return res.status(400).json({
        success: false,
        message: 'Assigned user must be a member of the project',
      });
    }

    // Create task
    const task = await Task.create({
      title,
      description,
      priority: priority || 'Medium',
      status: 'To Do', // default
      due_date,
      project,
      assigned_to,
      created_by: req.user._id,
    });

    const populatedTask = await Task.findById(task._id)
      .populate('project', 'name')
      .populate('assigned_to', 'name email role')
      .populate('created_by', 'name email');

    res.status(201).json({ success: true, data: populatedTask });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update a task
// @route   PUT /api/tasks/:id
// @access  Private/Admin
const updateTask = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { title, description, priority, status, due_date, project, assigned_to } = req.body;

  try {
    let task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const targetProject = project || task.project;

    // Check project exists
    const projectDoc = await Project.findById(targetProject);
    if (!projectDoc) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Validate assigned user if changed or update is made
    if (assigned_to) {
      const userDoc = await User.findById(assigned_to);
      if (!userDoc) {
        return res.status(404).json({ success: false, message: 'Assigned user not found' });
      }

      // Check member belongs to project
      if (!projectDoc.members.includes(assigned_to)) {
        return res.status(400).json({
          success: false,
          message: 'Assigned user must be a member of the project',
        });
      }
      task.assigned_to = assigned_to;
    }

    // Update fields
    task.title = title || task.title;
    task.description = description !== undefined ? description : task.description;
    task.priority = priority || task.priority;
    task.status = status || task.status;
    task.due_date = due_date || task.due_date;
    task.project = targetProject;

    await task.save();

    const populatedTask = await Task.findById(task._id)
      .populate('project', 'name')
      .populate('assigned_to', 'name email role')
      .populate('created_by', 'name email');

    res.json({ success: true, data: populatedTask });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private/Admin
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    await Task.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Task deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Patch task status (Member and Admin)
// @route   PATCH /api/tasks/:id/status
// @access  Private
const updateTaskStatus = async (req, res) => {
  const { status } = req.body;

  if (!status || !['To Do', 'In Progress', 'Done'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid status: To Do, In Progress, or Done',
    });
  }

  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Role check: Members can only update status of tasks assigned to them
    if (req.user.role === 'Member' && task.assigned_to.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You can only update the status of tasks assigned to you',
      });
    }

    task.status = status;
    await task.save();

    const populatedTask = await Task.findById(task._id)
      .populate('project', 'name')
      .populate('assigned_to', 'name email role')
      .populate('created_by', 'name email');

    res.json({ success: true, data: populatedTask });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
};
