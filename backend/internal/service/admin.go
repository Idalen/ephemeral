package service

import (
	"context"
	"errors"
	"fmt"

	"ephemeral/internal/repository"
	"ephemeral/types"

	"github.com/google/uuid"
)

func (s *Service) GetPendingUsers(ctx context.Context, limit, offset int) ([]types.User, error) {
	return s.repo.GetPendingUsers(ctx, limit, offset)
}

func (s *Service) ApproveUser(ctx context.Context, userID uuid.UUID) error {
	if err := s.repo.ApproveUser(ctx, userID); err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return ErrNotFound
		}
		return fmt.Errorf("approving user: %w", err)
	}
	return nil
}

func (s *Service) RejectUser(ctx context.Context, userID uuid.UUID) error {
	if err := s.repo.RejectUser(ctx, userID); err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return ErrNotFound
		}
		return fmt.Errorf("rejecting user: %w", err)
	}
	return nil
}

func (s *Service) SetUserTrusted(ctx context.Context, userID uuid.UUID, trusted bool) error {
	if err := s.repo.SetUserTrusted(ctx, userID, trusted); err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return ErrNotFound
		}
		return fmt.Errorf("setting trusted flag: %w", err)
	}
	return nil
}

func (s *Service) GetPendingPosts(ctx context.Context, limit, offset int) ([]types.Post, error) {
	posts, err := s.repo.GetPendingPosts(ctx, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("getting pending posts: %w", err)
	}
	for i := range posts {
		media, err := s.repo.GetPostMediaByPostID(ctx, posts[i].ID)
		if err != nil {
			return nil, fmt.Errorf("getting post media: %w", err)
		}
		posts[i].Media = media
	}
	return posts, nil
}

func (s *Service) ApprovePost(ctx context.Context, postID uuid.UUID) error {
	if err := s.repo.ApprovePost(ctx, postID); err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return ErrNotFound
		}
		return fmt.Errorf("approving post: %w", err)
	}
	return nil
}

func (s *Service) RejectPost(ctx context.Context, postID uuid.UUID) error {
	if err := s.repo.RejectPost(ctx, postID); err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return ErrNotFound
		}
		return fmt.Errorf("rejecting post: %w", err)
	}
	return nil
}
