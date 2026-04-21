package types

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
)

type FeedPost struct {
	Post
	AuthorUsername    string  `json:"author_username"`
	AuthorDisplayName *string `json:"author_display_name,omitempty"`
	AuthorPictureURL  *string `json:"author_picture_url,omitempty"`
	LikeCount         int     `json:"like_count"`
	IsLiked           bool    `json:"is_liked"`
	Priority          int     `json:"-"`
}

type FeedCursor struct {
	Priority  int       `json:"priority"`
	CreatedAt time.Time `json:"created_at"`
	ID        uuid.UUID `json:"id"`
}

func EncodeCursor(c FeedCursor) string {
	b, _ := json.Marshal(c)
	return base64.StdEncoding.EncodeToString(b)
}

func DecodeCursor(s string) (*FeedCursor, error) {
	b, err := base64.StdEncoding.DecodeString(s)
	if err != nil {
		return nil, fmt.Errorf("invalid cursor")
	}
	var c FeedCursor
	if err := json.Unmarshal(b, &c); err != nil {
		return nil, fmt.Errorf("invalid cursor")
	}
	return &c, nil
}

type FeedResponse struct {
	Posts      []FeedPost `json:"posts"`
	NextCursor string     `json:"next_cursor,omitempty"`
	HasMore    bool       `json:"has_more"`
}
