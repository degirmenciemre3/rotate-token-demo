package api

import (
	"rotate-token-demo/internal/config"
	"rotate-token-demo/internal/service"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

type Server struct {
	router      *gin.Engine
	handlers    *Handlers
	authService *service.AuthService
	qrService   *service.QRCodeService
	config      *config.Config
}

func NewServer(authService *service.AuthService, qrService *service.QRCodeService, config *config.Config) *Server {
	gin.SetMode(gin.ReleaseMode)

	router := gin.New()
	handlers := NewHandlers(authService, qrService)

	server := &Server{
		router:      router,
		handlers:    handlers,
		authService: authService,
		qrService:   qrService,
		config:      config,
	}

	server.setupMiddleware()
	server.setupRoutes()

	return server
}

func (s *Server) setupMiddleware() {
	corsConfig := cors.DefaultConfig()
	corsConfig.AllowOrigins = s.config.CORSAllowOrigins
	corsConfig.AllowCredentials = true
	corsConfig.AllowHeaders = []string{"Origin", "Content-Length", "Content-Type", "Authorization"}
	corsConfig.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"}

	s.router.Use(cors.New(corsConfig))
	s.router.Use(LoggingMiddleware())
	s.router.Use(ErrorHandlerMiddleware())
}

func (s *Server) setupRoutes() {
	v1 := s.router.Group("/api/v1")
	{
		v1.GET("/health", s.handlers.HealthCheck)
		auth := v1.Group("/auth")
		{
			auth.POST("/register", s.handlers.Register)
			auth.POST("/login", s.handlers.Login)
			auth.POST("/refresh", s.handlers.RefreshToken)
			auth.GET("/token-info", s.handlers.GetTokenInfo)
		}

		protected := v1.Group("/")
		protected.Use(AuthMiddleware(s.authService))
		{
			protected.POST("/auth/logout", s.handlers.Logout)
			protected.GET("/profile", s.handlers.GetProfile)
			protected.GET("/protected", s.handlers.Protected)
			protected.POST("/qr/generate", s.handlers.GenerateQRCode)
		}

		debug := v1.Group("/debug")
		debug.Use(AuthMiddleware(s.authService))
		{
			debug.GET("/token-info", s.handlers.GetTokenInfo)
		}

		security := v1.Group("/security")
		{
			security.POST("/simulate-theft", s.handlers.SimulateTokenTheft)
			security.GET("/token-status", s.handlers.GetTokenStatus)
		}

		qr := v1.Group("/qr")
		{
			qr.POST("/validate", s.handlers.ValidateQRCode)
		}

		admin := v1.Group("/admin")
		admin.Use(AuthMiddleware(s.authService))
		{
			admin.GET("/database", s.handlers.GetDatabaseView)
		}
	}
}

func (s *Server) Start() error {
	return s.router.Run(":" + s.config.Port)
}
