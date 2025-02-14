package main

import (
	"WebPlayer/src/Playlist"
	"WebPlayer/src/filemanager"
	"github.com/gin-gonic/gin"
	"log"
	"net/http"
	"slices"
	"time"
)

const (
	// Music files
	musicRelativePath = "/assets/music"
	musicRootPath     = "./assets/music"
	// Icon files
	iconRelativePath = "/assets/icon"
	iconRootPath     = "./assets/icon"
	// Image files
	imageRelativePath = "/assets/image"
	imageRootPath     = "./assets/image"
	// HTML pages
	globalHTMLPattern = "templates/*.html"
	// CSS & JS files
	relativeCSSPath    = "/static/CSS"
	rootCSSPath        = "./static/CSS"
	relativePlaylistJS = "/static/JS"
	rootPlaylistJS     = "./static/JS"
)

func main() {
	expectedHosts := []string{
		"127.0.0.1:8081",
		"localhost:8081",
		"0.0.0.0:8081",
		"::1:8081",
	}

	// Initialize playlist handler
	playlistHandler, err := Playlist.NewHandler()
	if err != nil {
		log.Fatal("Failed to initialize playlist handler:", err)
		return
	}

	playlistRouter := createPlaylistRouter(expectedHosts, playlistHandler)

	// HTTP server
	server := &http.Server{
		Addr:         ":8081",
		Handler:      playlistRouter,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
	}

	err = server.ListenAndServe()
	if err != nil {
		log.Fatal(err)
		return
	}
}

func createPlaylistRouter(expectedHost []string, playlistHandler *Playlist.Handler) *gin.Engine {
	router := gin.Default()

	router.Use(func(c *gin.Context) {
		if !slices.Contains(expectedHost, c.Request.Host) {
			c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "Invalid host header"})
			return
		}
		// Security Headers
		c.Header("X-Frame-Options", "DENY")
		c.Header("Content-Security-Policy", " connect-src *; font-src *; script-src-elem * 'unsafe-inline'; style-src * 'unsafe-inline';")
		c.Header("X-XSS-Protection", "1; mode=block")
		c.Header("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload")
		c.Header("Referrer-Policy", "strict-origin")
		c.Header("Permissions-Policy", "geolocation=(),midi=(),sync-xhr=(),microphone=(),camera=(),magnetometer=(),gyroscope=(),fullscreen=(self),payment=()")
		// Disable caching for static files during development
		c.Header("Cache-Control", "no-cache, no-store, must-revalidate")
		c.Header("Pragma", "no-cache")
		c.Header("Expires", "0")
		c.Next()
	})

	// Serve static files
	router.Static(relativeCSSPath, rootCSSPath)
	router.Static(relativePlaylistJS, rootPlaylistJS)
	router.LoadHTMLGlob(globalHTMLPattern)

	// Serve assets
	router.Static(musicRelativePath, musicRootPath)
	router.Static(iconRelativePath, iconRootPath)
	router.Static(imageRelativePath, imageRootPath)

	// Playlist routes
	router.GET("/playlist", playlistHandler.ListPlaylists)
	router.GET("/playlist/:id", playlistHandler.GetPlaylist)
	router.POST("/playlist/create", playlistHandler.CreatePlaylist)
	router.DELETE("/playlist/:id", playlistHandler.DeletePlaylist)

	// File management routes
	router.POST("/upload", filemanager.UploadAudioFile)
	router.DELETE("/delete/:playlistId/:filename", filemanager.DeleteAudioFile)
	router.POST("/upload/background", filemanager.UploadBackgroundImage)
	router.GET("/background/:playlistId", filemanager.GetCurrentBackground)

	return router
}
