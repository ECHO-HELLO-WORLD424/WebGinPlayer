class PlaylistManager {
    constructor() {
        this.modal = document.getElementById('createPlaylistModal');
        this.form = document.getElementById('createPlaylistForm');
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Form submission handler
        this.form.addEventListener('submit', (e) => this.handleCreatePlaylist(e));

        // Close modal when clicking outside
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeModal();
            }
        });

        // Handle keyboard events
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.classList.contains('show')) {
                this.closeModal();
            }
        });
    }

    openModal() {
        this.modal.classList.add('show');
        // Focus the name input when modal opens
        document.getElementById('playlistName').focus();
    }

    closeModal() {
        this.modal.classList.remove('show');
        this.form.reset();
    }

    async createPlaylist(name, description) {
        const response = await fetch('/playlist/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, description })
        });
        return response.json();
    }

    async deletePlaylist(playlistId) {
        const response = await fetch(`/playlist/${playlistId}`, {
            method: 'DELETE'
        });
        return response.json();
    }

    async handleCreatePlaylist(event) {
        event.preventDefault();

        const nameInput = document.getElementById('playlistName');
        const descriptionInput = document.getElementById('playlistDescription');

        try {
            const response = await this.createPlaylist(
                nameInput.value,
                descriptionInput.value
            );

            if (response.success) {
                window.location.reload();
            } else {
                alert('Failed to create playlist: ' + response.error);
            }
        } catch (error) {
            console.error('Error creating playlist:', error);
            alert('An error occurred while creating the playlist');
        }

        this.closeModal();
    }

    async handleDeletePlaylist(playlistId) {
        if (!confirm('Are you sure you want to delete this playlist?')) {
            return;
        }

        try {
            const response = await this.deletePlaylist(playlistId);

            if (response.success) {
                const playlistCard = document.querySelector(`[data-playlist-id="${playlistId}"]`);
                if (playlistCard) {
                    playlistCard.remove();
                }
            } else {
                alert('Failed to delete playlist: ' + response.error);
            }
        } catch (error) {
            console.error('Error deleting playlist:', error);
            alert('An error occurred while deleting the playlist');
        }
    }
}