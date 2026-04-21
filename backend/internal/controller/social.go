package controller

import (
	"errors"
	"net/http"

	"ephemeral/internal/service"

	"github.com/gin-gonic/gin"
)

func (ct *Controller) follow(c *gin.Context) {
	claims := getClaims(c)
	username := c.Param("username")

	if err := ct.service.Follow(c.Request.Context(), claims.UserID, username); err != nil {
		switch {
		case errors.Is(err, service.ErrNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		case errors.Is(err, service.ErrConflict):
			c.JSON(http.StatusConflict, gin.H{"error": "already following"})
		default:
			ct.logger.Sugar().Errorf("follow: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		}
		return
	}

	c.Status(http.StatusNoContent)
}

func (ct *Controller) unfollow(c *gin.Context) {
	claims := getClaims(c)
	username := c.Param("username")

	if err := ct.service.Unfollow(c.Request.Context(), claims.UserID, username); err != nil {
		switch {
		case errors.Is(err, service.ErrNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "not following"})
		default:
			ct.logger.Sugar().Errorf("unfollow: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		}
		return
	}

	c.Status(http.StatusNoContent)
}
