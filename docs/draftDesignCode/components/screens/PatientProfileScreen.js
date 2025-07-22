import React, { useState } from 'react';
import TopBar from '../common/TopBar';
import BottomNavigation from '../common/BottomNavigation';
import Avatar from '../common/Avatar';

const PatientProfileScreen = () => {
  const [familyHistory, setFamilyHistory] = useState('');
  const [medicalHistory, setMedicalHistory] = useState('');

  const topBarActions = [
    { icon: '📝', label: 'Edit', onClick: () => {} },
    { icon: '🔍', label: 'Search', onClick: () => {} }
  ];

  const previousIncidents = [
    {
      title: 'Yoghurt Reaction',
      trigger: 'Milk',
      reaction: 'Full body hives to teaspoon of yoghurt',
      date: '01/07/2020',
      icon: '⚠️'
    },
    {
      title: 'Quorn Anaphylaxis',
      trigger: 'Egg',
      reaction: 'Tongue swelling, vomiting, full body flushed red, loss of consciousness, hives',
      date: '16/02/2021',
      icon: '⚠️'
    }
  ];

  const currentMedications = [
    { name: 'Cetirizine', dosage: '10mg', icon: '💊' },
    { name: 'QV Cream', usage: 'Daily', icon: '💧' },
    { name: 'Mometasone', dosage: 'As needed', icon: '💧' },
    { name: 'Jext Pens', usage: 'Emergency', icon: '🖊️' }
  ];

  const allergyTriggers = [
    { name: 'Milk', icon: '🥜', imageUrl: 'https://codia-f2c.s3.us-west-1.amazonaws.com/image/2025-07-21/OLfsns9yJA.png' },
    { name: 'Eggs', icon: '🌾', imageUrl: 'https://codia-f2c.s3.us-west-1.amazonaws.com/image/2025-07-21/P1YR5Qi6dG.png' },
    { name: 'Lentils', icon: '🐶', imageUrl: 'https://codia-f2c.s3.us-west-1.amazonaws.com/image/2025-07-21/5HRQkCjkOB.png' }
  ];

  return (
    <div className="mobile-container">
      <div className="screen">
        <TopBar title="Patient Profile" showBack={true} actions={topBarActions} />
        
        <main className="screen-content">
          <Avatar 
            name="Elsie King"
            subtitle="DOB: 04/05/2020"
            imageUrl="https://codia-f2c.s3.us-west-1.amazonaws.com/image/2025-07-21/4ULt5VAkpZ.png"
          />

          <section style={{ padding: '0px 12px', marginTop: '16px' }}>
            <div className="form-group">
              <label className="form-label">Family History</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Parents' allergies, asthma, eczema"
                value={familyHistory}
                onChange={(e) => setFamilyHistory(e.target.value)}
              />
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <p className="form-info" style={{ flex: 1 }}>
                  Please list any family health conditions related to allergies.
                </p>
                <img 
                  src="https://codia-f2c.s3.us-west-1.amazonaws.com/image/2025-07-21/dZHidZ1O3D.svg" 
                  alt="Info" 
                  style={{ width: '20px', height: '20px', opacity: 0.65 }}
                />
              </div>
            </div>
          </section>

          <section style={{ padding: '0px 12px', marginTop: '16px' }}>
            <div className="form-group">
              <label className="form-label">Medical History</label>
              <textarea 
                className="form-input" 
                placeholder="Vaginal birth, admitted to NICU with suspected sepsis, early onset eczema"
                value={medicalHistory}
                onChange={(e) => setMedicalHistory(e.target.value)}
                rows="4"
                style={{ resize: 'vertical', minHeight: '72px' }}
              />
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <p className="form-info" style={{ flex: 1 }}>
                  Include any relevant medical history.
                </p>
                <img 
                  src="https://codia-f2c.s3.us-west-1.amazonaws.com/image/2025-07-21/7iwhPtMbQ8.svg" 
                  alt="Info" 
                  style={{ width: '20px', height: '20px', opacity: 0.65 }}
                />
              </div>
            </div>
          </section>

          <section style={{ padding: '0px 12px', marginTop: '16px' }}>
            <div className="section-header">
              <div>
                <h2 className="section-title">Previous Allergy Incidents</h2>
                <p className="section-subtitle">Track previous incidents</p>
              </div>
            </div>
            
            {previousIncidents.map((incident, index) => (
              <div key={index} className="list-item" style={{ alignItems: 'flex-start', padding: '12px 0px' }}>
                <div className="list-item-icon">{incident.icon}</div>
                <div style={{ flex: 1, display: 'flex', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <h3 className="list-item-title">{incident.title}</h3>
                    <p className="list-item-subtitle">Trigger: {incident.trigger}</p>
                    <p className="list-item-subtitle">Reaction: {incident.reaction}</p>
                  </div>
                  <div style={{ 
                    fontSize: '14px', 
                    fontWeight: '500', 
                    color: '#000000',
                    textAlign: 'right',
                    minWidth: '90px'
                  }}>
                    Date: {incident.date}
                  </div>
                </div>
              </div>
            ))}
          </section>

          <section style={{ padding: '0px 12px', marginTop: '16px' }}>
            <div className="section-header">
              <h2 className="section-title">Current Medications</h2>
            </div>
            
            {currentMedications.map((medication, index) => (
              <div key={index} className="list-item">
                <div className="list-item-icon">{medication.icon}</div>
                <div className="list-item-content">
                  <h3 className="list-item-title">{medication.name}</h3>
                </div>
                <div className="list-item-meta">
                  {medication.dosage ? `Dosage: ${medication.dosage}` : `Usage: ${medication.usage}`}
                </div>
              </div>
            ))}
          </section>

          <section style={{ padding: '0px 12px', marginTop: '16px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-secondary" style={{ flex: 1 }}>
                Cancel
              </button>
              <button className="btn btn-primary" style={{ flex: 1 }}>
                Save Changes
              </button>
            </div>
          </section>

          <section style={{ padding: '0px 12px', marginTop: '16px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div className="card" style={{ 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                gap: '4px',
                padding: '4px'
              }}>
                <div style={{ 
                  width: '48px', 
                  height: '48px', 
                  borderRadius: '24px',
                  background: 'rgba(0, 0, 0, 0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '30px'
                }}>
                  📊
                </div>
                <span style={{ 
                  fontFamily: 'Roboto',
                  fontSize: '10px',
                  lineHeight: '14px',
                  textAlign: 'center',
                  color: '#000000'
                }}>
                  Generate Report
                </span>
              </div>
              <div className="card" style={{ 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                gap: '4px',
                padding: '4px'
              }}>
                <div style={{ 
                  width: '48px', 
                  height: '48px', 
                  borderRadius: '24px',
                  background: 'rgba(0, 0, 0, 0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '30px'
                }}>
                  ⚕️
                </div>
                <span style={{ 
                  fontFamily: 'Roboto',
                  fontSize: '10px',
                  lineHeight: '14px',
                  textAlign: 'center',
                  color: '#000000'
                }}>
                  Doctor's Appointments
                </span>
              </div>
            </div>
          </section>

          <section style={{ padding: '0px 12px', marginTop: '16px' }}>
            <div className="section-header">
              <h2 className="section-title">Allergy Triggers</h2>
            </div>
            
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              {allergyTriggers.map((trigger, index) => (
                <div
                  key={index}
                  className="chip chip-unselected"
                  style={{ 
                    width: '110px', 
                    height: '56px',
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                    borderRadius: '6px',
                    padding: '12px'
                  }}
                >
                  <div className="chip-icon">
                    <img 
                      src={trigger.imageUrl} 
                      alt={trigger.name}
                      style={{ width: '32px', height: '32px', objectFit: 'cover' }}
                    />
                  </div>
                  <span>{trigger.name}</span>
                </div>
              ))}
            </div>
          </section>
        </main>

        <BottomNavigation />
      </div>
    </div>
  );
};

export default PatientProfileScreen;
