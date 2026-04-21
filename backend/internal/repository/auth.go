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

func (p *Postgres) GetPasswordCredentials(ctx context.Context, userID uuid.UUID) (*types.PasswordCredentials, error) {
	row := p.pool.QueryRow(ctx, `
		SELECT user_id, password_hash, password_salt, updated_at
		FROM password_credentials WHERE user_id = $1`, userID)

	var creds types.PasswordCredentials
	err := row.Scan(&creds.UserID, &creds.PasswordHash, &creds.PasswordSalt, &creds.UpdatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("scanning password credentials: %w", err)
	}
	return &creds, nil
}

func (p *Postgres) CreateAuthIdentity(ctx context.Context, identity *types.AuthIdentity) error {
	_, err := p.pool.Exec(ctx, `
		INSERT INTO auth_identities (id, user_id, provider, provider_user_id, email, created_at)
		VALUES ($1, $2, $3, $4, $5, $6)`,
		identity.ID, identity.UserID, identity.Provider,
		identity.ProviderUserID, identity.Email, identity.CreatedAt,
	)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return ErrConflict
		}
		return fmt.Errorf("inserting auth identity: %w", err)
	}
	return nil
}

func (p *Postgres) CreatePasswordCredentials(ctx context.Context, creds *types.PasswordCredentials) error {
	_, err := p.pool.Exec(ctx, `
		INSERT INTO password_credentials (user_id, password_hash, password_salt, updated_at)
		VALUES ($1, $2, $3, now())`,
		creds.UserID, creds.PasswordHash, creds.PasswordSalt,
	)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return ErrConflict
		}
		return fmt.Errorf("inserting password credentials: %w", err)
	}
	return nil
}
