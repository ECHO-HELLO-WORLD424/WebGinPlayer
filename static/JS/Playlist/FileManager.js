class FileManager {
    constructor(musicList) {
        this.musicList = musicList;
        this.uploadInput = document.getElementById('audioFileInput');
        this.playlistId = this.getPlaylistIdFromUrl();
        this.bindEvents();
    }

    getPlaylistIdFromUrl() {
        const pathParts = window.location.pathname.split('/');
        return pathParts[pathParts.length - 1];
    }

    bindEvents() {
        this.uploadInput.addEventListener('change', (e) => this.handleAudioUpload(e));

        this.musicList.addEventListener('click', (e) => {
            const deleteBtn = e.target.closest('.delete-btn');
            if (deleteBtn) {
                const listItem = deleteBtn.closest('.music-list-item');
                const filename = listItem.querySelector('.song-name').textContent;
                void this.deleteAudioFile(filename, listItem);
            }
        });
    }

    async handleAudioUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const validTypes = ['.wav', '.flac'];
        const fileExt = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
        if (!validTypes.includes(fileExt)) {
            alert('Please select only .wav or .flac files');
            this.uploadInput.value = '';
            return;
        }

        const formData = new FormData();
        formData.append('audioFile', file);
        formData.append('playlistId', this.playlistId);

        try {
            const response = await fetch('/upload', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (!response.ok) {
                console.log(result.error || 'Upload failed');
                return;
            }

            this.addAudioToList(result.filename);
            this.uploadInput.value = '';

        } catch (error) {
            console.error('Upload error:', error);
            alert('Failed to upload file: ' + error.message);
        }
    }

    async deleteAudioFile(filename, listItem) {
        if (!confirm(`Are you sure you want to delete ${filename}?`)) {
            return;
        }

        const isSharedFile = listItem.getAttribute('data-shared') === 'true';
        const endpoint = isSharedFile ?
            `/delete/shared/${encodeURIComponent(filename)}` :
            `/delete/${this.playlistId}/${encodeURIComponent(filename)}`;

        try {
            const response = await fetch(endpoint, {
                method: 'DELETE'
            });

            const result = await response.json();

            if (!response.ok) {
                console.log(result.error || 'Delete failed');
                return;
            }

            listItem.remove();

        } catch (error) {
            console.error('Delete error:', error);
            alert('Failed to delete file: ' + error.message);
        }
    }

    addAudioToList(filename) {
        const li = document.createElement('li');
        li.className = 'music-list-item';

        // Check if the file is from shared folder
        const isShared = filename.startsWith('shared/');
        const displayFilename = isShared ? filename.substring(7) : filename;
        const filePath = isShared ?
            `/assets/music/shared/${displayFilename}` :
            `/assets/music/${this.playlistId}/${displayFilename}`;

        li.setAttribute('data-file', filePath);
        li.setAttribute('data-shared', isShared);

        li.innerHTML = `
            <i class="material-icons">music_note</i>
            <span class="song-name">${displayFilename}</span>
            <button class="delete-btn" title="Delete">
                <i class="material-icons">delete</i>
            </button>
        `;

        this.musicList.appendChild(li);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all music lists as one combined list for the FileManager
    const musicList = document.querySelector('.music-sections');
    new FileManager(musicList);
});