import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const BottomNavigation = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: '🏠', label: 'Home' },
    { path: '/symptom-log', icon: '📓', label: 'Symptom Log' },
    { path: '/pollen-forecast', icon: '🗺️', label: 'Pollen Forecast' },
    { path: '/doctor-report', icon: '📊', label: 'Generate Report' },
    { path: '/patient-profile', icon: '👤', label: 'Patient Profile' }
  ];

  return (
    <nav className="bottom-nav" role="navigation" aria-label="Main navigation">
      {navItems.map((item) => (
        <Link 
          key={item.path}
          to={item.path} 
          className={`nav-tab ${location.pathname === item.path ? 'active' : ''}`}
        >
          <div className="nav-tab-icon">{item.icon}</div>
          <span className="nav-tab-label">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
};

export default BottomNavigation;
