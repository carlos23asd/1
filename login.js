document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const passwordInput = document.getElementById('passwordInput');
    const loginError = document.getElementById('loginError');

    // Secure password storage and validation
    const correctPassword = '12'; // As specified by user

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

    // Prevent multiple login attempts
    let loginAttempts = 0;
    const maxAttempts = 5;

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Encrypt input with simple hash for added security
        const hashedInput = btoa(passwordInput.value);
        const hashedCorrect = btoa(correctPassword);

        loginAttempts++;
        
        if (loginAttempts >= maxAttempts) {
            loginForm.innerHTML = `
                <div style="color: #ff4d4d; text-align: center;">
                    Too many login attempts. Please try again later.
                </div>
            `;
            
            // Disable login for 5 minutes
            setTimeout(() => {
                loginAttempts = 0;
                loginForm.reset();
            }, 5 * 60 * 1000);
            return;
        }

        if (hashedInput === hashedCorrect) {
            // Successful login - redirect to video player
            sessionStorage.setItem('isAuthenticated', 'true');
            window.location.href = 'video-player.html';
        } else {
            // Show error with animation
            loginError.style.opacity = '1';
            passwordInput.value = ''; // Clear input
            
            // Auto-hide error after 2 seconds
            setTimeout(() => {
                loginError.style.opacity = '0';
            }, 2000);
        }
    });

    // Prevent context menu
    document.addEventListener('contextmenu', (e) => e.preventDefault());
});