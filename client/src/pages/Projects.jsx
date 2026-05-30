import React, { useEffect, useState, useContext } from 'react';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { ToastContext } from '../context/ToastContext';
import { 
  Briefcase, 
  Plus, 
  Calendar, 
  Trash2, 
  Edit3, 
  UserPlus, 
  UserMinus,
  X,
  Users
} from 'lucide-react';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]); // for member assignment
  const [loading, setLoading] = useState(true);

  // Modal States
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  // Form States
  const [projectName, setProjectName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [projectDeadline, setProjectDeadline] = useState('');
  const [projectMembers, setProjectMembers] = useState([]); // Array of user IDs

  const { user } = useContext(AuthContext);
  const { showToast } = useContext(ToastContext);
  const isAdmin = user?.role === 'Admin';

  useEffect(() => {
    fetchProjects();
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await api.get('/projects');
      setProjects(res.data.data);
    } catch (error) {
      console.error(error);
      showToast('Failed to load projects', 'error');
    } finally {
      setLoading(false);
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

  const handleOpenCreateModal = () => {
    setSelectedProject(null);
    setProjectName('');
    setProjectDesc('');
    setProjectDeadline('');
    setProjectMembers([]);
    setShowProjectModal(true);
  };

  const handleOpenEditModal = (proj) => {
    setSelectedProject(proj);
    setProjectName(proj.name);
    setProjectDesc(proj.description || '');
    // Format deadline date to YYYY-MM-DD
    const date = new Date(proj.deadline);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    setProjectDeadline(`${year}-${month}-${day}`);
    setProjectMembers(proj.members.map(m => m._id));
    setShowProjectModal(true);
  };

  const handleOpenMemberModal = (proj) => {
    setSelectedProject(proj);
    setShowMemberModal(true);
  };

  const handleSaveProject = async (e) => {
    e.preventDefault();
    if (!projectName || !projectDeadline) {
      showToast('Please fill in required fields', 'error');
      return;
    }

    try {
      const payload = {
        name: projectName,
        description: projectDesc,
        deadline: projectDeadline,
        members: projectMembers,
      };

      if (selectedProject) {
        // Edit Mode
        const res = await api.put(`/projects/${selectedProject._id}`, payload);
        if (res.data.success) {
          showToast('Project updated successfully', 'success');
          setProjects(projects.map(p => p._id === selectedProject._id ? res.data.data : p));
        }
      } else {
        // Create Mode
        const res = await api.post('/projects', payload);
        if (res.data.success) {
          showToast('Project created successfully', 'success');
          setProjects([...projects, res.data.data]);
        }
      }
      setShowProjectModal(false);
    } catch (error) {
      console.error(error);
      showToast(error.response?.data?.message || 'Error saving project', 'error');
    }
  };

  const handleDeleteProject = async (id) => {
    if (!window.confirm('Are you sure you want to delete this project? This will delete all associated tasks!')) return;

    try {
      const res = await api.delete(`/projects/${id}`);
      if (res.data.success) {
        showToast('Project deleted successfully', 'success');
        setProjects(projects.filter(p => p._id !== id));
      }
    } catch (error) {
      console.error(error);
      showToast('Failed to delete project', 'error');
    }
  };

  const toggleMemberSelection = (userId) => {
    if (projectMembers.includes(userId)) {
      setProjectMembers(projectMembers.filter(id => id !== userId));
    } else {
      setProjectMembers([...projectMembers, userId]);
    }
  };

  const handleAddMember = async (userId) => {
    try {
      const res = await api.post(`/projects/${selectedProject._id}/members`, { userId });
      if (res.data.success) {
        showToast('Member added successfully', 'success');
        // Refresh project list to update UI cards
        fetchProjects();
        // Update selectedProject state to redraw member modal
        const updatedProj = res.data.data;
        // Merge project fields like description and name, api.post returns populated user list
        setSelectedProject({ ...selectedProject, members: updatedProj.members });
      }
    } catch (error) {
      console.error(error);
      showToast(error.response?.data?.message || 'Failed to add member', 'error');
    }
  };

  const handleRemoveMember = async (userId) => {
    try {
      const res = await api.delete(`/projects/${selectedProject._id}/members/${userId}`);
      if (res.data.success) {
        showToast('Member removed from project', 'success');
        fetchProjects();
        const updatedProj = res.data.data;
        setSelectedProject({ ...selectedProject, members: updatedProj.members });
      }
    } catch (error) {
      console.error(error);
      showToast('Failed to remove member', 'error');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  if (loading && projects.length === 0) {
    return (
      <div className="empty-state">
        <Briefcase size={40} className="brand-icon animate-pulse" />
        <h3>Loading Projects...</h3>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            {isAdmin ? 'Manage all corporate projects and team access.' : 'View projects you are assigned to.'}
          </p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={handleOpenCreateModal}>
            <Plus size={18} />
            <span>New Project</span>
          </button>
        )}
      </div>

      {projects.length === 0 ? (
        <div className="glass-card empty-state">
          <Briefcase size={48} className="empty-state-icon" />
          <h3>No projects found</h3>
          <p>
            {isAdmin 
              ? "Create your first project by clicking the 'New Project' button above." 
              : "You are not assigned to any projects at the moment."}
          </p>
          {isAdmin && (
            <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={handleOpenCreateModal}>
              Create Project
            </button>
          )}
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map((proj) => {
            // Simple mockup of visual progress (we'll fetch tasks from this proj later or compute placeholder)
            // But wait, the dashboard stats endpoint returned stats, let's just make it look stunning.
            return (
              <div key={proj._id} className="glass-card">
                <div className="project-card-header">
                  <div className="project-card-title">
                    <h3>{proj.name}</h3>
                    <span className="project-date">
                      <Calendar size={12} />
                      Due {formatDate(proj.deadline)}
                    </span>
                  </div>
                </div>

                <p className="project-card-desc">{proj.description || 'No description provided.'}</p>

                <div className="project-card-footer">
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)', display: 'block', marginBottom: '0.25rem' }}>Team</span>
                    <div className="member-avatars">
                      {proj.members?.slice(0, 4).map((member) => (
                        <div 
                          key={member._id} 
                          className="member-avatar-overlap" 
                          title={`${member.name} (${member.role})`}
                        >
                          {getInitials(member.name)}
                        </div>
                      ))}
                      {proj.members?.length > 4 && (
                        <div className="member-avatar-overlap" style={{ background: 'var(--bg-main)', color: 'var(--color-text-muted)' }}>
                          +{proj.members.length - 4}
                        </div>
                      )}
                      {(!proj.members || proj.members.length === 0) && (
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)' }}>Empty team</span>
                      )}
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="project-actions">
                      <button 
                        className="btn-icon" 
                        onClick={() => handleOpenMemberModal(proj)} 
                        title="Manage Team Members"
                      >
                        <Users size={16} />
                      </button>
                      <button 
                        className="btn-icon" 
                        onClick={() => handleOpenEditModal(proj)} 
                        title="Edit Project"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button 
                        className="btn-icon delete" 
                        onClick={() => handleDeleteProject(proj._id)} 
                        title="Delete Project"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Project Form Modal (Create/Edit) */}
      {showProjectModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="btn-icon" style={{ position: 'absolute', top: '1rem', right: '1rem' }} onClick={() => setShowProjectModal(false)}>
              <X size={20} />
            </button>
            <h2 style={{ marginBottom: '1.5rem' }}>{selectedProject ? 'Edit Project' : 'Create New Project'}</h2>
            
            <form onSubmit={handleSaveProject}>
              <div className="form-group">
                <label className="form-label">Project Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="App Design Redesign"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-input"
                  rows="3"
                  placeholder="Provide project summary and key features..."
                  value={projectDesc}
                  onChange={(e) => setProjectDesc(e.target.value)}
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Deadline *</label>
                <input
                  type="date"
                  className="form-input"
                  value={projectDeadline}
                  onChange={(e) => setProjectDeadline(e.target.value)}
                  required
                />
              </div>

              {!selectedProject && users.length > 0 && (
                <div className="form-group">
                  <label className="form-label">Assign Initial Team Members</label>
                  <div className="members-select-list">
                    {users.map((u) => (
                      <div
                        key={u._id}
                        className={`member-select-item ${projectMembers.includes(u._id) ? 'selected' : ''}`}
                        onClick={() => toggleMemberSelection(u._id)}
                      >
                        <input
                          type="checkbox"
                          checked={projectMembers.includes(u._id)}
                          onChange={() => {}} // toggled on container click
                          style={{ pointerEvents: 'none' }}
                        />
                        <span>{u.name} ({u.role})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '2rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowProjectModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {selectedProject ? 'Save Changes' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Member Management Modal */}
      {showMemberModal && selectedProject && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <button className="btn-icon" style={{ position: 'absolute', top: '1rem', right: '1rem' }} onClick={() => setShowMemberModal(false)}>
              <X size={20} />
            </button>
            <h2 style={{ marginBottom: '0.5rem' }}>Project Members</h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Project: {selectedProject.name}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Currently Assigned */}
              <div>
                <h4 style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Assigned Members</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto' }}>
                  {selectedProject.members?.map((member) => (
                    <div 
                      key={member._id} 
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 1rem', background: '#2d2d2a', border: '3px solid #000', borderRadius: '0px', boxShadow: 'inset -2px -2px 0px #1d1d1a, inset 2px 2px 0px #575753' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div className="assignee-avatar" style={{ width: '24px', height: '24px', fontSize: '0.7rem' }}>
                          {getInitials(member.name)}
                        </div>
                        <span style={{ fontSize: '1.25rem', fontFamily: 'var(--font-body)' }}>{member.name} ({member.role})</span>
                      </div>
                      <button 
                        className="btn-icon delete" 
                        onClick={() => handleRemoveMember(member._id)}
                        title="Remove Member"
                        style={{ padding: '0.2rem' }}
                      >
                        <UserMinus size={16} />
                      </button>
                    </div>
                  ))}
                  {(!selectedProject.members || selectedProject.members.length === 0) && (
                    <span style={{ fontSize: '1.25rem', fontFamily: 'var(--font-body)', color: 'var(--color-text-dim)' }}>No members assigned yet.</span>
                  )}
                </div>
              </div>

              {/* Add New Members */}
              <div>
                <h4 style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Add Team Members</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto' }}>
                  {users
                    .filter(u => !selectedProject.members?.some(m => m._id === u._id))
                    .map((availUser) => (
                      <div 
                        key={availUser._id} 
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 1rem', background: '#2d2d2a', border: '3px solid #000', borderRadius: '0px', boxShadow: 'inset -2px -2px 0px #1d1d1a, inset 2px 2px 0px #575753' }}
                      >
                        <span style={{ fontSize: '1.25rem', fontFamily: 'var(--font-body)' }}>{availUser.name} ({availUser.role})</span>
                        <button 
                          className="btn-icon" 
                          onClick={() => handleAddMember(availUser._id)}
                          title="Add Member"
                          style={{ color: 'var(--color-primary)' }}
                        >
                          <UserPlus size={16} />
                        </button>
                      </div>
                    ))}
                  {users.filter(u => !selectedProject.members?.some(m => m._id === u._id)).length === 0 && (
                    <span style={{ fontSize: '0.85rem', color: 'var(--color-text-dim)' }}>All registered users are members.</span>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
              <button className="btn btn-secondary" onClick={() => setShowMemberModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
