package main

import (
	"WebPlayer/src/filemanager"
	"github.com/gin-gonic/gin"
	"log"
	"net/http"
	"path/filepath"
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
	playListPage      = "Playlist.html"
	// CSS & JS files
	relativeCSSPath    = "/static/CSS"
	rootCSSPath        = "./static/CSS"
	relativePlaylistJS = "/static/JS/Playlist"
	rootPlaylistJS     = "./static/JS/Playlist"
)

func main() {
	expectedHosts := []string{
		"127.0.0.1:8080",
		"0.0.0.0:8080",
	}
	playlistRouter := createPlaylistRouter(expectedHosts)

	// HTTP playlistServer
	playlistServer := &http.Server{
		Addr:         ":8080",
		Handler:      playlistRouter,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
	}

	err := playlistServer.ListenAndServe()
	if err != nil {
		log.Fatal(err)
		return
	}
}

func createPlaylistRouter(expectedHost []string) *gin.Engine {
	router := gin.Default()

	router.Use(func(c *gin.Context) {
		if !slices.Contains(expectedHost, c.Request.Host) {
			c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "Invalid host header"})
			return
		}
		// Security Headers
		c.Header("X-Frame-Options", "DENY")
		c.Header("Content-Security-Policy", "default-src 'self'; connect-src *; font-src *; script-src-elem * 'unsafe-inline'; img-src * data:; style-src * 'unsafe-inline';")
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

	// Serve static files (HTML, CSS, JS)
	router.Static(relativeCSSPath, rootCSSPath)
	router.Static(relativePlaylistJS, rootPlaylistJS)
	router.LoadHTMLGlob(globalHTMLPattern)

	// Serve assets from the assets directory
	router.Static(musicRelativePath, musicRootPath)
	router.Static(iconRelativePath, iconRootPath)
	router.Static(imageRelativePath, imageRootPath)

	// Audio routes
	router.GET("/", listAudioFile)
	router.POST("/upload", filemanager.UploadAudioFile)
	router.DELETE("/delete/:filename", filemanager.DeleteAudioFile)

	// Background image routes
	router.POST("/upload/background", filemanager.UploadBackgroundImage)
	router.GET("/background/current", filemanager.GetCurrentBackground)

	return router
}

func listAudioFile(c *gin.Context) {
	// Get list of music files
	files, err := filepath.Glob("assets/music/*")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to list music files"})
		return
	}

	// Clean up file paths for frontend
	var musicFiles []string
	for _, file := range files {
		if filepath.Ext(file) == ".wav" || filepath.Ext(file) == ".flac" {
			musicFiles = append(musicFiles, filepath.Base(file))
		}
	}

	c.HTML(http.StatusOK, playListPage, gin.H{
		"musicFiles": musicFiles,
	})
}
