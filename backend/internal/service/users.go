package service

import (
	"context"
	"errors"
	"fmt"

	"ephemeral/internal/repository"
	"ephemeral/types"

	"github.com/google/uuid"
)

func (s *Service) GetMyProfile(ctx context.Context, userID uuid.UUID) (*types.ProfileResponse, error) {
	user, err := s.repo.GetUserByID(ctx, userID)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("getting user: %w", err)
	}
	return s.GetProfile(ctx, user.Username, &userID)
}

func (s *Service) GetProfile(ctx context.Context, username string, viewerID *uuid.UUID) (*types.ProfileResponse, error) {
	user, err := s.repo.GetUserByUsername(ctx, username)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("getting user: %w", err)
	}

	profile, err := s.repo.GetUserProfile(ctx, user.ID)
	if err != nil && !errors.Is(err, repository.ErrNotFound) {
		return nil, fmt.Errorf("getting profile: %w", err)
	}

	followerCount, followingCount, postCount, err := s.repo.GetUserCounts(ctx, user.ID)
	if err != nil {
		return nil, fmt.Errorf("getting user counts: %w", err)
	}

	resp := &types.ProfileResponse{
		ID:            user.ID,
		Username:      user.Username,
		DisplayName:   user.DisplayName,
		FollowerCount: followerCount,
		FollowingCount: followingCount,
		PostCount:     postCount,
		CreatedAt:     user.CreatedAt,
	}
	if profile != nil {
		resp.Bio = profile.Bio
		resp.ProfilePictureURL = profile.ProfilePictureURL
		resp.BackgroundPictureURL = profile.BackgroundPictureURL
	}

	if viewerID != nil && *viewerID != user.ID {
		isFollowing, err := s.repo.IsFollowing(ctx, *viewerID, user.ID)
		if err != nil {
			return nil, fmt.Errorf("checking follow status: %w", err)
		}
		resp.IsFollowing = &isFollowing
	}

	return resp, nil
}

func (s *Service) UpdateProfile(ctx context.Context, userID uuid.UUID, req *types.UpdateProfileRequest) (*types.ProfileResponse, error) {
	user, err := s.repo.GetUserByID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("getting user: %w", err)
	}

	if req.DisplayName != nil {
		user.DisplayName = req.DisplayName
		if err := s.repo.UpdateUser(ctx, user); err != nil {
			return nil, fmt.Errorf("updating user: %w", err)
		}
	}

	profile := &types.UserProfile{
		UserID: userID,
		Bio:    req.Bio,
	}
	if req.ProfilePictureURL != nil {
		profile.ProfilePictureURL = req.ProfilePictureURL
	}
	if req.BackgroundPictureURL != nil {
		profile.BackgroundPictureURL = req.BackgroundPictureURL
	}

	existing, err := s.repo.GetUserProfile(ctx, userID)
	if err != nil && !errors.Is(err, repository.ErrNotFound) {
		return nil, fmt.Errorf("getting existing profile: %w", err)
	}
	if existing != nil {
		if req.Bio == nil {
			profile.Bio = existing.Bio
		}
		if req.ProfilePictureURL == nil {
			profile.ProfilePictureURL = existing.ProfilePictureURL
		}
		if req.BackgroundPictureURL == nil {
			profile.BackgroundPictureURL = existing.BackgroundPictureURL
		}
	}

	if err := s.repo.UpsertUserProfile(ctx, profile); err != nil {
		return nil, fmt.Errorf("upserting profile: %w", err)
	}

	return s.GetProfile(ctx, user.Username, &userID)
}

func (s *Service) GetFollowers(ctx context.Context, username string, limit, offset int) ([]types.User, error) {
	user, err := s.repo.GetUserByUsername(ctx, username)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("getting user: %w", err)
	}
	return s.repo.GetFollowers(ctx, user.ID, limit, offset)
}

func (s *Service) GetFollowing(ctx context.Context, username string, limit, offset int) ([]types.User, error) {
	user, err := s.repo.GetUserByUsername(ctx, username)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("getting user: %w", err)
	}
	return s.repo.GetFollowing(ctx, user.ID, limit, offset)
}
