package repository

import (
	"context"
	"fmt"

	"ephemeral/config"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"github.com/jackc/pgx/v5/pgxpool"
	"go.uber.org/fx"
	"go.uber.org/zap"
)

type Postgres struct {
	pool   *pgxpool.Pool
	logger *zap.Logger
}

type PostgresParams struct {
	fx.In

	Config    *config.Config
	Logger    *zap.Logger
	Lifecycle fx.Lifecycle
}

func NewPostgres(p PostgresParams) (Repository, error) {
	poolConfig, err := pgxpool.ParseConfig(p.Config.Database.URL)
	if err != nil {
		return nil, fmt.Errorf("parsing database URL: %w", err)
	}
	poolConfig.MaxConns = int32(p.Config.Database.MaxConns)

	pool, err := pgxpool.NewWithConfig(context.Background(), poolConfig)
	if err != nil {
		return nil, fmt.Errorf("creating connection pool: %w", err)
	}

	if err := pool.Ping(context.Background()); err != nil {
		pool.Close()
		return nil, fmt.Errorf("pinging database: %w", err)
	}

	if err := runMigrations(p.Config.Database.URL, p.Config.Database.MigrationsPath); err != nil {
		pool.Close()
		return nil, fmt.Errorf("running migrations: %w", err)
	}

	repo := &Postgres{pool: pool, logger: p.Logger}

	p.Lifecycle.Append(fx.Hook{
		OnStop: func(ctx context.Context) error {
			pool.Close()
			return nil
		},
	})

	return repo, nil
}

func runMigrations(databaseURL, migrationsPath string) error {
	m, err := migrate.New(
		fmt.Sprintf("file://%s", migrationsPath),
		databaseURL,
	)
	if err != nil {
		return fmt.Errorf("creating migrator: %w", err)
	}
	defer m.Close()

	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		return fmt.Errorf("applying migrations: %w", err)
	}

	return nil
}
