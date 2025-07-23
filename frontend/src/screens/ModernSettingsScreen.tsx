import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Switch,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import {
  TopBar,
  ModernButton,
  Avatar,
} from '../components/modern';
import { Ionicons } from '@expo/vector-icons';

interface SettingItem {
  id: string;
  title: string;
  subtitle?: string;
  type: 'toggle' | 'navigation' | 'action';
  icon: keyof typeof Ionicons.glyphMap;
  value?: boolean;
  onPress?: () => void;
  onToggle?: (value: boolean) => void;
}

export default function ModernSettingsScreen() {
  const navigation = useNavigation();
  const { user, logout } = useAuth();
  
  const [notifications, setNotifications] = useState(true);
  const [locationServices, setLocationServices] = useState(true);
  const [dataCollection, setDataCollection] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => logout(),
        },
      ]
    );
  };

  const settingSections = [
    {
      title: 'Notifications',
      items: [
        {
          id: 'push_notifications',
          title: 'Push Notifications',
          subtitle: 'Receive alerts about pollen levels and reminders',
          type: 'toggle' as const,
          icon: 'notifications-outline' as const,
          value: notifications,
          onToggle: setNotifications,
        },
        {
          id: 'location_services',
          title: 'Location Services',
          subtitle: 'Allow location access for local pollen data',
          type: 'toggle' as const,
          icon: 'location-outline' as const,
          value: locationServices,
          onToggle: setLocationServices,
        },
      ],
    },
    {
      title: 'Privacy & Data',
      items: [
        {
          id: 'data_collection',
          title: 'Anonymous Data Collection',
          subtitle: 'Help improve the app with anonymous usage data',
          type: 'toggle' as const,
          icon: 'analytics-outline' as const,
          value: dataCollection,
          onToggle: setDataCollection,
        },
        {
          id: 'privacy_policy',
          title: 'Privacy Policy',
          subtitle: 'Read our privacy policy',
          type: 'navigation' as const,
          icon: 'shield-outline' as const,
          onPress: () => {
            // Navigate to privacy policy
            Alert.alert('Privacy Policy', 'Privacy policy will be displayed here');
          },
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          id: 'help_center',
          title: 'Help Center',
          subtitle: 'Get help and find answers',
          type: 'navigation' as const,
          icon: 'help-circle-outline' as const,
          onPress: () => {
            Alert.alert('Help Center', 'Help center will be available soon');
          },
        },
        {
          id: 'contact_support',
          title: 'Contact Support',
          subtitle: 'Get in touch with our support team',
          type: 'navigation' as const,
          icon: 'mail-outline' as const,
          onPress: () => {
            Alert.alert('Contact Support', 'Support contact form will be available soon');
          },
        },
        {
          id: 'about',
          title: 'About',
          subtitle: 'App version and information',
          type: 'navigation' as const,
          icon: 'information-circle-outline' as const,
          onPress: () => {
            Alert.alert('About', 'AllergyApp v1.0.0\nBuilt with React Native');
          },
        },
      ],
    },
  ];

  const renderSettingItem = (item: SettingItem) => {
    return (
      <View key={item.id} style={styles.settingItem}>
        <View style={styles.settingIcon}>
          <Ionicons name={item.icon} size={24} color="#666666" />
        </View>
        
        <View style={styles.settingContent}>
          <Text style={styles.settingTitle}>{item.title}</Text>
          {item.subtitle && (
            <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
          )}
        </View>
        
        <View style={styles.settingAction}>
          {item.type === 'toggle' && (
            <Switch
              value={item.value}
              onValueChange={item.onToggle}
              trackColor={{ false: '#E0E0E0', true: '#1976D2' }}
              thumbColor={item.value ? '#FFFFFF' : '#FFFFFF'}
            />
          )}
          {item.type === 'navigation' && (
            <Ionicons name="chevron-forward" size={20} color="#CCCCCC" />
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <TopBar
        title="Settings"
        showBack={true}
        onBackPress={() => navigation.goBack()}
      />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* User Profile Section */}
        {user && (
          <View style={styles.section}>
            <View style={styles.userSection}>
              <Avatar name={user.name || user.email} size="medium" />
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{user.name || 'User'}</Text>
                <Text style={styles.userEmail}>{user.email}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Settings Sections */}
        {settingSections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.settingsCard}>
              {section.items.map((item, index) => (
                <View key={item.id}>
                  <View style={styles.settingItemContainer}>
                    {renderSettingItem(item)}
                  </View>
                  {index < section.items.length - 1 && <View style={styles.separator} />}
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Sign Out Button */}
        <View style={styles.section}>
          <ModernButton
            title="Sign Out"
            variant="outline"
            onPress={handleLogout}
            style={styles.signOutButton}
          />
        </View>

        {/* App Version */}
        <View style={styles.versionSection}>
          <Text style={styles.versionText}>AllergyApp v1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  userInfo: {
    marginLeft: 16,
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666666',
  },
  settingsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  settingItemContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    width: 32,
    alignItems: 'center',
    marginRight: 16,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 18,
  },
  settingAction: {
    marginLeft: 16,
  },
  separator: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginLeft: 68,
  },
  signOutButton: {
    borderColor: '#F44336',
  },
  versionSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  versionText: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
  },
});
