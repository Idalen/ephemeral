package types

import (
	"fmt"
	"time"
	"unicode"

	"github.com/google/uuid"
)

type AuthIdentity struct {
	ID             uuid.UUID `json:"id"`
	UserID         uuid.UUID `json:"user_id"`
	Provider       string    `json:"provider"`
	ProviderUserID *string   `json:"provider_user_id,omitempty"`
	Email          *string   `json:"email,omitempty"`
	CreatedAt      time.Time `json:"created_at"`
}

type PasswordCredentials struct {
	UserID       uuid.UUID `json:"user_id"`
	PasswordHash string    `json:"-"`
	PasswordSalt string    `json:"-"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type RegisterRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

func (r *RegisterRequest) Validate() error {
	if len(r.Username) < 3 || len(r.Username) > 30 {
		return fmt.Errorf("username must be between 3 and 30 characters")
	}
	for _, c := range r.Username {
		if !unicode.IsLetter(c) && !unicode.IsDigit(c) && c != '_' && c != '-' {
			return fmt.Errorf("username may only contain letters, digits, underscores, and hyphens")
		}
	}
	if len(r.Password) < 8 {
		return fmt.Errorf("password must be at least 8 characters")
	}
	return nil
}

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

func (r *LoginRequest) Validate() error {
	if r.Username == "" {
		return fmt.Errorf("username is required")
	}
	if r.Password == "" {
		return fmt.Errorf("password is required")
	}
	return nil
}

type LoginResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}
