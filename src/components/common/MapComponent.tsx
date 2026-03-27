import React, { useCallback } from 'react'
import { GoogleMap, useJsApiLoader, MarkerF } from '@react-google-maps/api'

const mapContainerStyle = {
  width: '100%',
  height: '100%',
}

const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  styles: [
    { elementType: 'geometry', stylers: [{ color: '#1a1d21' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#1a1d21' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
    {
      featureType: 'administrative.locality',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#d59563' }],
    },
    {
      featureType: 'poi',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#d59563' }],
    },
    {
      featureType: 'poi.park',
      elementType: 'geometry',
      stylers: [{ color: '#263c3f' }],
    },
    {
      featureType: 'poi.park',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#6b9a76' }],
    },
    {
      featureType: 'road',
      elementType: 'geometry',
      stylers: [{ color: '#38414e' }],
    },
    {
      featureType: 'road',
      elementType: 'geometry.stroke',
      stylers: [{ color: '#212a37' }],
    },
    {
      featureType: 'road',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#9ca5b3' }],
    },
    {
      featureType: 'road.highway',
      elementType: 'geometry',
      stylers: [{ color: '#746855' }],
    },
    {
      featureType: 'road.highway',
      elementType: 'geometry.stroke',
      stylers: [{ color: '#1f2835' }],
    },
    {
      featureType: 'road.highway',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#f3d19c' }],
    },
    {
      featureType: 'transit',
      elementType: 'geometry',
      stylers: [{ color: '#2f3948' }],
    },
    {
      featureType: 'transit.station',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#d59563' }],
    },
    {
      featureType: 'water',
      elementType: 'geometry',
      stylers: [{ color: '#17263c' }],
    },
    {
      featureType: 'water',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#515c6d' }],
    },
    {
      featureType: 'water',
      elementType: 'labels.text.stroke',
      stylers: [{ color: '#17263c' }],
    },
  ],
}

interface MapProps {
  center: { lat: number; lng: number }
  zoom?: number
  markers?: Array<{
    id: string
    lat: number
    lng: number
    title: string
    status: string
  }>
  onMarkerClick?: (id: string) => void
}

export const MapComponent: React.FC<MapProps> = ({ 
  center, 
  zoom = 12, 
  markers = [],
  onMarkerClick
}) => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  })

  const [, setMap] = React.useState<google.maps.Map | null>(null)

  const onLoad = useCallback(function callback(mapInstance: google.maps.Map) {
    setMap(mapInstance)
  }, [])

  const onUnmount = useCallback(function callback() {
    setMap(null)
  }, [])

  if (!isLoaded) return <div className="p-8 text-center text-subtle font-mono">Connecting to Google Maps...</div>

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={center}
      zoom={zoom}
      onLoad={onLoad}
      onUnmount={onUnmount}
      options={mapOptions}
    >
      {markers.map(m => (
        <MarkerF
          key={m.id}
          position={{ lat: m.lat, lng: m.lng }}
          onClick={() => onMarkerClick?.(m.id)}
          title={m.title}
          // Note: In production, we'd use a custom icon based on status
        />
      ))}
    </GoogleMap>
  )
}
