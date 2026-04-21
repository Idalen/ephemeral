package repository

import (
	"context"
	"errors"
	"fmt"

	"ephemeral/types"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
)

func (p *Postgres) CreatePost(ctx context.Context, post *types.Post) error {
	_, err := p.pool.Exec(ctx, `
		INSERT INTO posts (id, user_id, description, city, country, latitude, longitude, status, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
		post.ID, post.UserID, post.Description, post.City, post.Country,
		post.Latitude, post.Longitude, post.Status, post.CreatedAt, post.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("inserting post: %w", err)
	}
	return nil
}

func (p *Postgres) GetPostByID(ctx context.Context, id uuid.UUID) (*types.Post, error) {
	row := p.pool.QueryRow(ctx, `
		SELECT id, user_id, description, city, country, latitude, longitude, status, created_at, updated_at
		FROM posts WHERE id = $1`, id)
	return scanPost(row)
}

func (p *Postgres) DeletePost(ctx context.Context, id uuid.UUID) error {
	tag, err := p.pool.Exec(ctx, `DELETE FROM posts WHERE id = $1`, id)
	if err != nil {
		return fmt.Errorf("deleting post: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

func (p *Postgres) GetPostsByUserID(ctx context.Context, userID uuid.UUID, limit int, cursor *types.PostCursor) ([]types.Post, error) {
	var (
		rows pgx.Rows
		err  error
	)

	if cursor == nil {
		rows, err = p.pool.Query(ctx, `
			SELECT id, user_id, description, city, country, latitude, longitude, status, created_at, updated_at
			FROM posts
			WHERE user_id = $1 AND status = 'approved'
			ORDER BY created_at DESC, id DESC
			LIMIT $2`, userID, limit)
	} else {
		rows, err = p.pool.Query(ctx, `
			SELECT id, user_id, description, city, country, latitude, longitude, status, created_at, updated_at
			FROM posts
			WHERE user_id = $1 AND status = 'approved'
			  AND (created_at < $2 OR (created_at = $2 AND id < $3))
			ORDER BY created_at DESC, id DESC
			LIMIT $4`, userID, cursor.CreatedAt, cursor.ID, limit)
	}
	if err != nil {
		return nil, fmt.Errorf("querying posts by user: %w", err)
	}
	defer rows.Close()

	return collectPosts(rows)
}

func (p *Postgres) CreatePostMedia(ctx context.Context, media *types.PostMedia) error {
	_, err := p.pool.Exec(ctx, `
		INSERT INTO post_media (id, post_id, url, position, created_at)
		VALUES ($1, $2, $3, $4, $5)`,
		media.ID, media.PostID, media.URL, media.Position, media.CreatedAt,
	)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return ErrConflict
		}
		return fmt.Errorf("inserting post media: %w", err)
	}
	return nil
}

func (p *Postgres) GetPostMediaByPostID(ctx context.Context, postID uuid.UUID) ([]types.PostMedia, error) {
	rows, err := p.pool.Query(ctx, `
		SELECT id, post_id, url, position, created_at
		FROM post_media WHERE post_id = $1 ORDER BY position ASC`, postID)
	if err != nil {
		return nil, fmt.Errorf("querying post media: %w", err)
	}
	defer rows.Close()

	var media []types.PostMedia
	for rows.Next() {
		var m types.PostMedia
		if err := rows.Scan(&m.ID, &m.PostID, &m.URL, &m.Position, &m.CreatedAt); err != nil {
			return nil, fmt.Errorf("scanning post media: %w", err)
		}
		media = append(media, m)
	}
	return media, rows.Err()
}

func (p *Postgres) GetLikeCount(ctx context.Context, postID uuid.UUID) (int, error) {
	var count int
	err := p.pool.QueryRow(ctx, `SELECT COUNT(*) FROM likes WHERE post_id = $1`, postID).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("counting likes: %w", err)
	}
	return count, nil
}

func (p *Postgres) IsLikedByUser(ctx context.Context, userID, postID uuid.UUID) (bool, error) {
	var exists bool
	err := p.pool.QueryRow(ctx, `
		SELECT EXISTS(SELECT 1 FROM likes WHERE user_id = $1 AND post_id = $2)`,
		userID, postID).Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("checking like: %w", err)
	}
	return exists, nil
}

func scanPost(row pgx.Row) (*types.Post, error) {
	var post types.Post
	err := row.Scan(
		&post.ID, &post.UserID, &post.Description, &post.City, &post.Country,
		&post.Latitude, &post.Longitude, &post.Status, &post.CreatedAt, &post.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("scanning post: %w", err)
	}
	return &post, nil
}

func collectPosts(rows pgx.Rows) ([]types.Post, error) {
	var posts []types.Post
	for rows.Next() {
		var post types.Post
		if err := rows.Scan(
			&post.ID, &post.UserID, &post.Description, &post.City, &post.Country,
			&post.Latitude, &post.Longitude, &post.Status, &post.CreatedAt, &post.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("scanning post: %w", err)
		}
		posts = append(posts, post)
	}
	return posts, rows.Err()
}
