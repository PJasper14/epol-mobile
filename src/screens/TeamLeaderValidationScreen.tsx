import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '../utils/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PhotoViewerModal from '../components/PhotoViewerModal';
import { apiService } from '../services/ApiService';
import { useAuth } from '../context/AuthContext';

interface Employee {
  id: string;
  name: string;
  position: string;
  timeIn?: string;
  timeOut?: string;
}

interface Validation {
  employeeId: string;
  remarks: string;
  evidence: string[];
  validatedAt: string;
}

interface WatermarkData {
  uri: string;
  timestamp: string;
  location: {
    latitude: number;
    longitude: number;
  };
  employeeName: string;
  validationType: string;
}


const TeamLeaderValidationScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [remarks, setRemarks] = useState('');
  const [evidence, setEvidence] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showPhotoViewer, setShowPhotoViewer] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    // Filter employees based on search query
    if (searchQuery.trim() === '') {
      setFilteredEmployees(employees);
    } else {
      const filtered = employees.filter(employee =>
        employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        employee.position.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredEmployees(filtered);
    }
  }, [searchQuery, employees]);

  const loadEmployeesFromAPI = async () => {
    try {
      const response = await apiService.getUsers();
      if (response.data) {
        let filteredUsers = [];
        
        if (user?.role === 'team_leader') {
          // Team leaders see only their team members (same location assignment)
          const currentUserAssignment = user.current_assignment;
          if (currentUserAssignment?.workplace_location) {
            const currentLocationId = currentUserAssignment.workplace_location.id;
            filteredUsers = response.data.filter((u: any) => {
              // Include the team leader themselves
              if (u.id === user.id) return true;
              // Include other users assigned to the same location
              return u.current_assignment?.workplace_location?.id === currentLocationId;
            });
          } else {
            // If no assignment, only show themselves
            filteredUsers = response.data.filter((u: any) => u.id === user.id);
          }
        } else {
          // EPOL and other roles see all EPOL and team leader users
          filteredUsers = response.data.filter((u: any) => 
            u.role === 'epol' || u.role === 'team_leader'
          );
        }
        
        // Transform the API response to match the expected format
        const transformedEmployees = filteredUsers.map((user: any) => ({
          id: user.id.toString(),
          name: `${user.first_name} ${user.last_name}`,
          position: user.role === 'epol' ? 'EPOL Officer' : 
                   user.role === 'team_leader' ? 'Team Leader' : 
                   user.role === 'street_sweeper' ? 'Street Sweeper' :
                   user.role || 'Officer',
          registered: true
        }));
        return transformedEmployees;
      }
      return [];
    } catch (error) {
      console.error('Error loading employees:', error);
      Alert.alert('Error', 'Failed to load employees');
      return [];
    }
  };

  const loadEmployees = async () => {
    try {
      setLoading(true);
      // First, get today's attendance records
      const today = new Date().toISOString().split('T')[0];
      const attendanceData = await AsyncStorage.getItem('attendance_records');
      const attendanceRecords = attendanceData ? JSON.parse(attendanceData) : {};

      // Get today's records
      const todayRecords = attendanceRecords[today] || {};

      // Load employees from API first
      const apiEmployees = await loadEmployeesFromAPI();
      
      // Map employees with their attendance records
      const employeesWithAttendance = apiEmployees.map(employee => {
        const employeeRecord = todayRecords[employee.id] || {};
        const timeIn = employeeRecord.clockIn;
        const timeOut = employeeRecord.clockOut;

        return {
          ...employee,
          timeIn,
          timeOut,
        };
      });

      setEmployees(employeesWithAttendance);
      setFilteredEmployees(employeesWithAttendance);
    } catch (error) {
      console.error('Error loading employees:', error);
      Alert.alert('Error', 'Failed to load employee attendance records');
    } finally {
      setLoading(false);
    }
  };

  const takePicture = async () => {
    // Request camera permissions
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Camera Permission Required',
        'Please grant camera permissions to capture evidence photos.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Request location permissions
    const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
    if (locationStatus !== 'granted') {
      Alert.alert(
        'Location Permission Required',
        'Please grant location permissions to add location watermark to evidence photos.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false, // Disable editing to prevent gallery access
        quality: 0.8,
        exif: false, // Remove EXIF data for security
        cameraType: ImagePicker.CameraType.back, // Force back camera
        allowsMultipleSelection: false, // Ensure only one photo at a time
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        
        // Create watermark data
        const watermarkData = {
          uri: asset.uri,
          timestamp: new Date().toISOString(),
          location: {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          },
          employeeName: selectedEmployee?.name || 'Unknown',
          validationType: 'Attendance Validation',
        };

        // Store the image with watermark data
        const newEvidence = [...evidence, JSON.stringify(watermarkData)];
        setEvidence(newEvidence);
        
        // Show success feedback
        Alert.alert(
          'Photo Captured',
          'Evidence photo with location and timestamp has been added successfully.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
    }
  };

  const removeImage = (index: number) => {
    Alert.alert(
      'Remove Evidence',
      'Are you sure you want to remove this evidence photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => setEvidence(evidence.filter((_, i) => i !== index))
        }
      ]
    );
  };

  const viewImage = (index: number) => {
    setSelectedImageIndex(index);
    setShowImageModal(true);
  };

  const openPhotoViewer = (index: number) => {
    setCurrentPhotoIndex(index);
    setShowPhotoViewer(true);
  };

  // Helper function to extract image URIs from evidence data
  const getImageUris = () => {
    return evidence.map(evidenceItem => {
      try {
        const parsed = JSON.parse(evidenceItem) as WatermarkData;
        return parsed.uri || evidenceItem;
      } catch {
        return evidenceItem;
      }
    });
  };

  // Helper function to get watermark text for current image
  const getCurrentWatermarkText = () => {
    if (evidence.length === 0 || currentPhotoIndex >= evidence.length) return '';
    
    try {
      const evidenceItem = evidence[currentPhotoIndex];
      const parsed = JSON.parse(evidenceItem) as WatermarkData;
      if (parsed) {
        return `${new Date(parsed.timestamp).toLocaleString()}\n${parsed.location.latitude.toFixed(6)}, ${parsed.location.longitude.toFixed(6)}\n${parsed.employeeName}\nEPOL Validation`;
      }
    } catch {
      // If parsing fails, return empty string
    }
    return '';
  };


  const handlePhotoIndexChange = (index: number) => {
    setCurrentPhotoIndex(index);
  };

  const getAttendanceStatus = (employee: Employee) => {
    if (employee.timeIn && employee.timeOut) {
      return { status: 'Completed', color: COLORS.success };
    } else if (employee.timeIn) {
      return { status: 'In Progress', color: COLORS.warning };
    } else {
      return { status: 'Not Started', color: COLORS.error };
    }
  };

  const handleSubmit = async () => {
    if (!selectedEmployee) {
      Alert.alert('Error', 'Please select an employee first');
      return;
    }

    if (!remarks.trim()) {
      Alert.alert('Error', 'Please enter your remarks');
      return;
    }

    if (remarks.trim().length < 10) {
      Alert.alert('Error', 'Please provide more detailed remarks (at least 10 characters)');
      return;
    }

    if (evidence.length === 0) {
      Alert.alert(
        'Evidence Required',
        'Please capture at least one evidence photo before submitting.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Confirm Validation',
      `Are you sure you want to submit validation for ${selectedEmployee.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Submit', onPress: submitValidation }
      ]
    );
  };

  const submitValidation = async () => {
    try {
      setLoading(true);
      
      // Get existing validations
      const existingValidations = await AsyncStorage.getItem('validations');
      const validations: Validation[] = existingValidations ? JSON.parse(existingValidations) : [];
      
      // Create new validation
      const newValidation: Validation = {
        employeeId: selectedEmployee!.id,
        remarks: remarks.trim(),
        evidence,
        validatedAt: new Date().toISOString(),
      };
      
      // Add new validation to list
      const updatedValidations = [newValidation, ...validations];
      
      // Save to AsyncStorage
      await AsyncStorage.setItem('validations', JSON.stringify(updatedValidations));
      
      Alert.alert(
        'Success', 
        `Validation submitted successfully for ${selectedEmployee!.name}`,
        [
          { 
            text: 'OK', 
            onPress: () => {
              setSelectedEmployee(null);
              setRemarks('');
              setEvidence([]);
              setSearchQuery('');
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error saving validation:', error);
      Alert.alert('Error', 'Failed to save validation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!selectedEmployee) {
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
            <Text style={styles.title}>EPOL Validation</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color={COLORS.text.secondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search employees..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={COLORS.text.secondary}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={COLORS.text.secondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading employees...</Text>
          </View>
        ) : (
          <ScrollView style={styles.employeeList}>
            {filteredEmployees.length > 0 ? (
              filteredEmployees.map((employee) => {
                const attendanceStatus = getAttendanceStatus(employee);
                return (
                  <TouchableOpacity
                    key={employee.id}
                    style={styles.employeeItem}
                    onPress={() => setSelectedEmployee(employee)}
                  >
                    <View style={styles.employeeInfo}>
                      <View style={styles.employeeHeader}>
                        <Text style={styles.employeeName}>{employee.name}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: attendanceStatus.color + '20' }]}>
                          <Text style={[styles.statusText, { color: attendanceStatus.color }]}>
                            {attendanceStatus.status}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.employeePosition}>{employee.position}</Text>
                      <View style={styles.timeContainer}>
                        <View style={styles.timeItem}>
                          <Ionicons name="time" size={16} color={COLORS.text.secondary} />
                          <Text style={styles.timeText}>
                            In: {employee.timeIn || 'Not recorded'}
                          </Text>
                        </View>
                        <View style={styles.timeItem}>
                          <Ionicons name="time" size={16} color={COLORS.text.secondary} />
                          <Text style={styles.timeText}>
                            Out: {employee.timeOut || 'Not recorded'}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color={COLORS.text.secondary} />
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={64} color={COLORS.text.secondary} />
                <Text style={styles.emptyStateText}>
                  {searchQuery ? 'No employees found matching your search' : 'No employees found for today'}
                </Text>
                {searchQuery && (
                  <TouchableOpacity 
                    style={styles.clearSearchButton}
                    onPress={() => setSearchQuery('')}
                  >
                    <Text style={styles.clearSearchText}>Clear Search</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </ScrollView>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => {
            setSelectedEmployee(null);
            setRemarks('');
            setEvidence([]);
            setSearchQuery('');
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Validate Attendance</Text>
        </View>
      </View>

      <ScrollView style={styles.formContainer} contentContainerStyle={styles.scrollContent}>
        {/* Employee Info Card */}
        <View style={styles.employeeCard}>
          <View style={styles.employeeCardHeader}>
            <View style={styles.employeeAvatar}>
              <Text style={styles.employeeInitial}>
                {selectedEmployee.name.charAt(0)}
              </Text>
            </View>
            <View style={styles.employeeDetails}>
              <Text style={styles.employeeCardName}>{selectedEmployee.name}</Text>
              <Text style={styles.employeeCardPosition}>{selectedEmployee.position}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getAttendanceStatus(selectedEmployee).color + '20' }]}>
              <Text style={[styles.statusText, { color: getAttendanceStatus(selectedEmployee).color }]}>
                {getAttendanceStatus(selectedEmployee).status}
              </Text>
            </View>
          </View>
          <View style={styles.attendanceTimes}>
            <View style={styles.timeRow}>
              <Ionicons name="time" size={16} color={COLORS.primary} />
              <Text style={styles.timeLabel}>Clock In:</Text>
              <Text style={styles.timeValue}>{selectedEmployee.timeIn || 'Not recorded'}</Text>
            </View>
            <View style={styles.timeRow}>
              <Ionicons name="time" size={16} color={COLORS.primary} />
              <Text style={styles.timeLabel}>Clock Out:</Text>
              <Text style={styles.timeValue}>{selectedEmployee.timeOut || 'Not recorded'}</Text>
            </View>
          </View>
        </View>

        {/* Submit Button Container with Form Sections */}
        <View style={styles.submitButtonContainer}>
          {/* Remarks Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Validation Remarks</Text>
            <TextInput
              style={styles.remarksInput}
              multiline
              numberOfLines={6}
              value={remarks}
              onChangeText={setRemarks}
              placeholder="Enter your detailed remarks here... (minimum 10 characters)"
              placeholderTextColor={COLORS.text.secondary}
              textAlignVertical="top"
            />
            <Text style={styles.characterCount}>
              {remarks.length}/10 minimum characters
            </Text>
          </View>

          {/* Evidence Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Evidence Photos</Text>
              <Text style={styles.sectionSubtitle}>Capture photos as proof of validation (camera only)</Text>
            </View>
            
            <TouchableOpacity style={styles.cameraButton} onPress={takePicture}>
              <View style={styles.cameraButtonContent}>
                <Ionicons name="camera" size={32} color="#FFFFFF" />
                <Text style={styles.cameraButtonText}>Take Evidence Photo</Text>
              </View>
            </TouchableOpacity>

            {evidence.length > 0 && (
              <View style={styles.evidenceGrid}>
                {evidence.map((evidenceItem, index) => {
                  let imageUri = evidenceItem;
                  let watermarkData: WatermarkData | null = null;
                  
                  // Check if it's a watermark data object or just a URI
                  try {
                    const parsed = JSON.parse(evidenceItem) as WatermarkData;
                    if (parsed.uri) {
                      imageUri = parsed.uri;
                      watermarkData = parsed;
                    }
                  } catch {
                    // It's just a URI string
                    imageUri = evidenceItem;
                  }

                  return (
                    <TouchableOpacity
                      key={index}
                      style={styles.evidenceItem}
                      onPress={() => openPhotoViewer(index)}
                    >
                      <Image source={{ uri: imageUri }} style={styles.evidenceImage} />
                      <View style={styles.evidenceOverlay}>
                        <Ionicons name="eye" size={20} color="#FFFFFF" />
                      </View>
                      <TouchableOpacity
                        style={styles.evidenceRemoveButton}
                        onPress={() => removeImage(index)}
                      >
                        <Ionicons name="close" size={16} color="#FFFFFF" />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {evidence.length === 0 && (
              <View style={styles.noEvidenceContainer}>
                <Ionicons name="camera-outline" size={48} color={COLORS.text.secondary} />
                <Text style={styles.noEvidenceText}>No evidence photos captured yet</Text>
                <Text style={styles.noEvidenceSubtext}>Tap the camera button above to add evidence</Text>
              </View>
            )}
          </View>

          {/* Submit Button */}
          <TouchableOpacity 
            style={[
              styles.submitButton, 
              (loading || remarks.length < 10 || evidence.length === 0) && styles.submitButtonDisabled
            ]} 
            onPress={handleSubmit}
            disabled={loading || remarks.length < 10 || evidence.length === 0}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
            )}
            <Text style={styles.submitButtonText}>
              {loading ? 'Submitting...' : 'Submit Validation'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Photo Viewer Modal */}
      <PhotoViewerModal
        visible={showPhotoViewer}
        images={getImageUris()}
        currentIndex={currentPhotoIndex}
        onClose={() => setShowPhotoViewer(false)}
        onIndexChange={handlePhotoIndexChange}
        watermarkText={getCurrentWatermarkText()}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
  title: {
    fontSize: FONT_SIZES.h2,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: SPACING.m,
    marginTop: SPACING.s,
  },
  subtitle: {
    fontSize: FONT_SIZES.body,
    color: '#FFFFFF',
    marginTop: SPACING.xs,
    opacity: 0.9,
  },
  searchContainer: {
    padding: SPACING.m,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.l,
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.s,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  searchInput: {
    flex: 1,
    marginLeft: SPACING.s,
    fontSize: FONT_SIZES.body,
    color: COLORS.text.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  loadingText: {
    marginTop: SPACING.m,
    fontSize: FONT_SIZES.body,
    color: COLORS.text.secondary,
  },
  employeeList: {
    flex: 1,
    padding: SPACING.m,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyStateText: {
    fontSize: FONT_SIZES.body,
    color: COLORS.text.secondary,
    marginTop: SPACING.m,
    textAlign: 'center',
  },
  clearSearchButton: {
    marginTop: SPACING.m,
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.s,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.s,
  },
  clearSearchText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.caption,
    fontWeight: '600',
  },
  employeeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: SPACING.l,
    borderRadius: BORDER_RADIUS.l,
    marginBottom: SPACING.m,
    ...SHADOWS.medium,
    borderWidth: 1,
    borderColor: COLORS.divider,
    marginHorizontal: SPACING.xs,
  },
  employeeInfo: {
    flex: 1,
  },
  employeeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.s,
  },
  employeeName: {
    fontSize: FONT_SIZES.h2,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    flex: 1,
  },
  employeePosition: {
    fontSize: FONT_SIZES.body,
    color: COLORS.text.secondary,
    marginBottom: SPACING.s,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.s,
    borderRadius: BORDER_RADIUS.l,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  statusText: {
    fontSize: FONT_SIZES.body,
    fontWeight: '700',
  },
  timeContainer: {
    gap: SPACING.s,
    backgroundColor: COLORS.background,
    padding: SPACING.s,
    borderRadius: BORDER_RADIUS.s,
    marginTop: SPACING.xs,
  },
  timeItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: FONT_SIZES.body,
    color: COLORS.text.primary,
    marginLeft: SPACING.s,
    fontWeight: '600',
  },
  formContainer: {
    flex: 1,
    padding: SPACING.m,
  },
  scrollContent: {
    paddingBottom: SPACING.xl,
  },
  employeeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.m,
    padding: SPACING.m,
    marginBottom: SPACING.l,
    ...SHADOWS.small,
  },
  employeeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.m,
  },
  employeeAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.m,
  },
  employeeInitial: {
    fontSize: FONT_SIZES.h2,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  employeeDetails: {
    flex: 1,
  },
  employeeCardName: {
    fontSize: FONT_SIZES.h2,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: 2,
  },
  employeeCardPosition: {
    fontSize: FONT_SIZES.body,
    color: COLORS.text.secondary,
  },
  attendanceTimes: {
    backgroundColor: COLORS.background,
    padding: SPACING.m,
    borderRadius: BORDER_RADIUS.s,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  timeLabel: {
    fontSize: FONT_SIZES.caption,
    color: COLORS.text.secondary,
    marginLeft: SPACING.xs,
    marginRight: SPACING.s,
    minWidth: 70,
  },
  timeValue: {
    fontSize: FONT_SIZES.caption,
    color: COLORS.text.primary,
    fontWeight: '600',
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionHeader: {
    marginBottom: SPACING.m,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.h2,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  sectionSubtitle: {
    fontSize: FONT_SIZES.caption,
    color: COLORS.text.secondary,
  },
  remarksInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.m,
    padding: SPACING.m,
    borderWidth: 1,
    borderColor: COLORS.divider,
    fontSize: FONT_SIZES.body,
    color: COLORS.text.primary,
    minHeight: 120,
  },
  characterCount: {
    fontSize: FONT_SIZES.caption,
    color: COLORS.text.secondary,
    textAlign: 'right',
    marginTop: SPACING.xs,
  },
  cameraButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.m,
    padding: SPACING.l,
    marginBottom: SPACING.m,
    ...SHADOWS.small,
  },
  cameraButtonContent: {
    alignItems: 'center',
  },
  cameraButtonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.body,
    fontWeight: 'bold',
    marginTop: SPACING.s,
  },
  cameraButtonSubtext: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.caption,
    marginTop: SPACING.xs,
    opacity: 0.8,
  },
  evidenceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.s,
  },
  evidenceItem: {
    position: 'relative',
    width: 100,
    height: 100,
    borderRadius: BORDER_RADIUS.s,
    overflow: 'hidden',
  },
  evidenceImage: {
    width: '100%',
    height: '100%',
  },
  evidenceOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  evidenceRemoveButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: COLORS.error,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noEvidenceContainer: {
    alignItems: 'center',
    padding: SPACING.xl,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.m,
    borderWidth: 2,
    borderColor: COLORS.divider,
    borderStyle: 'dashed',
  },
  noEvidenceText: {
    fontSize: FONT_SIZES.body,
    color: COLORS.text.secondary,
    marginTop: SPACING.m,
    textAlign: 'center',
  },
  noEvidenceSubtext: {
    fontSize: FONT_SIZES.caption,
    color: COLORS.text.secondary,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  submitButtonContainer: {
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.xl,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    marginTop: SPACING.xs,
    borderRadius: BORDER_RADIUS.m,
    ...SHADOWS.small,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    padding: SPACING.m,
    borderRadius: BORDER_RADIUS.m,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.medium,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.body,
    fontWeight: 'bold',
    marginLeft: SPACING.s,
  },
});

export default TeamLeaderValidationScreen; 