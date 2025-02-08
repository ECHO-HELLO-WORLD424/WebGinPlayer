package main

import (
	"WebPlayer/src/filemanager"
	"github.com/gin-gonic/gin"
	"log"
	"net/http"
	"path/filepath"
	"time"
)

func main() {
	router := gin.Default()

	// Disable caching for static files during development
	router.Use(func(c *gin.Context) {
		c.Header("Cache-Control", "no-cache, no-store, must-revalidate")
		c.Header("Pragma", "no-cache")
		c.Header("Expires", "0")
		c.Next()
	})

	// Serve static files (HTML, CSS, JS)
	router.Static("/static", "./static")
	router.LoadHTMLGlob("templates/*")

	// Serve assets from the assets directory
	router.Static("/assets/music", "./assets/music")
	router.Static("/assets/icon", "./assets/icon")
	router.Static("/assets/image", "./assets/image") // Add this line

	// Audio routes
	router.GET("/", listAudioFile)
	router.POST("/upload", filemanager.UploadAudioFile)
	router.DELETE("/delete/:filename", filemanager.DeleteAudioFile)

	// Background image routes
	router.POST("/upload/background", filemanager.UploadBackgroundImage)
	router.GET("/background/current", filemanager.GetCurrentBackground)

	// HTTP server
	server := &http.Server{
		Addr:         ":8080",
		Handler:      router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
	}

	err := server.ListenAndServe()
	if err != nil {
		log.Fatal(err)
		return
	}
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

	c.HTML(http.StatusOK, "index.html", gin.H{
		"musicFiles": musicFiles,
	})
}
