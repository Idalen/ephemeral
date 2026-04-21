CREATE TABLE IF NOT EXISTS user_profiles (
    user_id                UUID PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
    bio                    TEXT,
    profile_picture_url    TEXT,
    background_picture_url TEXT,
    updated_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);
