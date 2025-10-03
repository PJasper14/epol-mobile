import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Image, Alert, Platform, Animated, Dimensions, KeyboardAvoidingView, Keyboard } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Button, TextInput, Card, Title, Surface, ActivityIndicator, Chip, Menu, Divider, ProgressBar, Snackbar, Portal } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, FONT_SIZES, SHADOWS, BORDER_RADIUS } from '../utils/theme';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PhotoViewerModal from '../components/PhotoViewerModal';
import VideoViewerModal from '../components/VideoViewerModal';

// Official incident types by priority
const incidentTypes = {
  high: [
    'Serious Injury',
    'Medical Emergency',
    'Traffic Accident',
    'Security Threat',
    'Fire Emergency',
    'Wildlife Attack',
    'Chemical Exposure'
  ],
  medium: [
    'Minor Injury',
    'Tool Damage',
    'Road Obstruction',
    'Workplace Dispute',
    'Public Complaint',
    'Property Damage',
    'Illegal Dumping'
  ],
  low: [
    'Vandalism',
    'Cracked Pavements',
    'Damaged Public Utility',
    'Uniform Issue',
    'Area Access Issue',
    'System Performance Issue',
    'Weather-related Delays'
  ]
};

// Function to get priority from incident type
const getPriorityFromIncidentType = (incidentType: string): Priority => {
  if (incidentTypes.high.includes(incidentType)) return 'High';
  if (incidentTypes.medium.includes(incidentType)) return 'Medium';
  if (incidentTypes.low.includes(incidentType)) return 'Low';
  return 'Medium'; // Default fallback
};

type Status = "Pending" | "Ongoing" | "Resolved";
type Priority = "Low" | "Medium" | "High";

// Separate component for video items to fix hooks order
const VideoItem = ({ uri, index, onRemove, onOpenViewer }: { 
  uri: string; 
  index: number; 
  onRemove: (index: number) => void;
  onOpenViewer: (index: number) => void;
}) => {
  const player = useVideoPlayer(uri, (player) => {
    player.loop = false;
    player.muted = false;
  });

  return (
    <View style={styles.videoItemContainer}>
      <View style={styles.videoWrapper}>
        <TouchableOpacity onPress={() => onOpenViewer(index)}>
          <VideoView
            player={player}
            style={styles.video}
            allowsPictureInPicture={false}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => onRemove(index)}
        >
          <Ionicons name="close-circle" size={20} color={COLORS.error} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

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

const { width } = Dimensions.get('window');

const ReportIncidentScreen = ({ navigation }: any) => {
  const [incidentData, setIncidentData] = useState<Partial<Incident>>({
    title: '',
    description: '',
    status: 'Pending',
  });
  
  const [images, setImages] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPhotoViewer, setShowPhotoViewer] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [showVideoViewer, setShowVideoViewer] = useState(false);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [watermarkText, setWatermarkText] = useState<string>('');
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  
  // Dropdown states
  const [showIncidentTypeMenu, setShowIncidentTypeMenu] = useState(false);
  const [selectedIncidentType, setSelectedIncidentType] = useState<string>('');

  // Enhanced UI states
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  const [isUploading, setIsUploading] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarType, setSnackbarType] = useState<'success' | 'error' | 'info'>('info');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;


  // Entry animations
  useEffect(() => {
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
  }, []);

  // Keyboard handling
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setIsKeyboardVisible(true);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);


  const validateField = (field: string, value: string) => {
    const errors = { ...validationErrors };
    
    switch (field) {
      case 'incidentType':
        if (!value.trim()) {
          errors.incidentType = 'Please select an incident type';
        } else {
          delete errors.incidentType;
        }
        break;
      case 'description':
        if (!value.trim()) {
          errors.description = 'Please provide a description';
        } else if (value.trim().length < 10) {
          errors.description = 'Description must be at least 10 characters';
        } else {
          delete errors.description;
        }
        break;
    }
    
    setValidationErrors(errors);
  };

  const isFormValid = () => {
    return (
      selectedIncidentType.trim() !== '' && 
      incidentData.description?.trim() !== '' &&
      (images.length > 0 || videos.length > 0) &&
      Object.keys(validationErrors).length === 0
    );
  };

  const getValidationMessage = () => {
    const missingFields: string[] = [];
    
    if (!selectedIncidentType.trim()) {
      missingFields.push('Incident Type');
    }
    if (!incidentData.description?.trim()) {
      missingFields.push('Description');
    }
    if (images.length === 0 && videos.length === 0) {
      missingFields.push('Media Evidence (photo or video)');
    }
    
    return missingFields;
  };

  const showSnackbar = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setSnackbarMessage(message);
    setSnackbarType(type);
    setSnackbarVisible(true);
  };

  const showConfirmation = (action: () => void) => {
    setPendingAction(() => action);
    setShowConfirmDialog(true);
  };


  const handleChange = (field: keyof Incident, value: string) => {
    setIncidentData(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // Real-time validation
    if (field === 'description') {
      validateField('description', value);
    }
  };

  const handleIncidentTypeSelect = (incidentType: string) => {
    setSelectedIncidentType(incidentType);
    setIncidentData(prev => ({
      ...prev,
      title: incidentType,
    }));
    setShowIncidentTypeMenu(false);
    validateField('incidentType', incidentType);
    showSnackbar('Incident type selected', 'success');
  };

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return null;
      }

      // Force fresh location by using high accuracy and no caching
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest, // Use highest accuracy for reliability
        // Note: maximumAge and timeout are not available in expo-location
        // but we can ensure fresh location by using highest accuracy
      });
      
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        address: reverseGeocode[0] ? 
          `${reverseGeocode[0].street || ''} ${reverseGeocode[0].city || ''} ${reverseGeocode[0].region || ''}`.trim() :
          `${location.coords.latitude.toFixed(4)}, ${location.coords.longitude.toFixed(4)}`
      };
    } catch (error) {
      console.error('Error getting location:', error);
      return null;
    }
  };

  const createWatermarkText = async () => {
    setIsGettingLocation(true);
    try {
      const location = await getCurrentLocation();
      const now = new Date();
      const dateTime = now.toLocaleString();
      
      if (location) {
        const coordinates = `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
        return `${dateTime}\nLocation: ${location.address}\nCoordinates: ${coordinates}`;
      } else {
        return `${dateTime}\nLocation: Unknown\nCoordinates: Unknown`;
      }
    } finally {
      setIsGettingLocation(false);
    }
  };

  const addWatermarkToImage = async (imageUri: string, watermarkText: string): Promise<string> => {
    try {
      // For now, we'll return the original URI
      // In a real implementation, you would use a library like react-native-image-editor
      // or expo-image-manipulator to add text overlay
      console.log('Watermark text for image:', watermarkText);
      return imageUri;
    } catch (error) {
      console.error('Error adding watermark to image:', error);
      return imageUri;
    }
  };

  const addWatermarkToVideo = async (videoUri: string, watermarkText: string): Promise<string> => {
    try {
      // For now, we'll return the original URI
      // In a real implementation, you would use a video processing library
      // to add text overlay to video frames
      console.log('Watermark text for video:', watermarkText);
      return videoUri;
    } catch (error) {
      console.error('Error adding watermark to video:', error);
      return videoUri;
    }
  };

  const takePhoto = async () => {
    try {
      setIsUploading(true);
      
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (permissionResult.granted === false) {
        showSnackbar('Camera permission is required to take photos', 'error');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        const text = await createWatermarkText();
        setWatermarkText(text);
        setImages([...images, result.assets[0].uri]);
        showSnackbar('Photo captured successfully', 'success');
        
        // Animate the scale effect
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.05,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
        ]).start();
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      showSnackbar('Failed to take photo. Please try again.', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const recordVideo = async () => {
    try {
      setIsUploading(true);
      
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (permissionResult.granted === false) {
        showSnackbar('Camera permission is required to record videos', 'error');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['videos'],
        allowsEditing: true,
        quality: 0.8,
        videoMaxDuration: 60, // 60 seconds max
      });

      if (!result.canceled) {
        const text = await createWatermarkText();
        setWatermarkText(text);
        setVideos([...videos, result.assets[0].uri]);
        showSnackbar('Video recorded successfully', 'success');
        
        // Animate the scale effect
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.05,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
        ]).start();
      }
    } catch (error) {
      console.error('Error recording video:', error);
      showSnackbar('Failed to record video. Please try again.', 'error');
    } finally {
      setIsUploading(false);
    }
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

  const openVideoViewer = (index: number) => {
    setCurrentVideoIndex(index);
    setShowVideoViewer(true);
  };

  const handleVideoIndexChange = (index: number) => {
    setCurrentVideoIndex(index);
  };

  const handleScroll = (event: any) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    // Handle scroll events if needed
  };

  const resetForm = () => {
    showConfirmation(() => {
      setIncidentData({
        title: '',
        description: '',
        status: 'Pending',
      });
      setSelectedIncidentType('');
      setImages([]);
      setVideos([]);
      setWatermarkText('');
      setValidationErrors({});
      showSnackbar('Form has been reset', 'info');
    });
  };


  const handleSubmit = async () => {
    const missingFields = getValidationMessage();
    
    if (missingFields.length > 0) {
      showSnackbar(`Please complete: ${missingFields.join(', ')}`, 'error');
      return;
    }

    if (!isFormValid()) {
      showSnackbar('Please fix validation errors before submitting', 'error');
      return;
    }

    setShowSubmitModal(true);
  };

  const confirmSubmitIncident = async () => {
    try {
      setLoading(true);
      setShowSubmitModal(false);
      
      // Get existing incidents from AsyncStorage
      const existingIncidents = await AsyncStorage.getItem('incidents');
      const incidents: Incident[] = existingIncidents ? JSON.parse(existingIncidents) : [];
      
      // Create new incident with automatic priority detection
      const newIncident: Incident = {
        id: Date.now(),
        title: selectedIncidentType,
        description: incidentData.description,
        location: 'Location embedded in media watermarks',
        status: incidentData.status as Status,
        priority: getPriorityFromIncidentType(selectedIncidentType), // Automatic priority detection
        reporter: 'Current User', // TODO: Get from auth context
        images,
        videos,
        createdAt: new Date().toISOString(),
      };
      
      // Add new incident to list
      const updatedIncidents = [newIncident, ...incidents];
      
      // Save to AsyncStorage
      await AsyncStorage.setItem('incidents', JSON.stringify(updatedIncidents));
      
      showSnackbar('Incident reported successfully!', 'success');
      
      // Clear form data
      setSelectedIncidentType('');
      setIncidentData({
        title: '',
        description: '',
        status: 'Pending' as Status,
      });
      setImages([]);
      setVideos([]);
      setWatermarkText('');
      setValidationErrors({});
      
      // Navigate back after a short delay
      setTimeout(() => {
        navigation.goBack();
      }, 1500);
      
    } catch (error) {
      console.error('Error saving incident:', error);
      showSnackbar('Failed to save incident. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>

      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
          <Animated.View 
            style={[
              styles.content,
              { 
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >

          {/* Incident Information */}
          <Card style={styles.formCard} elevation={2}>
            <Card.Content>
              <Title style={styles.sectionTitle}>Incident Information</Title>
              
              <View style={styles.inputContainer}>
                <Text style={styles.label}>
                  Incident Type <Text style={styles.requiredAsterisk}>*</Text>
                </Text>
                
                {/* Incident Type Dropdown */}
                <View style={styles.dropdownContainer}>
                  <TouchableOpacity
                    style={[
                      styles.dropdownButton,
                      validationErrors.incidentType && styles.dropdownButtonError
                    ]}
                    onPress={() => setShowIncidentTypeMenu(!showIncidentTypeMenu)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.dropdownButtonText,
                      selectedIncidentType ? styles.dropdownButtonTextSelected : styles.dropdownButtonTextPlaceholder
                    ]}>
                      {selectedIncidentType || 'Select incident type...'}
                </Text>
                    <Ionicons 
                      name={showIncidentTypeMenu ? "chevron-up" : "chevron-down"} 
                      size={20} 
                      color={validationErrors.incidentType ? COLORS.error : COLORS.text.secondary} 
                    />
                  </TouchableOpacity>
                  
                  {validationErrors.incidentType && (
                    <Text style={styles.errorText}>{validationErrors.incidentType}</Text>
                  )}
                  
                  {/* Dropdown Options */}
                  {showIncidentTypeMenu && (
                    <View style={styles.dropdownOptions}>
                      <ScrollView 
                        style={styles.dropdownScrollView} 
                        showsVerticalScrollIndicator={true}
                        nestedScrollEnabled={true}
                      >
                        {/* All Incident Types */}
                        {incidentTypes.high.map((type, index) => (
                    <TouchableOpacity 
                            key={`high-${index}`}
                            style={styles.dropdownItem}
                            onPress={() => handleIncidentTypeSelect(type)}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.dropdownItemText}>{type}</Text>
                    </TouchableOpacity>
                        ))}
                        {incidentTypes.medium.map((type, index) => (
                          <TouchableOpacity
                            key={`medium-${index}`}
                            style={styles.dropdownItem}
                            onPress={() => handleIncidentTypeSelect(type)}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.dropdownItemText}>{type}</Text>
                          </TouchableOpacity>
                        ))}
                        {incidentTypes.low.map((type, index) => (
                          <TouchableOpacity
                            key={`low-${index}`}
                            style={styles.dropdownItem}
                            onPress={() => handleIncidentTypeSelect(type)}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.dropdownItemText}>{type}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
                
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>
                  Description <Text style={styles.requiredAsterisk}>*</Text>
                </Text>
                <TextInput
                  mode="outlined"
                  style={[
                    styles.input, 
                    styles.textArea,
                    validationErrors.description && styles.inputError
                  ]}
                  value={incidentData.description}
                  onChangeText={(text) => handleChange('description', text)}
                  multiline
                  numberOfLines={5}
                  placeholder="Describe the incident in detail."
                  placeholderTextColor={COLORS.text.secondary}
                  outlineColor={validationErrors.description ? COLORS.error : COLORS.divider}
                  activeOutlineColor={validationErrors.description ? COLORS.error : COLORS.primary}
                />
                <View style={styles.inputFooter}>
                  {validationErrors.description ? (
                    <Text style={styles.errorText}>{validationErrors.description}</Text>
                  ) : (
                    <Text style={styles.characterCount}>
                      {incidentData.description?.length || 0} characters
                    </Text>
                )}
                </View>
              </View>



            </Card.Content>
          </Card>

          {/* Evidence & Documentation */}
          <Card style={styles.formCard} elevation={2}>
            <Card.Content>
              <Title style={styles.sectionTitle}>Media Attachments</Title>
              
              {/* Required Media Notice */}
              <View style={[
                styles.requiredNotice,
                { 
                  backgroundColor: images.length > 0 || videos.length > 0 ? '#D4EDDA' : '#FFF3CD',
                  borderLeftColor: images.length > 0 || videos.length > 0 ? COLORS.success : COLORS.warning
                }
              ]}>
                <Ionicons 
                  name={images.length > 0 || videos.length > 0 ? "checkmark-circle" : "alert-circle-outline"} 
                  size={20} 
                  color={images.length > 0 || videos.length > 0 ? COLORS.success : COLORS.warning} 
                />
                <Text style={[
                  styles.requiredNoticeText,
                  { color: images.length > 0 || videos.length > 0 ? '#155724' : '#856404' }
                ]}>
                  {images.length > 0 || videos.length > 0 
                    ? "Media evidence provided" 
                    : "Media evidence is required. Please upload photo or video to support your report."
                  }
                </Text>
              </View>

              {/* Location Loading Indicator */}
              {isGettingLocation && (
                <View style={styles.locationLoadingNotice}>
                  <ActivityIndicator size="small" color={COLORS.primary} />
                  <Text style={styles.locationLoadingText}>
                    Getting current location for accurate watermarks...
                  </Text>
                </View>
              )}
              
              {/* Photo Evidence */}
              <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                <TouchableOpacity 
                  style={[styles.addButton, isUploading && styles.addButtonDisabled]} 
                  onPress={takePhoto}
                  disabled={isUploading}
                >
                <View style={styles.addButtonContent}>
                    {isUploading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                  <Ionicons name="camera" size={24} color="#FFFFFF" />
                    )}
                    <Text style={styles.addButtonText}>
                      {isUploading ? 'Capturing...' : 'Take Photo Evidence'}
                    </Text>
                </View>
              </TouchableOpacity>
              </Animated.View>

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
              <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                <TouchableOpacity 
                  style={[styles.addButton, styles.videoButton, isUploading && styles.addButtonDisabled]} 
                  onPress={recordVideo}
                  disabled={isUploading}
                >
                <View style={styles.addButtonContent}>
                    {isUploading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                  <Ionicons name="videocam" size={24} color="#FFFFFF" />
                    )}
                    <Text style={styles.addButtonText}>
                      {isUploading ? 'Recording...' : 'Record Video Evidence'}
                    </Text>
                </View>
              </TouchableOpacity>
              </Animated.View>

              {videos.length > 0 && (
                <View style={styles.mediaContainer}>
                  <Text style={styles.mediaSectionTitle}>Videos ({videos.length})</Text>
                  <View style={styles.videoContainer}>
                    {videos.map((uri, index) => (
                      <VideoItem
                        key={index}
                        uri={uri}
                        index={index}
                        onRemove={removeVideo}
                        onOpenViewer={openVideoViewer}
                      />
                    ))}
                  </View>
                </View>
              )}
            </Card.Content>
          </Card>


          {/* Reset and Submit Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.resetButton}
              onPress={resetForm}
              activeOpacity={0.8}
            >
              <View style={styles.resetButtonContent}>
                <View style={styles.resetButtonIconContainer}>
                  <Ionicons name="refresh" size={20} color="#FFFFFF" />
                </View>
                <Text style={styles.resetButtonText}>Reset Form</Text>
              </View>
            </TouchableOpacity>
            
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
            {loading ? 'Submitting Report...' : 'SUBMIT REPORT'}
        </Button>
      </View>
          </Animated.View>
    </ScrollView>
      </KeyboardAvoidingView>


    {/* Photo Viewer Modal */}
    <PhotoViewerModal
      visible={showPhotoViewer}
      images={images}
      currentIndex={currentPhotoIndex}
      onClose={() => setShowPhotoViewer(false)}
      onIndexChange={handlePhotoIndexChange}
      watermarkText={watermarkText}
    />

    {/* Video Viewer Modal */}
    <VideoViewerModal
      visible={showVideoViewer}
      videos={videos}
      currentIndex={currentVideoIndex}
      onClose={() => setShowVideoViewer(false)}
      onIndexChange={handleVideoIndexChange}
      watermarkText={watermarkText}
    />

    {/* Snackbar for feedback */}
    <Portal>
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={[
          styles.snackbar,
          snackbarType === 'success' && styles.snackbarSuccess,
          snackbarType === 'error' && styles.snackbarError,
          snackbarType === 'info' && styles.snackbarInfo,
        ]}
        action={{
          label: 'Dismiss',
          onPress: () => setSnackbarVisible(false),
        }}
      >
        {snackbarMessage}
      </Snackbar>
    </Portal>

    {/* Confirmation Dialog */}
    {showConfirmDialog && (
      <Portal>
        <Surface style={styles.dialogOverlay}>
          <Card style={styles.confirmationDialog}>
            <Card.Content>
              <Title style={styles.dialogTitle}>Confirm Action</Title>
              <Text style={styles.dialogMessage}>
                Are you sure you want to reset the form? All entered data will be lost.
              </Text>
              <View style={styles.dialogButtons}>
                <Button
                  mode="outlined"
                  onPress={() => setShowConfirmDialog(false)}
                  style={styles.dialogButton}
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={() => {
                    setShowConfirmDialog(false);
                    pendingAction?.();
                  }}
                  style={[styles.dialogButton, styles.dialogButtonDanger]}
                  buttonColor={COLORS.error}
                >
                  Reset
                </Button>
              </View>
            </Card.Content>
          </Card>
        </Surface>
      </Portal>
    )}

    {/* Submit Confirmation Dialog */}
    {showSubmitModal && (
      <Portal>
        <Surface style={styles.dialogOverlay}>
          <Card style={styles.confirmationDialog}>
            <Card.Content>
              <Title style={styles.dialogTitle}>Submit Incident Report</Title>
              <Text style={styles.dialogMessage}>
                Are you sure you want to submit this incident report? This action cannot be undone.
              </Text>
              <View style={styles.dialogSummary}>
                <Text style={styles.dialogSummaryTitle}>Report Summary:</Text>
                <Text style={styles.dialogSummaryText}>
                  • Incident Type: {selectedIncidentType}
                </Text>
                <Text style={styles.dialogSummaryText}>
                  • Priority: {getPriorityFromIncidentType(selectedIncidentType)}
                </Text>
                <Text style={styles.dialogSummaryText}>
                  • Media: {images.length} photo{images.length !== 1 ? 's' : ''}, {videos.length} video{videos.length !== 1 ? 's' : ''}
                </Text>
                <Text style={styles.dialogSummaryText}>
                  • Description: {incidentData.description && incidentData.description.length > 50 ? incidentData.description.substring(0, 50) + '...' : incidentData.description}
                </Text>
              </View>
              <View style={styles.dialogButtons}>
                <Button
                  mode="outlined"
                  onPress={() => setShowSubmitModal(false)}
                  style={styles.dialogButton}
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={confirmSubmitIncident}
                  style={[styles.dialogButton, styles.dialogButtonSuccess]}
                  buttonColor={COLORS.primary}
                  loading={loading}
                  disabled={loading}
                >
                  {loading ? 'Submitting...' : 'Submit Report'}
                </Button>
              </View>
            </Card.Content>
          </Card>
        </Surface>
      </Portal>
    )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: SPACING.m,
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
  videoItemContainer: {
    marginBottom: SPACING.s,
  },
  videoWrapper: {
    position: 'relative',
    marginBottom: SPACING.xs,
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
  buttonContainer: {
    marginTop: SPACING.xl,
    gap: SPACING.m,
  },
  resetButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.l,
    paddingVertical: SPACING.m,
    paddingHorizontal: SPACING.l,
    ...SHADOWS.medium,
    elevation: 3,
  },
  resetButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButtonIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.s,
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.body,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  submitButton: {
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
  requiredNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF3CD',
    padding: SPACING.m,
    borderRadius: BORDER_RADIUS.s,
    marginBottom: SPACING.m,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.warning,
  },
  requiredNoticeText: {
    flex: 1,
    fontSize: FONT_SIZES.caption,
    color: '#856404',
    marginLeft: SPACING.s,
    lineHeight: 18,
    fontWeight: '500',
  },
  watermarkNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E3F2FD',
    padding: SPACING.s,
    borderRadius: BORDER_RADIUS.s,
    marginBottom: SPACING.m,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  watermarkNoticeText: {
    flex: 1,
    fontSize: FONT_SIZES.caption,
    color: COLORS.primary,
    marginLeft: SPACING.s,
    lineHeight: 16,
    fontWeight: '500',
  },
  locationLoadingNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: SPACING.s,
    borderRadius: BORDER_RADIUS.s,
    marginBottom: SPACING.m,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.warning,
  },
  locationLoadingText: {
    flex: 1,
    fontSize: FONT_SIZES.caption,
    color: '#E65100',
    marginLeft: SPACING.s,
    lineHeight: 16,
    fontWeight: '500',
  },
  // Dropdown styles
  dropdownContainer: {
    // No special positioning needed - flows with content
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.m,
    borderWidth: 1,
    borderColor: COLORS.divider,
    borderRadius: BORDER_RADIUS.m,
    backgroundColor: '#FFFFFF',
    minHeight: 56,
  },
  dropdownButtonText: {
    fontSize: FONT_SIZES.body,
    flex: 1,
  },
  dropdownButtonTextSelected: {
    color: COLORS.text.primary,
    fontWeight: '500',
  },
  dropdownButtonTextPlaceholder: {
    color: COLORS.text.secondary,
  },
  dropdownOptions: {
    backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.m,
    height: 300,
    ...SHADOWS.medium,
    borderWidth: 1,
    borderColor: COLORS.divider,
    marginTop: 2,
  },
  dropdownScrollView: {
    flex: 1,
  },
  dropdownItem: {
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.s,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  dropdownItemText: {
    fontSize: FONT_SIZES.body,
    color: COLORS.text.primary,
  },
  // Enhanced UI styles
  dropdownButtonError: {
    borderColor: COLORS.error,
    borderWidth: 2,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  errorText: {
    color: COLORS.error,
    fontSize: FONT_SIZES.caption,
    marginTop: SPACING.xs,
    fontWeight: '500',
  },
  inputFooter: {
    marginTop: SPACING.xs,
    alignItems: 'flex-end',
  },
  characterCount: {
    color: COLORS.text.secondary,
    fontSize: FONT_SIZES.caption,
    fontWeight: '500',
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
  // Snackbar styles
  snackbar: {
    marginBottom: 100,
  },
  snackbarSuccess: {
    backgroundColor: COLORS.success,
  },
  snackbarError: {
    backgroundColor: COLORS.error,
  },
  snackbarInfo: {
    backgroundColor: COLORS.primary,
  },
  // Dialog styles
  dialogOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.l,
  },
  confirmationDialog: {
    width: '100%',
    maxWidth: 400,
    borderRadius: BORDER_RADIUS.l,
    ...SHADOWS.large,
  },
  dialogTitle: {
    fontSize: FONT_SIZES.h2,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: SPACING.s,
  },
  dialogMessage: {
    fontSize: FONT_SIZES.body,
    color: COLORS.text.secondary,
    marginBottom: SPACING.l,
    lineHeight: 22,
  },
  dialogButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.s,
  },
  dialogButton: {
    minWidth: 80,
  },
  dialogButtonDanger: {
    // Additional danger button styles if needed
  },
  dialogSummary: {
    backgroundColor: '#F8F9FA',
    padding: SPACING.m,
    borderRadius: BORDER_RADIUS.s,
    marginVertical: SPACING.m,
  },
  dialogSummaryTitle: {
    fontSize: FONT_SIZES.body,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.s,
  },
  dialogSummaryText: {
    fontSize: FONT_SIZES.caption,
    color: COLORS.text.secondary,
    marginBottom: SPACING.xs,
  },
  dialogButtonSuccess: {
    // Additional success button styles if needed
  },
});

export default ReportIncidentScreen; 