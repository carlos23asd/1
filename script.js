document.addEventListener('DOMContentLoaded', () => {
    const video = document.getElementById('videoPlayer');
    const playPauseBtn = document.getElementById('playPauseBtn');
    const progressBar = document.getElementById('progressBar');
    const currentTimeEl = document.getElementById('currentTime');
    const durationEl = document.getElementById('duration');
    const muteBtn = document.getElementById('muteBtn');
    const volumeSlider = document.getElementById('volumeSlider');
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    const playlistItems = document.getElementById('playlistItems');

    // Improved buffering and download configuration
    const ADVANCED_BUFFER_CONFIG = {
        maxBufferLength: 120,      // Increase buffer length to 120 seconds
        maxBufferSize: 120 * 1000 * 1000,  // 120 MB buffer size
        highWaterMark: 32,         // Increase network buffer
        maxMaxBufferLength: 600,   // Maximum possible buffer length
        liveSyncDurationCount: 3,  // For live streams
        liveMaxLatencyDurationCount: 10,  // Reduce latency
        manifestLoadingMaxRetry: 3, // More retry attempts
        manifestLoadingRetryDelay: 1000,  // 1 second between retries
        enableWebWorker: true,     // Use web workers for decoding
        enableCodecCache: true     // Enable codec caching
    };

    // Add HLS.js library with advanced configuration
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest';
    document.head.appendChild(script);

    let flvPlayer = null;
    let hlsPlayer = null;

    // Predefined playlist with FLV and HLS support
    const playlist = [
        {
            title: "Simpson Live Stream (FLV)",
            url: "https://stream-cdn-iad2.vaughnsoft.net/play/live_simpson_maniahd193.flv",
            type: 'flv'
        },
        {
            title: "Solo eventos",
            url: "https://manifest-gcp-us-east1-vop1.fastly.mux.com/dGuVCvN01Z1dOac9BJ8eFayqlEd01Tq7TiKSwnMiGvbbdlVpbjNb01jiF5boelMhawUpzMY00HZw613oFBEmv1ieGR00ySO1191q00is6v9i8AQuw/rendition.m3u8?cdn=fastly&exclude_pdt=false&expires=1738102380&live=1&rid=bTsv1EIqw87rryr4T4fYZyZ01tdBpoYr9Iy8J3wsj59k&skid=default&signature=Njc5OTU2NmNfYzIzODk1OTQzMmJjYmY5YTY3MTM2ZGFjZmI1YzBhZGI0NzI0NWIzYzc1ZjY2MmY4Y2Y3ZjI4OTBmOTRkMjFhYg%3D%3D&vsid=vEsQDzFdE01sFvuTUN5dyX6QZx00x7ZmqwvvcuwkxOTu02TC02doXyETEJamYl5A5EkP0102l5gkTBpiECn0200hnomB6YJhHUPEonzzNVtqUmDrDs011EBbXOBTW9G3zb1aYkX4K&CMCD=cid%3D%22sCgrwC01SM00zaYdB00EDw8xiIy15OXdD2MCN00NbwMtoks%22%2Csid%3D%2249de2222-c665-4395-a9cc-fcef86ebb173%22",
            type: 'hls'
        },
        {
            title: "T",
            url: "https://dglvz29s.fubohd.com/espn2/tracks-v1a1/mono.m3u8?token=666bf951dd49ee8611c0f9735b1f82da31e48115-c4-1737518257-1737482257",
            type: 'hls'
        },
        {
            title: "Another HLS Stream",
            url: "https://test-streams.mux.dev/test_001/stream.m3u8",
            type: 'hls'
        },
        {
            title: "Sintel Trailer",
            url: "https://media.w3.org/2010/05/sintel/trailer.mp4",
            type: 'mp4'
        }
    ];

    let currentPlayingIndex = -1;

    // Utility Functions
    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    // Destroy existing players
    function destroyCurrentPlayer() {
        if (flvPlayer) {
            flvPlayer.destroy();
            flvPlayer = null;
        }
        if (hlsPlayer) {
            hlsPlayer.destroy();
            hlsPlayer = null;
        }
        video.pause();
        video.removeAttribute('src');
    }

    // Load stream based on type with enhanced buffering
    function loadStream(index) {
        destroyCurrentPlayer();

        const streamInfo = playlist[index];
        currentPlayingIndex = index;
        updatePlaylistUI();

        // Handle different stream types with advanced buffering
        if (streamInfo.type === 'flv' && flvjs.isSupported()) {
            flvPlayer = flvjs.createPlayer({
                type: 'flv',
                url: streamInfo.url,
                isLive: streamInfo.url.includes('live'),
                config: {
                    lazyLoad: false,
                    autoCleanupSourceBuffer: true,
                    autoCleanupMaxBackwardDistance: 120,
                    autoCleanupMinBackwardDistance: 60,
                    enableWorker: true,
                    enableStashBuffer: true,
                    stashInitialSize: 1024 * 1024 * 2  // 2MB initial stash
                }
            });
            
            flvPlayer.attachMediaElement(video);
            flvPlayer.load();
            
            flvPlayer.on(flvjs.Events.LOADED_METADATA, () => {
                video.play();
                updateVideoControls();
            });
        } else if (streamInfo.type === 'hls' && Hls.isSupported()) {
            hlsPlayer = new Hls({
                ...ADVANCED_BUFFER_CONFIG,
                debug: false,
                enableWorker: true,
                autoStartLoad: true,
                startPosition: -1,
                // Network and performance optimizations
                xhrSetup: (xhr, url) => {
                    xhr.withCredentials = false;  // Disable credentials
                    xhr.timeout = 10000;  // 10-second timeout
                }
            });

            hlsPlayer.loadSource(streamInfo.url);
            hlsPlayer.attachMedia(video);

            hlsPlayer.on(Hls.Events.MANIFEST_PARSED, () => {
                video.play();
                updateVideoControls();
            });

            hlsPlayer.on(Hls.Events.ERROR, (event, data) => {
                console.error('HLS Error:', data);
                // Fallback to native HLS support if available
                if (video.canPlayType('application/vnd.apple.mpegurl')) {
                    video.src = streamInfo.url;
                    video.play();
                }
            });
        } else {
            // Fallback for non-HLS/FLV or unsupported browsers
            video.src = streamInfo.url;
            video.play();
        }
    }

    // Update video controls
    function updateVideoControls() {
        if (video.duration) {
            durationEl.textContent = formatTime(video.duration);
            progressBar.max = 100;
        }
    }

    // Control Functions
    function togglePlayPause() {
        if (video.paused) {
            video.play();
            playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
        } else {
            video.pause();
            playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
        }
    }

    function updateProgressBar() {
        const percentage = (video.currentTime / video.duration) * 100;
        progressBar.value = percentage;
        currentTimeEl.textContent = formatTime(video.currentTime);
    }

    function seekVideo(e) {
        const seekTime = (e.target.value / 100) * video.duration;
        video.currentTime = seekTime;
    }

    function toggleMute() {
        video.muted = !video.muted;
        muteBtn.innerHTML = video.muted 
            ? '<i class="fas fa-volume-mute"></i>' 
            : '<i class="fas fa-volume-up"></i>';
    }

    function updateVolume(e) {
        video.volume = e.target.value;
        muteBtn.innerHTML = video.volume > 0 
            ? '<i class="fas fa-volume-up"></i>' 
            : '<i class="fas fa-volume-mute"></i>';
    }

    function toggleFullscreen() {
        if (!document.fullscreenElement) {
            video.requestFullscreen?.() || 
            video.webkitRequestFullscreen?.() || 
            video.mozRequestFullScreen?.() || 
            video.msRequestFullscreen?.();
            fullscreenBtn.innerHTML = '<i class="fas fa-compress"></i>';
        } else {
            document.exitFullscreen?.() ||
            document.webkitExitFullscreen?.() ||
            document.mozCancelFullScreen?.() ||
            document.msExitFullscreen?.();
            fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i>';
        }
    }

    // Playlist Management
    function updatePlaylistUI() {
        playlistItems.innerHTML = '';
        
        playlist.forEach((item, index) => {
            const li = document.createElement('li');
            li.className = 'playlist-item';
            
            if (index === currentPlayingIndex) {
                li.classList.add('active');
            }
            
            li.textContent = item.title;
            li.addEventListener('click', () => loadStream(index));
            playlistItems.appendChild(li);
        });
    }

    // Event Listeners
    playPauseBtn.addEventListener('click', togglePlayPause);
    progressBar.addEventListener('input', seekVideo);
    video.addEventListener('timeupdate', updateProgressBar);
    video.addEventListener('loadedmetadata', updateVideoControls);

    muteBtn.addEventListener('click', toggleMute);
    volumeSlider.addEventListener('input', updateVolume);
    fullscreenBtn.addEventListener('click', toggleFullscreen);

    // Auto-play next
    video.addEventListener('ended', () => {
        if (currentPlayingIndex < playlist.length - 1) {
            loadStream(currentPlayingIndex + 1);
        }
    });

    // TV Mode Navigation
    function handleTVNavigation(e) {
        switch (e.key) {
            case 'ArrowUp':
                if (currentPlayingIndex > 0) {
                    loadStream(currentPlayingIndex - 1);
                }
                break;
            case 'ArrowDown':
                if (currentPlayingIndex < playlist.length - 1) {
                    loadStream(currentPlayingIndex + 1);
                }
                break;
        }
    }

    // Advanced Debugger Prevention
    function preventDevTools() {
        let devToolsOpen = false;

        function checkDevTools() {
            const threshold = 160;
            const widthDiff = window.outerWidth - window.innerWidth;
            const heightDiff = window.outerHeight - window.innerHeight;

            if (widthDiff > threshold || heightDiff > threshold) {
                devToolsOpen = true;
            }

            if (devToolsOpen) {
                debugger;  // Pause execution when dev tools are open
            }
        }

        // Periodic check for dev tools
        const intervalCheck = setInterval(checkDevTools, 500);

        // Block console
        const $_console = console;
        Object.defineProperty(window, 'console', {
            get: function() {
                if ($_console._commandLineAPI) {
                    throw new Error("Dev tools access blocked");
                }
                return $_console;
            },
            set: function(val) {
                $_console = val;
            }
        });

        // Prevent Keyboard Shortcuts
        document.addEventListener('keydown', (e) => {
            // Block F12, Ctrl+Shift+I, Ctrl+U, F5
            if (
                e.key === 'F12' || 
                (e.ctrlKey && e.shiftKey && e.key === 'I') ||
                (e.ctrlKey && e.key === 'U') ||
                e.key === 'F5'
            ) {
                e.preventDefault();
                debugger;
            }
        });

        // Detect changes in dev tools state
        function detectDevToolsChange() {
            const before = window.console.log;
            window.console.log = function() {
                debugger;
                return before.apply(console, arguments);
            };
        }

        detectDevToolsChange();
    }

    // Run debugger prevention
    preventDevTools();

    document.addEventListener('contextmenu', (e) => e.preventDefault());
    document.addEventListener('keydown', (e) => {
        // Prevent F12, Ctrl+Shift+I, Ctrl+U
        if (
            e.key === 'F12' || 
            (e.ctrlKey && e.shiftKey && e.key === 'I') ||
            (e.ctrlKey && e.key === 'U')
        ) {
            e.preventDefault();
        }
    });

    // Add TV mode navigation
    document.addEventListener('keydown', handleTVNavigation);

    // Initialize with first stream
    script.onload = () => {
        updatePlaylistUI();
        if (playlist.length > 0) {
            loadStream(0);
        }
    };
});
