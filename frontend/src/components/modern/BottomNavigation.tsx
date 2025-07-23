import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface NavigationItem {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  badge?: number;
}

interface BottomNavigationProps {
  items: NavigationItem[];
  activeKey: string;
  onItemPress: (key: string) => void;
  backgroundColor?: string;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({
  items,
  activeKey,
  onItemPress,
  backgroundColor = '#FFFFFF',
}) => {
  return (
    <View style={[styles.container, { backgroundColor }]}>
      <View style={styles.content}>
        {items.map((item) => {
          const isActive = item.key === activeKey;
          
          return (
            <TouchableOpacity
              key={item.key}
              style={styles.item}
              onPress={() => onItemPress(item.key)}
              activeOpacity={0.7}
            >
              <View style={styles.iconContainer}>
                <Ionicons
                  name={item.icon}
                  size={24}
                  color={isActive ? '#1976D2' : '#757575'}
                />
                {item.badge && item.badge > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {item.badge > 99 ? '99+' : item.badge}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={[
                styles.label,
                { color: isActive ? '#1976D2' : '#757575' }
              ]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 8,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  item: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#F44336',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
  },
});

export default BottomNavigation;
