package controller

import (
	"errors"
	"net/http"

	"ephemeral/internal/service"
	"ephemeral/types"

	"github.com/gin-gonic/gin"
)

func (ct *Controller) createPost(c *gin.Context) {
	claims := getClaims(c)

	var req types.CreatePostRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}
	if err := req.Validate(); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	post, err := ct.service.CreatePost(c.Request.Context(), claims.UserID, &req)
	if err != nil {
		ct.logger.Sugar().Errorf("createPost: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	c.JSON(http.StatusCreated, post)
}

func (ct *Controller) getPost(c *gin.Context) {
	postID, ok := parseUUIDParam(c, "id")
	if !ok {
		return
	}

	post, err := ct.service.GetPost(c.Request.Context(), postID)
	if err != nil {
		if errors.Is(err, service.ErrNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "post not found"})
			return
		}
		ct.logger.Sugar().Errorf("getPost: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	c.JSON(http.StatusOK, post)
}

func (ct *Controller) deletePost(c *gin.Context) {
	claims := getClaims(c)
	postID, ok := parseUUIDParam(c, "id")
	if !ok {
		return
	}

	if err := ct.service.DeletePost(c.Request.Context(), claims.UserID, postID); err != nil {
		switch {
		case errors.Is(err, service.ErrNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "post not found"})
		case errors.Is(err, service.ErrForbidden):
			c.JSON(http.StatusForbidden, gin.H{"error": "cannot delete another user's post"})
		default:
			ct.logger.Sugar().Errorf("deletePost: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		}
		return
	}

	c.Status(http.StatusNoContent)
}

func (ct *Controller) likePost(c *gin.Context) {
	claims := getClaims(c)
	postID, ok := parseUUIDParam(c, "id")
	if !ok {
		return
	}

	if err := ct.service.LikePost(c.Request.Context(), claims.UserID, postID); err != nil {
		switch {
		case errors.Is(err, service.ErrConflict):
			c.JSON(http.StatusConflict, gin.H{"error": "post already liked"})
		default:
			ct.logger.Sugar().Errorf("likePost: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		}
		return
	}

	c.Status(http.StatusNoContent)
}

func (ct *Controller) unlikePost(c *gin.Context) {
	claims := getClaims(c)
	postID, ok := parseUUIDParam(c, "id")
	if !ok {
		return
	}

	if err := ct.service.UnlikePost(c.Request.Context(), claims.UserID, postID); err != nil {
		switch {
		case errors.Is(err, service.ErrNotFound):
			c.JSON(http.StatusNotFound, gin.H{"error": "like not found"})
		default:
			ct.logger.Sugar().Errorf("unlikePost: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		}
		return
	}

	c.Status(http.StatusNoContent)
}
