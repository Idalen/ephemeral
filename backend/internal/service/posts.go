package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	"ephemeral/internal/repository"
	"ephemeral/types"

	"github.com/google/uuid"
)

func (s *Service) CreatePost(ctx context.Context, userID uuid.UUID, req *types.CreatePostRequest) (*types.Post, error) {
	user, err := s.repo.GetUserByID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("getting user: %w", err)
	}

	status := "pending"
	if user.IsTrusted {
		status = "approved"
	}

	postID := uuid.New()
	now := time.Now().UTC()

	post := &types.Post{
		ID:          postID,
		UserID:      userID,
		Description: req.Description,
		City:        req.City,
		Country:     req.Country,
		Latitude:    req.Latitude,
		Longitude:   req.Longitude,
		Status:      status,
		CreatedAt:   now,
		UpdatedAt:   now,
	}

	if err := s.repo.CreatePost(ctx, post); err != nil {
		return nil, fmt.Errorf("creating post: %w", err)
	}

	for i, mediaID := range req.MediaIDs {
		mediaUUID, err := uuid.Parse(mediaID)
		if err != nil {
			return nil, fmt.Errorf("invalid media ID %q: %w", mediaID, err)
		}

		pm := &types.PostMedia{
			ID:        uuid.New(),
			PostID:    postID,
			URL:       fmt.Sprintf("/api/media/%s", mediaUUID),
			Position:  i,
			CreatedAt: now,
		}
		if err := s.repo.CreatePostMedia(ctx, pm); err != nil {
			return nil, fmt.Errorf("attaching media: %w", err)
		}
		post.Media = append(post.Media, *pm)
	}

	return post, nil
}

func (s *Service) GetPost(ctx context.Context, postID uuid.UUID) (*types.Post, error) {
	post, err := s.repo.GetPostByID(ctx, postID)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("getting post: %w", err)
	}

	media, err := s.repo.GetPostMediaByPostID(ctx, postID)
	if err != nil {
		return nil, fmt.Errorf("getting post media: %w", err)
	}
	post.Media = media

	return post, nil
}

func (s *Service) DeletePost(ctx context.Context, userID, postID uuid.UUID) error {
	post, err := s.repo.GetPostByID(ctx, postID)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return ErrNotFound
		}
		return fmt.Errorf("getting post: %w", err)
	}

	if post.UserID != userID {
		return ErrForbidden
	}

	if err := s.repo.DeletePost(ctx, postID); err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return ErrNotFound
		}
		return fmt.Errorf("deleting post: %w", err)
	}
	return nil
}

func (s *Service) GetUserPosts(ctx context.Context, username string, limit int, cursor *types.PostCursor) ([]types.Post, error) {
	user, err := s.repo.GetUserByUsername(ctx, username)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("getting user: %w", err)
	}

	posts, err := s.repo.GetPostsByUserID(ctx, user.ID, limit, cursor)
	if err != nil {
		return nil, fmt.Errorf("getting posts: %w", err)
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
