class BackgroundManager {
    constructor() {
        this.backgroundInput = document.getElementById('backgroundInput');
        this.playlistId = this.getPlaylistIdFromUrl();
        this.mousePosition = { x: 0, y: 0 };
        this.windowCenter = {
            x: window.innerWidth / 2,
            y: window.innerHeight / 2
        };
        this.currentOffset = { x: 0, y: 0 };
        this.targetOffset = { x: 0, y: 0 };
        this.maxOffset = 15; // Maximum pixels the background can move
        this.easeAmount = 0.1; // How smooth the movement should be
        this.scale = 1.1; // How much we scale the background image

        this.bindEvents();
        void this.loadBackground();
        this.setupParallax();
        this.animate();
    }

    getPlaylistIdFromUrl() {
        const pathParts = window.location.pathname.split('/');
        return pathParts[pathParts.length - 1];
    }

    bindEvents() {
        this.backgroundInput.addEventListener('change', (e) => this.handleBackgroundUpload(e));
        window.addEventListener('resize', () => {
            this.windowCenter = {
                x: window.innerWidth / 2,
                y: window.innerHeight / 2
            };
        });
    }

    setupParallax() {
        // Update mouse position on mousemove
        document.addEventListener('mousemove', (e) => {
            this.mousePosition = {
                x: e.clientX,
                y: e.clientY
            };

            // Calculate vector from center to mouse
            const vector = {
                x: this.mousePosition.x - this.windowCenter.x,
                y: this.mousePosition.y - this.windowCenter.y
            };

            // Calculate target offset (move in counter direction)
            this.targetOffset = {
                x: -(vector.x / this.windowCenter.x) * this.maxOffset,
                y: -(vector.y / this.windowCenter.y) * this.maxOffset
            };
        });

        // Set initial background properties
        document.body.style.backgroundSize = `${this.scale * 100}%`;
        document.body.style.backgroundPosition = 'center center';
    }

    animate() {
        // Smoothly interpolate between current and target offset
        this.currentOffset.x += (this.targetOffset.x - this.currentOffset.x) * this.easeAmount;
        this.currentOffset.y += (this.targetOffset.y - this.currentOffset.y) * this.easeAmount;

        // Apply the transform with both translation and scale
        document.body.style.backgroundPosition = `calc(50% + ${this.currentOffset.x}px) calc(50% + ${this.currentOffset.y}px)`;

        // Continue animation
        requestAnimationFrame(() => this.animate());
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

            await this.loadBackground();
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
                    document.body.style.backgroundSize = `${this.scale * 100}%`;
                    document.body.style.backgroundPosition = 'center center';
                }
            }
        } catch (error) {
            console.error('Failed to load background:', error);
        }
    }
}

document.addEventListener('DOMContentLoaded', function() {
    new BackgroundManager();
});