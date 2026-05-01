# PROGRESS.md

## Status da Migração SSE

### Testes
- Backend: go test ./... — todos passando (hub + handler + blur + CloseAll)
- Frontend: npx vitest run — 19/19 passando

### Checklist de Tasks

#### Concluídas
- [x] Hub SSE (hub.go) — testes aprovados e implementado
- [x] Handler SSE (handler.go) — testes aprovados e implementado
- [x] Hook useSSE (useSSE.ts) — testes aprovados e implementado
- [x] Integração no board (page.tsx) — testes aprovados e implementado
- [x] Rota GET /api/tables/:tableId/stream registrada no servidor
- [x] BroadcastCards wired em todos os handlers de mutação (cards, votes, topics, blur, archive)
- [x] Socket.io removido do backend e frontend
- [x] Optimistic updates removidos (cards, votes, delete, merge)
- [x] Blur de cards movido para nível de tabela (cards_blurred em retro_tables)
- [x] SSE confirmado funcionando no browser (dois usuários em tempo real)
- [x] Graceful shutdown com hub.CloseAll() antes de srv.Shutdown()
- [x] TASK 1 — Blur/show cards sincronizado via SSE (board-wide, persiste no banco)
- [x] TASK 2 — Botão de deletar card em todos os modos de display (list, grid, rows)

#### Pendentes
- [x] TASK 3 — Drag and drop para merge no modo "rows with icons"
- [ ] TASK 4 — Arrastar card para coluna diferente no grid view muda o topic (categoryId)
- [ ] TASK 5 — README atualizado conforme seção 6 do IMPLEMENTATION_SSE.md

### Onde Parou
TASK 4 — arrastar card para coluna diferente no grid view deve mudar o categoryId do card.
Próximo passo: escrever os testes da TASK 4 e apresentar para aprovação antes de implementar.

### Arquivos Relevantes
- IMPLEMENTATION_SSE.md — plano completo com specs de testes
- CLAUDE.md — arquitetura, padrões e gotchas
- server/internal/infrastructure/sse/hub.go — Hub SSE
- server/internal/infrastructure/sse/handler.go — Handler SSE
- client/src/hooks/useSSE.ts — hook do EventSource
- client/src/app/table/[id]/page.tsx — integração no board
- client/src/app/api/ — removido (API Route do Next.js não funciona para SSE em dev)
