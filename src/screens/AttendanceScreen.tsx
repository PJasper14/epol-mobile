import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Button, Card, Title, Paragraph, Divider, ActivityIndicator, Surface, List, Avatar, Searchbar, Banner } from 'react-native-paper';
import * as LocalAuthentication from 'expo-local-authentication';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SPACING } from '../utils/theme';

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
  const timerInterval = useRef<NodeJS.Timeout | null>(null);

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

  const handleAuthenticate = async (type: 'clockIn' | 'clockOut', employeeId: string) => {
    setIsAuthenticating(true);
    
    try {
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
        <Surface style={styles.header}>
          <Text style={styles.headerTitle}>Biometric Attendance</Text>
          <Text style={styles.headerSubtitle}>Select an employee to record attendance</Text>
        </Surface>
        
        {showBanner && (
          <Banner
            visible={true}
            icon={({size}) => <MaterialCommunityIcons name="information" size={size} color={COLORS.primary} />}
            actions={[
              {
                label: 'Got it',
                onPress: () => setShowBanner(false),
              },
            ]}
            style={styles.banner}
          >
            Select an employee first, then use fingerprint to clock in or out
          </Banner>
        )}
        
        <Searchbar
          placeholder="Search employees..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
        
        <ScrollView style={styles.employeeList}>
          {filteredEmployees.map(employee => {
            // Calculate status for the employee
            const today = new Date().toISOString().split('T')[0];
            const employeeRecords = attendanceRecords[today]?.[employee.id] || {};
            let status = "Not clocked in";
            let statusColor = COLORS.warning;
            
            if (employeeRecords.clockIn && employeeRecords.clockOut) {
              status = "Completed";
              statusColor = COLORS.success;
            } else if (employeeRecords.clockIn) {
              status = "Clocked in";
              statusColor = COLORS.info;
            }
            
            return (
              <List.Item
                key={employee.id}
                title={employee.name}
                description={props => (
                  <View>
                    <Text style={{color: COLORS.text.secondary}}>{employee.position}</Text>
                    <Text style={{color: statusColor, marginTop: 4}}>{status}</Text>
                  </View>
                )}
                left={props => (
                  <Avatar.Text 
                    {...props} 
                    size={50} 
                    label={employee.name.substring(0, 1)} 
                    style={[{ backgroundColor: COLORS.primary }, props.style]}
                  />
                )}
                right={props => (
                  <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    {!employee.registered && (
                      <MaterialCommunityIcons 
                        name="fingerprint-off" 
                        size={24} 
                        color={COLORS.warning} 
                        style={{marginRight: 8}} 
                      />
                    )}
                    <MaterialCommunityIcons 
                      name="chevron-right" 
                      size={24} 
                      color={COLORS.text.secondary} 
                    />
                  </View>
                )}
                onPress={() => handleEmployeeSelect(employee)}
                style={styles.employeeItem}
              />
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
        <Surface style={styles.header}>
          <Text style={styles.headerTitle}>Biometric Attendance</Text>
          <Text style={styles.headerSubtitle}>Manage employee attendance</Text>
        </Surface>
        
        <Card style={styles.selectedEmployeeCard}>
          <Card.Content>
            <View style={styles.selectedEmployeeContent}>
              <Avatar.Text 
                size={60} 
                label={selectedEmployee.name.substring(0, 1)} 
                style={{ backgroundColor: COLORS.primary }}
              />
              <View style={styles.selectedEmployeeDetails}>
                <Title style={styles.employeeName}>{selectedEmployee.name}</Title>
                <Paragraph style={styles.employeePosition}>{selectedEmployee.position}</Paragraph>
                
                <View style={styles.statusChip}>
                  {!employeeRecords.clockIn && (
                    <Text style={styles.statusChipText}>Not clocked in</Text>
                  )}
                  {employeeRecords.clockIn && !employeeRecords.clockOut && (
                    <Text style={[styles.statusChipText, {backgroundColor: '#E3F2FD', color: '#1976D2'}]}>
                      Clocked in at {employeeRecords.clockIn}
                    </Text>
                  )}
                  {employeeRecords.clockIn && employeeRecords.clockOut && (
                    <Text style={[styles.statusChipText, {backgroundColor: '#E8F5E9', color: '#388E3C'}]}>
                      Completed attendance
                    </Text>
                  )}
                </View>
              </View>
            </View>
          </Card.Content>
        </Card>
        
        <Card style={styles.card}>
          <Card.Content>
            <Title>Today's Attendance</Title>
            <Divider style={styles.divider} />
            
            <View style={styles.recordContainer}>
              <View style={styles.recordItem}>
                <Text style={styles.recordLabel}>Clock In</Text>
                <Text style={styles.recordValue}>
                  {employeeRecords.clockIn || 'Not recorded'}
                </Text>
              </View>
              
              <View style={styles.recordItem}>
                <Text style={styles.recordLabel}>Clock Out</Text>
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
            
            <View style={styles.buttonContainer}>
              <Button
                mode="contained"
                onPress={() => handleAuthenticate('clockIn', selectedEmployee.id)}
                disabled={
                  !!employeeRecords.clockIn || 
                  isAuthenticating || 
                  timeCheck.isExpired ||
                  currentTime >= WORK_END_TIME
                }
                loading={isAuthenticating && attendanceType === 'clockIn'}
                style={[styles.button, { 
                  backgroundColor: COLORS.primary, 
                  opacity: (!!employeeRecords.clockIn || timeCheck.isExpired || currentTime >= WORK_END_TIME) ? 0.5 : 1 
                }]}
                icon={({ size, color }) => (
                  <Ionicons name="finger-print" size={size} color={color} />
                )}
              >
                Clock In
              </Button>
              
              <Button
                mode="contained"
                onPress={() => handleAuthenticate('clockOut', selectedEmployee.id)}
                disabled={
                  !employeeRecords.clockIn ||
                  !!employeeRecords.clockOut ||
                  isAuthenticating ||
                  currentTime < CLOCK_OUT_TIME ||
                  currentTime >= EXTENDED_CLOCK_OUT_TIME
                }
                loading={isAuthenticating && attendanceType === 'clockOut'}
                style={[styles.button, {
                  backgroundColor: COLORS.secondary,
                  opacity:
                    (!employeeRecords.clockIn || 
                     !!employeeRecords.clockOut || 
                     currentTime < CLOCK_OUT_TIME ||
                     currentTime >= EXTENDED_CLOCK_OUT_TIME)
                      ? 0.5
                      : 1
                }]}
                icon={({ size, color }) => (
                  <Ionicons name="finger-print" size={size} color={color} />
                )}
              >
                Clock Out
              </Button>
            </View>
            
            <Button
              mode="outlined"
              onPress={() => {
                setSelectedEmployee(null);
                setShowEmployeeSelector(true);
              }}
              style={styles.backButton}
            >
              Back to Employee List
            </Button>
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
    backgroundColor: COLORS.primary,
    padding: SPACING.l,
    elevation: 4,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#FFFFFF',
    fontSize: 16,
    opacity: 0.9,
    marginTop: 4,
  },
  banner: {
    marginTop: 0,
    marginBottom: SPACING.m,
  },
  card: {
    margin: SPACING.m,
    elevation: 4,
  },
  selectedEmployeeCard: {
    margin: SPACING.m,
    elevation: 3,
    backgroundColor: '#FFFFFF',
  },
  selectedEmployeeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedEmployeeDetails: {
    marginLeft: SPACING.l,
    flex: 1,
  },
  employeeName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  employeePosition: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  statusChip: {
    marginTop: SPACING.s,
  },
  statusChipText: {
    backgroundColor: '#FFEBEE',
    color: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    fontSize: 12,
    alignSelf: 'flex-start',
    marginTop: 4,
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
  backButton: {
    marginTop: SPACING.l,
    borderColor: COLORS.primary,
    borderWidth: 1,
  },
  recordContainer: {
    marginTop: SPACING.m,
  },
  recordItem: {
    marginBottom: SPACING.m,
  },
  recordLabel: {
    fontSize: 16,
    color: COLORS.text.secondary,
    marginBottom: 4,
  },
  recordValue: {
    fontSize: 18,
    fontWeight: '500',
    color: COLORS.text.primary,
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
  employeeItem: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    paddingVertical: SPACING.s,
  },
});

export default AttendanceScreen; 