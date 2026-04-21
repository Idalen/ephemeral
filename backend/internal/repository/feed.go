package repository

import (
	"context"
	"fmt"

	"ephemeral/types"

	"github.com/google/uuid"
)

func (p *Postgres) GetFeed(ctx context.Context, userID uuid.UUID, limit int, cursor *types.FeedCursor) ([]types.FeedPost, error) {
	cursorClause := ""
	args := []interface{}{userID}

	if cursor != nil {
		args = append(args, cursor.Priority, cursor.CreatedAt, cursor.ID)
		cursorClause = `
			AND (
				priority > $2 OR
				(priority = $2 AND p.created_at < $3) OR
				(priority = $2 AND p.created_at = $3 AND p.id < $4)
			)`
	}

	args = append(args, limit)
	limitParam := fmt.Sprintf("$%d", len(args))

	query := fmt.Sprintf(`
		WITH followed_ids AS (
			SELECT following_id FROM follows WHERE follower_id = $1
		),
		posts_with_priority AS (
			SELECT
				p.id, p.user_id, p.description, p.city, p.country,
				p.latitude, p.longitude, p.status, p.created_at, p.updated_at,
				CASE WHEN fi.following_id IS NOT NULL THEN 1 ELSE 2 END AS priority,
				u.username AS author_username,
				u.display_name AS author_display_name,
				up.profile_picture_url AS author_picture_url,
				COUNT(DISTINCT l.id) AS like_count,
				COALESCE(BOOL_OR(l.user_id = $1), false) AS is_liked
			FROM posts p
			JOIN users u ON u.id = p.user_id
			LEFT JOIN user_profiles up ON up.user_id = p.user_id
			LEFT JOIN followed_ids fi ON fi.following_id = p.user_id
			LEFT JOIN likes l ON l.post_id = p.id
			WHERE p.status = 'approved'
			GROUP BY p.id, p.user_id, p.description, p.city, p.country,
				p.latitude, p.longitude, p.status, p.created_at, p.updated_at,
				fi.following_id, u.username, u.display_name, up.profile_picture_url
		)
		SELECT
			id, user_id, description, city, country, latitude, longitude,
			status, created_at, updated_at, priority,
			author_username, author_display_name, author_picture_url,
			like_count, is_liked
		FROM posts_with_priority
		WHERE true %s
		ORDER BY priority ASC, created_at DESC, id DESC
		LIMIT %s`, cursorClause, limitParam)

	rows, err := p.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("querying feed: %w", err)
	}
	defer rows.Close()

	var posts []types.FeedPost
	for rows.Next() {
		var fp types.FeedPost
		if err := rows.Scan(
			&fp.ID, &fp.UserID, &fp.Description, &fp.City, &fp.Country,
			&fp.Latitude, &fp.Longitude, &fp.Status, &fp.CreatedAt, &fp.UpdatedAt,
			&fp.Priority,
			&fp.AuthorUsername, &fp.AuthorDisplayName, &fp.AuthorPictureURL,
			&fp.LikeCount, &fp.IsLiked,
		); err != nil {
			return nil, fmt.Errorf("scanning feed post: %w", err)
		}
		posts = append(posts, fp)
	}
	return posts, rows.Err()
}
