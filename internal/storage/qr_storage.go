package storage

import (
	"errors"
	"rotate-token-demo/internal/models"
	"sync"
	"time"
)

var (
	ErrQRCodeNotFound = errors.New("QR code not found")
	ErrQRCodeExpired  = errors.New("QR code expired")
	ErrQRCodeUsed     = errors.New("QR code already used")
)

type QRCodeStorage interface {
	CreateQRCode(qrCode *models.QRCode) error
	GetQRCode(id string) (*models.QRCode, error)
	GetQRCodeByData(data string) (*models.QRCode, error)
	MarkQRCodeAsUsed(id string, ipAddress string) error
	GetAllQRCodes() ([]*models.QRCode, error)
	GetActiveQRCodes() ([]*models.QRCode, error)
	CleanupExpiredQRCodes() error
	DeleteQRCode(id string) error
}

type InMemoryQRCodeStorage struct {
	mu      sync.RWMutex
	qrCodes map[string]*models.QRCode
}

func NewInMemoryQRCodeStorage() *InMemoryQRCodeStorage {
	storage := &InMemoryQRCodeStorage{
		qrCodes: make(map[string]*models.QRCode),
	}

	// Start cleanup goroutine
	go storage.startCleanupRoutine()

	return storage
}

func (s *InMemoryQRCodeStorage) CreateQRCode(qrCode *models.QRCode) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.qrCodes[qrCode.ID] = qrCode
	return nil
}

func (s *InMemoryQRCodeStorage) GetQRCode(id string) (*models.QRCode, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	qrCode, exists := s.qrCodes[id]
	if !exists {
		return nil, ErrQRCodeNotFound
	}

	return qrCode, nil
}

func (s *InMemoryQRCodeStorage) GetQRCodeByData(data string) (*models.QRCode, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	for _, qrCode := range s.qrCodes {
		if qrCode.Data == data {
			return qrCode, nil
		}
	}

	return nil, ErrQRCodeNotFound
}

func (s *InMemoryQRCodeStorage) MarkQRCodeAsUsed(id string, ipAddress string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	qrCode, exists := s.qrCodes[id]
	if !exists {
		return ErrQRCodeNotFound
	}

	if qrCode.IsUsed {
		return ErrQRCodeUsed
	}

	if time.Now().After(qrCode.ExpiresAt) {
		return ErrQRCodeExpired
	}

	now := time.Now()
	qrCode.IsUsed = true
	qrCode.UsedAt = &now
	qrCode.IPAddress = ipAddress

	return nil
}

func (s *InMemoryQRCodeStorage) GetAllQRCodes() ([]*models.QRCode, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var qrCodes []*models.QRCode
	for _, qrCode := range s.qrCodes {
		qrCodes = append(qrCodes, qrCode)
	}

	return qrCodes, nil
}

func (s *InMemoryQRCodeStorage) GetActiveQRCodes() ([]*models.QRCode, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var activeQRCodes []*models.QRCode
	now := time.Now()

	for _, qrCode := range s.qrCodes {
		if !qrCode.IsUsed && now.Before(qrCode.ExpiresAt) {
			activeQRCodes = append(activeQRCodes, qrCode)
		}
	}

	return activeQRCodes, nil
}

func (s *InMemoryQRCodeStorage) CleanupExpiredQRCodes() error {
	s.mu.Lock()
	defer s.mu.Unlock()

	now := time.Now()
	for id, qrCode := range s.qrCodes {
		if now.After(qrCode.ExpiresAt) {
			delete(s.qrCodes, id)
		}
	}

	return nil
}

func (s *InMemoryQRCodeStorage) DeleteQRCode(id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if _, exists := s.qrCodes[id]; !exists {
		return ErrQRCodeNotFound
	}

	delete(s.qrCodes, id)
	return nil
}

func (s *InMemoryQRCodeStorage) startCleanupRoutine() {
	ticker := time.NewTicker(1 * time.Minute)
	defer ticker.Stop()

	for range ticker.C {
		s.CleanupExpiredQRCodes()
	}
}
