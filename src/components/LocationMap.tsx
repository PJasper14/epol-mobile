import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Modal, Alert } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Button, Card, Title, ActivityIndicator } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { COLORS, SPACING, FONT_SIZES, SHADOWS, BORDER_RADIUS } from '../utils/theme';

interface LocationMapProps {
  visible: boolean;
  onClose: () => void;
  onLocationSelect: (location: { latitude: number; longitude: number; address: string }) => void;
  initialLocation?: { latitude: number; longitude: number };
}

const LocationMap: React.FC<LocationMapProps> = ({
  visible,
  onClose,
  onLocationSelect,
  initialLocation
}) => {
  const [region, setRegion] = useState({
    latitude: 14.5995, // Default to Manila, Philippines
    longitude: 120.9842,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [selectedLocation, setSelectedLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState<string>('');

  useEffect(() => {
    if (visible) {
      if (initialLocation) {
        setRegion({
          latitude: initialLocation.latitude,
          longitude: initialLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
        setSelectedLocation(initialLocation);
        getAddressFromCoordinates(initialLocation.latitude, initialLocation.longitude);
      } else {
        getCurrentLocation();
      }
    }
  }, [visible, initialLocation]);

  const getCurrentLocation = async () => {
    try {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required to get your current location.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      const { latitude, longitude } = location.coords;
      const newRegion = {
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      
      setRegion(newRegion);
      setSelectedLocation({ latitude, longitude });
      await getAddressFromCoordinates(latitude, longitude);
    } catch (error) {
      console.error('Error getting current location:', error);
      Alert.alert('Error', 'Failed to get current location');
    } finally {
      setLoading(false);
    }
  };

  const getAddressFromCoordinates = async (latitude: number, longitude: number) => {
    try {
      const address = await Location.reverseGeocodeAsync({ latitude, longitude });
      const addressString = address[0] 
        ? `${address[0].street || ''} ${address[0].city || ''} ${address[0].region || ''}`.trim()
        : `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
      
      setAddress(addressString);
    } catch (error) {
      console.error('Error getting address:', error);
      setAddress(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
    }
  };

  const handleMapPress = async (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setSelectedLocation({ latitude, longitude });
    await getAddressFromCoordinates(latitude, longitude);
  };

  const handleConfirmLocation = () => {
    if (selectedLocation) {
      onLocationSelect({
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
        address: address,
      });
      onClose();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={COLORS.text.primary} />
          </TouchableOpacity>
          <Title style={styles.headerTitle}>Select Location</Title>
          <View style={styles.headerSpacer} />
        </View>

        {/* Map */}
        <View style={styles.mapContainer}>
          <MapView
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            region={region}
            onPress={handleMapPress}
            showsUserLocation={true}
            showsMyLocationButton={false}
            mapType="standard"
          >
            {selectedLocation && (
              <Marker
                coordinate={selectedLocation}
                title="Incident Location"
                description={address}
              />
            )}
          </MapView>
          
          {/* GPS Button Overlay */}
          <TouchableOpacity 
            style={styles.gpsButtonOverlay}
            onPress={getCurrentLocation}
            disabled={loading}
          >
            <View style={styles.gpsButtonContent}>
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="location" size={20} color="#FFFFFF" />
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <View style={styles.instructionRow}>
            <Text style={styles.instructionsText}>
              Tap anywhere on the map to select location
            </Text>
          </View>
          <View style={styles.instructionRow}>
            <Ionicons name="location" size={16} color={COLORS.primary} />
            <Text style={styles.instructionsSubtext}>
              Use the GPS button to center on your current location
            </Text>
          </View>
        </View>

        {/* Location Info */}
        <Card style={styles.locationCard}>
          <Card.Content>
            <View style={styles.locationInfo}>
              <View style={styles.locationIcon}>
                <Ionicons name="location" size={20} color={COLORS.primary} />
              </View>
              <View style={styles.locationText}>
                <Text style={styles.addressText}>{address || 'Tap on map to select location'}</Text>
                {selectedLocation && (
                  <Text style={styles.coordinatesText}>
                    {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
                  </Text>
                )}
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button
            mode="outlined"
            onPress={onClose}
            style={styles.cancelButton}
            textColor={COLORS.text.secondary}
          >
            Cancel
          </Button>
          <Button
            mode="contained"
            onPress={handleConfirmLocation}
            style={styles.confirmButton}
            disabled={!selectedLocation}
            buttonColor={COLORS.primary}
            textColor="#FFFFFF"
          >
            Confirm Location
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
  },
  headerTitle: {
    fontSize: FONT_SIZES.h2,
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  headerSpacer: {
    width: 40, // Same width as the removed button to maintain balance
  },
  gpsButtonOverlay: {
    position: 'absolute',
    bottom: SPACING.m,
    right: SPACING.m,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.l,
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.medium,
    elevation: 8,
  },
  gpsButtonContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructionsContainer: {
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.s,
    backgroundColor: COLORS.accent + '20',
    marginHorizontal: SPACING.m,
    borderRadius: BORDER_RADIUS.s,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  instructionsText: {
    fontSize: FONT_SIZES.body,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginLeft: SPACING.s,
    flex: 1,
  },
  instructionsSubtext: {
    fontSize: FONT_SIZES.caption,
    color: COLORS.text.secondary,
    marginLeft: SPACING.s,
    flex: 1,
  },
  mapContainer: {
    flex: 1,
    margin: SPACING.m,
    borderRadius: BORDER_RADIUS.m,
    overflow: 'hidden',
    ...SHADOWS.small,
  },
  map: {
    flex: 1,
  },
  locationCard: {
    margin: SPACING.m,
    marginTop: 0,
    ...SHADOWS.small,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIcon: {
    marginRight: SPACING.s,
  },
  locationText: {
    flex: 1,
  },
  addressText: {
    fontSize: FONT_SIZES.body,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  coordinatesText: {
    fontSize: FONT_SIZES.caption,
    color: COLORS.text.secondary,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: SPACING.m,
    gap: SPACING.s,
  },
  cancelButton: {
    flex: 1,
    borderColor: COLORS.divider,
  },
  confirmButton: {
    flex: 1,
  },
});

export default LocationMap;
