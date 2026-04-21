package service

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"ephemeral/internal/repository"
	"ephemeral/types"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type Claims struct {
	UserID  uuid.UUID `json:"user_id"`
	IsAdmin bool      `json:"is_admin"`
	jwt.RegisteredClaims
}

func (s *Service) Register(ctx context.Context, req *types.RegisterRequest) (*types.User, error) {
	req.Username = strings.ToLower(strings.TrimSpace(req.Username))

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("hashing password: %w", err)
	}

	userID := uuid.New()
	now := time.Now().UTC()

	user := &types.User{
		ID:         userID,
		Username:   req.Username,
		Status:     "pending",
		IsApproved: false,
		IsTrusted:  false,
		IsAdmin:    false,
		CreatedAt:  now,
		UpdatedAt:  now,
	}

	if err := s.repo.CreateUser(ctx, user); err != nil {
		if errors.Is(err, repository.ErrConflict) {
			return nil, ErrConflict
		}
		return nil, fmt.Errorf("creating user: %w", err)
	}

	identity := &types.AuthIdentity{
		ID:        uuid.New(),
		UserID:    userID,
		Provider:  "password",
		CreatedAt: now,
	}
	if err := s.repo.CreateAuthIdentity(ctx, identity); err != nil {
		return nil, fmt.Errorf("creating auth identity: %w", err)
	}

	creds := &types.PasswordCredentials{
		UserID:       userID,
		PasswordHash: string(hash),
	}
	if err := s.repo.CreatePasswordCredentials(ctx, creds); err != nil {
		return nil, fmt.Errorf("creating password credentials: %w", err)
	}

	profile := &types.UserProfile{UserID: userID}
	if err := s.repo.UpsertUserProfile(ctx, profile); err != nil {
		return nil, fmt.Errorf("creating user profile: %w", err)
	}

	return user, nil
}

func (s *Service) Login(ctx context.Context, req *types.LoginRequest) (*types.LoginResponse, error) {
	username := strings.ToLower(strings.TrimSpace(req.Username))

	user, err := s.repo.GetUserByUsername(ctx, username)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return nil, ErrInvalidCredentials
		}
		return nil, fmt.Errorf("getting user: %w", err)
	}

	switch user.Status {
	case "pending":
		return nil, ErrAccountPending
	case "disabled":
		return nil, ErrAccountDisabled
	}

	creds, err := s.repo.GetPasswordCredentials(ctx, user.ID)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return nil, ErrInvalidCredentials
		}
		return nil, fmt.Errorf("getting credentials: %w", err)
	}

	if err := bcrypt.CompareHashAndPassword([]byte(creds.PasswordHash), []byte(req.Password)); err != nil {
		return nil, ErrInvalidCredentials
	}

	token, err := s.issueToken(user)
	if err != nil {
		return nil, fmt.Errorf("issuing token: %w", err)
	}

	return &types.LoginResponse{Token: token, User: *user}, nil
}

func (s *Service) issueToken(user *types.User) (string, error) {
	claims := Claims{
		UserID:  user.ID,
		IsAdmin: user.IsAdmin,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(s.config.JWT.Expiry())),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Subject:   user.ID.String(),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.config.JWT.Secret))
}

func (s *Service) ParseToken(tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return []byte(s.config.JWT.Secret), nil
	})
	if err != nil {
		return nil, fmt.Errorf("parsing token: %w", err)
	}
	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, fmt.Errorf("invalid token")
	}
	return claims, nil
}
