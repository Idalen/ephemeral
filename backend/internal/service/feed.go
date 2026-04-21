package service

import (
	"context"
	"fmt"

	"ephemeral/types"

	"github.com/google/uuid"
)

const defaultFeedLimit = 20

func (s *Service) GetFeed(ctx context.Context, userID uuid.UUID, limit int, cursor *types.FeedCursor) (*types.FeedResponse, error) {
	if limit <= 0 || limit > 50 {
		limit = defaultFeedLimit
	}

	// Fetch one extra to determine if there are more results.
	posts, err := s.repo.GetFeed(ctx, userID, limit+1, cursor)
	if err != nil {
		return nil, fmt.Errorf("getting feed: %w", err)
	}

	hasMore := len(posts) > limit
	if hasMore {
		posts = posts[:limit]
	}

	// Attach media URLs to each post.
	for i := range posts {
		media, err := s.repo.GetPostMediaByPostID(ctx, posts[i].ID)
		if err != nil {
			return nil, fmt.Errorf("getting post media: %w", err)
		}
		posts[i].Media = media
	}

	var nextCursor string
	if hasMore && len(posts) > 0 {
		last := posts[len(posts)-1]
		nextCursor = types.EncodeCursor(types.FeedCursor{
			Priority:  last.Priority,
			CreatedAt: last.CreatedAt,
			ID:        last.ID,
		})
	}

	return &types.FeedResponse{
		Posts:      posts,
		NextCursor: nextCursor,
		HasMore:    hasMore,
	}, nil
}
