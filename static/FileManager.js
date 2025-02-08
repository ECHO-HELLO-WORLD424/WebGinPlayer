class FileManager {
    constructor(musicList) {
        this.musicList = musicList;
        this.uploadInput = document.getElementById('audioFileInput');
        this.bindEvents();
    }

    bindEvents() {
        // Handle file selection
        this.uploadInput.addEventListener('change', (e) => this.handleFileUpload(e));

        // Handle delete buttons
        this.musicList.addEventListener('click', (e) => {
            const deleteBtn = e.target.closest('.delete-btn');
            if (deleteBtn) {
                const listItem = deleteBtn.closest('.music-list-item');
                const filename = listItem.querySelector('.song-name').textContent;
                void this.deleteFile(filename, listItem);
            }
        });
    }

    async handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        const validTypes = ['.wav', '.flac'];
        const fileExt = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
        if (!validTypes.includes(fileExt)) {
            alert('Please select only .wav or .flac files');
            this.uploadInput.value = ''; // Clear the input
            return;
        }

        // Create form data
        const formData = new FormData();
        formData.append('audioFile', file);

        try {
            const response = await fetch('/upload', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (!response.ok) {
                console.log(result.error || 'Upload failed');
            }

            // Add new file to the list
            this.addFileToList(result.filename);
            this.uploadInput.value = ''; // Clear the input

        } catch (error) {
            console.error('Upload error:', error);
            alert('Failed to upload file: ' + error.message);
        }
    }

    async deleteFile(filename, listItem) {
        if (!confirm(`Are you sure you want to delete ${filename}?`)) {
            return;
        }

        try {
            const response = await fetch(`/delete/${encodeURIComponent(filename)}`, {
                method: 'DELETE'
            });

            const result = await response.json();

            if (!response.ok) {
                console.log(result.error || 'Delete failed');
                return;
            }

            // Remove the list item from DOM
            listItem.remove();

        } catch (error) {
            console.error('Delete error:', error);
            alert('Failed to delete file: ' + error.message);
        }
    }

    addFileToList(filename) {
        const li = document.createElement('li');
        li.className = 'music-list-item';
        li.setAttribute('data-file', `/data/music/${filename}`);

        li.innerHTML = `
            <i class="material-icons">music_note</i>
            <span class="song-name">${filename}</span>
            <button class="delete-btn" title="Delete">
                <i class="material-icons">delete</i>
            </button>
        `;

        this.musicList.appendChild(li);
    }
}