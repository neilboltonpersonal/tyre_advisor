'use client';

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.webpack.css';
import 'leaflet-defaulticon-compatibility';

interface LocationData {
  latitude: number;
  longitude: number;
  city: string;
  country: string;
}

interface TyreUsageData {
  location: string;
  tyreModel: string;
  brand: string;
  usageCount: number;
  latitude: number;
  longitude: number;
}

interface MapComponentProps {
  userLocation: LocationData;
  tyreData: TyreUsageData[];
  getIntensityColor: (intensity: 'low' | 'medium' | 'high') => string;
}

// Fix for default markers in Leaflet is no longer needed with leaflet-defaulticon-compatibility
// delete (L.Icon.Default.prototype as any)._getIconUrl;
// L.Icon.Default.mergeOptions({
//   iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
//   iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
//   shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
// });

// This component now handles both resizing and fitting bounds when the map becomes visible.
function MapUpdater({ userLocation, tyreData }: { userLocation: LocationData, tyreData: TyreUsageData[] }) {
  const map = useMap();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // A small delay to ensure the container has finished resizing
          setTimeout(() => {
            map.invalidateSize();

            const points = tyreData.map(d => L.latLng(d.latitude, d.longitude));
            points.push(L.latLng(userLocation.latitude, userLocation.longitude));

            if (points.length > 0) {
              map.fitBounds(L.latLngBounds(points).pad(0.2));
            }
          }, 200);
        }
      },
      { threshold: 0.5 } // Trigger when 50% of the map is visible
    );

    const container = map.getContainer();
    if (container) {
      observer.observe(container);
    }

    return () => {
      if (container) {
        observer.unobserve(container);
      }
    };
  }, [map, userLocation, tyreData]);

  return null;
}

export default function MapComponent({ userLocation, tyreData, getIntensityColor }: MapComponentProps) {
  const getUsageIntensity = (count: number): 'low' | 'medium' | 'high' => {
    if (count < 20) return 'low';
    if (count < 35) return 'medium';
    return 'high';
  };

  return (
    <MapContainer
      center={[userLocation.latitude, userLocation.longitude]}
      zoom={13}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={false} // Prevent zooming with scroll wheel
    >
      <TileLayer
        attribution='&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors'
        url="https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png"
      />

      {/* User location marker */}
      <Marker position={[userLocation.latitude, userLocation.longitude]}>
        <Popup>
          <div style={{ textAlign: 'center' }}>
            <strong>Your Location</strong><br />
            {userLocation.city}, {userLocation.country}
          </div>
        </Popup>
      </Marker>

      {/* Tyre usage circles - these act as heatmap points */}
      {tyreData.map((data, index) => {
        const intensity = getUsageIntensity(data.usageCount);
        const color = getIntensityColor(intensity);
        const radius = Math.max(50, Math.min(200, data.usageCount * 3)); // Scale radius by usage count

        return (
          <Circle
            key={index}
            center={[data.latitude, data.longitude]}
            radius={radius}
            pathOptions={{
              fillColor: color,
              color: color,
              weight: 2,
              opacity: 0.6,
              fillOpacity: 0.3
            }}
          >
            <Popup>
              <div style={{ minWidth: '200px' }}>
                <strong>{data.tyreModel}</strong><br />
                <em>{data.brand}</em><br />
                <strong>{data.usageCount} users</strong> in your area<br />
                <small>Usage intensity: {intensity}</small><br />
                <small>{data.location}</small>
              </div>
            </Popup>
          </Circle>
        );
      })}

      <MapUpdater userLocation={userLocation} tyreData={tyreData} />
    </MapContainer>
  );
} 