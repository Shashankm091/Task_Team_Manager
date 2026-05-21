import React, { useEffect, useState, useContext } from 'react';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { ToastContext } from '../context/ToastContext';
import { 
  CheckSquare, 
  Plus, 
  Calendar, 
  Trash2, 
  Edit3, 
  X, 
  User, 
  AlertCircle
} from 'lucide-react';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]); // All users
  const [loading, setLoading] = useState(true);

  // Modal States
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  // Form States
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState('Medium');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskProject, setTaskProject] = useState('');
  const [taskAssignee, setTaskAssignee] = useState('');

  const { user } = useContext(AuthContext);
  const { showToast } = useContext(ToastContext);
  const isAdmin = user?.role === 'Admin';

  useEffect(() => {
    fetchTasks();
    fetchProjects();
    fetchUsers();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await api.get('/tasks');
      setTasks(res.data.data);
    } catch (error) {
      console.error(error);
      showToast('Failed to load tasks', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects');
      setProjects(res.data.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data.data);
    } catch (error) {
      console.error(error);
    }
  };

  // Get members assigned to the currently selected project in the form
  const getProjectMembers = () => {
    if (!taskProject) return [];
    const selectedProj = projects.find(p => p._id === taskProject);
    return selectedProj?.members || []; // these are populated members
  };

  const handleOpenCreateModal = () => {
    setSelectedTask(null);
    setTaskTitle('');
    setTaskDesc('');
    setTaskPriority('Medium');
    setTaskDueDate('');
    setTaskProject(projects[0]?._id || '');
    setTaskAssignee('');
    setShowTaskModal(true);
  };

  const handleOpenEditModal = (task) => {
    setSelectedTask(task);
    setTaskTitle(task.title);
    setTaskDesc(task.description || '');
    setTaskPriority(task.priority);
    // Format due_date to YYYY-MM-DD
    const date = new Date(task.due_date);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    setTaskDueDate(`${year}-${month}-${day}`);
    setTaskProject(task.project?._id || '');
    setTaskAssignee(task.assigned_to?._id || '');
    setShowTaskModal(true);
  };

  const handleSaveTask = async (e) => {
    e.preventDefault();
    if (!taskTitle || !taskDueDate || !taskProject || !taskAssignee) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    // Due date check on creation (frontend validation)
    if (!selectedTask) {
      const inputDate = new Date(taskDueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (inputDate < today) {
        showToast('Task due date cannot be in the past when creating', 'error');
        return;
      }
    }

    try {
      const payload = {
        title: taskTitle,
        description: taskDesc,
        priority: taskPriority,
        due_date: taskDueDate,
        project: taskProject,
        assigned_to: taskAssignee,
      };

      if (selectedTask) {
        // Edit Mode
        const res = await api.put(`/tasks/${selectedTask._id}`, payload);
        if (res.data.success) {
          showToast('Task updated successfully', 'success');
          setTasks(tasks.map(t => t._id === selectedTask._id ? res.data.data : t));
        }
      } else {
        // Create Mode
        const res = await api.post('/tasks', payload);
        if (res.data.success) {
          showToast('Task created successfully', 'success');
          setTasks([...tasks, res.data.data]);
        }
      }
      setShowTaskModal(false);
    } catch (error) {
      console.error(error);
      showToast(error.response?.data?.message || 'Error saving task', 'error');
    }
  };

  const handleDeleteTask = async (id) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    try {
      const res = await api.delete(`/tasks/${id}`);
      if (res.data.success) {
        showToast('Task deleted successfully', 'success');
        setTasks(tasks.filter(t => t._id !== id));
      }
    } catch (error) {
      console.error(error);
      showToast('Failed to delete task', 'error');
    }
  };

  // Status Patch endpoint for quick Kanban status moves
  const handleUpdateStatus = async (taskId, newStatus) => {
    try {
      const res = await api.patch(`/tasks/${taskId}/status`, { status: newStatus });
      if (res.data.success) {
        showToast(`Task status updated to ${newStatus}`, 'success');
        setTasks(tasks.map(t => t._id === taskId ? res.data.data : t));
      }
    } catch (error) {
      console.error(error);
      showToast(error.response?.data?.message || 'Failed to update status', 'error');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  // Split tasks by status columns
  const columns = {
    'To Do': tasks.filter(t => t.status === 'To Do'),
    'In Progress': tasks.filter(t => t.status === 'In Progress'),
    'Done': tasks.filter(t => t.status === 'Done'),
    'Overdue': tasks.filter(t => t.status === 'Overdue'),
  };

  if (loading && tasks.length === 0) {
    return (
      <div className="empty-state">
        <CheckSquare size={40} className="brand-icon animate-pulse" />
        <h3>Loading Tasks...</h3>
      </div>
    );
  }

  // Get minimum date for due date field (today) on create
  const getMinDueDate = () => {
    if (selectedTask) return undefined; // allow past date for editing existing
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Task Board</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            {isAdmin ? 'Create, edit, and assign tasks across all projects.' : 'Manage your assigned tasks and update progress.'}
          </p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={handleOpenCreateModal}>
            <Plus size={18} />
            <span>New Task</span>
          </button>
        )}
      </div>

      {tasks.length === 0 ? (
        <div className="glass-card empty-state">
          <CheckSquare size={48} className="empty-state-icon" />
          <h3>No tasks found</h3>
          <p>
            {isAdmin 
              ? "Create your first task by clicking the 'New Task' button above." 
              : "No tasks are assigned to you at the moment."}
          </p>
          {isAdmin && (
            <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={handleOpenCreateModal}>
              Create Task
            </button>
          )}
        </div>
      ) : (
        <div className="task-board">
          {Object.entries(columns).map(([colName, colTasks]) => (
            <div key={colName} className="board-column">
              <div className="board-column-header">
                <div className="board-column-title">
                  <span className={`column-dot ${colName.replace(' ', '').toLowerCase()}`}></span>
                  <span>{colName}</span>
                </div>
                <span className="column-count">{colTasks.length}</span>
              </div>

              <div className="board-cards-list">
                {colTasks.map((task) => {
                  const isAssignedToMe = task.assigned_to?._id === user?.id;
                  const canUpdateStatus = isAdmin || isAssignedToMe;

                  return (
                    <div key={task._id} className={`task-card priority-${task.priority}`}>
                      <div className="task-card-header">
                        <span className="task-project-tag">{task.project?.name || 'N/A'}</span>
                        <span className={`badge badge-${task.priority.toLowerCase()}`} style={{ scale: '0.85' }}>
                          {task.priority}
                        </span>
                      </div>

                      <h4>{task.title}</h4>
                      <p className="task-card-desc">{task.description || 'No description.'}</p>

                      {/* Status quick toggle for member/admin */}
                      {canUpdateStatus && (
                        <div style={{ marginBottom: '0.75rem' }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--color-text-dim)', display: 'block', marginBottom: '0.2rem' }}>Update Status</span>
                          <select
                            className="form-input"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', height: 'auto', background: 'rgba(255,255,255,0.03)' }}
                            value={task.status}
                            onChange={(e) => handleUpdateStatus(task._id, e.target.value)}
                          >
                            {task.status === 'Overdue' && <option value="Overdue">Overdue</option>}
                            <option value="To Do">To Do</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Done">Done</option>
                          </select>
                        </div>
                      )}

                      {task.status === 'Overdue' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--color-overdue)', fontSize: '0.75rem', marginBottom: '0.75rem', fontWeight: 600 }}>
                          <AlertCircle size={14} />
                          <span>Deadline Past Due</span>
                        </div>
                      )}

                      <div className="task-card-footer">
                        <div className="task-assignee" title={`Assigned to: ${task.assigned_to?.name || 'Unassigned'}`}>
                          <div className="assignee-avatar">
                            {getInitials(task.assigned_to?.name)}
                          </div>
                          <span style={{ fontSize: '0.75rem', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '80px' }}>
                            {task.assigned_to?.name ? task.assigned_to.name.split(' ')[0] : 'Unassigned'}
                          </span>
                        </div>

                        <span className={`task-due-date ${task.status === 'Overdue' ? 'overdue' : ''}`}>
                          <Calendar size={12} />
                          {formatDate(task.due_date)}
                        </span>
                      </div>

                      {isAdmin && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.25rem', marginTop: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem' }}>
                          <button 
                            className="btn-icon" 
                            onClick={() => handleOpenEditModal(task)} 
                            title="Edit Task"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button 
                            className="btn-icon delete" 
                            onClick={() => handleDeleteTask(task._id)} 
                            title="Delete Task"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
                {colTasks.length === 0 && (
                  <div style={{ textAlign: 'center', color: 'var(--color-text-dim)', fontSize: '0.8rem', padding: '2rem 0' }}>
                    Column empty
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Task Form Modal (Create/Edit) */}
      {showTaskModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="btn-icon" style={{ position: 'absolute', top: '1rem', right: '1rem' }} onClick={() => setShowTaskModal(false)}>
              <X size={20} />
            </button>
            <h2 style={{ marginBottom: '1.5rem' }}>{selectedTask ? 'Edit Task' : 'Create New Task'}</h2>
            
            <form onSubmit={handleSaveTask}>
              <div className="form-group">
                <label className="form-label">Task Title *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Build login UI"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-input"
                  rows="3"
                  placeholder="Detail the task sub-goals and constraints..."
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label">Priority *</label>
                  <select
                    className="form-input"
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value)}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Due Date *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    min={getMinDueDate()}
                    required
                  />
                </div>
              </div>

              <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label">Project *</label>
                  <select
                    className="form-input"
                    value={taskProject}
                    onChange={(e) => {
                      setTaskProject(e.target.value);
                      setTaskAssignee(''); // reset assignee since project changed
                    }}
                    required
                  >
                    <option value="" disabled>Select Project</option>
                    {projects.map((p) => (
                      <option key={p._id} value={p._id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Assignee (Project Members) *</label>
                  <select
                    className="form-input"
                    value={taskAssignee}
                    onChange={(e) => setTaskAssignee(e.target.value)}
                    required
                    disabled={!taskProject}
                  >
                    <option value="">Select Assignee</option>
                    {getProjectMembers().map((m) => (
                      <option key={m._id} value={m._id}>{m.name} ({m.role})</option>
                    ))}
                    {taskProject && getProjectMembers().length === 0 && (
                      <option value="" disabled>No members on project! Add them in Projects tab first.</option>
                    )}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '2rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowTaskModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {selectedTask ? 'Save Changes' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
