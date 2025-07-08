package entities

import (
	"time"

	"github.com/google/uuid"
)

// User represents a user in the system
type User struct {
	ID        uuid.UUID `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	Email     string    `json:"email" gorm:"uniqueIndex;not null"`
	Password  string    `json:"-" gorm:"not null"`
	Name      string    `json:"name" gorm:"not null"`
	Avatar    string    `json:"avatar"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	// Relationships
	OwnedRetros    []Retro            `json:"owned_retros" gorm:"foreignKey:OwnerID"`
	Participations []RetroParticipant `json:"participations" gorm:"foreignKey:UserID"`
	CreatedInvites []Invite           `json:"created_invites" gorm:"foreignKey:CreatedBy"`
}

// NewUser creates a new user instance
func NewUser(email, password, name string) *User {
	return &User{
		ID:        uuid.New(),
		Email:     email,
		Password:  password,
		Name:      name,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
}
