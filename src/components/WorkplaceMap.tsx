import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, Alert } from 'react-native';
import MapView, { Circle, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Card, Title, Button, ActivityIndicator } from 'react-native-paper';
import Ionicons from 'react-native-vector-icons/Ionicons';
import * as Location from 'expo-location';
import { WorkplaceLocation } from '../config/workplace';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../utils/theme';
import { getMyAssignedLocation } from '../utils/geofencing';

interface WorkplaceMapProps {
  visible: boolean;
  onClose: () => void;
  showCurrentLocation?: boolean;
  assignedLocation?: WorkplaceLocation | null;
}

const WorkplaceMap: React.FC<WorkplaceMapProps> = ({ 
  visible, 
  onClose, 
  showCurrentLocation = true,
  assignedLocation: propAssignedLocation
}) => {
  const [assignedLocation, setAssignedLocation] = useState<WorkplaceLocation | null>(propAssignedLocation || null);
  const [region, setRegion] = useState({
    latitude: assignedLocation?.latitude || 14.5995,
    longitude: assignedLocation?.longitude || 120.9842,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      // Fetch assigned location if not provided
      if (!assignedLocation) {
        fetchAssignedLocation();
      }
      
      if (showCurrentLocation) {
        getCurrentLocation();
      }
    }
  }, [visible, showCurrentLocation]);

  const fetchAssignedLocation = async () => {
    try {
      const location = await getMyAssignedLocation();
      if (location) {
        setAssignedLocation(location);
        setRegion({
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      }
    } catch (error) {
      console.error('Error fetching assigned location:', error);
    }
  };

  const getCurrentLocation = async () => {
    try {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required to show your current location.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      setCurrentLocation(location);
      
      // Center map on current location if it's far from assigned workplace
      if (assignedLocation) {
        const distance = calculateDistance(
          location.coords.latitude,
          location.coords.longitude,
          assignedLocation.latitude,
          assignedLocation.longitude
        );
      
        if (distance > 1000) { // If more than 1km away, center on current location
          setRegion({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          });
        }
      }
    } catch (error) {
      console.error('Error getting current location:', error);
      Alert.alert('Error', 'Failed to get current location');
    } finally {
      setLoading(false);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  const centerOnWorkplace = () => {
    if (assignedLocation) {
      setRegion({
        latitude: assignedLocation.latitude,
        longitude: assignedLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  };

  const centerOnCurrentLocation = () => {
    if (currentLocation) {
      setRegion({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Title style={styles.headerTitle}>Workplace Location</Title>
          <View style={styles.headerSpacer} />
        </View>

        {/* Map */}
        <View style={styles.mapContainer}>
          <MapView
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            region={region}
            showsUserLocation={showCurrentLocation}
            showsMyLocationButton={false}
            mapType="standard"
          >
            {/* Workplace Marker */}
            {assignedLocation && (
              <Marker
                coordinate={{
                  latitude: assignedLocation.latitude,
                  longitude: assignedLocation.longitude,
                }}
                title={assignedLocation.name}
                description={`Allowed radius: ${assignedLocation.radius}m`}
              >
                <View style={styles.workplaceMarker}>
                  <Ionicons name="business" size={24} color="#FFFFFF" />
                </View>
              </Marker>
            )}
            
            {/* Current Location Marker */}
            {currentLocation && (
              <Marker
                coordinate={{
                  latitude: currentLocation.coords.latitude,
                  longitude: currentLocation.coords.longitude,
                }}
                title="Your Location"
                description="Current position"
                pinColor={COLORS.secondary}
              />
            )}
            
            {/* Workplace Radius Circle */}
            {assignedLocation && (
              <Circle
                center={{
                  latitude: assignedLocation.latitude,
                  longitude: assignedLocation.longitude,
                }}
                radius={assignedLocation.radius}
                strokeColor={COLORS.primary}
                fillColor={COLORS.primary + '20'}
                strokeWidth={2}
              />
            )}
          </MapView>
          
          {/* Control Buttons */}
          <View style={styles.controlButtons}>
            <TouchableOpacity 
              style={styles.controlButton}
              onPress={centerOnWorkplace}
            >
              <Ionicons name="business" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            
            {showCurrentLocation && (
              <TouchableOpacity 
                style={styles.controlButton}
                onPress={centerOnCurrentLocation}
                disabled={!currentLocation || loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="location" size={20} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Info Card */}
        <Card style={styles.infoCard}>
          <Card.Content>
            <View style={styles.infoContent}>
            {assignedLocation && (
              <View style={styles.infoRow}>
                <Ionicons name="business" size={20} color={COLORS.primary} />
                <View style={styles.infoText}>
                  <Title style={styles.infoTitle}>{assignedLocation.name}</Title>
                  <Title style={styles.infoSubtitle}>
                    Allowed radius: {assignedLocation.radius}m
                  </Title>
                </View>
              </View>
            )}
              
              {currentLocation && (
                <View style={styles.infoRow}>
                  <Ionicons name="location" size={20} color={COLORS.secondary} />
                  <View style={styles.infoText}>
                    <Title style={styles.infoTitle}>Your Location</Title>
                    <Title style={styles.infoSubtitle}>
                      {assignedLocation ? calculateDistance(
                        currentLocation.coords.latitude,
                        currentLocation.coords.longitude,
                        assignedLocation.latitude,
                        assignedLocation.longitude
                      ).toFixed(0) : '0'}m from workplace
                    </Title>
                  </View>
                </View>
              )}
            </View>
          </Card.Content>
        </Card>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button
            mode="outlined"
            onPress={onClose}
            style={styles.closeButton}
            textColor="#FFFFFF"
            buttonColor="transparent"
          >
            Close
          </Button>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.m,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  closeButton: {
    padding: SPACING.s,
    backgroundColor: COLORS.error,
    borderRadius: BORDER_RADIUS.l,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZES.h2,
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  headerSpacer: {
    width: 40,
  },
  mapContainer: {
    flex: 1,
    margin: SPACING.m,
    borderRadius: BORDER_RADIUS.m,
    overflow: 'hidden',
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  controlButtons: {
    position: 'absolute',
    bottom: SPACING.m,
    right: SPACING.m,
    gap: SPACING.s,
  },
  controlButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.l,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  infoCard: {
    margin: SPACING.m,
    marginTop: 0,
    elevation: 2,
  },
  infoContent: {
    gap: SPACING.s,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    marginLeft: SPACING.s,
    flex: 1,
  },
  infoTitle: {
    fontSize: FONT_SIZES.body,
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  infoSubtitle: {
    fontSize: FONT_SIZES.caption,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  actionButtons: {
    padding: SPACING.m,
  },
  workplaceMarker: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.l,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
});

export default WorkplaceMap;
