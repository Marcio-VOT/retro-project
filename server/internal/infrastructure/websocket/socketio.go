package websocket

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	socketio "github.com/googollee/go-socket.io"
)

type SocketIOServer struct {
	Server *socketio.Server
}

func NewSocketIOServer() *SocketIOServer {
	// Configure Socket.IO server with explicit settings
	srv := socketio.NewServer(nil)

	// Allow all origins for development
	srv.OnConnect("/", func(s socketio.Conn) error {
		log.Println("Socket.IO: client connected", s.ID())
		return nil
	})

	srv.OnDisconnect("/", func(s socketio.Conn, reason string) {
		log.Println("Socket.IO: client disconnected", s.ID(), reason)
	})

	// Room management - match frontend event names
	srv.OnEvent("/", "joinRoom", func(s socketio.Conn, data map[string]interface{}) {
		roomId, _ := data["roomId"].(string)
		if roomId != "" {
			s.Join(roomId)
			log.Printf("Socket.IO: %s joined room %s", s.ID(), roomId)
			s.Emit("room-joined", roomId)
		}
	})

	srv.OnEvent("/", "leaveRoom", func(s socketio.Conn, data map[string]interface{}) {
		roomId, _ := data["roomId"].(string)
		if roomId != "" {
			s.Leave(roomId)
			log.Printf("Socket.IO: %s left room %s", s.ID(), roomId)
		}
	})

	// Add a method to log broadcast events
	srv.OnEvent("/", "debug", func(s socketio.Conn, data map[string]interface{}) {
		log.Printf("Socket.IO: Debug event from %s: %v", s.ID(), data)
	})

	// Test event handler
	srv.OnEvent("/", "test", func(s socketio.Conn, data map[string]interface{}) {
		log.Printf("Socket.IO: Test event from %s: %v", s.ID(), data)
		s.Emit("test-response", map[string]interface{}{
			"message":  "Hello from server",
			"clientId": s.ID(),
		})
	})

	// Card events - match frontend event names
	srv.OnEvent("/", "add-card", func(s socketio.Conn, data map[string]interface{}) {
		tableId, _ := data["tableId"].(string)
		if tableId != "" {
			srv.BroadcastToRoom("/", tableId, "card-created", data)
		}
	})

	srv.OnEvent("/", "update-card", func(s socketio.Conn, data map[string]interface{}) {
		tableId, _ := data["tableId"].(string)
		if tableId != "" {
			srv.BroadcastToRoom("/", tableId, "card-updated", data)
		}
	})

	srv.OnEvent("/", "delete-card", func(s socketio.Conn, data map[string]interface{}) {
		tableId, _ := data["tableId"].(string)
		if tableId != "" {
			srv.BroadcastToRoom("/", tableId, "card-deleted", data)
		}
	})

	srv.OnEvent("/", "merge-cards", func(s socketio.Conn, data map[string]interface{}) {
		tableId, _ := data["tableId"].(string)
		if tableId != "" {
			srv.BroadcastToRoom("/", tableId, "cards-merged", data)
		}
	})

	srv.OnEvent("/", "vote-card", func(s socketio.Conn, data map[string]interface{}) {
		tableId, _ := data["tableId"].(string)
		if tableId != "" {
			srv.BroadcastToRoom("/", tableId, "card-voted", data)
		}
	})

	// Topic events - match frontend event names
	srv.OnEvent("/", "add-topic", func(s socketio.Conn, data map[string]interface{}) {
		tableId, _ := data["tableId"].(string)
		if tableId != "" {
			srv.BroadcastToRoom("/", tableId, "topic-added", data)
		}
	})

	srv.OnEvent("/", "update-topic", func(s socketio.Conn, data map[string]interface{}) {
		tableId, _ := data["tableId"].(string)
		if tableId != "" {
			srv.BroadcastToRoom("/", tableId, "topic-updated", data)
		}
	})

	srv.OnEvent("/", "remove-topic", func(s socketio.Conn, data map[string]interface{}) {
		tableId, _ := data["tableId"].(string)
		if tableId != "" {
			srv.BroadcastToRoom("/", tableId, "topic-removed", data)
		}
	})

	// Table management events - match frontend event names
	srv.OnEvent("/", "archive-table", func(s socketio.Conn, data map[string]interface{}) {
		tableId, _ := data["tableId"].(string)
		if tableId != "" {
			srv.BroadcastToRoom("/", tableId, "table-archived", data)
		}
	})

	srv.OnEvent("/", "share-table", func(s socketio.Conn, data map[string]interface{}) {
		tableId, _ := data["tableId"].(string)
		if tableId != "" {
			srv.BroadcastToRoom("/", tableId, "table-shared", data)
		}
	})

	// Blur events
	srv.OnEvent("/", "toggle-blur", func(s socketio.Conn, data map[string]interface{}) {
		tableId, _ := data["tableId"].(string)
		if tableId != "" {
			srv.BroadcastToRoom("/", tableId, "blur-toggled", data)
		}
	})

	return &SocketIOServer{Server: srv}
}

// AttachHandler attaches the Socket.IO server to a Gin route
func (s *SocketIOServer) AttachHandler(r *gin.Engine) {
	// Create a custom handler that completely bypasses Gin's middleware
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
		s.Server.ServeHTTP(w, r)
	})

	// Use gin.WrapH to wrap the http.Handler
	r.Any("/socket.io/*any", gin.WrapH(socketHandler))
}

// Shutdown stops the Socket.IO server
func (s *SocketIOServer) Shutdown() {
	s.Server.Close()
}
