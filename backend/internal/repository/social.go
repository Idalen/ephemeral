package repository

import (
	"context"
	"errors"
	"fmt"

	"ephemeral/types"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgconn"
)

func (p *Postgres) FollowUser(ctx context.Context, followerID, followingID uuid.UUID) error {
	_, err := p.pool.Exec(ctx, `
		INSERT INTO follows (follower_id, following_id)
		VALUES ($1, $2)`, followerID, followingID)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) {
			switch pgErr.Code {
			case "23505":
				return ErrConflict
			case "23514":
				return fmt.Errorf("cannot follow yourself")
			}
		}
		return fmt.Errorf("inserting follow: %w", err)
	}
	return nil
}

func (p *Postgres) UnfollowUser(ctx context.Context, followerID, followingID uuid.UUID) error {
	tag, err := p.pool.Exec(ctx, `
		DELETE FROM follows WHERE follower_id = $1 AND following_id = $2`,
		followerID, followingID)
	if err != nil {
		return fmt.Errorf("deleting follow: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

func (p *Postgres) IsFollowing(ctx context.Context, followerID, followingID uuid.UUID) (bool, error) {
	var exists bool
	err := p.pool.QueryRow(ctx, `
		SELECT EXISTS(SELECT 1 FROM follows WHERE follower_id = $1 AND following_id = $2)`,
		followerID, followingID).Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("checking follow: %w", err)
	}
	return exists, nil
}

func (p *Postgres) GetFollowers(ctx context.Context, userID uuid.UUID, limit, offset int) ([]types.User, error) {
	rows, err := p.pool.Query(ctx, `
		SELECT u.id, u.username, u.display_name, u.status, u.is_approved, u.is_trusted, u.is_admin, u.created_at, u.updated_at
		FROM users u
		JOIN follows f ON f.follower_id = u.id
		WHERE f.following_id = $1
		ORDER BY f.created_at DESC
		LIMIT $2 OFFSET $3`, userID, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("querying followers: %w", err)
	}
	defer rows.Close()
	return collectUsers(rows)
}

func (p *Postgres) GetFollowing(ctx context.Context, userID uuid.UUID, limit, offset int) ([]types.User, error) {
	rows, err := p.pool.Query(ctx, `
		SELECT u.id, u.username, u.display_name, u.status, u.is_approved, u.is_trusted, u.is_admin, u.created_at, u.updated_at
		FROM users u
		JOIN follows f ON f.following_id = u.id
		WHERE f.follower_id = $1
		ORDER BY f.created_at DESC
		LIMIT $2 OFFSET $3`, userID, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("querying following: %w", err)
	}
	defer rows.Close()
	return collectUsers(rows)
}

func (p *Postgres) LikePost(ctx context.Context, userID, postID uuid.UUID) error {
	_, err := p.pool.Exec(ctx, `
		INSERT INTO likes (user_id, post_id) VALUES ($1, $2)`,
		userID, postID)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return ErrConflict
		}
		return fmt.Errorf("inserting like: %w", err)
	}
	return nil
}

func (p *Postgres) UnlikePost(ctx context.Context, userID, postID uuid.UUID) error {
	tag, err := p.pool.Exec(ctx, `
		DELETE FROM likes WHERE user_id = $1 AND post_id = $2`,
		userID, postID)
	if err != nil {
		return fmt.Errorf("deleting like: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

func collectUsers(rows interface{ Next() bool; Scan(...any) error; Err() error }) ([]types.User, error) {
	var users []types.User
	for rows.Next() {
		var u types.User
		if err := rows.Scan(
			&u.ID, &u.Username, &u.DisplayName,
			&u.Status, &u.IsApproved, &u.IsTrusted, &u.IsAdmin,
			&u.CreatedAt, &u.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("scanning user: %w", err)
		}
		users = append(users, u)
	}
	return users, rows.Err()
}
