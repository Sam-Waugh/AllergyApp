import React, { useState } from 'react';
import TopBar from '../common/TopBar';
import BottomNavigation from '../common/BottomNavigation';
import Avatar from '../common/Avatar';

const DoctorReportScreen = () => {
  const [doctorNotes, setDoctorNotes] = useState('');

  const topBarActions = [
    { icon: '📝', label: 'Edit', onClick: () => {} }
  ];

  const confirmedAllergies = [
    { name: 'Milk', icon: '🥛', test: '10mm SPT' },
    { name: 'Egg', icon: '🍳', test: '5mm SPT' },
    { name: 'Lentils', icon: '🐶', test: '9mm SPT', imageUrl: 'https://codia-f2c.s3.us-west-1.amazonaws.com/image/2025-07-21/W2UfPjMmjA.png' }
  ];

  const suspectedAllergies = [
    { name: 'Peas', icon: '🌿', imageUrl: 'https://codia-f2c.s3.us-west-1.amazonaws.com/image/2025-07-21/QDOE1nQq5G.png' },
    { name: 'Almond', icon: '🍔', imageUrl: 'https://codia-f2c.s3.us-west-1.amazonaws.com/image/2025-07-21/A0AHjwJagv.png' },
    { name: 'Hazelnut', icon: '🌰' }
  ];

  const medications = [
    { type: 'Adrenaline', name: 'Jext Junior', dosage: '150mg' },
    { type: 'Antihistamine', name: 'Cetirizine', dosage: '2mg' },
    { type: 'Preventer Inhaler', name: 'Beclometasone', dosage: '' },
    { type: 'Reliever Inhaler', name: 'Salbutomol', dosage: '' }
  ];

  const incidents = [
    { date: '15/09/2023', title: 'Incident on 15/09/2023', subtitle: 'Reaction to Milk', icon: '🚑' },
    { date: '01/10/2023', title: 'Doctor Visit on 01/10/2023', subtitle: 'Follow-up reactions', icon: '🧑‍⚕️' }
  ];

  return (
    <div className="mobile-container">
      <div className="screen">
        <TopBar title="Doctor Report" showBack={true} actions={topBarActions} />
        
        <main className="screen-content">
          <Avatar 
            name="Patient Name: Elsie King"
            subtitle="DOB: 04/05/2020"
            imageUrl="https://codia-f2c.s3.us-west-1.amazonaws.com/image/2025-07-21/pEs6dDDWaL.png"
          />

          <section style={{ padding: '0px 12px', marginTop: '16px' }}>
            <div className="form-group">
              <label className="form-label">Date Range</label>
              <input 
                type="text" 
                className="form-input" 
                value="01/01/2023 - 20/06/2025"
                readOnly
              />
              <p className="form-info">Select the range of dates for the report</p>
            </div>
          </section>

          <section style={{ padding: '0px 12px', marginTop: '16px' }}>
            <div className="section-header">
              <h2 className="section-title">Family History Overview</h2>
            </div>
            
            <div className="list-item">
              <div className="list-item-icon">👪</div>
              <div className="list-item-content">
                <h3 className="list-item-title">Allergies in Family</h3>
                <p className="list-item-subtitle">Father has asthma and eczema</p>
                <p className="list-item-subtitle">Mother has hayfever</p>
              </div>
            </div>
            
            <div className="list-item">
              <div className="list-item-icon">🦴</div>
              <div className="list-item-content">
                <h3 className="list-item-title">Genetic Conditions</h3>
                <p className="list-item-subtitle">No known conditions</p>
              </div>
            </div>
          </section>

          <section style={{ padding: '0px 12px', marginTop: '16px' }}>
            <div className="section-header">
              <h2 className="section-title">Confirmed Allergies</h2>
            </div>
            
            {confirmedAllergies.map((allergy, index) => (
              <div key={index} className="list-item">
                <div className="list-item-icon">
                  {allergy.imageUrl ? (
                    <img 
                      src={allergy.imageUrl} 
                      alt={allergy.name}
                      style={{ width: '32px', height: '32px', objectFit: 'cover' }}
                    />
                  ) : (
                    allergy.icon
                  )}
                </div>
                <div className="list-item-content">
                  <h3 className="list-item-title">{allergy.name}</h3>
                </div>
                <div className="list-item-meta">{allergy.test}</div>
              </div>
            ))}
          </section>

          <section style={{ padding: '0px 12px', marginTop: '16px' }}>
            <div className="section-header">
              <h2 className="section-title">Suspected Allergies</h2>
            </div>
            
            {suspectedAllergies.map((allergy, index) => (
              <div key={index} className="list-item">
                <div className="list-item-icon">
                  {allergy.imageUrl ? (
                    <img 
                      src={allergy.imageUrl} 
                      alt={allergy.name}
                      style={{ width: '32px', height: '32px', objectFit: 'cover' }}
                    />
                  ) : (
                    allergy.icon
                  )}
                </div>
                <div className="list-item-content">
                  <h3 className="list-item-title">{allergy.name}</h3>
                </div>
              </div>
            ))}
          </section>

          <section style={{ padding: '0px 12px', marginTop: '16px' }}>
            <div className="section-header">
              <h2 className="section-title">Medications</h2>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px' }}>
              {medications.map((med, index) => (
                <div key={index} className="metric-card">
                  <div style={{ 
                    fontFamily: 'Roboto',
                    fontSize: '14px',
                    lineHeight: '28px',
                    color: '#000000',
                    marginBottom: '4px'
                  }}>
                    {med.type}
                  </div>
                  <div className="metric-title">{med.name}</div>
                  {med.dosage && <div className="metric-value">{med.dosage}</div>}
                </div>
              ))}
            </div>
          </section>

          <section style={{ padding: '0px 12px', marginTop: '16px' }}>
            <div className="section-header">
              <h2 className="section-title">Allergy Incident Log</h2>
            </div>
            
            {incidents.map((incident, index) => (
              <div key={index} className="list-item">
                <div className="list-item-icon">{incident.icon}</div>
                <div className="list-item-content">
                  <h3 className="list-item-title">{incident.title}</h3>
                  <p className="list-item-subtitle">{incident.subtitle}</p>
                </div>
              </div>
            ))}
          </section>

          <section style={{ padding: '0px 12px', marginTop: '16px' }}>
            <div className="image-container" style={{ height: '120px' }}>
              <div className="image-placeholder-text">Tagged Photo Evidence</div>
              <div className="image-pagination">
                <div className="pagination-dot active"></div>
                <div className="pagination-dot"></div>
                <div className="pagination-dot"></div>
                <div className="pagination-dot"></div>
              </div>
            </div>
          </section>

          <section style={{ padding: '0px 12px', marginTop: '16px' }}>
            <div className="card">
              <h3 style={{ 
                fontFamily: 'Roboto', 
                fontWeight: '500', 
                fontSize: '16px', 
                lineHeight: '22px',
                marginBottom: '4px'
              }}>
                Frequent Symptoms
              </h3>
              <p style={{ 
                fontFamily: 'Roboto', 
                fontSize: '12px', 
                lineHeight: '16px',
                color: 'rgba(0, 0, 0, 0.5)',
                marginBottom: '16px'
              }}>
                Frequency
              </p>
              
              <div style={{ height: '160px', position: 'relative', marginBottom: '16px' }}>
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
                  top: '40px',
                  left: '0px',
                  right: '0px',
                  height: '1px',
                  background: 'rgba(0, 0, 0, 0.1)',
                  borderStyle: 'dashed'
                }} />
                <div style={{ 
                  position: 'absolute',
                  top: '80px',
                  left: '0px',
                  right: '0px',
                  height: '1px',
                  background: 'rgba(0, 0, 0, 0.1)',
                  borderStyle: 'dashed'
                }} />
                <div style={{ 
                  position: 'absolute',
                  top: '120px',
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
                  height: '131px',
                  background: 'rgba(0, 0, 0, 0.5)'
                }} />
                <div style={{ 
                  position: 'absolute',
                  bottom: '0px',
                  left: '57.57px',
                  width: '26px',
                  height: '94px',
                  background: 'rgba(0, 0, 0, 0.5)'
                }} />
                <div style={{ 
                  position: 'absolute',
                  bottom: '0px',
                  left: '100.29px',
                  width: '26px',
                  height: '64px',
                  background: 'rgba(0, 0, 0, 0.5)'
                }} />
                <div style={{ 
                  position: 'absolute',
                  bottom: '0px',
                  left: '143px',
                  width: '26px',
                  height: '98px',
                  background: 'rgba(0, 0, 0, 0.5)'
                }} />
                <div style={{ 
                  position: 'absolute',
                  bottom: '0px',
                  left: '185.71px',
                  width: '26px',
                  height: '76px',
                  background: 'rgba(0, 0, 0, 0.5)'
                }} />
                <div style={{ 
                  position: 'absolute',
                  bottom: '0px',
                  left: '228.43px',
                  width: '26px',
                  height: '117px',
                  background: 'rgba(0, 0, 0, 0.5)'
                }} />
                <div style={{ 
                  position: 'absolute',
                  bottom: '0px',
                  left: '271.14px',
                  width: '26px',
                  height: '87px',
                  background: 'rgba(0, 0, 0, 0.5)'
                }} />
              </div>
              
              <p style={{ 
                fontFamily: 'Roboto', 
                fontSize: '12px', 
                lineHeight: '16px',
                color: 'rgba(0, 0, 0, 0.5)',
                textAlign: 'right'
              }}>
                Symptoms
              </p>
            </div>
          </section>

          <section style={{ padding: '0px 12px', marginTop: '16px' }}>
            <div className="form-group">
              <label className="form-label">Doctor Notes</label>
              <textarea 
                className="form-input" 
                placeholder="Enter any notes or observations..."
                value={doctorNotes}
                onChange={(e) => setDoctorNotes(e.target.value)}
                rows="3"
                style={{ resize: 'vertical', minHeight: '36px' }}
              />
              <p className="form-info">This will be included in the report</p>
            </div>
          </section>

          <section style={{ padding: '0px 12px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button className="btn btn-secondary">
                Save as PDF
              </button>
              <button className="btn btn-secondary">
                Share with Doctor
              </button>
              <button className="btn btn-primary">
                Generate Report
              </button>
            </div>
          </section>
        </main>

        <BottomNavigation />
      </div>
    </div>
  );
};

export default DoctorReportScreen;
