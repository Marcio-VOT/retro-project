package jwt

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

// JWTMiddleware returns a Gin middleware that validates JWT tokens
func JWTMiddleware(jwtService *JWTService) gin.HandlerFunc {
	return func(c *gin.Context) {
		header := c.GetHeader("Authorization")
		if header == "" || !strings.HasPrefix(header, "Bearer ") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Missing or invalid Authorization header"})
			return
		}

		tokenString := strings.TrimPrefix(header, "Bearer ")
		claims, err := jwtService.ValidateToken(tokenString)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
			return
		}

		// Attach user info to context
		c.Set("user_id", claims.UserID)
		c.Set("user_email", claims.Email)
		c.Set("user_name", claims.Name)

		c.Next()
	}
}
