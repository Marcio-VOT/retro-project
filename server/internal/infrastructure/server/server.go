package server

import (
	"net/http"

	"retro-project/server/internal/infrastructure/config"
	"retro-project/server/internal/infrastructure/jwt"
	"retro-project/server/internal/infrastructure/websocket"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type Server struct {
	config *config.Config
	db     *gorm.DB
	router *gin.Engine
}

func New(config *config.Config, db *gorm.DB, _ interface{}, logger interface{}) *http.Server {
	gin.SetMode(gin.ReleaseMode)

	// Create a new router without default middleware
	router := gin.New()

	// Add only essential middleware
	router.Use(gin.Recovery())
	router.Use(gin.Logger())

	// Socket.IO server - create a separate handler
	sio := websocket.NewSocketIOServer()

	// Create a custom handler for Socket.IO that bypasses Gin entirely
	socketHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Set CORS headers for Socket.IO
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		// Handle preflight requests
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		// Handle the request with Socket.IO
		sio.Server.ServeHTTP(w, r)
	})

	// Add CORS middleware
	router.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	// Basic health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// JWT service
	jwtService := jwt.NewJWTService(config.JWT.Secret, config.JWT.Expiration)
	// Auth handler
	authHandler := &AuthHandler{
		DB:         db,
		JWTService: jwtService,
	}

	// Table handler
	tableHandler := &TableHandler{
		DB:     db,
		Socket: sio.Server,
	}

	api := router.Group("/api")
	{
		api.POST("/auth/register", authHandler.Register)
		api.POST("/auth/login", authHandler.Login)

		// Protected routes
		protected := api.Group("/auth")
		protected.Use(jwt.JWTMiddleware(jwtService))
		{
			protected.GET("/me", func(c *gin.Context) {
				userID := c.GetString("user_id")
				userEmail := c.GetString("user_email")
				userName := c.GetString("user_name")
				c.JSON(200, gin.H{
					"id":    userID,
					"email": userEmail,
					"name":  userName,
				})
			})
			protected.POST("/link-guest", tableHandler.LinkGuestToAccount)
		}

		// Table routes (protected)
		tables := api.Group("/tables")
		tables.Use(jwt.JWTMiddleware(jwtService))
		{
			tables.GET("", tableHandler.GetUserTables)
			tables.POST("", tableHandler.CreateTable)
			tables.GET("/:tableId", tableHandler.GetTable)
			tables.POST("/:tableId/archive", tableHandler.ArchiveTable)
			tables.DELETE("/:tableId", tableHandler.DeleteTable)
			tables.POST("/:tableId/invite", tableHandler.CreateInvite)
			tables.POST("/:tableId/signed-invite", tableHandler.CreateSignedInvite)

			// Topic management routes
			tables.POST("/:tableId/topics", tableHandler.CreateTopic)
			tables.PUT("/:tableId/topics/:topicId", tableHandler.UpdateTopic)
			tables.DELETE("/:tableId/topics/:topicId", tableHandler.RemoveTopic)
		}

		// Table access route (public - for invite tokens)
		api.GET("/tables/:tableId/access", FlexibleAuthMiddleware(jwtService), tableHandler.GetTableAccess)

		// Guest routes (public)
		api.POST("/tables/:tableId/join-guest", tableHandler.JoinAsGuest)

		// Card routes (flexible auth)
		cards := api.Group("/cards")
		cards.Use(FlexibleAuthMiddleware(jwtService))
		{
			cards.POST("", tableHandler.CreateCard)
			cards.POST("/:cardId/vote", tableHandler.VoteCard)
			cards.POST("/merge", tableHandler.MergeCards)
			cards.DELETE("/:id", tableHandler.DeleteCard)
		}

		// Table cards route (flexible auth)
		api.GET("/tables/:tableId/cards", FlexibleAuthMiddleware(jwtService), tableHandler.GetCards)

		// Invite validation routes (public)
		api.GET("/invites/validate/:token", tableHandler.ValidateSignedInvite)
	}

	// Create a custom HTTP server that handles both Gin routes and Socket.IO
	server := &http.Server{
		Addr: "127.0.0.1:" + config.Server.Port,
		Handler: http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Check if this is a Socket.IO request
			if r.URL.Path == "/socket.io" || (len(r.URL.Path) > 12 && r.URL.Path[:12] == "/socket.io/") {
				socketHandler.ServeHTTP(w, r)
				return
			}

			// Otherwise, handle with Gin
			router.ServeHTTP(w, r)
		}),
	}

	return server
}
