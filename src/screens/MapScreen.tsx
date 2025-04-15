import React, { useState } from 'react';
import { View, StyleSheet, Text, Dimensions, TouchableOpacity, ScrollView } from 'react-native';
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import { Avatar, FAB, Chip, Searchbar } from 'react-native-paper';
import { COLORS, SPACING, FONT_SIZES, SHADOWS } from '../utils/theme';

// Mock data for demonstration
const INCIDENTS = [
  {
    id: '1',
    type: 'theft',
    title: 'Theft Reported',
    description: 'Personal items stolen from parked vehicle',
    latitude: 14.5995,
    longitude: 120.9842,
    status: 'active',
    date: '2023-07-12',
  },
  {
    id: '2',
    type: 'vandalism',
    title: 'Vandalism',
    description: 'Graffiti on public property',
    latitude: 14.6037,
    longitude: 120.9818,
    status: 'resolved',
    date: '2023-07-10',
  },
  {
    id: '3',
    type: 'accident',
    title: 'Traffic Accident',
    description: 'Two-car collision, minor injuries',
    latitude: 14.5935,
    longitude: 120.9729,
    status: 'active',
    date: '2023-07-13',
  },
  {
    id: '4',
    type: 'violence',
    title: 'Assault',
    description: 'Physical altercation reported outside bar',
    latitude: 14.6090,
    longitude: 120.9876,
    status: 'active',
    date: '2023-07-11',
  },
];

type IncidentType = 'theft' | 'vandalism' | 'accident' | 'violence' | 'all';

const MapScreen = ({ navigation }: any) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIncident, setSelectedIncident] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<IncidentType>('all');
  
  const getMarkerColor = (type: string) => {
    switch (type) {
      case 'theft':
        return COLORS.error;
      case 'vandalism':
        return COLORS.accent;
      case 'accident':
        return COLORS.info;
      case 'violence':
        return COLORS.error;
      default:
        return COLORS.primary;
    }
  };
  
  const filteredIncidents = INCIDENTS.filter(incident => {
    const matchesSearch = searchQuery === '' || 
      incident.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      incident.description.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesFilter = filterType === 'all' || incident.type === filterType;
    
    return matchesSearch && matchesFilter;
  });

  const getIncidentIcon = (type: string) => {
    switch (type) {
      case 'theft':
        return 'wallet';
      case 'vandalism':
        return 'spray';
      case 'accident':
        return 'car-crash';
      case 'violence':
        return 'alert-circle';
      default:
        return 'map-marker';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search incidents..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
      </View>
      
      <View style={styles.filterContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
        >
          <Chip
            selected={filterType === 'all'}
            onPress={() => setFilterType('all')}
            style={[styles.filterChip, filterType === 'all' && styles.selectedChip]}
            textStyle={filterType === 'all' ? styles.selectedChipText : {}}
          >
            All
          </Chip>
          <Chip
            selected={filterType === 'theft'}
            onPress={() => setFilterType('theft')}
            style={[styles.filterChip, filterType === 'theft' && styles.selectedChip]}
            textStyle={filterType === 'theft' ? styles.selectedChipText : {}}
          >
            Theft
          </Chip>
          <Chip
            selected={filterType === 'vandalism'}
            onPress={() => setFilterType('vandalism')}
            style={[styles.filterChip, filterType === 'vandalism' && styles.selectedChip]}
            textStyle={filterType === 'vandalism' ? styles.selectedChipText : {}}
          >
            Vandalism
          </Chip>
          <Chip
            selected={filterType === 'accident'}
            onPress={() => setFilterType('accident')}
            style={[styles.filterChip, filterType === 'accident' && styles.selectedChip]}
            textStyle={filterType === 'accident' ? styles.selectedChipText : {}}
          >
            Accidents
          </Chip>
          <Chip
            selected={filterType === 'violence'}
            onPress={() => setFilterType('violence')}
            style={[styles.filterChip, filterType === 'violence' && styles.selectedChip]}
            textStyle={filterType === 'violence' ? styles.selectedChipText : {}}
          >
            Violence
          </Chip>
        </ScrollView>
      </View>
      
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: 14.5995,
          longitude: 120.9842,
          latitudeDelta: 0.0222,
          longitudeDelta: 0.0121,
        }}
      >
        {filteredIncidents.map((incident) => (
          <Marker
            key={incident.id}
            coordinate={{
              latitude: incident.latitude,
              longitude: incident.longitude
            }}
            onPress={() => setSelectedIncident(incident.id)}
          >
            <View style={[
              styles.markerContainer,
              {
                backgroundColor: getMarkerColor(incident.type),
                borderColor: selectedIncident === incident.id ? COLORS.background : 'transparent',
                transform: [{ scale: selectedIncident === incident.id ? 1.1 : 1 }]
              }
            ]}>
              <Avatar.Icon 
                size={24} 
                icon={getIncidentIcon(incident.type)} 
                color={COLORS.background}
                style={{ backgroundColor: 'transparent' }}
              />
            </View>
            <Callout>
              <View style={styles.calloutContainer}>
                <Text style={styles.calloutTitle}>{incident.title}</Text>
                <Text style={styles.calloutDescription}>{incident.description}</Text>
                <Text style={styles.calloutDate}>Date: {incident.date}</Text>
                <View style={[
                  styles.statusBadge, 
                  { backgroundColor: incident.status === 'active' ? COLORS.accent : COLORS.success }
                ]}>
                  <Text style={styles.statusText}>
                    {incident.status === 'active' ? 'Active' : 'Resolved'}
                  </Text>
                </View>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>
      
      <FAB
        style={styles.fab}
        icon="plus"
        color={COLORS.background}
        onPress={() => navigation.navigate('ReportIncident')}
      />
      
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Avatar.Icon 
          size={40} 
          icon="arrow-left" 
          color={COLORS.background}
          style={{ backgroundColor: COLORS.primary }}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  searchContainer: {
    position: 'absolute',
    top: SPACING.xl * 2,
    left: 0,
    right: 0,
    zIndex: 5,
    paddingHorizontal: SPACING.l,
  },
  searchBar: {
    ...SHADOWS.medium,
    borderRadius: 8,
  },
  filterContainer: {
    position: 'absolute',
    top: SPACING.xl * 2 + 60,
    left: 0,
    right: 0,
    zIndex: 5,
    paddingHorizontal: SPACING.l,
  },
  filterScrollContent: {
    paddingVertical: SPACING.s,
  },
  filterChip: {
    marginRight: SPACING.s,
    backgroundColor: COLORS.background,
    ...SHADOWS.small,
  },
  selectedChip: {
    backgroundColor: COLORS.primary,
  },
  selectedChipText: {
    color: COLORS.background,
  },
  markerContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    ...SHADOWS.medium,
  },
  calloutContainer: {
    width: 200,
    padding: SPACING.m,
    backgroundColor: COLORS.background,
    borderRadius: 8,
    ...SHADOWS.medium,
  },
  calloutTitle: {
    fontSize: FONT_SIZES.body,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  calloutDescription: {
    fontSize: FONT_SIZES.small,
    color: COLORS.text.secondary,
    marginBottom: SPACING.xs,
  },
  calloutDate: {
    fontSize: FONT_SIZES.small,
    color: COLORS.text.secondary,
    marginBottom: SPACING.s,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.s,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    color: COLORS.background,
    fontSize: FONT_SIZES.small,
    fontWeight: '500',
  },
  fab: {
    position: 'absolute',
    right: SPACING.l,
    bottom: SPACING.l,
    backgroundColor: COLORS.accent,
  },
  backButton: {
    position: 'absolute',
    left: SPACING.l,
    bottom: SPACING.l,
  },
});

export default MapScreen; 