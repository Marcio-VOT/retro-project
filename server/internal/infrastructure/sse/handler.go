package sse

import (
	"encoding/json"
	"time"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	hub *Hub
}

func NewHandler(hub *Hub) *Handler {
	return &Handler{hub: hub}
}

// StreamHandler is the endpoint clients connect to when entering a retro board.
// GET /api/tables/:tableId/stream
func (h *Handler) StreamHandler(c *gin.Context) {
	tableID := c.Param("tableId")

	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")
	c.Header("X-Accel-Buffering", "no") // required when Nginx is used as a proxy

	client := &Client{
		TableID: tableID,
		Send:    make(chan []byte, 32),
	}

	h.hub.Register(tableID, client)
	defer h.hub.Unregister(tableID, client)

	// Send connection-confirmed event
	c.SSEvent("connected", gin.H{"tableId": tableID})
	c.Writer.Flush()

	// Keepalive ticker to keep the connection alive through proxies
	ticker := time.NewTicker(25 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case payload, ok := <-client.Send:
			if !ok {
				return
			}
			c.Writer.Write(payload) //nolint:errcheck
			c.Writer.Flush()

		case <-ticker.C:
			c.Writer.Write([]byte(": keepalive\n\n")) //nolint:errcheck
			c.Writer.Flush()

		case <-c.Request.Context().Done():
			return
		}
	}
}

// BroadcastCards is called after any card/topic mutation to push the updated
// state to all clients in the room.
func (h *Handler) BroadcastCards(tableID string, eventType string, payload interface{}) {
	data, err := json.Marshal(payload)
	if err != nil {
		return
	}
	h.hub.Broadcast(tableID, FormatEvent(eventType, data))
}
