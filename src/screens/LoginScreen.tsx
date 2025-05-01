import React, { useState } from 'react';
import { View, StyleSheet, Text, Image, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { COLORS, SPACING, FONT_SIZES } from '../utils/theme';
import Button from '../components/Button';
import Input from '../components/Input';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

const LoginScreen = ({ navigation }: any) => {
  const { login, loading: authLoading } = useAuth();
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (field: string, value: string) => {
    setCredentials(prev => ({
      ...prev,
      [field]: value,
    }));
    // Clear error when user types
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = { ...errors };

    // Email validation
    if (!credentials.email) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(credentials.email)) {
      newErrors.email = 'Email is invalid';
      isValid = false;
    }

    // Password validation
    if (!credentials.password) {
      newErrors.password = 'Password is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      // Use the login method from AuthContext
      const success = await login(credentials.email, credentials.password);
      
      if (!success) {
        setErrors({
          email: '',
          password: 'Invalid email or password',
        });
      }
      
      setLoading(false);
    } catch (error) {
      setLoading(false);
      Alert.alert(
        'Error',
        'An error occurred while logging in. Please try again later.'
      );
    }
  };

  const handleForgotPassword = () => {
    // In a real app, navigate to forgot password screen
    // if (navigation) {
    //   navigation.navigate('ForgotPassword');
    // }
    Alert.alert(
      'Reset Password',
      'Please contact your administrator to reset your password.',
      [{ text: 'OK' }]
    );
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
    >
      <ScrollView contentContainerStyle={styles.scrollView}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/images/EPOL LOGO.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <View style={styles.formContainer}>
          <Input
            label="Email Address"
            placeholder="Enter your email"
            value={credentials.email}
            onChangeText={(text) => handleChange('email', text)}
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
            touched={!!credentials.email || errors.email !== ''}
          />

          <Input
            label="Password"
            placeholder="Enter your password"
            value={credentials.password}
            onChangeText={(text) => handleChange('password', text)}
            secureTextEntry={!showPassword}
            error={errors.password}
            touched={!!credentials.password || errors.password !== ''}
            rightIcon={
              <Ionicons 
                name={showPassword ? 'eye-off' : 'eye'} 
                size={24} 
                color={COLORS.text.secondary}
              />
            }
            onPressRightIcon={togglePasswordVisibility}
          />

          <Button
            title="LOGIN"
            onPress={handleLogin}
            loading={loading || authLoading}
            fullWidth
            style={styles.loginButton}
          />

          <TouchableOpacity 
            style={styles.forgotPasswordContainer}
            onPress={handleForgotPassword}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>
        
        {/* <View style={styles.demoCredentials}>
          <Text style={styles.demoTitle}>Demo Credentials</Text>
          <Text style={styles.demoText}>Email: user@example.com</Text>
          <Text style={styles.demoText}>Password: password</Text>
        </View> */}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: SPACING.l,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  logo: {
    width: 180,
    height: 180,
    borderRadius: 90,
  },
  appName: {
    fontSize: FONT_SIZES.h1,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginTop: SPACING.m,
  },
  appTagline: {
    fontSize: FONT_SIZES.body,
    color: COLORS.text.secondary,
    marginTop: SPACING.xs,
  },
  formContainer: {
    width: '100%',
  },
  loginButton: {
    marginTop: SPACING.m,
  },
  forgotPasswordContainer: {
    alignItems: 'center',
    marginTop: SPACING.l,
  },
  forgotPasswordText: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.body,
  },
  demoCredentials: {
    marginTop: SPACING.xl,
    padding: SPACING.m,
    backgroundColor: COLORS.primary + '10',
    borderRadius: 8,
    alignItems: 'center',
  },
  demoTitle: {
    fontSize: FONT_SIZES.body,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  demoText: {
    fontSize: FONT_SIZES.caption,
    color: COLORS.text.secondary,
  },
});

export default LoginScreen; 