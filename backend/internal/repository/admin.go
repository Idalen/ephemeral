package repository

import (
	"context"
	"fmt"

	"ephemeral/types"

	"github.com/google/uuid"
)

func (p *Postgres) GetPendingUsers(ctx context.Context, limit, offset int) ([]types.User, error) {
	rows, err := p.pool.Query(ctx, `
		SELECT id, username, display_name, status, is_approved, is_trusted, is_admin, created_at, updated_at
		FROM users WHERE status = 'pending'
		ORDER BY created_at ASC
		LIMIT $1 OFFSET $2`, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("querying pending users: %w", err)
	}
	defer rows.Close()
	return collectUsers(rows)
}

func (p *Postgres) ApproveUser(ctx context.Context, userID uuid.UUID) error {
	tag, err := p.pool.Exec(ctx, `
		UPDATE users SET status = 'active', is_approved = true, updated_at = now()
		WHERE id = $1 AND status = 'pending'`, userID)
	if err != nil {
		return fmt.Errorf("approving user: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

func (p *Postgres) RejectUser(ctx context.Context, userID uuid.UUID) error {
	tag, err := p.pool.Exec(ctx, `
		UPDATE users SET status = 'disabled', updated_at = now()
		WHERE id = $1 AND status = 'pending'`, userID)
	if err != nil {
		return fmt.Errorf("rejecting user: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

func (p *Postgres) SetUserTrusted(ctx context.Context, userID uuid.UUID, trusted bool) error {
	tag, err := p.pool.Exec(ctx, `
		UPDATE users SET is_trusted = $2, updated_at = now() WHERE id = $1`, userID, trusted)
	if err != nil {
		return fmt.Errorf("setting user trusted: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

func (p *Postgres) GetPendingPosts(ctx context.Context, limit, offset int) ([]types.Post, error) {
	rows, err := p.pool.Query(ctx, `
		SELECT id, user_id, description, city, country, latitude, longitude, status, created_at, updated_at
		FROM posts WHERE status = 'pending'
		ORDER BY created_at ASC
		LIMIT $1 OFFSET $2`, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("querying pending posts: %w", err)
	}
	defer rows.Close()
	return collectPosts(rows)
}

func (p *Postgres) ApprovePost(ctx context.Context, postID uuid.UUID) error {
	tag, err := p.pool.Exec(ctx, `
		UPDATE posts SET status = 'approved', updated_at = now()
		WHERE id = $1 AND status = 'pending'`, postID)
	if err != nil {
		return fmt.Errorf("approving post: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

func (p *Postgres) RejectPost(ctx context.Context, postID uuid.UUID) error {
	tag, err := p.pool.Exec(ctx, `
		UPDATE posts SET status = 'rejected', updated_at = now()
		WHERE id = $1 AND status = 'pending'`, postID)
	if err != nil {
		return fmt.Errorf("rejecting post: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}
