import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

// Screens
import DashboardScreen from '../screens/DashboardScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ReportIncidentScreen from '../screens/ReportIncidentScreen';
import AttendanceScreen from '../screens/AttendanceScreen';
import TeamLeaderValidationScreen from '../screens/TeamLeaderValidationScreen';

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

type ReportIncidentStackParamList = {
  ReportIncident: undefined;
  IncidentsList: undefined;
  IncidentDetails: { id: string };
};

type RemarksStackParamList = {
  Remarks: undefined;
  ValidationHistory: undefined;
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
const ReportIncidentStack = createStackNavigator<ReportIncidentStackParamList>();
const RemarksStack = createStackNavigator<RemarksStackParamList>();
const ProfileStack = createStackNavigator<ProfileStackParamList>();

// Dashboard Stack Navigator
const DashboardStackNavigator = () => (
  <DashboardStack.Navigator screenOptions={{ headerShown: false }}>
    <DashboardStack.Screen name="Dashboard" component={DashboardScreen} />
  </DashboardStack.Navigator>
);

// Attendance Stack Navigator
const AttendanceStackNavigator = () => (
  <AttendanceStack.Navigator screenOptions={{ headerShown: false }}>
    <AttendanceStack.Screen name="Attendance" component={AttendanceScreen} />
  </AttendanceStack.Navigator>
);

// Report Incident Stack Navigator
const ReportIncidentStackNavigator = () => (
  <ReportIncidentStack.Navigator>
    <ReportIncidentStack.Screen
      name="ReportIncident"
      component={ReportIncidentScreen}
      options={{
        title: 'Report Incident',
        headerStyle: {
          backgroundColor: COLORS.primary,
        },
        headerTintColor: '#FFFFFF',
      }}
    />
  </ReportIncidentStack.Navigator>
);

// Remarks Stack Navigator
const RemarksStackNavigator = () => (
  <RemarksStack.Navigator>
    <RemarksStack.Screen
      name="Remarks"
      component={TeamLeaderValidationScreen}
      options={{
        title: 'EPOL Validation',
        headerStyle: {
          backgroundColor: COLORS.primary,
        },
        headerTintColor: '#FFFFFF',
      }}
    />
  </RemarksStack.Navigator>
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
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Attendance') {
            iconName = focused ? 'finger-print' : 'finger-print-outline';
          } else if (route.name === 'ReportIncident') {
            iconName = focused ? 'shield-checkmark' : 'shield-outline';
          } else if (route.name === 'Remarks') {
            iconName = focused ? 'document-text' : 'document-text-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'alert-circle';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.text.secondary,
        headerShown: false,
      })}
    >
      {isTeamLeader ? (
        <>
          <Tab.Screen
            name="Dashboard"
            component={DashboardStackNavigator}
            options={({ route }) => ({
              tabBarStyle: {
                display: getTabBarVisibility(route) ? 'flex' : 'none',
              },
            })}
          />
          <Tab.Screen
            name="Attendance"
            component={AttendanceStackNavigator}
            options={({ route }) => ({
              tabBarStyle: {
                display: getTabBarVisibility(route) ? 'flex' : 'none',
              },
            })}
          />
          <Tab.Screen
            name="ReportIncident"
            component={ReportIncidentStackNavigator}
            options={{
              title: 'Report',
            }}
          />
          <Tab.Screen
            name="Remarks"
            component={RemarksStackNavigator}
            options={{
              title: 'Remarks',
            }}
          />
          <Tab.Screen
            name="Profile"
            component={ProfileStackNavigator}
            options={({ route }) => ({
              tabBarStyle: {
                display: getTabBarVisibility(route) ? 'flex' : 'none',
              },
            })}
          />
        </>
      ) : (
        <>
          <Tab.Screen
            name="Attendance"
            component={AttendanceStackNavigator}
            options={({ route }) => ({
              tabBarStyle: {
                display: getTabBarVisibility(route) ? 'flex' : 'none',
              },
            })}
          />
          <Tab.Screen
            name="Profile"
            component={ProfileStackNavigator}
            options={({ route }) => ({
              tabBarStyle: {
                display: getTabBarVisibility(route) ? 'flex' : 'none',
              },
            })}
          />
        </>
      )}
    </Tab.Navigator>
  );
};

export default MainNavigator; 