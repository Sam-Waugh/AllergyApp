import React from 'react';
import { useNavigate } from 'react-router-dom';

const TopBar = ({ title, showBack = false, actions = [] }) => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <header className="top-bar">
      <div className="status-bar">
        <img 
          src="https://codia-f2c.s3.us-west-1.amazonaws.com/image/2025-07-21/e2EGaHbr6q.svg" 
          alt="Status bar" 
          style={{ width: '100%', height: '24px' }}
        />
      </div>
      <div className="top-bar-content">
        {showBack && (
          <button 
            className="top-bar-back" 
            onClick={handleBack}
            aria-label="Go back"
          >
            <img 
              src="https://codia-f2c.s3.us-west-1.amazonaws.com/image/2025-07-21/bTh90itOS0.svg" 
              alt="Back" 
              style={{ width: '24px', height: '24px' }}
            />
          </button>
        )}
        <h1 className="top-bar-title">{title}</h1>
        <div className="top-bar-actions">
          {actions.map((action, index) => (
            <button 
              key={index}
              className="top-bar-icon"
              onClick={action.onClick}
              aria-label={action.label}
            >
              {action.icon}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};

export default TopBar;
