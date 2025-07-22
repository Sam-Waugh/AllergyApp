import React, { useState } from 'react';

const Calendar = ({ selectedDate, onDateSelect }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date(2025, 5)); // June 2025
  
  const daysOfWeek = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  const formatMonth = (date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleDateClick = (day) => {
    if (day && onDateSelect) {
      const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      onDateSelect(newDate);
    }
  };

  const isToday = (day) => {
    const today = new Date();
    return day === 10 && currentMonth.getMonth() === 5 && currentMonth.getFullYear() === 2025;
  };

  const isSelected = (day) => {
    return day === 26 && currentMonth.getMonth() === 5 && currentMonth.getFullYear() === 2025;
  };

  const days = getDaysInMonth(currentMonth);
  const weeks = [];
  
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <div className="calendar-month">
          <span className="calendar-month-text">{formatMonth(currentMonth)}</span>
          <button className="calendar-nav-btn">􀆊</button>
        </div>
        <div className="calendar-nav">
          <button className="calendar-nav-btn" onClick={handlePrevMonth}>􀆉</button>
          <button className="calendar-nav-btn" onClick={handleNextMonth}>􀆊</button>
        </div>
      </div>
      
      <div className="calendar-days-header">
        {daysOfWeek.map(day => (
          <div key={day} className="calendar-day-header">{day}</div>
        ))}
      </div>
      
      <div className="calendar-grid">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="calendar-week">
            {week.map((day, dayIndex) => (
              <div 
                key={dayIndex} 
                className={`calendar-day ${isToday(day) ? 'today' : ''} ${isSelected(day) ? 'selected' : ''}`}
                onClick={() => handleDateClick(day)}
              >
                {day && (
                  <span className="calendar-day-text">{day}</span>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
      
      <div className="time-picker">
        <span className="time-picker-label">Ends</span>
        <div className="time-picker-controls">
          <input type="text" className="time-input" value="  8:00" readOnly />
          <div className="am-pm-toggle">
            <button className="am-pm-btn active">AM</button>
            <button className="am-pm-btn">PM</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;
