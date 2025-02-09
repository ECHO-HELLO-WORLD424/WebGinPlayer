class BackgroundManager {
    constructor() {
        this.backgroundInput = document.getElementById('backgroundInput');
        this.bindEvents();
        this.loadBackground();
    }

    bindEvents() {
        this.backgroundInput.addEventListener('change', (e) => this.handleBackgroundUpload(e));
    }

    async handleBackgroundUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            this.backgroundInput.value = ''; // Clear the input
            return;
        }

        // Create form data
        const formData = new FormData();
        formData.append('backgroundFile', file);

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

            // Update background immediately after successful upload
            this.loadBackground();
            this.backgroundInput.value = ''; // Clear the input

        } catch (error) {
            console.error('Upload error:', error);
            alert('Failed to upload background: ' + error.message);
        }
    }

    async loadBackground() {
        try {
            const response = await fetch('/background/current');
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

// Initialize background manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new BackgroundManager();
});