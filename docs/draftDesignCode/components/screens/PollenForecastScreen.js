import React, { useState } from 'react';
import TopBar from '../common/TopBar';
import BottomNavigation from '../common/BottomNavigation';

const PollenForecastScreen = () => {
  const [selectedFilters, setSelectedFilters] = useState(['trees', 'grass', 'weeds']);

  const topBarActions = [
    { icon: '🌳', label: 'Trees', onClick: () => {} },
    { icon: '🌾', label: 'Grass', onClick: () => {} },
    { icon: '🌼', label: 'Weeds', onClick: () => {} }
  ];

  const pollenTypes = [
    { key: 'trees', icon: '🌳', label: 'Trees' },
    { key: 'grass', icon: '🌾', label: 'Grass' },
    { key: 'weeds', icon: '🌼', label: 'Weeds' }
  ];

  const toggleFilter = (filterKey) => {
    setSelectedFilters(prev => 
      prev.includes(filterKey) 
        ? prev.filter(f => f !== filterKey)
        : [...prev, filterKey]
    );
  };

  return (
    <div className="mobile-container">
      <div className="screen">
        <TopBar title="Pollen Forecast" actions={topBarActions} />
        
        <main className="screen-content">
          <section style={{ padding: '0px 12px', marginTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <img 
                src="https://codia-f2c.s3.us-west-1.amazonaws.com/image/2025-07-21/ZcZYOaQgOY.svg" 
                alt="Location" 
                style={{ width: '24px', height: '24px' }}
              />
              <h2 className="section-title">Location: Belfast, Co. Antrim</h2>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <h2 className="section-title">Filter Pollen Types</h2>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              {pollenTypes.map((type) => (
                <button
                  key={type.key}
                  className={`chip ${selectedFilters.includes(type.key) ? 'chip-selected' : 'chip-unselected'}`}
                  onClick={() => toggleFilter(type.key)}
                  style={{ 
                    width: '110px', 
                    height: '56px',
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                    borderRadius: '6px',
                    padding: '12px 8px'
                  }}
                >
                  <div className="chip-icon">
                    {type.icon}
                  </div>
                  <span>{type.label}</span>
                </button>
              ))}
            </div>
          </section>

          <section style={{ padding: '0px 12px', marginBottom: '16px' }}>
            <div className="image-container" style={{ height: '304px', position: 'relative' }}>
              <img 
                src="https://codia-f2c.s3.us-west-1.amazonaws.com/image/2025-07-21/sGRCZcpkvX.png" 
                alt="Pollen forecast map"
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover',
                  borderRadius: '6px'
                }}
              />
              <img 
                src="https://codia-f2c.s3.us-west-1.amazonaws.com/image/2025-07-21/bg6HyNNc6p.svg" 
                alt="Location marker" 
                style={{ 
                  position: 'absolute',
                  width: '24px', 
                  height: '24px',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)'
                }}
              />
              <p className="image-placeholder-text" style={{ 
                position: 'absolute',
                bottom: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                color: '#000000',
                fontSize: '16px',
                fontWeight: '500'
              }}>
                Interactive heatmap of pollen levels in your area
              </p>
            </div>
          </section>

          <section style={{ padding: '0px 12px', marginBottom: '16px' }}>
            <div className="section-header">
              <h2 className="section-title">Today's Pollen Breakdown</h2>
            </div>
            
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <div className="metric-card" style={{ flex: 1 }}>
                <div className="metric-title">Tree Pollen</div>
                <div className="metric-value">Low</div>
              </div>
              <div className="metric-card" style={{ flex: 1 }}>
                <div className="metric-title">Grass Pollen</div>
                <div className="metric-value">Moderate</div>
              </div>
              <div className="metric-card" style={{ flex: 1 }}>
                <div className="metric-title">Weed Pollen</div>
                <div className="metric-value">Low</div>
              </div>
            </div>
          </section>

          <section style={{ padding: '0px 12px', marginBottom: '16px' }}>
            <div className="card" style={{ padding: '12px' }}>
              <h3 style={{ 
                fontFamily: 'Roboto', 
                fontWeight: '500', 
                fontSize: '16px', 
                lineHeight: '22px',
                marginBottom: '4px'
              }}>
                5-Day Pollen Risk Forecast
              </h3>
              <p style={{ 
                fontFamily: 'Roboto', 
                fontSize: '12px', 
                lineHeight: '16px',
                color: 'rgba(0, 0, 0, 0.5)',
                marginBottom: '16px'
              }}>
                Pollen Risk Level
              </p>
              
              <div style={{ height: '143px', position: 'relative' }}>
                {/* Chart grid lines */}
                <div style={{ 
                  position: 'absolute',
                  top: '0px',
                  left: '0px',
                  right: '0px',
                  height: '1px',
                  background: 'rgba(0, 0, 0, 0.1)',
                  borderStyle: 'dashed'
                }} />
                <div style={{ 
                  position: 'absolute',
                  top: '35.75px',
                  left: '0px',
                  right: '0px',
                  height: '1px',
                  background: 'rgba(0, 0, 0, 0.1)',
                  borderStyle: 'dashed'
                }} />
                <div style={{ 
                  position: 'absolute',
                  top: '71.5px',
                  left: '0px',
                  right: '0px',
                  height: '1px',
                  background: 'rgba(0, 0, 0, 0.1)',
                  borderStyle: 'dashed'
                }} />
                <div style={{ 
                  position: 'absolute',
                  top: '107.25px',
                  left: '0px',
                  right: '0px',
                  height: '1px',
                  background: 'rgba(0, 0, 0, 0.1)',
                  borderStyle: 'dashed'
                }} />
                <div style={{ 
                  position: 'absolute',
                  bottom: '0px',
                  left: '0px',
                  right: '0px',
                  height: '1px',
                  background: 'rgba(0, 0, 0, 0.1)'
                }} />
                
                {/* Chart bars */}
                <div style={{ 
                  position: 'absolute',
                  bottom: '0px',
                  left: '14.86px',
                  width: '26px',
                  height: '114px',
                  background: 'rgba(0, 0, 0, 0.5)'
                }} />
                <div style={{ 
                  position: 'absolute',
                  bottom: '0px',
                  left: '57.57px',
                  width: '26px',
                  height: '77px',
                  background: 'rgba(0, 0, 0, 0.5)'
                }} />
                <div style={{ 
                  position: 'absolute',
                  bottom: '0px',
                  left: '100.29px',
                  width: '26px',
                  height: '47px',
                  background: 'rgba(0, 0, 0, 0.5)'
                }} />
                <div style={{ 
                  position: 'absolute',
                  bottom: '0px',
                  left: '143px',
                  width: '26px',
                  height: '81px',
                  background: 'rgba(0, 0, 0, 0.5)'
                }} />
                <div style={{ 
                  position: 'absolute',
                  bottom: '0px',
                  left: '185.71px',
                  width: '26px',
                  height: '59px',
                  background: 'rgba(0, 0, 0, 0.5)'
                }} />
                <div style={{ 
                  position: 'absolute',
                  bottom: '0px',
                  left: '228.43px',
                  width: '26px',
                  height: '100px',
                  background: 'rgba(0, 0, 0, 0.5)'
                }} />
                <div style={{ 
                  position: 'absolute',
                  bottom: '0px',
                  left: '271.14px',
                  width: '26px',
                  height: '70px',
                  background: 'rgba(0, 0, 0, 0.5)'
                }} />
              </div>
            </div>
          </section>
        </main>

        <BottomNavigation />
      </div>
    </div>
  );
};

export default PollenForecastScreen;
