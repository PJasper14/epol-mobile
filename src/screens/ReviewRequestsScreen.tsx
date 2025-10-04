import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '../utils/theme';
import { apiService } from '../services/ApiService';
import { useAuth } from '../context/AuthContext';

interface Employee {
  id: string;
  name: string;
  position: string;
  currentLocationId?: string;
  currentLocation?: string;
}

interface Location {
  id: string;
  name: string;
  address: string;
}

interface ReassignmentRequest {
  employeeId: string;
  requestType: 'reassignment' | 'redeployment';
  currentLocationId: string;
  requestedLocationId: string;
  reason: string;
  requestDate: string;
  status: 'pending' | 'approved' | 'rejected';
}

const ReassignmentRequestScreen: React.FC = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [isCurrentLocation, setIsCurrentLocation] = useState(true);
  
  // Form state
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [currentLocationId, setCurrentLocationId] = useState<string>('');
  const [requestedLocationId, setRequestedLocationId] = useState<string>('');
  const [reason, setReason] = useState('');


  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load employees and locations from API
      const [employeesResponse, locationsResponse] = await Promise.all([
        apiService.getUsers(),
        apiService.getWorkplaceLocations()
      ]);

      if (employeesResponse.data) {
        // Filter employees based on team leader's location assignment
        let filteredUsers = [];
        
        if (user?.role === 'team_leader' && user.current_assignment?.workplace_location) {
          // For team leaders, show only their team members (same location assignment)
          const currentLocationId = user.current_assignment.workplace_location.id;
          filteredUsers = employeesResponse.data.filter((u: any) => {
            // Include the team leader themselves
            if (u.id === user.id) return true;
            // Include EPOL officers assigned to the same location
            return u.role === 'epol' && u.current_assignment?.workplace_location?.id === currentLocationId;
          });
        } else {
          // For other roles, show all users except admins
          filteredUsers = employeesResponse.data.filter((u: any) => u.role !== 'admin');
        }
        
        // Transform employees data
        const transformedEmployees = filteredUsers.map((user: any) => ({
          id: user.id.toString(),
          name: `${user.first_name} ${user.last_name}`,
          position: user.role === 'epol' ? 'EPOL Officer' : 
                   user.role === 'team_leader' ? 'Team Leader' : 
                   user.role === 'street_sweeper' ? 'Street Sweeper' : 
                   user.role || 'Officer',
          currentLocationId: user.current_assignment?.workplace_location_id?.toString(),
          currentLocation: user.current_assignment?.workplace_location?.name || 'No assignment'
        }));
        setEmployees(transformedEmployees);
      }

      if (locationsResponse.data) {
        // Transform locations data
        const transformedLocations = locationsResponse.data.map((location: any) => ({
          id: location.id.toString(),
          name: location.name,
          address: location.address
        }));
        setLocations(transformedLocations);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeSelect = (employee: Employee) => {
    setSelectedEmployee(employee);
    setCurrentLocationId(employee.currentLocationId || '');
    setShowEmployeeModal(false);
  };

  const handleLocationSelect = (locationId: string) => {
    if (isCurrentLocation) {
      setCurrentLocationId(locationId);
    } else {
      setRequestedLocationId(locationId);
    }
    setShowLocationModal(false);
  };

  const handleSubmit = async () => {
    if (!selectedEmployee) {
      Alert.alert('Error', 'Please select an employee');
      return;
    }

    if (!currentLocationId || !requestedLocationId) {
      Alert.alert('Error', 'Please select both current and requested locations');
      return;
    }

    if (currentLocationId === requestedLocationId) {
      Alert.alert('Error', 'Current and requested locations cannot be the same');
      return;
    }

    if (!reason.trim()) {
      Alert.alert('Error', 'Please provide a reason for the request');
      return;
    }

    setSubmitting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Alert.alert(
        'Success',
        `Reassignment/Redeployment request submitted successfully for ${selectedEmployee.name}`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Reset form
              setSelectedEmployee(null);
              setCurrentLocationId('');
              setRequestedLocationId('');
              setReason('');
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const getLocationName = (locationId: string) => {
    const location = locations.find(loc => loc.id === locationId);
    return location ? location.name : 'Unknown Location';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          <View style={styles.formCard}>
            {/* Employee Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Select Employee</Text>
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => setShowEmployeeModal(true)}
              >
                <View style={styles.selectButtonContent}>
                  <Ionicons name="person" size={20} color={COLORS.primary} />
                  <Text style={[
                    styles.selectButtonText,
                    !selectedEmployee && styles.selectButtonPlaceholder
                  ]}>
                    {selectedEmployee ? selectedEmployee.name : 'Select an employee'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color={COLORS.text.secondary} />
                </View>
              </TouchableOpacity>
              {selectedEmployee && (
                <View style={styles.selectedInfo}>
                  <Text style={styles.selectedInfoText}>
                    {selectedEmployee.position} • {selectedEmployee.currentLocation}
                  </Text>
                </View>
              )}
            </View>

            {/* Current Location */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Current Location</Text>
              {selectedEmployee ? (
                <View style={[styles.selectButton, styles.readOnlyButton]}>
                  <View style={styles.selectButtonContent}>
                    <Ionicons name="location-outline" size={20} color={COLORS.primary} />
                    <Text style={styles.selectButtonText}>
                      {currentLocationId ? getLocationName(currentLocationId) : 'No assignment'}
                    </Text>
                    <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                  </View>
                </View>
              ) : (
                <View style={[styles.selectButton]}>
                  <View style={styles.selectButtonContent}>
                    <Ionicons name="location-outline" size={20} color={COLORS.text.secondary} />
                    <Text style={[styles.selectButtonText, styles.selectButtonPlaceholder]}>
                      Select an employee
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* Requested Location */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Requested Location</Text>
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => {
                  setIsCurrentLocation(false);
                  setShowLocationModal(true);
                }}
              >
                <View style={styles.selectButtonContent}>
                  <Ionicons name="location" size={20} color={COLORS.primary} />
                  <Text style={[
                    styles.selectButtonText,
                    !requestedLocationId && styles.selectButtonPlaceholder
                  ]}>
                    {requestedLocationId ? getLocationName(requestedLocationId) : 'Select requested location'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color={COLORS.text.secondary} />
                </View>
              </TouchableOpacity>
            </View>

            {/* Reason */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Reason for Request <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <TextInput
                style={styles.reasonInput}
                placeholder="Please provide a detailed reason for this request..."
                value={reason}
                onChangeText={setReason}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Ionicons name="send" size={20} color="white" />
                <Text style={styles.submitButtonText}>
                  Submit Request
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Employee Selection Modal */}
      <Modal
        visible={showEmployeeModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setShowEmployeeModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={COLORS.text.primary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Employee</Text>
            <View style={{ width: 24 }} />
          </View>
          <ScrollView style={styles.modalContent}>
            {employees.map((employee) => (
              <TouchableOpacity
                key={employee.id}
                style={styles.employeeItem}
                onPress={() => handleEmployeeSelect(employee)}
              >
                <View style={styles.employeeInfo}>
                  <Text style={styles.employeeName}>{employee.name}</Text>
                  <Text style={styles.employeePosition}>{employee.position}</Text>
                  <Text style={styles.employeeLocation}>{employee.currentLocation}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.text.secondary} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* Location Selection Modal */}
      <Modal
        visible={showLocationModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setShowLocationModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={COLORS.text.primary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              Select {isCurrentLocation ? 'Current' : 'Requested'} Location
            </Text>
            <View style={{ width: 24 }} />
          </View>
          <ScrollView style={styles.modalContent}>
            {locations
              .filter((location) => {
                // When selecting requested location, exclude the current location
                if (!isCurrentLocation && currentLocationId) {
                  return location.id !== currentLocationId;
                }
                return true;
              })
              .map((location) => (
              <TouchableOpacity
                key={location.id}
                style={styles.locationItem}
                onPress={() => handleLocationSelect(location.id)}
              >
                <View style={styles.locationInfo}>
                  <Text style={styles.locationName}>{location.name}</Text>
                  <Text style={styles.locationAddress}>{location.address}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.text.secondary} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: SPACING.m,
    fontSize: FONT_SIZES.body,
    color: COLORS.text.secondary,
  },
  scrollView: {
    flex: 1,
  },
  formContainer: {
    padding: SPACING.l,
  },
  formCard: {
    backgroundColor: 'white',
    borderRadius: BORDER_RADIUS.l,
    padding: SPACING.l,
    marginBottom: SPACING.l,
    ...SHADOWS.medium,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.body,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: SPACING.m,
  },
  selectButton: {
    backgroundColor: 'white',
    borderRadius: BORDER_RADIUS.m,
    borderWidth: 1,
    borderColor: COLORS.divider,
    ...SHADOWS.small,
  },
  readOnlyButton: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  selectButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.m,
    gap: SPACING.s,
  },
  selectButtonText: {
    flex: 1,
    fontSize: FONT_SIZES.body,
    color: COLORS.text.primary,
  },
  selectButtonPlaceholder: {
    color: COLORS.text.secondary,
  },
  selectedInfo: {
    marginTop: SPACING.s,
    padding: SPACING.s,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.s,
  },
  selectedInfoText: {
    fontSize: FONT_SIZES.caption,
    color: COLORS.text.secondary,
  },
  reasonInput: {
    backgroundColor: 'white',
    borderRadius: BORDER_RADIUS.m,
    borderWidth: 1,
    borderColor: COLORS.divider,
    padding: SPACING.m,
    fontSize: FONT_SIZES.body,
    textAlignVertical: 'top',
    minHeight: 100,
    ...SHADOWS.small,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.l,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.m,
    gap: SPACING.s,
    ...SHADOWS.medium,
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.text.secondary,
  },
  submitButtonText: {
    fontSize: FONT_SIZES.body,
    fontWeight: 'bold',
    color: 'white',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.l,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  closeButton: {
    padding: SPACING.s,
  },
  modalTitle: {
    fontSize: FONT_SIZES.h2,
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  modalContent: {
    flex: 1,
    padding: SPACING.l,
  },
  employeeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: SPACING.m,
    borderRadius: BORDER_RADIUS.m,
    marginBottom: SPACING.s,
    ...SHADOWS.small,
  },
  employeeInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: FONT_SIZES.body,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  employeePosition: {
    fontSize: FONT_SIZES.caption,
    color: COLORS.text.secondary,
    marginBottom: SPACING.xs,
  },
  employeeLocation: {
    fontSize: FONT_SIZES.caption,
    color: COLORS.text.secondary,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: SPACING.m,
    borderRadius: BORDER_RADIUS.m,
    marginBottom: SPACING.s,
    ...SHADOWS.small,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: FONT_SIZES.body,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  locationAddress: {
    fontSize: FONT_SIZES.caption,
    color: COLORS.text.secondary,
  },
  requiredAsterisk: {
    color: COLORS.error,
    fontWeight: 'bold',
  },
});

export default ReassignmentRequestScreen;
