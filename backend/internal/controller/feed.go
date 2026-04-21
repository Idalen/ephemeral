package controller

import (
	"net/http"
	"strconv"

	"ephemeral/types"

	"github.com/gin-gonic/gin"
)

func (ct *Controller) getFeed(c *gin.Context) {
	claims := getClaims(c)

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	var cursor *types.FeedCursor
	if cursorStr := c.Query("cursor"); cursorStr != "" {
		decoded, err := types.DecodeCursor(cursorStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid cursor"})
			return
		}
		cursor = decoded
	}

	resp, err := ct.service.GetFeed(c.Request.Context(), claims.UserID, limit, cursor)
	if err != nil {
		ct.logger.Sugar().Errorf("getFeed: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	c.JSON(http.StatusOK, resp)
}
