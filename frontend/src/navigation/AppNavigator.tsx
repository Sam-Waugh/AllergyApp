import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../models';

// Import screens
import ModernHomeScreen from '../screens/ModernHomeScreen';
import ModernDailyLogScreen from '../screens/ModernDailyLogScreen';
import ImageDiaryScreen from '../screens/ImageDiaryScreen';
import ModernProfileScreen from '../screens/ModernProfileScreen';
import ResearchScreen from '../screens/ResearchScreen';
import ModernDoctorReportScreen from '../screens/ModernDoctorReportScreen';
import ModernSettingsScreen from '../screens/ModernSettingsScreen';
import PollenScreen from '../screens/PollenScreen';
import ModernManageChildrenScreen from '../screens/ModernManageChildrenScreen';
import AddChildScreen from '../screens/AddChildScreen';
import EditChildScreen from '../screens/EditChildScreen';

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

function TabNavigator() {
  const insets = useSafeAreaInsets();
  
  return (
    <Tab.Navigator
      id={undefined}
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E0E0E0',
          paddingTop: 8,
          paddingBottom: Math.max(insets.bottom, 8),
          height: 60 + Math.max(insets.bottom, 0),
          elevation: 8,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        tabBarActiveTintColor: '#1976D2',
        tabBarInactiveTintColor: '#757575',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: 4,
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={ModernHomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="DailyLog"
        component={ModernDailyLogScreen}
        options={{
          tabBarLabel: 'Log',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="create-outline" size={size} color={color} />
          ),
        }}
        initialParams={{ childId: '' }}
      />
      <Tab.Screen
        name="DoctorReport"
        component={ModernDoctorReportScreen}
        options={{
          tabBarLabel: 'Report',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Research"
        component={ResearchScreen}
        options={{
          tabBarLabel: 'Research',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="library-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Pollen"
        component={PollenScreen}
        options={{
          tabBarLabel: 'Pollen',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="leaf-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ModernProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <Stack.Navigator
      id={undefined}
      initialRouteName="TabNavigator"
      screenOptions={{
        headerStyle: {
          backgroundColor: '#FFFFFF',
        },
        headerTintColor: '#000000',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="TabNavigator"
        component={TabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Profile"
        component={ModernProfileScreen}
        options={{ title: 'Child Profile' }}
      />
      <Stack.Screen
        name="ManageChildren"
        component={ModernManageChildrenScreen}
        options={{ title: 'Manage Profiles' }}
      />
      <Stack.Screen
        name="AddChild"
        component={AddChildScreen}
        options={{ title: 'Add Profile' }}
      />
      <Stack.Screen
        name="EditChild"
        component={EditChildScreen}
        options={{ title: 'Edit Child' }}
      />
      <Stack.Screen
        name="DoctorReport"
        component={ModernDoctorReportScreen}
        options={{ title: 'Doctor Report' }}
      />
      <Stack.Screen
        name="ImageDiary"
        component={ImageDiaryScreen}
        options={{ title: 'Photo Diary' }}
      />
      <Stack.Screen
        name="Settings"
        component={ModernSettingsScreen}
        options={{ title: 'Settings' }}
      />
    </Stack.Navigator>
  );
}