
'use client';

import { MapContainer, TileLayer, useMap, FeatureGroup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-search/dist/leaflet-search.min.css';
import 'leaflet-draw/dist/leaflet.draw.css';

import L from 'leaflet';
import 'leaflet-draw';
import { useEffect, useState } from 'react';
import 'leaflet-search';
import MapDrawControl from './map-draw-control';
import { Street } from '@/lib/street-data';

// Fix for default icon issue with Webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const transparentPixel = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

const SearchComponent = ({ streets }: { streets: Street[] }) => {
    const map = useMap();

    useEffect(() => {
        if (streets.length > 0 && map) {
            const markersLayer = new L.LayerGroup();
            map.addLayer(markersLayer);

            for (const i in streets) {
                const title = streets[i].title,
                    loc = streets[i].loc,
                    latlng : L.LatLngExpression = new L.LatLng(loc[0], loc[1]),
                    marker : L.Marker = new L.Marker(latlng, { title: title });
                marker.setOpacity(0);
                markersLayer.addLayer(marker);
            }
            
            // @ts-ignore
            const searchControl = new L.Control.Search({
                layer: markersLayer,
                propertyName: 'title',
                marker: false,
                moveToLocation: function(latlng: L.LatLng, title: string, map: L.Map) {
                    map.setView(latlng, 5); // zoom to location
                },
                initial: false,
                collapsed: false,
                textPlaceholder: 'Search Street...',
                textCancel: ''
            });

            map.addControl(searchControl);
            
            const searchButton = document.querySelector('.leaflet-control-search .search-button');
            if (searchButton && searchButton.parentNode) {
                searchButton.parentNode.removeChild(searchButton);
            }


            return () => {
                map.removeControl(searchControl);
                map.removeLayer(markersLayer);
            };
        }
    }, [streets, map]);

    return null;
}

const MapComponent = ({ streets }: { streets: any[] }) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <MapContainer
      center={[-45, -20]}
      zoom={4}
      maxZoom={5}
      minZoom={2}
      scrollWheelZoom={true}
      style={{ height: '100%', width: '100%', borderRadius: '0.5rem', backgroundColor: 'transparent' }}
      className="z-0"
    >
      <TileLayer
        url="/map/mapStyles/styleStreet/{z}/{x}/{y}.jpg"
        attribution='San Andreas Street Guide - MDC'
        noWrap={true}
        errorTileUrl={transparentPixel}
      />
      <SearchComponent streets={streets} />
      <FeatureGroup>
        <MapDrawControl />
      </FeatureGroup>
    </MapContainer>
  );
};

export default MapComponent;
