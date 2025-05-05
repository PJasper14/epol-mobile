import React, { useState } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Image, Alert, Platform } from 'react-native';
import { Button, TextInput } from 'react-native-paper';
import { COLORS, SPACING, FONT_SIZES } from '../utils/theme';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Status = "Open" | "In Progress" | "Resolved" | "Closed";

interface Incident {
  id: number;
  title: string;
  status: Status;
  reporter: string;
  location: string;
  createdAt: string;
  description?: string;
  images?: string[];
}

const ReportIncidentScreen = ({ navigation }: any) => {
  const [incidentData, setIncidentData] = useState<Partial<Incident>>({
    title: '',
    description: '',
    location: 'Current Location',
    status: 'Open',
  });
  
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const isFormValid = () => {
    return (
      incidentData.title?.trim() !== '' && 
      incidentData.description?.trim() !== '' &&
      incidentData.location?.trim() !== ''
    );
  };

  const handleChange = (field: keyof Incident, value: string) => {
    setIncidentData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission needed', 'Please grant camera roll permissions to upload images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        setImages([...images, result.assets[0].uri]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!isFormValid()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      
      // Get existing incidents from AsyncStorage
      const existingIncidents = await AsyncStorage.getItem('incidents');
      const incidents: Incident[] = existingIncidents ? JSON.parse(existingIncidents) : [];
      
      // Create new incident
      const newIncident: Incident = {
        id: Date.now(),
        title: incidentData.title!,
        description: incidentData.description,
        location: incidentData.location!,
        status: incidentData.status as Status,
        reporter: 'Current User', // TODO: Get from auth context
        images,
        createdAt: new Date().toISOString(),
      };
      
      // Add new incident to list
      const updatedIncidents = [newIncident, ...incidents];
      
      // Save to AsyncStorage
      await AsyncStorage.setItem('incidents', JSON.stringify(updatedIncidents));
      
      Alert.alert('Success', 'Incident reported successfully');
      navigation.goBack();
    } catch (error) {
      console.error('Error saving incident:', error);
      Alert.alert('Error', 'Failed to save incident');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.subtitle}>Fill in the details of the incident</Text>
      </View>

      <View style={styles.formContainer}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            value={incidentData.title}
            onChangeText={(text) => handleChange('title', text)}
            placeholder="Enter incident title"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={incidentData.description}
            onChangeText={(text) => handleChange('description', text)}
            placeholder="Describe the incident in detail"
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Location</Text>
          <TextInput
            style={styles.input}
            value={incidentData.location}
            onChangeText={(text) => handleChange('location', text)}
            placeholder="Enter location"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Evidence (Images)</Text>
          <TouchableOpacity style={styles.addButton} onPress={pickImage}>
            <Ionicons name="camera" size={24} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Add Image</Text>
          </TouchableOpacity>

          <View style={styles.imageContainer}>
            {images.map((uri, index) => (
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

        <Button
          mode="contained"
          onPress={handleSubmit}
          style={styles.submitButton}
          loading={loading}
          disabled={loading || !isFormValid()}
        >
          Submit Report
        </Button>
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
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
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
    marginTop: 20,
    backgroundColor: COLORS.primary,
  },
});

export default ReportIncidentScreen; 