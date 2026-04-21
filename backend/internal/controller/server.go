package controller

import (
	"context"
	"fmt"
	"net/http"

	"ephemeral/config"
	"ephemeral/internal/service"

	"github.com/gin-gonic/gin"
	"go.uber.org/fx"
	"go.uber.org/zap"
)

type Controller struct {
	service *service.Service
	config  *config.Config
	logger  *zap.Logger
	server  *http.Server
}

type Params struct {
	fx.In

	Service   *service.Service
	Config    *config.Config
	Logger    *zap.Logger
	Lifecycle fx.Lifecycle
}

func New(p Params) {
	if !p.Config.Development {
		gin.SetMode(gin.ReleaseMode)
	}

	ct := &Controller{
		service: p.Service,
		config:  p.Config,
		logger:  p.Logger,
	}

	router := gin.New()
	router.Use(gin.Recovery())
	router.Use(ct.loggerMiddleware())
	router.Use(ct.corsMiddleware())

	api := router.Group("/api")

	api.GET("/health", ct.health)

	// Public auth routes
	auth := api.Group("/auth")
	auth.POST("/register", ct.register)
	auth.POST("/login", ct.login)

	// Media (serve without auth so browsers can load images)
	api.GET("/media/:id", ct.serveMedia)

	// Authenticated routes
	authed := api.Group("/")
	authed.Use(ct.authMiddleware())

	authed.GET("/users/me", ct.getMe)
	authed.PATCH("/users/me", ct.updateMe)
	authed.GET("/users/:username", ct.getProfile)
	authed.GET("/users/:username/followers", ct.getFollowers)
	authed.GET("/users/:username/following", ct.getFollowing)
	authed.GET("/users/:username/posts", ct.getUserPosts)
	authed.POST("/users/:username/follow", ct.follow)
	authed.DELETE("/users/:username/follow", ct.unfollow)

	authed.POST("/media", ct.uploadMedia)

	authed.POST("/posts", ct.createPost)
	authed.GET("/posts/:id", ct.getPost)
	authed.DELETE("/posts/:id", ct.deletePost)
	authed.POST("/posts/:id/like", ct.likePost)
	authed.DELETE("/posts/:id/like", ct.unlikePost)

	authed.GET("/feed", ct.getFeed)

	// Admin routes
	admin := authed.Group("/admin")
	admin.Use(ct.adminMiddleware())

	admin.GET("/users/pending", ct.getPendingUsers)
	admin.POST("/users/:id/approve", ct.approveUser)
	admin.POST("/users/:id/reject", ct.rejectUser)
	admin.POST("/users/:id/trust", ct.grantTrust)
	admin.DELETE("/users/:id/trust", ct.revokeTrust)

	admin.GET("/posts/pending", ct.getPendingPosts)
	admin.POST("/posts/:id/approve", ct.approvePost)
	admin.POST("/posts/:id/reject", ct.rejectPost)

	ct.server = &http.Server{
		Addr:    fmt.Sprintf("%s:%d", p.Config.Server.Host, p.Config.Server.Port),
		Handler: router,
	}

	p.Lifecycle.Append(fx.Hook{
		OnStart: func(ctx context.Context) error {
			p.Logger.Info("starting HTTP server", zap.String("addr", ct.server.Addr))
			go func() {
				if err := ct.server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
					p.Logger.Error("HTTP server error", zap.Error(err))
				}
			}()
			return nil
		},
		OnStop: func(ctx context.Context) error {
			p.Logger.Info("stopping HTTP server")
			return ct.server.Shutdown(ctx)
		},
	})
}
