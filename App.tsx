import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';

// Theme
import theme from './src/utils/theme';

// Screens
import LoginScreen from './src/screens/LoginScreen';

// We'll create a simple placeholder for MainNavigator if it doesn't exist yet
const MainNavigatorPlaceholder = () => null;

// Auth Context - Import the proper implementation
import { AuthProvider, useAuth } from './src/context/AuthContext';

// Stack Types
type AuthStackParamList = {
  Login: undefined;
};

type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

const AuthStack = createStackNavigator<AuthStackParamList>();
const RootStack = createStackNavigator<RootStackParamList>();

// Auth Navigator
const AuthNavigator = () => (
  <AuthStack.Navigator screenOptions={{ headerShown: false }}>
    <AuthStack.Screen name="Login" component={LoginScreen} />
  </AuthStack.Navigator>
);

// Root Navigator with Auth Check
const RootNavigator = () => {
  const { user } = useAuth();
  
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <RootStack.Screen 
          name="Main" 
          component={require('./src/navigation/MainNavigator').default || MainNavigatorPlaceholder} 
        />
      ) : (
        <RootStack.Screen name="Auth" component={AuthNavigator} />
      )}
    </RootStack.Navigator>
  );
};

// Main App Component
export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <AuthProvider>
          <NavigationContainer>
            <StatusBar style="auto" />
            <RootNavigator />
          </NavigationContainer>
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
