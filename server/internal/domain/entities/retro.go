package entities

import (
	"time"

	"github.com/google/uuid"
)

// Retro represents a retrospective session (renamed from team-based to user-based)
type Retro struct {
	ID          uuid.UUID  `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	Name        string     `json:"name" gorm:"not null"` // Changed from Title to Name to match frontend
	Description string     `json:"description"`
	Status      string     `json:"status" gorm:"not null;default:'active'"` // active, archived
	OwnerID     uuid.UUID  `json:"owner_id" gorm:"type:uuid;not null"`      // Changed from CreatedBy to OwnerID
	TeamID      *uuid.UUID `json:"team_id" gorm:"type:uuid"`                // Optional team association
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`

	// Relationships
	Categories   []RetroCategory    `json:"categories" gorm:"foreignKey:RetroID"`
	Owner        User               `json:"owner" gorm:"foreignKey:OwnerID"`
	Team         *Team              `json:"team" gorm:"foreignKey:TeamID"`
	Participants []RetroParticipant `json:"participants" gorm:"foreignKey:RetroID"`
}

// RetroCategory represents a category in a retro (e.g., Start, Stop, Continue)
type RetroCategory struct {
	ID      uuid.UUID `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	RetroID uuid.UUID `json:"retro_id" gorm:"type:uuid;not null"`
	Name    string    `json:"name" gorm:"not null"`
	Color   string    `json:"color" gorm:"not null"`
	Order   int       `json:"order" gorm:"not null"`

	// Relationships
	Cards []RetroCard `json:"cards" gorm:"foreignKey:CategoryID"`
}

// RetroCard represents a card in a retro category
type RetroCard struct {
	ID          uuid.UUID `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	CategoryID  uuid.UUID `json:"category_id" gorm:"type:uuid;not null"`
	Content     string    `json:"content" gorm:"not null"`
	AuthorID    uuid.UUID `json:"author_id" gorm:"type:uuid;not null;constraint:false"` // Polymorphic relationship - no FK constraint
	AuthorType  string    `json:"author_type" gorm:"not null;default:'user'"`           // user, guest
	Votes       int       `json:"votes" gorm:"default:0"`
	IsAnonymous bool      `json:"is_anonymous" gorm:"default:false"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`

	// Relationships
	Category    RetroCategory   `json:"category" gorm:"foreignKey:CategoryID"`
	VoteRecords []RetroCardVote `json:"vote_records" gorm:"foreignKey:CardID"`
}

// RetroParticipant represents a participant in a retro (user or guest)
type RetroParticipant struct {
	ID       uuid.UUID  `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	RetroID  uuid.UUID  `json:"retro_id" gorm:"type:uuid;not null"`
	UserID   *uuid.UUID `json:"user_id" gorm:"type:uuid"`  // Nullable for guests
	GuestID  *uuid.UUID `json:"guest_id" gorm:"type:uuid"` // Nullable for users
	JoinedAt time.Time  `json:"joined_at"`

	// Relationships
	User  *User  `json:"user" gorm:"foreignKey:UserID"`
	Guest *Guest `json:"guest" gorm:"foreignKey:GuestID"`
}

// RetroCardVote represents a vote on a retro card
type RetroCardVote struct {
	ID        uuid.UUID `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	CardID    uuid.UUID `json:"card_id" gorm:"type:uuid;not null"`
	VoterID   uuid.UUID `json:"voter_id" gorm:"type:uuid;not null;constraint:false"` // Polymorphic relationship - no FK constraint
	VoterType string    `json:"voter_type" gorm:"not null;default:'user'"`           // user, guest
	CreatedAt time.Time `json:"created_at"`
}

// Guest represents a guest user
type Guest struct {
	ID        uuid.UUID `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	Name      string    `json:"name" gorm:"not null"`
	Email     string    `json:"email"`
	TempToken string    `json:"temp_token" gorm:"uniqueIndex;not null"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	// Relationships
	Participations []RetroParticipant `json:"participations" gorm:"foreignKey:GuestID"`
}

// Invite represents a signed invite for a retro
type Invite struct {
	ID        uuid.UUID `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	RetroID   uuid.UUID `json:"retro_id" gorm:"type:uuid;not null"`
	Token     string    `json:"token" gorm:"uniqueIndex;not null"`
	Email     string    `json:"email"`
	Signature string    `json:"signature" gorm:"not null"`
	ExpiresAt time.Time `json:"expires_at" gorm:"not null"`
	CreatedBy uuid.UUID `json:"created_by" gorm:"type:uuid;not null"`
	CreatedAt time.Time `json:"created_at"`

	// Relationships
	Retro   Retro `json:"retro" gorm:"foreignKey:RetroID"`
	Creator User  `json:"creator" gorm:"foreignKey:CreatedBy"`
}

// NewRetro creates a new retro instance
func NewRetro(name, description string, ownerID uuid.UUID) *Retro {
	return &Retro{
		ID:          uuid.New(),
		Name:        name,
		Description: description,
		Status:      "active",
		OwnerID:     ownerID,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}
}

// NewTeamRetro creates a new retro instance with team association
func NewTeamRetro(name, description string, ownerID, teamID uuid.UUID) *Retro {
	return &Retro{
		ID:          uuid.New(),
		Name:        name,
		Description: description,
		Status:      "active",
		OwnerID:     ownerID,
		TeamID:      &teamID,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}
}

// NewRetroCard creates a new retro card instance
func NewRetroCard(content string, categoryID, authorID uuid.UUID, authorType string, isAnonymous bool) *RetroCard {
	return &RetroCard{
		ID:          uuid.New(),
		CategoryID:  categoryID,
		Content:     content,
		AuthorID:    authorID,
		AuthorType:  authorType,
		IsAnonymous: isAnonymous,
		Votes:       0,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}
}

// NewGuest creates a new guest instance
func NewGuest(name, email, tempToken string) *Guest {
	return &Guest{
		ID:        uuid.New(),
		Name:      name,
		Email:     email,
		TempToken: tempToken,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
}

// NewInvite creates a new invite instance
func NewInvite(retroID, createdBy uuid.UUID, token, signature, email string, expiresAt time.Time) *Invite {
	return &Invite{
		ID:        uuid.New(),
		RetroID:   retroID,
		Token:     token,
		Email:     email,
		Signature: signature,
		ExpiresAt: expiresAt,
		CreatedBy: createdBy,
		CreatedAt: time.Now(),
	}
}

// NewRetroParticipant creates a new retro participant instance
func NewRetroParticipant(retroID uuid.UUID, userID, guestID *uuid.UUID) *RetroParticipant {
	return &RetroParticipant{
		ID:       uuid.New(),
		RetroID:  retroID,
		UserID:   userID,
		GuestID:  guestID,
		JoinedAt: time.Now(),
	}
}

// NewRetroCardVote creates a new retro card vote instance
func NewRetroCardVote(cardID, voterID uuid.UUID, voterType string) *RetroCardVote {
	return &RetroCardVote{
		ID:        uuid.New(),
		CardID:    cardID,
		VoterID:   voterID,
		VoterType: voterType,
		CreatedAt: time.Now(),
	}
}
