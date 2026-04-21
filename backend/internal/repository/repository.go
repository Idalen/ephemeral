package repository

import (
	"context"

	"ephemeral/types"

	"github.com/google/uuid"
)

type Repository interface {
	UserRepository
	AuthRepository
	PostRepository
	MediaRepository
	SocialRepository
	FeedRepository
	AdminRepository
}

type UserRepository interface {
	GetUserByID(ctx context.Context, id uuid.UUID) (*types.User, error)
	GetUserByUsername(ctx context.Context, username string) (*types.User, error)
	CreateUser(ctx context.Context, user *types.User) error
	UpdateUser(ctx context.Context, user *types.User) error
	GetUserProfile(ctx context.Context, userID uuid.UUID) (*types.UserProfile, error)
	UpsertUserProfile(ctx context.Context, profile *types.UserProfile) error
	GetUserCounts(ctx context.Context, userID uuid.UUID) (followerCount, followingCount, postCount int, err error)
}

type AuthRepository interface {
	GetPasswordCredentials(ctx context.Context, userID uuid.UUID) (*types.PasswordCredentials, error)
	CreateAuthIdentity(ctx context.Context, identity *types.AuthIdentity) error
	CreatePasswordCredentials(ctx context.Context, creds *types.PasswordCredentials) error
}

type PostRepository interface {
	CreatePost(ctx context.Context, post *types.Post) error
	GetPostByID(ctx context.Context, id uuid.UUID) (*types.Post, error)
	DeletePost(ctx context.Context, id uuid.UUID) error
	GetPostsByUserID(ctx context.Context, userID uuid.UUID, limit int, cursor *types.PostCursor) ([]types.Post, error)
	CreatePostMedia(ctx context.Context, media *types.PostMedia) error
	GetPostMediaByPostID(ctx context.Context, postID uuid.UUID) ([]types.PostMedia, error)
	GetLikeCount(ctx context.Context, postID uuid.UUID) (int, error)
	IsLikedByUser(ctx context.Context, userID, postID uuid.UUID) (bool, error)
}

type MediaRepository interface {
	CreateMediaFile(ctx context.Context, file *types.MediaFile) error
	GetMediaFile(ctx context.Context, id uuid.UUID) (*types.MediaFile, error)
}

type SocialRepository interface {
	FollowUser(ctx context.Context, followerID, followingID uuid.UUID) error
	UnfollowUser(ctx context.Context, followerID, followingID uuid.UUID) error
	IsFollowing(ctx context.Context, followerID, followingID uuid.UUID) (bool, error)
	GetFollowers(ctx context.Context, userID uuid.UUID, limit, offset int) ([]types.User, error)
	GetFollowing(ctx context.Context, userID uuid.UUID, limit, offset int) ([]types.User, error)
	LikePost(ctx context.Context, userID, postID uuid.UUID) error
	UnlikePost(ctx context.Context, userID, postID uuid.UUID) error
}

type FeedRepository interface {
	GetFeed(ctx context.Context, userID uuid.UUID, limit int, cursor *types.FeedCursor) ([]types.FeedPost, error)
}

type AdminRepository interface {
	GetPendingUsers(ctx context.Context, limit, offset int) ([]types.User, error)
	ApproveUser(ctx context.Context, userID uuid.UUID) error
	RejectUser(ctx context.Context, userID uuid.UUID) error
	SetUserTrusted(ctx context.Context, userID uuid.UUID, trusted bool) error
	GetPendingPosts(ctx context.Context, limit, offset int) ([]types.Post, error)
	ApprovePost(ctx context.Context, postID uuid.UUID) error
	RejectPost(ctx context.Context, postID uuid.UUID) error
}
