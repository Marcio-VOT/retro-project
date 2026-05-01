# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A real-time retrospective board application with a **Next.js 14 frontend** and a **Go backend** using hexagonal architecture. Features include real-time collaboration via SSE (Server-Sent Events), guest access with signed invite URLs, and a 5-state authentication system.

> **Active migration**: Socket.io is being replaced by SSE. See `IMPLEMENTATION_SSE.md` at the root for the full plan, test specs, and checklist. Do not add new Socket.io dependencies or usage.

## Commands

### Full Stack (Docker)
```bash
docker-compose up -d          # Start all services (postgres, redis, backend, frontend, pgadmin)
docker-compose down           # Stop all services
./setup.sh                    # First-time setup: starts docker, runs migrations, installs deps
```

### Backend (Go)
```bash
cd server
go run cmd/server/main.go     # Run the HTTP server (port 8080)
go run cmd/migrate/main.go    # Run database migrations
go mod tidy                   # Sync dependencies
go build ./...                # Build all packages
go test ./...                 # Run all tests
go test ./internal/...        # Run tests for a specific package
go test ./internal/infrastructure/sse/...  # Run SSE-specific tests
```

### Frontend (Next.js)
```bash
cd client
npm install                   # Install dependencies
npm run dev                   # Dev server (port 3000)
npm run build                 # Production build
npm run lint                  # ESLint check
npx vitest run                # Run all tests
npx vitest run src/hooks/useSSE.test.ts   # Run a specific test file
npx vitest --coverage         # Run tests with coverage report
```

### Backend-only or Frontend-only Docker
```bash
cd server && docker-compose up -d    # Backend + postgres + redis + pgadmin
cd client && docker-compose up -d    # Frontend only
```

## Development Workflow

### TDD Protocol

All non-trivial changes follow this sequence — no exceptions:

1. **Write tests first** and present them to the user with a brief explanation of what each test validates
2. **Wait for explicit user approval** before writing any implementation code
3. **Implement** until all tests pass
4. **Show test output** (`go test ./...` or `npx vitest run`) before marking the task done

Never skip to implementation. If the user asks to "just write the code", acknowledge and still present tests first.

### Definition of Done

A task is only considered complete when:
- All tests pass (no skipped or commented-out tests)
- `README.md` is updated if any public-facing behavior changed
- `CLAUDE.md` is updated if any architecture decision, pattern, or constraint changed

### Adding a mutation that requires real-time broadcast

Every handler that modifies cards, topics, or votes must call `BroadcastCards` after persisting. Pattern:

```go
func (h *CardHandler) UpdateCard(c *gin.Context) {
    tableID := c.Param("tableId")
    // 1. persist change
    // 2. fetch updated state
    cards, _ := h.repo.FindCardsByTable(tableID)
    // 3. broadcast to all clients in the room
    h.sseHandler.BroadcastCards(tableID, "cards:updated", cards)
    c.JSON(http.StatusOK, updatedCard)
}
```

SSE event types: `cards:updated`, `votes:updated`, `topics:updated`, `table:archived`.

Failing to call `BroadcastCards` breaks real-time for all clients silently — there is no compile-time or runtime error.

## Architecture

### Backend — Hexagonal (Ports & Adapters)

```
server/
├── cmd/server/main.go        # Entry point: config → database → HTTP server → graceful shutdown
├── cmd/migrate/main.go       # Standalone migration runner
└── internal/
    ├── domain/entities/      # Core business entities: user.go, team.go, retro.go
    ├── ports/                # Interface definitions: repositories.go, services.go
    ├── adapters/             # Implementations of port interfaces
    └── infrastructure/
        ├── config/           # Viper-based config from env vars
        ├── database/         # GORM + PostgreSQL connection
        ├── jwt/              # JWT token generation and middleware
        ├── logger/           # Structured logging (zap)
        ├── server/           # Gin HTTP server, middleware, auth.go, tables.go
        └── sse/              # SSE hub (room management) and Gin stream handler
```

Domain entities are pure Go structs with no framework dependencies. Ports define interfaces; adapters implement them. The infrastructure layer wires everything together.

#### Where to add things

| What | Where |
|---|---|
| New business rule | `internal/domain/entities/` or `internal/ports/` |
| New DB query or cache call | `internal/adapters/` |
| New HTTP handler or middleware | `internal/infrastructure/server/` |
| New real-time concern | `internal/infrastructure/sse/` |

Never put business logic directly in Gin handlers.

### Frontend — Next.js 14 App Router

```
client/src/
├── app/                      # App Router pages
│   ├── layout.tsx            # Root layout: ThemeProvider + AuthProvider + Header
│   ├── auth/{login,register}/
│   ├── home/                 # Dashboard (authenticated users)
│   └── table/[id]/           # Retro board (dynamic route)
├── components/
│   ├── ui/                   # shadcn/ui base components
│   └── retro/                # Retro board-specific components
├── hooks/
│   ├── use-api.ts            # API integration hooks
│   └── useSSE.ts             # SSE hook — wraps EventSource, manages listeners and cleanup
├── stores/
│   ├── auth-store.ts         # Zustand auth state (persisted to localStorage)
│   └── guest-store.ts        # Zustand guest token state
├── config/env.ts             # Environment variable accessors
└── types/                    # Shared TypeScript types
```

State management uses **Zustand** with localStorage persistence. The `AuthProvider` component initializes auth state on mount by calling `checkAuth()`.

### API Routing

`next.config.js` rewrites `/api/:path*` → `http://127.0.0.1:8080/api/:path*` in development. The frontend never calls the backend directly — all requests go through this Next.js rewrite. This rewrite also covers the SSE stream endpoint.

### Authentication Flow

5-state auth model: `unauthenticated` → `loading` → `authenticated` | `guest` | `error`. Guest users get signed invite tokens for specific retro boards and can participate without accounts.

## Gotchas & Constraints

### SSE Authentication
`EventSource` does not support custom headers — Bearer tokens cannot be sent the standard way. Auth strategy for the `/stream` endpoint:
- **Authenticated users**: cookie-based (`withCredentials: true`)
- **Guest users**: `?guest_token=xxx` query param (same pattern already used elsewhere in the API)

Never attempt to inject an `Authorization` header into `EventSource` — it silently fails in all browsers.

### SSE + Proxy Buffering
If any buffering proxy (Nginx, load balancer) sits in front of the backend, it must be configured with:
```nginx
proxy_buffering off;
proxy_cache off;
proxy_set_header Connection '';
proxy_http_version 1.1;
```
Without this, SSE events are held in the buffer — clients see no real-time updates and no error is thrown.

### SSE Reconnection and State Sync
`EventSource` reconnects automatically on drop. On reconnection, the server does not replay missed events. The `StreamHandler` must send the current board state as the first event immediately after a client connects to prevent stale UI after a reconnect.

### Guest Token Scope
Guest tokens are scoped to a specific table. A guest with a token for `table-A` cannot access `table-B` even with a valid token format. The middleware validates both token authenticity and table binding.

### Frontend Tests
The frontend currently has no test suite — tests are being added as part of the SSE migration. Use **Vitest** + `@testing-library/react`. When writing tests for hooks that use `EventSource`, mock it globally in `beforeEach`:

```typescript
class MockEventSource {
  listeners: Record<string, ((e: MessageEvent) => void)[]> = {}
  constructor(public url: string, public init?: EventSourceInit) {}
  addEventListener(type: string, cb: (e: MessageEvent) => void) {
    if (!this.listeners[type]) this.listeners[type] = []
    this.listeners[type].push(cb)
  }
  emit(type: string, data: unknown) {
    const event = new MessageEvent(type, { data: JSON.stringify(data) })
    this.listeners[type]?.forEach((cb) => cb(event))
  }
  close() {}
}

beforeEach(() => vi.stubGlobal('EventSource', MockEventSource))
afterEach(() => vi.unstubAllGlobals())
```

## Quick Reference — Key Files by Task

| Task | Files |
|---|---|
| Add/edit a retro card | `internal/infrastructure/server/tables.go`, `internal/domain/entities/retro.go` |
| Add a new SSE event | `internal/infrastructure/sse/hub.go`, `internal/infrastructure/sse/handler.go` |
| Change auth logic | `internal/infrastructure/jwt/`, `internal/infrastructure/server/auth.go` |
| Change guest permissions | `internal/infrastructure/server/auth.go`, `client/src/stores/guest-store.ts` |
| Add a frontend page | `client/src/app/` (App Router — use `page.tsx` convention) |
| Change real-time behavior | `client/src/hooks/useSSE.ts`, `internal/infrastructure/sse/handler.go` |
| Change env config | `internal/infrastructure/config/` (backend), `client/src/config/env.ts` (frontend) |
| Run migrations | `go run cmd/migrate/main.go` or `docker-compose exec backend go run cmd/migrate/main.go` |

## Services & Ports

| Service    | Port | Notes                        |
|------------|------|------------------------------|
| Frontend   | 3000 | Next.js                      |
| Backend    | 8080 | Gin HTTP + SSE               |
| PostgreSQL | 5432 | Primary database             |
| Redis      | 6379 | Caching / sessions           |
| pgAdmin    | 5050 | admin@retro.com / admin      |

## Key Tech

- **Backend**: Go 1.21, Gin, GORM, PostgreSQL, Redis, JWT (golang-jwt/jwt v5), SSE (native), zap logging
- **Frontend**: Next.js 14, TypeScript (strict mode), Tailwind CSS, shadcn/ui + Radix UI, Zustand, @dnd-kit, zod + react-hook-form
- **Testing**: `go test` + testify (backend), Vitest + @testing-library/react (frontend)