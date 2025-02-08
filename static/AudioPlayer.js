document.addEventListener('DOMContentLoaded', function() {
    const audioPlayer = document.getElementById('audioPlayer');
    const musicList = document.getElementById('musicList');
    const canvas = document.getElementById('visualizer');
    const themeToggle = document.querySelector('.theme-toggle');
    const themeIcon = themeToggle.querySelector('i');
    const ctx = canvas.getContext('2d');
    let currentTrack = null;
    let audioContext;
    let analyser;
    let source;
    let animationId;

    // Theme management
    function setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        themeIcon.textContent = theme === 'dark' ? 'light_mode' : 'dark_mode';
    }

    // Initialize theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);

    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
    });

    // Initialize Web Audio API
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

    // Function to draw the spectrum with theme-aware colors
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

            const isDarkMode = document.documentElement.getAttribute('assets-theme') === 'dark';

            // Theme-aware background
            ctx.fillStyle = isDarkMode ? 'rgba(0, 0, 0, 0.1)' : 'rgba(0, 0, 0, 0.1)';
            ctx.fillRect(0, 0, width, height);

            let x = 0;
            for(let i = 0; i < bufferLength; i++) {
                const barHeight = dataArray[i] * 0.7;

                // Theme-aware gradient
                const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight);
                if (isDarkMode) {
                    gradient.addColorStop(0, '#7740c5');    // Dark theme primary
                    gradient.addColorStop(1, '#03dac6');    // Dark theme secondary
                } else {
                    gradient.addColorStop(0, '#6200ee');    // Light theme primary
                    gradient.addColorStop(1, '#03dac6');    // Light theme secondary
                }

                ctx.fillStyle = gradient;
                ctx.fillRect(x, height - barHeight, barWidth, barHeight);
                x += barWidth + 1;
            }
        }

        animate();
    }

    // Update the currently playing track UI
    function updateCurrentTrack(clickedItem) {
        if (currentTrack) {
            currentTrack.classList.remove('playing');
        }
        clickedItem.classList.add('playing');
        currentTrack = clickedItem;
    }

    // Add click event listeners to playlist items
    musicList.querySelectorAll('.music-list-item').forEach((item) => {
        // Add click event listener
        item.addEventListener('click', function() {
            const audioFile = this.getAttribute('assets-file');
            playTrack(audioFile);
            updateCurrentTrack(this);
        });
    });

    // Function to play a track
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

    // Play next track when current track ends
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

        const audioFile = nextTrack.getAttribute('assets-file');
        playTrack(audioFile);
        updateCurrentTrack(nextTrack);
    });

    // Handle play/pause visualization
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