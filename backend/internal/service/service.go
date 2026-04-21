package service

import (
	"ephemeral/config"
	"ephemeral/internal/repository"

	"go.uber.org/fx"
	"go.uber.org/zap"
)

type Service struct {
	repo   repository.Repository
	config *config.Config
	logger *zap.Logger
}

type Params struct {
	fx.In

	Repo   repository.Repository
	Config *config.Config
	Logger *zap.Logger
}

func New(p Params) *Service {
	return &Service{
		repo:   p.Repo,
		config: p.Config,
		logger: p.Logger,
	}
}
