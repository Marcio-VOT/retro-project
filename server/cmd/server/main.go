package main

import (
	"context"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"retro-project/server/internal/infrastructure/config"
	"retro-project/server/internal/infrastructure/database"
	"retro-project/server/internal/infrastructure/logger"
	"retro-project/server/internal/infrastructure/server"
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

	// Initialize HTTP server (no wsHub needed)
	srv := server.New(cfg, db, nil, logger)

	// Start HTTP server
	go func() {
		logger.Info("Starting HTTP server", "port", cfg.Server.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Fatal("Failed to start server", err)
		}
	}()

	// Wait for interrupt signal to gracefully shutdown the server
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logger.Info("Shutting down server...")

	// Create context with timeout for graceful shutdown
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	// Shutdown HTTP server
	if err := srv.Shutdown(ctx); err != nil {
		logger.Error("Server forced to shutdown", err)
	}

	logger.Info("Server exited")
}
