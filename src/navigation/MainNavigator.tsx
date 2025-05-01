import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

// Screens
import DashboardScreen from '../screens/DashboardScreen';
import MapScreen from '../screens/MapScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ReportIncidentScreen from '../screens/ReportIncidentScreen';
import AttendanceScreen from '../screens/AttendanceScreen';

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

type AttendanceStackParamList = {
  Attendance: undefined;
  AttendanceHistory: undefined;
};

type SafeguardingStackParamList = {
  ReportIncident: undefined;
  IncidentsList: undefined;
  IncidentDetails: { id: string };
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
const AttendanceStack = createStackNavigator<AttendanceStackParamList>();
const SafeguardingStack = createStackNavigator<SafeguardingStackParamList>();
const MapStack = createStackNavigator<MapStackParamList>();
const ProfileStack = createStackNavigator<ProfileStackParamList>();

// Dashboard Stack Navigator
const DashboardStackNavigator = () => (
  <DashboardStack.Navigator screenOptions={{ headerShown: false }}>
    <DashboardStack.Screen name="Dashboard" component={DashboardScreen} />
    <DashboardStack.Screen name="ReportIncident" component={ReportIncidentScreen} />
  </DashboardStack.Navigator>
);

// Attendance Stack Navigator
const AttendanceStackNavigator = () => (
  <AttendanceStack.Navigator screenOptions={{ headerShown: false }}>
    <AttendanceStack.Screen name="Attendance" component={AttendanceScreen} />
  </AttendanceStack.Navigator>
);

// Safeguarding Stack Navigator
const SafeguardingStackNavigator = () => (
  <SafeguardingStack.Navigator screenOptions={{ headerShown: false }}>
    <SafeguardingStack.Screen name="ReportIncident" component={ReportIncidentScreen} />
  </SafeguardingStack.Navigator>
);

// Map Stack Navigator
const MapStackNavigator = () => (
  <MapStack.Navigator screenOptions={{ headerShown: false }}>
    <MapStack.Screen name="Map" component={MapScreen} />
    <MapStack.Screen name="ReportIncident" component={ReportIncidentScreen} />
  </MapStack.Navigator>
);

// Profile Stack Navigator
const ProfileStackNavigator = () => (
  <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
    <ProfileStack.Screen name="Profile" component={ProfileScreen} />
  </ProfileStack.Navigator>
);

// Bottom Tab Navigator
const Tab = createBottomTabNavigator();

const getTabBarVisibility = (route: any) => {
  const routeName = getFocusedRouteNameFromRoute(route) ?? 'Dashboard';
  const hideOnScreens = ['ReportIncident', 'Scanner', 'IncidentDetails'];
  
  if (hideOnScreens.includes(routeName)) {
    return false;
  }
  
  return true;
};

const MainNavigator = () => {
  const { user } = useAuth();
  const isTeamLeader = user?.role === 'team_leader';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          if (route.name === 'DashboardTab') {
            iconName = focused ? 'home' : 'home-outline';
            return <Ionicons name={iconName as any} size={size} color={color} />;
          } else if (route.name === 'AttendanceTab') {
            iconName = focused ? 'finger-print' : 'finger-print-outline';
            return <Ionicons name={iconName as any} size={size} color={color} />;
          } else if (route.name === 'SafeguardingTab') {
            iconName = focused ? 'shield-check' : 'shield-outline';
            return <MaterialCommunityIcons name={iconName as any} size={size} color={color} />;
          } else if (route.name === 'MapTab') {
            iconName = focused ? 'map' : 'map-outline';
            return <Ionicons name={iconName as any} size={size} color={color} />;
          } else if (route.name === 'ProfileTab') {
            iconName = focused ? 'person' : 'person-outline';
            return <Ionicons name={iconName as any} size={size} color={color} />;
          } else {
            iconName = 'alert-circle';
            return <Ionicons name={iconName as any} size={size} color={color} />;
          }
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
      {isTeamLeader && (
        <Tab.Screen 
          name="DashboardTab" 
          component={DashboardStackNavigator}
          options={({ route }) => ({
            tabBarLabel: 'Home',
            tabBarVisible: getTabBarVisibility(route),
          })}
        />
      )}
      <Tab.Screen 
        name="AttendanceTab" 
        component={AttendanceStackNavigator}
        options={({ route }) => ({
          tabBarLabel: 'Attendance',
          tabBarVisible: getTabBarVisibility(route),
        })}
      />
      {isTeamLeader && (
        <>
          <Tab.Screen 
            name="SafeguardingTab" 
            component={SafeguardingStackNavigator}
            options={({ route }) => ({
              tabBarLabel: 'Safeguarding',
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
        </>
      )}
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