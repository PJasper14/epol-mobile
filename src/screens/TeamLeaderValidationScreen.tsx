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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS } from '../utils/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

const TeamLeaderValidationScreen = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [remarks, setRemarks] = useState('');
  const [evidence, setEvidence] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      // First, get today's attendance records
      const today = new Date().toISOString().split('T')[0];
      const attendanceData = await AsyncStorage.getItem('attendance_records');
      const attendanceRecords = attendanceData ? JSON.parse(attendanceData) : {};

      // Get today's records
      const todayRecords = attendanceRecords[today] || {};

      // Map employees with their attendance records
      const employeesWithAttendance = EMPLOYEES.map(employee => {
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
    } catch (error) {
      console.error('Error loading employees:', error);
      Alert.alert('Error', 'Failed to load employee attendance records');
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions to upload evidence.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setEvidence([...evidence, result.assets[0].uri]);
    }
  };

  const removeImage = (index: number) => {
    setEvidence(evidence.filter((_, i) => i !== index));
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

    try {
      setLoading(true);
      
      // Get existing validations
      const existingValidations = await AsyncStorage.getItem('validations');
      const validations: Validation[] = existingValidations ? JSON.parse(existingValidations) : [];
      
      // Create new validation
      const newValidation: Validation = {
        employeeId: selectedEmployee.id,
        remarks,
        evidence,
        validatedAt: new Date().toISOString(),
      };
      
      // Add new validation to list
      const updatedValidations = [newValidation, ...validations];
      
      // Save to AsyncStorage
      await AsyncStorage.setItem('validations', JSON.stringify(updatedValidations));
      
      Alert.alert('Success', 'Validation submitted successfully');
      setSelectedEmployee(null);
      setRemarks('');
      setEvidence([]);
    } catch (error) {
      console.error('Error saving validation:', error);
      Alert.alert('Error', 'Failed to save validation');
    } finally {
      setLoading(false);
    }
  };

  if (!selectedEmployee) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Select Employee</Text>
            <Text style={styles.subtitle}>Choose an employee to validate</Text>
          </View>
        </View>

        <View style={styles.employeeList}>
          {employees.length > 0 ? (
            employees.map((employee) => (
              <TouchableOpacity
                key={employee.id}
                style={styles.employeeItem}
                onPress={() => setSelectedEmployee(employee)}
              >
                <View style={styles.employeeInfo}>
                  <Text style={styles.employeeName}>{employee.name}</Text>
                  <Text style={styles.employeePosition}>{employee.position}</Text>
                  <View style={styles.timeContainer}>
                    <Text style={styles.timeText}>
                      Time In: {employee.timeIn || 'Not recorded'}
                    </Text>
                    <Text style={styles.timeText}>
                      Time Out: {employee.timeOut || 'Not recorded'}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={24} color={COLORS.text.secondary} />
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color={COLORS.text.secondary} />
              <Text style={styles.emptyStateText}>No employees found for today</Text>
            </View>
          )}
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => setSelectedEmployee(null)}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Validate Attendance</Text>
          <Text style={styles.subtitle}>{selectedEmployee.name}</Text>
        </View>
      </View>

      <View style={styles.formContainer}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Remarks</Text>
          <TextInput
            style={styles.input}
            multiline
            numberOfLines={4}
            value={remarks}
            onChangeText={setRemarks}
            placeholder="Enter your remarks here..."
          />
        </View>

        <View style={styles.evidenceContainer}>
          <Text style={styles.label}>Evidence</Text>
          <TouchableOpacity style={styles.addButton} onPress={pickImage}>
            <Ionicons name="camera" size={24} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Add Evidence</Text>
          </TouchableOpacity>

          <View style={styles.imageContainer}>
            {evidence.map((uri, index) => (
              <View key={index} style={styles.imageWrapper}>
                <Image source={{ uri }} style={styles.image} />
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeImage(index)}
                >
                  <Ionicons name="close-circle" size={24} color={COLORS.error} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.submitButton, loading && styles.submitButtonDisabled]} 
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Submitting...' : 'Submit Validation'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: 20,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
  },
  backButton: {
    marginRight: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    marginTop: 5,
  },
  employeeList: {
    padding: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: COLORS.text.secondary,
    marginTop: 10,
    textAlign: 'center',
  },
  employeeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  employeeInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  employeePosition: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: 8,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    fontSize: 12,
    color: COLORS.text.secondary,
  },
  formContainer: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: COLORS.text.primary,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.divider,
    minHeight: 100,
  },
  evidenceContainer: {
    marginBottom: 20,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  addButtonText: {
    color: '#FFFFFF',
    marginLeft: 10,
    fontSize: 16,
  },
  imageContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  imageWrapper: {
    position: 'relative',
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeButton: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default TeamLeaderValidationScreen; 