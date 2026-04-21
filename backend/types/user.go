package types

import (
	"fmt"
	"time"

	"github.com/google/uuid"
)

type User struct {
	ID          uuid.UUID `json:"id"`
	Username    string    `json:"username"`
	DisplayName *string   `json:"display_name,omitempty"`
	Status      string    `json:"status"`
	IsApproved  bool      `json:"is_approved"`
	IsTrusted   bool      `json:"is_trusted"`
	IsAdmin     bool      `json:"is_admin"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type UserProfile struct {
	UserID               uuid.UUID `json:"user_id"`
	Bio                  *string   `json:"bio,omitempty"`
	ProfilePictureURL    *string   `json:"profile_picture_url,omitempty"`
	BackgroundPictureURL *string   `json:"background_picture_url,omitempty"`
	UpdatedAt            time.Time `json:"updated_at"`
}

// ProfileResponse is the full public-facing profile.
type ProfileResponse struct {
	ID                   uuid.UUID `json:"id"`
	Username             string    `json:"username"`
	DisplayName          *string   `json:"display_name,omitempty"`
	Bio                  *string   `json:"bio,omitempty"`
	ProfilePictureURL    *string   `json:"profile_picture_url,omitempty"`
	BackgroundPictureURL *string   `json:"background_picture_url,omitempty"`
	FollowerCount        int       `json:"follower_count"`
	FollowingCount       int       `json:"following_count"`
	PostCount            int       `json:"post_count"`
	IsFollowing          *bool     `json:"is_following,omitempty"`
	CreatedAt            time.Time `json:"created_at"`
}

type UpdateProfileRequest struct {
	DisplayName          *string `json:"display_name"`
	Bio                  *string `json:"bio"`
	ProfilePictureURL    *string `json:"profile_picture_url"`
	BackgroundPictureURL *string `json:"background_picture_url"`
}

func (r *UpdateProfileRequest) Validate() error {
	if r.Bio != nil && len(*r.Bio) > 300 {
		return fmt.Errorf("bio must be at most 300 characters")
	}
	if r.DisplayName != nil && len(*r.DisplayName) > 64 {
		return fmt.Errorf("display name must be at most 64 characters")
	}
	return nil
}
