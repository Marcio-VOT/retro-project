package database

import (
	"fmt"
	"log"

	"retro-project/server/internal/domain/entities"
	"retro-project/server/internal/infrastructure/config"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func New(config config.DatabaseConfig) (*gorm.DB, error) {
	dsn := config.GetDSN()

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	// Auto-migrate the schema
	if err := autoMigrate(db); err != nil {
		return nil, fmt.Errorf("failed to migrate database: %w", err)
	}

	log.Println("Database connected and migrated successfully")
	return db, nil
}

func Migrate(db *gorm.DB) error {
	return autoMigrate(db)
}

func autoMigrate(db *gorm.DB) error {
	// Migrate all entities
	err := db.AutoMigrate(
		&entities.User{},
		&entities.Team{},
		&entities.Retro{},
		&entities.RetroParticipant{},
		&entities.RetroCard{},
		&entities.RetroCardVote{},
		&entities.RetroCategory{},
		&entities.Guest{},
		&entities.Invite{},
	)

	if err != nil {
		return fmt.Errorf("failed to auto-migrate database: %w", err)
	}

	log.Println("Database tables created successfully")
	return nil
}
