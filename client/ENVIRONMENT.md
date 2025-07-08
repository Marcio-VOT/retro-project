# Environment Configuration

This project uses a centralized environment configuration system with sensible defaults.

## Configuration File

The main configuration is in `src/config/env.ts` which provides:

- **Type-safe environment access**
- **Default values for all environments**
- **Helper functions and constants**

## Environment Variables

### Required (with defaults)

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `/api` | API base URL (uses Next.js rewrites) |
| `NEXT_PUBLIC_SOCKET_URL` | `http://localhost:8080` | Socket.IO server URL |
| `NEXT_PUBLIC_APP_NAME` | `Retro` | Application name |
| `NEXT_PUBLIC_APP_VERSION` | `1.0.0` | Application version |
| `NEXT_PUBLIC_ENVIRONMENT` | `development` | Environment name |

### Optional

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_ENABLE_ANALYTICS` | `false` | Enable analytics |
| `NEXT_PUBLIC_ENABLE_DEBUG` | `true` in dev | Enable debug mode |

## Usage

### In Components/Hooks

```typescript
import { env } from '@/config/env'

// Access configuration
const apiUrl = env.API_URL
const isDev = env.ENVIRONMENT === 'development'
```

### Environment Helpers

```typescript
import { isDevelopment, isProduction, isTest } from '@/config/env'

if (isDevelopment) {
  console.log('Debug info')
}
```

## Setup

### Development

Create a `.env.local` file in the client directory:

```bash
# API Configuration
NEXT_PUBLIC_API_URL=/api

# Socket.IO Configuration  
NEXT_PUBLIC_SOCKET_URL=http://localhost:8080

# App Configuration
NEXT_PUBLIC_APP_NAME=Retro
NEXT_PUBLIC_APP_VERSION=1.0.0

# Environment
NEXT_PUBLIC_ENVIRONMENT=development
```

### Production

Set environment variables in your deployment platform:

```bash
NEXT_PUBLIC_API_URL=https://your-api.com/api
NEXT_PUBLIC_SOCKET_URL=https://your-api.com
NEXT_PUBLIC_ENVIRONMENT=production
```

### Docker

The project includes Docker configuration with environment variable support.

#### Using Docker Compose

1. **Create `.env` file** in the project root:

```bash
# API Configuration
NEXT_PUBLIC_API_URL=/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:8080

# App Configuration
NEXT_PUBLIC_APP_NAME=Retro
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_ENVIRONMENT=production

# Feature flags
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_ENABLE_DEBUG=false
```

2. **Run with Docker Compose**:

```bash
# Start all services
docker-compose up -d

# Start only frontend
docker-compose up frontend
```

#### Environment Variable Overrides

You can override any environment variable when running Docker:

```bash
# Override specific variables
NEXT_PUBLIC_ENVIRONMENT=development docker-compose up frontend

# Or set in .env file
echo "NEXT_PUBLIC_ENVIRONMENT=development" >> .env
docker-compose up frontend
```

#### Docker Configuration Files

- `docker-compose.yml` - Main orchestration with environment variables
- `client/docker-compose.yml` - Frontend-only setup
- `client/Dockerfile` - Frontend container build

## Next.js Rewrites

The project uses Next.js rewrites to proxy API calls:

```javascript
// next.config.js
{
  source: '/api/:path*',
  destination: 'http://localhost:8080/api/:path*',
}
```

This means:
- Development: `/api/*` → `http://localhost:8080/api/*`
- Production: Set `NEXT_PUBLIC_API_URL` to your actual API URL
- Docker: Uses environment variables with sensible defaults 