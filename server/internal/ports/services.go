package ports

import (
	"context"

	"retro-project/server/internal/domain/entities"
)

// AuthService defines the interface for authentication operations
type AuthService interface {
	Register(ctx context.Context, email, password, name string) (*entities.User, error)
	Login(ctx context.Context, email, password string) (string, error) // Returns JWT token
	ValidateToken(ctx context.Context, token string) (*entities.User, error)
	HashPassword(password string) (string, error)
	ComparePassword(hashedPassword, password string) error
}

// TeamService defines the interface for team business logic
type TeamService interface {
	CreateTeam(ctx context.Context, name, description string, createdBy string) (*entities.Team, error)
	GetTeam(ctx context.Context, teamID string) (*entities.Team, error)
	GetUserTeams(ctx context.Context, userID string) ([]*entities.Team, error)
	UpdateTeam(ctx context.Context, teamID string, name, description string) (*entities.Team, error)
	DeleteTeam(ctx context.Context, teamID string) error
	AddTeamMember(ctx context.Context, teamID, userID, role string) error
	RemoveTeamMember(ctx context.Context, teamID, userID string) error
}

// RetroService defines the interface for retro business logic
type RetroService interface {
	CreateRetro(ctx context.Context, title, description, teamID, createdBy string) (*entities.Retro, error)
	GetRetro(ctx context.Context, retroID string) (*entities.Retro, error)
	GetTeamRetros(ctx context.Context, teamID string) ([]*entities.Retro, error)
	UpdateRetro(ctx context.Context, retroID, title, description string) (*entities.Retro, error)
	DeleteRetro(ctx context.Context, retroID string) error

	// Category operations
	CreateCategory(ctx context.Context, retroID, name, color string, order int) (*entities.RetroCategory, error)
	GetCategories(ctx context.Context, retroID string) ([]*entities.RetroCategory, error)
	UpdateCategory(ctx context.Context, categoryID, name, color string, order int) (*entities.RetroCategory, error)
	DeleteCategory(ctx context.Context, categoryID string) error

	// Card operations
	CreateCard(ctx context.Context, categoryID, content, authorID string) (*entities.RetroCard, error)
	GetCards(ctx context.Context, categoryID string) ([]*entities.RetroCard, error)
	UpdateCard(ctx context.Context, cardID, content string) (*entities.RetroCard, error)
	DeleteCard(ctx context.Context, cardID string) error
	VoteCard(ctx context.Context, cardID string, increment bool) error
}

// WebSocketService defines the interface for real-time communication
type WebSocketService interface {
	JoinRoom(roomID string, clientID string) error
	LeaveRoom(roomID string, clientID string) error
	BroadcastToRoom(roomID string, event string, data interface{}) error
	BroadcastToClient(clientID string, event string, data interface{}) error
}
