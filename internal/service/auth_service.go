package service

import (
	"crypto/rand"
	"encoding/base64"
	"errors"
	"rotate-token-demo/internal/config"
	"rotate-token-demo/internal/models"
	"rotate-token-demo/internal/storage"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

var (
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrTokenInvalid       = errors.New("invalid token")
	ErrTokenExpired       = errors.New("token expired")
	ErrTokenRevoked       = errors.New("token revoked for security reasons")
	ErrUserExists         = errors.New("user already exists")
)

type AuthService struct {
	userStorage  storage.UserStorage
	tokenStorage storage.TokenStorage
	config       *config.Config
}

func NewAuthService(userStorage storage.UserStorage, tokenStorage storage.TokenStorage, config *config.Config) *AuthService {
	return &AuthService{
		userStorage:  userStorage,
		tokenStorage: tokenStorage,
		config:       config,
	}
}

func (s *AuthService) Register(req *models.RegisterRequest) (*models.User, error) {
	if _, err := s.userStorage.GetUserByUsername(req.Username); err == nil {
		return nil, ErrUserExists
	}
	if _, err := s.userStorage.GetUserByEmail(req.Email); err == nil {
		return nil, ErrUserExists
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	user := &models.User{
		ID:       uuid.New().String(),
		Username: req.Username,
		Email:    req.Email,
		Password: string(hashedPassword),
		CreateAt: time.Now(),
	}

	if err := s.userStorage.CreateUser(user); err != nil {
		return nil, err
	}

	return user, nil
}

func (s *AuthService) Login(req *models.LoginRequest) (*models.TokenPair, error) {
	user, err := s.userStorage.GetUserByUsername(req.Username)
	if err != nil {
		return nil, ErrInvalidCredentials
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		return nil, ErrInvalidCredentials
	}

	if err := s.userStorage.UpdateLastLogin(user.ID); err != nil {
		// Log error but don't fail login
		// In production, you might want to use a proper logger
	}

	return s.generateTokenPair(user)
}

func (s *AuthService) RefreshToken(req *models.RefreshRequest) (*models.TokenPair, error) {
	refreshToken, err := s.tokenStorage.GetRefreshToken(req.RefreshToken)
	if err != nil {
		// Bu refresh token veritabanında yoksa ya da daha önce iptal edildiyse,
		// bunu olası bir "replay" girişimi olarak değerlendirmeliyiz
		// Güvenlik adına ilgili token ailesini (family) komple iptal etmeliyiz
		if err == storage.ErrTokenNotFound || err == storage.ErrTokenRevoked {
			// JWT içinden token family bilgisini çıkarmayı denemeliyiz; bulursak tüm aileyi iptal etmeliyiz
			if tokenFamily := s.extractTokenFamilyFromToken(req.RefreshToken); tokenFamily != "" {
				s.tokenStorage.RevokeTokenFamily(tokenFamily)
			}
			return nil, ErrTokenRevoked
		}
		if err == storage.ErrTokenExpired {
			return nil, ErrTokenExpired
		}
		return nil, ErrTokenInvalid
	}

	user, err := s.userStorage.GetUserByID(refreshToken.UserID)
	if err != nil {
		return nil, ErrTokenInvalid
	}

	// Token rotation açıksa, mevcut refresh token'ı tekrar kullanılmaması için iptal etmeliyiz
	if s.config.EnableTokenRotation {
		if err := s.tokenStorage.RevokeRefreshToken(req.RefreshToken); err != nil {
			return nil, err
		}
	}

	// Aynı token ailesiyle yeni bir access/refresh çifti üretmeliyiz
	tokenPair, err := s.generateTokenPairWithFamily(user, refreshToken.TokenFamily)
	if err != nil {
		// Üretim başarısız olursa ve hâlihazırda mevcut token'ı iptal ettiysek,
		// güvenlik için tüm aileyi de iptal etmeliyiz
		if s.config.EnableTokenRotation {
			s.tokenStorage.RevokeTokenFamily(refreshToken.TokenFamily)
		}
		return nil, err
	}

	return tokenPair, nil
}

func (s *AuthService) Logout(userID string) error {
	return s.tokenStorage.RevokeAllUserTokens(userID)
}

func (s *AuthService) ValidateAccessToken(tokenString string) (*models.Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &models.Claims{}, func(token *jwt.Token) (interface{}, error) {
		return []byte(s.config.JWTSecret), nil
	})

	if err != nil {
		return nil, ErrTokenInvalid
	}

	if claims, ok := token.Claims.(*models.Claims); ok && token.Valid {
		return claims, nil
	}

	return nil, ErrTokenInvalid
}

func (s *AuthService) GetTokenInfo(accessToken, refreshToken string) (*models.TokenInfo, error) {
	info := &models.TokenInfo{
		TokenRotation: s.config.EnableTokenRotation,
	}

	if accessToken != "" {
		claims, err := s.ValidateAccessToken(accessToken)
		tokenDetails := &models.TokenDetails{
			Token:   accessToken,
			Type:    "access",
			IsValid: err == nil,
		}

		if err == nil {
			tokenDetails.ExpiresAt = claims.ExpiresAt.Time
			tokenDetails.Claims = claims
		}

		info.AccessToken = tokenDetails
	}

	if refreshToken != "" {
		storedToken, err := s.tokenStorage.GetRefreshToken(refreshToken)
		tokenDetails := &models.TokenDetails{
			Token:   refreshToken,
			Type:    "refresh",
			IsValid: err == nil,
		}

		if err == nil {
			tokenDetails.ExpiresAt = storedToken.ExpiresAt
			info.TokenFamily = storedToken.TokenFamily
		}

		info.RefreshToken = tokenDetails
	}

	return info, nil
}

func (s *AuthService) GetUserProfile(userID string) (*models.UserProfile, error) {
	user, err := s.userStorage.GetUserByID(userID)
	if err != nil {
		return nil, err
	}

	return &models.UserProfile{
		ID:        user.ID,
		Username:  user.Username,
		Email:     user.Email,
		CreatedAt: user.CreateAt,
		LastLogin: user.LastLogin,
	}, nil
}

func (s *AuthService) generateTokenPair(user *models.User) (*models.TokenPair, error) {
	tokenFamily := uuid.New().String()
	return s.generateTokenPairWithFamily(user, tokenFamily)
}

func (s *AuthService) generateTokenPairWithFamily(user *models.User, tokenFamily string) (*models.TokenPair, error) {
	accessToken, expiresAt, err := s.generateAccessToken(user)
	if err != nil {
		return nil, err
	}

	refreshTokenString, err := s.generateRefreshToken(user.ID, tokenFamily)
	if err != nil {
		return nil, err
	}

	return &models.TokenPair{
		AccessToken:  accessToken,
		RefreshToken: refreshTokenString,
		ExpiresAt:    expiresAt.Unix(),
		TokenType:    "Bearer",
	}, nil
}

func (s *AuthService) generateAccessToken(user *models.User) (string, time.Time, error) {
	expiresAt := time.Now().Add(s.config.AccessTokenExpiry)

	claims := &models.Claims{
		UserID:   user.ID,
		Username: user.Username,
		Email:    user.Email,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expiresAt),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Issuer:    "rotate-token-demo",
			Subject:   user.ID,
			ID:        uuid.New().String(),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(s.config.JWTSecret))
	if err != nil {
		return "", time.Time{}, err
	}

	return tokenString, expiresAt, nil
}

func (s *AuthService) generateRefreshToken(userID, tokenFamily string) (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	tokenString := base64.URLEncoding.EncodeToString(bytes)

	refreshToken := &models.RefreshToken{
		ID:          uuid.New().String(),
		UserID:      userID,
		Token:       tokenString,
		ExpiresAt:   time.Now().Add(s.config.RefreshTokenExpiry),
		CreatedAt:   time.Now(),
		IsRevoked:   false,
		TokenFamily: tokenFamily,
	}

	if err := s.tokenStorage.StoreRefreshToken(refreshToken); err != nil {
		return "", err
	}

	return tokenString, nil
}

func (s *AuthService) extractTokenFamilyFromToken(tokenString string) string {
	// Not: Bu proje DEMO amaçlıdır.
	// Bu metot şu an sadece yer tutucu (placeholder) olarak bırakıldı ve boş değer döndürür.
	// Gerçek hayat senaryosunda burada token family bilgisi üretimde aktif olarak kullanılmalıdır:
	//   - JWT içindeki özel bir claim'den (örn. "family_id") okunabilir,
	//   - Refresh token hash'i DB/Redis üzerinden bulunup ilgili family kaydından çekilebilir,
	//   - Ya da token'a ait metadata sunucu tarafında tutulup buradan çözümlenebilir.
	// Uyarı: Üretimde boş string döndürmek reuse tespiti/iptal akışlarını etkisiz kılar.
	// TODO: İmzayı doğrula, claim’leri parse et ve family kimliğini döndür.
	return ""
}

func (s *AuthService) RevokeTokenFamily(refreshToken string) error {

	token, err := s.tokenStorage.GetRefreshToken(refreshToken)
	if err != nil {
		return err
	}
	return s.tokenStorage.RevokeTokenFamily(token.TokenFamily)
}

func (s *AuthService) GetTokenStatus(refreshToken string) (map[string]interface{}, error) {
	token, err := s.tokenStorage.GetRefreshToken(refreshToken)
	if err != nil {
		return map[string]interface{}{
			"valid": false,
			"error": err.Error(),
		}, nil
	}

	status := map[string]interface{}{
		"valid":        !token.IsRevoked && token.ExpiresAt.After(time.Now()),
		"revoked":      token.IsRevoked,
		"expired":      token.ExpiresAt.Before(time.Now()),
		"expires_at":   token.ExpiresAt,
		"created_at":   token.CreatedAt,
		"token_family": token.TokenFamily,
		"user_id":      token.UserID,
	}

	return status, nil
}
