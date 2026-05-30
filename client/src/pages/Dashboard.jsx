import React, { useEffect, useState, useContext } from 'react';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { ToastContext } from '../context/ToastContext';
import { 
  Briefcase, 
  CheckSquare, 
  AlertTriangle, 
  Calendar,
  Clock,
  TrendingUp
} from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [taskFilter, setTaskFilter] = useState('All'); // 'All', 'My Tasks', 'Overdue'
  const [loading, setLoading] = useState(true);

  const { user } = useContext(AuthContext);
  const { showToast } = useContext(ToastContext);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch dashboard stats
      const statsRes = await api.get('/dashboard/stats');
      setStats(statsRes.data.data);

      // 2. Fetch tasks for the quick task list widget
      const tasksRes = await api.get('/tasks');
      setTasks(tasksRes.data.data);
    } catch (error) {
      console.error(error);
      showToast('Failed to load dashboard statistics', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="empty-state">
        <Clock size={40} className="brand-icon animate-pulse" />
        <h3>Loading Dashboard...</h3>
        <p>Fetching statistics and task workflows.</p>
      </div>
    );
  }

  const summary = stats?.summary || { totalProjects: 0, totalTasks: 0, completedTasks: 0, overdueTasks: 0 };
  const projectProgress = stats?.projectProgress || [];
  const upcomingTasks = stats?.upcomingTasks || [];

  // Filter tasks for the dashboard widget
  const getFilteredTasks = () => {
    switch (taskFilter) {
      case 'My Tasks':
        return tasks.filter(t => t.assigned_to?._id === user?.id);
      case 'Overdue':
        return tasks.filter(t => t.status === 'Overdue');
      case 'All':
      default:
        return tasks;
    }
  };

  const filteredTasks = getFilteredTasks();

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard Overview</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Welcome back, {user?.name}!</p>
        </div>
        <button className="btn btn-secondary" onClick={fetchDashboardData}>Refresh Stats</button>
      </div>

      {/* Summary Cards */}
      <div className="stats-grid">
        <div className="glass-card stat-card">
          <div className="stat-info">
            <h3>Total Projects</h3>
            <p>{summary.totalProjects}</p>
          </div>
          <div className="stat-icon-box primary">
            <Briefcase size={24} />
          </div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-info">
            <h3>Total Tasks</h3>
            <p>{summary.totalTasks}</p>
          </div>
          <div className="stat-icon-box warning">
            <CheckSquare size={24} />
          </div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-info">
            <h3>Completed Tasks</h3>
            <p>{summary.completedTasks}</p>
          </div>
          <div className="stat-icon-box success">
            <TrendingUp size={24} />
          </div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-info">
            <h3>Overdue Tasks</h3>
            <p>{summary.overdueTasks}</p>
          </div>
          <div className="stat-icon-box danger">
            <AlertTriangle size={24} />
          </div>
        </div>
      </div>

      <div className="dashboard-sections">
        {/* Left Column: Projects Progress & Quick Task List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Projects Progress */}
          <div className="glass-card">
            <h3 className="section-title">
              <Briefcase size={20} className="brand-icon" />
              Project Completion Progress
            </h3>

            {projectProgress.length === 0 ? (
              <div className="empty-state" style={{ padding: '1.5rem' }}>
                <p>No projects created yet.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {projectProgress.map((proj) => (
                  <div key={proj.id} className="project-progress-item">
                    <div className="progress-header">
                      <span>{proj.name}</span>
                      <span>{proj.progressPercentage}% ({proj.completedTasks}/{proj.totalTasks} Tasks)</span>
                    </div>
                    <div className="progress-bar-bg">
                      <div 
                        className="progress-bar-fill" 
                        style={{ width: `${proj.progressPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Task List Widget with Filters */}
          <div className="glass-card">
            <div className="page-header" style={{ marginBottom: '1.25rem' }}>
              <h3 className="section-title" style={{ marginBottom: 0 }}>
                <CheckSquare size={20} className="brand-icon" />
                Task Overview
              </h3>
              
              {/* Task filters */}
              <div style={{ display: 'flex', gap: '0.5rem', background: '#121212', padding: '0.4rem', border: '4px solid #000' }}>
                {['All', 'My Tasks', 'Overdue'].map((filter) => (
                  <button
                    key={filter}
                    className="btn"
                    style={{
                      padding: '0.5rem 1rem',
                      fontSize: '0.85rem',
                      background: taskFilter === filter ? '#5B8731' : '#7a7a7a',
                      color: '#fff',
                      border: '3px solid #000',
                      boxShadow: taskFilter === filter 
                        ? 'inset -2px -2px 0px #354e1d, inset 2px 2px 0px #82bf45' 
                        : 'inset -2px -2px 0px #4a4a4a, inset 2px 2px 0px #aeaeae',
                    }}
                    onClick={() => setTaskFilter(filter)}
                  >
                    {filter === 'My Tasks' ? 'My Assigned' : filter}
                  </button>
                ))}
              </div>
            </div>

            {filteredTasks.length === 0 ? (
              <div className="empty-state" style={{ padding: '2rem' }}>
                <h3>No tasks found</h3>
                <p>There are no tasks matching your selected filter.</p>
              </div>
            ) : (
              <div className="team-table-container">
                <table className="team-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Project</th>
                      <th>Assignee</th>
                      <th>Priority</th>
                      <th>Due Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTasks.slice(0, 6).map((task) => (
                      <tr key={task._id}>
                        <td style={{ fontWeight: 600 }}>{task.title}</td>
                        <td style={{ color: 'var(--color-text-muted)' }}>{task.project?.name || 'N/A'}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div className="assignee-avatar" style={{ width: '20px', height: '20px', fontSize: '0.6rem' }}>
                              {task.assigned_to?.name ? task.assigned_to.name.split(' ').map(n => n[0]).join('').substring(0, 2) : 'U'}
                            </div>
                            <span>{task.assigned_to?.name || 'Unassigned'}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`badge badge-${task.priority.toLowerCase()}`}>
                            {task.priority}
                          </span>
                        </td>
                        <td>
                          <span className={`task-due-date ${task.status === 'Overdue' ? 'overdue' : ''}`}>
                            {formatDate(task.due_date)}
                          </span>
                        </td>
                        <td>
                          <span 
                            className="badge" 
                            style={{ 
                              background: task.status === 'Done' ? 'var(--color-done-bg)' : task.status === 'In Progress' ? 'var(--color-progress-bg)' : task.status === 'Overdue' ? 'var(--color-overdue-bg)' : 'var(--color-todo-bg)',
                              color: task.status === 'Done' ? 'var(--color-done)' : task.status === 'In Progress' ? 'var(--color-progress)' : task.status === 'Overdue' ? 'var(--color-overdue)' : 'var(--color-todo)'
                            }}
                          >
                            {task.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Upcoming Deadlines */}
        <div>
          <div className="glass-card">
            <h3 className="section-title">
              <Calendar size={20} className="brand-icon" />
              Upcoming Deadlines
            </h3>

            {upcomingTasks.length === 0 ? (
              <div className="empty-state" style={{ padding: '2rem' }}>
                <p>No upcoming task deadlines.</p>
              </div>
            ) : (
              <div className="upcoming-list">
                {upcomingTasks.map((task) => (
                  <div key={task._id} className="upcoming-item">
                    <div className="upcoming-info">
                      <h4>{task.title}</h4>
                      <span>Project: {task.project?.name || 'N/A'}</span>
                    </div>
                    <div className="upcoming-date">
                      <Clock size={14} />
                      <span>{formatDate(task.due_date)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
