package ports

import (
	"context"

	"retro-project/server/internal/domain/entities"
)

// UserRepository defines the interface for user data operations
type UserRepository interface {
	Create(ctx context.Context, user *entities.User) error
	GetByID(ctx context.Context, id string) (*entities.User, error)
	GetByEmail(ctx context.Context, email string) (*entities.User, error)
	Update(ctx context.Context, user *entities.User) error
	Delete(ctx context.Context, id string) error
}

// TeamRepository defines the interface for team data operations
type TeamRepository interface {
	Create(ctx context.Context, team *entities.Team) error
	GetByID(ctx context.Context, id string) (*entities.Team, error)
	GetByUserID(ctx context.Context, userID string) ([]*entities.Team, error)
	Update(ctx context.Context, team *entities.Team) error
	Delete(ctx context.Context, id string) error
	AddMember(ctx context.Context, member *entities.TeamMember) error
	RemoveMember(ctx context.Context, teamID, userID string) error
}

// RetroRepository defines the interface for retro data operations
type RetroRepository interface {
	Create(ctx context.Context, retro *entities.Retro) error
	GetByID(ctx context.Context, id string) (*entities.Retro, error)
	GetByTeamID(ctx context.Context, teamID string) ([]*entities.Retro, error)
	Update(ctx context.Context, retro *entities.Retro) error
	Delete(ctx context.Context, id string) error

	// Category operations
	CreateCategory(ctx context.Context, category *entities.RetroCategory) error
	GetCategoriesByRetroID(ctx context.Context, retroID string) ([]*entities.RetroCategory, error)
	UpdateCategory(ctx context.Context, category *entities.RetroCategory) error
	DeleteCategory(ctx context.Context, id string) error

	// Card operations
	CreateCard(ctx context.Context, card *entities.RetroCard) error
	GetCardsByCategoryID(ctx context.Context, categoryID string) ([]*entities.RetroCard, error)
	UpdateCard(ctx context.Context, card *entities.RetroCard) error
	DeleteCard(ctx context.Context, id string) error
	VoteCard(ctx context.Context, cardID string, increment bool) error
}
