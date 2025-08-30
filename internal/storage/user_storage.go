package storage

import (
	"errors"
	"rotate-token-demo/internal/models"
	"sync"
	"time"
)

var (
	ErrUserNotFound = errors.New("user not found")
	ErrUserExists   = errors.New("user already exists")
)

type UserStorage interface {
	CreateUser(user *models.User) error
	GetUserByID(id string) (*models.User, error)
	GetUserByUsername(username string) (*models.User, error)
	GetUserByEmail(email string) (*models.User, error)
	UpdateUser(user *models.User) error
	UpdateLastLogin(userID string) error
	DeleteUser(id string) error
	ListUsers() ([]*models.User, error)
}

type InMemoryUserStorage struct {
	users map[string]*models.User
	mu    sync.RWMutex
}

func NewInMemoryUserStorage() *InMemoryUserStorage {
	return &InMemoryUserStorage{
		users: make(map[string]*models.User),
	}
}

func (s *InMemoryUserStorage) CreateUser(user *models.User) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	for _, existingUser := range s.users {
		if existingUser.Username == user.Username || existingUser.Email == user.Email {
			return ErrUserExists
		}
	}

	s.users[user.ID] = user
	return nil
}

func (s *InMemoryUserStorage) GetUserByID(id string) (*models.User, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	user, exists := s.users[id]
	if !exists {
		return nil, ErrUserNotFound
	}
	return user, nil
}

func (s *InMemoryUserStorage) GetUserByUsername(username string) (*models.User, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	for _, user := range s.users {
		if user.Username == username {
			return user, nil
		}
	}
	return nil, ErrUserNotFound
}

func (s *InMemoryUserStorage) GetUserByEmail(email string) (*models.User, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	for _, user := range s.users {
		if user.Email == email {
			return user, nil
		}
	}
	return nil, ErrUserNotFound
}

func (s *InMemoryUserStorage) UpdateUser(user *models.User) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if _, exists := s.users[user.ID]; !exists {
		return ErrUserNotFound
	}

	s.users[user.ID] = user
	return nil
}

func (s *InMemoryUserStorage) UpdateLastLogin(userID string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	user, exists := s.users[userID]
	if !exists {
		return ErrUserNotFound
	}

	user.LastLogin = time.Now()
	return nil
}

func (s *InMemoryUserStorage) DeleteUser(id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if _, exists := s.users[id]; !exists {
		return ErrUserNotFound
	}

	delete(s.users, id)
	return nil
}

func (s *InMemoryUserStorage) ListUsers() ([]*models.User, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	users := make([]*models.User, 0, len(s.users))
	for _, user := range s.users {
		users = append(users, user)
	}
	return users, nil
}
