import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Briefcase, 
  CheckSquare, 
  Users, 
  LogOut,
  FolderLock
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useContext(AuthContext);

  if (!user) return null;

  // Custom function to return user initials
  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <FolderLock className="brand-icon" size={28} />
        <h2>TaskFlow</h2>
      </div>

      <nav className="sidebar-menu">
        <NavLink 
          to="/dashboard" 
          className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
        >
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </NavLink>

        <NavLink 
          to="/projects" 
          className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
        >
          <Briefcase size={20} />
          <span>Projects</span>
        </NavLink>

        <NavLink 
          to="/tasks" 
          className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
        >
          <CheckSquare size={20} />
          <span>Tasks</span>
        </NavLink>

        {user.role === 'Admin' && (
          <NavLink 
            to="/team" 
            className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
          >
            <Users size={20} />
            <span>Team Management</span>
          </NavLink>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="user-profile">
          <div className="user-avatar">{getInitials(user.name)}</div>
          <div className="user-info">
            <h4 className="user-name">{user.name}</h4>
            <span className="user-role-badge">{user.role}</span>
          </div>
        </div>
        <button className="btn-logout" onClick={logout} title="Log Out">
          <LogOut size={20} />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
