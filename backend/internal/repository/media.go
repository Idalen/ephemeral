package repository

import (
	"context"
	"errors"
	"fmt"

	"ephemeral/types"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

func (p *Postgres) CreateMediaFile(ctx context.Context, file *types.MediaFile) error {
	_, err := p.pool.Exec(ctx, `
		INSERT INTO media_files (id, user_id, data, mime_type, size, created_at)
		VALUES ($1, $2, $3, $4, $5, $6)`,
		file.ID, file.UserID, file.Data, file.MimeType, file.Size, file.CreatedAt,
	)
	if err != nil {
		return fmt.Errorf("inserting media file: %w", err)
	}
	return nil
}

func (p *Postgres) GetMediaFile(ctx context.Context, id uuid.UUID) (*types.MediaFile, error) {
	row := p.pool.QueryRow(ctx, `
		SELECT id, user_id, data, mime_type, size, created_at
		FROM media_files WHERE id = $1`, id)

	var f types.MediaFile
	err := row.Scan(&f.ID, &f.UserID, &f.Data, &f.MimeType, &f.Size, &f.CreatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("scanning media file: %w", err)
	}
	return &f, nil
}
