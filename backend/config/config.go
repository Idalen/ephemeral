package config

import (
	"fmt"
	"os"
	"time"

	"github.com/joho/godotenv"
	"gopkg.in/yaml.v3"
)

type Config struct {
	Name        string   `yaml:"name"`
	Development bool     `yaml:"development"`
	Server      Server   `yaml:"server"`
	Database    Database `yaml:"database"`
	JWT         JWT      `yaml:"jwt"`
}

type Server struct {
	Host        string   `yaml:"host"`
	Port        int      `yaml:"port"`
	CORSOrigins []string `yaml:"cors_origins"`
}

type Database struct {
	URL            string `yaml:"url"`
	MaxConns       int    `yaml:"max_conns"`
	MigrationsPath string `yaml:"migrations_path"`
}

type JWT struct {
	ExpiryHours int    `yaml:"expiry_hours"`
	Secret      string // loaded from env
}

func (j JWT) Expiry() time.Duration {
	return time.Duration(j.ExpiryHours) * time.Hour
}

type Paths struct {
	ConfigFile string
	EnvFile    string
}

func NewConfig(paths Paths) (*Config, error) {
	return Load(paths.ConfigFile, paths.EnvFile)
}

func Load(configFile, envFile string) (*Config, error) {
	data, err := os.ReadFile(configFile)
	if err != nil {
		return nil, fmt.Errorf("reading config file: %w", err)
	}

	var cfg Config
	if err := yaml.Unmarshal(data, &cfg); err != nil {
		return nil, fmt.Errorf("parsing config file: %w", err)
	}

	if err := godotenv.Load(envFile); err != nil {
		// Not fatal — env vars may be set directly in the environment
	}

	cfg.JWT.Secret = os.Getenv("JWT_SECRET")
	if cfg.JWT.Secret == "" {
		return nil, fmt.Errorf("JWT_SECRET environment variable is required")
	}

	if dbURL := os.Getenv("DATABASE_URL"); dbURL != "" {
		cfg.Database.URL = dbURL
	}

	if cfg.Database.URL == "" {
		return nil, fmt.Errorf("database URL is required")
	}

	return &cfg, nil
}
