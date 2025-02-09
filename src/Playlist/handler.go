package Playlist

import (
	"encoding/json"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"net/http"
	"os"
	"path/filepath"
	"time"
)

const (
	playlistsFile = "./data/playlists.json"
	musicBaseDir  = "./assets/music"
	imageBaseDir  = "./assets/image"
)

type Handler struct {
	playlists []Playlist
}

func NewHandler() (*Handler, error) {
	h := &Handler{}
	if err := h.loadPlaylists(); err != nil {
		return nil, err
	}
	return h, nil
}

func (h *Handler) loadPlaylists() error {
	// Create data directory if it doesn't exist
	if err := os.MkdirAll(filepath.Dir(playlistsFile), 0755); err != nil {
		return err
	}

	// Read playlists file if it exists
	data, err := os.ReadFile(playlistsFile)
	if err != nil {
		if os.IsNotExist(err) {
			h.playlists = []Playlist{}
			return nil
		}
		return err
	}

	return json.Unmarshal(data, &h.playlists)
}

func (h *Handler) savePlaylists() error {
	data, err := json.Marshal(h.playlists)
	if err != nil {
		return err
	}
	return os.WriteFile(playlistsFile, data, 0644)
}

// ListPlaylists returns all playlists
func (h *Handler) ListPlaylists(c *gin.Context) {
	c.HTML(http.StatusOK, "PlaylistEntry.html", gin.H{
		"playlists": h.playlists,
	})
}

// CreatePlaylist creates a new playlist
func (h *Handler) CreatePlaylist(c *gin.Context) {
	var playlist Playlist
	if err := c.BindJSON(&playlist); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	playlist.ID = uuid.New().String()
	playlist.Created = time.Now()
	playlist.Updated = playlist.Created
	playlist.Songs = []string{}

	// Create playlist directories
	playlistMusicDir := filepath.Join(musicBaseDir, playlist.ID)
	playlistImageDir := filepath.Join(imageBaseDir, playlist.ID)
	if err := os.MkdirAll(playlistMusicDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create playlist directory"})
		return
	}
	if err := os.MkdirAll(playlistImageDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create playlist image directory"})
		return
	}

	h.playlists = append(h.playlists, playlist)
	if err := h.savePlaylists(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save playlist"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "playlist": playlist})
}

// GetPlaylist returns a specific playlist
func (h *Handler) GetPlaylist(c *gin.Context) {
	playlistId := c.Param("id")
	var playlist *Playlist

	for i := range h.playlists {
		if h.playlists[i].ID == playlistId {
			playlist = &h.playlists[i]
			break
		}
	}

	if playlist == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Playlist not found"})
		return
	}

	// Get playlist-specific music files
	playlistFiles, err := filepath.Glob(filepath.Join(musicBaseDir, playlistId, "*"))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to list playlist files"})
		return
	}

	// Get shared music files
	sharedFiles, err := filepath.Glob(filepath.Join(musicBaseDir, "shared", "*"))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to list shared files"})
		return
	}

	// Clean up file paths
	var cleanPlaylistFiles []string
	var cleanSharedFiles []string

	for _, file := range playlistFiles {
		if ext := filepath.Ext(file); ext == ".wav" || ext == ".flac" {
			cleanPlaylistFiles = append(cleanPlaylistFiles, filepath.Base(file))
		}
	}

	for _, file := range sharedFiles {
		if ext := filepath.Ext(file); ext == ".wav" || ext == ".flac" {
			cleanSharedFiles = append(cleanSharedFiles, filepath.Base(file))
		}
	}

	c.HTML(http.StatusOK, "Playlist.html", gin.H{
		"playlistId":    playlist.ID,
		"playlistName":  playlist.Name,
		"playlistFiles": cleanPlaylistFiles,
		"sharedFiles":   cleanSharedFiles,
	})
}

// DeletePlaylist deletes a playlist
func (h *Handler) DeletePlaylist(c *gin.Context) {
	playlistId := c.Param("id")

	index := -1
	for i := range h.playlists {
		if h.playlists[i].ID == playlistId {
			index = i
			break
		}
	}

	if index == -1 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Playlist not found"})
		return
	}

	// Remove playlist directories
	playlistMusicDir := filepath.Join(musicBaseDir, playlistId)
	playlistImageDir := filepath.Join(imageBaseDir, playlistId)
	if err := os.RemoveAll(playlistMusicDir); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete playlist directory"})
		return
	}
	if err := os.RemoveAll(playlistImageDir); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete playlist image directory"})
		return
	}

	// Remove playlist from slice
	h.playlists = append(h.playlists[:index], h.playlists[index+1:]...)
	if err := h.savePlaylists(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save playlists"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true})
}
