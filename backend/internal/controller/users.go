package controller

import (
	"errors"
	"net/http"

	"ephemeral/internal/service"
	"ephemeral/types"

	"github.com/gin-gonic/gin"
)

func (ct *Controller) getMe(c *gin.Context) {
	claims := getClaims(c)
	user, err := ct.service.GetMyProfile(c.Request.Context(), claims.UserID)
	if err != nil {
		ct.logger.Sugar().Errorf("getMe: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}
	c.JSON(http.StatusOK, user)
}

func (ct *Controller) updateMe(c *gin.Context) {
	claims := getClaims(c)

	var req types.UpdateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}
	if err := req.Validate(); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	profile, err := ct.service.UpdateProfile(c.Request.Context(), claims.UserID, &req)
	if err != nil {
		ct.logger.Sugar().Errorf("updateMe: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	c.JSON(http.StatusOK, profile)
}

func (ct *Controller) getProfile(c *gin.Context) {
	username := c.Param("username")
	claims := getClaims(c)

	profile, err := ct.service.GetProfile(c.Request.Context(), username, &claims.UserID)
	if err != nil {
		if errors.Is(err, service.ErrNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
			return
		}
		ct.logger.Sugar().Errorf("getProfile: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	c.JSON(http.StatusOK, profile)
}

func (ct *Controller) getFollowers(c *gin.Context) {
	username := c.Param("username")
	limit, offset := parsePageParams(c)

	users, err := ct.service.GetFollowers(c.Request.Context(), username, limit, offset)
	if err != nil {
		if errors.Is(err, service.ErrNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
			return
		}
		ct.logger.Sugar().Errorf("getFollowers: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"users": users})
}

func (ct *Controller) getFollowing(c *gin.Context) {
	username := c.Param("username")
	limit, offset := parsePageParams(c)

	users, err := ct.service.GetFollowing(c.Request.Context(), username, limit, offset)
	if err != nil {
		if errors.Is(err, service.ErrNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
			return
		}
		ct.logger.Sugar().Errorf("getFollowing: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"users": users})
}

func (ct *Controller) getUserPosts(c *gin.Context) {
	username := c.Param("username")
	limit, _ := parsePageParams(c)

	var cursor *types.PostCursor
	if cursorStr := c.Query("cursor"); cursorStr != "" {
		// Simple cursor: just use limit/offset for user posts
		_ = cursorStr
	}

	posts, err := ct.service.GetUserPosts(c.Request.Context(), username, limit, cursor)
	if err != nil {
		if errors.Is(err, service.ErrNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
			return
		}
		ct.logger.Sugar().Errorf("getUserPosts: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"posts": posts})
}
