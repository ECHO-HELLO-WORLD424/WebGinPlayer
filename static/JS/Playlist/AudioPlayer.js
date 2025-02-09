document.addEventListener('DOMContentLoaded', function() {
    const audioPlayer = document.getElementById('audioPlayer');
    const musicList = document.getElementById('musicList');
    const canvas = document.getElementById('visualizer');
    const ctx = canvas.getContext('2d');
    let currentTrack = null;
    let audioContext;
    let analyser;
    let source;
    let animationId;

    function initAudio() {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            source = audioContext.createMediaElementSource(audioPlayer);
            source.connect(analyser);
            analyser.connect(audioContext.destination);
        }
    }

    function drawSpectrum() {
        if (!analyser) {
            initAudio();
        }

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        const width = canvas.width;
        const height = canvas.height;
        const barWidth = width / bufferLength * 2.5;

        function animate() {
            animationId = requestAnimationFrame(animate);
            analyser.getByteFrequencyData(dataArray);

            const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';

            ctx.fillStyle = isDarkMode ? 'rgba(0, 0, 0, 0.1)' : 'rgba(0, 0, 0, 0.1)';
            ctx.fillRect(0, 0, width, height);

            let x = 0;
            for(let i = 0; i < bufferLength; i++) {
                const barHeight = dataArray[i] * 0.7;

                const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight);
                if (isDarkMode) {
                    gradient.addColorStop(0, '#7740c5');
                    gradient.addColorStop(1, '#daa803');
                } else {
                    gradient.addColorStop(0, '#6200ee');
                    gradient.addColorStop(1, '#fbb103');
                }

                ctx.fillStyle = gradient;
                ctx.fillRect(x, height - barHeight, barWidth, barHeight);
                x += barWidth + 1;
            }
        }

        animate();
    }

    function updateCurrentTrack(clickedItem) {
        if (currentTrack) {
            currentTrack.classList.remove('playing');
        }
        clickedItem.classList.add('playing');
        currentTrack = clickedItem;
    }

    // Update music list event listeners to handle both shared and playlist-specific files
    musicList.querySelectorAll('.music-list-item').forEach((item) => {
        item.addEventListener('click', function() {
            const audioFile = this.getAttribute('data-file');
            playTrack(audioFile);
            updateCurrentTrack(this);
        });
    });

    function playTrack(audioFile) {
        if (animationId) {
            cancelAnimationFrame(animationId);
        }

        audioPlayer.src = audioFile;
        audioPlayer.play().then(() => {
            initAudio();
            drawSpectrum();
        }).catch(error => {
            console.error('Error playing audio:', error);
        });
    }

    audioPlayer.addEventListener('ended', function() {
        const tracks = musicList.querySelectorAll('.music-list-item');
        let nextTrack;

        if (currentTrack) {
            const currentIndex = Array.from(tracks).indexOf(currentTrack);
            const nextIndex = (currentIndex + 1) % tracks.length;
            nextTrack = tracks[nextIndex];
        } else {
            nextTrack = tracks[0];
        }

        const audioFile = nextTrack.getAttribute('data-file');
        playTrack(audioFile);
        updateCurrentTrack(nextTrack);
    });

    audioPlayer.addEventListener('pause', function() {
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
    });

    audioPlayer.addEventListener('play', function() {
        if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume();
        }
        if (!animationId) {
            drawSpectrum();
        }
    });
});