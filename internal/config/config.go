package config

import (
	"os"
	"time"
)

type Config struct {
	Port                string
	JWTSecret           string
	AccessTokenExpiry   time.Duration
	RefreshTokenExpiry  time.Duration
	EnableTokenRotation bool
	CORSAllowOrigins    []string
}

func New() *Config {
	return &Config{
		Port:                getEnv("PORT", "8080"),
		JWTSecret:           getEnv("JWT_SECRET", "your-super-secret-jwt-key-change-this-in-production"),
		AccessTokenExpiry:   time.Minute * 2,
		RefreshTokenExpiry:  time.Minute * 30,
		EnableTokenRotation: true,
		CORSAllowOrigins:    []string{"http://localhost:3000", "http://localhost:5173"},
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
