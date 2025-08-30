package api

import (
	"net/http"
	"rotate-token-demo/internal/models"
	"rotate-token-demo/internal/service"
	"rotate-token-demo/internal/storage"

	"github.com/gin-gonic/gin"
)

type Handlers struct {
	authService *service.AuthService
	qrService   *service.QRCodeService
}

func NewHandlers(authService *service.AuthService, qrService *service.QRCodeService) *Handlers {
	return &Handlers{
		authService: authService,
		qrService:   qrService,
	}
}

func (h *Handlers) Register(c *gin.Context) {
	var req models.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Error:   "Invalid request data: " + err.Error(),
		})
		return
	}

	user, err := h.authService.Register(&req)
	if err != nil {
		if err == service.ErrUserExists {
			c.JSON(http.StatusConflict, models.APIResponse{
				Success: false,
				Error:   "User already exists",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Error:   "Failed to create user: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, models.APIResponse{
		Success: true,
		Message: "User created successfully",
		Data: gin.H{
			"user": gin.H{
				"id":         user.ID,
				"username":   user.Username,
				"email":      user.Email,
				"created_at": user.CreateAt,
			},
		},
	})
}

func (h *Handlers) Login(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Error:   "Invalid request data: " + err.Error(),
		})
		return
	}

	tokenPair, err := h.authService.Login(&req)
	if err != nil {
		if err == service.ErrInvalidCredentials {
			c.JSON(http.StatusUnauthorized, models.APIResponse{
				Success: false,
				Error:   "Invalid username or password",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Error:   "Login failed: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Message: "Login successful",
		Data:    tokenPair,
	})
}

func (h *Handlers) RefreshToken(c *gin.Context) {
	var req models.RefreshRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Error:   "Invalid request data: " + err.Error(),
		})
		return
	}

	tokenPair, err := h.authService.RefreshToken(&req)
	if err != nil {
		c.JSON(http.StatusUnauthorized, models.APIResponse{
			Success: false,
			Error:   "Token refresh failed: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Message: "Token refreshed successfully",
		Data:    tokenPair,
	})
}

func (h *Handlers) Logout(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, models.APIResponse{
			Success: false,
			Error:   "User not authenticated",
		})
		return
	}

	if err := h.authService.Logout(userID); err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Error:   "Logout failed: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Message: "Logout successful",
	})
}

func (h *Handlers) GetProfile(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, models.APIResponse{
			Success: false,
			Error:   "User not authenticated",
		})
		return
	}

	profile, err := h.authService.GetUserProfile(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Error:   "Failed to get profile: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Message: "Profile retrieved successfully",
		Data:    profile,
	})
}

func (h *Handlers) GetTokenInfo(c *gin.Context) {
	accessToken := c.GetHeader("Authorization")
	if accessToken != "" && len(accessToken) > 7 {
		accessToken = accessToken[7:]
	}

	refreshToken := c.Query("refresh_token")

	tokenInfo, err := h.authService.GetTokenInfo(accessToken, refreshToken)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Error:   "Failed to get token info: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Message: "Token info retrieved successfully",
		Data:    tokenInfo,
	})
}

func (h *Handlers) HealthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Message: "API is healthy",
		Data: gin.H{
			"status":  "healthy",
			"version": "1.0.0",
			"service": "rotate-token-demo",
		},
	})
}

func (h *Handlers) Protected(c *gin.Context) {
	username := c.GetString("username")
	userID := c.GetString("user_id")

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Message: "Access granted to protected resource",
		Data: gin.H{
			"user_id":  userID,
			"username": username,
			"message":  "This is a protected endpoint that requires valid authentication",
		},
	})
}

// Bu endpoint DEMO amaçlıdır
func (h *Handlers) SimulateTokenTheft(c *gin.Context) {
	var req struct {
		RefreshToken string `json:"refresh_token" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Error:   "Invalid request data: " + err.Error(),
		})
		return
	}

	// Çalınmış/ele geçirilmiş bir refresh token tespitini simüle etmeliyiz
	// Gerçek senaryolarda bunu aşağıdaki sinyallerle tespit etmeliyiz:
	// - Farklı konumlardan eşzamanlı birden fazla refresh denemesi
	// - Engelli/şüpheli IP’lerden gelen refresh denemeleri
	// - Güvenlik analizlerinde olağandışı kalıpların görülmesi

	err := h.authService.RevokeTokenFamily(req.RefreshToken)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Error:   "Failed to revoke token family: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Message: "Token theft detected! All tokens in family revoked for security",
		Data: gin.H{
			"action":  "family_revoked",
			"reason":  "potential_token_theft",
			"message": "All related tokens have been invalidated. User must re-authenticate.",
		},
	})
}

func (h *Handlers) GetTokenStatus(c *gin.Context) {
	refreshToken := c.Query("refresh_token")
	if refreshToken == "" {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Error:   "refresh_token parameter is required",
		})
		return
	}

	status, err := h.authService.GetTokenStatus(refreshToken)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Error:   "Failed to get token status: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Message: "Token status retrieved",
		Data:    status,
	})
}

func (h *Handlers) GenerateQRCode(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, models.APIResponse{
			Success: false,
			Error:   "User not authenticated",
		})
		return
	}

	qrResponse, err := h.qrService.GenerateQRCode(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Error:   "Failed to generate QR code: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Message: "QR code generated successfully",
		Data:    qrResponse,
	})
}

func (h *Handlers) ValidateQRCode(c *gin.Context) {
	var req models.QRCodeValidationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Error:   "Invalid request data: " + err.Error(),
		})
		return
	}

	clientIP := c.ClientIP()

	tokenPair, err := h.qrService.ValidateQRCode(req.QRData, clientIP)
	if err != nil {
		var statusCode int
		var errorMsg string

		switch err {
		case storage.ErrQRCodeNotFound:
			statusCode = http.StatusNotFound
			errorMsg = "QR code not found"
		case storage.ErrQRCodeExpired:
			statusCode = http.StatusGone
			errorMsg = "QR code has expired"
		case storage.ErrQRCodeUsed:
			statusCode = http.StatusConflict
			errorMsg = "QR code has already been used"
		default:
			statusCode = http.StatusBadRequest
			errorMsg = "QR code validation failed: " + err.Error()
		}

		c.JSON(statusCode, models.APIResponse{
			Success: false,
			Error:   errorMsg,
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Message: "QR code validated successfully",
		Data:    tokenPair,
	})
}

func (h *Handlers) GetDatabaseView(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, models.APIResponse{
			Success: false,
			Error:   "Authentication required",
		})
		return
	}

	databaseView, err := h.qrService.GetDatabaseView()
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Error:   "Failed to get database view: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Message: "Database view retrieved successfully",
		Data:    databaseView,
	})
}
