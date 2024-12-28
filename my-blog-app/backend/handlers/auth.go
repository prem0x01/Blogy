package handlers

import (
	"database/sql"
	"net/http"
	"time"

	"my-blog-app/backend/models"
	"my-blog-app/backend/utils"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

type AuthHandler struct {
	db        *sql.DB
	jwtSecret string
}

func NewAuthHandler(db *sql.DB, jwtSecret string) *AuthHandler {
	return &AuthHandler{
		db:        db,
		jwtSecret: jwtSecret,
	}
}

func (h *AuthHandler) Register(c *gin.Context) {
	var input models.UserInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid input format")
		return
	}

	// Validate input
	if err := utils.Validate.Struct(input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, utils.FormatValidationErrors(err))
		return
	}

	// Check if user exists
	exists, err := h.checkUserExists(input.Email, input.Username)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Database error")
		return
	}
	if exists {
		utils.ErrorResponse(c, http.StatusConflict, "User already exists")
		return
	}

	// Create user
	user := &models.User{
		Username:  input.Username,
		Email:     input.Email,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	// Hash password
	if err := user.SetPassword(input.Password); err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Password hashing failed")
		return
	}

	// Save user to database
	if err := h.createUser(user); err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to create user")
		return
	}

	// Generate tokens
	accessToken, refreshToken, err := h.generateTokenPair(user.ID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Token generation failed")
		return
	}

	utils.SuccessResponse(c, gin.H{
		"user":         user.Sanitize(),
		"accessToken":  accessToken,
		"refreshToken": refreshToken,
		"tokenType":    "Bearer",
		"expiresIn":    3600,
	})
}

func (h *AuthHandler) Login(c *gin.Context) {
	var input struct {
		Email    string `json:"email" validate:"required,email"`
		Password string `json:"password" validate:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid input format")
		return
	}

	// Get user by email
	user, err := h.getUserByEmail(input.Email)
	if err == sql.ErrNoRows {
		utils.ErrorResponse(c, http.StatusUnauthorized, "Invalid credentials")
		return
	} else if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Database error")
		return
	}

	// Check password
	if !user.CheckPassword(input.Password) {
		utils.ErrorResponse(c, http.StatusUnauthorized, "Invalid credentials")
		return
	}

	// Generate tokens
	accessToken, refreshToken, err := h.generateTokenPair(user.ID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Token generation failed")
		return
	}

	utils.SuccessResponse(c, gin.H{
		"user":         user.Sanitize(),
		"accessToken":  accessToken,
		"refreshToken": refreshToken,
		"tokenType":    "Bearer",
		"expiresIn":    3600,
	})
}

func (h *AuthHandler) RefreshToken(c *gin.Context) {
	var input struct {
		RefreshToken string `json:"refreshToken" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid input format")
		return
	}

	// Parse and validate refresh token
	token, err := jwt.Parse(input.RefreshToken, func(token *jwt.Token) (interface{}, error) {
		return []byte(h.jwtSecret), nil
	})

	if err != nil || !token.Valid {
		utils.ErrorResponse(c, http.StatusUnauthorized, "Invalid refresh token")
		return
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		utils.ErrorResponse(c, http.StatusUnauthorized, "Invalid token claims")
		return
	}

	userID := int64(claims["user_id"].(float64))
	tokenType := claims["type"].(string)

	if tokenType != "refresh" {
		utils.ErrorResponse(c, http.StatusUnauthorized, "Invalid token type")
		return
	}

	// Generate new token pair
	accessToken, refreshToken, err := h.generateTokenPair(userID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Token generation failed")
		return
	}

	utils.SuccessResponse(c, gin.H{
		"accessToken":  accessToken,
		"refreshToken": refreshToken,
		"tokenType":    "Bearer",
		"expiresIn":    3600,
	})
}

// Helper methods
func (h *AuthHandler) generateTokenPair(userID int64) (string, string, error) {
	// Generate access token
	accessToken := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": userID,
		"type":    "access",
		"exp":     time.Now().Add(time.Hour).Unix(),
	})

	accessTokenString, err := accessToken.SignedString([]byte(h.jwtSecret))
	if err != nil {
		return "", "", err
	}

	// Generate refresh token
	refreshToken := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": userID,
		"type":    "refresh",
		"exp":     time.Now().Add(7 * 24 * time.Hour).Unix(),
	})

	refreshTokenString, err := refreshToken.SignedString([]byte(h.jwtSecret))
	if err != nil {
		return "", "", err
	}

	return accessTokenString, refreshTokenString, nil
}

// Database helper methods
func (h *AuthHandler) checkUserExists(email, username string) (bool, error) {
	var exists bool
	query := `SELECT EXISTS(SELECT 1 FROM users WHERE email = ? OR username = ?)`
	err := h.db.QueryRow(query, email, username).Scan(&exists)
	return exists, err
}

func (h *AuthHandler) createUser(user *models.User) error {
	query := `
		INSERT INTO users (username, email, password_hash, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?)
	`
	result, err := h.db.Exec(query,
		user.Username,
		user.Email,
		user.PasswordHash,
		user.CreatedAt,
		user.UpdatedAt,
	)
	if err != nil {
		return err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return err
	}

	user.ID = id
	return nil
}

func (h *AuthHandler) getUserByEmail(email string) (*models.User, error) {
	user := &models.User{}
	query := `
		SELECT id, username, email, password_hash, created_at, updated_at
		FROM users
		WHERE email = ?
	`
	err := h.db.QueryRow(query, email).Scan(
		&user.ID,
		&user.Username,
		&user.Email,
		&user.PasswordHash,
		&user.CreatedAt,
		&user.UpdatedAt,
	)
	return user, err
}