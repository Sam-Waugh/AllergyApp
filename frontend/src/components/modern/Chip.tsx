import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Colors } from '../../constants/Colors';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
  style?: ViewStyle;
}

const Chip: React.FC<ChipProps> = ({
  label,
  selected = false,
  onPress,
  style,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.chip,
        selected ? styles.selectedChip : styles.unselectedChip,
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[
        styles.label,
        selected ? styles.selectedLabel : styles.unselectedLabel,
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
    minWidth: 64,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  selectedChip: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  unselectedChip: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
  },
  label: {
    fontFamily: 'System',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 18,
    textAlign: 'center',
  },
  selectedLabel: {
    color: Colors.textOnPrimary,
  },
  unselectedLabel: {
    color: Colors.textSecondary,
  },
});

export default Chip;
