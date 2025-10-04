import { apiService } from './ApiService';
import { WorkplaceLocation } from '../config/workplace';

export interface EmployeeAssignment {
  id: string;
  user_id: string;
  workplace_location_id: string;
  assigned_by: string | {
    id: string;
    first_name: string;
    last_name: string;
  };
  workplace_location?: {
    id: string;
    name: string;
    latitude: string;
    longitude: string;
    radius: number;
    description?: string;
    is_active: boolean;
  };
  created_at: string;
  updated_at: string;
}

class AssignmentService {
  private cachedAssignment: EmployeeAssignment | null = null;
  private lastFetchTime: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Get current user's assignment from API
   */
  async getMyAssignment(forceRefresh: boolean = false): Promise<EmployeeAssignment | null> {
    const now = Date.now();
    
    // Return cached data if it's still fresh and not forcing refresh
    if (!forceRefresh && this.cachedAssignment && (now - this.lastFetchTime) < this.CACHE_DURATION) {
      return this.cachedAssignment;
    }

    try {
      const response = await apiService.getMyAssignment();
      
      if ((response as any).assignment) {
        this.cachedAssignment = (response as any).assignment;
        this.lastFetchTime = now;
        return (response as any).assignment;
      } else {
        this.cachedAssignment = null;
        return null;
      }
    } catch (error) {
      console.error('Failed to fetch assignment:', error);
      // Return cached data if available, even if stale
      return this.cachedAssignment;
    }
  }

  /**
   * Get workplace location from assignment
   */
  async getMyWorkplaceLocation(forceRefresh: boolean = false): Promise<WorkplaceLocation | null> {
    const assignment = await this.getMyAssignment(forceRefresh);
    
    if (!assignment || !assignment.workplace_location) {
      return null;
    }

    const workplaceLocation = {
      id: assignment.workplace_location.id.toString(),
      name: assignment.workplace_location.name,
      latitude: parseFloat(assignment.workplace_location.latitude.toString()),
      longitude: parseFloat(assignment.workplace_location.longitude.toString()),
      radius: parseInt(assignment.workplace_location.radius.toString()),
      address: assignment.workplace_location.description,
      isActive: assignment.workplace_location.is_active,
    };
    
    return workplaceLocation;
  }

  /**
   * Get workplace location for a specific employee
   */
  async getEmployeeWorkplaceLocation(employeeId: string): Promise<WorkplaceLocation | null> {
    try {
      const response = await apiService.getUser(employeeId);
      
      // Handle both camelCase and snake_case from API
      // The API returns user data directly, not wrapped in a 'user' object
      const user = (response as any).user || (response as any);
      const currentAssignment = user.current_assignment || user.currentAssignment;
      
      if (user && currentAssignment && currentAssignment.workplace_location) {
        const workplaceLocation = {
          id: currentAssignment.workplace_location.id.toString(),
          name: currentAssignment.workplace_location.name,
          latitude: parseFloat(currentAssignment.workplace_location.latitude.toString()),
          longitude: parseFloat(currentAssignment.workplace_location.longitude.toString()),
          radius: parseInt(currentAssignment.workplace_location.radius.toString()),
          address: currentAssignment.workplace_location.description,
          isActive: currentAssignment.workplace_location.is_active,
        };
        
        return workplaceLocation;
      } else {
        return null;
      }
    } catch (error) {
      console.error('Failed to fetch employee assignment:', error);
      return null;
    }
  }

  /**
   * Clear cached assignment data
   */
  clearCache(): void {
    this.cachedAssignment = null;
    this.lastFetchTime = 0;
  }

  /**
   * Check if user has an assignment
   */
  async hasAssignment(): Promise<boolean> {
    const assignment = await this.getMyAssignment();
    return assignment !== null;
  }
}

export const assignmentService = new AssignmentService();
export default assignmentService;
