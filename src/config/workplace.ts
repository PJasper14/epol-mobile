// Multi-Location Workplace Configuration
// This system supports multiple workplace locations

export interface WorkplaceLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number; // in meters
  address?: string;
  isActive: boolean;
}

// Default workplace locations (fallback if API fails)
export const DEFAULT_WORKPLACE_LOCATIONS: WorkplaceLocation[] = [
  {
    id: 'location-1',
    name: 'Workplace Location 1',
    latitude: 14.2753056, // 14°16'31.1"N
    longitude: 121.1297778, // 121°07'47.2"E
    radius: 100,
    isActive: true,
  },
  {
    id: 'location-2',
    name: 'Workplace Location 2',
    latitude: 14.2595278, // 14°15'34.3"N
    longitude: 121.1337500, // 121°08'01.5"E
    radius: 100,
    isActive: true,
  },
  {
    id: 'location-3',
    name: 'Workplace Location 3',
    latitude: 14.2773056, // 14°16'38.3"N
    longitude: 121.1234722, // 121°07'24.5"E
    radius: 100,
    isActive: true,
  },
];

// Global variable to store fetched locations
let WORKPLACE_LOCATIONS: WorkplaceLocation[] = [...DEFAULT_WORKPLACE_LOCATIONS];

// Employee location assignments (this will come from the API)
export interface EmployeeLocationAssignment {
  employeeId: string;
  locationId: string;
  assignedAt: string;
  assignedBy: string;
}

// Function to fetch workplace locations from API
export const fetchWorkplaceLocations = async (): Promise<WorkplaceLocation[]> => {
  try {
    const { apiService } = await import('../services/ApiService');
    const response = await apiService.getWorkplaceLocations();
    
    if (response.data && Array.isArray(response.data)) {
      const locations: WorkplaceLocation[] = response.data.map((location: any) => ({
        id: location.id.toString(),
        name: location.name,
        latitude: parseFloat(location.latitude),
        longitude: parseFloat(location.longitude),
        radius: parseInt(location.radius),
        address: location.description,
        isActive: location.is_active,
      }));
      
      WORKPLACE_LOCATIONS = locations;
      return locations;
    }
  } catch (error) {
    console.error('Failed to fetch workplace locations from API:', error);
  }
  
  // Return default locations if API fails
  return DEFAULT_WORKPLACE_LOCATIONS;
};

// Function to get current workplace locations
export const getWorkplaceLocations = (): WorkplaceLocation[] => {
  return WORKPLACE_LOCATIONS;
};

// Function to get active workplace locations only
export const getActiveWorkplaceLocations = (): WorkplaceLocation[] => {
  return WORKPLACE_LOCATIONS.filter(location => location.isActive);
};

// Note: Employee assignments are now fetched from the API via AssignmentService
// The hardcoded assignments have been removed in favor of real-time API data

// Legacy function - now deprecated, use AssignmentService instead
export const getEmployeeLocation = (employeeId: string): WorkplaceLocation | null => {
  console.warn('getEmployeeLocation is deprecated. Use AssignmentService.getMyWorkplaceLocation() instead.');
  return null;
};

// Helper function to get all active locations
export const getActiveLocations = (): WorkplaceLocation[] => {
  return WORKPLACE_LOCATIONS.filter(loc => loc.isActive);
};

// Instructions for adding new locations:
// 1. Add a new location object to WORKPLACE_LOCATIONS array
// 2. Assign employees to locations in EMPLOYEE_LOCATION_ASSIGNMENTS
// 3. Update the web admin panel to manage these assignments
