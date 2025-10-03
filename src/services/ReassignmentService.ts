import { apiService } from './ApiService';

export interface ReassignmentRequest {
  id: string;
  user_id: string;
  current_location_id: string;
  requested_location_id: string;
  status: 'pending' | 'approved' | 'rejected';
  reason: string;
  admin_notes?: string;
  processed_by?: string;
  processed_at?: string;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
  currentLocation?: {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    radius: number;
    description?: string;
    is_active: boolean;
  };
  requestedLocation?: {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    radius: number;
    description?: string;
    is_active: boolean;
  };
  processedBy?: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

export interface CreateReassignmentRequest {
  requested_location_id: string;
  reason: string;
}

class ReassignmentService {
  private static instance: ReassignmentService;

  public static getInstance(): ReassignmentService {
    if (!ReassignmentService.instance) {
      ReassignmentService.instance = new ReassignmentService();
    }
    return ReassignmentService.instance;
  }

  /**
   * Submit a reassignment request
   */
  async submitReassignmentRequest(request: CreateReassignmentRequest): Promise<ReassignmentRequest> {
    try {
      const response = await apiService.submitReassignmentRequest(request);
      return response.data;
    } catch (error) {
      console.error('Error submitting reassignment request:', error);
      throw error;
    }
  }

  /**
   * Get all reassignment requests (admin only)
   */
  async getReassignmentRequests(): Promise<ReassignmentRequest[]> {
    try {
      const response = await apiService.getReassignmentRequests();
      return response.data?.data || [];
    } catch (error) {
      console.error('Error getting reassignment requests:', error);
      return [];
    }
  }

  /**
   * Get current user's reassignment requests
   */
  async getMyReassignmentRequests(): Promise<ReassignmentRequest[]> {
    try {
      const response = await apiService.getMyReassignmentRequests();
      return response.data?.data || [];
    } catch (error) {
      console.error('Error getting my reassignment requests:', error);
      return [];
    }
  }

  /**
   * Get a specific reassignment request
   */
  async getReassignmentRequest(id: string): Promise<ReassignmentRequest> {
    try {
      const response = await apiService.getReassignmentRequest(id);
      return response.data;
    } catch (error) {
      console.error('Error getting reassignment request:', error);
      throw error;
    }
  }

  /**
   * Approve a reassignment request (admin only)
   */
  async approveReassignmentRequest(id: string, adminNotes?: string): Promise<ReassignmentRequest> {
    try {
      const response = await apiService.approveReassignmentRequest(id, adminNotes);
      return response.data;
    } catch (error) {
      console.error('Error approving reassignment request:', error);
      throw error;
    }
  }

  /**
   * Reject a reassignment request (admin only)
   */
  async rejectReassignmentRequest(id: string, adminNotes: string): Promise<ReassignmentRequest> {
    try {
      const response = await apiService.rejectReassignmentRequest(id, adminNotes);
      return response.data;
    } catch (error) {
      console.error('Error rejecting reassignment request:', error);
      throw error;
    }
  }
}

export default ReassignmentService;
