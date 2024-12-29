package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"my-blog-app/backend/config"
	"my-blog-app/backend/database"
	"my-blog-app/backend/database/migrations"
	"my-blog-app/backend/handlers"
	"my-blog-app/backend/middleware"

	"github.com/gin-gonic/gin"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"go.uber.org/zap"
)

var (
	logger *zap.Logger
)

func init() {
	var err error
	if os.Getenv("ENV") == "production" {
		logger, err = zap.NewProduction()
	} else {
		logger, err = zap.NewDevelopment()
	}
	if err != nil {
		log.Fatalf("Failed to initialize logger: %v", err)
	}
}

func main() {

	cfg := config.Load()

	dbConfig := &database.Config{
		MaxOpenConns:    25,
		MaxIdleConns:    25,
		ConnMaxLifetime: time.Hour,
		ConnMaxIdleTime: 5 * time.Minute,
	}

	db, err := database.NewDatabase(cfg.DatabaseURL, dbConfig)
	if err != nil {
		logger.Fatal("Failed to connect to database", zap.Error(err))
	}
	defer db.Close()

	if err := migrations.RunMigrations(db.DB); err != nil {
		logger.Fatal("Failed to run migrations", zap.Error(err))
	}

	router := setupRouter(cfg, db, logger)

	srv := &http.Server{
		Addr:    ":" + cfg.Port,
		Handler: router,
	}

	go func() {
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Fatal("Failed to start server", zap.Error(err))
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		logger.Fatal("Server forced to shutdown", zap.Error(err))
	}

	logger.Info("Server exiting")
}

func setupRouter(cfg *config.Config, db *database.Database, logger *zap.Logger) *gin.Engine {
	if cfg.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	router := gin.New()

	router.Use(gin.Recovery())

	router.Use(middleware.RequestID())
	router.Use(middleware.Metrics())
	router.Use(middleware.Logger(logger))
	router.Use(middleware.CORS(cfg.AllowedOrigins))
	router.Use(middleware.RateLimitMiddleware(
		middleware.NewIPRateLimiter(float64(cfg.RateLimit)/60.0, cfg.RateLimit),
	))

	router.GET("/metrics", gin.WrapH(promhttp.Handler()))

	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":     "ok",
			"timestamp":  time.Now().Format(time.RFC3339),
			"request_id": c.GetString(middleware.RequestIDKey),
		})
	})

	authHandler := handlers.NewAuthHandler(db.DB, cfg.JWTSecret)
	postHandler := handlers.NewPostHandler(db.DB)
	commentHandler := handlers.NewCommentHandler(db.DB)

	api := router.Group("/api")
	{
		api.POST("/register", authHandler.Register)
		api.POST("/login", authHandler.Login)
		api.POST("/refresh", authHandler.RefreshToken)
		api.GET("/posts", postHandler.GetPosts)
		api.GET("/posts/:id", postHandler.GetPost)
		api.GET("/posts/:id/comments", commentHandler.GetComments)

		protected := api.Group("")
		protected.Use(middleware.AuthMiddleware(cfg.JWTSecret))
		{
			protected.POST("/posts", postHandler.CreatePost)
			protected.PUT("/posts/:id", postHandler.UpdatePost)
			protected.DELETE("/posts/:id", postHandler.DeletePost)
			protected.POST("/posts/:id/comments", commentHandler.CreateComment)
			protected.DELETE("/comments/:id", commentHandler.DeleteComment)
		}
	}

	return router
}
