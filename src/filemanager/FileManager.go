package filemanager

import (
	"github.com/gin-gonic/gin"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

const (
	audioUploadDir = "./assets/music"
	imageUploadDir = "./assets/image"
)

func UploadAudioFile(c *gin.Context) {
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

	// Ensure upload directory exists
	if err := os.MkdirAll(audioUploadDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create upload directory"})
		return
	}

	// Create the file path
	filename := filepath.Base(file.Filename)
	filePrefix := filepath.Join(audioUploadDir, filename)

	// Save the file
	if err := c.SaveUploadedFile(file, filePrefix); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":  "File uploaded successfully",
		"filename": filename,
	})
}

func DeleteAudioFile(c *gin.Context) {
	filename := c.Param("filename")

	// Validate filename
	if filename == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No filename provided"})
		return
	}

	// Clean the filename to prevent directory traversal
	cleanFilename := filepath.Clean(filename)
	if strings.Contains(cleanFilename, "..") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid filename"})
		return
	}

	// Get absolute path for both the upload directory and the target file
	absUploadDir, err := filepath.Abs(audioUploadDir)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Server configuration error"})
		return
	}

	targetPath := filepath.Join(absUploadDir, cleanFilename)

	// Verify the target file is within the upload directory
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

	// Ensure upload directory exists
	if err := os.MkdirAll(imageUploadDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create upload directory"})
		return
	}

	// Remove existing background files
	existingFiles, _ := filepath.Glob(filepath.Join(imageUploadDir, "background.*"))
	for _, f := range existingFiles {
		err := os.Remove(f)
		if err != nil {
			return
		}
	}

	// Create the new background file with original extension
	ext := filepath.Ext(file.Filename)
	newFilename := "background" + ext
	filePath := filepath.Join(imageUploadDir, newFilename)

	// Save the file
	if err := c.SaveUploadedFile(file, filePath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":       "Background uploaded successfully",
		"backgroundUrl": "/assets/image/" + newFilename,
	})
}

func GetCurrentBackground(c *gin.Context) {
	// Look for any file named background.* in the image directory
	files, err := filepath.Glob(filepath.Join(imageUploadDir, "background.*"))
	if err != nil || len(files) == 0 {
		c.JSON(http.StatusOK, gin.H{"backgroundUrl": ""})
		return
	}

	// Return the first matching file
	backgroundFile := filepath.Base(files[0])
	c.JSON(http.StatusOK, gin.H{
		"backgroundUrl": "/assets/image/" + backgroundFile,
	})
}
