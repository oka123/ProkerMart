-- Tambahkan kolom koordinat ke tabel toko dan sub_toko
ALTER TABLE toko 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

ALTER TABLE sub_toko 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Update data yang sudah ada dengan koordinat dummy di sekitar Jimbaran, Bali
-- Base coordinate: Lat -8.795, Lng 115.176
UPDATE toko 
SET 
  latitude = -8.795 + (random() * 0.02 - 0.01),
  longitude = 115.176 + (random() * 0.02 - 0.01)
WHERE latitude IS NULL;

UPDATE sub_toko 
SET 
  latitude = -8.795 + (random() * 0.02 - 0.01),
  longitude = 115.176 + (random() * 0.02 - 0.01)
WHERE latitude IS NULL;

-- Buat fungsi RPC untuk mencari sub_toko terdekat menggunakan rumus Haversine
CREATE OR REPLACE FUNCTION get_nearby_sub_toko(
  user_lat double precision,
  user_lon double precision,
  max_distance_km double precision DEFAULT 10
)
RETURNS TABLE (
  id_sub_toko UUID,
  distance_km double precision
)
LANGUAGE sql
AS $$
  SELECT 
    id_sub_toko,
    distance_km
  FROM (
    SELECT 
      id_sub_toko,
      -- Haversine formula (6371 is Earth's radius in km)
      (6371 * acos(
        GREATEST(-1.0, LEAST(1.0,
          cos(radians(user_lat)) * cos(radians(latitude)) *
          cos(radians(longitude) - radians(user_lon)) +
          sin(radians(user_lat)) * sin(radians(latitude))
        ))
      )) AS distance_km
    FROM sub_toko
    WHERE latitude IS NOT NULL AND longitude IS NOT NULL
  ) AS nearby
  WHERE distance_km <= max_distance_km
  ORDER BY distance_km ASC;
$$;
