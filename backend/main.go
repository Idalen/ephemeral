package main

import (
	"ephemeral/config"
	"ephemeral/internal/repository"
	"ephemeral/internal/controller"
	"ephemeral/internal/service"

	"go.uber.org/fx"
)

func main() {
	fx.New(
		fx.Provide(
			func() config.Paths {
				return config.Paths{
					ConfigFile: "config/config.yaml",
					EnvFile:    "config/.env",
				}
			},
			config.NewConfig,
			config.NewLogger,
			repository.NewPostgres,
			service.New,
		),
		fx.Invoke(
			controller.New,
		),
	).Run()
}
