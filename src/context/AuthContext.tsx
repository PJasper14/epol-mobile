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

  // Check for existing session on app load
  React.useEffect(() => {
    const loadUser = async () => {
      try {
        const userJson = await AsyncStorage.getItem('user');
        if (userJson) {
          setUser(JSON.parse(userJson));
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
      await apiService.logout();
      await AsyncStorage.removeItem('user');
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}; 