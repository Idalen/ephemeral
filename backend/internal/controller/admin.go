package controller

import (
	"errors"
	"net/http"

	"ephemeral/internal/service"

	"github.com/gin-gonic/gin"
)

func (ct *Controller) getPendingUsers(c *gin.Context) {
	limit, offset := parsePageParams(c)

	users, err := ct.service.GetPendingUsers(c.Request.Context(), limit, offset)
	if err != nil {
		ct.logger.Sugar().Errorf("getPendingUsers: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"users": users})
}

func (ct *Controller) approveUser(c *gin.Context) {
	userID, ok := parseUUIDParam(c, "id")
	if !ok {
		return
	}

	if err := ct.service.ApproveUser(c.Request.Context(), userID); err != nil {
		switch {
		case errors.Is(err, service.ErrNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "user not found or not pending"})
		default:
			ct.logger.Sugar().Errorf("approveUser: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		}
		return
	}

	c.Status(http.StatusNoContent)
}

func (ct *Controller) rejectUser(c *gin.Context) {
	userID, ok := parseUUIDParam(c, "id")
	if !ok {
		return
	}

	if err := ct.service.RejectUser(c.Request.Context(), userID); err != nil {
		switch {
		case errors.Is(err, service.ErrNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "user not found or not pending"})
		default:
			ct.logger.Sugar().Errorf("rejectUser: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		}
		return
	}

	c.Status(http.StatusNoContent)
}

func (ct *Controller) grantTrust(c *gin.Context) {
	userID, ok := parseUUIDParam(c, "id")
	if !ok {
		return
	}

	if err := ct.service.SetUserTrusted(c.Request.Context(), userID, true); err != nil {
		switch {
		case errors.Is(err, service.ErrNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		default:
			ct.logger.Sugar().Errorf("grantTrust: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		}
		return
	}

	c.Status(http.StatusNoContent)
}

func (ct *Controller) revokeTrust(c *gin.Context) {
	userID, ok := parseUUIDParam(c, "id")
	if !ok {
		return
	}

	if err := ct.service.SetUserTrusted(c.Request.Context(), userID, false); err != nil {
		switch {
		case errors.Is(err, service.ErrNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		default:
			ct.logger.Sugar().Errorf("revokeTrust: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		}
		return
	}

	c.Status(http.StatusNoContent)
}

func (ct *Controller) getPendingPosts(c *gin.Context) {
	limit, offset := parsePageParams(c)

	posts, err := ct.service.GetPendingPosts(c.Request.Context(), limit, offset)
	if err != nil {
		ct.logger.Sugar().Errorf("getPendingPosts: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"posts": posts})
}

func (ct *Controller) approvePost(c *gin.Context) {
	postID, ok := parseUUIDParam(c, "id")
	if !ok {
		return
	}

	if err := ct.service.ApprovePost(c.Request.Context(), postID); err != nil {
		switch {
		case errors.Is(err, service.ErrNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "post not found or not pending"})
		default:
			ct.logger.Sugar().Errorf("approvePost: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		}
		return
	}

	c.Status(http.StatusNoContent)
}

func (ct *Controller) rejectPost(c *gin.Context) {
	postID, ok := parseUUIDParam(c, "id")
	if !ok {
		return
	}

	if err := ct.service.RejectPost(c.Request.Context(), postID); err != nil {
		switch {
		case errors.Is(err, service.ErrNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "post not found or not pending"})
		default:
			ct.logger.Sugar().Errorf("rejectPost: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		}
		return
	}

	c.Status(http.StatusNoContent)
}
