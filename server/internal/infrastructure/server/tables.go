package server

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"net/http"
	"sort"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"

	"log"
	"retro-project/server/internal/domain/entities"

	socketio "github.com/googollee/go-socket.io"
)

type TableHandler struct {
	DB     *gorm.DB
	Socket *socketio.Server
}

type CreateTableRequest struct {
	Name        string `json:"name" binding:"required,min=1,max=100"`
	Description string `json:"description" binding:"max=500"`
}

type TableResponse struct {
	ID               string                       `json:"id"`
	Name             string                       `json:"name"`
	Description      string                       `json:"description"`
	CreatedAt        time.Time                    `json:"createdAt"`
	ParticipantCount int                          `json:"participantCount"`
	Status           string                       `json:"status"`
	Categories       map[string]map[string]string `json:"categories"`
}

type TableAccessRequest struct {
	InviteToken string `json:"inviteToken"`
	UserToken   string `json:"userToken"`
	GuestToken  string `json:"guestToken"`
}

type TableAccessResponse struct {
	Success       bool          `json:"success"`
	Table         TableResponse `json:"table"`
	IsOwner       bool          `json:"isOwner"`
	IsParticipant bool          `json:"isParticipant"`
	AccessGranted bool          `json:"accessGranted"`
}

// Card-related types
type CreateCardRequest struct {
	Content     string `json:"content" binding:"required,min=1,max=1000"`
	CategoryID  string `json:"categoryId" binding:"required"`
	IsAnonymous bool   `json:"isAnonymous"`
}

// Helper function to convert string to *string
func stringPtr(s string) *string {
	return &s
}

type CardResponse struct {
	ID          string    `json:"id"`
	Content     string    `json:"content"`
	AuthorID    *string   `json:"authorId,omitempty"`
	AuthorType  string    `json:"authorType"`
	AuthorName  string    `json:"authorName"`
	CategoryID  string    `json:"categoryId"`
	Votes       int       `json:"votes"`
	IsAnonymous bool      `json:"isAnonymous"`
	CreatedAt   time.Time `json:"createdAt"`
	IsVotedByMe bool      `json:"isVotedByMe"`
}

type VoteCardRequest struct {
	Action string `json:"action" binding:"required,oneof=vote unvote"`
}

type MergeCardsRequest struct {
	DraggedCardId string `json:"draggedCardId" binding:"required"`
	TargetCardId  string `json:"targetCardId" binding:"required"`
}

// Invite-related types
type CreateInviteRequest struct {
	Email     string `json:"email"`
	ExpiresIn int    `json:"expiresIn"` // in hours, default 24
}

type InviteResponse struct {
	Token     string    `json:"token"`
	TableID   string    `json:"tableId"`
	Email     string    `json:"email"`
	ExpiresAt time.Time `json:"expiresAt"`
	CreatedBy string    `json:"createdBy"`
	Signature string    `json:"signature"`
}

type InviteValidationResponse struct {
	Valid     bool      `json:"valid"`
	TableID   string    `json:"tableId"`
	TableName string    `json:"tableName"`
	Email     string    `json:"email"`
	ExpiresAt time.Time `json:"expiresAt"`
	CreatedBy string    `json:"createdBy"`
}

// Guest-related types
type JoinAsGuestRequest struct {
	Name string `json:"name" binding:"required,min=1,max=100"`
}

type GuestResponse struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	TempToken string `json:"tempToken"`
}

type LinkGuestRequest struct {
	UserID     string `json:"userId" binding:"required"`
	GuestToken string `json:"guestToken" binding:"required"`
}

// Archive table request
type ArchiveTableRequest struct {
	Status string `json:"status" binding:"required,oneof=active archived"`
}

// Topic management types
type CreateTopicRequest struct {
	Title string `json:"title" binding:"required,min=1,max=100"`
	Color string `json:"color" binding:"required"`
}

type UpdateTopicRequest struct {
	Title string `json:"title" binding:"required,min=1,max=100"`
	Color string `json:"color" binding:"required"`
}

type TopicResponse struct {
	ID    string `json:"id"`
	Title string `json:"title"`
	Color string `json:"color"`
	Order int    `json:"order"`
}

func (h *TableHandler) GetUserTables(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var retros []entities.Retro
	if err := h.DB.Where("owner_id = ?", userID).Find(&retros).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch tables"})
		return
	}

	// Get participant count for each retro
	var responses []TableResponse
	for _, retro := range retros {
		var participantCount int64
		h.DB.Model(&entities.RetroParticipant{}).Where("retro_id = ?", retro.ID).Count(&participantCount)

		// Get categories for this retro
		var categories []entities.RetroCategory
		if err := h.DB.Where("retro_id = ?", retro.ID).Order("name ASC").Find(&categories).Error; err != nil {
			categories = []entities.RetroCategory{}
		}

		// Build categories map
		categoriesMap := make(map[string]map[string]string)
		for _, category := range categories {
			categoriesMap[category.ID.String()] = map[string]string{
				"title": category.Name,
				"color": category.Color,
			}
		}

		responses = append(responses, TableResponse{
			ID:               retro.ID.String(),
			Name:             retro.Name,
			Description:      retro.Description,
			CreatedAt:        retro.CreatedAt,
			ParticipantCount: int(participantCount),
			Status:           retro.Status,
			Categories:       categoriesMap,
		})
	}

	c.JSON(http.StatusOK, responses)
}

func (h *TableHandler) CreateTable(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var req CreateTableRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Parse user ID
	ownerID, err := uuid.Parse(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	// Create new retro
	retro := entities.NewRetro(req.Name, req.Description, ownerID)

	if err := h.DB.Create(retro).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create table"})
		return
	}

	// Create default categories
	defaultCategories := []entities.RetroCategory{
		{
			ID:      uuid.New(),
			RetroID: retro.ID,
			Name:    "went well",
			Color:   "bg-green-500 text-white",
			Order:   1,
		},
		{
			ID:      uuid.New(),
			RetroID: retro.ID,
			Name:    "to improve",
			Color:   "bg-red-500 text-white",
			Order:   2,
		},
		{
			ID:      uuid.New(),
			RetroID: retro.ID,
			Name:    "action items",
			Color:   "bg-purple-500 text-white",
			Order:   3,
		},
	}

	for _, category := range defaultCategories {
		if err := h.DB.Create(&category).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create default categories"})
			return
		}
	}

	response := TableResponse{
		ID:               retro.ID.String(),
		Name:             retro.Name,
		Description:      retro.Description,
		CreatedAt:        retro.CreatedAt,
		ParticipantCount: 1, // Owner is the first participant
		Status:           retro.Status,
		Categories: map[string]map[string]string{
			defaultCategories[0].ID.String(): {"title": "went well", "color": "bg-green-500 text-white"},
			defaultCategories[1].ID.String(): {"title": "to improve", "color": "bg-red-500 text-white"},
			defaultCategories[2].ID.String(): {"title": "action items", "color": "bg-purple-500 text-white"},
		},
	}

	c.JSON(http.StatusCreated, response)
}

func (h *TableHandler) GetTableAccess(c *gin.Context) {
	tableID := c.Param("tableId")
	if tableID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Table ID is required"})
		return
	}

	// Parse table ID
	retroID, err := uuid.Parse(tableID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid table ID"})
		return
	}

	// Get the retro
	var retro entities.Retro
	if err := h.DB.Where("id = ?", retroID).First(&retro).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Table not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch table"})
		return
	}

	// Get categories for the retro
	var categories []entities.RetroCategory
	if err := h.DB.Where("retro_id = ?", retroID).Find(&categories).Error; err != nil {
		// Don't fail if no categories found, just use empty array
		log.Printf("Error fetching categories for retro %s: %v", retroID, err)
		categories = []entities.RetroCategory{}
	}

	// Sort categories by order field manually
	sort.Slice(categories, func(i, j int) bool {
		return categories[i].Order < categories[j].Order
	})

	log.Printf("Found %d categories for retro %s", len(categories), retroID)
	for _, cat := range categories {
		log.Printf("Category: ID=%s, Name=%s, Color=%s, Order=%d", cat.ID, cat.Name, cat.Color, cat.Order)
	}

	// Build categories map
	categoriesMap := make(map[string]map[string]string)
	for _, category := range categories {
		categoriesMap[category.ID.String()] = map[string]string{
			"title": category.Name,
			"color": category.Color,
		}
	}

	// Check access based on authentication method
	var isOwner bool
	var isParticipant bool
	var accessGranted bool

	// Check if user is authenticated
	userID := c.GetString("user_id")
	if userID != "" {
		// Authenticated user
		userUUID, err := uuid.Parse(userID)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
			return
		}

		// Check if user is owner
		isOwner = retro.OwnerID == userUUID

		// Check if user is participant
		var participant entities.RetroParticipant
		if err := h.DB.Where("retro_id = ? AND user_id = ?", retroID, userUUID).First(&participant).Error; err == nil {
			isParticipant = true
		}

		// Grant access if owner or participant
		accessGranted = isOwner || isParticipant

		// If not participant but owner, add as participant
		if isOwner && !isParticipant {
			participant := entities.NewRetroParticipant(retroID, &userUUID, nil)
			if err := h.DB.Create(participant).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add owner as participant"})
				return
			}
			isParticipant = true
		}
	} else {
		// Check for invite token
		inviteToken := c.Query("inviteToken")
		guestToken := c.GetString("guest_token")

		if inviteToken != "" {
			// Validate invite token
			var invite entities.Invite
			if err := h.DB.Where("token = ? AND retro_id = ? AND expires_at > ?", inviteToken, retroID, time.Now()).First(&invite).Error; err != nil {
				if err == gorm.ErrRecordNotFound {
					c.JSON(http.StatusForbidden, gin.H{"error": "Invalid or expired invite token"})
					return
				}
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to validate invite"})
				return
			}
			accessGranted = true
		} else if guestToken != "" {
			// Validate guest token
			var guest entities.Guest
			if err := h.DB.Where("temp_token = ?", guestToken).First(&guest).Error; err != nil {
				if err == gorm.ErrRecordNotFound {
					c.JSON(http.StatusForbidden, gin.H{"error": "Invalid guest token"})
					return
				}
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to validate guest token"})
				return
			}

			// Check if guest is participant
			var participant entities.RetroParticipant
			if err := h.DB.Where("retro_id = ? AND guest_id = ?", retroID, guest.ID).First(&participant).Error; err == nil {
				isParticipant = true
				accessGranted = true
			} else {
				// Guest exists but is not a participant - this might be the issue
				// For now, let's grant access if the guest token is valid
				accessGranted = true
			}
		}
	}

	// Get participant count
	var participantCount int64
	h.DB.Model(&entities.RetroParticipant{}).Where("retro_id = ?", retroID).Count(&participantCount)

	// Build response
	tableResponse := TableResponse{
		ID:               retro.ID.String(),
		Name:             retro.Name,
		Description:      retro.Description,
		CreatedAt:        retro.CreatedAt,
		ParticipantCount: int(participantCount),
		Status:           retro.Status,
		Categories:       categoriesMap,
	}

	response := TableAccessResponse{
		Success:       true,
		Table:         tableResponse,
		IsOwner:       isOwner,
		IsParticipant: isParticipant,
		AccessGranted: accessGranted,
	}

	c.JSON(http.StatusOK, response)
}

// GetTable retrieves a single table with all its data
func (h *TableHandler) GetTable(c *gin.Context) {
	tableID := c.Param("tableId")
	if tableID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Table ID is required"})
		return
	}

	// Parse table ID
	retroID, err := uuid.Parse(tableID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid table ID"})
		return
	}

	// Get the retro with categories and cards
	var retro entities.Retro
	if err := h.DB.Preload("Categories.Cards").Where("id = ?", retroID).First(&retro).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Table not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch table"})
		return
	}

	// Get participants
	var participants []entities.RetroParticipant
	if err := h.DB.Preload("User").Preload("Guest").Where("retro_id = ?", retroID).Find(&participants).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch participants"})
		return
	}

	// Build participants list
	participantNames := make([]string, 0)
	for _, p := range participants {
		if p.User != nil {
			participantNames = append(participantNames, p.User.Name)
		} else if p.Guest != nil {
			participantNames = append(participantNames, p.Guest.Name)
		}
	}

	// Build categories map
	categoriesMap := make(map[string]map[string]string)
	for _, category := range retro.Categories {
		categoriesMap[category.ID.String()] = map[string]string{
			"title": category.Name,
			"color": category.Color,
		}
	}

	response := gin.H{
		"id":           retro.ID.String(),
		"name":         retro.Name,
		"description":  retro.Description,
		"status":       retro.Status,
		"participants": participantNames,
		"owner":        retro.OwnerID.String(),
		"categories":   categoriesMap,
	}

	c.JSON(http.StatusOK, response)
}

// ArchiveTable archives or unarchives a table
func (h *TableHandler) ArchiveTable(c *gin.Context) {
	tableID := c.Param("tableId")
	if tableID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Table ID is required"})
		return
	}

	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var req ArchiveTableRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Parse IDs
	retroID, err := uuid.Parse(tableID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid table ID"})
		return
	}

	userUUID, err := uuid.Parse(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	// Get the retro and check ownership
	var retro entities.Retro
	if err := h.DB.Where("id = ? AND owner_id = ?", retroID, userUUID).First(&retro).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Table not found or you don't have permission to archive it"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch table"})
		return
	}

	// Update status
	if err := h.DB.Model(&retro).Update("status", req.Status).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update table status"})
		return
	}

	// Emit websocket event for real-time updates
	if h.Socket != nil {
		h.Socket.BroadcastToRoom("/", retroID.String(), "table-archived", map[string]interface{}{
			"tableId": retroID.String(),
			"status":  req.Status,
		})
	}

	c.JSON(http.StatusOK, gin.H{"success": true})
}

// DeleteTable handles deleting a table
func (h *TableHandler) DeleteTable(c *gin.Context) {
	tableID := c.Param("tableId")
	if tableID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Table ID is required"})
		return
	}

	// Check if user is authenticated
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Parse table ID
	retroID, err := uuid.Parse(tableID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid table ID"})
		return
	}

	// Parse user ID
	userUUID, err := uuid.Parse(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	// Verify table exists and user is owner
	var retro entities.Retro
	if err := h.DB.Where("id = ? AND owner_id = ?", retroID, userUUID).First(&retro).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Table not found or you don't have permission to delete it"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch table"})
		return
	}

	// Start a transaction to delete all related data
	tx := h.DB.Begin()

	// Delete all votes for cards in this retro
	if err := tx.Exec("DELETE FROM retro_card_votes WHERE card_id IN (SELECT id FROM retro_cards WHERE category_id IN (SELECT id FROM retro_categories WHERE retro_id = ?))", retroID).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete card votes"})
		return
	}

	// Delete all cards in this retro
	if err := tx.Exec("DELETE FROM retro_cards WHERE category_id IN (SELECT id FROM retro_categories WHERE retro_id = ?)", retroID).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete cards"})
		return
	}

	// Delete all categories in this retro
	if err := tx.Where("retro_id = ?", retroID).Delete(&entities.RetroCategory{}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete categories"})
		return
	}

	// Delete all participants in this retro
	if err := tx.Where("retro_id = ?", retroID).Delete(&entities.RetroParticipant{}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete participants"})
		return
	}

	// Delete all invites for this retro
	if err := tx.Where("retro_id = ?", retroID).Delete(&entities.Invite{}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete invites"})
		return
	}

	// Finally, delete the retro itself
	if err := tx.Delete(&retro).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete table"})
		return
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to complete delete operation"})
		return
	}

	// Emit websocket event for real-time updates (if any clients are still connected)
	if h.Socket != nil {
		h.Socket.BroadcastToRoom("/", retroID.String(), "table-deleted", map[string]interface{}{
			"tableId": retroID.String(),
		})
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Table deleted successfully"})
}

// CreateCard creates a new card in a category
func (h *TableHandler) CreateCard(c *gin.Context) {
	var req CreateCardRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Parse category ID
	categoryID, err := uuid.Parse(req.CategoryID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid category ID"})
		return
	}

	// Verify category exists
	var category entities.RetroCategory
	if err := h.DB.Where("id = ?", categoryID).First(&category).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Category not found"})
		return
	}

	// Determine author info
	var authorID uuid.UUID
	var authorType string

	userID := c.GetString("user_id")
	if userID != "" {
		// Authenticated user
		authorID, err = uuid.Parse(userID)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
			return
		}
		authorType = "user"
	} else {
		// Guest user
		guestToken := c.GetString("guest_token")
		if guestToken == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
			return
		}

		var guest entities.Guest
		if err := h.DB.Where("temp_token = ?", guestToken).First(&guest).Error; err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid guest token"})
			return
		}
		authorID = guest.ID
		authorType = "guest"
	}

	// Create the card
	card := entities.NewRetroCard(req.Content, categoryID, authorID, authorType, req.IsAnonymous)

	if err := h.DB.Create(card).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create card"})
		return
	}

	// Fetch author name
	var authorName string
	if req.IsAnonymous {
		authorName = "Anonymous"
	} else {
		if authorType == "user" {
			var user entities.User
			if err := h.DB.Where("id = ?", authorID).First(&user).Error; err == nil {
				authorName = user.Name
			} else {
				authorName = "Unknown User"
			}
		} else if authorType == "guest" {
			var guest entities.Guest
			if err := h.DB.Where("id = ?", authorID).First(&guest).Error; err == nil {
				authorName = guest.Name
			} else {
				authorName = "Unknown Guest"
			}
		}
	}

	// Only include AuthorID for the card creator
	var responseAuthorID *string
	if userID != "" {
		// For authenticated users, include AuthorID if they created the card
		userUUID, _ := uuid.Parse(userID)
		if card.AuthorType == "user" && userUUID == card.AuthorID {
			responseAuthorID = stringPtr(card.AuthorID.String())
		}
	} else {
		// For guest users, include AuthorID if they created the card
		guestToken := c.GetString("guest_token")
		if guestToken != "" {
			var guest entities.Guest
			if h.DB.Where("temp_token = ?", guestToken).First(&guest).Error == nil {
				if card.AuthorType == "guest" && guest.ID == card.AuthorID {
					responseAuthorID = stringPtr(card.AuthorID.String())
				}
			}
		}
	}

	response := CardResponse{
		ID:          card.ID.String(),
		Content:     card.Content,
		AuthorID:    responseAuthorID,
		AuthorType:  card.AuthorType,
		AuthorName:  authorName,
		CategoryID:  card.CategoryID.String(),
		Votes:       card.Votes,
		IsAnonymous: card.IsAnonymous,
		CreatedAt:   card.CreatedAt,
		IsVotedByMe: false,
	}

	// Emit websocket event for real-time updates (for other clients)
	if h.Socket != nil {
		log.Printf("Emitting card-created event to room %s for card %s", category.RetroID.String(), card.ID.String())
		h.Socket.BroadcastToRoom("/", category.RetroID.String(), "card-created", map[string]interface{}{
			"card":    response,
			"tableId": category.RetroID.String(),
		})
	}

	// Return the new card in the API response for immediate local update
	c.JSON(http.StatusCreated, response)
}

// VoteCard handles voting on a card
func (h *TableHandler) VoteCard(c *gin.Context) {
	cardID := c.Param("cardId")
	if cardID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Card ID is required"})
		return
	}

	var req VoteCardRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Parse card ID
	cardUUID, err := uuid.Parse(cardID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid card ID"})
		return
	}

	// Get card to find its category
	var card entities.RetroCard
	if err := h.DB.Where("id = ?", cardUUID).First(&card).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Card not found"})
		return
	}

	// Get category to find the table ID
	var category entities.RetroCategory
	if err := h.DB.Where("id = ?", card.CategoryID).First(&category).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Category not found"})
		return
	}

	// Determine voter info
	var voterID uuid.UUID
	var voterType string

	userID := c.GetString("user_id")
	if userID != "" {
		// Authenticated user
		voterID, err = uuid.Parse(userID)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
			return
		}
		voterType = "user"
	} else {
		// Guest user
		guestToken := c.GetString("guest_token")
		if guestToken == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
			return
		}

		var guest entities.Guest
		if err := h.DB.Where("temp_token = ?", guestToken).First(&guest).Error; err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid guest token"})
			return
		}
		voterID = guest.ID
		voterType = "guest"
	}

	// Check if vote already exists
	var existingVote entities.RetroCardVote
	voteExists := h.DB.Where("card_id = ? AND voter_id = ? AND voter_type = ?", cardUUID, voterID, voterType).First(&existingVote).Error == nil

	if req.Action == "vote" {
		if voteExists {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Already voted on this card"})
			return
		}

		// Create vote record
		vote := entities.NewRetroCardVote(cardUUID, voterID, voterType)
		if err := h.DB.Create(vote).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create vote"})
			return
		}

		// Increment vote count
		if err := h.DB.Model(&entities.RetroCard{}).Where("id = ?", cardUUID).Update("votes", gorm.Expr("votes + 1")).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update vote count"})
			return
		}

		// Emit websocket event for real-time updates
		if h.Socket != nil {
			h.Socket.BroadcastToRoom("/", category.RetroID.String(), "card-voted", map[string]interface{}{
				"cardId":  cardID,
				"action":  "vote",
				"tableId": category.RetroID.String(),
			})
		}
	} else if req.Action == "unvote" {
		if !voteExists {
			c.JSON(http.StatusBadRequest, gin.H{"error": "No vote found to remove"})
			return
		}

		// Delete vote record
		if err := h.DB.Delete(&existingVote).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to remove vote"})
			return
		}

		// Decrement vote count
		if err := h.DB.Model(&entities.RetroCard{}).Where("id = ?", cardUUID).Update("votes", gorm.Expr("votes - 1")).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update vote count"})
			return
		}

		// Emit websocket event for real-time updates
		if h.Socket != nil {
			h.Socket.BroadcastToRoom("/", category.RetroID.String(), "card-voted", map[string]interface{}{
				"cardId":  cardID,
				"action":  "unvote",
				"tableId": category.RetroID.String(),
			})
		}
	}

	c.JSON(http.StatusOK, gin.H{"success": true})
}

// MergeCards handles merging two cards
func (h *TableHandler) MergeCards(c *gin.Context) {
	var req MergeCardsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Parse card IDs
	draggedCardID, err := uuid.Parse(req.DraggedCardId)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid dragged card ID"})
		return
	}

	targetCardID, err := uuid.Parse(req.TargetCardId)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid target card ID"})
		return
	}

	// Get both cards
	var draggedCard entities.RetroCard
	if err := h.DB.Where("id = ?", draggedCardID).First(&draggedCard).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Dragged card not found"})
		return
	}

	var targetCard entities.RetroCard
	if err := h.DB.Where("id = ?", targetCardID).First(&targetCard).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Target card not found"})
		return
	}

	// Get category to find the table ID
	var category entities.RetroCategory
	if err := h.DB.Where("id = ?", targetCard.CategoryID).First(&category).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Category not found"})
		return
	}

	// Check if user is owner (only owners can merge cards)
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}

	userUUID, err := uuid.Parse(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	// Verify table exists and user is owner
	var retro entities.Retro
	if err := h.DB.Where("id = ? AND owner_id = ?", category.RetroID, userUUID).First(&retro).Error; err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "You don't have permission to merge cards"})
		return
	}

	// Start a transaction
	tx := h.DB.Begin()

	// Merge the content with a separator
	mergedContent := targetCard.Content + "\n\n---\n\n" + draggedCard.Content

	// Update the target card with merged content
	if err := tx.Model(&targetCard).Update("content", mergedContent).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to merge cards"})
		return
	}

	// Delete the dragged card
	if err := tx.Delete(&draggedCard).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete dragged card"})
		return
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to complete merge operation"})
		return
	}

	// Create response with merged card data
	// Fetch author name for the merged card
	var authorName string
	if targetCard.IsAnonymous {
		authorName = "Anonymous"
	} else {
		if targetCard.AuthorType == "user" {
			var user entities.User
			if err := h.DB.Where("id = ?", targetCard.AuthorID).First(&user).Error; err == nil {
				authorName = user.Name
			} else {
				authorName = "Unknown User"
			}
		} else if targetCard.AuthorType == "guest" {
			var guest entities.Guest
			if err := h.DB.Where("id = ?", targetCard.AuthorID).First(&guest).Error; err == nil {
				authorName = guest.Name
			} else {
				authorName = "Unknown Guest"
			}
		}
	}

	// Only include AuthorID for the card creator
	var responseAuthorID *string
	if userID != "" {
		// For authenticated users, include AuthorID if they created the card
		userUUID, _ := uuid.Parse(userID)
		if targetCard.AuthorType == "user" && userUUID == targetCard.AuthorID {
			responseAuthorID = stringPtr(targetCard.AuthorID.String())
		}
	}

	mergedCardResponse := CardResponse{
		ID:          targetCard.ID.String(),
		Content:     mergedContent,
		AuthorID:    responseAuthorID,
		AuthorType:  targetCard.AuthorType,
		AuthorName:  authorName,
		CategoryID:  targetCard.CategoryID.String(),
		Votes:       targetCard.Votes,
		IsAnonymous: targetCard.IsAnonymous,
		CreatedAt:   targetCard.CreatedAt,
		IsVotedByMe: false, // Will be calculated by frontend
	}

	// Emit websocket event for real-time updates
	if h.Socket != nil {
		h.Socket.BroadcastToRoom("/", category.RetroID.String(), "cards-merged", map[string]interface{}{
			"tableId":       category.RetroID.String(),
			"draggedCardId": draggedCardID.String(),
			"targetCardId":  targetCardID.String(),
			"mergedCard":    mergedCardResponse,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"success":    true,
		"mergedCard": mergedCardResponse,
	})
}

// CreateInvite creates a signed invite for a table
func (h *TableHandler) CreateInvite(c *gin.Context) {
	tableID := c.Param("tableId")
	if tableID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Table ID is required"})
		return
	}

	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var req CreateInviteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Parse IDs
	retroID, err := uuid.Parse(tableID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid table ID"})
		return
	}

	userUUID, err := uuid.Parse(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	// Verify table exists and user has access
	var retro entities.Retro
	if err := h.DB.Where("id = ?", retroID).First(&retro).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Table not found"})
		return
	}

	// Check if user is owner or participant
	var participant entities.RetroParticipant
	if err := h.DB.Where("retro_id = ? AND user_id = ?", retroID, userUUID).First(&participant).Error; err != nil {
		if retro.OwnerID != userUUID {
			c.JSON(http.StatusForbidden, gin.H{"error": "You don't have permission to invite to this table"})
			return
		}
	}

	// Set default expiration (24 hours)
	expiresIn := req.ExpiresIn
	if expiresIn <= 0 {
		expiresIn = 24
	}

	// Generate token and signature
	token := uuid.New().String()
	expiresAt := time.Now().Add(time.Duration(expiresIn) * time.Hour)

	// Create signature
	message := fmt.Sprintf("%s:%s:%d", retroID.String(), token, time.Now().Unix())
	hash := hmac.New(sha256.New, []byte("your-secret-key")) // TODO: Use config secret
	hash.Write([]byte(message))
	signatureHex := hex.EncodeToString(hash.Sum(nil))

	// Create invite
	invite := entities.NewInvite(retroID, userUUID, token, signatureHex, req.Email, expiresAt)

	if err := h.DB.Create(invite).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create invite"})
		return
	}

	response := InviteResponse{
		Token:     token,
		TableID:   retroID.String(),
		Email:     req.Email,
		ExpiresAt: expiresAt,
		CreatedBy: userUUID.String(),
		Signature: signatureHex,
	}

	// Emit websocket event for real-time updates
	if h.Socket != nil {
		h.Socket.BroadcastToRoom("/", retroID.String(), "table-shared", map[string]interface{}{
			"tableId": retroID.String(),
			"email":   req.Email,
		})
	}

	c.JSON(http.StatusCreated, gin.H{
		"success":      true,
		"signedInvite": response,
	})
}

// CreateSignedInvite creates a signed invite without email (for link sharing)
func (h *TableHandler) CreateSignedInvite(c *gin.Context) {
	tableID := c.Param("tableId")
	if tableID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Table ID is required"})
		return
	}

	// Check if user is authenticated
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Parse table ID
	retroID, err := uuid.Parse(tableID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid table ID"})
		return
	}

	// Parse user ID
	userUUID, err := uuid.Parse(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	// Verify table exists and user is owner
	var retro entities.Retro
	if err := h.DB.Where("id = ? AND owner_id = ?", retroID, userUUID).First(&retro).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Table not found or you don't have permission to invite"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch table"})
		return
	}

	// Generate unique token
	token := uuid.New().String()

	// Create signature
	message := fmt.Sprintf("%s:%s:%d", retroID.String(), token, time.Now().Unix())
	hash := hmac.New(sha256.New, []byte("your-secret-key")) // TODO: Use config secret
	hash.Write([]byte(message))
	signatureHex := hex.EncodeToString(hash.Sum(nil))

	// Set expiration (7 days by default)
	expiresAt := time.Now().Add(7 * 24 * time.Hour)

	// Create invite without email
	invite := entities.NewInvite(retroID, userUUID, token, signatureHex, "", expiresAt)

	if err := h.DB.Create(invite).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create invite"})
		return
	}

	response := InviteResponse{
		Token:     token,
		TableID:   retroID.String(),
		Email:     "",
		ExpiresAt: expiresAt,
		CreatedBy: userUUID.String(),
		Signature: signatureHex,
	}

	// Emit websocket event for real-time updates
	if h.Socket != nil {
		h.Socket.BroadcastToRoom("/", retroID.String(), "table-shared", map[string]interface{}{
			"tableId": retroID.String(),
			"type":    "signed-invite",
		})
	}

	c.JSON(http.StatusCreated, gin.H{
		"success":      true,
		"signedInvite": response,
	})
}

// ValidateSignedInvite validates a signed invite token
func (h *TableHandler) ValidateSignedInvite(c *gin.Context) {
	token := c.Param("token")
	if token == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Token is required"})
		return
	}

	// Find invite
	var invite entities.Invite
	if err := h.DB.Where("token = ?", token).First(&invite).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusOK, gin.H{"valid": false})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to validate invite"})
		return
	}

	// Check expiration
	if time.Now().After(invite.ExpiresAt) {
		c.JSON(http.StatusOK, gin.H{"valid": false})
		return
	}

	// Get table info
	var retro entities.Retro
	if err := h.DB.Where("id = ?", invite.RetroID).First(&retro).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch table info"})
		return
	}

	// Get creator info
	var creator entities.User
	if err := h.DB.Where("id = ?", invite.CreatedBy).First(&creator).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch creator info"})
		return
	}

	response := InviteValidationResponse{
		Valid:     true,
		TableID:   invite.RetroID.String(),
		TableName: retro.Name,
		Email:     invite.Email,
		ExpiresAt: invite.ExpiresAt,
		CreatedBy: creator.Name,
	}

	c.JSON(http.StatusOK, response)
}

// JoinAsGuest allows a guest to join a table
func (h *TableHandler) JoinAsGuest(c *gin.Context) {
	tableID := c.Param("tableId")
	if tableID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Table ID is required"})
		return
	}

	var req JoinAsGuestRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Parse table ID
	retroID, err := uuid.Parse(tableID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid table ID"})
		return
	}

	// Verify table exists
	var retro entities.Retro
	if err := h.DB.Where("id = ?", retroID).First(&retro).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Table not found"})
		return
	}

	// Check for invite token in query parameters
	inviteToken := c.Query("inviteToken")
	if inviteToken != "" {
		// Validate invite token
		var invite entities.Invite
		if err := h.DB.Where("token = ? AND retro_id = ? AND expires_at > ?", inviteToken, retroID, time.Now()).First(&invite).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusForbidden, gin.H{"error": "Invalid or expired invite token"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to validate invite"})
			return
		}
	}

	// Create guest user
	tempToken := uuid.New().String()
	guest := entities.NewGuest(req.Name, "", tempToken)

	if err := h.DB.Create(guest).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create guest user"})
		return
	}

	// Add guest as participant
	participant := entities.NewRetroParticipant(retroID, nil, &guest.ID)
	if err := h.DB.Create(participant).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add guest as participant"})
		return
	}

	response := gin.H{
		"success": true,
		"guestUser": GuestResponse{
			ID:        guest.ID.String(),
			Name:      guest.Name,
			TempToken: guest.TempToken,
		},
	}

	// Emit websocket event for real-time updates
	if h.Socket != nil {
		h.Socket.BroadcastToRoom("/", retroID.String(), "guest-joined", map[string]interface{}{
			"tableId": retroID.String(),
			"guest": gin.H{
				"id":   guest.ID.String(),
				"name": guest.Name,
			},
		})
	}

	c.JSON(http.StatusCreated, response)
}

// LinkGuestToAccount links a guest account to a user account
func (h *TableHandler) LinkGuestToAccount(c *gin.Context) {
	var req LinkGuestRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Parse user ID
	userUUID, err := uuid.Parse(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	// Find guest
	var guest entities.Guest
	if err := h.DB.Where("temp_token = ?", req.GuestToken).First(&guest).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Guest not found"})
		return
	}

	// Update all guest participations to user participations
	if err := h.DB.Model(&entities.RetroParticipant{}).
		Where("guest_id = ?", guest.ID).
		Updates(map[string]interface{}{
			"guest_id": nil,
			"user_id":  userUUID,
		}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to link guest participations"})
		return
	}

	// Update all guest cards to user cards
	if err := h.DB.Model(&entities.RetroCard{}).
		Where("author_id = ? AND author_type = ?", guest.ID, "guest").
		Updates(map[string]interface{}{
			"author_id":   userUUID,
			"author_type": "user",
		}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to link guest cards"})
		return
	}

	// Update all guest votes to user votes
	if err := h.DB.Model(&entities.RetroCardVote{}).
		Where("voter_id = ? AND voter_type = ?", guest.ID, "guest").
		Updates(map[string]interface{}{
			"voter_id":   userUUID,
			"voter_type": "user",
		}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to link guest votes"})
		return
	}

	// Delete guest
	if err := h.DB.Delete(&guest).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete guest"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true})
}

// GetCards retrieves all cards for a table
func (h *TableHandler) GetCards(c *gin.Context) {
	tableID := c.Param("tableId")
	if tableID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Table ID is required"})
		return
	}

	// Parse table ID
	retroID, err := uuid.Parse(tableID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid table ID"})
		return
	}

	// Get all categories for this retro
	var categories []entities.RetroCategory
	if err := h.DB.Preload("Cards").Where("retro_id = ?", retroID).Order("\"order\" ASC").Find(&categories).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch categories"})
		return
	}

	// Build response
	response := make(map[string][]CardResponse)
	for _, category := range categories {
		cards := make([]CardResponse, 0)
		for _, card := range category.Cards {
			// Check if current user has voted on this card
			isVotedByMe := false

			userID := c.GetString("user_id")
			if userID != "" {
				userUUID, _ := uuid.Parse(userID)
				var vote entities.RetroCardVote
				if h.DB.Where("card_id = ? AND voter_id = ? AND voter_type = ?", card.ID, userUUID, "user").First(&vote).Error == nil {
					isVotedByMe = true
				}
			} else {
				guestToken := c.GetString("guest_token")
				if guestToken != "" {
					var guest entities.Guest
					if h.DB.Where("temp_token = ?", guestToken).First(&guest).Error == nil {
						var vote entities.RetroCardVote
						if h.DB.Where("card_id = ? AND voter_id = ? AND voter_type = ?", card.ID, guest.ID, "guest").First(&vote).Error == nil {
							isVotedByMe = true
						}
					}
				}
			}

			// Fetch author name
			var authorName string
			if card.IsAnonymous {
				authorName = "Anonymous"
			} else {
				if card.AuthorType == "user" {
					var user entities.User
					if err := h.DB.Where("id = ?", card.AuthorID).First(&user).Error; err == nil {
						authorName = user.Name
					} else {
						authorName = "Unknown User"
					}
				} else if card.AuthorType == "guest" {
					var guest entities.Guest
					if err := h.DB.Where("id = ?", card.AuthorID).First(&guest).Error; err == nil {
						authorName = guest.Name
					} else {
						authorName = "Unknown Guest"
					}
				}
			}

			// Only include AuthorID for the card creator
			var responseAuthorID *string
			if userID != "" {
				// For authenticated users, include AuthorID if they created the card
				userUUID, _ := uuid.Parse(userID)
				if card.AuthorType == "user" && userUUID == card.AuthorID {
					responseAuthorID = stringPtr(card.AuthorID.String())
				}
			} else {
				// For guest users, include AuthorID if they created the card
				guestToken := c.GetString("guest_token")
				if guestToken != "" {
					var guest entities.Guest
					if h.DB.Where("temp_token = ?", guestToken).First(&guest).Error == nil {
						if card.AuthorType == "guest" && guest.ID == card.AuthorID {
							responseAuthorID = stringPtr(card.AuthorID.String())
						}
					}
				}
			}

			cards = append(cards, CardResponse{
				ID:          card.ID.String(),
				Content:     card.Content,
				AuthorID:    responseAuthorID,
				AuthorType:  card.AuthorType,
				AuthorName:  authorName,
				CategoryID:  card.CategoryID.String(),
				Votes:       card.Votes,
				IsAnonymous: card.IsAnonymous,
				CreatedAt:   card.CreatedAt,
				IsVotedByMe: isVotedByMe,
			})
		}
		response[category.ID.String()] = cards
	}

	c.JSON(http.StatusOK, response)
}

// CreateTopic creates a new topic (category) for a table
func (h *TableHandler) CreateTopic(c *gin.Context) {
	tableID := c.Param("tableId")
	if tableID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Table ID is required"})
		return
	}

	// Check if user is owner
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Parse table ID
	retroID, err := uuid.Parse(tableID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid table ID"})
		return
	}

	// Verify table exists and user is owner
	var retro entities.Retro
	if err := h.DB.Where("id = ? AND owner_id = ?", retroID, userID).First(&retro).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Table not found or you don't have permission"})
		return
	}

	var req CreateTopicRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check for duplicate topic names
	var existingCategory entities.RetroCategory
	if err := h.DB.Where("retro_id = ? AND name ILIKE ?", retroID, req.Title).First(&existingCategory).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "A topic with this name already exists"})
		return
	}

	// Get the next order number
	var maxOrder int
	h.DB.Model(&entities.RetroCategory{}).Where("retro_id = ?", retroID).Select("COALESCE(MAX(\"order\"), 0)").Scan(&maxOrder)

	// Create new category
	category := entities.RetroCategory{
		ID:      uuid.New(),
		RetroID: retroID,
		Name:    req.Title,
		Color:   req.Color,
		Order:   maxOrder + 1,
	}

	if err := h.DB.Create(&category).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create topic"})
		return
	}

	response := TopicResponse{
		ID:    category.ID.String(),
		Title: category.Name,
		Color: category.Color,
		Order: category.Order,
	}

	// Emit websocket event for real-time updates
	if h.Socket != nil {
		h.Socket.BroadcastToRoom("/", retroID.String(), "topic-added", map[string]interface{}{
			"topic":   response,
			"tableId": retroID.String(),
		})
	}

	c.JSON(http.StatusCreated, response)
}

// UpdateTopic updates an existing topic
func (h *TableHandler) UpdateTopic(c *gin.Context) {
	tableID := c.Param("tableId")
	topicID := c.Param("topicId")
	if tableID == "" || topicID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Table ID and Topic ID are required"})
		return
	}

	// Check if user is owner
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Parse IDs
	retroID, err := uuid.Parse(tableID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid table ID"})
		return
	}

	categoryID, err := uuid.Parse(topicID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid topic ID"})
		return
	}

	// Verify table exists and user is owner
	var retro entities.Retro
	if err := h.DB.Where("id = ? AND owner_id = ?", retroID, userID).First(&retro).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Table not found or you don't have permission"})
		return
	}

	var req UpdateTopicRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if category exists and belongs to this retro
	var category entities.RetroCategory
	if err := h.DB.Where("id = ? AND retro_id = ?", categoryID, retroID).First(&category).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Topic not found"})
		return
	}

	// Check for duplicate topic names (excluding current topic)
	var existingCategory entities.RetroCategory
	if err := h.DB.Where("retro_id = ? AND name ILIKE ? AND id != ?", retroID, req.Title, categoryID).First(&existingCategory).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "A topic with this name already exists"})
		return
	}

	// Update category
	category.Name = req.Title
	category.Color = req.Color

	if err := h.DB.Save(&category).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update topic"})
		return
	}

	response := TopicResponse{
		ID:    category.ID.String(),
		Title: category.Name,
		Color: category.Color,
		Order: category.Order,
	}

	// Emit websocket event for real-time updates
	if h.Socket != nil {
		h.Socket.BroadcastToRoom("/", retroID.String(), "topic-updated", map[string]interface{}{
			"topic":   response,
			"tableId": retroID.String(),
		})
	}

	c.JSON(http.StatusOK, response)
}

// RemoveTopic removes a topic and deletes all its cards
func (h *TableHandler) RemoveTopic(c *gin.Context) {
	tableID := c.Param("tableId")
	topicID := c.Param("topicId")
	if tableID == "" || topicID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Table ID and Topic ID are required"})
		return
	}

	// Check if user is owner
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Parse IDs
	retroID, err := uuid.Parse(tableID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid table ID"})
		return
	}

	categoryID, err := uuid.Parse(topicID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid topic ID"})
		return
	}

	// Verify table exists and user is owner
	var retro entities.Retro
	if err := h.DB.Where("id = ? AND owner_id = ?", retroID, userID).First(&retro).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Table not found or you don't have permission"})
		return
	}

	// Check if category exists and belongs to this retro
	var category entities.RetroCategory
	if err := h.DB.Where("id = ? AND retro_id = ?", categoryID, retroID).First(&category).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Topic not found"})
		return
	}

	// Check if this is the last category
	var categoryCount int64
	if err := h.DB.Model(&entities.RetroCategory{}).Where("retro_id = ?", retroID).Count(&categoryCount).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check category count"})
		return
	}

	if categoryCount <= 1 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot remove the last topic. At least one topic must remain."})
		return
	}

	// Start a transaction
	tx := h.DB.Begin()

	// Delete all cards from this category
	if err := tx.Where("category_id = ?", categoryID).Delete(&entities.RetroCard{}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete cards"})
		return
	}

	// Delete the category
	if err := tx.Delete(&category).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to remove topic"})
		return
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to complete operation"})
		return
	}

	// Emit websocket event for real-time updates
	if h.Socket != nil {
		h.Socket.BroadcastToRoom("/", retroID.String(), "topic-removed", map[string]interface{}{
			"topicId": categoryID.String(),
			"tableId": retroID.String(),
		})
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Topic and all its cards removed successfully"})
}

func (h *TableHandler) DeleteCard(c *gin.Context) {
	cardID := c.Param("id")
	if cardID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Card ID is required"})
		return
	}

	// Get user info from context
	userID := c.GetString("user_id")
	guestID := c.GetString("guest_id")

	if userID == "" && guestID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Get the card with its category to check ownership
	var card entities.RetroCard
	if err := h.DB.Preload("Category").Where("id = ?", cardID).First(&card).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Card not found"})
		return
	}

	// Get the retro to check if user is owner
	var retro entities.Retro
	if err := h.DB.Where("id = ?", card.Category.RetroID).First(&retro).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Table not found"})
		return
	}

	// Only the table owner can delete cards
	if retro.OwnerID.String() != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only the table owner can delete cards"})
		return
	}

	// Delete the card
	if err := h.DB.Delete(&card).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete card"})
		return
	}

	// Emit socket event for real-time updates
	if h.Socket != nil {
		h.Socket.BroadcastToRoom("/", fmt.Sprintf("table_%s", retro.ID.String()), "card-deleted", gin.H{
			"tableId": retro.ID.String(),
			"cardId":  cardID,
		})
	}

	c.JSON(http.StatusOK, gin.H{"success": true})
}
