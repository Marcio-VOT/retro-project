# Retro Project

A professional-grade retro web application for development teams to conduct effective retrospectives with real-time collaboration, featuring comprehensive guest access and secure invite management.

## Architecture

### Backend (Go)
- **Hexagonal Architecture** with clean separation of concerns
- **Gin** for HTTP routing
- **GORM** for database operations
- **Socket.io** for real-time communication
- **PostgreSQL** for data persistence
- **Redis** for caching and sessions

### Frontend (Modern React)
- **Next.js 14**: Latest features with App Router
- **TypeScript**: Strict configuration for type safety
- **Tailwind CSS**: Utility-first styling
- **shadcn/ui**: Professional component library
- **Drag & Drop**: @dnd-kit for smooth interactions
- **State Management**: Efficient state updates with Zustand
- **Authentication Flow**: State-based authentication with comprehensive guest support

## Quick Start

### Prerequisites
- Go 1.21+
- Node.js 23+
- Docker & Docker Compose
- PostgreSQL
- Redis

### Development Setup

1. **Clone and setup**
```bash
git clone <repository>
cd retro-project
```

2. **Start infrastructure**
```bash
docker-compose up -d
```

3. **Backend setup**
```bash
cd server
go mod tidy
go run cmd/server/main.go
```

4. **Frontend setup**
```bash
cd client
npm install
npm run dev
```

5. **Database migrations**
```bash
cd server
go run cmd/migrate/main.go
```

## Docker Setup

The project includes comprehensive Docker support with separate configurations for different deployment scenarios.

### 🐳 **Docker Architecture**

```
retro-project/
├── docker-compose.yml          # Main orchestrator (all services)
├── server/
│   ├── docker-compose.yml      # Backend + Database only
│   └── Dockerfile              # Go backend container
└── client/
    ├── docker-compose.yml      # Frontend only
    └── Dockerfile              # Next.js frontend container
```

### 🚀 **Quick Docker Start**

```bash
# Start everything (recommended for development)
docker-compose up -d

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8080
# pgAdmin: http://localhost:5050 (admin@retro.com / admin)
```

### 🔧 **Individual Service Deployment**

#### **Backend + Database Only**
```bash
cd server
docker-compose up -d

# Services available:
# - PostgreSQL: localhost:5432
# - Redis: localhost:6379
# - Backend API: localhost:8080
# - pgAdmin: localhost:5050
```

#### **Frontend Only**
```bash
cd client
docker-compose up -d

# Service available:
# - Next.js Frontend: localhost:3000
```

### 📋 **Docker Services**

#### **Main Stack (`docker-compose.yml`)**
- **postgres**: PostgreSQL 15 with health checks
- **redis**: Redis 7 with health checks
- **backend**: Go server with GORM + Gin
- **frontend**: Next.js 14 with standalone output
- **pgadmin**: Database management UI

#### **Backend Stack (`server/docker-compose.yml`)**
- **postgres**: PostgreSQL 15
- **redis**: Redis 7
- **backend**: Go server
- **pgadmin**: Database management

#### **Frontend Stack (`client/docker-compose.yml`)**
- **frontend**: Next.js application

### 🛠 **Docker Features**

#### **Security**
- ✅ Non-root users for all containers
- ✅ Multi-stage builds for smaller images
- ✅ Health checks for all services
- ✅ Proper service isolation

#### **Development**
- ✅ Volume mounts for hot reload
- ✅ Environment variable support
- ✅ Service dependencies with health checks
- ✅ Restart policies for reliability

#### **Production Ready**
- ✅ Optimized multi-stage builds
- ✅ Standalone Next.js output
- ✅ Alpine Linux base images
- ✅ Proper signal handling

### 🔍 **Docker Commands**

```bash
# Build and start all services
docker-compose up -d --build

# View logs
docker-compose logs -f [service_name]

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# Rebuild specific service
docker-compose build [service_name]

# Execute commands in containers
docker-compose exec backend ./main
docker-compose exec frontend npm run build

# View running containers
docker-compose ps
```

### 🌐 **Service URLs**

| Service | URL | Credentials |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | - |
| Backend API | http://localhost:8080 | - |
| pgAdmin | http://localhost:5050 | admin@retro.com / admin |
| PostgreSQL | localhost:5432 | retro_user / retro_password |
| Redis | localhost:6379 | - |

### 🔧 **Environment Variables**

#### **Backend Environment**
```bash
GIN_MODE=release
DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_USER=retro_user
DATABASE_PASSWORD=retro_password
DATABASE_NAME=retro_db
REDIS_HOST=redis
REDIS_PORT=6379
```

#### **Frontend Environment**
```bash
NODE_ENV=production
NEXT_PUBLIC_API_URL=http://localhost:8080
```

### 📊 **Health Checks**

All services include health checks:
- **PostgreSQL**: `pg_isready` command
- **Redis**: `redis-cli ping` command
- **Frontend**: HTTP health endpoint
- **Backend**: Built-in health endpoint

### 🚀 **Deployment Options**

#### **Development**
```bash
# Full stack with hot reload
docker-compose up -d
```

#### **Production**
```bash
# Build optimized images
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

#### **Staging**
```bash
# Use staging configuration
docker-compose -f docker-compose.yml -f docker-compose.staging.yml up -d
```

### 🔄 **Database Migrations**

```bash
# Run migrations in container
docker-compose exec backend go run cmd/migrate/main.go

# Or run locally
cd server
go run cmd/migrate/main.go
```

### 🐛 **Troubleshooting**

#### **Common Issues**
```bash
# Clear all containers and volumes
docker-compose down -v
docker system prune -a

# Rebuild from scratch
docker-compose build --no-cache
docker-compose up -d

# Check service logs
docker-compose logs [service_name]

# Access container shell
docker-compose exec [service_name] sh
```

#### **Port Conflicts**
If ports are already in use, modify the port mappings in the respective `docker-compose.yml` files.

#### **Database Connection Issues**
Ensure the database service is healthy before starting the backend:
```bash
docker-compose logs postgres
docker-compose exec postgres pg_isready -U retro_user -d retro_db
```

## Project Structure

```
retro-project/
├── client/                     # Next.js frontend
│   ├── src/
│   │   ├── app/               # App Router pages
│   │   │   ├── auth/          # Authentication pages
│   │   │   │   ├── login/     # Login page with invite support
│   │   │   │   └── register/  # Register page with invite support
│   │   │   ├── home/          # Dashboard page with guest support
│   │   │   ├── table/[id]/    # Retro board page with guest access
│   │   │   └── globals.css    # Global styles
│   │   ├── components/        # Compound components
│   │   │   ├── ui/            # Base UI components
│   │   │   │   ├── button.tsx
│   │   │   │   ├── card.tsx
│   │   │   │   ├── dialog.tsx
│   │   │   │   ├── popover.tsx
│   │   │   │   ├── color-picker.tsx
│   │   │   │   ├── label.tsx
│   │   │   │   └── ...
│   │   │   ├── retro/         # Retro-specific components
│   │   │   ├── create-table-modal.tsx
│   │   │   ├── guest-join-modal.tsx
│   │   │   ├── share-modal.tsx
│   │   │   ├── protected-route.tsx
│   │   │   ├── theme-provider.tsx
│   │   │   └── theme-toggle.tsx
│   │   ├── hooks/             # Custom hooks
│   │   │   ├── use-socket.ts
│   │   │   └── use-api.ts     # API hooks with guest support
│   │   ├── lib/               # Utilities
│   │   ├── stores/            # Zustand stores
│   │   │   ├── auth-store.ts
│   │   │   └── guest-store.ts # Guest state management
│   │   └── types/             # TypeScript types
├── server/                     # Go backend (Hexagonal)
│   ├── cmd/                   # Application entry points
│   ├── internal/              # Private application code
│   │   ├── domain/            # Business logic & entities
│   │   ├── ports/             # Interfaces (input/output)
│   │   ├── adapters/          # External implementations
│   │   └── infrastructure/    # Framework & external concerns
│   └── pkg/                   # Public packages
├── docker-compose.yml         # Development environment
└── README.md
```

## Features

### 🔐 **Authentication & Authorization**
- **State-Based Authentication**: Comprehensive auth flow with 5 distinct states
- **Guest Access System**: Anonymous participation with secure token management
- **Signed Invite Links**: Secure, time-limited invite URLs with backend validation
- **Login/Register with Invite Support**: Seamless auth flow preserving invite context
- **JWT-based Authentication**: Secure token-based authentication
- **Protected Routes**: Automatic redirects with guest support
- **Flexible Backend Middleware**: Supports JWT, guest tokens, and invite tokens

### 👥 **Guest System**
- **Guest Participation**: Anonymous users can participate in retrospectives
- **Guest Token Management**: Secure local storage of guest sessions
- **Guest Choice Modal**: Option to continue as guest or create/login to account
- **Guest Navigation**: Full navigation experience including home page access
- **Guest Limitations**: Anonymous posting, no table creation, owner restrictions
- **Guest Table Access**: View and participate in invited retrospectives

### 🔗 **Invite Management**
- **Signed Invite URLs**: Secure, tamper-proof invite links
- **Invite Validation**: Backend validation of invite tokens
- **Token Preservation**: Invite tokens preserved through authentication flow
- **Smart Redirects**: Users redirected to correct tables after auth
- **Share Functionality**: Table owners can generate secure invite links
- **Guest Linking**: Existing guests can be linked to new tables via invites

### 🏠 **Dashboard & Navigation**
- **Home Dashboard**: Overview of retrospectives with guest support
- **Guest-Specific Content**: Different UI for guests vs authenticated users
- **Clickable Table Cards**: Link to individual boards
- **Create Table Functionality**: Modal with validation (owners only)
- **Responsive Navigation**: Theme toggle and user status display
- **Guest Mode Indicators**: Clear visual indicators for guest users

### 📋 **Retro Board Management**
- **Dynamic Topic System**: Create, edit, and remove topics with custom colors
- **Color Picker**: 12 predefined colors + custom hex color support
- **Topic Validation**: Duplicate name prevention
- **Owner Controls**: Only table owners can manage topics, archive tables, share
- **"All Topics" View**: See all cards across categories
- **Guest Access Control**: Guests can view and participate but not manage

### 🎯 **Card System**
- **Add Cards**: Anonymous or named feedback submission
- **Guest Anonymous Enforcement**: Guests must post anonymously
- **Category Assignment**: Assign cards to specific topics
- **Real-time Updates**: Live card creation and updates
- **Content Merging**: Drag and drop to merge cards with visual separators
- **Vote System**: Like/unlike cards with loading states and optimistic updates
- **Owner-Only Actions**: Only owners can delete cards and merge cards
- **Mobile Drag & Drop**: Optimized touch handling with proper activation constraints

### 🎨 **Visual Features**
- **Card Blurring**: Owner can hide/show card content during retrospectives
- **Color-coded Topics**: Each topic has its own color theme
- **Drag & Drop**: Intuitive card merging with visual feedback (owners only)
- **Loading States**: Spinners and disabled states for all interactions
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Guest Badges**: Visual indicators for guest-accessible content

### 📊 **Archive System**
- **Table Archiving**: Convert active tables to read-only archived state
- **State Management**: Automatic UI updates when archiving
- **Read-only Mode**: Disabled interactions for archived tables
- **Visual Indicators**: Clear archive status and restrictions
- **Owner-Only**: Only table owners can archive tables

### 🌙 **Theme System**
- **Dark/Light Mode**: Complete theme support
- **System Preference**: Automatic theme detection
- **Manual Toggle**: User-controlled theme switching
- **Persistent Settings**: Theme preference saved across sessions

### ⚡ **Real-time Features**
- **Socket.io Integration**: Ready for real-time collaboration
- **Optimistic Updates**: Immediate UI feedback
- **Error Handling**: Graceful fallbacks and retry mechanisms
- **Loading States**: Visual feedback for all async operations

## Recent Major Updates

### 👥 **Guest System & Invite Management** (Latest)
- ✅ **Guest Access System**: Complete anonymous participation with token management
- ✅ **Signed Invite Links**: Secure, validated invite URLs with backend integration
- ✅ **Guest Choice Modal**: Login/register/continue as guest options
- ✅ **Invite Token Preservation**: Seamless auth flow maintaining invite context
- ✅ **Guest Navigation**: Full navigation experience including home page access
- ✅ **Guest Store**: Comprehensive guest state management with persistence
- ✅ **Guest Permissions**: Appropriate restrictions and owner-only controls

### 🔐 **Enhanced Authentication**
- ✅ **State-Based ProtectedRoute**: Handles authenticated users, guests, and invite scenarios
- ✅ **Login/Register with Invites**: Preserves invite tokens through auth flow
- ✅ **Smart Redirects**: Users redirected to correct tables after authentication
- ✅ **Guest Token Management**: Secure local storage and session management
- ✅ **Invite Validation**: Backend validation of signed invite tokens

### 🏠 **Dashboard & Navigation Updates**
- ✅ **Guest-Specific Home Page**: Different content and limitations for guests
- ✅ **Guest Mode Indicators**: Clear visual indicators and status badges
- ✅ **Guest Table Access**: View and participate in invited retrospectives
- ✅ **Guest Navigation**: Logo navigation works for guests (redirects to home)
- ✅ **Guest User Display**: Header shows guest name and exit option

### 🎯 **Enhanced Retro Board Features**
- ✅ **Owner-Only Controls**: Delete cards, manage topics, archive tables, share
- ✅ **Guest Restrictions**: Anonymous posting, no administrative actions
- ✅ **Drag & Drop Restrictions**: Only owners can merge cards
- ✅ **Guest Table Content**: Different mock data for guest-accessible tables
- ✅ **Permission-Based UI**: Different buttons and controls based on user type

### 🔗 **Share & Invite System**
- ✅ **Share Modal**: Generate secure invite links for table sharing
- ✅ **Signed Invite Generation**: Secure, time-limited invite URLs
- ✅ **Invite Validation**: Backend validation of invite tokens
- ✅ **Guest Join Flow**: Seamless guest participation via invite links
- ✅ **Invite Token Management**: Proper token handling and cleanup

### 🎨 **UI/UX Improvements**
- ✅ **Guest Join Modal**: Professional modal with login/register/guest options
- ✅ **Guest Mode Badges**: Clear visual indicators for guest users
- ✅ **Contextual Messaging**: Different descriptions based on user type
- ✅ **Error Handling**: User-friendly error messages for all scenarios
- ✅ **Loading States**: Comprehensive loading indicators with messages

### 🔧 **Technical Improvements**
- ✅ **State-Based Authentication**: Clean authentication flow with 5 distinct states
- ✅ **Guest Store**: Comprehensive guest state management
- ✅ **API Hooks**: Reusable hooks for all API operations
- ✅ **Type Safety**: Enhanced TypeScript types for guest functionality
- ✅ **Mock API Integration**: Development-friendly mock implementations
- ✅ **Mobile Drag & Drop**: Touch-optimized drag and drop with proper sensor configuration

### 🎯 **Retro Board Functionality**
- ✅ **Dynamic Topic Management**: Create, edit, remove topics with custom colors
- ✅ **Card Merging**: Drag and drop to combine cards with visual separators
- ✅ **Vote System**: Complete like/unlike functionality with API integration
- ✅ **Archive System**: Full table archiving with read-only mode
- ✅ **Card Blurring**: Owner-controlled content visibility
- ✅ **Color Picker**: Professional color selection with 12 predefined + custom colors

### 🏠 **Dashboard & Navigation**
- ✅ **Home Dashboard**: Overview of all retrospectives with clickable cards
- ✅ **Create Table Modal**: Professional form with validation and color selection
- ✅ **Navigation**: Seamless routing between pages
- ✅ **Table Linking**: Cards link to respective table pages

### 🎨 **UI/UX Improvements**
- ✅ **Drag & Drop**: @dnd-kit integration for smooth interactions
- ✅ **Loading States**: Comprehensive loading indicators
- ✅ **Error Handling**: User-friendly error messages
- ✅ **Responsive Design**: Mobile-first approach
- ✅ **Accessibility**: ARIA labels and keyboard navigation

### 🔧 **Technical Improvements**
- ✅ **TypeScript**: Strict typing throughout the application
- ✅ **Component Architecture**: Reusable, composable components
- ✅ **State Management**: Efficient state updates and optimistic UI
- ✅ **API Integration**: Mock API calls with proper error handling
- ✅ **Performance**: Optimized rendering and state updates

### 🌙 **Theme System**
- ✅ **Dark Mode**: Complete dark/light theme support
- ✅ **System Detection**: Automatic theme preference detection
- ✅ **Manual Toggle**: User-controlled theme switching
- ✅ **Persistent Settings**: Theme saved across sessions

## Authentication Flow

The application uses a **state-based authentication flow** with comprehensive guest access and invite management:

### **Authentication States**

The `ProtectedRoute` component manages authentication through 5 distinct states:

#### 1. **Loading State**
- **When**: Initial authentication check is in progress
- **Action**: Show loading spinner with contextual message
- **UI**: Centered spinner with "Checking authentication..." or "Validating invite..."

#### 2. **Authenticated State**
- **When**: User has valid JWT token and is logged in
- **Action**: Allow full access to all features
- **Priority**: Highest - immediate access granted

#### 3. **Guest State**
- **When**: User has valid guest token stored (existing guest session)
- **Action**: Allow access using existing guest session
- **Limitations**: Anonymous posting, no administrative actions

#### 4. **Invite State**
- **When**: User has valid invite token (new or existing guest)
- **Action**: Show guest join modal with options
- **Flow**: Validate invite → Show modal → Join as guest or authenticate

#### 5. **Unauthorized State**
- **When**: No valid authentication or guest token, no invite
- **Action**: Redirect to login/register page
- **Priority**: Lowest - requires authentication

### **Authentication Flow Logic**

```typescript
// Priority-based authentication determination
if (isAuthenticated) {
  // 1. Authenticated users get immediate access
  setAuthState('authenticated')
} else if (isGuest && guestUser && !inviteToken) {
  // 2. Existing guests without invite get access
  setAuthState('guest')
} else if (inviteToken) {
  // 3. Handle invite token scenarios
  const validation = await validateSignedInvite(inviteToken)
  if (validation?.valid) {
    setAuthState('invite')
  } else {
    setAuthState('unauthorized')
  }
} else {
  // 4. No authentication, no guest, no invite
  setAuthState('unauthorized')
}
```

### **Guest Join Flow**

When a user accesses a page with an invite token:

1. **Invite Validation**: Backend validates the signed invite token
2. **Modal Display**: Show guest join modal with table information
3. **User Choice**: User can join as guest, login, or register
4. **Guest Creation**: New guest user created with temporary token
5. **Table Linking**: Guest linked to the invited table
6. **URL Cleanup**: Invite token removed from URL
7. **Access Granted**: User can participate in the retrospective

### **Backend Authentication**

The backend uses **flexible authentication middleware** that supports multiple auth types:

#### **JWT Authentication**
- Standard Bearer token authentication
- Used for registered users
- Full access to all features

#### **Guest Token Authentication**
- Query parameter-based authentication
- Used for anonymous guest users
- Limited access based on permissions

#### **Invite Token Authentication**
- Temporary access for invite validation
- Used during the guest join process
- Time-limited and single-use

### **Security Features**

- **Signed Invite URLs**: Tamper-proof invite links with backend validation
- **Guest Token Management**: Secure local storage with proper cleanup
- **JWT-based Authentication**: Secure token-based authentication
- **Flexible Middleware**: Supports multiple authentication strategies
- **Invite Validation**: Backend validation of all invite tokens

## Guest System Architecture

### **Guest State Management**
- **Guest Store**: Zustand store with persistence for guest sessions
- **Guest Token**: Secure local storage of guest sessions with temporary tokens
- **Invited Tables**: List of tables guest has access to via invites
- **Guest Linking**: Ability to link existing guests to new tables via invites
- **Signed Invites**: Secure invite management with backend validation

### **Guest Permissions**
- ✅ **Can Do**: View tables, add cards (anonymously), vote on cards, navigate home page
- ❌ **Cannot Do**: Create tables, delete cards, manage topics, archive tables, share tables, merge cards

### **Guest Navigation**
- ✅ **Home Page**: Full access to view invited retrospectives
- ✅ **Table Pages**: Access to participate in invited tables
- ✅ **Logo Navigation**: Click logo to go to home page
- ✅ **Guest Mode Indicators**: Clear visual status badges and indicators

### **Guest Join Process**
1. **Invite Access**: User clicks signed invite link
2. **Token Validation**: Backend validates the invite token
3. **Modal Display**: Guest join modal shows with table information
4. **User Choice**: Options to join as guest, login, or register
5. **Guest Creation**: Temporary guest user created with unique token
6. **Table Access**: Guest linked to the invited retrospective
7. **Session Management**: Guest session persisted in local storage

## Development

### Backend (Hexagonal Architecture)
- **Domain**: Core business logic and entities
- **Ports**: Interfaces for external dependencies
- **Adapters**: Implementations of ports
- **Infrastructure**: Framework-specific code

### Frontend (Modern React)
- **Next.js 14**: Latest features with App Router
- **TypeScript**: Strict configuration for type safety
- **Tailwind CSS**: Utility-first styling
- **shadcn/ui**: Professional component library
- **Drag & Drop**: @dnd-kit for smooth interactions
- **State Management**: Efficient state updates with Zustand
- **Authentication Flow**: State-based authentication with comprehensive guest support

## Security

- **Next.js**: Updated to 14.2.30 with security fixes
- **Dependencies**: All packages updated to latest secure versions
- **TypeScript**: Strict configuration prevents runtime errors
- **ESLint**: Modern configuration with security rules
- **Authentication**: JWT-based secure authentication
- **Signed Invites**: Tamper-proof invite URLs with backend validation
- **Guest Tokens**: Secure local storage with proper cleanup

## Available Routes

- **Homepage**: `http://localhost:3000`
- **Dashboard**: `http://localhost:3000/home`
- **Login**: `http://localhost:3000/auth/login`
- **Register**: `http://localhost:3000/auth/register`
- **Retro Board**: `http://localhost:3000/table/[id]`
- **API**: `http://localhost:8080/api/*`
- **Database**: `localhost:5432`
- **Redis**: `localhost:6379`
- **pgAdmin**: `http://localhost:5050` (admin@retro.com / admin)

## Usage Guide

### Guest Participation
1. **Receive Invite**: Get a signed invite link from table owner
2. **Join Options**: Choose to continue as guest, login, or register
3. **Guest Access**: View and participate in invited retrospectives
4. **Anonymous Posting**: Add cards anonymously (required for guests)
5. **Vote & Participate**: Vote on cards and engage with the team

### Creating a Retrospective
1. Navigate to the dashboard
2. Click "Create New Table" (authenticated users only)
3. Enter table name and description
4. Choose a color theme
5. Click "Create Table"

### Sharing Tables
1. As table owner, click "Share" button
2. Generate secure invite link
3. Share link with team members
4. Recipients can join as guest or create account

### Managing Topics
1. As table owner, click "Add Topic"
2. Enter topic name and select color
3. Use "×" button to remove topics
4. Topics automatically update in real-time

### Adding Cards
1. Select a topic category
2. Enter your feedback
3. Choose anonymous or named posting (guests must post anonymously)
4. Click "Add Card"

### Merging Cards (Owners Only)
1. Drag one card onto another
2. Cards merge with visual separator
3. Votes combine automatically
4. Original metadata preserved

### Voting on Cards
1. Click the thumbs up icon
2. Loading state shows during API call
3. Vote count updates immediately
4. Error handling for failed votes

### Archiving Tables (Owners Only)
1. Click "Archive" button
2. Table becomes read-only
3. All cards become visible
4. No further modifications allowed 