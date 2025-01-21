document.addEventListener('DOMContentLoaded', () => {
    // Check authentication status
    const isAuthenticated = sessionStorage.getItem('isAuthenticated');

    if (!isAuthenticated || isAuthenticated !== 'true') {
        // Redirect to login page if not authenticated
        window.location.href = 'index.html';
    }

    // Optional: Add logout functionality
    function logout() {
        sessionStorage.removeItem('isAuthenticated');
        window.location.href = 'index.html';
    }

    // You can add a logout button or trigger logout as needed
    // Example: 
    // document.getElementById('logoutButton').addEventListener('click', logout);
});