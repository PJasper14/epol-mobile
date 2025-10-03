import { apiService } from './ApiService';

export interface PasswordResetRequest {
  id: string;
  user_id: string;
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
}

class PasswordResetService {
  private static instance: PasswordResetService;

  public static getInstance(): PasswordResetService {
    if (!PasswordResetService.instance) {
      PasswordResetService.instance = new PasswordResetService();
    }
    return PasswordResetService.instance;
  }

  /**
   * Submit a password reset request
   */
  async submitPasswordResetRequest(request: { reason: string }): Promise<PasswordResetRequest> {
    try {
      const response = await apiService.submitPasswordResetRequest(request);
      return response.data;
    } catch (error) {
      console.error('Error submitting password reset request:', error);
      throw error;
    }
  }

  /**
   * Get all password reset requests
   */
  async getPasswordResetRequests(): Promise<PasswordResetRequest[]> {
    try {
      const response = await apiService.getPasswordResetRequests();
      return response.data?.data || [];
    } catch (error) {
      console.error('Error getting password reset requests:', error);
      return [];
    }
  }
}

export default PasswordResetService;
