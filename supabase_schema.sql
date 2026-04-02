/*
-- SQL for Supabase SQL Editor

-- 1. Tables
CREATE TABLE places (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  short_description text,
  full_description text,
  address text,
  lat float8,
  lng float8,
  photo_url text,
  extra_photos text[] DEFAULT '{}',
  opening_hours text,
  whatsapp text,
  instagram text,
  exclusive_promo text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE accommodations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text,
  photos text[] DEFAULT '{}',
  capacity int,
  min_price numeric,
  max_price numeric,
  distance_beach text,
  description text,
  whatsapp text,
  available_wsl boolean DEFAULT true,
  badge text DEFAULT 'none',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  event_date date NOT NULL,
  event_time time,
  location_text text,
  place_id uuid REFERENCES places(id) ON DELETE SET NULL,
  photo_url text,
  description text,
  ticket_price numeric,
  ticket_link text,
  urgency_badge text DEFAULT 'none',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE heats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  heat_date date NOT NULL,
  start_time time NOT NULL,
  phase_name text NOT NULL,
  surfers text,
  status text DEFAULT 'scheduled',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_whatsapp text,
  updated_at timestamptz DEFAULT now()
);

-- 2. RLS Policies
ALTER TABLE places ENABLE ROW LEVEL SECURITY;
ALTER TABLE accommodations ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE heats ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Public Read
CREATE POLICY "Public Read Places" ON places FOR SELECT USING (is_active = true);
CREATE POLICY "Public Read Accommodations" ON accommodations FOR SELECT USING (is_active = true);
CREATE POLICY "Public Read Events" ON events FOR SELECT USING (is_active = true);
CREATE POLICY "Public Read Heats" ON heats FOR SELECT USING (true);
CREATE POLICY "Public Read Settings" ON settings FOR SELECT USING (true);

-- Admin Write (Requires Auth)
CREATE POLICY "Admin All Places" ON places FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin All Accommodations" ON accommodations FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin All Events" ON events FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin All Heats" ON heats FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin All Settings" ON settings FOR ALL USING (auth.role() = 'authenticated');

-- 3. Storage Buckets (Manual setup in Supabase UI recommended, but here are the policies)
-- Buckets: place-photos, accommodation-photos, event-photos
*/
