# Geofencing Setup for EPOL Mobile Attendance

This document explains how to set up and configure the geofencing feature for the EPOL mobile attendance system.

## Overview

The geofencing feature ensures that employees can only clock in/out when they are within a specified radius of the workplace, similar to Life360's location-based features.

## Features

- ✅ **Location-based Clock In/Out**: Only allows attendance when within workplace radius
- ✅ **Real-time Location Checking**: Uses GPS to verify current location
- ✅ **Visual Map Interface**: Shows workplace location with radius circle
- ✅ **Distance Calculation**: Displays exact distance from workplace
- ✅ **Configurable Radius**: Easy to adjust allowed radius
- ✅ **Error Handling**: Clear messages when outside allowed area

## Configuration

### 1. Set Workplace Location

Edit `src/config/workplace.ts`:

```typescript
export const WORKPLACE_CONFIG = {
  // Update these coordinates to your actual workplace
  latitude: 14.5995,  // Your workplace latitude
  longitude: 120.9842, // Your workplace longitude
  
  // Allowed radius in meters (100m = ~328 feet)
  radius: 100,
  
  // Workplace name
  name: 'EPOL Office',
};
```

### 2. How to Get Coordinates

1. Go to [Google Maps](https://maps.google.com)
2. Find your workplace location
3. Right-click on the location
4. Select "What's here?"
5. Copy the latitude and longitude values
6. Update the coordinates in `workplace.ts`

### 3. Adjust Radius

- **50m**: Very strict (small office building)
- **100m**: Standard (medium office)
- **200m**: Relaxed (large campus)
- **500m**: Very relaxed (industrial area)

## How It Works

### 1. Location Checking Process

1. **Permission Request**: App requests location permission
2. **GPS Detection**: Gets current GPS coordinates
3. **Distance Calculation**: Calculates distance from workplace
4. **Radius Validation**: Checks if within allowed radius
5. **Attendance Control**: Enables/disables clock in/out buttons

### 2. User Interface

- **Location Status Card**: Shows current location status
- **Distance Display**: Shows exact distance from workplace
- **Map View**: Visual representation with radius circle
- **Warning Messages**: Clear feedback when outside radius

### 3. Security Features

- **Real-time Validation**: Checks location before each clock in/out
- **No Bypass**: Cannot clock in/out when outside radius
- **Clear Feedback**: Users know exactly why they can't clock in/out

## Usage

### For Employees

1. **Open Attendance Screen**: Navigate to attendance section
2. **Check Location**: App automatically checks your location
3. **View Status**: See if you're within workplace radius
4. **Clock In/Out**: Only available when within radius
5. **View Map**: Tap "View Map" to see workplace location

### For Administrators

1. **Configure Location**: Update coordinates in config file
2. **Set Radius**: Adjust allowed radius as needed
3. **Monitor Usage**: Check attendance records for location compliance

## Technical Details

### Dependencies

- `expo-location`: GPS location services
- `react-native-maps`: Map visualization
- `react-native-vector-icons`: Icons

### Key Files

- `src/config/workplace.ts`: Workplace configuration
- `src/utils/geofencing.ts`: Location calculation logic
- `src/components/LocationStatusCard.tsx`: Location status UI
- `src/components/WorkplaceMap.tsx`: Map visualization
- `src/screens/AttendanceScreen.tsx`: Main attendance screen

### Location Accuracy

- **High Accuracy**: Uses `Location.Accuracy.High` for precise location
- **Haversine Formula**: Accurate distance calculation between coordinates
- **Real-time Updates**: Refreshes location on demand

## Troubleshooting

### Common Issues

1. **"Location permission denied"**
   - Go to device settings
   - Enable location permission for the app

2. **"Failed to get location"**
   - Check GPS is enabled
   - Try moving to an open area
   - Restart the app

3. **"Outside workplace radius"**
   - Move closer to the workplace
   - Check if coordinates are correct
   - Consider increasing radius if needed

### Testing

1. **Test Inside Radius**: Clock in/out when near workplace
2. **Test Outside Radius**: Try clocking in/out when far away
3. **Test Edge Cases**: Test exactly at the radius boundary
4. **Test Map View**: Verify map shows correct location and radius

## Security Considerations

- **No Location Spoofing**: Uses device GPS, not user input
- **Real-time Validation**: Checks location at time of clock in/out
- **No Offline Bypass**: Requires active location services
- **Audit Trail**: All location checks are logged

## Future Enhancements

- **Multiple Workplaces**: Support for different office locations
- **Time-based Rules**: Different radius for different times
- **Manager Override**: Allow managers to override location restrictions
- **Location History**: Track employee location patterns
- **Push Notifications**: Alert when approaching workplace

## Support

For technical support or questions about the geofencing feature, contact the development team or refer to the main project documentation.
