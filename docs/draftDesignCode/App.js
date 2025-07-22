import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './styles/App.css';
import HomeScreen from './components/screens/HomeScreen';
import SymptomLogScreen from './components/screens/SymptomLogScreen';
import PollenForecastScreen from './components/screens/PollenForecastScreen';
import ResearchFeedScreen from './components/screens/ResearchFeedScreen';
import DoctorReportScreen from './components/screens/DoctorReportScreen';
import PatientProfileScreen from './components/screens/PatientProfileScreen';

function App() {
  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/symptom-log" element={<SymptomLogScreen />} />
          <Route path="/pollen-forecast" element={<PollenForecastScreen />} />
          <Route path="/research-feed" element={<ResearchFeedScreen />} />
          <Route path="/doctor-report" element={<DoctorReportScreen />} />
          <Route path="/patient-profile" element={<PatientProfileScreen />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
