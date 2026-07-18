import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';

interface Coords {
  lat: number;
  lng: number;
}

interface Activity {
  activityName: string;
  coords: Coords;
  timeSlot: string;
}

interface LeafletMapProps {
  hotelCoords: Coords;
  hotelName: string;
  activities: Activity[];
}

export const LeafletMap: React.FC<LeafletMapProps> = ({ hotelCoords, hotelName, activities }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  
  // Geolocation tracking states
  const [myCoords, setMyCoords] = useState<Coords | null>(null);

  // Set default marker icons for Leaflet on browser load
  useEffect(() => {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });
  }, []);

  // Request browser geolocation or seed fallback mock coordinates
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setMyCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          });
        },
        () => {
          // If permission is denied or fails, seed a high-fidelity local position 
          // offset from the hotel coordinates to demonstrate the pin.
          setMyCoords({
            lat: hotelCoords.lat + 0.006,
            lng: hotelCoords.lng - 0.006
          });
        }
      );
    } else {
      setMyCoords({
        lat: hotelCoords.lat + 0.006,
        lng: hotelCoords.lng - 0.006
      });
    }
  }, [hotelCoords]);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Clean up previous map if it exists
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    try {
      const map = L.map(mapContainerRef.current).setView([hotelCoords.lat, hotelCoords.lng], 13);
      mapInstanceRef.current = map;

      // Dark Mode thematic map tiles (CartoDB Dark Matter)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
      }).addTo(map);

      // Create Custom Hotel Icon
      const hotelIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div class="w-8 h-8 rounded-full bg-primary border-2 border-white flex items-center justify-center shadow-lg shadow-primary/40"><span class="text-white text-xs">🏨</span></div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });

      // Add Hotel Marker
      L.marker([hotelCoords.lat, hotelCoords.lng], { icon: hotelIcon })
        .addTo(map)
        .bindPopup(`<b>Accommodation</b><br/>${hotelName}`)
        .openPopup();

      const polylinePoints: [number, number][] = [[hotelCoords.lat, hotelCoords.lng]];

      // Add User Location Marker if loaded
      if (myCoords) {
        const userIcon = L.divIcon({
          className: 'custom-div-icon',
          html: `<div class="w-8 h-8 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center shadow-lg shadow-emerald-400/40"><span class="text-white text-xs">📍</span></div>`,
          iconSize: [30, 30],
          iconAnchor: [15, 15]
        });
        L.marker([myCoords.lat, myCoords.lng], { icon: userIcon })
          .addTo(map)
          .bindPopup(`<b>Your Location (Traveler)</b>`);
      }

      // Add Activity Markers
      activities.forEach((act, index) => {
        if (!act.coords || typeof act.coords.lat !== 'number' || typeof act.coords.lng !== 'number') return;

        const pinIcon = L.divIcon({
          className: 'custom-div-icon',
          html: `<div class="w-7 h-7 rounded-full bg-secondary border-2 border-white flex items-center justify-center shadow-lg shadow-secondary/40"><span class="text-dark font-poppins font-bold text-[10px]">${index + 1}</span></div>`,
          iconSize: [26, 26],
          iconAnchor: [13, 13]
        });

        L.marker([act.coords.lat, act.coords.lng], { icon: pinIcon })
          .addTo(map)
          .bindPopup(`<b>${act.timeSlot}</b><br/>${act.activityName}`);

        polylinePoints.push([act.coords.lat, act.coords.lng]);
      });

      // Draw polyline routes connecting hotel to scheduled stops
      if (polylinePoints.length > 1) {
        L.polyline(polylinePoints, {
          color: '#06B6D4',
          weight: 4,
          opacity: 0.8,
          dashArray: '5, 8'
        }).addTo(map);

        // Adjust bounds
        const bounds = L.latLngBounds(polylinePoints);
        if (myCoords) {
          bounds.extend([myCoords.lat, myCoords.lng]);
        }
        map.fitBounds(bounds, { padding: [40, 40] });
      }
    } catch (err) {
      console.error('Failed to initialize Leaflet Map:', err);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [hotelCoords, hotelName, activities, myCoords]);

  const recenterMapOnUser = () => {
    if (mapInstanceRef.current && myCoords) {
      mapInstanceRef.current.setView([myCoords.lat, myCoords.lng], 15);
    }
  };

  return (
    <div className="w-full h-full relative z-10">
      <div ref={mapContainerRef} className="w-full h-full min-h-[300px]" />
      {myCoords && (
        <button 
          type="button"
          onClick={recenterMapOnUser}
          className="absolute bottom-4 right-4 z-[1000] px-3 py-1.5 bg-slate-950/95 border border-slate-700 hover:border-secondary text-slate-200 hover:text-white rounded-xl text-[9px] font-bold uppercase tracking-wide shadow-2xl transition-all"
        >
          📍 Locate Me
        </button>
      )}
    </div>
  );
};
