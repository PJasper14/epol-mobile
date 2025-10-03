import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Alert, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Text, Button, Card, Title, Paragraph, Divider, ActivityIndicator, Surface, List, Avatar, Searchbar, Banner } from 'react-native-paper';
import * as LocalAuthentication from 'expo-local-authentication';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '../utils/theme';
import LocationStatusCard from '../components/LocationStatusCard';

const { width } = Dimensions.get('window');

// Mock employee data for demonstration
const EMPLOYEES = [
  { id: '1', name: 'John Doe', position: 'Officer', registered: true },
  { id: '2', name: 'Jane Smith', position: 'Supervisor', registered: true },
  { id: '3', name: 'Alex Johnson', position: 'Team Lead', registered: true },
  { id: '4', name: 'Sam Williams', position: 'Officer', registered: true },
  { id: '5', name: 'Taylor Brown', position: 'Officer', registered: true },
  { id: '6', name: 'Totoy Brown', position: 'Officer', registered: true },
  { id: '7', name: 'Neneng Brown', position: 'Officer', registered: true },
  { id: '8', name: 'Rodel Brown', position: 'Officer', registered: true },
  { id: '9', name: 'AKo to', position: 'Officer', registered: true },
  { id: '10', name: 'Test TWO', position: 'Officer', registered: true },
  { id: '11', name: 'Test THREE', position: 'Officer', registered: true },
  { id: '12', name: 'Test FOUR', position: 'Officer', registered: true },
  { id: '13', name: 'Test FIVE', position: 'Officer', registered: true },
  { id: '14', name: 'Test SIX', position: 'Officer', registered: true },
  { id: '15', name: 'Test SEVEN', position: 'Officer', registered: true },
  { id: '16', name: 'Test EIGHT', position: 'Officer', registered: true },
  { id: '17', name: 'Test NINE', position: 'Officer', registered: true },
  { id: '18', name: 'Test TEN', position: 'Officer', registered: true },

];

const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;
const ALLOWED_CLOCK_IN_START = 14; // 2:00 PM in 24-hour format
const WORK_START_TIME = 14.5;      // 2:30 PM in decimal format (14 + 30/60)
const WORK_END_TIME = 18.5;        // 6:30 PM in decimal format (18 + 30/60)
const ALLOWED_CLOCK_IN_END = 15.5;   // 3:30 PM in 24-hour format
const CLOCK_OUT_TIME = 18.5;       // 6:30 PM in decimal format (18 + 30/60)
const EXTENDED_CLOCK_OUT_TIME = 18.67; // 6:40 PM in decimal format (18 + 40/60)

const AttendanceScreen = () => {
  const navigation = useNavigation();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showEmployeeSelector, setShowEmployeeSelector] = useState(true); // Start with employee selector
  const [selectedEmployee, setSelectedEmployee] = useState<typeof EMPLOYEES[0] | null>(null);
  const [attendanceType, setAttendanceType] = useState<'clockIn' | 'clockOut'>('clockIn');
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, any>>({});
  const [showBanner, setShowBanner] = useState(true);
  const [clockOutTimer, setClockOutTimer] = useState<number>(0); // ms remaining
  const timerInterval = useRef<number | null>(null);
  
  // Geofencing state
  const [isWithinRadius, setIsWithinRadius] = useState<boolean | null>(null);
  const [locationDistance, setLocationDistance] = useState<number>(0);
  const [assignedLocation, setAssignedLocation] = useState<any>(null);
  const [locationRefreshTrigger, setLocationRefreshTrigger] = useState(0);

  // Filter employees based on search query
  const filteredEmployees = EMPLOYEES.filter(employee => 
    employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    employee.position.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    loadAllAttendanceData();
  }, []);

  useEffect(() => {
    if (selectedEmployee) {
      loadEmployeeAttendanceData(selectedEmployee.id);
    }
  }, [selectedEmployee]);

  // Timer effect for selected employee
  useEffect(() => {
    if (!selectedEmployee) return;
    const today = new Date().toISOString().split('T')[0];
    const employeeRecords = attendanceRecords[today]?.[selectedEmployee.id] || {};
    
    if (employeeRecords.clockIn) {
      const updateTimer = () => {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentSecond = now.getSeconds();
        const currentTime = currentHour + (currentMinute / 60) + (currentSecond / 3600);
        
        if (currentTime >= WORK_END_TIME) {
          setClockOutTimer(0);
          if (timerInterval.current) clearInterval(timerInterval.current);
          return;
        }
        
        // Calculate exact time remaining in milliseconds
        const endTime = new Date();
        endTime.setHours(18, 30, 0, 0); // Set to 6:30 PM
        const remainingMs = endTime.getTime() - now.getTime();
        setClockOutTimer(remainingMs > 0 ? remainingMs : 0);
      };
      
      updateTimer();
      timerInterval.current = setInterval(updateTimer, 1000);
      return () => {
        if (timerInterval.current) clearInterval(timerInterval.current);
      };
    } else {
      setClockOutTimer(0);
      if (timerInterval.current) clearInterval(timerInterval.current);
    }
  }, [selectedEmployee, attendanceRecords]);

  const loadAllAttendanceData = async () => {
    try {
      setLoading(true);
      const savedData = await AsyncStorage.getItem('attendance_records');
      
      if (savedData) {
        const records = JSON.parse(savedData);
        setAttendanceRecords(records);
      }
    } catch (error) {
      console.error('Error loading attendance data', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEmployeeAttendanceData = async (employeeId: string) => {
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      
      if (attendanceRecords[today]?.[employeeId]) {
        // Employee has records for today
      } else {
        // No records for today
      }
    } catch (error) {
      console.error('Error loading employee attendance data', error);
    }
  };

  const saveAttendanceRecord = async (type: 'clockIn' | 'clockOut', employeeId: string) => {
    try {
      const now = new Date();
      const today = now.toISOString().split('T')[0]; // YYYY-MM-DD
      const timeString = now.toLocaleTimeString();
      const isoString = now.toISOString();
      const savedData = await AsyncStorage.getItem('attendance_records');
      let records = savedData ? JSON.parse(savedData) : {};
      if (!records[today]) {
        records[today] = {};
      }
      if (!records[today][employeeId]) {
        records[today][employeeId] = {};
      }
      
      records[today][employeeId][type] = timeString;
      if (type === 'clockIn') {
        records[today][employeeId].clockInISO = isoString;
      }
      
      await AsyncStorage.setItem('attendance_records', JSON.stringify(records));
      setAttendanceRecords(records);
      
      const employeeName = EMPLOYEES.find(emp => emp.id === employeeId)?.name || 'Employee';
      Alert.alert(
        'Success',
        type === 'clockIn'
          ? `${employeeName} has clocked in at ${timeString}`
          : `${employeeName} has clocked out at ${timeString}`
      );
    } catch (error) {
      console.error('Error saving attendance record', error);
      Alert.alert('Error', 'Failed to save attendance record');
    }
  };

  const isClockInAvailable = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour + (currentMinute / 60);
    
    // Check if current time is after 2:20 PM
    if (currentHour === ALLOWED_CLOCK_IN_START && currentMinute >= 20) {
      return { 
        available: true, 
        isLate: currentTime >= WORK_START_TIME,
        isExpired: false
      };
    }
    if (currentHour > ALLOWED_CLOCK_IN_START && currentHour < ALLOWED_CLOCK_IN_END) {
      return { 
        available: true, 
        isLate: true,
        isExpired: false
      };
    }
    if (currentHour >= ALLOWED_CLOCK_IN_END) {
      return { 
        available: false, 
        isLate: false,
        isExpired: true
      };
    }
    return { 
      available: false, 
      isLate: false,
      isExpired: false
    };
  };

  const handleEmployeeSelect = (employee: typeof EMPLOYEES[0]) => {
    setSelectedEmployee(employee);
    setShowEmployeeSelector(false);
    
    const today = new Date().toISOString().split('T')[0];
    const employeeRecords = attendanceRecords[today]?.[employee.id] || {};
    
    // Check if clock-in is available based on time
    const timeCheck = isClockInAvailable();
    
    // Check if current time is past 6:40 PM
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour + (currentMinute / 60);
    
    if (currentTime >= EXTENDED_CLOCK_OUT_TIME) {
      Alert.alert(
        'Work Period Ended',
        'The work period has ended (6:40 PM). You cannot clock in or out for today.',
        [
          { 
            text: 'OK', 
            onPress: () => {
              setSelectedEmployee(null);
              setShowEmployeeSelector(true);
            }
          }
        ]
      );
      return;
    }
    
    // If trying to clock in after 6:30 PM
    if (!employeeRecords.clockIn && currentTime >= WORK_END_TIME) {
      Alert.alert(
        'Work Period Ended',
        'The work period has ended (6:30 PM). You cannot clock in for today.',
        [
          { 
            text: 'OK', 
            onPress: () => {
              setSelectedEmployee(null);
              setShowEmployeeSelector(true);
            }
          }
        ]
      );
      return;
    }
    
    if (!employeeRecords.clockIn && !timeCheck.available) {
      if (timeCheck.isExpired) {
        Alert.alert(
          'Attendance Period Expired',
          'The attendance period has expired. You cannot clock in for today.',
          [
            { 
              text: 'OK', 
              onPress: () => {
                setSelectedEmployee(null);
                setShowEmployeeSelector(true);
              }
            }
          ]
        );
      } else {
        Alert.alert(
          'Clock-in Not Available',
          'Clock-in is available starting at 2:20 PM.',
          [
            { text: 'OK', onPress: () => {
              setSelectedEmployee(null);
              setShowEmployeeSelector(true);
            }}
          ]
        );
      }
      return;
    }
    
    // Automatically determine the most likely action needed
    if (!employeeRecords.clockIn) {
      setAttendanceType('clockIn');
      if (timeCheck.isLate) {
        Alert.alert(
          'Late Clock-in',
          'You are clocking in after the work start time of 2:30 PM.',
          [{ text: 'OK' }]
        );
      }
    } else if (employeeRecords.clockIn && !employeeRecords.clockOut) {
      setAttendanceType('clockOut');
    } else {
      setAttendanceType('clockIn');
    }
  };

  const registerFingerprint = async (employeeId: string) => {
    setIsAuthenticating(true);
    
    try {
      // Check if device supports biometrics
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) {
        Alert.alert('Error', 'This device does not support biometric authentication');
        return;
      }
      
      // Check if biometrics are enrolled on the device
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!isEnrolled) {
        Alert.alert('Error', 'No biometrics enrolled on this device');
        return;
      }
      
      // Start registration process (in a real app, you would store a secure token)
      Alert.alert(
        'Registration Instructions',
        'Please place your finger on the sensor to register your fingerprint. You will need to scan it multiple times for security.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Begin', onPress: async () => {
            // Simulate multiple scans for registration
            for (let i = 0; i < 3; i++) {
              const result = await LocalAuthentication.authenticateAsync({
                promptMessage: `Fingerprint Registration (Scan ${i+1}/3)`,
                fallbackLabel: 'Use PIN',
              });
              
              if (!result.success) {
                Alert.alert('Registration Failed', 'Please try again later');
                setIsAuthenticating(false);
                return;
              }
            }
            
            // Update employee as registered in the mock data
            // In a real app, this would be stored in a database
            const updatedEmployees = EMPLOYEES.map(emp => 
              emp.id === employeeId ? {...emp, registered: true} : emp
            );
            
            Alert.alert('Registration Successful', 'Fingerprint has been registered successfully.');
            
            // Proceed with attendance after registration
            handleAuthenticate(attendanceType, employeeId);
          }}
        ]
      );
    } catch (error) {
      console.error('Fingerprint registration error', error);
      Alert.alert('Error', 'Registration failed. Please try again.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Handle location status updates
  const handleLocationCheck = (isWithin: boolean, distance: number, location: any) => {
    setIsWithinRadius(isWithin);
    setLocationDistance(distance);
    setAssignedLocation(location);
  };

  // Refresh location check
  const refreshLocation = () => {
    setLocationRefreshTrigger(prev => prev + 1);
  };

  const handleAuthenticate = async (type: 'clockIn' | 'clockOut', employeeId: string) => {
    setIsAuthenticating(true);
    
    try {
      // First check location before biometric authentication
      if (isWithinRadius === false) {
        Alert.alert(
          'Location Error',
          `You are ${locationDistance}m away from the workplace. You must be within 100m to clock in/out.`,
          [
            { text: 'Refresh Location', onPress: refreshLocation },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
        setIsAuthenticating(false);
        return;
      }

      if (isWithinRadius === null) {
        Alert.alert(
          'Location Not Checked',
          'Please check your location first before clocking in/out.',
          [
            { text: 'Check Location', onPress: refreshLocation },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
        setIsAuthenticating(false);
        return;
      }
      
      // Check if device supports biometrics
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) {
        Alert.alert('Error', 'This device does not support biometric authentication');
        return;
      }
      
      // Check if biometrics are enrolled
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!isEnrolled) {
        Alert.alert('Error', 'No biometrics enrolled on this device');
        return;
      }
      
      // Find employee name for display
      const employeeName = EMPLOYEES.find(emp => emp.id === employeeId)?.name || 'Employee';
      
      // Authenticate with biometrics
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: type === 'clockIn' 
          ? `Verify ${employeeName}'s fingerprint to clock in` 
          : `Verify ${employeeName}'s fingerprint to clock out`,
        fallbackLabel: 'Use PIN',
      });
      
      if (result.success) {
        await saveAttendanceRecord(type, employeeId);
      } else {
        Alert.alert('Authentication Failed', 'Please try again');
      }
    } catch (error) {
      console.error('Biometric authentication error', error);
      Alert.alert('Error', 'Authentication failed. Please try again.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading attendance system...</Text>
      </View>
    );
  }

  // Employee selection screen - Always shown first
  if (showEmployeeSelector) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Biometric Attendance</Text>
          </View>
        </View>

        {/* Location Status Card - Only show when employee is selected */}
        {selectedEmployee && (
          <LocationStatusCard 
            employeeId={selectedEmployee.id}
            onLocationCheck={handleLocationCheck}
            refreshTrigger={locationRefreshTrigger}
          />
        )}
        
        <Searchbar
          placeholder="Search employees..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
        
        <ScrollView style={styles.employeeList} showsVerticalScrollIndicator={false}>
          {filteredEmployees.map(employee => {
            // Calculate status for the employee
            const today = new Date().toISOString().split('T')[0];
            const employeeRecords = attendanceRecords[today]?.[employee.id] || {};
            let status = "Not clocked in";
            let statusColor = COLORS.warning;
            let statusIcon = "alert-circle-outline";
            
            if (employeeRecords.clockIn && employeeRecords.clockOut) {
              status = "Completed";
              statusColor = COLORS.success;
              statusIcon = "checkmark-circle";
            } else if (employeeRecords.clockIn) {
              status = "Clocked in";
              statusColor = COLORS.info;
              statusIcon = "time";
            }
            
            return (
              <TouchableOpacity
                key={employee.id}
                style={styles.employeeCard}
                onPress={() => handleEmployeeSelect(employee)}
              >
                <View style={styles.employeeCardContent}>
                  <View style={styles.employeeInfo}>
                    <Avatar.Text 
                      size={50} 
                      label={employee.name.substring(0, 1)} 
                      style={styles.employeeAvatar}
                    />
                    <View style={styles.employeeDetails}>
                      <Text style={styles.employeeName}>{employee.name}</Text>
                      <Text style={styles.employeePosition}>{employee.position}</Text>
                      <View style={styles.statusContainer}>
                        <Ionicons name={statusIcon} size={16} color={statusColor} />
                        <Text style={[styles.statusText, { color: statusColor }]}>{status}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.employeeActions}>
                    {!employee.registered && (
                      <View style={styles.fingerprintWarning}>
                        <Ionicons name="finger-print-outline" size={20} color={COLORS.warning} />
                      </View>
                    )}
                    <Ionicons name="chevron-forward" size={20} color={COLORS.text.secondary} />
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  }

  // Attendance action screen - Shown after employee is selected
  if (selectedEmployee) {
    const today = new Date().toISOString().split('T')[0];
    const employeeRecords = attendanceRecords[today]?.[selectedEmployee.id] || {};
    const canClockOut = !!employeeRecords.clockIn && !employeeRecords.clockOut && clockOutTimer === 0;
    // Helper to format ms to HH:MM:SS
    const formatTimer = (ms: number) => {
      const totalSeconds = Math.max(0, Math.floor(ms / 1000));
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      return `${hours.toString().padStart(2, '0')}:${minutes
        .toString()
        .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };
    const timeCheck = isClockInAvailable();
    const timeElapsed = employeeRecords.clockIn ? new Date().getTime() - new Date(employeeRecords.clockInISO).getTime() : 0;
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour + (currentMinute / 60);
    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => {
              setSelectedEmployee(null);
              setShowEmployeeSelector(true);
            }}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Record Attendance</Text>
          </View>
        </View>
        
        {/* Combined Employee and Location Card */}
        <Card style={styles.selectedEmployeeCard}>
          <Card.Content>
            {/* Employee Info Section */}
            <View style={styles.selectedEmployeeContent}>
              <Avatar.Text 
                size={60} 
                label={selectedEmployee.name.substring(0, 1)} 
                style={{ backgroundColor: COLORS.primary }}
              />
              <View style={styles.selectedEmployeeDetails}>
                <Title style={styles.employeeName}>{selectedEmployee.name}</Title>
                <Paragraph style={styles.employeePosition}>{selectedEmployee.position}</Paragraph>
              </View>
            </View>
            
            {/* Location Status Section */}
            <View style={styles.locationSection}>
              <LocationStatusCard 
                employeeId={selectedEmployee.id}
                onLocationCheck={handleLocationCheck}
                refreshTrigger={locationRefreshTrigger}
              />
            </View>
          </Card.Content>
        </Card>
        
        {/* Today's Attendance Card - Third */}
        <Card style={styles.attendanceCard}>
          <Card.Content>
            <View style={styles.attendanceHeader}>
              <Ionicons name="time" size={24} color={COLORS.primary} />
              <Title style={styles.attendanceTitle}>Today's Attendance</Title>
            </View>
            <Divider style={styles.divider} />
            
            <View style={styles.recordContainer}>
              <View style={styles.recordItem}>
                <View style={styles.recordItemHeader}>
                  <Text style={styles.recordLabel}>Clock In</Text>
                </View>
                <Text style={styles.recordValue}>
                  {employeeRecords.clockIn || 'Not recorded'}
                </Text>
              </View>
              
              <View style={styles.recordItem}>
                <View style={styles.recordItemHeader}>
                  <Text style={styles.recordLabel}>Clock Out</Text>
                </View>
                <Text style={styles.recordValue}>
                  {employeeRecords.clockOut || 'Not recorded'}
                </Text>
              </View>
            </View>
            
            {/* Timer logic */}
            {employeeRecords.clockIn && !employeeRecords.clockOut && clockOutTimer > 0 && (
              <View style={{ alignItems: 'center', marginVertical: 16 }}>
                <Text style={{ fontSize: 18, color: COLORS.warning, fontWeight: 'bold' }}>
                  Time remaining before clock out:
                </Text>
                <Text style={{ fontSize: 32, color: COLORS.primary, fontWeight: 'bold', marginTop: 8 }}>
                  {formatTimer(clockOutTimer)}
                </Text>
              </View>
            )}
            
            {/* Only show a message if the attendance period has truly expired or work period ended */}
            {employeeRecords.clockIn && !employeeRecords.clockOut && timeElapsed >= FOUR_HOURS_MS && currentTime >= EXTENDED_CLOCK_OUT_TIME ? (
              <View style={{ alignItems: 'center', marginVertical: 16 }}>
                <Text style={{ fontSize: 18, color: COLORS.error, fontWeight: 'bold' }}>
                  Attendance period has expired
                </Text>
                <Text style={{ fontSize: 14, color: COLORS.text.secondary, marginTop: 8 }}>
                  You cannot clock in for today
                </Text>
              </View>
            ) : (
              <>
                {/* Only show 'Work Period Ended' if not clocked in or clocked out and work period is over */}
                {(!employeeRecords.clockIn || !!employeeRecords.clockOut) && currentTime >= WORK_END_TIME && (
                  <View style={{ alignItems: 'center', marginVertical: 16 }}>
                    <Text style={{ fontSize: 18, color: COLORS.error, fontWeight: 'bold' }}>
                      Work Period Ended
                    </Text>
                    <Text style={{ fontSize: 14, color: COLORS.text.secondary, marginTop: 8 }}>
                      The work period has ended (6:30 PM). You cannot clock in or out for today.
                    </Text>
                  </View>
                )}
                {/* No message if just waiting for timer to expire and clock out is still possible */}
              </>
            )}
            
            {/* Location Warning */}
            {isWithinRadius === false && (
              <View style={styles.locationWarning}>
                <Ionicons name="location" size={20} color={COLORS.error} />
                <Text style={styles.locationWarningText}>
                  You are {locationDistance}m away from workplace. You must be within 100m to clock in/out.
                </Text>
              </View>
            )}

            {isWithinRadius === null && (
              <View style={styles.locationWarning}>
                <Ionicons name="location-outline" size={20} color={COLORS.warning} />
                <Text style={styles.locationWarningText}>
                  Please check your location first before clocking in/out.
                </Text>
              </View>
            )}

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.clockInButton,
                  (!!employeeRecords.clockIn || timeCheck.isExpired || currentTime >= WORK_END_TIME || isWithinRadius === false || isWithinRadius === null) && styles.buttonDisabled
                ]}
                onPress={() => handleAuthenticate('clockIn', selectedEmployee.id)}
                disabled={
                  !!employeeRecords.clockIn || 
                  isAuthenticating || 
                  timeCheck.isExpired ||
                  currentTime >= WORK_END_TIME ||
                  isWithinRadius === false ||
                  isWithinRadius === null
                }
              >
                {isAuthenticating && attendanceType === 'clockIn' ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="log-in" size={24} color="#FFFFFF" />
                )}
                <Text style={styles.actionButtonText}>Clock In</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.clockOutButton,
                  (!employeeRecords.clockIn || 
                   !!employeeRecords.clockOut || 
                   currentTime < CLOCK_OUT_TIME ||
                   currentTime >= EXTENDED_CLOCK_OUT_TIME ||
                   isWithinRadius === false ||
                   isWithinRadius === null) && styles.buttonDisabled
                ]}
                onPress={() => handleAuthenticate('clockOut', selectedEmployee.id)}
                disabled={
                  !employeeRecords.clockIn ||
                  !!employeeRecords.clockOut ||
                  isAuthenticating ||
                  currentTime < CLOCK_OUT_TIME ||
                  currentTime >= EXTENDED_CLOCK_OUT_TIME ||
                  isWithinRadius === false ||
                  isWithinRadius === null
                }
              >
                {isAuthenticating && attendanceType === 'clockOut' ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="log-out" size={24} color="#FFFFFF" />
                )}
                <Text style={styles.actionButtonText}>Clock Out</Text>
              </TouchableOpacity>
            </View>
            
          </Card.Content>
        </Card>
      </ScrollView>
    );
  }

  // Fallback view (should never be shown)
  return (
    <View style={styles.container}>
      <Text>Something went wrong. Please restart the app.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.m,
    paddingTop: SPACING.l,
    paddingBottom: SPACING.m,
    backgroundColor: COLORS.primary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  backButton: {
    padding: 5,
    marginTop: SPACING.s,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: FONT_SIZES.h2,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: SPACING.m,
    marginTop: SPACING.s,
  },
  banner: {
    marginTop: 0,
    marginBottom: SPACING.m,
  },
  card: {
    margin: SPACING.m,
    elevation: 4,
  },
  attendanceCard: {
    margin: SPACING.m,
    backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.l,
    ...SHADOWS.medium,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.secondary,
  },
  attendanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.s,
  },
  attendanceTitle: {
    marginLeft: SPACING.s,
    color: COLORS.text.primary,
  },
  recordItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectedEmployeeCard: {
    margin: SPACING.m,
    backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.l,
    ...SHADOWS.medium,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  selectedEmployeeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedEmployeeDetails: {
    marginLeft: SPACING.l,
    flex: 1,
  },
  locationSection: {
    marginTop: SPACING.m,
    paddingTop: SPACING.m,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  divider: {
    marginVertical: SPACING.m,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.l,
  },
  button: {
    flex: 1,
    marginHorizontal: SPACING.xs,
  },
  recordContainer: {
    marginTop: SPACING.m,
  },
  recordItem: {
    marginBottom: SPACING.m,
    paddingVertical: SPACING.m,
    paddingHorizontal: SPACING.l,
    backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.m,
    borderWidth: 1,
    borderColor: COLORS.divider,
    ...SHADOWS.small,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recordLabel: {
    fontSize: FONT_SIZES.body,
    color: COLORS.text.primary,
    fontWeight: '600',
  },
  recordValue: {
    fontSize: FONT_SIZES.h2,
    fontWeight: '700',
    color: COLORS.primary,
    textAlign: 'right',
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
  searchBar: {
    margin: SPACING.m,
    elevation: 2,
  },
  employeeList: {
    flex: 1,
  },
  employeeCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: SPACING.m,
    marginVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.m,
    ...SHADOWS.small,
  },
  employeeCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.m,
  },
  employeeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  employeeAvatar: {
    backgroundColor: COLORS.primary,
  },
  employeeDetails: {
    marginLeft: SPACING.m,
    flex: 1,
  },
  employeeName: {
    fontSize: FONT_SIZES.body,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: 2,
  },
  employeePosition: {
    fontSize: FONT_SIZES.caption,
    color: COLORS.text.secondary,
    marginBottom: SPACING.xs,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: FONT_SIZES.caption,
    fontWeight: '600',
    marginLeft: SPACING.xs,
  },
  employeeActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fingerprintWarning: {
    backgroundColor: COLORS.warning + '20',
    borderRadius: 20,
    padding: SPACING.xs,
    marginRight: SPACING.s,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.l,
    paddingHorizontal: SPACING.m,
    borderRadius: BORDER_RADIUS.m,
    marginHorizontal: SPACING.xs,
    ...SHADOWS.small,
  },
  clockInButton: {
    backgroundColor: COLORS.primary,
    marginBottom: SPACING.xs,
    marginTop: SPACING.xs,
  },
  clockOutButton: {
    backgroundColor: COLORS.secondary,
    marginBottom: SPACING.xs,
    marginTop: SPACING.xs,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.body,
    fontWeight: 'bold',
    marginLeft: SPACING.s,
  },
  locationWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.error + '20',
    padding: SPACING.m,
    borderRadius: BORDER_RADIUS.s,
    marginVertical: SPACING.s,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.error,
  },
  locationWarningText: {
    flex: 1,
    marginLeft: SPACING.s,
    fontSize: FONT_SIZES.caption,
    color: COLORS.error,
    fontWeight: '500',
  },
});

export default AttendanceScreen; 