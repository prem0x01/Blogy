package config

import (
	"os"
	"time"
)

type Config struct {
	Port           string
	JWTSecret      string
	JWTExpiry      time.Duration
	RefreshExpiry  time.Duration
	DatabaseURL    string
	AllowedOrigins []string
	Environment    string
	RateLimit      int
	MaxUploadSize  int64
}

func Load() *Config {
	return &Config{
		Port:           getEnvOrDefault("PORT", "8080"),
		JWTSecret:      os.Getenv("JWT_SECRET"),
		JWTExpiry:      24 * time.Hour,
		RefreshExpiry:  7 * 24 * time.Hour,
		DatabaseURL:    getEnvOrDefault("DATABASE_URL", "./blog.db"),
		AllowedOrigins: []string{"http://localhost:5173"},
		Environment:    getEnvOrDefault("ENV", "development"),
		RateLimit:      100,     // requests per minute
		MaxUploadSize:  5 << 20, // 5MB
	}
}

func getEnvOrDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
