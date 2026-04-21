package service

import (
	"context"
	"errors"
	"fmt"

	"ephemeral/internal/repository"

	"github.com/google/uuid"
)

func (s *Service) Follow(ctx context.Context, followerID uuid.UUID, targetUsername string) error {
	target, err := s.repo.GetUserByUsername(ctx, targetUsername)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return ErrNotFound
		}
		return fmt.Errorf("getting target user: %w", err)
	}

	if followerID == target.ID {
		return fmt.Errorf("cannot follow yourself")
	}

	if err := s.repo.FollowUser(ctx, followerID, target.ID); err != nil {
		if errors.Is(err, repository.ErrConflict) {
			return ErrConflict
		}
		return fmt.Errorf("following user: %w", err)
	}
	return nil
}

func (s *Service) Unfollow(ctx context.Context, followerID uuid.UUID, targetUsername string) error {
	target, err := s.repo.GetUserByUsername(ctx, targetUsername)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return ErrNotFound
		}
		return fmt.Errorf("getting target user: %w", err)
	}

	if err := s.repo.UnfollowUser(ctx, followerID, target.ID); err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return ErrNotFound
		}
		return fmt.Errorf("unfollowing user: %w", err)
	}
	return nil
}

func (s *Service) LikePost(ctx context.Context, userID, postID uuid.UUID) error {
	if err := s.repo.LikePost(ctx, userID, postID); err != nil {
		if errors.Is(err, repository.ErrConflict) {
			return ErrConflict
		}
		return fmt.Errorf("liking post: %w", err)
	}
	return nil
}

func (s *Service) UnlikePost(ctx context.Context, userID, postID uuid.UUID) error {
	if err := s.repo.UnlikePost(ctx, userID, postID); err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return ErrNotFound
		}
		return fmt.Errorf("unliking post: %w", err)
	}
	return nil
}
