package service

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	"ephemeral/internal/repository"
	"ephemeral/types"

	"github.com/google/uuid"
)

const maxMediaSize = 20 * 1024 * 1024 // 20 MB

func (s *Service) UploadMedia(ctx context.Context, userID uuid.UUID, data []byte, mimeType string) (*types.MediaUploadResponse, error) {
	if len(data) > maxMediaSize {
		return nil, fmt.Errorf("file exceeds maximum size of 20 MB")
	}

	if mimeType == "" {
		mimeType = http.DetectContentType(data)
	}

	if !strings.HasPrefix(mimeType, "image/") {
		return nil, ErrUnsupportedMedia
	}

	fileID := uuid.New()
	file := &types.MediaFile{
		ID:        fileID,
		UserID:    userID,
		Data:      data,
		MimeType:  mimeType,
		Size:      len(data),
		CreatedAt: time.Now().UTC(),
	}

	if err := s.repo.CreateMediaFile(ctx, file); err != nil {
		return nil, fmt.Errorf("storing media file: %w", err)
	}

	return &types.MediaUploadResponse{
		ID:  fileID,
		URL: fmt.Sprintf("/api/media/%s", fileID),
	}, nil
}

func (s *Service) GetMediaFile(ctx context.Context, id uuid.UUID) (*types.MediaFile, error) {
	file, err := s.repo.GetMediaFile(ctx, id)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("getting media file: %w", err)
	}
	return file, nil
}
