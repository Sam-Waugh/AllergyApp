import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import TopBar from '../common/TopBar';
import BottomNavigation from '../common/BottomNavigation';
import Avatar from '../common/Avatar';

const HomeScreen = () => {
  const [selectedChild, setSelectedChild] = useState('Elsie');

  const children = [
    { name: 'Elsie', selected: true },
    { name: 'Otis', selected: false },
    { name: 'Leo', selected: false }
  ];

  const topBarActions = [
    { icon: '🤖', label: 'AI Assistant', onClick: () => {} },
    { icon: '⚙️', label: 'Settings', onClick: () => {} }
  ];

  return (
    <div className="mobile-container">
      <div className="screen">
        <TopBar title="Home" actions={topBarActions} />
        
        <main className="screen-content">
          <Avatar 
            name="Good Morning, Sam"
            subtitle="Welcome back!"
            imageUrl="https://codia-f2c.s3.us-west-1.amazonaws.com/image/2025-07-21/YVSdXWTiKv.png"
          />

          <section style={{ padding: '0px 12px' }}>
            <div style={{ marginBottom: '4px' }}>
              <h2 className="form-label">Select Child</h2>
            </div>
            
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              {children.map((child) => (
                <button
                  key={child.name}
                  className={`chip ${child.selected ? 'chip-selected' : 'chip-unselected'}`}
                  onClick={() => setSelectedChild(child.name)}
                  style={{ width: '64px', height: '36px' }}
                >
                  {child.name}
                </button>
              ))}
            </div>
            
            <p className="form-info">Choose the child to view their symptoms</p>
          </section>

          <section style={{ padding: '0px 12px', marginTop: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Link to="/symptom-log" className="btn btn-secondary">
                View History
              </Link>
              <Link to="/symptom-log" className="btn btn-primary">
                + Log Symptoms & Photos
              </Link>
            </div>
          </section>

          <section style={{ padding: '0px 8px', marginTop: '16px' }}>
            <div className="section-header" style={{ padding: '0px 4px' }}>
              <div>
                <h2 className="section-title">Recent Log Preview</h2>
                <p className="section-subtitle">Severity Summary</p>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '8px', padding: '8px 4px' }}>
              <div className="metric-card" style={{ flex: 1 }}>
                <div className="metric-title">Mild Symptoms</div>
                <div className="metric-value">3</div>
              </div>
              <div className="metric-card" style={{ flex: 1 }}>
                <div className="metric-title">Moderate Symptoms</div>
                <div className="metric-value">1</div>
              </div>
              <div className="metric-card" style={{ flex: 1 }}>
                <div className="metric-title">Severe Symptoms</div>
                <div className="metric-value">0</div>
              </div>
            </div>
          </section>
        </main>

        <BottomNavigation />
      </div>
    </div>
  );
};

export default HomeScreen;
