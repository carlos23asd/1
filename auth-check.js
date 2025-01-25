document.addEventListener('DOMContentLoaded', () => {
  const isAuthenticated = sessionStorage.getItem('isAuthenticated');

  if (!isAuthenticated || isAuthenticated !== 'true') {
    window.location.href = 'index.html';
  }

  function logout() {
    sessionStorage.removeItem('isAuthenticated');
    window.location.href = 'index.html';
  }

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
        debugger;
      }
    }

    const intervalCheck = setInterval(checkDevTools, 500);

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

    document.addEventListener('keydown', (e) => {
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

    function detectDevToolsChange() {
      const before = window.console.log;
      window.console.log = function() {
        debugger;
        return before.apply(console, arguments);
      };
    }

    detectDevToolsChange();
  }

  preventDevTools();
});