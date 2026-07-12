-- Pembuatan Tabel Chat

CREATE TABLE IF NOT EXISTS chat_rooms (
    id_room UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_pembeli UUID NOT NULL REFERENCES pengguna(id_pengguna) ON DELETE CASCADE,
    id_sub_toko UUID NOT NULL REFERENCES sub_toko(id_sub_toko) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(id_pembeli, id_sub_toko)
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id_message UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_room UUID NOT NULL REFERENCES chat_rooms(id_room) ON DELETE CASCADE,
    id_pengirim UUID NOT NULL REFERENCES pengguna(id_pengguna) ON DELETE CASCADE,
    pesan TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS (Row Level Security)

ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- 1. Policy untuk chat_rooms
-- Pembeli bisa melihat room miliknya
CREATE POLICY "Pembeli bisa melihat chat room miliknya" 
ON chat_rooms FOR SELECT 
USING (auth.uid() = id_pembeli);

-- Panitia bisa melihat chat room milik sub tokonya
CREATE POLICY "Panitia bisa melihat chat room sub tokonya"
ON chat_rooms FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM sub_toko_member stm
        WHERE stm.id_sub_toko = chat_rooms.id_sub_toko
        AND stm.id_pengguna = auth.uid()
    )
);

-- Pembeli bisa membuat chat room miliknya
CREATE POLICY "Pembeli bisa membuat chat room"
ON chat_rooms FOR INSERT
WITH CHECK (auth.uid() = id_pembeli);


-- 2. Policy untuk chat_messages
-- Pembeli bisa melihat pesan di room miliknya
CREATE POLICY "Pembeli bisa melihat pesan di room miliknya"
ON chat_messages FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM chat_rooms cr
        WHERE cr.id_room = chat_messages.id_room
        AND cr.id_pembeli = auth.uid()
    )
);

-- Panitia bisa melihat pesan di room sub tokonya
CREATE POLICY "Panitia bisa melihat pesan di room sub tokonya"
ON chat_messages FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM chat_rooms cr
        JOIN sub_toko_member stm ON stm.id_sub_toko = cr.id_sub_toko
        WHERE cr.id_room = chat_messages.id_room
        AND stm.id_pengguna = auth.uid()
    )
);

-- Pembeli bisa mengirim pesan di room miliknya
CREATE POLICY "Pembeli bisa mengirim pesan di room miliknya"
ON chat_messages FOR INSERT
WITH CHECK (
    auth.uid() = id_pengirim AND
    EXISTS (
        SELECT 1 FROM chat_rooms cr
        WHERE cr.id_room = chat_messages.id_room
        AND cr.id_pembeli = auth.uid()
    )
);

-- Panitia bisa mengirim pesan di room sub tokonya
CREATE POLICY "Panitia bisa mengirim pesan di room sub tokonya"
ON chat_messages FOR INSERT
WITH CHECK (
    auth.uid() = id_pengirim AND
    EXISTS (
        SELECT 1 FROM chat_rooms cr
        JOIN sub_toko_member stm ON stm.id_sub_toko = cr.id_sub_toko
        WHERE cr.id_room = chat_messages.id_room
        AND stm.id_pengguna = auth.uid()
    )
);

-- Realtime
-- Aktifkan Realtime untuk tabel chat_messages
alter publication supabase_realtime add table chat_messages;
alter publication supabase_realtime add table chat_rooms;
