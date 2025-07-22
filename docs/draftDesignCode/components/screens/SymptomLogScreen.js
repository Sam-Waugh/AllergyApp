import React, { useState } from 'react';
import TopBar from '../common/TopBar';
import BottomNavigation from '../common/BottomNavigation';
import Avatar from '../common/Avatar';
import Calendar from '../common/Calendar';
import Slider from '../common/Slider';

const SymptomLogScreen = () => {
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [symptoms, setSymptoms] = useState({
    swelling: 0,
    hoarseVoice: 0,
    cough: 0,
    wheezing: 0,
    rapidBreathing: 0,
    dizziness: 0,
    lossOfConsciousness: 0,
    eczema: 0,
    rashes: 0,
    hives: 0,
    skinSwelling: 0,
    reflux: 0,
    vomiting: 0,
    diarrhea: 0,
    poorWeightGain: 0,
    irritability: 0
  });

  const topBarActions = [
    { icon: '🗓️', label: 'Calendar', onClick: () => setShowCalendar(!showCalendar) },
    { icon: '💾', label: 'Save', onClick: () => {} }
  ];

  const handleSymptomChange = (symptom, value) => {
    setSymptoms(prev => ({
      ...prev,
      [symptom]: value
    }));
  };

  const symptomCategories = [
    {
      title: 'Airway Symptoms',
      symptoms: [
        { key: 'swelling', label: 'Swelling', icon: '🌬️' },
        { key: 'hoarseVoice', label: 'Hoarse Voice', icon: '🔊' },
        { key: 'cough', label: 'Cough', icon: '🤧' }
      ]
    },
    {
      title: 'Breathing Symptoms',
      symptoms: [
        { key: 'wheezing', label: 'Wheezing', icon: '😮‍💨' },
        { key: 'rapidBreathing', label: 'Rapid Breathing', icon: '🏃‍♂️' }
      ]
    },
    {
      title: 'Circulation Symptoms',
      symptoms: [
        { key: 'dizziness', label: 'Dizziness', icon: '😵' },
        { key: 'lossOfConsciousness', label: 'Loss of Consciousness', icon: '😵‍💫' }
      ]
    },
    {
      title: 'Skin Symptoms',
      symptoms: [
        { key: 'eczema', label: 'Eczema', icon: '🩹' },
        { key: 'rashes', label: 'Rashes', icon: '🌟' },
        { key: 'hives', label: 'Hives', icon: '🌼' },
        { key: 'skinSwelling', label: 'Swelling', icon: '🤲' }
      ]
    },
    {
      title: 'Digestive Symptoms',
      symptoms: [
        { key: 'reflux', label: 'Reflux', icon: '🤢' },
        { key: 'vomiting', label: 'Vomiting', icon: '🤮' },
        { key: 'diarrhea', label: 'Diarrhea', icon: '🚽' }
      ]
    },
    {
      title: 'Other Symptoms',
      symptoms: [
        { key: 'poorWeightGain', label: 'Poor Weight Gain', icon: '⚖️' },
        { key: 'irritability', label: 'Irritability', icon: '😠' }
      ]
    }
  ];

  return (
    <div className="mobile-container">
      <div className="screen">
        <TopBar title="Symptom Log" showBack={true} actions={topBarActions} />
        
        <main className="screen-content">
          <Avatar 
            name="Elsie"
            subtitle="22 June 2025"
            imageUrl="https://codia-f2c.s3.us-west-1.amazonaws.com/image/2025-07-21/RMOkho0diU.png"
          />

          <section style={{ padding: '0px 12px', marginTop: '16px' }}>
            <div className="form-group">
              <label className="form-label">Select Date</label>
              <button 
                className="form-input" 
                onClick={() => setShowCalendar(!showCalendar)}
                style={{ textAlign: 'left', cursor: 'pointer', border: 'none', background: 'white' }}
              >
                Pick a date
              </button>
            </div>
          </section>

          {showCalendar && (
            <section style={{ padding: '0px 12px', marginBottom: '16px' }}>
              <Calendar 
                selectedDate={selectedDate}
                onDateSelect={(date) => {
                  setSelectedDate(date);
                  setShowCalendar(false);
                }}
              />
            </section>
          )}

          {symptomCategories.map((category, categoryIndex) => (
            <section key={categoryIndex} style={{ padding: '0px 12px', marginBottom: '16px' }}>
              <div className="section-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
                  <h2 className="section-title">{category.title}</h2>
                  <button style={{ marginLeft: 'auto', background: 'none', border: 'none' }}>
                    <img 
                      src="https://codia-f2c.s3.us-west-1.amazonaws.com/image/2025-07-21/cJAQRjbxk2.svg" 
                      alt="Expand" 
                      style={{ width: '33px', height: '33px' }}
                    />
                  </button>
                </div>
              </div>
              
              {category.symptoms.map((symptom, symptomIndex) => (
                <div key={symptomIndex} className="list-item" style={{ alignItems: 'flex-start', padding: '12px 0px' }}>
                  <div className="list-item-icon">
                    {symptom.icon}
                  </div>
                  <div style={{ flex: 1, position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '64px', top: '0px', right: '0px' }}>
                      <Slider
                        label={symptom.label}
                        value={symptoms[symptom.key]}
                        onChange={(value) => handleSymptomChange(symptom.key, value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </section>
          ))}

          <section style={{ padding: '0px 12px', marginBottom: '16px' }}>
            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea 
                className="form-input" 
                placeholder="Add any specific notes for today's log..."
                rows="3"
                style={{ resize: 'vertical', minHeight: '36px' }}
              />
            </div>
          </section>

          <section style={{ padding: '0px 12px', marginBottom: '16px' }}>
            <div className="image-container" style={{ height: '120px' }}>
              <div className="image-placeholder-text">Upload photos of the symptoms</div>
              <div className="image-pagination">
                <div className="pagination-dot active"></div>
                <div className="pagination-dot"></div>
                <div className="pagination-dot"></div>
                <div className="pagination-dot"></div>
              </div>
            </div>
          </section>

          <section style={{ padding: '0px 12px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-secondary" style={{ flex: 1 }}>
                Cancel
              </button>
              <button className="btn btn-primary" style={{ flex: 1 }}>
                Save Today's Log
              </button>
            </div>
          </section>
        </main>

        <BottomNavigation />
      </div>
    </div>
  );
};

export default SymptomLogScreen;
