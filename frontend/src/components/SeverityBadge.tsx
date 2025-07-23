import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { SymptomSeverity } from '../models';

interface SeverityBadgeProps {
  severity: SymptomSeverity;
  style?: ViewStyle;
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({
  severity,
  style,
}) => {
  const getBadgeColor = (severity: SymptomSeverity) => {
    switch (severity) {
      case 'none':
        return '#4CAF50';
      case 'mild':
        return '#FFC107';
      case 'moderate':
        return '#FF9800';
      case 'severe':
        return '#F44336';
      default:
        return '#999';
    }
  };

  const getSeverityText = (severity: SymptomSeverity) => {
    return severity.charAt(0).toUpperCase() + severity.slice(1);
  };

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: getBadgeColor(severity) },
        style,
      ]}
    >
      <Text style={styles.text}>{getSeverityText(severity)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
});
