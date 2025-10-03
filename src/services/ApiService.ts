import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://tricky-beans-crash.loca.lt/api'; // Tunnel URL for mobile access

interface ApiResponse<T> {
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

class ApiService {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
    this.loadToken();
  }

  private async loadToken() {
    try {
      this.token = await AsyncStorage.getItem('auth_token');
    } catch (error) {
      console.error('Failed to load token:', error);
    }
  }

  async setToken(token: string) {
    this.token = token;
    try {
      await AsyncStorage.setItem('auth_token', token);
    } catch (error) {
      console.error('Failed to save token:', error);
    }
  }

  async clearToken() {
    this.token = null;
    try {
      await AsyncStorage.removeItem('auth_token');
    } catch (error) {
      console.error('Failed to clear token:', error);
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        // For validation errors (422), return the error data instead of throwing
        if (response.status === 422) {
          return {
            data: undefined,
            message: data.message || 'Validation error',
            errors: data.errors || {}
          };
        }
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      // For successful responses, return the data directly (Laravel returns user/token directly)
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Authentication
  async login(username: string, password: string) {
    const url = `${this.baseURL}/auth/login`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ username, password, app_type: 'mobile' }),
      });

      const data = await response.json();

      if (!response.ok) {
        // For validation errors (422), return the error data instead of throwing
        if (response.status === 422) {
          return {
            data: undefined,
            message: data.message || 'Validation error',
            errors: data.errors || {}
          };
        }
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      // The Laravel API returns user and token directly
      if (data.token) {
        await this.setToken(data.token);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async logout() {
    try {
      await this.request('/auth/logout', {
        method: 'POST',
      });
    } finally {
      await this.clearToken();
    }
  }

  async getCurrentUser() {
    return this.request<any>('/auth/user');
  }

  // Password Reset Requests
  async submitPasswordResetRequest(requestData: {
    reason: string;
  }) {
    return this.request<any>('/password-resets', {
      method: 'POST',
      body: JSON.stringify(requestData),
    });
  }

  async getPasswordResetRequests() {
    return this.request<any>('/password-resets');
  }

  // Reassignment Requests
  async submitReassignmentRequest(requestData: {
    requested_location_id: string;
    reason: string;
  }) {
    return this.request<any>('/reassignment-requests', {
      method: 'POST',
      body: JSON.stringify(requestData),
    });
  }

  async getReassignmentRequests() {
    return this.request<any>('/reassignment-requests');
  }

  async getMyReassignmentRequests() {
    return this.request<any>('/reassignment-requests/my-requests');
  }

  async getReassignmentRequest(id: string) {
    return this.request<any>(`/reassignment-requests/${id}`);
  }

  async approveReassignmentRequest(id: string, adminNotes?: string) {
    return this.request<any>(`/reassignment-requests/${id}/approve`, {
      method: 'PUT',
      body: JSON.stringify({ admin_notes: adminNotes }),
    });
  }

  async rejectReassignmentRequest(id: string, adminNotes: string) {
    return this.request<any>(`/reassignment-requests/${id}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ admin_notes: adminNotes }),
    });
  }


  // Employee Assignments
  async getMyAssignment() {
    return this.request<any>('/employee-assignments/my-assignment');
  }

  async requestReassignment(reassignmentData: {
    workplace_location_id: number;
    reason: string;
  }) {
    return this.request<any>('/employee-assignments/request-reassignment', {
      method: 'POST',
      body: JSON.stringify(reassignmentData),
    });
  }

  // Inventory
  async getInventoryItems(params?: {
    search?: string;
    stock_status?: 'in_stock' | 'low_stock' | 'out_of_stock';
    per_page?: number;
    page?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.stock_status) queryParams.append('stock_status', params.stock_status);
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.page) queryParams.append('page', params.page.toString());

    const queryString = queryParams.toString();
    return this.request<any>(`/inventory-items${queryString ? `?${queryString}` : ''}`);
  }

  async getInventoryItem(id: string) {
    return this.request<any>(`/inventory-items/${id}`);
  }

  async getLowStockItems() {
    return this.request<any>('/inventory-items/low-stock/items');
  }

  async createInventoryRequest(requestData: {
    items: Array<{
      inventory_item_id: number;
      quantity: number;
      reason: string;
    }>;
  }) {
    return this.request<any>('/inventory-requests', {
      method: 'POST',
      body: JSON.stringify(requestData),
    });
  }

  async getMyInventoryRequests() {
    return this.request<any>('/inventory-requests/my-requests');
  }

  async getInventoryRequest(id: string) {
    return this.request<any>(`/inventory-requests/${id}`);
  }

  // Incident Reports
  async createIncidentReport(reportData: {
    incident_type: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    latitude?: number;
    longitude?: number;
    location_description?: string;
    incident_date: string;
  }) {
    return this.request<any>('/incident-reports', {
      method: 'POST',
      body: JSON.stringify(reportData),
    });
  }

  async uploadIncidentMedia(incidentId: string, mediaData: {
    files: any[]; // File objects
    descriptions?: string[];
  }) {
    const formData = new FormData();
    
    mediaData.files.forEach((file, index) => {
      formData.append('files[]', file);
      if (mediaData.descriptions?.[index]) {
        formData.append(`descriptions[${index}]`, mediaData.descriptions[index]);
      }
    });

    const url = `${this.baseURL}/incident-reports/${incidentId}/upload-media`;
    
    const headers: Record<string, string> = {};
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload media');
    }

    return response.json();
  }

  async getMyIncidentReports() {
    return this.request<any>('/incident-reports?reported_by=me');
  }

  // Attendance
  async checkIn(checkInData: {
    workplace_location_id: number;
    latitude?: number;
    longitude?: number;
    notes?: string;
  }) {
    return this.request<any>('/attendance/check-in', {
      method: 'POST',
      body: JSON.stringify(checkInData),
    });
  }

  async checkOut(checkOutData: {
    latitude?: number;
    longitude?: number;
    notes?: string;
  }) {
    return this.request<any>('/attendance/check-out', {
      method: 'POST',
      body: JSON.stringify(checkOutData),
    });
  }

  async getMyAttendanceRecords(params?: {
    date_from?: string;
    date_to?: string;
  }) {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request<any>(`/attendance/records/my-records${queryString}`);
  }

  // Team Leader specific endpoints
  async getAttendanceValidations(params?: {
    date?: string;
    status?: string;
  }) {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request<any>(`/attendance/validations${queryString}`);
  }

  async approveAttendanceValidation(id: string, notes?: string) {
    return this.request<any>(`/attendance/validations/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  }

  async rejectAttendanceValidation(id: string, notes?: string) {
    return this.request<any>(`/attendance/validations/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  }

  async getTeamAttendanceRecords(params?: {
    date?: string;
    user_id?: string;
  }) {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request<any>(`/attendance/records${queryString}`);
  }

  // Workplace Location endpoints
  async getWorkplaceLocations() {
    return this.request<any>('/workplace-locations');
  }

  async getWorkplaceLocation(id: string) {
    return this.request<any>(`/workplace-locations/${id}`);
  }

  // Inventory Request endpoints
  async submitInventoryRequest(data: {
    items: Array<{
      inventory_item_id: string;
      quantity: number;
    }>;
    reason: string;
    request_date: string;
  }) {
    return this.request<any>('/inventory-requests', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

}

export const apiService = new ApiService();
export default apiService;
