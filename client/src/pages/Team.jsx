import React, { useEffect, useState, useContext } from 'react';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { ToastContext } from '../context/ToastContext';
import { Users, ShieldAlert, Award, Clock } from 'lucide-react';

const Team = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const { user: currentUser } = useContext(AuthContext);
  const { showToast } = useContext(ToastContext);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users');
      setUsers(res.data.data);
    } catch (error) {
      console.error(error);
      showToast('Failed to load team members', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    if (userId === currentUser.id) {
      showToast('You cannot change your own role', 'error');
      return;
    }

    try {
      const res = await api.put(`/users/${userId}/role`, { role: newRole });
      if (res.data.success) {
        showToast(`User role updated successfully`, 'success');
        setUsers(users.map(u => u._id === userId ? { ...u, role: newRole } : u));
      }
    } catch (error) {
      console.error(error);
      showToast(error.response?.data?.message || 'Failed to update user role', 'error');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading && users.length === 0) {
    return (
      <div className="empty-state">
        <Users size={40} className="brand-icon animate-pulse" />
        <h3>Loading Team Directory...</h3>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Team Management</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            View and manage roles of registered corporation workspace users.
          </p>
        </div>
      </div>

      <div className="glass-card">
        <h3 className="section-title">
          <Users size={20} className="brand-icon" />
          Workspace Directory ({users.length} Users)
        </h3>

        <div className="team-table-container">
          <table className="team-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email Address</th>
                <th>Joined Date</th>
                <th>Current Role</th>
                <th>Manage Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((userItem) => {
                const isSelf = userItem._id === currentUser.id;

                return (
                  <tr key={userItem._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div className="user-avatar" style={{ width: '32px', height: '32px', fontSize: '0.8rem' }}>
                          {userItem.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                        </div>
                        <span style={{ fontWeight: 600 }}>
                          {userItem.name} {isSelf && <span style={{ color: 'var(--color-text-dim)', fontSize: '0.8rem', fontWeight: 'normal' }}>(You)</span>}
                        </span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--color-text-muted)' }}>{userItem.email}</td>
                    <td>{formatDate(userItem.createdAt)}</td>
                    <td>
                      <span 
                        className="badge"
                        style={{
                          background: userItem.role === 'Admin' ? 'var(--color-priority-high-bg)' : 'var(--color-priority-low-bg)',
                          color: userItem.role === 'Admin' ? 'var(--color-priority-high)' : 'var(--color-priority-low)',
                        }}
                      >
                        {userItem.role}
                      </span>
                    </td>
                    <td>
                      {isSelf ? (
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)' }}>Managed globally</span>
                      ) : (
                        <select
                          className="form-input"
                          style={{ padding: '0.25rem 0.5rem', width: '130px', fontSize: '0.85rem', height: 'auto', background: 'rgba(255,255,255,0.03)' }}
                          value={userItem.role}
                          onChange={(e) => handleRoleChange(userItem._id, e.target.value)}
                        >
                          <option value="Member">Member</option>
                          <option value="Admin">Admin</option>
                        </select>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Team;
