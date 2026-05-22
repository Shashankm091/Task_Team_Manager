import React, { useContext, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Briefcase, 
  CheckSquare, 
  Users, 
  LogOut,
  FolderLock,
  Menu,
  X
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useContext(AuthContext);
  const [isOpen, setIsOpen] = useState(false);

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
    <>
      {/* Floating Hamburger Toggle for Mobile */}
      <button 
        className="mobile-toggle" 
        onClick={() => setIsOpen(!isOpen)} 
        aria-label="Toggle Sidebar"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Background Overlay when Sidebar is open on Mobile */}
      <div 
        className={`sidebar-overlay ${isOpen ? 'open' : ''}`} 
        onClick={() => setIsOpen(false)}
      ></div>

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        {/* Close button for Mobile/Tablet */}
        <button 
          className="sidebar-close-btn" 
          onClick={() => setIsOpen(false)}
          aria-label="Close Sidebar"
        >
          <X size={20} />
        </button>

        <div className="sidebar-brand">
          <FolderLock className="brand-icon" size={28} />
          <h2>TaskFlow</h2>
        </div>

        <nav className="sidebar-menu">
          <NavLink 
            to="/dashboard" 
            className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
            onClick={() => setIsOpen(false)}
          >
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink 
            to="/projects" 
            className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
            onClick={() => setIsOpen(false)}
          >
            <Briefcase size={20} />
            <span>Projects</span>
          </NavLink>

          <NavLink 
            to="/tasks" 
            className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
            onClick={() => setIsOpen(false)}
          >
            <CheckSquare size={20} />
            <span>Tasks</span>
          </NavLink>

          {user.role === 'Admin' && (
            <NavLink 
              to="/team" 
              className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
              onClick={() => setIsOpen(false)}
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
    </>
  );
};

export default Sidebar;
