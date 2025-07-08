package main

import (
	"retro-project/server/internal/infrastructure/config"
	"retro-project/server/internal/infrastructure/database"
	"retro-project/server/internal/infrastructure/logger"
)

func main() {
	// Initialize logger
	logger := logger.New()

	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		logger.Fatal("Failed to load configuration", err)
	}

	// Initialize database
	db, err := database.New(cfg.Database)
	if err != nil {
		logger.Fatal("Failed to connect to database", err)
	}

	// Run migrations
	logger.Info("Running database migrations...")
	if err := database.Migrate(db); err != nil {
		logger.Fatal("Failed to run migrations", err)
	}

	logger.Info("Migrations completed successfully")
}
