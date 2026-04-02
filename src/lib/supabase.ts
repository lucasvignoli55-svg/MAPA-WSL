import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isConfigured = !!(supabaseUrl && supabaseAnonKey);

// Lazy initialization to avoid crash on startup if keys are missing
let clientInstance: any = null;

const getClient = () => {
  if (!isConfigured) {
    return null;
  }
  if (!clientInstance) {
    clientInstance = createClient(supabaseUrl, supabaseAnonKey);
  }
  return clientInstance;
};

// Export a proxy that handles missing configuration gracefully
export const supabase = new Proxy({} as any, {
  get(_, prop) {
    const client = getClient();
    if (!client) {
      const errorMsg = 'Supabase URL or Anon Key is missing. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in the Secrets panel.';
      console.error(errorMsg);
      
      // Return a function that throws if the property is called as a function
      return (...args: any[]) => {
        throw new Error(errorMsg);
      };
    }
    
    const value = client[prop];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  }
});

export const isSupabaseConfigured = isConfigured;

export async function uploadImage(file: File, bucket: string = 'images'): Promise<string | null> {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file);

    if (error) {
      if (error.message === 'Bucket not found') {
        console.error(`Bucket "${bucket}" not found in Supabase Storage. Please create a public bucket named "${bucket}" in your Supabase dashboard.`);
      } else if (error.message.includes('row-level security policy')) {
        console.error(`RLS Policy Error: You do not have permission to upload to the "${bucket}" bucket. Please add an INSERT policy for the "storage.objects" table in your Supabase dashboard.`);
      } else {
        console.error('Error uploading image:', error);
      }
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error('Unexpected error during upload:', error);
    return null;
  }
}

export async function checkBucketExists(bucket: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.storage.getBucket(bucket);
    if (error) {
      return false;
    }
    return !!data;
  } catch (error) {
    return false;
  }
}

export type PlaceCategory = 'bar' | 'restaurante' | 'cafe' | 'hospedagem' | 'festa' | 'academia' | 'loja' | 'outro';

export interface Place {
  id: string;
  name: string;
  category: PlaceCategory;
  short_description: string;
  full_description: string;
  address: string;
  lat: number;
  lng: number;
  photo_url: string;
  extra_photos: string[];
  opening_hours: string;
  open_time?: string | null;
  close_time?: string | null;
  whatsapp: string;
  instagram: string;
  exclusive_promo: string;
  coupon_text?: string | null;
  live_status?: 'vazio' | 'medio' | 'cheio' | 'lotado' | 'fila' | null;
  is_recommended: boolean;
  thumbs_up: number;
  thumbs_down: number;
  is_active: boolean;
  created_at: string;
}

export interface Accommodation {
  id: string;
  name: string;
  type: 'casa' | 'pousada' | 'kitnet' | 'quarto';
  photos: string[];
  capacity: number;
  min_price: number;
  max_price: number;
  distance_beach: string;
  description: string;
  whatsapp: string;
  available_wsl: boolean;
  badge: 'none' | 'most_wanted' | 'last_available' | 'best_value';
  is_active: boolean;
  created_at: string;
}

export interface Event {
  id: string;
  name: string;
  event_date: string;
  event_time: string;
  location_text: string;
  place_id: string | null;
  photo_url: string;
  description: string;
  ticket_price: number | null;
  ticket_link: string;
  urgency_badge: 'none' | 'today' | 'tomorrow' | 'last_tickets';
  is_active: boolean;
  created_at: string;
}

export interface Heat {
  id: string;
  heat_date: string;
  start_time: string;
  phase_name: string;
  surfers: string;
  status: 'scheduled' | 'live' | 'finished' | 'cancelled';
  created_at: string;
}

export interface Settings {
  id: string;
  admin_whatsapp: string;
  updated_at: string;
}
