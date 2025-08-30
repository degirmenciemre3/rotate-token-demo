package main

import (
	"log"
	"rotate-token-demo/internal/api"
	"rotate-token-demo/internal/config"
	"rotate-token-demo/internal/models"
	"rotate-token-demo/internal/service"
	"rotate-token-demo/internal/storage"
	"time"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

func main() {
	cfg := config.New()

	userStorage := storage.NewInMemoryUserStorage()
	tokenStorage := storage.NewInMemoryTokenStorage()
	qrStorage := storage.NewInMemoryQRCodeStorage()

	createDemoUser(userStorage)

	authService := service.NewAuthService(userStorage, tokenStorage, cfg)
	qrService := service.NewQRCodeService(qrStorage, userStorage, tokenStorage, authService)

	server := api.NewServer(authService, qrService, cfg)

	if err := server.Start(); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}

func createDemoUser(userStorage storage.UserStorage) {
	// Check if demo user already exists
	if _, err := userStorage.GetUserByUsername("demo"); err == nil {
		log.Printf("Demo user already exists")
		return
	}

	// Create demo user
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
	if err != nil {
		log.Printf("Failed to hash password for demo user: %v", err)
		return
	}

	demoUser := &models.User{
		ID:       uuid.New().String(),
		Username: "demo",
		Email:    "demo@example.com",
		Password: string(hashedPassword),
		CreateAt: time.Now(),
	}

	if err := userStorage.CreateUser(demoUser); err != nil {
		log.Printf("Failed to create demo user: %v", err)
		return
	}
}
