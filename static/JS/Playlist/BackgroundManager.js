class BackgroundManager {
    constructor() {
        this.backgroundInput = document.getElementById('backgroundInput');
        this.playlistId = this.getPlaylistIdFromUrl();
        this.bindEvents();
        this.loadBackground();
    }

    getPlaylistIdFromUrl() {
        const pathParts = window.location.pathname.split('/');
        return pathParts[pathParts.length - 1];
    }

    bindEvents() {
        this.backgroundInput.addEventListener('change', (e) => this.handleBackgroundUpload(e));
    }

    async handleBackgroundUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            this.backgroundInput.value = '';
            return;
        }

        const formData = new FormData();
        formData.append('backgroundFile', file);
        formData.append('playlistId', this.playlistId);

        try {
            const response = await fetch('/upload/background', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (!response.ok) {
                console.log(result.error || 'Upload failed');
                return;
            }

            this.loadBackground();
            this.backgroundInput.value = '';

        } catch (error) {
            console.error('Upload error:', error);
            alert('Failed to upload background: ' + error.message);
        }
    }

    async loadBackground() {
        try {
            const response = await fetch(`/background/${this.playlistId}`);
            if (response.ok) {
                const data = await response.json();
                if (data.backgroundUrl) {
                    document.body.style.backgroundImage = `url('${data.backgroundUrl}')`;
                }
            }
        } catch (error) {
            console.error('Failed to load background:', error);
        }
    }
}