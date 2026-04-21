package controller

import (
	"errors"
	"net/http"

	"ephemeral/internal/service"
	"ephemeral/types"

	"github.com/gin-gonic/gin"
)

func (ct *Controller) register(c *gin.Context) {
	var req types.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}
	if err := req.Validate(); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := ct.service.Register(c.Request.Context(), &req)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrConflict):
			c.JSON(http.StatusConflict, gin.H{"error": "username already taken"})
		default:
			ct.logger.Sugar().Errorf("register: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		}
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "registration successful, awaiting admin approval",
		"user":    user,
	})
}

func (ct *Controller) login(c *gin.Context) {
	var req types.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}
	if err := req.Validate(); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	resp, err := ct.service.Login(c.Request.Context(), &req)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrInvalidCredentials):
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid username or password"})
		case errors.Is(err, service.ErrAccountPending):
			c.JSON(http.StatusForbidden, gin.H{"error": "account is pending approval"})
		case errors.Is(err, service.ErrAccountDisabled):
			c.JSON(http.StatusForbidden, gin.H{"error": "account has been disabled"})
		default:
			ct.logger.Sugar().Errorf("login: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		}
		return
	}

	c.JSON(http.StatusOK, resp)
}
