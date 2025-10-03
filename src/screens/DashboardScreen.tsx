import React, { useState, useEffect, useRef } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Alert, RefreshControl, Animated, Dimensions, Modal, Image } from 'react-native';
import { Card, Text, Avatar, IconButton, Title, Paragraph, Divider, ActivityIndicator, Surface, ProgressBar } from 'react-native-paper';
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
  badge?: number;
  animated?: boolean;
};

const QuickAction = ({ icon, label, onPress, color = COLORS.primary, disabled = false, badge, animated = true }: QuickActionProps) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (animated) {
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (animated) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    }
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity 
        style={[styles.quickAction, disabled && styles.quickActionDisabled]} 
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        activeOpacity={0.8}
      >
        <View style={[styles.quickActionIcon, { backgroundColor: `${color}15` }]}>
          <Ionicons name={icon as any} size={24} color={color} />
          {badge && badge > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          ) : null}
        </View>
        <Text style={[styles.quickActionLabel, disabled && styles.quickActionLabelDisabled]}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const { width } = Dimensions.get('window');

const DashboardScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [attendanceToday, setAttendanceToday] = useState<{ clockIn?: string; clockOut?: string } | null>(null);
  const [incidentsCount, setIncidentsCount] = useState(0);
  const [inventoryRequestsCount, setInventoryRequestsCount] = useState(0);
  const [attendanceStats, setAttendanceStats] = useState({ present: 0, total: 0 });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [notifications, setNotifications] = useState({
    inventory: 0,
    reassignment: 0,
    passwordReset: 0,
  });
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);
  const [currentAssignment, setCurrentAssignment] = useState<any>(null);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const sidebarAnim = useRef(new Animated.Value(-300)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  
  // Real-time clock update
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000); // Update every second

    return () => clearInterval(timer);
  }, []);

  // Entry animations
  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    }, 300);

    return () => clearTimeout(timer);
  }, []);
  
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

        // Calculate attendance stats for today
        const todayRecords = Object.values(records).filter((record: any) => 
          record.date === today
        );
        const presentCount = todayRecords.filter((record: any) => record.clockIn).length;
        setAttendanceStats({
          present: presentCount,
          total: todayRecords.length || 20 // Default to 20 if no records
        });
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

      // Get inventory requests count
      const inventoryRequestsData = await AsyncStorage.getItem('inventory_requests');
      if (inventoryRequestsData) {
        const requests = JSON.parse(inventoryRequestsData);
        const today = new Date().toISOString().split('T')[0];
        
        // Count requests for today
        const todayRequests = requests.filter((request: any) => 
          request.date === today
        );
        
        setInventoryRequestsCount(todayRequests.length);
      } else {
        setInventoryRequestsCount(0);
      }

      // Load notifications
      await loadNotifications();
      
      // Get current assignment from user data
      if (user?.current_assignment) {
        setCurrentAssignment(user.current_assignment);
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
    navigation.navigate('AttendanceTab', { screen: 'AttendanceHome' });
  };

  const navigateToRemarks = () => {
    navigation.navigate('RemarksTab', { screen: 'RemarksHome' });
  };

  const navigateToInventoryRequest = () => {
    navigation.navigate('InventoryRequestTab', { screen: 'InventoryRequestForm' });
  };

  const navigateToReviewRequestsScreen = () => {
    navigation.navigate('ReassignmentRequestTab', { screen: 'ReviewRequestsScreen' });
  };

  // const navigateToMap = () => {
  //   navigation.navigate('MapTab', { screen: 'Map' });
  // };

  const loadNotifications = async () => {
    try {
      // Load inventory approval notifications
      const inventoryData = await AsyncStorage.getItem('inventory_requests');
      let inventoryNotifications = 0;
      if (inventoryData) {
        const requests = JSON.parse(inventoryData);
        inventoryNotifications = requests.filter((request: any) => 
          request.status === 'approved' && !request.notificationRead
        ).length;
      }

      // Load reassignment approval notifications
      const reassignmentData = await AsyncStorage.getItem('reassignment_requests');
      let reassignmentNotifications = 0;
      if (reassignmentData) {
        const requests = JSON.parse(reassignmentData);
        reassignmentNotifications = requests.filter((request: any) => 
          request.status === 'approved' && !request.notificationRead
        ).length;
      }

      // Load password reset notifications
      const passwordResetData = await AsyncStorage.getItem('password_reset_requests');
      let passwordResetNotifications = 0;
      if (passwordResetData) {
        const requests = JSON.parse(passwordResetData);
        passwordResetNotifications = requests.filter((request: any) => 
          request.status === 'approved' && !request.notificationRead
        ).length;
      }

      setNotifications({
        inventory: inventoryNotifications,
        reassignment: reassignmentNotifications,
        passwordReset: passwordResetNotifications,
      });
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const navigateToNotifications = () => {
    setNotificationModalVisible(true);
  };

  const closeNotificationModal = () => {
    setNotificationModalVisible(false);
  };

  const navigateToProfile = () => {
    navigation.navigate('ProfileTab', { screen: 'ProfileHome' });
  };

  const navigateToReportIncident = () => {
    navigation.navigate('ReportIncidentTab', { screen: 'ReportIncidentForm' });
  };

  const toggleSidebar = () => {
    if (sidebarVisible) {
      // Close sidebar
      Animated.parallel([
        Animated.timing(sidebarAnim, {
          toValue: -300,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(overlayAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setSidebarVisible(false);
      });
    } else {
      // Open sidebar
      setSidebarVisible(true);
      Animated.parallel([
        Animated.timing(sidebarAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(overlayAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  const closeSidebar = () => {
    Animated.parallel([
      Animated.timing(sidebarAnim, {
        toValue: -300,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(overlayAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setSidebarVisible(false);
    });
  };


  const getAttendanceStatusColor = () => {
    if (!attendanceToday?.clockIn) return COLORS.warning;
    if (attendanceToday?.clockOut) return COLORS.success;
    return COLORS.primary;
  };

  const getAttendanceStatusText = () => {
    if (!attendanceToday?.clockIn) return 'Not Clocked In';
    if (attendanceToday?.clockOut) return 'Completed';
    return 'Clocked In';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
        <ProgressBar 
          indeterminate 
          color={COLORS.primary} 
          style={styles.loadingProgress}
        />
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
        <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Surface style={styles.headerSurface} elevation={4}>
            <View style={styles.headerContent}>
              <TouchableOpacity onPress={toggleSidebar} style={styles.hamburgerButton}>
                <Ionicons name="menu" size={32} color="#FFFFFF" />
              </TouchableOpacity>
              <View style={styles.headerTextContainer}>
                <Text style={styles.welcomeText}>Welcome,</Text>
                <Text style={styles.nameText}>
                  {user?.first_name && user?.last_name 
                    ? `${user.first_name} ${user.last_name}` 
                    : 'Officer'
                  }!
                </Text>
                {user?.role && (
                  <Text style={styles.roleText}>
                    {user.role === 'epol' ? 'EPOL Officer' : 
                     user.role === 'team_leader' ? 'Team Leader' : 
                     user.role === 'street_sweeper' ? 'Street Sweeper' : 
                     user.role}
                  </Text>
                )}
                {currentAssignment?.workplace_location && (
                  <Text style={styles.locationText}>
                    {currentAssignment.workplace_location.name}
                  </Text>
                )}
              </View>
              <TouchableOpacity onPress={navigateToNotifications} style={styles.notificationContainer}>
                <Ionicons name="notifications" size={24} color="#FFFFFF" />
                {(notifications.inventory + notifications.reassignment + notifications.passwordReset) > 0 && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationBadgeText}>
                      {notifications.inventory + notifications.reassignment + notifications.passwordReset}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </Surface>
        </Animated.View>

        {/* Date and Current Status */}
        <Animated.View style={[styles.statusCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Surface style={styles.statusCardSurface} elevation={2}>
            <View style={styles.dateContainer}>
              <View style={styles.dateHeader}>
                <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
                <Text style={styles.dateText}>
                  {currentTime.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </Text>
              </View>
              <View style={styles.timeContainer}>
                <Ionicons name="time-outline" size={16} color={COLORS.text.secondary} />
                <Text style={styles.timeText}>
                  {currentTime.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true,
                  })}
                </Text>
              </View>
            </View>

            <View style={styles.statsGrid}>
              {(user?.role === 'street_sweeper' || user?.role === 'epol') ? (
                // Street Sweeper and EPOL: Only Attendance Card (Full Width)
                <View style={styles.statsRow}>
                  <View style={[styles.statCard, styles.statCardFullWidth, { backgroundColor: `${getAttendanceStatusColor()}10` }]}>
                    <View style={styles.statHeader}>
                      <Ionicons 
                        name={attendanceToday?.clockIn ? "checkmark-circle" : "alert-circle-outline"} 
                        size={20} 
                        color={getAttendanceStatusColor()}
                      />
                      <Text style={[styles.statLabel, { color: getAttendanceStatusColor() }]}>Attendance</Text>
                    </View>
                    <Text style={[styles.statValue, { color: getAttendanceStatusColor() }]}>
                      {getAttendanceStatusText()}
                    </Text>
                    {attendanceToday?.clockIn ? (
                      <Text style={styles.statSubtext}>
                        {attendanceToday.clockIn} - {attendanceToday.clockOut ? attendanceToday.clockOut : 'In Progress'}
                      </Text>
                    ) : null}
                  </View>
                </View>
              ) : (
                // Other Roles: All Cards
                <>
                  {/* First Row: Attendance and Team Rate */}
                  <View style={styles.statsRow}>
                    {/* Attendance Status Card */}
                    <View style={[styles.statCard, { backgroundColor: `${getAttendanceStatusColor()}10` }]}>
                      <View style={styles.statHeader}>
                        <Ionicons 
                          name={attendanceToday?.clockIn ? "checkmark-circle" : "alert-circle-outline"} 
                          size={15} 
                          color={getAttendanceStatusColor()}
                        />
                        <Text style={[styles.statLabel, { color: getAttendanceStatusColor() }]}>Attendance</Text>
                      </View>
                      <Text style={[styles.statValue, { color: getAttendanceStatusColor() }]}>
                        {getAttendanceStatusText()}
                      </Text>
                      {attendanceToday?.clockIn ? (
                        <Text style={styles.statSubtext}>
                          {attendanceToday.clockIn} - {attendanceToday.clockOut ? attendanceToday.clockOut : 'In Progress'}
                        </Text>
                      ) : null}
                    </View>

                    {/* Attendance Rate Card */}
                    <View style={[styles.statCard, { backgroundColor: `${COLORS.success}10` }]}>
                      <View style={styles.statHeader}>
                        <Ionicons name="people-outline" size={15} color={COLORS.success} />
                        <Text style={[styles.statLabel, { color: COLORS.success }]}>Team Rate</Text>
                      </View>
                      <Text style={[styles.statValue, { color: COLORS.success }]}>
                        {attendanceStats.total > 0 ? `${Math.round((attendanceStats.present / attendanceStats.total) * 100)}%` : '0%'}
                      </Text>
                      <Text style={styles.statSubtext}>
                        {attendanceStats.present}/{attendanceStats.total} Present
                      </Text>
                    </View>
                  </View>

                  {/* Second Row: Reports and Inventory */}
                  <View style={styles.statsRow}>
                    {/* Reports Card */}
                    <View style={[styles.statCard, { backgroundColor: `${COLORS.primary}10` }]}>
                      <View style={styles.statHeader}>
                        <Ionicons name="document-text-outline" size={15} color={COLORS.primary} />
                        <Text style={[styles.statLabel, { color: COLORS.primary }]}>Safeguarding</Text>
                      </View>
                      <Text style={[styles.statValue, { color: COLORS.primary }]}>
                        {incidentsCount}
                      </Text>
                      <Text style={styles.statSubtext}>Reports</Text>
                    </View>

                    {/* Inventory Card */}
                    <View style={[styles.statCard, { backgroundColor: `${COLORS.warning}10` }]}>
                      <View style={styles.statHeader}>
                        <Ionicons name="cube-outline" size={15} color={COLORS.warning} />
                        <Text style={[styles.statLabel, { color: COLORS.warning }]}>Inventory</Text>
                      </View>
                      <Text style={[styles.statValue, { color: COLORS.warning }]}>
                        {inventoryRequestsCount}
                      </Text>
                      <Text style={styles.statSubtext}>Requests</Text>
                    </View>
                  </View>
                </>
              )}
            </View>
          </Surface>
        </Animated.View>

        {/* Daily Tasks */}
        <Animated.View style={[styles.actionsCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Surface style={styles.actionsCardSurface} elevation={2}>
            <View style={styles.actionsHeader}>
              <Title style={styles.sectionTitle}>Daily Tasks</Title>
            </View>
            <View style={styles.quickActionsContainer}>
              <QuickAction 
                icon="finger-print" 
                label="Record Attendance" 
                onPress={navigateToAttendance} 
                disabled={!!attendanceToday?.clockOut}
                color={attendanceToday?.clockIn ? COLORS.success : COLORS.primary}
                badge={attendanceToday?.clockIn ? 1 : 0}
              />
              {user?.role === 'team_leader' ? (
                <QuickAction 
                  icon="checkmark-circle" 
                  label="Validate Attendance" 
                  onPress={navigateToRemarks}
                  color={COLORS.info}
                />
              ) : null}
            </View>
          </Surface>
        </Animated.View>
      </ScrollView>

      {/* Sidebar Overlay */}
      {sidebarVisible && (
        <Animated.View 
          style={[
            styles.overlay, 
            { opacity: overlayAnim }
          ]}
        >
          <TouchableOpacity 
            style={styles.overlayTouchable} 
            onPress={closeSidebar}
            activeOpacity={1}
          />
        </Animated.View>
      )}

      {/* Sidebar */}
      <Animated.View 
        style={[
          styles.sidebar, 
          { transform: [{ translateX: sidebarAnim }] }
        ]}
      >
        <View style={styles.sidebarHeader}>
          <View style={styles.sidebarUserInfo}>
            <View style={styles.sidebarLogoContainer}>
              <Image 
                source={require('../../assets/images/EPOL LOGO.png')}
                style={styles.sidebarLogo}
                resizeMode="contain"
              />
            </View>
            <View style={styles.sidebarUserDetails}>
              <Text style={styles.sidebarUserName}>
                {user?.first_name && user?.last_name 
                  ? `${user.first_name} ${user.last_name}` 
                  : 'Officer'
                }
              </Text>
              <Text style={styles.sidebarUserRole}>
                {user?.role === 'epol' ? 'EPOL Officer' : 
                 user?.role === 'team_leader' ? 'Team Leader' : 
                 user?.role === 'street_sweeper' ? 'Street Sweeper' : 
                 user?.role || 'Officer'}
              </Text>
              {currentAssignment?.workplace_location && (
                <Text style={styles.sidebarLocationText}>
                  {currentAssignment.workplace_location.name}
                </Text>
              )}
            </View>
          </View>
          <TouchableOpacity onPress={closeSidebar} style={styles.sidebarCloseButton}>
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.sidebarContent}>
          <TouchableOpacity 
            style={styles.sidebarItem} 
            onPress={() => { closeSidebar(); navigation.navigate('Dashboard'); }}
          >
            <Ionicons name="home" size={24} color={COLORS.primary} />
            <Text style={styles.sidebarItemText}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.sidebarItem} 
            onPress={() => { closeSidebar(); navigateToAttendance(); }}
          >
            <Ionicons name="finger-print" size={24} color={COLORS.primary} />
            <Text style={styles.sidebarItemText}>Record Attendance</Text>
          </TouchableOpacity>

          {user?.role === 'team_leader' && (
            <TouchableOpacity 
              style={styles.sidebarItem} 
              onPress={() => { closeSidebar(); navigateToRemarks(); }}
            >
              <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
              <Text style={styles.sidebarItemText}>Validate Attendance</Text>
            </TouchableOpacity>
          )}

          {user?.role !== 'street_sweeper' && user?.role !== 'epol' && (
            <TouchableOpacity 
              style={styles.sidebarItem} 
              onPress={() => { closeSidebar(); navigateToReportIncident(); }}
            >
              <Ionicons name="warning" size={24} color={COLORS.primary} />
              <Text style={styles.sidebarItemText}>Report Incident</Text>
            </TouchableOpacity>
          )}

          {user?.role !== 'street_sweeper' && user?.role !== 'epol' && (
            <TouchableOpacity 
              style={styles.sidebarItem} 
              onPress={() => { closeSidebar(); navigateToInventoryRequest(); }}
            >
              <Ionicons name="cube-outline" size={24} color={COLORS.primary} />
              <Text style={styles.sidebarItemText}>Request Inventory Items</Text>
            </TouchableOpacity>
          )}

          {user?.role !== 'street_sweeper' && user?.role !== 'epol' && (
            <TouchableOpacity 
              style={styles.sidebarItem} 
              onPress={() => { closeSidebar(); navigateToReviewRequestsScreen(); }}
            >
              <Ionicons name="swap-horizontal" size={24} color={COLORS.primary} />
              <Text style={styles.sidebarItemText}>Request Reassignment/Redeployment</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            style={styles.sidebarItem} 
            onPress={() => { closeSidebar(); navigateToProfile(); }}
          >
            <Ionicons name="person" size={24} color={COLORS.primary} />
            <Text style={styles.sidebarItemText}>Profile</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Notification Modal */}
      <Modal
        visible={notificationModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeNotificationModal}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={closeNotificationModal}
        >
          <TouchableOpacity 
            style={styles.notificationDropdown} 
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.notificationHeader}>
              <Text style={styles.notificationTitle}>Notifications</Text>
              <TouchableOpacity onPress={closeNotificationModal}>
                <Ionicons name="close" size={20} color={COLORS.text.secondary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.notificationContent}>
              {notifications.inventory + notifications.reassignment + notifications.passwordReset === 0 ? (
                <View style={styles.emptyNotification}>
                  <Ionicons name="notifications-off" size={48} color={COLORS.text.secondary} />
                  <Text style={styles.emptyNotificationText}>No new notifications</Text>
                </View>
              ) : (
                <View style={styles.notificationList}>
                  {notifications.inventory > 0 && (
                    <View style={styles.notificationItem}>
                      <View style={[styles.notificationIcon, { backgroundColor: `${COLORS.warning}15` }]}>
                        <Ionicons name="cube-outline" size={20} color={COLORS.warning} />
                      </View>
                      <View style={styles.notificationDetails}>
                        <Text style={styles.notificationItemTitle}>Inventory Approval</Text>
                        <Text style={styles.notificationItemText}>
                          {notifications.inventory} inventory request{notifications.inventory > 1 ? 's' : ''} approved
                        </Text>
                      </View>
                      <View style={styles.notificationBadge}>
                        <Text style={styles.notificationBadgeText}>{notifications.inventory}</Text>
                      </View>
                    </View>
                  )}
                  
                  {notifications.reassignment > 0 && (
                    <View style={styles.notificationItem}>
                      <View style={[styles.notificationIcon, { backgroundColor: `${COLORS.info}15` }]}>
                        <Ionicons name="swap-horizontal" size={20} color={COLORS.info} />
                      </View>
                      <View style={styles.notificationDetails}>
                        <Text style={styles.notificationItemTitle}>Reassignment Approval</Text>
                        <Text style={styles.notificationItemText}>
                          {notifications.reassignment} reassignment request{notifications.reassignment > 1 ? 's' : ''} approved
                        </Text>
                      </View>
                      <View style={styles.notificationBadge}>
                        <Text style={styles.notificationBadgeText}>{notifications.reassignment}</Text>
                      </View>
                    </View>
                  )}
                  
                  {notifications.passwordReset > 0 && (
                    <View style={styles.notificationItem}>
                      <View style={[styles.notificationIcon, { backgroundColor: `${COLORS.primary}15` }]}>
                        <Ionicons name="key" size={20} color={COLORS.primary} />
                      </View>
                      <View style={styles.notificationDetails}>
                        <Text style={styles.notificationItemTitle}>Password Reset</Text>
                        <Text style={styles.notificationItemText}>
                          {notifications.passwordReset} password reset request{notifications.passwordReset > 1 ? 's' : ''} approved
                        </Text>
                      </View>
                      <View style={styles.notificationBadge}>
                        <Text style={styles.notificationBadgeText}>{notifications.passwordReset}</Text>
                      </View>
                    </View>
                  )}
                </View>
              )}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    marginBottom: SPACING.s,
  },
  headerSurface: {
    backgroundColor: COLORS.primary,
    padding: SPACING.l,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTextContainer: {
    flex: 1,
    marginRight: SPACING.m,
  },
  welcomeText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 2,
  },
  nameText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  roleText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  locationText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '400',
    marginTop: 2,
  },
  notificationContainer: {
    padding: SPACING.s,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: COLORS.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  statusCard: {
    margin: SPACING.m,
    marginTop: 0,
  },
  statusCardSurface: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  dateContainer: {
    padding: SPACING.l,
    backgroundColor: '#FFEBEE',
    borderBottomWidth: 1,
    borderBottomColor: '#FFCDD2',
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.s,
  },
  dateText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 16,
    marginLeft: SPACING.s,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    color: COLORS.text.secondary,
    fontSize: 14,
    marginLeft: SPACING.s,
    fontWeight: '500',
  },
  statsGrid: {
    padding: SPACING.s,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.s,
  },
  statCard: {
    width: (width - SPACING.m * 4 - SPACING.s) / 2,
    padding: SPACING.m,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  statCardFullWidth: {
    width: width - SPACING.m * 4,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.s,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: SPACING.s,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statSubtext: {
    fontSize: 11,
    color: COLORS.text.secondary,
    fontWeight: '500',
  },
  actionsCard: {
    margin: SPACING.m,
    marginTop: 0,
  },
  actionsCardSurface: {
    borderRadius: 16,
    padding: SPACING.l,
  },
  actionsHeader: {
    marginBottom: SPACING.m,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: COLORS.text.secondary,
    fontWeight: '500',
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: SPACING.l,
  },
  quickAction: {
    width: 120,
    alignItems: 'center',
    marginBottom: SPACING.m,
    padding: SPACING.s,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
  },
  quickActionDisabled: {
    opacity: 0.5,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.s,
    position: 'relative',
  },
  quickActionLabel: {
    fontSize: 13,
    textAlign: 'center',
    color: COLORS.text.primary,
    fontWeight: '600',
  },
  quickActionLabelDisabled: {
    color: COLORS.text.secondary,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: COLORS.error,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: SPACING.m,
    color: COLORS.text.secondary,
    fontSize: 16,
    fontWeight: '500',
  },
  loadingProgress: {
    width: 200,
    marginTop: SPACING.m,
  },
  // Hamburger Menu Styles
  hamburgerButton: {
    padding: SPACING.s,
    paddingLeft: SPACING.xxs,
    paddingTop: SPACING.s,
    marginRight: SPACING.s,
    
  },
  // Sidebar Styles
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 998,
  },
  overlayTouchable: {
    flex: 1,
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 300,
    backgroundColor: '#FFFFFF',
    zIndex: 999,
    ...SHADOWS.large,
  },
  sidebarHeader: {
    backgroundColor: COLORS.primary,
    padding: SPACING.l,
    paddingTop: SPACING.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  sidebarUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sidebarLogoContainer: {
    width: 70,
    height: 70,
    borderRadius: 50,
    backgroundColor: '#FFFFFF',
    marginRight: SPACING.m,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.s,
    ...SHADOWS.small,
  },
  sidebarLogo: {
    width: 50,
    height: 50,
  },
  sidebarUserDetails: {
    flex: 1,
  },
  sidebarUserName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  sidebarUserRole: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    textTransform: 'capitalize',
  },
  sidebarLocationText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    marginTop: 2,
  },
  sidebarCloseButton: {
    padding: SPACING.s,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
  },
  sidebarContent: {
    flex: 1,
    padding: SPACING.m,
  },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.m,
    marginBottom: SPACING.s,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
  },
  sidebarItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text.primary,
    marginLeft: SPACING.m,
  },
  // Notification Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 100,
    paddingRight: SPACING.m,
  },
  notificationDropdown: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: 320,
    maxHeight: 400,
    ...SHADOWS.large,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.l,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  notificationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  notificationContent: {
    maxHeight: 300,
  },
  emptyNotification: {
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyNotificationText: {
    fontSize: 16,
    color: COLORS.text.secondary,
    marginTop: SPACING.m,
    fontWeight: '500',
  },
  notificationList: {
    padding: SPACING.s,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.m,
    marginBottom: SPACING.s,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderRadius: 12,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.m,
  },
  notificationDetails: {
    flex: 1,
  },
  notificationItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 2,
  },
  notificationItemText: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
});

export default DashboardScreen; 