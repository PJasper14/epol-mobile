import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { Card, Text, Avatar, IconButton, Title, Paragraph, Divider, ActivityIndicator, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { COLORS, SPACING, SHADOWS } from '../utils/theme';
import { useAuth } from '../context/AuthContext';

type QuickActionProps = {
  icon: string;
  label: string;
  onPress: () => void;
  color?: string;
  disabled?: boolean;
};

const QuickAction = ({ icon, label, onPress, color = COLORS.primary, disabled = false }: QuickActionProps) => (
  <TouchableOpacity 
    style={[styles.quickAction, disabled && styles.quickActionDisabled]} 
    onPress={onPress}
    disabled={disabled}
  >
    <View style={[styles.quickActionIcon, { backgroundColor: `${color}15` }]}>
      <Ionicons name={icon as any} size={24} color={color} />
    </View>
    <Text style={styles.quickActionLabel}>{label}</Text>
  </TouchableOpacity>
);

const DashboardScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [attendanceToday, setAttendanceToday] = useState<{ clockIn?: string; clockOut?: string } | null>(null);
  const [incidentsCount, setIncidentsCount] = useState(0);
  
  // Load data when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      loadDashboardData();
    }, [])
  );

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Get attendance data
      const attendanceData = await AsyncStorage.getItem('attendance_records');
      if (attendanceData) {
        const records = JSON.parse(attendanceData);
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        
        if (records[today]) {
          setAttendanceToday(records[today]);
        } else {
          setAttendanceToday(null);
        }
      }
      
      // Get incidents count from AsyncStorage
      const incidentsData = await AsyncStorage.getItem('incident_reports');
      if (incidentsData) {
        const incidents = JSON.parse(incidentsData);
        const today = new Date().toISOString().split('T')[0];
        
        // Count incidents for today
        const todayIncidents = incidents.filter((incident: any) => 
          incident.date === today
        );
        
        setIncidentsCount(todayIncidents.length);
      } else {
        setIncidentsCount(0);
      }
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
  };

  const navigateToAttendance = () => {
    navigation.navigate('Attendance', { screen: 'Attendance' });
  };



  const navigateToRemarks = () => {
    navigation.navigate('Remarks', { screen: 'Remarks' });
  };

  const navigateToInventoryRequest = () => {
    navigation.navigate('InventoryRequest', { screen: 'InventoryRequest' });
  };

  // const navigateToMap = () => {
  //   navigation.navigate('MapTab', { screen: 'Map' });
  // };

  const navigateToProfile = () => {
    navigation.navigate('ProfileTab', { screen: 'Profile' });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
      >
        {/* Header Section */}
        <Surface style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.welcomeText}>Welcome,</Text>
              <Text style={styles.nameText}>{user?.displayName || 'Officer'}</Text>
            </View>
            <TouchableOpacity onPress={navigateToProfile}>
              <Avatar.Text 
                size={40} 
                label={(user?.displayName || 'U').substring(0, 1).toUpperCase()} 
                style={{ backgroundColor: COLORS.primary }}
              />
            </TouchableOpacity>
          </View>
        </Surface>

        {/* Date and Current Status */}
        <Surface style={styles.statusCard}>
          <View style={styles.dateContainer}>
            <Text style={styles.dateText}>
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </Text>
          </View>

          <View style={styles.statusContainer}>
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>Attendance Status</Text>
              <View style={styles.statusValue}>
                <Ionicons 
                  name={attendanceToday?.clockIn ? "checkmark-circle" : "alert-circle-outline"} 
                  size={18} 
                  color={attendanceToday?.clockIn ? COLORS.success : COLORS.warning} 
                  style={{ marginRight: 4 }}
                />
                <Text style={{ 
                  fontWeight: 'bold',
                  color: attendanceToday?.clockIn ? COLORS.success : COLORS.warning
                }}>
                  {attendanceToday?.clockIn 
                    ? (attendanceToday?.clockOut ? 'Completed' : 'Clocked In') 
                    : 'Not Clocked In'}
                </Text>
              </View>
            </View>

            <View style={styles.statusDivider} />

            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>Reports Today</Text>
              <View style={styles.statusValue}>
                <Ionicons 
                  name="document-text-outline" 
                  size={18} 
                  color={COLORS.primary} 
                  style={{ marginRight: 4 }}
                />
                <Text style={{ fontWeight: 'bold', color: COLORS.primary }}>
                  {incidentsCount} Incidents
                </Text>
              </View>
            </View>
          </View>
        </Surface>

        {/* Quick Actions - Only for essential daily tasks */}
        <Card style={styles.actionsCard}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Daily Tasks</Title>
            <View style={styles.quickActionsContainer}>
              <QuickAction 
                icon="finger-print" 
                label="Attendance" 
                onPress={navigateToAttendance} 
                disabled={!!attendanceToday?.clockOut}
              />
              {user?.role === 'team_leader' && (
                <QuickAction 
                  icon="document-text" 
                  label="Validation" 
                  onPress={navigateToRemarks} 
                />
              )}
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: COLORS.primary,
    padding: SPACING.l,
    elevation: 4,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  nameText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statusCard: {
    margin: SPACING.m,
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 2,
  },
  dateContainer: {
    padding: SPACING.m,
    backgroundColor: '#FFEBEE',
    borderBottomWidth: 1,
    borderBottomColor: '#FFCDD2',
  },
  dateText: {
    color: COLORS.primary,
    fontWeight: '500',
  },
  statusContainer: {
    flexDirection: 'row',
    padding: SPACING.m,
  },
  statusItem: {
    flex: 1,
  },
  statusDivider: {
    width: 1,
    backgroundColor: COLORS.divider,
    marginHorizontal: SPACING.m,
  },
  statusLabel: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginBottom: 4,
  },
  statusValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionsCard: {
    margin: SPACING.m,
    marginTop: 0,
    borderRadius: 8,
    ...SHADOWS.small,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: SPACING.m,
    color: COLORS.text.primary,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  quickAction: {
    width: '30%',
    alignItems: 'center',
    marginBottom: SPACING.m,
  },
  quickActionDisabled: {
    opacity: 0.5,
  },
  quickActionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionLabel: {
    fontSize: 12,
    textAlign: 'center',
    color: COLORS.text.secondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: SPACING.m,
    color: COLORS.text.secondary,
  },
});

export default DashboardScreen; 