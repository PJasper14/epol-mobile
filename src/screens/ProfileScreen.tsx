import React, { useState } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { Divider, List, Button, Avatar, Switch } from 'react-native-paper';
import { COLORS, SPACING, FONT_SIZES, SHADOWS, BORDER_RADIUS } from '../utils/theme';
import { useAuth } from '../context/AuthContext';
import * as ImagePicker from 'expo-image-picker';

const ProfileScreen = ({ navigation }: any) => {
  const { user, logout } = useAuth();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Please grant permission to access your photos');
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image', error);
      Alert.alert('Error', 'There was a problem selecting your image');
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          onPress: async () => {
            await logout();
          },
          style: 'destructive',
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Avatar.Icon 
            size={40} 
            icon="arrow-left" 
            color={COLORS.text.primary}
            style={{ backgroundColor: 'transparent' }}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.profileSection}>
          <TouchableOpacity onPress={pickImage} style={styles.profileImageContainer}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.profileImage} />
            ) : (
              <Avatar.Text 
                size={100} 
                label={user?.name?.charAt(0) || 'U'} 
                color={COLORS.background}
                style={{ backgroundColor: COLORS.primary }}
              />
            )}
            <View style={styles.editIconContainer}>
              <Avatar.Icon 
                size={30} 
                icon="camera" 
                color={COLORS.background}
                style={{ backgroundColor: COLORS.accent }}
              />
            </View>
          </TouchableOpacity>
          
          <Text style={styles.userName}>{user?.name || 'Demo User'}</Text>
          <Text style={styles.userRole}>{user?.role || 'Officer'}</Text>
          <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
          
          <View style={styles.badgeContainer}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>ID: PO-45872</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: COLORS.success }]}>
              <Text style={styles.badgeText}>Active</Text>
            </View>
          </View>
        </View>

        <View style={[styles.section, SHADOWS.small]}>
          <Text style={styles.sectionTitle}>Account Settings</Text>
          <List.Item
            title="Edit Profile"
            description="Update your personal information"
            left={props => <List.Icon {...props} icon="account-edit" color={COLORS.primary} />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => navigation.navigate('EditProfile')}
          />
          <Divider />
          <List.Item
            title="Change Password"
            description="Update your security credentials"
            left={props => <List.Icon {...props} icon="lock" color={COLORS.primary} />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => navigation.navigate('ChangePassword')}
          />
          <Divider />
          <List.Item
            title="Language"
            description="English (US)"
            left={props => <List.Icon {...props} icon="translate" color={COLORS.primary} />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => navigation.navigate('LanguageSettings')}
          />
        </View>

        <View style={[styles.section, SHADOWS.small]}>
          <Text style={styles.sectionTitle}>App Settings</Text>
          <List.Item
            title="Notifications"
            description="Receive alerts and updates"
            left={props => <List.Icon {...props} icon="bell" color={COLORS.primary} />}
            right={() => (
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                color={COLORS.primary}
              />
            )}
          />
          <Divider />
          <List.Item
            title="Location Services"
            description="Enable location tracking"
            left={props => <List.Icon {...props} icon="map-marker" color={COLORS.primary} />}
            right={() => (
              <Switch
                value={locationEnabled}
                onValueChange={setLocationEnabled}
                color={COLORS.primary}
              />
            )}
          />
          <Divider />
          <List.Item
            title="Dark Mode"
            description="Change app appearance"
            left={props => <List.Icon {...props} icon="theme-light-dark" color={COLORS.primary} />}
            right={() => (
              <Switch
                value={darkModeEnabled}
                onValueChange={setDarkModeEnabled}
                color={COLORS.primary}
              />
            )}
          />
        </View>

        <View style={[styles.section, SHADOWS.small]}>
          <Text style={styles.sectionTitle}>Support</Text>
          <List.Item
            title="Help & Support"
            description="Get assistance with the app"
            left={props => <List.Icon {...props} icon="help-circle" color={COLORS.primary} />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => navigation.navigate('Support')}
          />
          <Divider />
          <List.Item
            title="About"
            description="App information and legal"
            left={props => <List.Icon {...props} icon="information" color={COLORS.primary} />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => navigation.navigate('About')}
          />
        </View>

        <Button 
          mode="outlined" 
          icon="logout" 
          onPress={handleLogout}
          style={styles.logoutButton}
          color={COLORS.error}
        >
          Logout
        </Button>
        
        <View style={{ height: 50 }} />
      </ScrollView>
    </View>
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
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: FONT_SIZES.h2,
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  scrollView: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    backgroundColor: COLORS.background,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: SPACING.l,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  userName: {
    fontSize: FONT_SIZES.h1,
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  userRole: {
    fontSize: FONT_SIZES.body,
    color: COLORS.primary,
    marginTop: SPACING.xs,
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  userEmail: {
    fontSize: FONT_SIZES.caption,
    color: COLORS.text.secondary,
    marginTop: SPACING.xs,
  },
  badgeContainer: {
    flexDirection: 'row',
    marginTop: SPACING.m,
  },
  badge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.m,
    marginHorizontal: SPACING.xs,
  },
  badgeText: {
    color: COLORS.background,
    fontSize: FONT_SIZES.small,
    fontWeight: '500',
  },
  section: {
    marginHorizontal: SPACING.l,
    marginTop: SPACING.l,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.m,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: FONT_SIZES.body,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    margin: SPACING.m,
  },
  logoutButton: {
    marginHorizontal: SPACING.l,
    marginTop: SPACING.xl,
    borderColor: COLORS.error,
  },
});

export default ProfileScreen; 