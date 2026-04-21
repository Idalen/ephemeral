package controller

import (
	"errors"
	"io"
	"net/http"

	"ephemeral/internal/service"

	"github.com/gin-gonic/gin"
)

func (ct *Controller) uploadMedia(c *gin.Context) {
	claims := getClaims(c)

	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "file field is required"})
		return
	}
	defer file.Close()

	data, err := io.ReadAll(file)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to read file"})
		return
	}

	mimeType := header.Header.Get("Content-Type")

	resp, err := ct.service.UploadMedia(c.Request.Context(), claims.UserID, data, mimeType)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrUnsupportedMedia):
			c.JSON(http.StatusUnsupportedMediaType, gin.H{"error": "only image files are allowed"})
		default:
			ct.logger.Sugar().Errorf("uploadMedia: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		}
		return
	}

	c.JSON(http.StatusCreated, resp)
}

func (ct *Controller) serveMedia(c *gin.Context) {
	mediaID, ok := parseUUIDParam(c, "id")
	if !ok {
		return
	}

	file, err := ct.service.GetMediaFile(c.Request.Context(), mediaID)
	if err != nil {
		if errors.Is(err, service.ErrNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "media not found"})
			return
		}
		ct.logger.Sugar().Errorf("serveMedia: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	c.Header("Cache-Control", "public, max-age=31536000, immutable")
	c.Data(http.StatusOK, file.MimeType, file.Data)
}
