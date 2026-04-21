CREATE TABLE IF NOT EXISTS post_media (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id    UUID NOT NULL REFERENCES posts (id) ON DELETE CASCADE,
    url        TEXT NOT NULL,
    position   SMALLINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (post_id, position)
);

CREATE INDEX IF NOT EXISTS idx_post_media_post_id ON post_media (post_id, position);
