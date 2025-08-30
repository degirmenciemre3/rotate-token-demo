package storage

import (
	"errors"
	"rotate-token-demo/internal/models"
	"sync"
	"time"
)

var (
	ErrTokenNotFound = errors.New("token not found")
	ErrTokenExpired  = errors.New("token expired")
	ErrTokenRevoked  = errors.New("token revoked")
)

type TokenStorage interface {
	StoreRefreshToken(token *models.RefreshToken) error
	GetRefreshToken(tokenString string) (*models.RefreshToken, error)
	RevokeRefreshToken(tokenString string) error
	RevokeAllUserTokens(userID string) error
	RevokeTokenFamily(tokenFamily string) error
	CleanupExpiredTokens() error
	GetUserTokens(userID string) ([]*models.RefreshToken, error)
	GetAllTokens() ([]*models.RefreshToken, error)
}

type InMemoryTokenStorage struct {
	tokens map[string]*models.RefreshToken
	mu     sync.RWMutex
}

func NewInMemoryTokenStorage() *InMemoryTokenStorage {
	storage := &InMemoryTokenStorage{
		tokens: make(map[string]*models.RefreshToken),
	}

	go storage.periodicCleanup()

	return storage
}

func (s *InMemoryTokenStorage) StoreRefreshToken(token *models.RefreshToken) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.tokens[token.Token] = token
	return nil
}

func (s *InMemoryTokenStorage) GetRefreshToken(tokenString string) (*models.RefreshToken, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	token, exists := s.tokens[tokenString]
	if !exists {
		return nil, ErrTokenNotFound
	}

	if token.IsRevoked {
		return nil, ErrTokenRevoked
	}

	if time.Now().After(token.ExpiresAt) {
		return nil, ErrTokenExpired
	}

	return token, nil
}

func (s *InMemoryTokenStorage) RevokeRefreshToken(tokenString string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	token, exists := s.tokens[tokenString]
	if !exists {
		return ErrTokenNotFound
	}

	token.IsRevoked = true
	return nil
}

func (s *InMemoryTokenStorage) RevokeAllUserTokens(userID string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	for _, token := range s.tokens {
		if token.UserID == userID {
			token.IsRevoked = true
		}
	}
	return nil
}

func (s *InMemoryTokenStorage) RevokeTokenFamily(tokenFamily string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	for _, token := range s.tokens {
		if token.TokenFamily == tokenFamily {
			token.IsRevoked = true
		}
	}
	return nil
}

func (s *InMemoryTokenStorage) CleanupExpiredTokens() error {
	s.mu.Lock()
	defer s.mu.Unlock()

	now := time.Now()
	for tokenString, token := range s.tokens {
		if now.After(token.ExpiresAt) {
			delete(s.tokens, tokenString)
		}
	}
	return nil
}

func (s *InMemoryTokenStorage) GetUserTokens(userID string) ([]*models.RefreshToken, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var tokens []*models.RefreshToken
	for _, token := range s.tokens {
		if token.UserID == userID {
			tokens = append(tokens, token)
		}
	}
	return tokens, nil
}

func (s *InMemoryTokenStorage) periodicCleanup() {
	ticker := time.NewTicker(1 * time.Hour)
	defer ticker.Stop()

	for range ticker.C {
		s.CleanupExpiredTokens()
	}
}

func (s *InMemoryTokenStorage) GetAllTokens() ([]*models.RefreshToken, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	tokens := make([]*models.RefreshToken, 0, len(s.tokens))
	for _, token := range s.tokens {
		tokens = append(tokens, token)
	}
	return tokens, nil
}
