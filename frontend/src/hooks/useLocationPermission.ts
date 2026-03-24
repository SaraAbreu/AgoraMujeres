import * as Location from 'expo-location';
import { useEffect, useState } from 'react';

export interface LocationPermissionResult {
  hasPermission: boolean;
  latitude?: number;
  longitude?: number;
  error?: string;
}

/**
 * Hook for handling location permission and retrieval
 * Shows user-friendly error messages and handles different permission states
 */
export const useLocationPermission = () => {
  const [location, setLocation] = useState<LocationPermissionResult>({ hasPermission: false });
  const [requesting, setRequesting] = useState(false);

  const requestLocationPermission = async () => {
    setRequesting(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        setLocation({
          hasPermission: false,
          error: 'Permission denied. Location won\'t be used for weather.',
        });
        setRequesting(false);
        return false;
      }

      // Permission granted, get location
      const currentLocation = await Location.getCurrentPositionAsync();
      setLocation({
        hasPermission: true,
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });
      setRequesting(false);
      return true;
    } catch (error: any) {
      let errorMessage = 'Unable to get location';

      if (error.code === 'E_PERMISSION_UNDETERMINED') {
        errorMessage = 'Permission not yet determined';
      } else if (error.code === 'E_LOCATION_UNAVAILABLE') {
        errorMessage = 'Location service not available';
      } else if (error.code === 'E_LOCATION_TIMEOUT') {
        errorMessage = 'Location request timed out';
      }

      setLocation({
        hasPermission: false,
        error: errorMessage,
      });
      setRequesting(false);
      return false;
    }
  };

  return {
    location,
    requesting,
    requestLocationPermission,
  };
};

/**
 * Get location permission status without requesting
 */
export const checkLocationPermissionStatus = async () => {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    return {
      granted: status === 'granted',
      status,
    };
  } catch (error) {
    return {
      granted: false,
      status: 'unknown',
      error: error,
    };
  }
};
