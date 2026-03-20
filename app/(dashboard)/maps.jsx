// app/(dashboard)/maps.jsx
import React, { useEffect, useState } from "react";
import { StyleSheet, View, ActivityIndicator, Alert, Text } from "react-native";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";

export default function Maps() {
  const [region, setRegion] = useState(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission denied", "Location access is required.");
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      setRegion({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    })();
  }, []);

  if (!region) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <MapView style={styles.map} region={region} showsUserLocation>
      <Marker coordinate={region} title="You are here" />
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1 },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
