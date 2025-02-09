package filemanager

import (
	"github.com/gin-gonic/gin"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

const (
	musicBaseDir = "./assets/music"
	imageBaseDir = "./assets/image"
)

func UploadAudioFile(c *gin.Context) {
	// Get the playlist ID from the form data
	playlistId := c.PostForm("playlistId")
	if playlistId == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No playlist ID provided"})
		return
	}

	// Get the uploaded file
	file, err := c.FormFile("audioFile")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file uploaded"})
		return
	}

	// Validate file extension
	ext := strings.ToLower(filepath.Ext(file.Filename))
	if ext != ".wav" && ext != ".flac" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Only .wav and .flac files are allowed"})
		return
	}

	// Create playlist-specific directory if it doesn't exist
	uploadDir := filepath.Join(musicBaseDir, playlistId)
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create upload directory"})
		return
	}

	// Create the file path within the playlist directory
	filename := filepath.Base(file.Filename)
	filePath := filepath.Join(uploadDir, filename)

	// Save the file
	if err := c.SaveUploadedFile(file, filePath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":  "File uploaded successfully",
		"filename": filename,
	})
}

func DeleteAudioFile(c *gin.Context) {
	// Get playlist ID and filename from parameters
	playlistId := c.Param("playlistId")
	filename := c.Param("filename")

	if playlistId == "" || filename == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing playlist ID or filename"})
		return
	}

	// Clean the filename to prevent directory traversal
	cleanFilename := filepath.Clean(filename)
	if strings.Contains(cleanFilename, "..") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid filename"})
		return
	}

	// Get absolute paths
	absUploadDir, err := filepath.Abs(filepath.Join(musicBaseDir, playlistId))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Server configuration error"})
		return
	}

	targetPath := filepath.Join(absUploadDir, cleanFilename)

	// Verify the target file is within the playlist directory
	if !strings.HasPrefix(targetPath, absUploadDir) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid file path"})
		return
	}

	// Check if file exists
	if _, err := os.Stat(targetPath); os.IsNotExist(err) {
		c.JSON(http.StatusNotFound, gin.H{"error": "File not found"})
		return
	}

	// Delete the file
	if err := os.Remove(targetPath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete file"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":  "File deleted successfully",
		"filename": filename,
	})
}

func UploadBackgroundImage(c *gin.Context) {
	// Get the playlist ID from the form data
	playlistId := c.PostForm("playlistId")
	if playlistId == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No playlist ID provided"})
		return
	}

	// Get the uploaded file
	file, err := c.FormFile("backgroundFile")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file uploaded"})
		return
	}

	// Validate file type
	if !strings.HasPrefix(file.Header.Get("Content-Type"), "image/") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Only image files are allowed"})
		return
	}

	// Create playlist-specific image directory if it doesn't exist
	uploadDir := filepath.Join(imageBaseDir, playlistId)
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create upload directory"})
		return
	}

	// Remove existing background files for this playlist
	existingFiles, _ := filepath.Glob(filepath.Join(uploadDir, "background.*"))
	for _, f := range existingFiles {
		if err := os.Remove(f); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to remove existing background"})
			return
		}
	}

	// Create the new background file with original extension
	ext := filepath.Ext(file.Filename)
	newFilename := "background" + ext
	filePath := filepath.Join(uploadDir, newFilename)

	// Save the file
	if err := c.SaveUploadedFile(file, filePath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":       "Background uploaded successfully",
		"backgroundUrl": filepath.Join("/assets/image", playlistId, newFilename),
	})
}

func GetCurrentBackground(c *gin.Context) {
	// Get the playlist ID from the URL parameter
	playlistId := c.Param("playlistId")
	if playlistId == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No playlist ID provided"})
		return
	}

	// Look for any file named background.* in the playlist's image directory
	uploadDir := filepath.Join(imageBaseDir, playlistId)
	files, err := filepath.Glob(filepath.Join(uploadDir, "background.*"))
	if err != nil || len(files) == 0 {
		c.JSON(http.StatusOK, gin.H{"backgroundUrl": ""})
		return
	}

	// Return the first matching file
	backgroundFile := filepath.Base(files[0])
	c.JSON(http.StatusOK, gin.H{
		"backgroundUrl": filepath.Join("/assets/image", playlistId, backgroundFile),
	})
}
