package sse

import (
	"fmt"
	"sync"
)

// Client represents an active SSE connection
type Client struct {
	TableID string
	Send    chan []byte
}

// Hub manages all active connections per table
type Hub struct {
	mu    sync.RWMutex
	rooms map[string]map[*Client]struct{}
}

func NewHub() *Hub {
	return &Hub{
		rooms: make(map[string]map[*Client]struct{}),
	}
}

func (h *Hub) Register(tableID string, client *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if h.rooms[tableID] == nil {
		h.rooms[tableID] = make(map[*Client]struct{})
	}
	h.rooms[tableID][client] = struct{}{}
}

func (h *Hub) Unregister(tableID string, client *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if room, ok := h.rooms[tableID]; ok {
		delete(room, client)
		if len(room) == 0 {
			delete(h.rooms, tableID)
		}
	}
}

// Broadcast sends the payload to all clients in a room
func (h *Hub) Broadcast(tableID string, payload []byte) {
	h.mu.RLock()
	defer h.mu.RUnlock()
	for client := range h.rooms[tableID] {
		select {
		case client.Send <- payload:
		default:
			// channel full — drop to avoid blocking broadcast
		}
	}
}

// CloseAll closes every client channel and clears all rooms.
// Call this during graceful shutdown so SSE handlers unblock immediately.
func (h *Hub) CloseAll() {
	h.mu.Lock()
	defer h.mu.Unlock()
	for _, clients := range h.rooms {
		for client := range clients {
			close(client.Send)
		}
	}
	h.rooms = make(map[string]map[*Client]struct{})
}

// FormatEvent formats the payload in SSE wire protocol
func FormatEvent(eventType string, data []byte) []byte {
	return []byte(fmt.Sprintf("event: %s\ndata: %s\n\n", eventType, data))
}
