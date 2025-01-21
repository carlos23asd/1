document.addEventListener('DOMContentLoaded', () => {
    const video = document.getElementById('videoPlayer');
    const playlistItems = document.getElementById('playlistItems');
    let player = null;
    let hls = null;
    let flvPlayer = null;
    let currentPlayingIndex = -1;

    // Predefined playlist
    const playlist = [
        {
            title: "Simpson Live Stream (FLV)",
            url: "https://stream-cdn-iad2.vaughnsoft.net/play/live_simpson_maniahd193.flv"
        },
        {
            title: "Big Buck Bunny (HLS)",
            url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"
        },
        {
            title: "Test Stream (HLS)",
            url: "https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8"
        },
        {
            title: "Sintel Trailer",
            url: "https://media.w3.org/2010/05/sintel/trailer.mp4"
        },
        {
            title: "Test HLS Stream",
            url: "https://test-streams.mux.dev/test_001/stream.m3u8"
        }
    ];

    // Initialize Plyr with custom options
    const plyrOptions = {
        controls: [
            'play-large',
            'play',
            'progress',
            'current-time',
            'mute',
            'volume',
            'captions',
            'settings',
            'pip',
            'airplay',
            'fullscreen'
        ],
        settings: ['captions', 'quality', 'speed'],
        quality: {
            default: 576,
            options: [4320, 2160, 1080, 720, 576, 480, 360, 240]
        },
        autoplay: false,
        disableContextMenu: true,
        resetOnEnd: true,
        keyboard: { focused: true, global: true }
    };

    // Enhanced playlist UI update function
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

    // Stream loading function
    function loadStream(index) {
        const streamUrl = playlist[index].url;
        currentPlayingIndex = index;
        updatePlaylistUI();
        
        stopCurrentStream();

        if (streamUrl.endsWith('.m3u8')) {
            loadHLSStream(streamUrl);
        } else if (streamUrl.endsWith('.flv')) {
            loadFLVStream(streamUrl);
        } else {
            loadDirectStream(streamUrl);
        }
    }

    function loadHLSStream(streamUrl) {
        if (Hls.isSupported()) {
            hls = new Hls();
            hls.loadSource(streamUrl);
            hls.attachMedia(video);
            
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                player.play();
            });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = streamUrl;
        }
    }

    function loadFLVStream(streamUrl) {
        if (flvjs.isSupported()) {
            flvPlayer = flvjs.createPlayer({
                type: 'flv',
                url: streamUrl,
                isLive: true
            });
            
            flvPlayer.attachMediaElement(video);
            flvPlayer.load();
            flvPlayer.play();
        } else {
            loadDirectStream(streamUrl);
        }
    }

    function loadDirectStream(streamUrl) {
        video.src = streamUrl;
        player.play();
    }

    function stopCurrentStream() {
        if (hls) {
            hls.destroy();
            hls = null;
        }
        if (flvPlayer) {
            flvPlayer.destroy();
            flvPlayer = null;
        }
        video.removeAttribute('src');
    }

    // Auto-play next
    video.addEventListener('ended', () => {
        if (currentPlayingIndex < playlist.length - 1) {
            loadStream(currentPlayingIndex + 1);
        }
    });

    // TV Mode Navigation
    function handleTVNavigation(e) {
        const items = document.querySelectorAll('.playlist-item');
        
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

    // Initialize the player
    function initialize() {
        // Initialize Plyr
        player = new Plyr(video, plyrOptions);

        // Add TV mode navigation
        document.addEventListener('keydown', handleTVNavigation);

        // Prevent right-click
        document.addEventListener('contextmenu', (e) => e.preventDefault());

        // Initialize with first stream
        updatePlaylistUI();
        if (playlist.length > 0) {
            loadStream(0);
        }
    }

    // Call initialize at the end of the script
    initialize();
});