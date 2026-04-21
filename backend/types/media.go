package types

import (
	"time"

	"github.com/google/uuid"
)

type MediaFile struct {
	ID        uuid.UUID `json:"id"`
	UserID    uuid.UUID `json:"user_id"`
	Data      []byte    `json:"-"`
	MimeType  string    `json:"mime_type"`
	Size      int       `json:"size"`
	CreatedAt time.Time `json:"created_at"`
}

type MediaUploadResponse struct {
	ID  uuid.UUID `json:"id"`
	URL string    `json:"url"`
}
