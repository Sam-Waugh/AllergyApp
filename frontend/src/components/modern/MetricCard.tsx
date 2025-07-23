import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';

interface MetricCardProps {
  title: string;
  value: string | number;
  color?: string;
  style?: ViewStyle;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  color = '#1976D2',
  style,
}) => {
  return (
    <View style={[styles.card, style]}>
      <Text style={styles.title}>{title}</Text>
      <Text style={[styles.value, { color }]}>{value}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  title: {
    fontFamily: 'System',
    fontWeight: '400',
    fontSize: 12,
    lineHeight: 16,
    color: '#666666',
    marginBottom: 4,
  },
  value: {
    fontFamily: 'System',
    fontWeight: '700',
    fontSize: 24,
    lineHeight: 28,
  },
});

export default MetricCard;
