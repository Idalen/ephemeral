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

func (p *Postgres) GetUserByID(ctx context.Context, id uuid.UUID) (*types.User, error) {
	row := p.pool.QueryRow(ctx, `
		SELECT id, username, display_name, status, is_approved, is_trusted, is_admin, created_at, updated_at
		FROM users WHERE id = $1`, id)
	return scanUser(row)
}

func (p *Postgres) GetUserByUsername(ctx context.Context, username string) (*types.User, error) {
	row := p.pool.QueryRow(ctx, `
		SELECT id, username, display_name, status, is_approved, is_trusted, is_admin, created_at, updated_at
		FROM users WHERE username = $1`, username)
	return scanUser(row)
}

func (p *Postgres) CreateUser(ctx context.Context, user *types.User) error {
	_, err := p.pool.Exec(ctx, `
		INSERT INTO users (id, username, display_name, status, is_approved, is_trusted, is_admin, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
		user.ID, user.Username, user.DisplayName, user.Status,
		user.IsApproved, user.IsTrusted, user.IsAdmin,
		user.CreatedAt, user.UpdatedAt,
	)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return ErrConflict
		}
		return fmt.Errorf("inserting user: %w", err)
	}
	return nil
}

func (p *Postgres) UpdateUser(ctx context.Context, user *types.User) error {
	tag, err := p.pool.Exec(ctx, `
		UPDATE users SET display_name = $2, status = $3, is_approved = $4, is_trusted = $5, is_admin = $6, updated_at = now()
		WHERE id = $1`,
		user.ID, user.DisplayName, user.Status, user.IsApproved, user.IsTrusted, user.IsAdmin,
	)
	if err != nil {
		return fmt.Errorf("updating user: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

func (p *Postgres) GetUserProfile(ctx context.Context, userID uuid.UUID) (*types.UserProfile, error) {
	row := p.pool.QueryRow(ctx, `
		SELECT user_id, bio, profile_picture_url, background_picture_url, updated_at
		FROM user_profiles WHERE user_id = $1`, userID)

	var prof types.UserProfile
	err := row.Scan(&prof.UserID, &prof.Bio, &prof.ProfilePictureURL, &prof.BackgroundPictureURL, &prof.UpdatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("scanning user profile: %w", err)
	}
	return &prof, nil
}

func (p *Postgres) UpsertUserProfile(ctx context.Context, profile *types.UserProfile) error {
	_, err := p.pool.Exec(ctx, `
		INSERT INTO user_profiles (user_id, bio, profile_picture_url, background_picture_url, updated_at)
		VALUES ($1, $2, $3, $4, now())
		ON CONFLICT (user_id) DO UPDATE SET
			bio = EXCLUDED.bio,
			profile_picture_url = EXCLUDED.profile_picture_url,
			background_picture_url = EXCLUDED.background_picture_url,
			updated_at = now()`,
		profile.UserID, profile.Bio, profile.ProfilePictureURL, profile.BackgroundPictureURL,
	)
	if err != nil {
		return fmt.Errorf("upserting user profile: %w", err)
	}
	return nil
}

func (p *Postgres) GetUserCounts(ctx context.Context, userID uuid.UUID) (followerCount, followingCount, postCount int, err error) {
	err = p.pool.QueryRow(ctx, `
		SELECT
			(SELECT COUNT(*) FROM follows WHERE following_id = $1) AS follower_count,
			(SELECT COUNT(*) FROM follows WHERE follower_id = $1)  AS following_count,
			(SELECT COUNT(*) FROM posts   WHERE user_id = $1 AND status = 'approved') AS post_count`,
		userID,
	).Scan(&followerCount, &followingCount, &postCount)
	if err != nil {
		return 0, 0, 0, fmt.Errorf("getting user counts: %w", err)
	}
	return followerCount, followingCount, postCount, nil
}

func scanUser(row pgx.Row) (*types.User, error) {
	var u types.User
	err := row.Scan(
		&u.ID, &u.Username, &u.DisplayName,
		&u.Status, &u.IsApproved, &u.IsTrusted, &u.IsAdmin,
		&u.CreatedAt, &u.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("scanning user: %w", err)
	}
	return &u, nil
}
