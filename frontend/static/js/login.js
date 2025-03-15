document.addEventListener('DOMContentLoaded', function() {
    console.log('Login page loaded');
    
    // The login form submission is now handled by auth.js
    // This file is kept for any login-specific UI enhancements
    
    // Add password visibility toggle
    const passwordInput = document.getElementById('password');
    const togglePassword = document.createElement('button');
    togglePassword.type = 'button';
    togglePassword.className = 'password-toggle';
    togglePassword.innerHTML = '<i class="fas fa-eye"></i>';
    togglePassword.addEventListener('click', function() {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        this.innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
    });
    
    if (passwordInput) {
        const parentDiv = passwordInput.parentElement;
        parentDiv.style.position = 'relative';
        togglePassword.style.position = 'absolute';
        togglePassword.style.right = '10px';
        togglePassword.style.top = '50%';
        togglePassword.style.transform = 'translateY(-50%)';
        togglePassword.style.border = 'none';
        togglePassword.style.background = 'transparent';
        togglePassword.style.cursor = 'pointer';
        parentDiv.appendChild(togglePassword);
    }
    
    // Check for authentication redirect
    const urlParams = new URLSearchParams(window.location.search);
    const errorMessage = urlParams.get('error');
    const loginError = document.getElementById('login-error');
    
    if (errorMessage && loginError) {
        loginError.textContent = decodeURIComponent(errorMessage);
    }
});