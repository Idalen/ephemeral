package types

import (
	"fmt"
	"time"

	"github.com/google/uuid"
)

type Post struct {
	ID          uuid.UUID  `json:"id"`
	UserID      uuid.UUID  `json:"user_id"`
	Description *string    `json:"description,omitempty"`
	City        string     `json:"city"`
	Country     string     `json:"country"`
	Latitude    *float64   `json:"latitude,omitempty"`
	Longitude   *float64   `json:"longitude,omitempty"`
	Status      string     `json:"status"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
	Media       []PostMedia `json:"media,omitempty"`
}

type PostMedia struct {
	ID        uuid.UUID `json:"id"`
	PostID    uuid.UUID `json:"post_id"`
	URL       string    `json:"url"`
	Position  int       `json:"position"`
	CreatedAt time.Time `json:"created_at"`
}

type CreatePostRequest struct {
	Description *string   `json:"description"`
	City        string    `json:"city"`
	Country     string    `json:"country"`
	Latitude    *float64  `json:"latitude"`
	Longitude   *float64  `json:"longitude"`
	MediaIDs    []string  `json:"media_ids"`
}

func (r *CreatePostRequest) Validate() error {
	if r.City == "" {
		return fmt.Errorf("city is required")
	}
	if r.Country == "" {
		return fmt.Errorf("country is required")
	}
	if len(r.MediaIDs) == 0 {
		return fmt.Errorf("at least one image is required")
	}
	if len(r.MediaIDs) > 10 {
		return fmt.Errorf("a post may contain at most 10 images")
	}
	if r.Latitude != nil && (*r.Latitude < -90 || *r.Latitude > 90) {
		return fmt.Errorf("latitude must be between -90 and 90")
	}
	if r.Longitude != nil && (*r.Longitude < -180 || *r.Longitude > 180) {
		return fmt.Errorf("longitude must be between -180 and 180")
	}
	return nil
}

type PostCursor struct {
	CreatedAt time.Time `json:"created_at"`
	ID        uuid.UUID `json:"id"`
}
