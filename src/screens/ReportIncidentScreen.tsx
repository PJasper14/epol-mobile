import React, { useState } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Image, Alert, Platform } from 'react-native';
import { Button, Avatar, TextInput, Chip, Divider } from 'react-native-paper';
import { COLORS, SPACING, FONT_SIZES, SHADOWS } from '../utils/theme';
import * as ImagePicker from 'expo-image-picker';
import { AntDesign } from '@expo/vector-icons';

const incidentTypes = [
  { id: '1', label: 'Theft', icon: 'wallet-outline' },
  { id: '2', label: 'Vandalism', icon: 'spray-bottle' },
  { id: '3', label: 'Assault', icon: 'alert-circle-outline' },
  { id: '4', label: 'Traffic Accident', icon: 'car-crash' },
  { id: '5', label: 'Public Nuisance', icon: 'volume-high' },
  { id: '6', label: 'Other', icon: 'dots-horizontal' },
];

const ReportIncidentScreen = ({ navigation }: any) => {
  const [incidentData, setIncidentData] = useState({
    title: '',
    description: '',
    location: 'Current Location',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
  });
  
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const isFormValid = () => {
    return (
      incidentData.title.trim() !== '' && 
      incidentData.description.trim() !== '' && 
      selectedType !== null
    );
  };

  const handleChange = (field: string, value: string) => {
    setIncidentData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Please grant permission to access your photos');
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImages(prev => [...prev, result.assets[0].uri]);
      }
    } catch (error) {
      console.error('Error picking image', error);
      Alert.alert('Error', 'There was a problem selecting your image');
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!isFormValid()) {
      Alert.alert('Missing Information', 'Please fill out all required fields');
      return;
    }

    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      Alert.alert(
        'Report Submitted',
        'Your incident has been reported successfully. Reference #: 23458',
        [
          { 
            text: 'OK', 
            onPress: () => navigation.navigate('Dashboard')
          }
        ]
      );
    }, 1500);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Avatar.Icon 
            size={40} 
            icon="arrow-left" 
            color={COLORS.text.primary}
            style={{ backgroundColor: 'transparent' }}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Report Incident</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Incident Type</Text>
        <View style={styles.typeContainer}>
          {incidentTypes.map(type => (
            <TouchableOpacity
              key={type.id}
              style={[
                styles.typeItem,
                selectedType === type.id && { backgroundColor: COLORS.primary + '20' }
              ]}
              onPress={() => setSelectedType(type.id)}
            >
              <Avatar.Icon 
                size={40} 
                icon={type.icon}
                color={selectedType === type.id ? COLORS.primary : COLORS.text.secondary}
                style={{ backgroundColor: 'transparent' }}
              />
              <Text 
                style={[
                  styles.typeLabel,
                  selectedType === type.id && { color: COLORS.primary, fontWeight: 'bold' }
                ]}
              >
                {type.label}
              </Text>
              {selectedType === type.id && (
                <View style={styles.selectedIndicator}>
                  <AntDesign name="check" size={16} color={COLORS.primary} />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <Divider style={styles.divider} />

        <Text style={styles.sectionTitle}>Incident Details</Text>
        <TextInput
          label="Title"
          value={incidentData.title}
          onChangeText={(text) => handleChange('title', text)}
          style={styles.input}
          mode="outlined"
          outlineColor={COLORS.divider}
          activeOutlineColor={COLORS.primary}
        />
        
        <TextInput
          label="Description"
          value={incidentData.description}
          onChangeText={(text) => handleChange('description', text)}
          style={styles.input}
          mode="outlined"
          multiline
          numberOfLines={4}
          outlineColor={COLORS.divider}
          activeOutlineColor={COLORS.primary}
        />

        <Divider style={styles.divider} />

        <Text style={styles.sectionTitle}>Location & Time</Text>
        <View style={styles.row}>
          <View style={styles.flex1}>
            <Chip 
              icon="map-marker" 
              selected 
              onPress={() => {}}
              style={styles.locationChip}
            >
              {incidentData.location}
            </Chip>
          </View>
          <View style={styles.dateTimeContainer}>
            <Text style={styles.dateText}>
              {incidentData.date} at {incidentData.time}
            </Text>
          </View>
        </View>

        <Divider style={styles.divider} />

        <Text style={styles.sectionTitle}>Evidence Photos</Text>
        <View style={styles.imagesContainer}>
          {images.map((uri, index) => (
            <View key={index} style={styles.imageWrapper}>
              <Image source={{ uri }} style={styles.image} />
              <TouchableOpacity 
                style={styles.removeImageButton}
                onPress={() => removeImage(index)}
              >
                <AntDesign name="closecircle" size={20} color={COLORS.error} />
              </TouchableOpacity>
            </View>
          ))}
          
          <TouchableOpacity 
            style={styles.addImageButton}
            onPress={pickImage}
          >
            <AntDesign name="plus" size={32} color={COLORS.text.secondary} />
            <Text style={styles.addImageText}>Add Photo</Text>
          </TouchableOpacity>
        </View>

        <Button 
          mode="contained" 
          onPress={handleSubmit}
          loading={loading}
          disabled={!isFormValid() || loading}
          style={styles.submitButton}
          contentStyle={styles.submitButtonContent}
        >
          Submit Report
        </Button>
      </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.m,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.m,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: FONT_SIZES.h2,
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: SPACING.l,
    paddingBottom: SPACING.xl * 2,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.body,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: SPACING.m,
  },
  typeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: SPACING.m,
  },
  typeItem: {
    width: '31%',
    alignItems: 'center',
    padding: SPACING.s,
    marginBottom: SPACING.m,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.divider,
    position: 'relative',
  },
  typeLabel: {
    marginTop: SPACING.xs,
    fontSize: FONT_SIZES.small,
    color: COLORS.text.secondary,
  },
  selectedIndicator: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: COLORS.background,
    borderRadius: 10,
    padding: 2,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  divider: {
    marginVertical: SPACING.m,
  },
  input: {
    marginBottom: SPACING.m,
    backgroundColor: COLORS.background,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flex1: {
    flex: 1,
  },
  locationChip: {
    backgroundColor: COLORS.primary + '20',
  },
  dateTimeContainer: {
    marginLeft: SPACING.m,
  },
  dateText: {
    fontSize: FONT_SIZES.small,
    color: COLORS.text.secondary,
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: SPACING.l,
  },
  imageWrapper: {
    width: 100,
    height: 100,
    marginRight: SPACING.m,
    marginBottom: SPACING.m,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: COLORS.background,
    borderRadius: 12,
  },
  addImageButton: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.divider,
    borderRadius: 8,
  },
  addImageText: {
    marginTop: SPACING.xs,
    fontSize: FONT_SIZES.small,
    color: COLORS.text.secondary,
  },
  submitButton: {
    marginTop: SPACING.l,
    backgroundColor: COLORS.primary,
  },
  submitButtonContent: {
    paddingVertical: SPACING.s,
  },
});

export default ReportIncidentScreen; 