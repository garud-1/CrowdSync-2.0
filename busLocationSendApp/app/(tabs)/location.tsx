import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Image } from 'expo-image';
import * as Location from 'expo-location';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Button, StyleSheet } from 'react-native';

const BUS_ID = '12f19d3f-2c9a-41a4-bed6-7795ba9f7920';
const API_URL = 'https://adcet-backend.onrender.com/api/v1/bus/update/location';

interface Coordinates {
  latitude: number;
  longitude: number;
}

export default function LocationScreen() {
  const [isSending, setIsSending] = useState<boolean>(false);
  const [location, setLocation] = useState<Coordinates | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ask for permission on mount
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location access is required.');
      }
    })();
  }, []);

  const getCurrentLocation = async (): Promise<Coordinates | null> => {
    try {
      const loc = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = loc.coords;
      setLocation({ latitude, longitude });
      return { latitude, longitude };
    } catch (error) {
      console.error('Error getting location:', error);
      return null;
    }
  };

  const sendLocation = async (): Promise<void> => {
    const loc = await getCurrentLocation();
    if (!loc) return;
    try {
      const response = await fetch(API_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          busId: BUS_ID,
          latitude: loc.latitude,
          longitude: loc.longitude,
        }),
      });
      console.log('Sent:', loc, 'Status:', response.status);
    } catch (error) {
      console.error('POST error:', error);
    }
  };

  const startSending = (): void => {
    if (isSending) return;
    setIsSending(true);
    sendLocation();
    intervalRef.current = setInterval(sendLocation, 10000);
  };

  const stopSending = (): void => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsSending(false);
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#C6E2FF', dark: '#0A2540' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Live Bus Tracker</ThemedText>
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Bus ID: {BUS_ID}</ThemedText>
        <ThemedText>
          {location
            ? `Latitude: ${location.latitude.toFixed(5)}\nLongitude: ${location.longitude.toFixed(5)}`
            : 'Location not fetched yet'}
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
        <Button
          title={isSending ? 'Stop Sending' : 'Start Sending'}
          onPress={isSending ? stopSending : startSending}
        />
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
        <ThemedText type="default">
          Sends your GPS location every 10 seconds to update the bus position.
        </ThemedText>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 16,
  },
  reactLogo: {
    height: 180,
    width: 300,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});
