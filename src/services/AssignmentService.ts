import { apiService } from './ApiService';
import { WorkplaceLocation } from '../config/workplace';

export interface EmployeeAssignment {
  id: string;
  user_id: string;
  workplace_location_id: string;
  assigned_by: string;
  workplaceLocation?: {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    radius: number;
    description?: string;
    is_active: boolean;
  };
  assignedBy?: {
    id: string;
    first_name: string;
    last_name: string;
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
      
      if (response.data?.assignment) {
        this.cachedAssignment = response.data.assignment;
        this.lastFetchTime = now;
        return response.data.assignment;
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
    
    if (!assignment || !assignment.workplaceLocation) {
      return null;
    }

    return {
      id: assignment.workplaceLocation.id.toString(),
      name: assignment.workplaceLocation.name,
      latitude: parseFloat(assignment.workplaceLocation.latitude.toString()),
      longitude: parseFloat(assignment.workplaceLocation.longitude.toString()),
      radius: parseInt(assignment.workplaceLocation.radius.toString()),
      address: assignment.workplaceLocation.description,
      isActive: assignment.workplaceLocation.is_active,
    };
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
