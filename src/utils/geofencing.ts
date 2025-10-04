import * as Location from 'expo-location';
import { 
  getWorkplaceLocations, 
  getActiveWorkplaceLocations,
  fetchWorkplaceLocations,
  WorkplaceLocation 
} from '../config/workplace';
import { assignmentService } from '../services/AssignmentService';

// Re-export for other components
export { getWorkplaceLocations, getActiveWorkplaceLocations, fetchWorkplaceLocations };

// Calculate distance between two coordinates using Haversine formula
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
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

// Check if current location is within employee's assigned workplace radius
export const isWithinWorkplaceRadius = async (employeeId?: string): Promise<{
  isWithinRadius: boolean;
  distance: number;
  currentLocation: Location.LocationObject | null;
  assignedLocation: WorkplaceLocation | null;
  error?: string;
}> => {
  try {
    // Get employee's assigned location from API
    const assignedLocation = employeeId 
      ? await assignmentService.getEmployeeWorkplaceLocation(employeeId)
      : await assignmentService.getMyWorkplaceLocation();
    
    if (!assignedLocation) {
      return {
        isWithinRadius: false,
        distance: 0,
        currentLocation: null,
        assignedLocation: null,
        error: 'No location assigned to employee'
      };
    }

    // Request location permission
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return {
        isWithinRadius: false,
        distance: 0,
        currentLocation: null,
        assignedLocation,
        error: 'Location permission denied'
      };
    }

    // Get current location
    const currentLocation = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    const { latitude, longitude } = currentLocation.coords;
    
    // Calculate distance from assigned workplace
    const distance = calculateDistance(
      latitude,
      longitude,
      assignedLocation.latitude,
      assignedLocation.longitude
    );

    // Check if within radius
    const isWithinRadius = distance <= assignedLocation.radius;

    return {
      isWithinRadius,
      distance: Math.round(distance),
      currentLocation,
      assignedLocation
    };
  } catch (error) {
    console.error('Error checking location:', error);
    return {
      isWithinRadius: false,
      distance: 0,
      currentLocation: null,
      assignedLocation: null,
      error: 'Failed to get location'
    };
  }
};

// Get workplace address from coordinates
export const getWorkplaceAddress = async (location: WorkplaceLocation): Promise<string> => {
  try {
    const address = await Location.reverseGeocodeAsync({
      latitude: location.latitude,
      longitude: location.longitude,
    });

    if (address.length > 0) {
      const addr = address[0];
      return `${addr.street || ''} ${addr.city || ''} ${addr.region || ''}`.trim();
    }
    
    return `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
  } catch (error) {
    console.error('Error getting workplace address:', error);
    return `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
  }
};

// Format distance for display
export const formatDistance = (distance: number): string => {
  if (distance < 1000) {
    return `${distance}m`;
  } else {
    return `${(distance / 1000).toFixed(1)}km`;
  }
};

// Get current user's assigned location from API
export const getMyAssignedLocation = async (): Promise<WorkplaceLocation | null> => {
  try {
    return await assignmentService.getMyWorkplaceLocation();
  } catch (error) {
    console.error('Error getting assigned location:', error);
    return null;
  }
};

// Check if user has an assignment
export const hasAssignment = async (): Promise<boolean> => {
  try {
    return await assignmentService.hasAssignment();
  } catch (error) {
    console.error('Error checking assignment:', error);
    return false;
  }
};
