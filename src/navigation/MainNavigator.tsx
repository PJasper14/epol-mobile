import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

// Screens
import DashboardScreen from '../screens/DashboardScreen';
import MapScreen from '../screens/MapScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ReportIncidentScreen from '../screens/ReportIncidentScreen';

// Theme
import { COLORS } from '../utils/theme';

// Stack Types
type DashboardStackParamList = {
  Dashboard: undefined;
  ReportIncident: undefined;
  Activities: undefined;
  SearchDatabase: undefined;
  Scanner: undefined;
};

type MapStackParamList = {
  Map: undefined;
  ReportIncident: undefined;
};

type ProfileStackParamList = {
  Profile: undefined;
  EditProfile: undefined;
  ChangePassword: undefined;
  LanguageSettings: undefined;
  Support: undefined;
  About: undefined;
};

// Create stacks
const DashboardStack = createStackNavigator<DashboardStackParamList>();
const MapStack = createStackNavigator<MapStackParamList>();
const ProfileStack = createStackNavigator<ProfileStackParamList>();

// Dashboard Stack Navigator
const DashboardStackNavigator = () => (
  <DashboardStack.Navigator screenOptions={{ headerShown: false }}>
    <DashboardStack.Screen name="Dashboard" component={DashboardScreen} />
    <DashboardStack.Screen name="ReportIncident" component={ReportIncidentScreen} />
    {/* Add other dashboard related screens here */}
  </DashboardStack.Navigator>
);

// Map Stack Navigator
const MapStackNavigator = () => (
  <MapStack.Navigator screenOptions={{ headerShown: false }}>
    <MapStack.Screen name="Map" component={MapScreen} />
    <MapStack.Screen name="ReportIncident" component={ReportIncidentScreen} />
    {/* Add other map related screens here */}
  </MapStack.Navigator>
);

// Profile Stack Navigator
const ProfileStackNavigator = () => (
  <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
    <ProfileStack.Screen name="Profile" component={ProfileScreen} />
    {/* Add other profile related screens here */}
  </ProfileStack.Navigator>
);

// Bottom Tab Navigator
const Tab = createBottomTabNavigator();

const getTabBarVisibility = (route: any) => {
  const routeName = getFocusedRouteNameFromRoute(route) ?? 'Dashboard';
  const hideOnScreens = ['ReportIncident', 'Scanner'];
  
  if (hideOnScreens.includes(routeName)) {
    return false;
  }
  
  return true;
};

const MainNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          if (route.name === 'DashboardTab') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'MapTab') {
            iconName = focused ? 'map' : 'map-outline';
          } else if (route.name === 'ProfileTab') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'alert-circle';
          }

          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.text.secondary,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: COLORS.divider,
          paddingTop: 5,
          paddingBottom: 5,
          height: 60,
        },
      })}
    >
      <Tab.Screen 
        name="DashboardTab" 
        component={DashboardStackNavigator}
        options={({ route }) => ({
          tabBarLabel: 'Home',
          tabBarVisible: getTabBarVisibility(route),
        })}
      />
      <Tab.Screen 
        name="MapTab" 
        component={MapStackNavigator}
        options={({ route }) => ({
          tabBarLabel: 'Map',
          tabBarVisible: getTabBarVisibility(route),
        })}
      />
      <Tab.Screen 
        name="ProfileTab" 
        component={ProfileStackNavigator}
        options={{
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
};

export default MainNavigator; 