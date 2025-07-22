import React, { useState } from 'react';

const Slider = ({ label, value, onChange, min = 0, max = 5 }) => {
  const [sliderValue, setSliderValue] = useState(value || 0);

  const handleSliderChange = (newValue) => {
    setSliderValue(newValue);
    if (onChange) {
      onChange(newValue);
    }
  };

  const increment = () => {
    if (sliderValue < max) {
      handleSliderChange(sliderValue + 1);
    }
  };

  const decrement = () => {
    if (sliderValue > min) {
      handleSliderChange(sliderValue - 1);
    }
  };

  return (
    <div className="slider-container">
      <div className="slider-header">
        <span className="slider-label">{label}</span>
        <span className="slider-value">{sliderValue}</span>
      </div>
      <div className="slider-track">
        <div 
          className="slider-knob" 
          style={{ left: `${(sliderValue / max) * 100}%` }}
        />
      </div>
      <div className="slider-controls">
        <button 
          className="slider-btn" 
          onClick={decrement}
          disabled={sliderValue <= min}
          aria-label="Decrease value"
        >
          <img 
            src="https://codia-f2c.s3.us-west-1.amazonaws.com/image/2025-07-21/6QkgVM1YWc.svg" 
            alt="Minus" 
            style={{ width: '24px', height: '24px' }}
          />
        </button>
        <button 
          className="slider-btn" 
          onClick={increment}
          disabled={sliderValue >= max}
          aria-label="Increase value"
        >
          ➕
        </button>
      </div>
    </div>
  );
};

export default Slider;
