package service

import (
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"rotate-token-demo/internal/models"
	"rotate-token-demo/internal/storage"
	"time"

	"github.com/google/uuid"
)

var (
	ErrQRCodeGenerationFailed = errors.New("failed to generate QR code")
	ErrQRCodeValidationFailed = errors.New("QR code validation failed")
)

type QRCodeService struct {
	qrStorage    storage.QRCodeStorage
	userStorage  storage.UserStorage
	tokenStorage storage.TokenStorage
	authService  *AuthService
}

func NewQRCodeService(qrStorage storage.QRCodeStorage, userStorage storage.UserStorage, tokenStorage storage.TokenStorage, authService *AuthService) *QRCodeService {
	return &QRCodeService{
		qrStorage:    qrStorage,
		userStorage:  userStorage,
		tokenStorage: tokenStorage,
		authService:  authService,
	}
}

func (s *QRCodeService) GenerateQRCode(userID string) (*models.QRCodeResponse, error) {
	user, err := s.userStorage.GetUserByID(userID)
	if err != nil {
		return nil, fmt.Errorf("user not found: %w", err)
	}

	qrID := uuid.New().String()

	randomData := make([]byte, 32)
	if _, err := rand.Read(randomData); err != nil {
		return nil, ErrQRCodeGenerationFailed
	}

	qrData := map[string]interface{}{
		"type":       "login",
		"user_id":    userID,
		"username":   user.Username,
		"qr_id":      qrID,
		"expires_at": time.Now().Add(5 * time.Minute).Unix(),
	}

	jsonData, err := json.Marshal(qrData)
	if err != nil {
		return nil, ErrQRCodeGenerationFailed
	}

	encodedData := base64.URLEncoding.EncodeToString(jsonData)

	qrCode := &models.QRCode{
		ID:        qrID,
		Data:      encodedData,
		UserID:    userID,
		CreatedAt: time.Now(),
		ExpiresAt: time.Now().Add(5 * time.Minute),
		IsUsed:    false,
	}

	if err := s.qrStorage.CreateQRCode(qrCode); err != nil {
		return nil, fmt.Errorf("failed to store QR code: %w", err)
	}

	return &models.QRCodeResponse{
		ID:        qrID,
		QRData:    encodedData,
		ExpiresAt: qrCode.ExpiresAt,
		Message:   fmt.Sprintf("QR code generated for %s. Expires in 5 minutes.", user.Username),
	}, nil
}

func (s *QRCodeService) ValidateQRCode(qrData string, clientIP string) (*models.TokenPair, error) {
	qrCode, err := s.qrStorage.GetQRCodeByData(qrData)
	if err != nil {
		return nil, ErrQRCodeValidationFailed
	}

	if qrCode.IsUsed {
		return nil, storage.ErrQRCodeUsed
	}

	if time.Now().After(qrCode.ExpiresAt) {
		return nil, storage.ErrQRCodeExpired
	}

	if err := s.qrStorage.MarkQRCodeAsUsed(qrCode.ID, clientIP); err != nil {
		return nil, fmt.Errorf("failed to mark QR code as used: %w", err)
	}

	user, err := s.userStorage.GetUserByID(qrCode.UserID)
	if err != nil {
		return nil, fmt.Errorf("user not found: %w", err)
	}

	tokenPair, err := s.authService.generateTokenPair(user)
	if err != nil {
		return nil, fmt.Errorf("failed to generate tokens: %w", err)
	}

	return tokenPair, nil
}

func (s *QRCodeService) GetDatabaseView() (*models.DatabaseView, error) {
	users, err := s.userStorage.ListUsers()
	if err != nil {
		return nil, fmt.Errorf("failed to get users: %w", err)
	}

	tokens, err := s.tokenStorage.GetAllTokens()
	if err != nil {
		return nil, fmt.Errorf("failed to get tokens: %w", err)
	}

	qrCodes, err := s.qrStorage.GetAllQRCodes()
	if err != nil {
		return nil, fmt.Errorf("failed to get QR codes: %w", err)
	}

	now := time.Now()
	stats := models.DatabaseStats{
		TotalUsers:     len(users),
		ActiveTokens:   0,
		RevokedTokens:  0,
		ExpiredTokens:  0,
		ActiveQRCodes:  0,
		UsedQRCodes:    0,
		ExpiredQRCodes: 0,
	}

	for _, token := range tokens {
		if token.IsRevoked {
			stats.RevokedTokens++
		} else if now.After(token.ExpiresAt) {
			stats.ExpiredTokens++
		} else {
			stats.ActiveTokens++
		}
	}

	for _, qrCode := range qrCodes {
		if qrCode.IsUsed {
			stats.UsedQRCodes++
		} else if now.After(qrCode.ExpiresAt) {
			stats.ExpiredQRCodes++
		} else {
			stats.ActiveQRCodes++
		}
	}

	return &models.DatabaseView{
		Users:     users,
		Tokens:    tokens,
		QRCodes:   qrCodes,
		Stats:     stats,
		Timestamp: now,
	}, nil
}

func (s *QRCodeService) CleanupExpiredQRCodes() error {
	return s.qrStorage.CleanupExpiredQRCodes()
}
