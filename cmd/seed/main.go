package main

import (
	"log"
	"rotate-token-demo/internal/models"
	"rotate-token-demo/internal/storage"
	"time"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

func main() {
	userStorage := storage.NewInMemoryUserStorage()

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
	if err != nil {
		log.Fatal("Failed to hash password:", err)
	}

	demoUser := &models.User{
		ID:       uuid.New().String(),
		Username: "demo",
		Email:    "demo@example.com",
		Password: string(hashedPassword),
		CreateAt: time.Now(),
	}

	if err := userStorage.CreateUser(demoUser); err != nil {
		log.Fatal("Failed to create demo user:", err)
	}
}
