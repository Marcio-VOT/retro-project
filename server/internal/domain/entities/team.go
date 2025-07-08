package entities

import (
	"time"

	"github.com/google/uuid"
)

// Team represents a team in the system (optional for retros)
type Team struct {
	ID          uuid.UUID `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	Name        string    `json:"name" gorm:"not null"`
	Description string    `json:"description"`
	CreatedBy   uuid.UUID `json:"created_by" gorm:"type:uuid;not null"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`

	// Relationships
	Members []TeamMember `json:"members" gorm:"foreignKey:TeamID"`
	Retros  []Retro      `json:"retros" gorm:"foreignKey:TeamID"`
}

// TeamMember represents a team membership
type TeamMember struct {
	ID     uuid.UUID `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	TeamID uuid.UUID `json:"team_id" gorm:"type:uuid;not null"`
	UserID uuid.UUID `json:"user_id" gorm:"type:uuid;not null"`
	Role   string    `json:"role" gorm:"not null;default:'member'"` // admin, member

	// Relationships
	User User `json:"user" gorm:"foreignKey:UserID"`
}

// NewTeam creates a new team instance
func NewTeam(name, description string, createdBy uuid.UUID) *Team {
	return &Team{
		ID:          uuid.New(),
		Name:        name,
		Description: description,
		CreatedBy:   createdBy,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}
}
