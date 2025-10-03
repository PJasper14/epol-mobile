import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Text, ActivityIndicator, Button } from 'react-native-paper';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { isWithinWorkplaceRadius, getWorkplaceAddress, formatDistance } from '../utils/geofencing';
import { WorkplaceLocation } from '../config/workplace';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../utils/theme';
import WorkplaceMap from './WorkplaceMap';

interface LocationStatusCardProps {
  employeeId: string;
  onLocationCheck: (isWithinRadius: boolean, distance: number, assignedLocation: WorkplaceLocation | null) => void;
  refreshTrigger?: number; // Used to trigger refresh from parent
}

const LocationStatusCard: React.FC<LocationStatusCardProps> = ({ 
  employeeId,
  onLocationCheck, 
  refreshTrigger 
}) => {
  const [isChecking, setIsChecking] = useState(false);
  const [isWithinRadius, setIsWithinRadius] = useState<boolean | null>(null);
  const [distance, setDistance] = useState<number>(0);
  const [assignedLocation, setAssignedLocation] = useState<WorkplaceLocation | null>(null);
  const [workplaceAddress, setWorkplaceAddress] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    checkLocation();
  }, [refreshTrigger]);

  useEffect(() => {
    if (assignedLocation) {
      getWorkplaceAddress(assignedLocation).then(setWorkplaceAddress);
    }
  }, [assignedLocation]);

  const checkLocation = async () => {
    setIsChecking(true);
    setError('');
    
    try {
      const result = await isWithinWorkplaceRadius();
      
      setIsWithinRadius(result.isWithinRadius);
      setDistance(result.distance);
      setAssignedLocation(result.assignedLocation);
      
      // Notify parent component
      onLocationCheck(result.isWithinRadius, result.distance, result.assignedLocation);
      
      if (result.error) {
        setError(result.error);
      }
    } catch (error) {
      console.error('Location check error:', error);
      setError('Failed to check location');
      onLocationCheck(false, 0, null);
    } finally {
      setIsChecking(false);
    }
  };

  const getStatusColor = () => {
    if (isWithinRadius === null) return COLORS.text.secondary;
    return isWithinRadius ? COLORS.success : COLORS.error;
  };

  const getStatusIcon = () => {
    if (isWithinRadius === null) return 'location-outline';
    return isWithinRadius ? 'checkmark-circle' : 'close-circle';
  };

  const getStatusText = () => {
    if (isChecking) return 'Checking location...';
    if (isWithinRadius === null) return 'Location not checked';
    if (isWithinRadius) return 'Within workplace radius';
    return 'Outside workplace radius';
  };

  return (
    <View>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Ionicons name="location" size={24} color={COLORS.primary} />
          <Text style={styles.title}>Location Status</Text>
        </View>
        <TouchableOpacity 
          onPress={checkLocation} 
          disabled={isChecking}
          style={styles.refreshButton}
        >
          <Ionicons 
            name="refresh" 
            size={20} 
            color={isChecking ? COLORS.text.secondary : COLORS.primary} 
          />
        </TouchableOpacity>
      </View>

      {isChecking ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={styles.loadingText}>Checking your location...</Text>
        </View>
      ) : (
        <View style={styles.content}>
          {/* Status */}
          <View style={styles.statusRow}>
            <Ionicons 
              name={getStatusIcon()} 
              size={20} 
              color={getStatusColor()} 
            />
            <Text style={[styles.statusText, { color: getStatusColor() }]}>
              {getStatusText()}
            </Text>
          </View>

          {/* Distance */}
          {distance > 0 && (
            <View style={styles.distanceRow}>
              <Text style={styles.distanceLabel}>Distance from workplace:</Text>
              <Text style={styles.distanceValue}>{formatDistance(distance)}</Text>
            </View>
          )}

          {/* Workplace Info */}
          {assignedLocation && (
            <View style={styles.workplaceInfo}>
              <Text style={styles.workplaceLabel}>Assigned Workplace:</Text>
              <Text style={styles.workplaceName}>{assignedLocation.name}</Text>
              <Text style={styles.workplaceAddress}>{workplaceAddress}</Text>
              <Text style={styles.radiusInfo}>
                Allowed radius: {assignedLocation.radius}m
              </Text>
            </View>
          )}

          {!assignedLocation && (
            <View style={styles.workplaceInfo}>
              <Text style={styles.workplaceLabel}>No Location Assigned</Text>
              <Text style={styles.workplaceAddress}>
                Please contact administrator to assign a workplace location.
              </Text>
            </View>
          )}

          {/* Error Message */}
          {error && (
            <View style={styles.errorContainer}>
              <Ionicons name="warning" size={16} color={COLORS.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <Button
              mode="contained"
              onPress={() => setShowMap(true)}
              style={styles.mapButton}
              icon={({ size, color }) => (
                <Ionicons name="map" size={size} color={color} />
              )}
            >
              View Map
            </Button>
          </View>
        </View>
      )}
      
      {/* Workplace Map Modal */}
      <WorkplaceMap
        visible={showMap}
        onClose={() => setShowMap(false)}
        showCurrentLocation={true}
        assignedLocation={assignedLocation}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.m,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: FONT_SIZES.h2,
    fontWeight: 'bold',
    marginLeft: SPACING.s,
    color: COLORS.text.primary,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.l,
  },
  loadingText: {
    marginLeft: SPACING.s,
    color: COLORS.text.secondary,
  },
  content: {
    gap: SPACING.s,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.s,
  },
  statusText: {
    fontSize: FONT_SIZES.body,
    fontWeight: '600',
    marginLeft: SPACING.s,
  },
  distanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.accent + '20',
    padding: SPACING.s,
    borderRadius: BORDER_RADIUS.s,
  },
  distanceLabel: {
    fontSize: FONT_SIZES.caption,
    color: COLORS.text.secondary,
  },
  distanceValue: {
    fontSize: FONT_SIZES.body,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  workplaceInfo: {
    backgroundColor: COLORS.background,
    padding: SPACING.s,
    borderRadius: BORDER_RADIUS.s,
    marginTop: SPACING.s,
  },
  workplaceLabel: {
    fontSize: FONT_SIZES.caption,
    color: COLORS.text.secondary,
    marginBottom: 2,
  },
  workplaceName: {
    fontSize: FONT_SIZES.body,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: 2,
  },
  workplaceAddress: {
    fontSize: FONT_SIZES.caption,
    color: COLORS.text.secondary,
    marginBottom: 4,
  },
  radiusInfo: {
    fontSize: FONT_SIZES.caption,
    color: COLORS.primary,
    fontWeight: '500',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.error + '20',
    padding: SPACING.s,
    borderRadius: BORDER_RADIUS.s,
    marginTop: SPACING.s,
  },
  errorText: {
    fontSize: FONT_SIZES.caption,
    color: COLORS.error,
    marginLeft: SPACING.s,
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: SPACING.s,
    marginTop: SPACING.m,
  },
  refreshButton: {
    backgroundColor: COLORS.background,
    borderRadius: 20,
    padding: SPACING.s,
    borderWidth: 1,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
  },
  mapButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
});

export default LocationStatusCard;
