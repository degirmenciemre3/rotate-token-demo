package models

import (
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type User struct {
	ID        string    `json:"id"`
	Username  string    `json:"username"`
	Email     string    `json:"email"`
	Password  string    `json:"-"`
	CreateAt  time.Time `json:"created_at"`
	LastLogin time.Time `json:"last_login,omitempty"`
}

type RefreshToken struct {
	ID          string    `json:"id"`
	UserID      string    `json:"user_id"`
	Token       string    `json:"token"`
	ExpiresAt   time.Time `json:"expires_at"`
	CreatedAt   time.Time `json:"created_at"`
	IsRevoked   bool      `json:"is_revoked"`
	TokenFamily string    `json:"token_family"`
}

type TokenPair struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresAt    int64  `json:"expires_at"`
	TokenType    string `json:"token_type"`
}

type Claims struct {
	UserID   string `json:"user_id"`
	Username string `json:"username"`
	Email    string `json:"email"`
	jwt.RegisteredClaims
}

type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type RegisterRequest struct {
	Username string `json:"username" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
}

type RefreshRequest struct {
	RefreshToken string `json:"refresh_token" binding:"required"`
}

type TokenInfo struct {
	AccessToken   *TokenDetails `json:"access_token"`
	RefreshToken  *TokenDetails `json:"refresh_token"`
	TokenRotation bool          `json:"token_rotation_enabled"`
	TokenFamily   string        `json:"token_family,omitempty"`
}

type TokenDetails struct {
	Token     string    `json:"token"`
	ExpiresAt time.Time `json:"expires_at"`
	IsValid   bool      `json:"is_valid"`
	Claims    *Claims   `json:"claims,omitempty"`
	Type      string    `json:"type"`
}

type UserProfile struct {
	ID        string    `json:"id"`
	Username  string    `json:"username"`
	Email     string    `json:"email"`
	CreatedAt time.Time `json:"created_at"`
	LastLogin time.Time `json:"last_login,omitempty"`
}

type APIResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}

type QRCode struct {
	ID        string     `json:"id"`
	Data      string     `json:"data"`
	UserID    string     `json:"user_id"`
	CreatedAt time.Time  `json:"created_at"`
	ExpiresAt time.Time  `json:"expires_at"`
	IsUsed    bool       `json:"is_used"`
	UsedAt    *time.Time `json:"used_at,omitempty"`
	IPAddress string     `json:"ip_address,omitempty"`
}

type QRCodeRequest struct {
	UserID string `json:"user_id" binding:"required"`
}

type QRCodeValidationRequest struct {
	QRData string `json:"qr_data" binding:"required"`
}

type QRCodeResponse struct {
	ID        string    `json:"id"`
	QRData    string    `json:"qr_data"`
	ExpiresAt time.Time `json:"expires_at"`
	Message   string    `json:"message"`
}

type DatabaseView struct {
	Users     []*User         `json:"users"`
	Tokens    []*RefreshToken `json:"tokens"`
	QRCodes   []*QRCode       `json:"qr_codes"`
	Stats     DatabaseStats   `json:"stats"`
	Timestamp time.Time       `json:"timestamp"`
}

type DatabaseStats struct {
	TotalUsers     int `json:"total_users"`
	ActiveTokens   int `json:"active_tokens"`
	RevokedTokens  int `json:"revoked_tokens"`
	ExpiredTokens  int `json:"expired_tokens"`
	ActiveQRCodes  int `json:"active_qr_codes"`
	UsedQRCodes    int `json:"used_qr_codes"`
	ExpiredQRCodes int `json:"expired_qr_codes"`
}
