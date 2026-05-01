package server_test

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	server "retro-project/server/internal/infrastructure/server"
)

// setupBlurRouter builds a minimal Gin router that wires the BlurCards handler.
// The middleware func injects user_id into the context before the handler runs.
func setupBlurRouter(h *server.TableHandler, middleware gin.HandlerFunc) *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	if middleware != nil {
		r.PATCH("/api/tables/:tableId/cards/blur", middleware, h.BlurCards)
	} else {
		r.PATCH("/api/tables/:tableId/cards/blur", h.BlurCards)
	}
	return r
}

func TestBlurCards_MissingUserID_Returns401(t *testing.T) {
	h := &server.TableHandler{}
	r := setupBlurRouter(h, nil) // no middleware → user_id not set in context

	req := httptest.NewRequest(http.MethodPatch, "/api/tables/some-table-id/cards/blur", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

func TestBlurCards_InvalidTableID_Returns400(t *testing.T) {
	h := &server.TableHandler{}
	injectUser := func(c *gin.Context) {
		c.Set("user_id", "9a4c6d3e-1b2a-4f8e-9c7d-5e6f7a8b9c0d")
		c.Next()
	}
	r := setupBlurRouter(h, injectUser)

	req := httptest.NewRequest(http.MethodPatch, "/api/tables/not-a-valid-uuid/cards/blur", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestTableResponse_HasCardsBlurredField(t *testing.T) {
	tr := server.TableResponse{CardsBlurred: true}
	assert.True(t, tr.CardsBlurred)

	tr2 := server.TableResponse{CardsBlurred: false}
	assert.False(t, tr2.CardsBlurred)
}
