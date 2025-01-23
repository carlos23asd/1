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

    // Add HLS.js library for better HLS support
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
            title: "Caracol TV",
            url: "https://stream.gia.tv/giatv/giatv-Gary2CanalGary2Canal/Gary2CanalGary2Canal/chunks.m3u8",
            type: 'hls'
        },
        {
            title: "Win+",
            url: "https://cgxheq.fubohd.com/winsportsplus/tracks-v1a1/mono.m3u8?token=7020e10dfe32e71130607d8502e2a99c7e10211c-1c-1737620067-1737584067",
            type: 'hls'
        },
        {
            title: "Dsports",
            url: "https://vadp.pricesaskeloadsc.com/dsports/tracks-v1a1/mono.m3u8?token=d56335ab493eb4da6dedf1c5d96f1fb6b898eb2f-a5-1737620134-1737584134",
            type: 'hls'
        },
        {
            title: "ESPN",
            url: "https://media.w3.org/2010/05/sintel/trailer.mp4",
            type: 'hls'
        },
      {
            title: "ESPN 2",
            url: "https://media.w3.org/2010/05/sintel/trailer.mp4",
            type: 'hls'
        },
      {
            title: "ESPN 3",
            url: "https://media.w3.org/2010/05/sintel/trailer.mp4",
            type: 'hls'
        },
      {
            title: "ESPN 4",
            url: "https://media.w3.org/2010/05/sintel/trailer.mp4",
            type: 'hls'
        },
      {
            title: "ESPN Extra",
            url: "https://media.w3.org/2010/05/sintel/trailer.mp4",
            type: 'hls'
        },
      {
            title: "ESPN Premium",
            url: "https://media.w3.org/2010/05/sintel/trailer.mp4",
            type: 'hls'
        },
      {
            title: "Solo eventos",
            url: "https://ch.livestreamdz.xyz/espn2/tracks-v1a1/mono.m3u8?md5=rrwkpGOlTw_JqjgKtSKScg&expires=1737612647",
            type: 'hls'
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

    // Load stream based on type
    function loadStream(index) {
        destroyCurrentPlayer();

        const streamInfo = playlist[index];
        currentPlayingIndex = index;
        updatePlaylistUI();

        // Enhanced FLV player configuration
        if (streamInfo.type === 'flv' && flvjs.isSupported()) {
            flvPlayer = flvjs.createPlayer({
                type: 'flv',
                url: streamInfo.url,
                isLive: streamInfo.url.includes('live'),
                cors: true,
                hasAudio: true,
                hasVideo: true,
                config: {
                    enableStashBuffer: true,
                    stashInitialSize: 4 * 1024 * 1024, // 4MB stash size for faster loading
                    enableWorker: true,
                    seekType: 'range',
                    lazyLoad: false,
                    lazyLoadMaxDuration: 180,
                    deferLoadAfterSourceOpen: false,
                    fixAudioTimestampGap: true,
                    accurateSeek: true,
                    autoCleanupSourceBuffer: true,
                }
            });
            
            flvPlayer.attachMediaElement(video);
            flvPlayer.load();
            
            flvPlayer.on(flvjs.Events.LOADED_METADATA, () => {
                video.play();
                updateVideoControls();
            });
        } 
        // Enhanced HLS player configuration with optimized bandwidth settings
        else if (streamInfo.type === 'hls' && Hls.isSupported()) {
            hlsPlayer = new Hls({
                debug: false,
                enableWorker: true,
                lowLatencyMode: true,
                backBufferLength: 90,
                maxBufferSize: 4 * 1000 * 1000, // 4MB buffer size
                maxBufferLength: 60,
                maxMaxBufferLength: 700,
                startFragPrefetch: true,
                autoStartLoad: true,
                startPosition: -1,
                maxLoadingDelay: 5,
                progressive: true,
                testBandwidth: true,
                // Configure initial bandwidth estimate to 4Mbps
                abrEwmaDefaultEstimate: 4000000, // 4Mbps initial estimate
                abrBandWidthFactor: 0.95,
                abrBandWidthUpFactor: 0.7,
                abrMaxWithRealBitrate: true,
                // Optimize streaming parameters
                liveSyncDurationCount: 3,
                liveMaxLatencyDurationCount: 10,
                maxFragLookUpTolerance: 0.5,
                // Improve loading retry settings
                manifestLoadingMaxRetry: 4,
                manifestLoadingRetryDelay: 500,
                levelLoadingMaxRetry: 4,
                levelLoadingRetryDelay: 500,
            });

            hlsPlayer.loadSource(streamInfo.url);
            hlsPlayer.attachMedia(video);

            hlsPlayer.on(Hls.Events.MANIFEST_PARSED, () => {
                video.play();
                updateVideoControls();
            });

            // Advanced error handling and recovery
            hlsPlayer.on(Hls.Events.ERROR, (event, data) => {
                if (data.fatal) {
                    switch (data.type) {
                        case Hls.ErrorTypes.NETWORK_ERROR:
                            hlsPlayer.startLoad(); // Try reloading
                            break;
                        case Hls.ErrorTypes.MEDIA_ERROR:
                            hlsPlayer.recoverMediaError();
                            break;
                        default:
                            destroyCurrentPlayer();
                            loadStream(currentPlayingIndex); // Restart stream
                            break;
                    }
                }
            });
        } else {
            // Enhanced native player configuration
            video.preload = "auto";
            video.src = streamInfo.url;
            video.play();
        }

        initializeTVControls();
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

    // Enhanced TV Mode Navigation
    let focusedElement = null;
    const focusableElements = ['playPauseBtn', 'fullscreenBtn'];
    let currentFocusIndex = -1;

    function handleTVNavigation(e) {
        switch (e.key) {
            case 'ArrowUp':
                if (currentPlayingIndex > 0) {
                    removeTVFocus();
                    loadStream(currentPlayingIndex - 1);
                }
                break;
            case 'ArrowDown':
                if (currentPlayingIndex < playlist.length - 1) {
                    removeTVFocus();
                    loadStream(currentPlayingIndex + 1);
                }
                break;
            case 'ArrowLeft':
                navigateVideoControls('prev');
                break;
            case 'ArrowRight':
                navigateVideoControls('next');
                break;
            case 'Enter':
                if (focusedElement) {
                    focusedElement.click();
                }
                break;
        }
    }

    function navigateVideoControls(direction) {
        removeTVFocus();
        
        if (direction === 'next') {
            currentFocusIndex = (currentFocusIndex + 1) % focusableElements.length;
        } else {
            currentFocusIndex = currentFocusIndex <= 0 ? 
                focusableElements.length - 1 : 
                currentFocusIndex - 1;
        }

        focusedElement = document.getElementById(focusableElements[currentFocusIndex]);
        addTVFocus();
    }

    function addTVFocus() {
        if (focusedElement) {
            focusedElement.classList.add('tv-focus');
        }
    }

    function removeTVFocus() {
        if (focusedElement) {
            focusedElement.classList.remove('tv-focus');
        }
    }

    function initializeTVControls() {
        currentFocusIndex = 0;
        focusedElement = document.getElementById(focusableElements[currentFocusIndex]);
        addTVFocus();
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