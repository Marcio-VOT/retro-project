package sse_test

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"retro-project/server/internal/infrastructure/sse"
)

func setupRouter(hub *sse.Hub) *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	h := sse.NewHandler(hub)
	r.GET("/api/tables/:tableId/stream", h.StreamHandler)
	return r
}

func TestStreamHandler_SetsSSEHeaders(t *testing.T) {
	hub := sse.NewHub()
	r := setupRouter(hub)

	req := httptest.NewRequest(http.MethodGet, "/api/tables/table-1/stream", nil)
	w := httptest.NewRecorder()

	// Run in goroutine because handler blocks until client disconnects
	go func() {
		r.ServeHTTP(w, req)
	}()

	time.Sleep(50 * time.Millisecond)

	assert.Equal(t, "text/event-stream", w.Header().Get("Content-Type"))
	assert.Equal(t, "no-cache", w.Header().Get("Cache-Control"))
	assert.Equal(t, "keep-alive", w.Header().Get("Connection"))
}

func TestStreamHandler_ReceivesBroadcast(t *testing.T) {
	hub := sse.NewHub()
	r := setupRouter(hub)

	req := httptest.NewRequest(http.MethodGet, "/api/tables/table-2/stream", nil)
	w := httptest.NewRecorder()

	received := make(chan string, 1)

	go func() {
		r.ServeHTTP(w, req)
	}()

	// Wait for the connection to register
	time.Sleep(50 * time.Millisecond)

	// Fire broadcast
	hub.Broadcast("table-2", sse.FormatEvent("cards:updated", []byte(`{"id":42}`)))

	time.Sleep(50 * time.Millisecond)

	body := w.Body.String()
	if strings.Contains(body, "cards:updated") {
		received <- body
	}

	select {
	case msg := <-received:
		assert.Contains(t, msg, "cards:updated")
		assert.Contains(t, msg, `"id":42`)
	case <-time.After(time.Second):
		t.Fatal("broadcast was not received by the handler")
	}
}

func TestBroadcastCards_SerializesPayload(t *testing.T) {
	hub := sse.NewHub()
	handler := sse.NewHandler(hub)
	client := &sse.Client{TableID: "t1", Send: make(chan []byte, 4)}
	hub.Register("t1", client)

	type Card struct {
		ID   int    `json:"id"`
		Text string `json:"text"`
	}

	handler.BroadcastCards("t1", "cards:updated", Card{ID: 1, Text: "hello"})

	select {
	case msg := <-client.Send:
		s := string(msg)
		assert.Contains(t, s, "event: cards:updated")
		assert.Contains(t, s, `"id":1`)
		assert.Contains(t, s, `"text":"hello"`)
	case <-time.After(time.Second):
		t.Fatal("BroadcastCards did not send message")
	}
}
