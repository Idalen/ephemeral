package controller

import (
	"net/http"
	"strconv"

	"ephemeral/internal/service"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func getClaims(c *gin.Context) *service.Claims {
	val, exists := c.Get(claimsKey)
	if !exists {
		return nil
	}
	claims, _ := val.(*service.Claims)
	return claims
}

func parseUUIDParam(c *gin.Context, param string) (uuid.UUID, bool) {
	id, err := uuid.Parse(c.Param(param))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid " + param})
		return uuid.UUID{}, false
	}
	return id, true
}

func parsePageParams(c *gin.Context) (limit, offset int) {
	limit, _ = strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset, _ = strconv.Atoi(c.DefaultQuery("offset", "0"))
	if limit <= 0 || limit > 100 {
		limit = 20
	}
	if offset < 0 {
		offset = 0
	}
	return limit, offset
}
