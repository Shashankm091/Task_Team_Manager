const Project = require('../models/Project');
const Task = require('../models/Task');

// @desc    Get dashboard stats
// @route   GET /api/dashboard/stats
// @access  Private
const getStats = async (req, res) => {
  try {
    const isAdmin = req.user.role === 'Admin';
    const userId = req.user._id;

    // 1. PROJECTS COUNT
    let projectsQuery = {};
    if (!isAdmin) {
      projectsQuery = { members: userId };
    }
    const totalProjects = await Project.countDocuments(projectsQuery);

    // 2. TASKS COUNTS (Total, Completed, Overdue)
    let tasksQuery = {};
    if (!isAdmin) {
      // Members only see tasks assigned to them
      tasksQuery = { assigned_to: userId };
    }

    const allTasks = await Task.find(tasksQuery);
    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter(t => t.status === 'Done').length;
    const overdueTasks = allTasks.filter(t => t.status !== 'Done' && t.due_date && new Date(t.due_date) < new Date()).length;

    // 3. UPCOMING DEADLINES (non-completed tasks, sorted by due_date)
    let upcomingQuery = { status: { $ne: 'Done' } };
    if (!isAdmin) {
      upcomingQuery.assigned_to = userId;
    } else {
      // Just keep non-completed
    }

    const upcomingTasks = await Task.find(upcomingQuery)
      .sort({ due_date: 1 })
      .limit(5)
      .populate('project', 'name')
      .populate('assigned_to', 'name');

    // 4. PROJECT VISUAL PROGRESS (percentage completed per project)
    const projectsList = await Project.find(projectsQuery).select('name deadline');
    const projectProgress = [];

    for (const project of projectsList) {
      // Calculate tasks for this project
      const totalProjectTasks = await Task.countDocuments({ project: project._id });
      const completedProjectTasks = await Task.countDocuments({ project: project._id, status: 'Done' });

      const percentage = totalProjectTasks > 0 
        ? Math.round((completedProjectTasks / totalProjectTasks) * 100) 
        : 0;

      projectProgress.push({
        id: project._id,
        name: project.name,
        deadline: project.deadline,
        totalTasks: totalProjectTasks,
        completedTasks: completedProjectTasks,
        progressPercentage: percentage,
      });
    }

    res.json({
      success: true,
      data: {
        summary: {
          totalProjects,
          totalTasks,
          completedTasks,
          overdueTasks,
        },
        upcomingTasks,
        projectProgress,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getStats,
};
