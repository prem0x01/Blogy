package middleware

import (
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// Exported constants so they can be used in other packages
const (
	// RequestIDKey is the key used to store the request ID in the context
	RequestIDKey = "X-Request-ID-Key"
	// RequestIDHeader is the header key for request ID
	RequestIDHeader = "X-Request-ID"
)

// RequestID middleware adds a request ID to each request
func RequestID() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Check if request ID is already set
		requestID := c.GetHeader(RequestIDHeader)
		if requestID == "" {
			requestID = uuid.New().String()
		}

		// Set request ID in context and header
		c.Set(RequestIDKey, requestID)
		c.Header(RequestIDHeader, requestID)

		c.Next()
	}
}
