package sse_test

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"retro-project/server/internal/infrastructure/sse"
)

func TestHub_RegisterAndBroadcast(t *testing.T) {
	hub := sse.NewHub()
	client := &sse.Client{TableID: "table-1", Send: make(chan []byte, 4)}

	hub.Register("table-1", client)
	hub.Broadcast("table-1", []byte("hello"))

	select {
	case msg := <-client.Send:
		assert.Equal(t, []byte("hello"), msg)
	case <-time.After(time.Second):
		t.Fatal("broadcast did not deliver message to client")
	}
}

func TestHub_UnregisterRemovesClient(t *testing.T) {
	hub := sse.NewHub()
	client := &sse.Client{TableID: "table-1", Send: make(chan []byte, 4)}

	hub.Register("table-1", client)
	hub.Unregister("table-1", client)
	hub.Broadcast("table-1", []byte("should not arrive"))

	select {
	case <-client.Send:
		t.Fatal("unregistered client received a message")
	case <-time.After(100 * time.Millisecond):
		// correct — no message delivered
	}
}

func TestHub_UnregisterEmptyRoomDeletesRoom(t *testing.T) {
	hub := sse.NewHub()
	client := &sse.Client{TableID: "table-x", Send: make(chan []byte, 4)}

	hub.Register("table-x", client)
	hub.Unregister("table-x", client)

	// Broadcast to empty room must not panic
	assert.NotPanics(t, func() {
		hub.Broadcast("table-x", []byte("noop"))
	})
}

func TestHub_IsolatesBroadcastByRoom(t *testing.T) {
	hub := sse.NewHub()
	c1 := &sse.Client{TableID: "room-a", Send: make(chan []byte, 4)}
	c2 := &sse.Client{TableID: "room-b", Send: make(chan []byte, 4)}

	hub.Register("room-a", c1)
	hub.Register("room-b", c2)
	hub.Broadcast("room-a", []byte("only-a"))

	select {
	case <-c2.Send:
		t.Fatal("client in another room received the broadcast")
	case <-time.After(100 * time.Millisecond):
		// correct
	}

	select {
	case msg := <-c1.Send:
		assert.Equal(t, []byte("only-a"), msg)
	case <-time.After(time.Second):
		t.Fatal("correct client did not receive broadcast")
	}
}

func TestHub_CloseAll(t *testing.T) {
	hub := sse.NewHub()
	c1 := &sse.Client{TableID: "t1", Send: make(chan []byte, 4)}
	c2 := &sse.Client{TableID: "t2", Send: make(chan []byte, 4)}
	hub.Register("t1", c1)
	hub.Register("t2", c2)

	hub.CloseAll()

	_, ok1 := <-c1.Send
	_, ok2 := <-c2.Send
	assert.False(t, ok1, "canal c1 deve estar fechado")
	assert.False(t, ok2, "canal c2 deve estar fechado")

	assert.NotPanics(t, func() {
		hub.Broadcast("t1", []byte("noop"))
	})
}

func TestFormatEvent(t *testing.T) {
	result := sse.FormatEvent("cards:updated", []byte(`{"id":1}`))
	expected := "event: cards:updated\ndata: {\"id\":1}\n\n"
	assert.Equal(t, expected, string(result))
}
