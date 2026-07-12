-- 10. Push Subscriptions
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_pengguna UUID REFERENCES pengguna(id_pengguna) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(endpoint)
);

-- Function to update 'updated_at' on row update
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_push_subscriptions_modtime
BEFORE UPDATE ON push_subscriptions
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- Optional: Enable RLS on push_subscriptions
-- ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
