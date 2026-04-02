import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Plus, Minus } from 'lucide-react';
import { Place } from '../lib/supabase';
import { getCategoryEmoji, getCategoryColor } from '../lib/utils';

// Fix Leaflet marker icon issue in React
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapViewProps {
  places: Place[];
  selectedPlace: Place | null;
  onSelectPlace: (place: Place) => void;
  onViewDetails: (place: Place) => void;
}

function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 17);
  }, [center, map]);
  return null;
}

const ZoomControls: React.FC = () => {
  const map = useMap();
  return (
    <div className="absolute top-4 md:top-8 right-4 md:right-8 flex flex-col gap-3 z-[1000]">
      <button 
        onClick={() => map.zoomIn()}
        className="w-12 h-12 md:w-14 md:h-14 bg-white/80 backdrop-blur-xl rounded-2xl shadow-[0_10px_30px_-5px_rgba(0,0,0,0.15)] flex items-center justify-center text-2xl font-black text-ocean border border-white/50 hover:bg-white hover:scale-110 transition-all duration-300 active:scale-90 group"
      >
        <Plus size={24} className="group-hover:rotate-90 transition-transform duration-300" />
      </button>
      <button 
        onClick={() => map.zoomOut()}
        className="w-12 h-12 md:w-14 md:h-14 bg-white/80 backdrop-blur-xl rounded-2xl shadow-[0_10px_30px_-5px_rgba(0,0,0,0.15)] flex items-center justify-center text-2xl font-black text-ocean border border-white/50 hover:bg-white hover:scale-110 transition-all duration-300 active:scale-90 group"
      >
        <Minus size={24} className="group-hover:scale-x-125 transition-transform duration-300" />
      </button>
    </div>
  );
};

export const MapView: React.FC<MapViewProps> = ({ places, selectedPlace, onSelectPlace, onViewDetails }) => {
  const center: [number, number] = [-22.9285, -42.5100]; // Praia de Itaúna

  const createCustomIcon = (place: Place) => {
    const color = getCategoryColor(place.category);
    const photo = place.photo_url || `https://picsum.photos/seed/${place.id}/100/100`;
    
    return L.divIcon({
      className: 'custom-div-icon',
      html: `
        <div class="flex flex-col items-center group">
          <div class="relative">
            <div class="w-12 h-12 md:w-14 md:h-14 rounded-[18px] border-4 border-white shadow-[0_10px_30px_-5px_rgba(0,0,0,0.3)] overflow-hidden bg-white flex items-center justify-center transition-all duration-500 group-hover:scale-125 group-hover:rotate-3 group-hover:shadow-ocean/40" style="border-color: white">
              <img src="${photo}" class="w-full h-full object-cover" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(place.name)}&background=random'" />
              <div class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            </div>
            <div class="absolute -bottom-1 -right-1 w-5 h-5 md:w-6 md:h-6 rounded-lg border-2 border-white shadow-lg flex items-center justify-center text-[10px] z-10" style="background-color: ${color}">
              ${getCategoryEmoji(place.category)}
            </div>
          </div>
          <div class="mt-2 bg-white/90 backdrop-blur-md px-3 py-1 rounded-xl shadow-xl border border-white/50 max-w-[100px] md:max-w-[140px] transition-all duration-500 group-hover:bg-ocean group-hover:text-white group-hover:-translate-y-1">
            <p class="text-[9px] md:text-[11px] font-black uppercase tracking-tight truncate text-center leading-none py-0.5">${place.name}</p>
          </div>
        </div>
      `,
      iconSize: [50, 70],
      iconAnchor: [25, 50],
      popupAnchor: [0, -50],
    });
  };

  return (
    <div className="w-full h-full relative overflow-hidden rounded-3xl shadow-inner border border-gray-100">
      <MapContainer 
        center={center} 
        zoom={15} 
        scrollWheelZoom={true} 
        className="h-full w-full"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        {places.map((place) => (
          <Marker
            key={place.id}
            position={[place.lat, place.lng]}
            icon={createCustomIcon(place)}
            eventHandlers={{
              click: () => onSelectPlace(place),
            }}
          >
            <Popup className="custom-leaflet-popup">
              <div className="p-1 min-w-[180px] md:min-w-[220px] overflow-hidden">
                {place.photo_url && (
                  <div className="relative h-20 md:h-28 rounded-xl overflow-hidden mb-2 md:mb-3">
                    <img 
                      src={place.photo_url} 
                      alt={place.name} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-[8px] md:text-[10px] font-bold shadow-sm">
                      {getCategoryEmoji(place.category)} {place.category.toUpperCase()}
                    </div>
                  </div>
                )}
                <h3 className="font-black text-base md:text-xl text-dark m-0 leading-tight mb-1">{place.name}</h3>
                <p className="text-[10px] md:text-xs text-gray-500 mb-3 md:mb-4 line-clamp-2 leading-relaxed">{place.short_description}</p>
                <div className="flex flex-col gap-2">
                  <button 
                    onClick={() => onViewDetails(place)}
                    className="w-full bg-ocean text-white py-2 md:py-2.5 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest hover:bg-ocean-light transition-all shadow-md hover:shadow-lg active:scale-95"
                  >
                    Ver Detalhes
                  </button>
                  <a 
                    href={`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-dark text-white py-2 md:py-2.5 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-md hover:shadow-lg active:scale-95 text-center flex items-center justify-center gap-2"
                  >
                    <span>📍</span> Como chegar
                  </a>
                  {place.whatsapp && (
                    <a 
                      href={`https://wa.me/${place.whatsapp.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-green-500 text-white py-2 md:py-2.5 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest hover:bg-green-600 transition-all shadow-md hover:shadow-lg active:scale-95 text-center flex items-center justify-center gap-2"
                    >
                      <span>💬</span> WhatsApp
                    </a>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
        {selectedPlace && <ChangeView center={[selectedPlace.lat, selectedPlace.lng]} />}
        <ZoomControls />
      </MapContainer>
    </div>
  );
};
