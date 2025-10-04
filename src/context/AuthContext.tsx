import React, { createContext, useState, useContext, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '../services/ApiService';

export type UserRole = 'team_leader' | 'epol' | 'admin' | 'street_sweeper';

export type WorkplaceLocation = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
  description?: string;
  is_active: boolean;
};

export type EmployeeAssignment = {
  id: number;
  user_id: number;
  workplace_location_id: number;
  assigned_by: number;
  assigned_at: string;
  is_active: boolean;
  workplace_location: WorkplaceLocation;
};

export type User = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  age: number;
  gender: 'Male' | 'Female';
  birthday: string;
  home_address: string;
  role: UserRole;
  employee_id?: string;
  is_active: boolean;
  current_assignment?: EmployeeAssignment;
};

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  // Check for existing session on app load (only for refresh scenarios)
  React.useEffect(() => {
    const loadUser = async () => {
      try {
        const userJson = await AsyncStorage.getItem('user');
        const token = await AsyncStorage.getItem('token');
        
        if (userJson && token) {
          // Validate token by making a test API call
          try {
            const response = await apiService.getCurrentUser();
            if (response.data?.user) {
              setUser(JSON.parse(userJson));
            } else {
              // Token is invalid, clear storage
              await AsyncStorage.removeItem('user');
              await AsyncStorage.removeItem('token');
            }
          } catch (error) {
            // Token is invalid or expired, clear storage
            await AsyncStorage.removeItem('user');
            await AsyncStorage.removeItem('token');
            console.log('Token validation failed, user must log in again');
          }
        }
      } catch (error) {
        console.error('Failed to load user from storage', error);
      }
    };
    
    loadUser();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    setLoading(true);
    
    try {
      const response = await apiService.login(username, password);
      
      // The API returns user and token directly
      if (response.user) {
        const userData: User = response.user;
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        setLoading(false);
        return true;
      } else {
        setLoading(false);
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoading(false);
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      // Try to call API logout, but don't fail if it doesn't work
      await apiService.logout();
    } catch (error) {
      console.log('API logout failed (token may be expired), proceeding with local logout');
    } finally {
      // Always clear local storage and user state, regardless of API call result
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('token');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}; 