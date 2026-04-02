import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatWhatsAppLink(number: string, message?: string) {
  const cleanNumber = number.replace(/\D/g, '');
  let url = `https://wa.me/${cleanNumber}`;
  if (message) {
    url += `?text=${encodeURIComponent(message)}`;
  }
  return url;
}

export function getCategoryEmoji(category: string) {
  switch (category) {
    case 'bar': return '🍺';
    case 'restaurante': return '🍔';
    case 'cafe': return '☕';
    case 'hospedagem': return '🏨';
    case 'festa': return '🎶';
    case 'academia': return '🏋️';
    case 'loja': return '🛍️';
    default: return '🎯';
  }
}

export function getCategoryColor(category: string) {
  switch (category) {
    case 'bar': return '#F4A261';
    case 'restaurante': return '#E63946';
    case 'cafe': return '#7B4F2E';
    case 'hospedagem': return '#0077B6';
    case 'festa': return '#7B2FBE';
    case 'academia': return '#2DC653';
    case 'loja': return '#F9C74F';
    default: return '#6C757D';
  }
}

export function isOpenNow(openTime?: string | null, closeTime?: string | null) {
  if (!openTime || !closeTime) return null;
  
  const now = new Date();
  // Saquarema is UTC-3. Assuming the server/browser is in the same or we just use local time for simplicity as requested.
  const currentTime = now.getHours() * 60 + now.getMinutes();
  
  const [openH, openM] = openTime.split(':').map(Number);
  const [closeH, closeM] = closeTime.split(':').map(Number);
  
  const openMinutes = openH * 60 + openM;
  let closeMinutes = closeH * 60 + closeM;
  
  if (closeMinutes <= openMinutes) {
    // Handle overnight (e.g., 18:00 to 02:00)
    if (currentTime >= openMinutes || currentTime < closeMinutes) return true;
    return false;
  }
  
  return currentTime >= openMinutes && currentTime < closeMinutes;
}

export function getHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}
