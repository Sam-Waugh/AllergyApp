import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  icon?: string;
}

const Slider: React.FC<SliderProps> = ({
  label,
  value,
  onChange,
  min = 0,
  max = 5,
  step = 1,
  icon,
}) => {
  const [currentValue, setCurrentValue] = useState(value);

  useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  const handleValueChange = (newValue: number) => {
    const clampedValue = Math.max(min, Math.min(max, newValue));
    setCurrentValue(clampedValue);
    onChange(clampedValue);
  };

  const increment = () => {
    if (currentValue < max) {
      handleValueChange(currentValue + step);
    }
  };

  const decrement = () => {
    if (currentValue > min) {
      handleValueChange(currentValue - step);
    }
  };

  const getSeverityText = (val: number) => {
    if (val === 0) return 'None';
    if (val <= 2) return 'Mild';
    if (val <= 4) return 'Moderate';
    return 'Severe';
  };

  const getSeverityColor = (val: number) => {
    if (val === 0) return '#9E9E9E';
    if (val <= 2) return '#4CAF50';
    if (val <= 4) return '#FF9800';
    return '#F44336';
  };

  const renderDots = () => {
    const dots = [];
    for (let i = min; i <= max; i++) {
      dots.push(
        <TouchableOpacity
          key={i}
          style={[
            styles.dot,
            i <= currentValue ? { backgroundColor: getSeverityColor(currentValue) } : styles.inactiveDot,
          ]}
          onPress={() => handleValueChange(i)}
        />
      );
    }
    return dots;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.labelContainer}>
          {icon && <Text style={styles.icon}>{icon}</Text>}
          <Text style={styles.label}>{label}</Text>
        </View>
        <View style={styles.valueContainer}>
          <Text style={[styles.severityText, { color: getSeverityColor(currentValue) }]}>
            {getSeverityText(currentValue)}
          </Text>
          <Text style={styles.value}>{currentValue}</Text>
        </View>
      </View>
      
      <View style={styles.sliderContainer}>
        <View style={styles.track}>
          {renderDots()}
        </View>
      </View>
      
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.controlButton, currentValue <= min && styles.disabledButton]}
          onPress={decrement}
          disabled={currentValue <= min}
        >
          <Ionicons name="remove" size={20} color={currentValue <= min ? '#CCCCCC' : '#666666'} />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.controlButton, currentValue >= max && styles.disabledButton]}
          onPress={increment}
          disabled={currentValue >= max}
        >
          <Ionicons name="add" size={20} color={currentValue >= max ? '#CCCCCC' : '#666666'} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  icon: {
    fontSize: 18,
  },
  label: {
    fontFamily: 'System',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 20,
    color: '#000000',
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  severityText: {
    fontFamily: 'System',
    fontWeight: '600',
    fontSize: 14,
    lineHeight: 18,
  },
  value: {
    fontFamily: 'System',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 20,
    color: '#000000',
    minWidth: 20,
    textAlign: 'center',
  },
  sliderContainer: {
    height: 40,
    justifyContent: 'center',
    marginHorizontal: 20,
  },
  track: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    marginHorizontal: 4,
  },
  inactiveDot: {
    backgroundColor: '#E0E0E0',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingHorizontal: 20,
  },
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  disabledButton: {
    backgroundColor: '#F9F9F9',
  },
});

export default Slider;
