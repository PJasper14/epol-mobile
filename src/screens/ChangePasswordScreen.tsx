import React, { useState } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Avatar, Button } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, SHADOWS, BORDER_RADIUS } from '../utils/theme';
import { useAuth } from '../context/AuthContext';
import Input from '../components/Input';
import PasswordResetService from '../services/PasswordResetService';

const ChangePasswordScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [validatingCurrentPassword, setValidatingCurrentPassword] = useState(false);
  const [currentPasswordValid, setCurrentPasswordValid] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    reason: '',
  });
  const [errors, setErrors] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    reason: '',
  });

  const validateCurrentPassword = async (password: string) => {
    if (!password.trim()) {
      setCurrentPasswordValid(false);
      return;
    }

    try {
      setValidatingCurrentPassword(true);
      
      // Simulate API call to validate current password
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
      
      // TODO: Implement real password validation API call
      // For now, we'll simulate validation
      // This should be replaced with actual API call to validate current password
      // const response = await apiService.validateCurrentPassword(password);
      // const isValid = response.valid;
      
      // For now, accept any non-empty password for testing
      const isValid = password.length >= 6;
      
      setCurrentPasswordValid(isValid);
      
      if (!isValid) {
        setErrors(prev => ({
          ...prev,
          currentPassword: 'Current password is incorrect',
        }));
      } else {
        setErrors(prev => ({
          ...prev,
          currentPassword: '',
        }));
      }
    } catch (error) {
      console.error('Error validating current password:', error);
      setCurrentPasswordValid(false);
      setErrors(prev => ({
        ...prev,
        currentPassword: 'Failed to validate current password',
      }));
    } finally {
      setValidatingCurrentPassword(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
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

    // Validate current password when it changes
    if (field === 'currentPassword') {
      setCurrentPasswordValid(false);
      if (value.trim()) {
        // Debounce the validation to avoid too many API calls
        const timeoutId = setTimeout(() => {
          validateCurrentPassword(value);
        }, 500);
        return () => clearTimeout(timeoutId);
      }
    }
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = { ...errors };

    // Current password validation
    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
      isValid = false;
    } else if (!currentPasswordValid) {
      newErrors.currentPassword = 'Please enter the correct current password';
      isValid = false;
    }

    // Only validate new password fields if current password is valid
    if (currentPasswordValid) {
      // New password validation
      if (!formData.newPassword) {
        newErrors.newPassword = 'New password is required';
        isValid = false;
      } else if (formData.newPassword.length < 6) {
        newErrors.newPassword = 'Password must be at least 6 characters';
        isValid = false;
      } else if (formData.newPassword === formData.currentPassword) {
        newErrors.newPassword = 'New password must be different from current password';
        isValid = false;
      }

      // Confirm password validation
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your new password';
        isValid = false;
      } else if (formData.newPassword !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
        isValid = false;
      }

      // Reason validation
      if (!formData.reason.trim()) {
        newErrors.reason = 'Please provide a reason for the password change';
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      
      // Create password reset request using the service
      const passwordResetService = PasswordResetService.getInstance();
      
      const requestData = {
        reason: formData.reason,
      };

      await passwordResetService.submitPasswordResetRequest(requestData);

      Alert.alert(
        'Request Submitted',
        'Your password change request has been submitted for approval. You will be notified once it is processed.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
      
    } catch (error) {
      console.error('Error submitting password change request:', error);
      Alert.alert(
        'Error',
        'Failed to submit password change request. Please try again later.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Avatar.Icon 
            size={40} 
            icon="arrow-left" 
            color="#FFFFFF"
            style={{ backgroundColor: 'transparent' }}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Change Password</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.formContainer}>
          <View style={styles.iconContainer}>
            <Avatar.Icon 
              size={80} 
              icon="lock-reset" 
              color={COLORS.primary}
              style={{ backgroundColor: `${COLORS.primary}15` }}
            />
          </View>

          <Text style={styles.title}>Change Your Password</Text>
          <Text style={styles.subtitle}>
            For security reasons, password changes require administrator approval.
          </Text>

          <View style={styles.form}>
            {/* Current Password */}
            <View style={styles.inputWrapper}>
              <View style={styles.inputIconContainer}>
                <Ionicons 
                  name={validatingCurrentPassword ? "hourglass-outline" : currentPasswordValid ? "checkmark-circle" : "lock-closed-outline"} 
                  size={20} 
                  color={
                    validatingCurrentPassword 
                      ? COLORS.warning 
                      : currentPasswordValid 
                        ? COLORS.success 
                        : COLORS.text.secondary
                  } 
                />
              </View>
              <Input
                placeholder="Current Password"
                value={formData.currentPassword}
                onChangeText={(text) => handleChange('currentPassword', text)}
                secureTextEntry={!showPasswords.current}
                error={errors.currentPassword}
                touched={!!formData.currentPassword || errors.currentPassword !== ''}
                rightIcon={
                  <Ionicons 
                    name={showPasswords.current ? 'eye-off' : 'eye'} 
                    size={20} 
                    color={COLORS.text.secondary}
                  />
                } 
                onPressRightIcon={() => togglePasswordVisibility('current')}
                style={styles.input}
              />
            </View>

            {/* New Password */}
            <View style={[styles.inputWrapper, !currentPasswordValid && styles.disabledInput]}>
              <View style={styles.inputIconContainer}>
                <Ionicons 
                  name="key-outline" 
                  size={20} 
                  color={currentPasswordValid ? COLORS.text.secondary : COLORS.text.disabled} 
                />
              </View>
              <Input
                placeholder={currentPasswordValid ? "New Password" : "Enter current password first"}
                value={formData.newPassword}
                onChangeText={(text) => handleChange('newPassword', text)}
                secureTextEntry={!showPasswords.new}
                error={errors.newPassword}
                touched={!!formData.newPassword || errors.newPassword !== ''}
                editable={currentPasswordValid}
                rightIcon={
                  <Ionicons 
                    name={showPasswords.new ? 'eye-off' : 'eye'} 
                    size={20} 
                    color={currentPasswordValid ? COLORS.text.secondary : COLORS.text.disabled}
                  />
                } 
                onPressRightIcon={() => currentPasswordValid && togglePasswordVisibility('new')}
                style={[styles.input, !currentPasswordValid && styles.disabledText]}
              />
            </View>

            {/* Confirm Password */}
            <View style={[styles.inputWrapper, !currentPasswordValid && styles.disabledInput]}>
              <View style={styles.inputIconContainer}>
                <Ionicons 
                  name="checkmark-circle-outline" 
                  size={20} 
                  color={currentPasswordValid ? COLORS.text.secondary : COLORS.text.disabled} 
                />
              </View>
              <Input
                placeholder={currentPasswordValid ? "Confirm New Password" : "Enter current password first"}
                value={formData.confirmPassword}
                onChangeText={(text) => handleChange('confirmPassword', text)}
                secureTextEntry={!showPasswords.confirm}
                error={errors.confirmPassword}
                touched={!!formData.confirmPassword || errors.confirmPassword !== ''}
                editable={currentPasswordValid}
                rightIcon={
                  <Ionicons 
                    name={showPasswords.confirm ? 'eye-off' : 'eye'} 
                    size={20} 
                    color={currentPasswordValid ? COLORS.text.secondary : COLORS.text.disabled}
                  />
                } 
                onPressRightIcon={() => currentPasswordValid && togglePasswordVisibility('confirm')}
                style={[styles.input, !currentPasswordValid && styles.disabledText]}
              />
            </View>

            {/* Reason Field */}
            <View style={[styles.inputWrapper, !currentPasswordValid && styles.disabledInput]}>
              <View style={styles.inputIconContainer}>
                <Ionicons 
                  name="document-text-outline" 
                  size={20} 
                  color={currentPasswordValid ? COLORS.text.secondary : COLORS.text.disabled} 
                />
              </View>
              <Input
                placeholder={currentPasswordValid ? "Reason for password change" : "Enter current password first"}
                value={formData.reason}
                onChangeText={(text) => handleChange('reason', text)}
                error={errors.reason}
                touched={!!formData.reason || errors.reason !== ''}
                multiline
                numberOfLines={3}
                editable={currentPasswordValid}
                style={[styles.input, styles.textArea, !currentPasswordValid && styles.disabledText]}
              />
            </View>

            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={loading}
              disabled={loading || !currentPasswordValid}
              style={[styles.submitButton, !currentPasswordValid && styles.disabledButton]}
              contentStyle={styles.submitButtonContent}
            >
              {currentPasswordValid ? 'Submit Request' : 'Enter Current Password First'}
            </Button>

            <View style={styles.infoContainer}>
              <View style={styles.infoItem}>
                <Ionicons name="information-circle" size={20} color={COLORS.primary} />
                <Text style={styles.infoText}>
                  Your request will be reviewed by an administrator
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="time" size={20} color={COLORS.primary} />
                <Text style={styles.infoText}>
                  You will be notified once approved
                </Text>
              </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.m,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.m,
    backgroundColor: COLORS.primary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: FONT_SIZES.h2,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.l,
    paddingBottom: SPACING.xl,
  },
  formContainer: {
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: SPACING.l,
  },
  title: {
    fontSize: FONT_SIZES.h1,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    textAlign: 'center',
    marginBottom: SPACING.s,
  },
  subtitle: {
    fontSize: FONT_SIZES.body,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    lineHeight: 22,
  },
  form: {
    width: '100%',
    maxWidth: 400,
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
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    marginTop: SPACING.l,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    ...SHADOWS.medium,
  },
  submitButtonContent: {
    height: 50,
  },
  infoContainer: {
    marginTop: SPACING.xl,
    padding: SPACING.m,
    backgroundColor: `${COLORS.primary}10`,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${COLORS.primary}20`,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.s,
  },
  infoText: {
    fontSize: FONT_SIZES.caption,
    color: COLORS.text.secondary,
    marginLeft: SPACING.s,
    flex: 1,
  },
  disabledInput: {
    opacity: 0.5,
    backgroundColor: COLORS.background,
  },
  disabledText: {
    color: COLORS.text.disabled,
  },
  disabledButton: {
    backgroundColor: COLORS.text.disabled,
  },
});

export default ChangePasswordScreen;
