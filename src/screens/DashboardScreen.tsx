import React from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Card, Title, Paragraph, Button, Avatar } from 'react-native-paper';
import { COLORS, SPACING, FONT_SIZES, SHADOWS } from '../utils/theme';
import { useAuth } from '../context/AuthContext';

const DashboardScreen = ({ navigation }: any) => {
  const { user } = useAuth();

  const renderStatsCard = () => (
    <Card style={[styles.card, SHADOWS.medium]}>
      <Card.Content>
        <Title style={styles.cardTitle}>Today's Statistics</Title>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>12</Text>
            <Text style={styles.statLabel}>Reports</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>5</Text>
            <Text style={styles.statLabel}>In Progress</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>7</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  const renderQuickActions = () => (
    <Card style={[styles.card, SHADOWS.medium]}>
      <Card.Content>
        <Title style={styles.cardTitle}>Quick Actions</Title>
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('ReportIncident')}
          >
            <Avatar.Icon 
              size={50} 
              icon="clipboard-alert" 
              color={COLORS.background}
              style={{ backgroundColor: COLORS.primary }}
            />
            <Text style={styles.actionText}>Report</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('SearchDatabase')}
          >
            <Avatar.Icon 
              size={50} 
              icon="database-search" 
              color={COLORS.background}
              style={{ backgroundColor: COLORS.secondary }}
            />
            <Text style={styles.actionText}>Search</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('Map')}
          >
            <Avatar.Icon 
              size={50} 
              icon="map-marker" 
              color={COLORS.background}
              style={{ backgroundColor: COLORS.accent }}
            />
            <Text style={styles.actionText}>Map</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('Scanner')}
          >
            <Avatar.Icon 
              size={50} 
              icon="qrcode-scan" 
              color={COLORS.background}
              style={{ backgroundColor: COLORS.info }}
            />
            <Text style={styles.actionText}>Scan</Text>
          </TouchableOpacity>
        </View>
      </Card.Content>
    </Card>
  );

  const renderRecentActivities = () => (
    <Card style={[styles.card, SHADOWS.medium]}>
      <Card.Content>
        <Title style={styles.cardTitle}>Recent Activities</Title>
        <View style={styles.activitiesContainer}>
          <View style={styles.activityItem}>
            <Avatar.Icon 
              size={40} 
              icon="file-document" 
              color={COLORS.background}
              style={{ backgroundColor: COLORS.primary }}
            />
            <View style={styles.activityDetails}>
              <Text style={styles.activityTitle}>Report #2204 Filed</Text>
              <Text style={styles.activityTime}>Today, 10:45 AM</Text>
            </View>
          </View>
          
          <View style={styles.activityItem}>
            <Avatar.Icon 
              size={40} 
              icon="check-circle" 
              color={COLORS.background}
              style={{ backgroundColor: COLORS.success }}
            />
            <View style={styles.activityDetails}>
              <Text style={styles.activityTitle}>Case #1872 Closed</Text>
              <Text style={styles.activityTime}>Yesterday, 4:30 PM</Text>
            </View>
          </View>
          
          <View style={styles.activityItem}>
            <Avatar.Icon 
              size={40} 
              icon="account-search" 
              color={COLORS.background}
              style={{ backgroundColor: COLORS.info }}
            />
            <View style={styles.activityDetails}>
              <Text style={styles.activityTitle}>Database Search Performed</Text>
              <Text style={styles.activityTime}>Yesterday, 2:15 PM</Text>
            </View>
          </View>
        </View>
        
        <Button 
          mode="text" 
          onPress={() => navigation.navigate('Activities')}
          style={styles.viewAllButton}
        >
          View All Activities
        </Button>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello,</Text>
          <Text style={styles.userName}>{user?.name || 'Officer'}</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
          <Avatar.Text 
            size={50} 
            label={user?.name?.charAt(0) || 'U'} 
            color={COLORS.background}
            style={{ backgroundColor: COLORS.primary }}
          />
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {renderStatsCard()}
        {renderQuickActions()}
        {renderRecentActivities()}
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
    paddingHorizontal: SPACING.l,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.m,
    backgroundColor: COLORS.background,
  },
  greeting: {
    fontSize: FONT_SIZES.body,
    color: COLORS.text.secondary,
  },
  userName: {
    fontSize: FONT_SIZES.h1,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginTop: SPACING.xs,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: SPACING.l,
  },
  card: {
    marginBottom: SPACING.l,
    borderRadius: 12,
  },
  cardTitle: {
    fontSize: FONT_SIZES.h2,
    marginBottom: SPACING.m,
    color: COLORS.text.primary,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.s,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: FONT_SIZES.h1,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: FONT_SIZES.caption,
    color: COLORS.text.secondary,
    marginTop: SPACING.xs,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    alignItems: 'center',
    width: '22%',
    marginBottom: SPACING.m,
  },
  actionText: {
    fontSize: FONT_SIZES.small,
    marginTop: SPACING.xs,
    color: COLORS.text.primary,
  },
  activitiesContainer: {
    marginTop: SPACING.s,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.m,
  },
  activityDetails: {
    marginLeft: SPACING.m,
    flex: 1,
  },
  activityTitle: {
    fontSize: FONT_SIZES.body,
    color: COLORS.text.primary,
  },
  activityTime: {
    fontSize: FONT_SIZES.small,
    color: COLORS.text.secondary,
    marginTop: SPACING.xs,
  },
  viewAllButton: {
    marginTop: SPACING.s,
  },
});

export default DashboardScreen; 