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

	// Serve static files (HTML, CSS, JS)
	router.Static("/static", "./static")
	router.LoadHTMLGlob("templates/*")

	// Serve audio files from the music directory
	router.Static("/data/music", "./data/music")

	// Route for the main page
	router.GET("/", listAudioFile)
	router.POST("/upload", filemanager.UploadFile)
	router.DELETE("/delete/:filename", filemanager.DeleteFile)

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
	files, err := filepath.Glob("data/music/*")
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
