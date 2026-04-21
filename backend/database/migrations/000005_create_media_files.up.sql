CREATE TABLE IF NOT EXISTS media_files (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    data       BYTEA NOT NULL,
    mime_type  TEXT NOT NULL,
    size       INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_media_files_user_id ON media_files (user_id);
