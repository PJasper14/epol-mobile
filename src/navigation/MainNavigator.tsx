import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

// Screens
import DashboardScreen from '../screens/DashboardScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import ReportIncidentScreen from '../screens/ReportIncidentScreen';
import AttendanceScreen from '../screens/AttendanceScreen';
import TeamLeaderValidationScreen from '../screens/TeamLeaderValidationScreen';
import InventoryRequestScreen from '../screens/InventoryRequestScreen';
import ReassignmentRequestScreen from '../screens/ReviewRequestsScreen';

// Theme
import { COLORS } from '../utils/theme';

// Stack Types
type DashboardStackParamList = {
  DashboardHome: undefined;
  ReportIncidentForm: undefined;
  Activities: undefined;
  SearchDatabase: undefined;
  Scanner: undefined;
};

type AttendanceStackParamList = {
  AttendanceHome: undefined;
  AttendanceHistory: undefined;
};

type ReportIncidentStackParamList = {
  ReportIncidentForm: undefined;
  IncidentsList: undefined;
  IncidentDetails: { id: string };
};

type RemarksStackParamList = {
  RemarksHome: undefined;
  ValidationHistory: undefined;
};

type InventoryRequestStackParamList = {
  InventoryRequestForm: undefined;
};

type ReassignmentRequestStackParamList = {
  ReassignmentRequestHome: undefined;
};

type ProfileStackParamList = {
  ProfileHome: undefined;
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
const InventoryRequestStack = createStackNavigator<InventoryRequestStackParamList>();
const ReassignmentRequestStack = createStackNavigator<ReassignmentRequestStackParamList>();
const ProfileStack = createStackNavigator<ProfileStackParamList>();

// Dashboard Stack Navigator
const DashboardStackNavigator = () => (
  <DashboardStack.Navigator screenOptions={{ headerShown: false }}>
    <DashboardStack.Screen name="DashboardHome" component={DashboardScreen} />
  </DashboardStack.Navigator>
);

// Attendance Stack Navigator
const AttendanceStackNavigator = () => (
  <AttendanceStack.Navigator screenOptions={{ headerShown: false }}>
    <AttendanceStack.Screen name="AttendanceHome" component={AttendanceScreen} />
  </AttendanceStack.Navigator>
);

// Report Incident Stack Navigator
const ReportIncidentStackNavigator = () => (
  <ReportIncidentStack.Navigator>
    <ReportIncidentStack.Screen
      name="ReportIncidentForm"
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
  <RemarksStack.Navigator screenOptions={{ headerShown: false }}>
    <RemarksStack.Screen
      name="RemarksHome"
      component={TeamLeaderValidationScreen}
    />
  </RemarksStack.Navigator>
);

// Inventory Request Stack Navigator
const InventoryRequestStackNavigator = () => (
  <InventoryRequestStack.Navigator>
    <InventoryRequestStack.Screen
      name="InventoryRequestForm"
      component={InventoryRequestScreen}
      options={{
        title: 'Request Inventory Items',
        headerStyle: {
          backgroundColor: COLORS.primary,
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    />
  </InventoryRequestStack.Navigator>
);

// Reassignment Request Stack Navigator
const ReassignmentRequestStackNavigator = () => (
  <ReassignmentRequestStack.Navigator>
    <ReassignmentRequestStack.Screen
      name="ReassignmentRequestHome"
      component={ReassignmentRequestScreen}
      options={{
        title: 'Request Reassignment',
        headerStyle: {
          backgroundColor: COLORS.primary,
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    />
  </ReassignmentRequestStack.Navigator>
);

// Profile Stack Navigator
const ProfileStackNavigator = () => (
  <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
    <ProfileStack.Screen name="ProfileHome" component={ProfileScreen} />
    <ProfileStack.Screen name="ChangePassword" component={ChangePasswordScreen} />
  </ProfileStack.Navigator>
);

// Main Stack Navigator (replacing bottom tabs)
const MainStack = createStackNavigator();

const MainNavigator = () => {
  const { user } = useAuth();

  return (
    <MainStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <MainStack.Screen name="Dashboard" component={DashboardStackNavigator} />
      <MainStack.Screen name="AttendanceTab" component={AttendanceStackNavigator} />
      {user?.role !== 'street_sweeper' && user?.role !== 'epol' && (
        <MainStack.Screen name="ReportIncidentTab" component={ReportIncidentStackNavigator} />
      )}
      {user?.role === 'team_leader' && (
        <MainStack.Screen name="RemarksTab" component={RemarksStackNavigator} />
      )}
      {user?.role !== 'street_sweeper' && user?.role !== 'epol' && (
        <MainStack.Screen name="InventoryRequestTab" component={InventoryRequestStackNavigator} />
      )}
      {user?.role !== 'street_sweeper' && user?.role !== 'epol' && (
        <MainStack.Screen name="ReassignmentRequestTab" component={ReassignmentRequestStackNavigator} />
      )}
      <MainStack.Screen name="ProfileTab" component={ProfileStackNavigator} />
    </MainStack.Navigator>
  );
};

export default MainNavigator; 