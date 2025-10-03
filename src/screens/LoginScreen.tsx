import React, { useState } from 'react';
import { View, StyleSheet, Text, Image, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert, Dimensions } from 'react-native';
import { COLORS, SPACING, FONT_SIZES, SHADOWS } from '../utils/theme';
import Button from '../components/Button';
import Input from '../components/Input';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

const LoginScreen = ({ navigation }: any) => {
  const { login, loading: authLoading } = useAuth();
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    username: '',
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

    // Username validation
    if (!credentials.username) {
      newErrors.username = 'Username is required';
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
      const success = await login(credentials.username, credentials.password);
      
      if (!success) {
        setErrors({
          username: '',
          password: 'Invalid username or password',
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


  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const screenHeight = Dimensions.get('window').height;
  const screenWidth = Dimensions.get('window').width;

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
    >
      {/* Background Image */}
      <Image
        source={require('../../assets/images/Epol_BG_Login.jpg')}
        style={styles.backgroundImage}
        resizeMode="cover"
      />
      
      {/* Overlay */}
      <View style={styles.overlay} />
      
      <ScrollView contentContainerStyle={styles.scrollView}>
        <View style={styles.mainContainer}>
          {/* Login Card */}
          <View style={styles.loginCard}>
            {/* Header with Dual Logos */}
            <View style={styles.headerContainer}>
              <View style={styles.logoRow}>
                <View style={styles.logoItem}>
                  <View style={styles.logoContainer}>
                    <Image
                      source={require('../../assets/images/EPOL LOGO.png')}
                      style={styles.logo}
                      resizeMode="contain"
                    />
                  </View>
                  <Text style={styles.logoLabel}>EPOL</Text>
                </View>
                
                <View style={styles.divider} />
                
                <View style={styles.logoItem}>
                  <View style={styles.logoContainer}>
                    <Image
                      source={require('../../assets/images/CABUYAO LOGO.jpg')}
                      style={styles.logo}
                      resizeMode="contain"
                    />
                  </View>
                  <Text style={styles.logoLabel}>CABUYAO</Text>
                </View>
              </View>
              
              <Text style={styles.headerSubtitle}>
                Log in to access the EPOL Mobile App
              </Text>
            </View>

            {/* Login Form */}
            <View style={styles.formContainer}>
              {errors.username || errors.password ? (
                <View style={styles.errorContainer}>
                  <View style={styles.errorDot} />
                  <Text style={styles.errorText}>
                    {errors.username || errors.password}
                  </Text>
                </View>
              ) : null}

              <View style={styles.inputWrapper}>
                <View style={styles.inputIconContainer}>
                  <Ionicons name="person-outline" size={20} color={COLORS.text.secondary} />
                </View>
                <Input
                  placeholder="Username"
                  value={credentials.username}
                  onChangeText={(text) => handleChange('username', text)}
                  autoCapitalize="none"
                  error={errors.username}
                  touched={!!credentials.username || errors.username !== ''}
                  style={styles.input}
                />
              </View>

              <View style={styles.inputWrapper}>
                <View style={styles.inputIconContainer}>
                  <Ionicons name="lock-closed-outline" size={20} color={COLORS.text.secondary} />
                </View>
                <Input
                  placeholder="Password"
                  value={credentials.password}
                  onChangeText={(text) => handleChange('password', text)}
                  secureTextEntry={!showPassword}
                  error={errors.password}
                  touched={!!credentials.password || errors.password !== ''}
                  rightIcon={
                    <Ionicons 
                      name={showPassword ? 'eye-off' : 'eye'} 
                      size={20} 
                      color={COLORS.text.secondary}
                    />
                  } 
                  onPressRightIcon={togglePasswordVisibility}
                  style={styles.input}
                />
              </View>

              <Button
                title="SIGN IN"
                onPress={handleLogin}
                loading={loading || authLoading}
                fullWidth
                style={styles.loginButton}
              />

            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 134, 134, 0.4)',
  },
  scrollView: {
    flexGrow: 1,
    padding: SPACING.l,
  },
  mainContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: Dimensions.get('window').height - (SPACING.l * 2),
  },
  loginCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: SPACING.xl,
    width: '100%',
    maxWidth: 400,
    ...SHADOWS.large,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.l,
  },
  logoItem: {
    alignItems: 'center',
  },
  logoContainer: {
    width: 60,
    height: 60,
    backgroundColor: COLORS.background,
    borderRadius: 30,
    ...SHADOWS.medium,
    borderWidth: 1,
    borderColor: COLORS.divider,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  logo: {
    width: 40,
    height: 40,
  },
  logoLabel: {
    fontSize: FONT_SIZES.caption,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.divider,
    marginHorizontal: SPACING.l,
  },
  headerSubtitle: {
    fontSize: FONT_SIZES.body,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  formContainer: {
    width: '100%',
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    padding: SPACING.m,
    marginBottom: SPACING.m,
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorDot: {
    width: 8,
    height: 8,
    backgroundColor: COLORS.error,
    borderRadius: 4,
    marginRight: SPACING.s,
  },
  errorText: {
    color: COLORS.error,
    fontSize: FONT_SIZES.caption,
    fontWeight: '500',
    flex: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.m,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.divider,
    paddingLeft: SPACING.m,
    paddingRight: SPACING.xl,
    minHeight: 48,
    ...SHADOWS.small,
  },
  inputIconContainer: {
    marginRight: SPACING.s,
    marginTop: SPACING.s,
    marginBottom: SPACING.s,
  },
  input: {
    flex: 1,
    borderWidth: 0,
    backgroundColor: 'transparent',
    marginTop: SPACING.m,
  },
  loginButton: {
    marginTop: SPACING.m,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    height: 50,
    ...SHADOWS.medium,
  },
});

export default LoginScreen; 