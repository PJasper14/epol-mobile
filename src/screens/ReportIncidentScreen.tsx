import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Image, Alert, Platform } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Button, TextInput, Card, Title, Surface, ActivityIndicator, Chip, Menu, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, FONT_SIZES, SHADOWS, BORDER_RADIUS } from '../utils/theme';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LocationMap from '../components/LocationMap';
import PhotoViewerModal from '../components/PhotoViewerModal';

type Status = "Pending" | "Ongoing" | "Resolved";
type Priority = "Low" | "Medium" | "High";

interface Incident {
  id: number;
  title: string;
  status: Status;
  priority: Priority;
  reporter: string;
  location: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  createdAt: string;
  description?: string;
  images?: string[];
  videos?: string[];
}

const ReportIncidentScreen = ({ navigation }: any) => {
  const [incidentData, setIncidentData] = useState<Partial<Incident>>({
    title: '',
    description: '',
    location: '',
    status: 'Pending',
    priority: 'Medium',
  });
  
  const [images, setImages] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPriorityMenu, setShowPriorityMenu] = useState(false);
  const [coordinates, setCoordinates] = useState<{latitude: number, longitude: number} | null>(null);
  const [showMapModal, setShowMapModal] = useState(false);
  const [showPhotoViewer, setShowPhotoViewer] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);


  const isFormValid = () => {
    return (
      incidentData.title?.trim() !== '' && 
      incidentData.description?.trim() !== '' &&
      incidentData.location?.trim() !== '' &&
      incidentData.priority
    );
  };

  const getValidationMessage = () => {
    const missingFields = [];
    
    if (!incidentData.title?.trim()) {
      missingFields.push('Incident Type');
    }
    if (!incidentData.description?.trim()) {
      missingFields.push('Description');
    }
    if (!incidentData.location?.trim()) {
      missingFields.push('Location');
    }
    if (!incidentData.priority) {
      missingFields.push('Priority Level');
    }
    
    return missingFields;
  };

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case 'Low': return COLORS.success;
      case 'Medium': return COLORS.warning;
      case 'High': return COLORS.error;
      default: return COLORS.text.secondary;
    }
  };

  const handleChange = (field: keyof Incident, value: string) => {
    setIncidentData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const pickImage = async (source: 'camera' | 'gallery') => {
    try {
      let permissionResult;
      
      if (source === 'camera') {
        permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      } else {
        permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      }
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission needed', `Please grant ${source} permissions to upload images.`);
        return;
      }

      const result = source === 'camera' 
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
          })
        : await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
            quality: 0.8,
      });

      if (!result.canceled) {
        setImages([...images, result.assets[0].uri]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const pickVideo = async (source: 'camera' | 'gallery') => {
    try {
      let permissionResult;
      
      if (source === 'camera') {
        permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      } else {
        permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      }
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission needed', `Please grant ${source} permissions to record/upload videos.`);
        return;
      }

      const result = source === 'camera' 
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Videos,
            allowsEditing: true,
            quality: 0.8,
            videoMaxDuration: 60, // 60 seconds max
          })
        : await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled) {
        setVideos([...videos, result.assets[0].uri]);
      }
    } catch (error) {
      console.error('Error picking video:', error);
      Alert.alert('Error', 'Failed to pick video');
    }
  };

  const showImagePickerOptions = () => {
    Alert.alert(
      'Add Photo Evidence',
      'Choose how you want to add photos',
      [
        { text: 'Take Photo', onPress: () => pickImage('camera') },
        { text: 'Choose from Gallery', onPress: () => pickImage('gallery') },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const showVideoPickerOptions = () => {
    Alert.alert(
      'Add Video Evidence',
      'Choose how you want to add videos',
      [
        { text: 'Record Video', onPress: () => pickVideo('camera') },
        { text: 'Choose from Gallery', onPress: () => pickVideo('gallery') },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const removeVideo = (index: number) => {
    setVideos(videos.filter((_, i) => i !== index));
  };

  const openPhotoViewer = (index: number) => {
    setCurrentPhotoIndex(index);
    setShowPhotoViewer(true);
  };

  const handlePhotoIndexChange = (index: number) => {
    setCurrentPhotoIndex(index);
  };

  const handleMapLocationSelect = (location: { latitude: number; longitude: number; address: string }) => {
    setCoordinates({ latitude: location.latitude, longitude: location.longitude });
    setIncidentData(prev => ({ ...prev, location: location.address }));
    setShowMapModal(false);
  };

  const handleSubmit = async () => {
    const missingFields = getValidationMessage();
    
    if (missingFields.length > 0) {
      Alert.alert(
        'Required Fields Missing', 
        `Please fill in the following required fields:\n\n• ${missingFields.join('\n• ')}`
      );
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
        coordinates: coordinates || undefined,
        status: incidentData.status as Status,
        priority: incidentData.priority as Priority,
        reporter: 'Current User', // TODO: Get from auth context
        images,
        videos,
        createdAt: new Date().toISOString(),
      };
      
      // Add new incident to list
      const updatedIncidents = [newIncident, ...incidents];
      
      // Save to AsyncStorage
      await AsyncStorage.setItem('incidents', JSON.stringify(updatedIncidents));
      
      Alert.alert(
        'Success', 
        'Safeguarding incident reported successfully! The incident has been logged and will be reviewed by administrators.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      console.error('Error saving incident:', error);
      Alert.alert('Error', 'Failed to save incident');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Incident Information */}
          <Card style={styles.formCard} elevation={2}>
            <Card.Content>
              <Title style={styles.sectionTitle}>Incident Information</Title>
              
              <View style={styles.inputContainer}>
                <Text style={styles.label}>
                  Incident Type <Text style={styles.requiredAsterisk}>*</Text>
                </Text>
                <TextInput
                  mode="outlined"
                  style={styles.input}
                  value={incidentData.title}
                  onChangeText={(text) => handleChange('title', text)}
                  outlineColor={COLORS.divider}
                  activeOutlineColor={COLORS.primary}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>
                  Description <Text style={styles.requiredAsterisk}>*</Text>
                </Text>
                <TextInput
                  mode="outlined"
                  style={[styles.input, styles.textArea]}
                  value={incidentData.description}
                  onChangeText={(text) => handleChange('description', text)}
                  multiline
                  numberOfLines={5}
                  outlineColor={COLORS.divider}
                  activeOutlineColor={COLORS.primary}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>
                  Priority Level <Text style={styles.requiredAsterisk}>*</Text>
                </Text>
                <Menu
                  visible={showPriorityMenu}
                  onDismiss={() => setShowPriorityMenu(false)}
                  anchor={
                    <TouchableOpacity 
                      style={styles.selectorButton}
                      onPress={() => setShowPriorityMenu(true)}
                    >
                      <View style={styles.priorityContainer}>
                        <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(incidentData.priority as Priority) }]} />
                        <Text style={styles.selectorText}>{incidentData.priority}</Text>
                      </View>
                      <Ionicons name="chevron-down" size={20} color={COLORS.text.secondary} />
                    </TouchableOpacity>
                  }
                >
                  {(['Low', 'Medium', 'High'] as Priority[]).map((priority) => (
                    <Menu.Item
                      key={priority}
                      onPress={() => {
                        handleChange('priority', priority);
                        setShowPriorityMenu(false);
                      }}
                      title={priority}
                    />
                  ))}
                </Menu>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>
                  Location <Text style={styles.requiredAsterisk}>*</Text>
                </Text>
                
                {/* Location Input Field */}
                <TextInput
                  mode="outlined"
                  style={styles.input}
                  value={incidentData.location}
                  onChangeText={(text) => handleChange('location', text)}
                  outlineColor={COLORS.divider}
                  activeOutlineColor={COLORS.primary}
                />
                
                {/* Map Selection Button */}
                <TouchableOpacity 
                  style={styles.mapButton}
                  onPress={() => setShowMapModal(true)}
                >
                  <View style={styles.mapButtonContent}>
                    <Ionicons name="map" size={20} color="#FFFFFF" />
                    <Text style={styles.mapButtonText}>Select on Map</Text>
                  </View>
                </TouchableOpacity>
                
                {/* Location Status Indicator */}
                {incidentData.location && (
                  <View style={styles.locationStatus}>
                    <Ionicons 
                      name="checkmark-circle" 
                      size={16} 
                      color={COLORS.success} 
                    />
                    <Text style={[
                      styles.locationStatusText,
                      { color: COLORS.success }
                    ]}>
                      Location selected
                    </Text>
                  </View>
                )}
              </View>

            </Card.Content>
          </Card>

          {/* Evidence & Documentation */}
          <Card style={styles.formCard} elevation={2}>
            <Card.Content>
              <Title style={styles.sectionTitle}>Media Attachments</Title>
              
              {/* Photo Evidence */}
              <TouchableOpacity style={styles.addButton} onPress={showImagePickerOptions}>
                <View style={styles.addButtonContent}>
                  <Ionicons name="camera" size={24} color="#FFFFFF" />
                  <Text style={styles.addButtonText}>Add Photo Evidence</Text>
                </View>
              </TouchableOpacity>

              {images.length > 0 && (
                <View style={styles.mediaContainer}>
                  <Text style={styles.mediaSectionTitle}>Photos ({images.length})</Text>
                  <View style={styles.imageContainer}>
                    {images.map((uri, index) => (
                      <View key={index} style={styles.imageWrapper}>
                        <TouchableOpacity onPress={() => openPhotoViewer(index)}>
                          <Image source={{ uri }} style={styles.image} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.removeButton}
                          onPress={() => removeImage(index)}
                        >
                          <Ionicons name="close-circle" size={20} color={COLORS.error} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Video Evidence */}
              <TouchableOpacity style={[styles.addButton, styles.videoButton]} onPress={showVideoPickerOptions}>
                <View style={styles.addButtonContent}>
                  <Ionicons name="videocam" size={24} color="#FFFFFF" />
                  <Text style={styles.addButtonText}>Add Video Evidence</Text>
                </View>
              </TouchableOpacity>

              {videos.length > 0 && (
                <View style={styles.mediaContainer}>
                  <Text style={styles.mediaSectionTitle}>Videos ({videos.length})</Text>
                  <View style={styles.videoContainer}>
                    {videos.map((uri, index) => (
                      <View key={index} style={styles.videoWrapper}>
                        <Video
                          source={{ uri }}
                          style={styles.video}
                          useNativeControls
                          resizeMode={ResizeMode.CONTAIN}
                          shouldPlay={false}
                        />
                        <TouchableOpacity
                          style={styles.removeButton}
                          onPress={() => removeVideo(index)}
                        >
                          <Ionicons name="close-circle" size={20} color={COLORS.error} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </Card.Content>
          </Card>

          {/* Submit Button */}
        <Button
          mode="contained"
          onPress={handleSubmit}
          style={[styles.submitButton, !isFormValid() && styles.submitButtonDisabled]}
            contentStyle={styles.submitButtonContent}
          loading={loading}
          disabled={loading || !isFormValid()}
            buttonColor={isFormValid() ? COLORS.primary : COLORS.divider}
            textColor="#FFFFFF"
        >
            {loading ? 'Submitting Report...' : 'Submit Report'}
        </Button>
      </View>
    </ScrollView>

    {/* Location Map Modal */}
    <LocationMap
      visible={showMapModal}
      onClose={() => setShowMapModal(false)}
      onLocationSelect={handleMapLocationSelect}
      initialLocation={coordinates || undefined}
    />

    {/* Photo Viewer Modal */}
    <PhotoViewerModal
      visible={showPhotoViewer}
      images={images}
      currentIndex={currentPhotoIndex}
      onClose={() => setShowPhotoViewer(false)}
      onIndexChange={handlePhotoIndexChange}
    />
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
  content: {
    padding: SPACING.m,
  },
  formCard: {
    marginBottom: SPACING.l,
    borderRadius: BORDER_RADIUS.m,
    ...SHADOWS.small,
    backgroundColor: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: FONT_SIZES.h2,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: SPACING.l,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.accent,
    paddingBottom: SPACING.s,
  },
  inputContainer: {
    marginBottom: SPACING.l,
  },
  label: {
    fontSize: FONT_SIZES.body,
    fontWeight: '600',
    marginBottom: SPACING.s,
    color: COLORS.text.primary,
  },
  requiredAsterisk: {
    color: COLORS.error,
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.divider,
    borderRadius: BORDER_RADIUS.s,
    padding: SPACING.m,
    minHeight: 56,
  },
  selectorText: {
    fontSize: FONT_SIZES.body,
    color: COLORS.text.primary,
  },
  priorityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: SPACING.s,
  },
  mapButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.m,
    marginTop: SPACING.s,
    ...SHADOWS.small,
  },
  mapButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.m,
    paddingHorizontal: SPACING.s,
  },
  mapButtonText: {
    color: '#FFFFFF',
    marginLeft: SPACING.s,
    fontSize: FONT_SIZES.caption,
    fontWeight: '600',
  },
  locationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.s,
    paddingHorizontal: SPACING.s,
  },
  locationStatusText: {
    fontSize: FONT_SIZES.caption,
    marginLeft: SPACING.s,
    fontWeight: '500',
  },
  addButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.m,
    marginBottom: SPACING.m,
    ...SHADOWS.small,
  },
  videoButton: {
    backgroundColor: COLORS.primary,
    marginTop: SPACING.s,
  },
  addButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.m,
  },
  addButtonText: {
    color: '#FFFFFF',
    marginLeft: SPACING.s,
    fontSize: FONT_SIZES.body,
    fontWeight: '600',
  },
  mediaContainer: {
    marginTop: SPACING.s,
  },
  mediaSectionTitle: {
    fontSize: FONT_SIZES.body,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.s,
  },
  imageContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.s,
  },
  videoContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.s,
  },
  imageWrapper: {
    position: 'relative',
    marginBottom: SPACING.s,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: BORDER_RADIUS.m,
    backgroundColor: COLORS.divider,
  },
  videoWrapper: {
    position: 'relative',
    marginBottom: SPACING.s,
  },
  video: {
    width: 150,
    height: 100,
    borderRadius: BORDER_RADIUS.m,
    backgroundColor: COLORS.divider,
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  submitButton: {
    marginTop: SPACING.xl,
    borderRadius: BORDER_RADIUS.l,
    ...SHADOWS.medium,
  },
  submitButtonDisabled: {
    opacity: 0.6,
    ...SHADOWS.small,
  },
  submitButtonContent: {
    paddingVertical: SPACING.m,
  },
});

export default ReportIncidentScreen; 