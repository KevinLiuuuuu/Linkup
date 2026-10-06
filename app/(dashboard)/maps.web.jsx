import { useEffect } from 'react';
import { View } from 'react-native';

export default function MapsWeb() {
  useEffect(() => {
    // Inject Leaflet CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    // Inject Leaflet JS
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => {
      const map = window.L.map('map').setView([-33.8688, 151.2093], 13);
      window.L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);
    };
    document.head.appendChild(script);
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <div id="map" style={{ height: '100vh', width: '100%' }} />
    </View>
  );
}