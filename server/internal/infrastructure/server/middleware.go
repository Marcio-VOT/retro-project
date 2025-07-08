package server

import (
	"strings"

	"retro-project/server/internal/infrastructure/jwt"

	"github.com/gin-gonic/gin"
)

// FlexibleAuthMiddleware handles both JWT authentication and guest tokens
func FlexibleAuthMiddleware(jwtService *jwt.JWTService) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Try JWT authentication first
		header := c.GetHeader("Authorization")
		if header != "" && strings.HasPrefix(header, "Bearer ") {
			tokenString := strings.TrimPrefix(header, "Bearer ")
			claims, err := jwtService.ValidateToken(tokenString)
			if err == nil {
				// Valid JWT token, set user info
				c.Set("user_id", claims.UserID)
				c.Set("user_email", claims.Email)
				c.Set("user_name", claims.Name)
				c.Set("auth_type", "jwt")
				c.Next()
				return
			}
		}

		// Check for guest token in Authorization header (Bearer guest:token)
		header = c.GetHeader("Authorization")
		if header != "" && strings.HasPrefix(header, "Bearer guest:") {
			guestToken := strings.TrimPrefix(header, "Bearer guest:")
			c.Set("guest_token", guestToken)
			c.Set("auth_type", "guest")
			c.Next()
			return
		}

		// Check for guest token in query parameters
		guestToken := c.Query("guestToken")
		if guestToken != "" {
			// Set guest token for later validation in the handler
			c.Set("guest_token", guestToken)
			c.Set("auth_type", "guest")
			c.Next()
			return
		}

		// Check for invite token in query parameters
		inviteToken := c.Query("inviteToken")
		if inviteToken != "" {
			// Set invite token for later validation in the handler
			c.Set("invite_token", inviteToken)
			c.Set("auth_type", "invite")
			c.Next()
			return
		}

		// No valid authentication found, but don't abort - let the handler decide
		c.Set("auth_type", "none")
		c.Next()
	}
}
