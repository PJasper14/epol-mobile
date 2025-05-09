import React, { createContext, useState, useContext, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type UserRole = 'team_leader' | 'street_sweeper';

export type User = {
  id: string;
  name?: string;
  email: string;
  displayName?: string;
  role: UserRole;
};

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
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

  const login = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    
    try {
      // This is where you would normally call your API
      // For demo purposes, we'll use a timeout and mock data
      return new Promise((resolve) => {
        setTimeout(() => {
          // Mock successful authentication for different roles
          if (email === 'leader@example.com' && password === 'password') {
            const userData: User = {
              id: '1',
              email: email,
              name: 'Team Leader',
              role: 'team_leader',
            };
            
            AsyncStorage.setItem('user', JSON.stringify(userData));
            setUser(userData);
            setLoading(false);
            resolve(true);
          } else if (email === 'sweeper@example.com' && password === 'password') {
            const userData: User = {
              id: '2',
              email: email,
              name: 'Street Sweeper',
              role: 'street_sweeper',
            };
            
            AsyncStorage.setItem('user', JSON.stringify(userData));
            setUser(userData);
            setLoading(false);
            resolve(true);
          } else {
            setLoading(false);
            resolve(false);
          }
        }, 1000);
      });
    } catch (error) {
      console.error('Login error:', error);
      setLoading(false);
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
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