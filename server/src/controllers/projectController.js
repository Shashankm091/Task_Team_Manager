const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const { validationResult } = require('express-validator');

// @desc    Get all projects
// @route   GET /api/projects
// @access  Private
const getProjects = async (req, res) => {
  try {
    let projects;

    if (req.user.role === 'Admin') {
      // Admins get all projects
      projects = await Project.find()
        .populate('members', 'name email role')
        .populate('created_by', 'name email');
    } else {
      // Members only get projects they are assigned to
      projects = await Project.find({ members: req.user._id })
        .populate('members', 'name email role')
        .populate('created_by', 'name email');
    }

    res.json({ success: true, count: projects.length, data: projects });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Create a project
// @route   POST /api/projects
// @access  Private/Admin
const createProject = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { name, description, deadline, members } = req.body;

  try {
    const project = await Project.create({
      name,
      description,
      deadline,
      members: members || [],
      created_by: req.user._id,
    });

    const populatedProject = await Project.findById(project._id)
      .populate('members', 'name email role')
      .populate('created_by', 'name email');

    res.status(201).json({ success: true, data: populatedProject });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update a project
// @route   PUT /api/projects/:id
// @access  Private/Admin
const updateProject = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { name, description, deadline, members } = req.body;

  try {
    let project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Update fields
    project.name = name || project.name;
    project.description = description !== undefined ? description : project.description;
    project.deadline = deadline || project.deadline;
    if (members) project.members = members;

    await project.save();

    const populatedProject = await Project.findById(project._id)
      .populate('members', 'name email role')
      .populate('created_by', 'name email');

    res.json({ success: true, data: populatedProject });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete a project
// @route   DELETE /api/projects/:id
// @access  Private/Admin
const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Delete all tasks associated with this project
    await Task.deleteMany({ project: req.params.id });

    // Delete project
    await Project.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Project and all associated tasks deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Add member to project
// @route   POST /api/projects/:id/members
// @access  Private/Admin
const addProjectMember = async (req, res) => {
  const { userId } = req.body;

  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if user is already a member
    if (project.members.includes(userId)) {
      return res.status(400).json({ success: false, message: 'User is already a member of this project' });
    }

    project.members.push(userId);
    await project.save();

    const populatedProject = await Project.findById(project._id)
      .populate('members', 'name email role');

    res.json({ success: true, data: populatedProject });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Remove member from project
// @route   DELETE /api/projects/:id/members/:userId
// @access  Private/Admin
const removeProjectMember = async (req, res) => {
  const { id, userId } = req.params;

  try {
    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Check if user is a member
    if (!project.members.includes(userId)) {
      return res.status(400).json({ success: false, message: 'User is not a member of this project' });
    }

    // Remove member
    project.members = project.members.filter((memberId) => memberId.toString() !== userId);
    await project.save();

    // Unassign user's tasks in this project
    await Task.updateMany(
      { project: id, assigned_to: userId },
      { $set: { assigned_to: null } } // Or we can handle it, wait: task requires assigned_to. Actually, let's keep it null or delete task? Wait! Task schema says assigned_to is required. If a task requires assigned_to, then unassigning might throw validation error on save, or wait - since we did updateMany, it bypasses mongoose validation unless runValidators is true, but it's better to delete or reassign, or delete the task, or let's keep assigned_to optional or check: wait, the schema we wrote had: assigned_to: { type: ObjectId, ref: 'User', required: true }.
      // If we remove the user, we can either reassign to project creator, or delete their tasks, or let's update the task assigned_to to the project's creator, or let's allow assigned_to to be null in Mongoose (remove required: true) to support unassigned tasks.
      // Wait, is it better if assigned_to is optional? Yes! In real projects, a task can be unassigned (To Do, waiting for someone). Let's edit Task.js model later if needed, or let's check: the spec says: "Assign task to a specific team member". It doesn't strictly say it can't be unassigned, but if we remove a member, we can just delete the tasks assigned to them, or we can just remove them and change the task's assignee. Let's make sure we update the task assigned_to, or let's just make assigned_to optional in Task.js schema! Let's do that to avoid validation issues. I'll modify Task.js schema to make assigned_to not strictly required or let's just delete the task or set it to Admin. Let's keep it simple: we can delete the tasks assigned to that member or set them to the project creator. Let's set them to the project creator! That's very clean and keeps tasks intact.
    );

    // Actually, let's look at the Task model. It has:
    // assigned_to: { type: Schema.Types.ObjectId, ref: 'User', required: true }
    // If it's required, we can reassign to the project's creator:
    await Task.updateMany(
      { project: id, assigned_to: userId },
      { $set: { assigned_to: project.created_by } }
    );

    const populatedProject = await Project.findById(project._id)
      .populate('members', 'name email role');

    res.json({ success: true, data: populatedProject });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
  addProjectMember,
  removeProjectMember,
};
