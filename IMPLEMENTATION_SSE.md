# SSE Implementation — Replacing Socket.io

Guia para substituir o Socket.io por Server-Sent Events (SSE) no projeto Retro.

Stack: **Go + Gin** (backend) | **Next.js 14 + Zustand** (frontend)

---

## Visão Geral da Mudança

```
ANTES (Socket.io)
Cliente ──WS handshake──▶ Socket.io Server ──broadcast──▶ Todos os clientes

DEPOIS (SSE)
Cliente ──GET /stream──▶ Gin (conexão persistente)
Cliente ──POST/PATCH──▶ Gin ──persiste──▶ DB ──broadcast SSE──▶ Todos os clientes da sala
```

---

## Fluxo de Trabalho — TDD Obrigatório

> **Esta seção define o protocolo que o Claude deve seguir antes de qualquer implementação.**

### Regra geral

```
Escrever testes → Aprovação do usuário → Implementar → Testes passam → Próxima etapa
```

Nenhuma etapa de implementação pode ser iniciada sem que:
1. Os testes daquela etapa estejam escritos
2. O usuário tenha lido e aprovado explicitamente os testes
3. A implementação faça todos os testes passarem

### Protocolo por etapa

Para cada bloco de implementação abaixo (Hub, Handler, hook useSSE, etc.), o Claude deve:

**Passo 1 — Apresentar os testes**
- Escrever todos os testes da etapa em questão
- Explicar o que cada teste valida
- Pausar e aguardar resposta do usuário

**Passo 2 — Aguardar aprovação**
- O Claude só avança após uma confirmação explícita do usuário (ex: "ok", "aprovado", "pode seguir")
- Se o usuário pedir ajustes nos testes, aplicar e reapresentar antes de implementar

**Passo 3 — Implementar**
- Escrever o código de implementação
- Rodar os testes: `go test ./...` (backend) ou `npx vitest run` (frontend)
- Apresentar o output dos testes ao usuário

**Passo 4 — Confirmar conclusão**
- A etapa só é considerada concluída quando todos os testes passam
- Se algum teste falhar, corrigir a implementação e rodar novamente antes de avançar

### Etapas e seus testes

| Etapa | Arquivo de teste | Ferramenta |
|---|---|---|
| Hub SSE | `internal/infrastructure/sse/hub_test.go` | `go test` |
| Handler SSE | `internal/infrastructure/sse/handler_test.go` | `go test` + `httptest` |
| Broadcast em mutações | `internal/application/card/service_test.go` | `go test` |
| Hook useSSE | `src/hooks/useSSE.test.ts` | Vitest + `@testing-library/react` |
| Integração no board | `src/app/table/[id]/page.test.tsx` | Vitest + `@testing-library/react` |

### Ao final de todas as etapas

Após todos os testes passarem, o Claude deve atualizar o `README.md` do projeto, substituindo as referências ao Socket.io pela documentação do SSE. A seção exata a atualizar está descrita no final deste documento.

---

## 1. Backend (Go + Gin)

### 1.1 Remover dependência do Socket.io

```bash
cd server
go get -d github.com/googollee/go-socket.io  # remover do go.mod manualmente
go mod tidy
```

Remova o import e inicialização do socket.io em `main.go` ou onde estiver configurado.

---

### 1.2 Testes do Hub SSE

> **Apresentar ao usuário e aguardar aprovação antes de criar `hub.go`.**

Arquivo: `internal/infrastructure/sse/hub_test.go`

```go
package sse_test

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"your-module/internal/infrastructure/sse"
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
		t.Fatal("broadcast não entregou mensagem ao cliente")
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
		t.Fatal("cliente desregistrado recebeu mensagem")
	case <-time.After(100 * time.Millisecond):
		// correto — nenhuma mensagem entregue
	}
}

func TestHub_UnregisterEmptyRoomDeletesRoom(t *testing.T) {
	hub := sse.NewHub()
	client := &sse.Client{TableID: "table-x", Send: make(chan []byte, 4)}

	hub.Register("table-x", client)
	hub.Unregister("table-x", client)

	// Broadcast em sala vazia não deve panics
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
		t.Fatal("cliente de outra sala recebeu broadcast")
	case <-time.After(100 * time.Millisecond):
		// correto
	}

	select {
	case msg := <-c1.Send:
		assert.Equal(t, []byte("only-a"), msg)
	case <-time.After(time.Second):
		t.Fatal("cliente correto não recebeu o broadcast")
	}
}

func TestFormatEvent(t *testing.T) {
	result := sse.FormatEvent("cards:updated", []byte(`{"id":1}`))
	expected := "event: cards:updated\ndata: {\"id\":1}\n\n"
	assert.Equal(t, expected, string(result))
}
```

### 1.3 Criar o Hub SSE

Crie o arquivo `internal/infrastructure/sse/hub.go`:

```go
package sse

import (
	"fmt"
	"sync"
)

// Client representa uma conexão SSE ativa
type Client struct {
	TableID string
	Send    chan []byte
}

// Hub gerencia todas as conexões ativas por mesa
type Hub struct {
	mu      sync.RWMutex
	rooms   map[string]map[*Client]struct{}
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

// Broadcast envia o payload para todos os clientes de uma sala
func (h *Hub) Broadcast(tableID string, payload []byte) {
	h.mu.RLock()
	defer h.mu.RUnlock()
	for client := range h.rooms[tableID] {
		select {
		case client.Send <- payload:
		default:
			// canal cheio — descarta para não bloquear o broadcast
		}
	}
}

// FormatEvent formata o payload no protocolo SSE
func FormatEvent(eventType string, data []byte) []byte {
	return []byte(fmt.Sprintf("event: %s\ndata: %s\n\n", eventType, data))
}
```

---

### 1.4 Testes do Handler SSE

> **Apresentar ao usuário e aguardar aprovação antes de criar `handler.go`.**

Arquivo: `internal/infrastructure/sse/handler_test.go`

```go
package sse_test

import (
	"bufio"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"your-module/internal/infrastructure/sse"
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

	// Roda em goroutine pois o handler bloqueia até o cliente fechar
	done := make(chan struct{})
	go func() {
		r.ServeHTTP(w, req)
		close(done)
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
	ctx, cancel := req.Context(), func() {}
	req = req.WithContext(ctx)
	w := httptest.NewRecorder()

	received := make(chan string, 1)

	go func() {
		// Sobe o handler em background
		r.ServeHTTP(w, req)
	}()

	// Aguarda a conexão ser registrada
	time.Sleep(50 * time.Millisecond)

	// Dispara broadcast
	hub.Broadcast("table-2", sse.FormatEvent("cards:updated", []byte(`{"id":42}`)))

	time.Sleep(50 * time.Millisecond)

	body := w.Body.String()
	if strings.Contains(body, "cards:updated") {
		received <- body
	}

	cancel()

	select {
	case msg := <-received:
		assert.Contains(t, msg, "cards:updated")
		assert.Contains(t, msg, `"id":42`)
	case <-time.After(time.Second):
		t.Fatal("broadcast não foi recebido pelo handler")
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
		t.Fatal("BroadcastCards não enviou mensagem")
	}
}
```

### 1.5 Handler SSE no Gin

Crie `internal/infrastructure/sse/handler.go`:

```go
package sse

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	hub *Hub
}

func NewHandler(hub *Hub) *Handler {
	return &Handler{hub: hub}
}

// StreamHandler é o endpoint que o cliente conecta ao entrar na retro
// GET /api/tables/:tableId/stream
func (h *Handler) StreamHandler(c *gin.Context) {
	tableID := c.Param("tableId")

	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")
	c.Header("X-Accel-Buffering", "no") // necessário se usar Nginx como proxy

	client := &Client{
		TableID: tableID,
		Send:    make(chan []byte, 32),
	}

	h.hub.Register(tableID, client)
	defer h.hub.Unregister(tableID, client)

	// Envia evento de conexão confirmada
	c.SSEvent("connected", gin.H{"tableId": tableID})
	c.Writer.Flush()

	// Keepalive ticker para manter a conexão viva
	ticker := time.NewTicker(25 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case payload, ok := <-client.Send:
			if !ok {
				return
			}
			c.Writer.Write(payload)
			c.Writer.Flush()

		case <-ticker.C:
			// Keepalive — evita timeout de proxies/load balancers
			c.Writer.Write([]byte(": keepalive\n\n"))
			c.Writer.Flush()

		case <-c.Request.Context().Done():
			return
		}
	}
}

// BroadcastCards é chamado após qualquer mutação de card/topic
func (h *Handler) BroadcastCards(tableID string, eventType string, payload interface{}) {
	data, err := json.Marshal(payload)
	if err != nil {
		return
	}
	h.hub.Broadcast(tableID, FormatEvent(eventType, data))
}
```

---



Em `internal/infrastructure/http/router.go` (ou onde estão as rotas):

```go
import "your-module/internal/infrastructure/sse"

func SetupRouter(hub *sse.Hub) *gin.Engine {
	r := gin.Default()

	sseHandler := sse.NewHandler(hub)

	api := r.Group("/api")
	{
		tables := api.Group("/tables")
		{
			// ... suas rotas existentes ...

			// Nova rota SSE — aplicar o mesmo middleware de auth que você já usa
			tables.GET("/:tableId/stream", AuthMiddleware(), sseHandler.StreamHandler)
		}
	}

	return r
}
```

---



```go
import "your-module/internal/infrastructure/sse"

func main() {
	hub := sse.NewHub()

	// Injetar o hub nos handlers que precisam fazer broadcast
	// Ex: cardHandler := card.NewHandler(repo, hub)

	router := SetupRouter(hub)
	router.Run(":8080")
}
```

---



Em qualquer handler que modifica cards, topics ou votos, chame o broadcast após persistir:

```go
// Exemplo: após atualizar um card
func (h *CardHandler) UpdateCard(c *gin.Context) {
	tableID := c.Param("tableId")

	// ... lógica existente de update ...

	// Busca estado atualizado da mesa para enviar a todos
	cards, _ := h.repo.FindCardsByTable(tableID)

	// Broadcast para todos os clientes da sala
	h.sseHandler.BroadcastCards(tableID, "cards:updated", cards)

	c.JSON(http.StatusOK, updatedCard)
}
```

Eventos sugeridos:
| Evento | Quando disparar |
|---|---|
| `cards:updated` | card criado, editado, mergeado, deletado |
| `votes:updated` | voto adicionado ou removido |
| `topics:updated` | topic criado, editado, removido |
| `table:archived` | mesa arquivada |

---

## 2. Frontend (Next.js 14 + TypeScript + Zustand)

### 2.1 Remover o cliente Socket.io

```bash
cd client
npm uninstall socket.io-client
```

Remova todos os imports de `socket.io-client` e os hooks/providers relacionados.

---

### 2.2 Testes do Hook useSSE

> **Apresentar ao usuário e aguardar aprovação antes de criar `useSSE.ts`.**

Arquivo: `src/hooks/useSSE.test.ts`

```typescript
import { renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useSSE } from './useSSE'

// Mock do EventSource global
class MockEventSource {
  static instances: MockEventSource[] = []
  listeners: Record<string, ((e: MessageEvent) => void)[]> = {}
  onerror: ((e: Event) => void) | null = null
  closed = false

  constructor(public url: string, public init?: EventSourceInit) {
    MockEventSource.instances.push(this)
  }

  addEventListener(type: string, cb: (e: MessageEvent) => void) {
    if (!this.listeners[type]) this.listeners[type] = []
    this.listeners[type].push(cb)
  }

  emit(type: string, data: unknown) {
    const event = new MessageEvent(type, { data: JSON.stringify(data) })
    this.listeners[type]?.forEach((cb) => cb(event))
  }

  close() {
    this.closed = true
  }
}

beforeEach(() => {
  MockEventSource.instances = []
  vi.stubGlobal('EventSource', MockEventSource)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useSSE', () => {
  it('não cria EventSource se tableId for undefined', () => {
    renderHook(() => useSSE(undefined, { onMessage: vi.fn() }))
    expect(MockEventSource.instances).toHaveLength(0)
  })

  it('cria EventSource com a URL correta', () => {
    renderHook(() => useSSE('table-1', { onMessage: vi.fn() }))
    expect(MockEventSource.instances).toHaveLength(1)
    expect(MockEventSource.instances[0].url).toContain('/api/tables/table-1/stream')
  })

  it('inclui guest_token na URL quando fornecido', () => {
    renderHook(() =>
      useSSE('table-1', { onMessage: vi.fn(), guestToken: 'abc123' })
    )
    expect(MockEventSource.instances[0].url).toContain('guest_token=abc123')
  })

  it('chama onMessage com eventType e data corretos', () => {
    const onMessage = vi.fn()
    renderHook(() => useSSE('table-1', { onMessage }))

    const source = MockEventSource.instances[0]
    source.emit('cards:updated', [{ id: 1, text: 'card' }])

    expect(onMessage).toHaveBeenCalledWith('cards:updated', [{ id: 1, text: 'card' }])
  })

  it('registra listeners para todos os event types', () => {
    renderHook(() => useSSE('table-1', { onMessage: vi.fn() }))
    const source = MockEventSource.instances[0]
    const types = ['cards:updated', 'votes:updated', 'topics:updated', 'table:archived']
    types.forEach((t) => expect(source.listeners[t]).toBeDefined())
  })

  it('fecha o EventSource no cleanup', () => {
    const { unmount } = renderHook(() => useSSE('table-1', { onMessage: vi.fn() }))
    const source = MockEventSource.instances[0]
    unmount()
    expect(source.closed).toBe(true)
  })
})
```

### 2.3 Hook useSSE

Crie `src/hooks/useSSE.ts`:

```typescript
import { useEffect, useRef } from 'react'

type SSEOptions = {
  onMessage: (eventType: string, data: unknown) => void
  token?: string // JWT ou guest token para autenticação
  guestToken?: string
}

export function useSSE(tableId: string | undefined, options: SSEOptions) {
  const sourceRef = useRef<EventSource | null>(null)

  useEffect(() => {
    if (!tableId) return

    // Monta a URL com o token de autenticação como query param
    // (mesma lógica que você já usa para guest token na API)
    const params = new URLSearchParams()
    if (options.guestToken) params.set('guest_token', options.guestToken)

    const url = `${process.env.NEXT_PUBLIC_API_URL}/api/tables/${tableId}/stream?${params}`

    const source = new EventSource(url, {
      withCredentials: true, // envia cookies — usar se auth for via cookie
    })

    source.addEventListener('connected', () => {
      console.log(`[SSE] Conectado à sala ${tableId}`)
    })

    // Listeners para cada tipo de evento
    const eventTypes = ['cards:updated', 'votes:updated', 'topics:updated', 'table:archived']

    eventTypes.forEach((eventType) => {
      source.addEventListener(eventType, (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data)
          options.onMessage(eventType, data)
        } catch {
          console.error('[SSE] Erro ao parsear evento:', eventType)
        }
      })
    })

    source.onerror = (err) => {
      console.warn('[SSE] Conexão perdida, reconectando automaticamente...', err)
      // EventSource reconecta automaticamente — não é necessário intervir
    }

    sourceRef.current = source

    return () => {
      source.close()
      sourceRef.current = null
    }
  }, [tableId]) // eslint-disable-line react-hooks/exhaustive-deps
}
```

> **Nota sobre JWT:** `EventSource` não suporta headers customizados. Se sua auth é via Bearer token (não cookie), passe o token como query param e valide no middleware do Gin. Para produção, prefira auth via cookie HttpOnly.

---



Em `src/app/table/[id]/page.tsx` (ou o componente principal do board):

```typescript
'use client'

import { useSSE } from '@/hooks/useSSE'
import { useRetroStore } from '@/store/retroStore'
import { useGuestStore } from '@/store/guestStore'

export default function RetroBoard({ params }: { params: { id: string } }) {
  const { setCards, setTopics } = useRetroStore()
  const { guestToken } = useGuestStore()

  useSSE(params.id, {
    guestToken,
    onMessage: (eventType, data) => {
      switch (eventType) {
        case 'cards:updated':
          setCards(data as Card[])
          break
        case 'votes:updated':
          setCards(data as Card[]) // ou atualizar granularmente no store
          break
        case 'topics:updated':
          setTopics(data as Topic[])
          break
        case 'table:archived':
          // redirecionar ou setar modo read-only
          break
      }
    },
  })

  // ... resto do componente
}
```

---



O store não precisa mudar estruturalmente — só garantir que `setCards` e `setTopics` façam replace do estado completo:

```typescript
// src/store/retroStore.ts
import { create } from 'zustand'

interface RetroState {
  cards: Card[]
  topics: Topic[]
  setCards: (cards: Card[]) => void
  setTopics: (topics: Topic[]) => void
}

export const useRetroStore = create<RetroState>((set) => ({
  cards: [],
  topics: [],
  setCards: (cards) => set({ cards }),
  setTopics: (topics) => set({ topics }),
}))
```

---

## 3. Considerações de Autenticação SSE

O `EventSource` do browser não suporta headers customizados, então o Bearer token não pode ser enviado da forma padrão. Opções:

| Estratégia | Como implementar | Quando usar |
|---|---|---|
| Cookie HttpOnly | `withCredentials: true` no EventSource, auth via cookie no Gin | Recomendado para produção |
| Query param | `?token=xxx` na URL do stream | Simples, funciona para JWT e guest token |
| Middleware permissivo no stream | Aceitar auth alternativa só no endpoint `/stream` | Útil para manter consistência com o restante da API |

O projeto já usa guest token via query param na API — manter a mesma lógica no endpoint SSE é o caminho de menor fricção.

---

## 4. Impacto no Docker / Infraestrutura

Nenhuma alteração necessária no `docker-compose.yml`. O SSE trafega sobre HTTP/1.1 comum — sem portas extras, sem protocolos adicionais.

Se houver um proxy Nginx na frente, adicionar:

```nginx
location /api/tables/stream {
    proxy_pass http://backend:8080;
    proxy_buffering off;          # crítico para SSE funcionar
    proxy_cache off;
    proxy_set_header Connection '';
    proxy_http_version 1.1;
    chunked_transfer_encoding on;
}
```

---

## 5. Checklist de Migração

```
Testes — aprovação obrigatória antes de implementar
[ ] Testes do Hub apresentados e aprovados pelo usuário
[ ] Testes do Handler apresentados e aprovados pelo usuário
[ ] Testes do useSSE apresentados e aprovados pelo usuário

Backend
[ ] hub_test.go passando: go test ./internal/infrastructure/sse/...
[ ] Criar sse/hub.go
[ ] handler_test.go passando: go test ./internal/infrastructure/sse/...
[ ] Criar sse/handler.go
[ ] Registrar rota GET /api/tables/:tableId/stream
[ ] Injetar hub nos handlers de card, topic e vote
[ ] Disparar BroadcastCards após cada mutação
[ ] Todos os testes do backend passando: go test ./...
[ ] Remover inicialização e rotas do Socket.io
[ ] go mod tidy

Frontend
[ ] useSSE.test.ts passando: npx vitest run src/hooks/useSSE.test.ts
[ ] npm uninstall socket.io-client
[ ] Criar src/hooks/useSSE.ts
[ ] Integrar useSSE no componente do board
[ ] Garantir que setCards/setTopics no store fazem replace completo
[ ] Remover providers/contexts do Socket.io
[ ] Todos os testes do frontend passando: npx vitest run

Infra
[ ] Configurar proxy_buffering off no Nginx se aplicável
[ ] Testar reconexão automática (derrube o backend e suba novamente)

README — executar somente após todos os testes passarem
[ ] Atualizar README.md conforme seção abaixo
```

---

## 6. Atualização do README

> **Executar somente após todos os testes passarem e o usuário confirmar que a implementação está concluída.**

O Claude deve aplicar as seguintes alterações no `README.md`:

**Na seção `Architecture > Backend`**, substituir:
```
- **Socket.io** for real-time communication
```
por:
```
- **SSE (Server-Sent Events)** for real-time communication
```

**Na seção `Architecture > Frontend`** (se houver menção a socket.io-client), remover a linha correspondente.

**Adicionar nova subseção em `Development`** (após a descrição de Backend/Frontend):

```markdown
### Real-Time Communication (SSE)

The project uses **Server-Sent Events** instead of WebSockets for real-time board updates.

- **Endpoint**: `GET /api/tables/:tableId/stream`
- **Events**: `cards:updated`, `votes:updated`, `topics:updated`, `table:archived`
- **Client**: Native `EventSource` API wrapped in the `useSSE` hook
- **Auth**: Guest token passed as query param (`?guest_token=xxx`); authenticated users via cookie
- **Reconnection**: Handled automatically by the browser's `EventSource`
- **Keepalive**: Server sends a comment ping every 25 seconds to prevent proxy timeouts
```

**Remover** qualquer referência a `socket.io` nos comandos Docker ou variáveis de ambiente, se existirem.

Após aplicar as alterações, apresentar o diff ao usuário para revisão antes de salvar.
