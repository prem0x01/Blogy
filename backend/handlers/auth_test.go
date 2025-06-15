package handlers

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/prem0x01/Blogy/models"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/suite"

	// For SQLite in-memory database testing
	_ "github.com/mattn/go-sqlite3"
)

// Learning by doing ft prem0x01

// ===== TESTING FUNDAMENTALS =====
// Go testing uses the testing package and functions that start with Test
// Test files must end with _test.go
// Test functions must have signature: func TestXxx(t *testing.T)

// ===== TEST SUITE PATTERN =====
// Using testify/suite for organized, setup/teardown testing
// Suite pattern is excellent for integration tests with shared setup
type AuthHandlerTestSuite struct {
	suite.Suite         // Embed testify suite
	db          *sql.DB // Test database
	handler     *AuthHandler
	router      *gin.Engine
}

// SetupSuite runs once before all tests in the suite
func (suite *AuthHandlerTestSuite) SetupSuite() {
	// create in-memory sqlite database for testing
	// In memory DB is perfect for tests  fast, isolated, no cleanup needed
	db, err := sql.Open("sqlite3", ":memory:")
	suite.Require().NoError(err, "Failed to create test database")

	// create users table schema
	createTableQuery := `
		CREATE TABLE users (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			username TEXT UNIQUE NOT NULL,
			email TEXT UNIQUE NOT NULL,
			password_hash TEXT NOT NULL,
			created_at DATETIME NOT NULL,
			updated_at DATETIME NOT NULL
		)
	`
	_, err = db.Exec(createTableQuery)
	suite.Require().NoError(err, "Failed to create users table")

	suite.db = db
	suite.handler = NewAuthHandler(db, "test-secret-key")

	// setup gin router in test mode
	gin.SetMode(gin.TestMode)
	suite.router = gin.New()

	// register routes
	auth := suite.router.Group("/auth")
	{
		auth.POST("/register", suite.handler.Register)
		auth.POST("/login", suite.handler.Login)
		auth.POST("/refresh", suite.handler.RefreshToken)
	}
}

// TearDownSuite runs once after all tests in the suite
func (suite *AuthHandlerTestSuite) TearDownSuite() {
	if suite.db != nil {
		suite.db.Close()
	}
}

// SetupTest runs before each individual test
func (suite *AuthHandlerTestSuite) SetupTest() {
	// Clean up database before each test for isolation
	// This ensures each test starts with a clean state
	_, err := suite.db.Exec("DELETE FROM users")
	suite.Require().NoError(err, "Failed to clean test database")
}

// ===== HELPER FUNCTIONS =====
// Helper functions make tests more readable and reduce duplication
// Always create helpers for common operations

// createTestUser is a helper to create a user in the database for testing
func (suite *AuthHandlerTestSuite) createTestUser(username, email, password string) *models.User {
	user := &models.User{
		Username:  username,
		Email:     email,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	err := user.SetPassword(password)
	suite.Require().NoError(err, "Failed to set password")

	err = suite.handler.createUser(user)
	suite.Require().NoError(err, "Failed to create test user")

	return user
}

// makeRequest is a helper to make HTTP requests to our test server
func (suite *AuthHandlerTestSuite) makeRequest(method, url string, body interface{}) *httptest.ResponseRecorder {
	var reqBody []byte
	var err error

	if body != nil {
		reqBody, err = json.Marshal(body)
		suite.Require().NoError(err, "Failed to marshal request body")
	}

	req := httptest.NewRequest(method, url, bytes.NewBuffer(reqBody))
	req.Header.Set("Content-Type", "application/json")

	// ResponseRecorder implements http.ResponseWriter and records the response
	w := httptest.NewRecorder()
	suite.router.ServeHTTP(w, req)

	return w
}

// parseJSONResponse is a helper to parse JSON responses
func (suite *AuthHandlerTestSuite) parseJSONResponse(w *httptest.ResponseRecorder, target interface{}) {
	err := json.Unmarshal(w.Body.Bytes(), target)
	suite.Require().NoError(err, "Failed to parse JSON response")
}

// ===== REGISTER ENDPOINT TESTS =====

// TestRegister_Success tests the happy path for user registration
func (suite *AuthHandlerTestSuite) TestRegister_Success() {
	// ARRANGE: Set up test data
	// The AAA pattern: Arrange, Act, Assert is fundamental in testing
	requestBody := models.UserInput{
		Username: "testuser22",
		Email:    "test22@example.com",
		Password: "StrongP@ss123",
	}

	// ACT: Perform the operation being tested
	w := suite.makeRequest("POST", "/auth/register", requestBody)

	// ASSERT: Verify the results
	// Test HTTP status code
	suite.Equal(http.StatusOK, w.Code)

	// Parse and verify response structure
	var response map[string]interface{}
	suite.parseJSONResponse(w, &response)

	// Verify response contains expected fields
	suite.Contains(response, "user")
	suite.Contains(response, "accessToken")
	suite.Contains(response, "refreshToken")
	suite.Contains(response, "tokenType")
	suite.Contains(response, "expiresIn")

	// Verify token type and expiry
	suite.Equal("Bearer", response["tokenType"])
	suite.Equal(float64(3600), response["expiresIn"]) // JSON numbers are float64

	// Verify user data
	userData := response["user"].(map[string]interface{})
	suite.Equal("testuser", userData["username"])
	suite.Equal("test@example.com", userData["email"])
	suite.NotContains(userData, "password") // Ensure password is not returned

	// Verify user was actually created in database
	var count int
	err := suite.db.QueryRow("SELECT COUNT(*) FROM users WHERE username = ?", "testuser").Scan(&count)
	suite.NoError(err)
	suite.Equal(1, count)
}

// TestRegister_InvalidInput tests validation errors
func (suite *AuthHandlerTestSuite) TestRegister_InvalidInput() {
	// Test multiple invalid input scenarios
	testCases := []struct {
		name           string
		input          interface{}
		expectedStatus int
		description    string
	}{
		{
			name:           "missing_username",
			input:          map[string]string{"email": "test@example.com", "password": "password123"},
			expectedStatus: http.StatusBadRequest,
			description:    "Should fail when username is missing",
		},
		{
			name:           "invalid_email",
			input:          models.UserInput{Username: "testuser", Email: "invalid-email", Password: "password123"},
			expectedStatus: http.StatusBadRequest,
			description:    "Should fail with invalid email format",
		},
		{
			name:           "short_password",
			input:          models.UserInput{Username: "testuser", Email: "test@example.com", Password: "123"},
			expectedStatus: http.StatusBadRequest,
			description:    "Should fail with short password",
		},
		{
			name:           "invalid_json",
			input:          "invalid json",
			expectedStatus: http.StatusBadRequest,
			description:    "Should fail with malformed JSON",
		},
	}

	// Table-driven tests: efficient way to test multiple scenarios
	for _, tc := range testCases {
		suite.Run(tc.name, func() {
			w := suite.makeRequest("POST", "/auth/register", tc.input)
			suite.Equal(tc.expectedStatus, w.Code, tc.description)

			// Verify error response structure
			var response map[string]interface{}
			suite.parseJSONResponse(w, &response)
			suite.Contains(response, "error", "Error response should contain error field")
		})
	}
}

// TestRegister_DuplicateUser tests duplicate user scenarios
func (suite *AuthHandlerTestSuite) TestRegister_DuplicateUser() {
	// Create existing user
	suite.createTestUser("existinguser", "existing@example.com", "password123")

	testCases := []struct {
		name     string
		username string
		email    string
	}{
		{"duplicate_username", "existinguser", "different@example.com"},
		{"duplicate_email", "differentuser", "existing@example.com"},
		{"duplicate_both", "existinguser", "existing@example.com"},
	}

	for _, tc := range testCases {
		suite.Run(tc.name, func() {
			requestBody := models.UserInput{
				Username: tc.username,
				Email:    tc.email,
				Password: "password123",
			}

			w := suite.makeRequest("POST", "/auth/register", requestBody)
			suite.Equal(http.StatusConflict, w.Code)

			var response map[string]interface{}
			suite.parseJSONResponse(w, &response)
			suite.Contains(response, "error")
			suite.Equal("User already exists", response["error"])
		})
	}
}

// ===== LOGIN ENDPOINT TESTS =====

func (suite *AuthHandlerTestSuite) TestLogin_Success() {
	// Create test user first
	testPassword := "password123"
	user := suite.createTestUser("loginuser", "login@example.com", testPassword)

	requestBody := map[string]string{
		"username": user.Username,
		"email":    user.Email,
		"password": testPassword,
	}

	w := suite.makeRequest("POST", "/auth/login", requestBody)
	suite.Equal(http.StatusOK, w.Code)

	var response map[string]interface{}
	suite.parseJSONResponse(w, &response)

	// Verify response structure
	suite.Contains(response, "user")
	suite.Contains(response, "accessToken")
	suite.Contains(response, "refreshToken")

	// Verify tokens are valid JWT tokens
	accessToken := response["accessToken"].(string)
	suite.NotEmpty(accessToken)

	// Parse JWT token to verify structure
	token, err := jwt.Parse(accessToken, func(token *jwt.Token) (interface{}, error) {
		return []byte("test-secret-key"), nil
	})
	suite.NoError(err)
	suite.True(token.Valid)

	// Verify token claims
	claims := token.Claims.(jwt.MapClaims)
	suite.Equal("access", claims["type"])
	suite.Equal(float64(user.ID), claims["user_id"])
}

func (suite *AuthHandlerTestSuite) TestLogin_InvalidCredentials() {
	// Create test user
	user := suite.createTestUser("loginuser", "login@example.com", "password123")

	testCases := []struct {
		name     string
		username string
		email    string
		password string
	}{
		{"wrong_password", user.Username, user.Email, "wrongpassword"},
		{"wrong_username", "wronguser", user.Email, "password123"},
		{"wrong_email", user.Username, "wrong@example.com", "password123"},
		{"user_not_exists", "nonexistent", "nonexistent@example.com", "password123"},
	}

	for _, tc := range testCases {
		suite.Run(tc.name, func() {
			requestBody := map[string]string{
				"username": tc.username,
				"email":    tc.email,
				"password": tc.password,
			}

			w := suite.makeRequest("POST", "/auth/login", requestBody)
			suite.Equal(http.StatusUnauthorized, w.Code)

			var response map[string]interface{}
			suite.parseJSONResponse(w, &response)
			suite.Contains(response, "error")
			suite.Equal("Invalid credentials", response["error"])
		})
	}
}

// ===== REFRESH TOKEN TESTS =====

func (suite *AuthHandlerTestSuite) TestRefreshToken_Success() {
	// Create test user and generate initial tokens
	user := suite.createTestUser("refreshuser", "refresh@example.com", "password123")
	_, refreshToken, err := suite.handler.generateTokenPair(user.ID)
	suite.NoError(err)

	requestBody := map[string]string{
		"refreshToken": refreshToken,
	}

	w := suite.makeRequest("POST", "/auth/refresh", requestBody)
	suite.Equal(http.StatusOK, w.Code)

	var response map[string]interface{}
	suite.parseJSONResponse(w, &response)

	suite.Contains(response, "accessToken")
	suite.Contains(response, "refreshToken")
	suite.Equal("Bearer", response["tokenType"])
	suite.Equal(float64(3600), response["expiresIn"])

	// Verify new tokens are different from original (security best practice)
	newRefreshToken := response["refreshToken"].(string)
	suite.NotEqual(refreshToken, newRefreshToken)
}

func (suite *AuthHandlerTestSuite) TestRefreshToken_InvalidToken() {
	testCases := []struct {
		name  string
		token string
	}{
		{"invalid_jwt", "invalid.jwt.token"},
		{"empty_token", ""},
		{"expired_token", suite.generateExpiredToken()},
		{"access_token_instead_of_refresh", suite.generateAccessToken()},
	}

	for _, tc := range testCases {
		suite.Run(tc.name, func() {
			requestBody := map[string]string{
				"refreshToken": tc.token,
			}

			w := suite.makeRequest("POST", "/auth/refresh", requestBody)
			suite.Equal(http.StatusUnauthorized, w.Code)
		})
	}
}

// ===== UNIT TESTS FOR PRIVATE METHODS =====
// Testing private methods directly for thorough coverage

func (suite *AuthHandlerTestSuite) TestCheckUserExists() {
	// Test when user doesn't exist
	exists, err := suite.handler.checkUserExists("nonexistent@example.com", "nonexistent")
	suite.NoError(err)
	suite.False(exists)

	// Create user and test when user exists
	suite.createTestUser("testuser", "test@example.com", "password123")

	// Test existing email
	exists, err = suite.handler.checkUserExists("test@example.com", "differentuser")
	suite.NoError(err)
	suite.True(exists)

	// Test existing username
	exists, err = suite.handler.checkUserExists("different@example.com", "testuser")
	suite.NoError(err)
	suite.True(exists)
}

func (suite *AuthHandlerTestSuite) TestGenerateTokenPair() {
	userID := int64(123)

	accessToken, refreshToken, err := suite.handler.generateTokenPair(userID)
	suite.NoError(err)
	suite.NotEmpty(accessToken)
	suite.NotEmpty(refreshToken)
	suite.NotEqual(accessToken, refreshToken)

	// Verify access token claims
	token, err := jwt.Parse(accessToken, func(token *jwt.Token) (interface{}, error) {
		return []byte("test-secret-key"), nil
	})
	suite.NoError(err)

	claims := token.Claims.(jwt.MapClaims)
	suite.Equal(float64(userID), claims["user_id"])
	suite.Equal("access", claims["type"])

	// Verify refresh token claims
	token, err = jwt.Parse(refreshToken, func(token *jwt.Token) (interface{}, error) {
		return []byte("test-secret-key"), nil
	})
	suite.NoError(err)

	claims = token.Claims.(jwt.MapClaims)
	suite.Equal(float64(userID), claims["user_id"])
	suite.Equal("refresh", claims["type"])
}

// ===== HELPER METHODS FOR COMPLEX TEST SCENARIOS =====

func (suite *AuthHandlerTestSuite) generateExpiredToken() string {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": int64(123),
		"type":    "refresh",
		"exp":     time.Now().Add(-time.Hour).Unix(), // Expired 1 hour ago
	})
	tokenString, _ := token.SignedString([]byte("test-secret-key"))
	return tokenString
}

func (suite *AuthHandlerTestSuite) generateAccessToken() string {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": int64(123),
		"type":    "access", // Wrong type - should be refresh
		"exp":     time.Now().Add(time.Hour).Unix(),
	})
	tokenString, _ := token.SignedString([]byte("test-secret-key"))
	return tokenString
}

// ===== BENCHMARK TESTS =====
// Benchmarks measure performance - useful for optimization
func BenchmarkAuthHandler_Register(b *testing.B) {
	// Setup
	db, _ := sql.Open("sqlite3", ":memory:")
	defer db.Close()

	createTableQuery := `
		CREATE TABLE users (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			username TEXT UNIQUE NOT NULL,
			email TEXT UNIQUE NOT NULL,
			password_hash TEXT NOT NULL,
			created_at DATETIME NOT NULL,
			updated_at DATETIME NOT NULL
		)
	`
	db.Exec(createTableQuery)

	handler := NewAuthHandler(db, "test-secret")
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.POST("/register", handler.Register)

	// Benchmark loop
	b.ResetTimer() // Don't count setup time
	for i := 0; i < b.N; i++ {
		b.StopTimer() // Don't count test data preparation

		// Clean database
		db.Exec("DELETE FROM users")

		// Prepare request
		requestBody := models.UserInput{
			Username: "testuser",
			Email:    "test@example.com",
			Password: "password123",
		}
		bodyBytes, _ := json.Marshal(requestBody)
		req := httptest.NewRequest("POST", "/register", bytes.NewBuffer(bodyBytes))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		b.StartTimer() // Start timing the actual operation
		router.ServeHTTP(w, req)
		// Timer stops automatically at the end of iteration
	}
}

// ===== MOCK TESTING EXAMPLE =====
// Mocking is useful when you want to isolate units and control dependencies

// MockDB demonstrates how to mock database operations
type MockDB struct {
	mock.Mock
}

func (m *MockDB) QueryRow(query string, args ...interface{}) *sql.Row {
	// This is a simplified example
	args_called := m.Called(query, args)
	return args_called.Get(0).(*sql.Row)
}

// Example test using mocks
func TestWithMockDatabase(t *testing.T) {
	mockDB := new(MockDB)

	// Set expectations
	mockDB.On("QueryRow", mock.AnythingOfType("string"), mock.Anything).Return(&sql.Row{})
}

// ===== INTEGRATION TEST EXAMPLE =====
// Integration tests test multiple components working together
func TestAuthFlow_Integration(t *testing.T) {
	// This test verifies the complete auth flow: register -> login -> refresh

	// Setup
	db, err := sql.Open("sqlite3", ":memory:")
	assert.NoError(t, err)
	defer db.Close()

	createTableQuery := `
		CREATE TABLE users (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			username TEXT UNIQUE NOT NULL,
			email TEXT UNIQUE NOT NULL,
			password_hash TEXT NOT NULL,
			created_at DATETIME NOT NULL,
			updated_at DATETIME NOT NULL
		)
	`
	_, err = db.Exec(createTableQuery)
	assert.NoError(t, err)

	handler := NewAuthHandler(db, "integration-test-secret")
	gin.SetMode(gin.TestMode)
	router := gin.New()

	auth := router.Group("/auth")
	{
		auth.POST("/register", handler.Register)
		auth.POST("/login", handler.Login)
		auth.POST("/refresh", handler.RefreshToken)
	}

	// Step 1: Register
	registerBody := models.UserInput{
		Username: "integrationuser",
		Email:    "integration@example.com",
		Password: "password123",
	}

	bodyBytes, _ := json.Marshal(registerBody)
	req := httptest.NewRequest("POST", "/auth/register", bytes.NewBuffer(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var registerResponse map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &registerResponse)

	// Step 2: Login with registered credentials
	loginBody := map[string]string{
		"username": "integrationuser",
		"email":    "integration@example.com",
		"password": "password123",
	}

	bodyBytes, _ = json.Marshal(loginBody)
	req = httptest.NewRequest("POST", "/auth/login", bytes.NewBuffer(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var loginResponse map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &loginResponse)

	// Step 3: Use refresh token to get new tokens
	refreshBody := map[string]string{
		"refreshToken": loginResponse["refreshToken"].(string),
	}

	bodyBytes, _ = json.Marshal(refreshBody)
	req = httptest.NewRequest("POST", "/auth/refresh", bytes.NewBuffer(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	// Verify complete flow worked
	var refreshResponse map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &refreshResponse)
	assert.Contains(t, refreshResponse, "accessToken")
	assert.Contains(t, refreshResponse, "refreshToken")
}

// ===== RUNNING THE SUITE =====
// This function runs all suite tests
func TestAuthHandlerSuite(t *testing.T) {
	suite.Run(t, new(AuthHandlerTestSuite))
}

// ===== SIMPLE UNIT TESTS (Alternative to Suite Pattern) =====
// Sometimes simple unit tests are preferred for specific functions

func TestNewAuthHandler(t *testing.T) {
	db, _ := sql.Open("sqlite3", ":memory:")
	defer db.Close()

	handler := NewAuthHandler(db, "test-secret")

	// Use testify/assert for clean assertions
	assert.NotNil(t, handler)
	assert.Equal(t, db, handler.db)
	assert.Equal(t, "test-secret", handler.jwtSecret)
}
