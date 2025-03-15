// Auth.js - Handles user authentication and session management

document.addEventListener('DOMContentLoaded', function() {
    // Initialize auth state
    initAuth();
    
    // Add event listeners for auth forms
    initAuthForms();
    
    // Add event listener for logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
});

// Initialize authentication state
function initAuth() {
    const token = localStorage.getItem('auth_token');
    const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
    
    // Update UI based on auth state
    updateAuthUI(!!token, userData);
    
    // If no token but on protected page, redirect to login
    if (!token && isProtectedPage()) {
        window.location.href = '/login.html';
    }
    
    // If has token but on auth page, redirect to dashboard
    if (token && isAuthPage()) {
        window.location.href = '/dashboard.html';
    }
}

// Check if current page is a protected page
function isProtectedPage() {
    const path = window.location.pathname;
    return path.includes('/dashboard') || 
           path.includes('/transactions') || 
           path.includes('/accounts') || 
           path.includes('/budgets') ||
           path.includes('/reports') ||
           path.includes('/settings');
}

// Check if current page is an auth page
function isAuthPage() {
    const path = window.location.pathname;
    return path.includes('/login.html') || path.includes('/register.html');
}

// Update UI based on authentication state
function updateAuthUI(isAuthenticated, userData) {
    // Update user name if available
    const userNameElement = document.getElementById('user-name');
    if (userNameElement && userData.username) {
        userNameElement.textContent = userData.username;
    }
    
    // Show/hide auth-dependent elements
    document.querySelectorAll('.auth-required').forEach(el => {
        el.style.display = isAuthenticated ? 'block' : 'none';
    });
    
    document.querySelectorAll('.no-auth-required').forEach(el => {
        el.style.display = isAuthenticated ? 'none' : 'block';
    });
}

// Initialize auth forms
function initAuthForms() {
    // Login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Register form
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
}

// Handle login form submission
async function handleLogin(event) {
    event.preventDefault();
    
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const errorMsg = document.getElementById('login-error');
    
    // Clear previous error
    if (errorMsg) errorMsg.textContent = '';
    
    // Validate input
    if (!usernameInput.value || !passwordInput.value) {
        if (errorMsg) errorMsg.textContent = 'Username and password are required';
        return;
    }
    
    // Show loading state
    const submitBtn = document.querySelector('#login-form button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Logging in...';
    }
    
    try {
        // Send login request
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: usernameInput.value,
                password: passwordInput.value
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Login failed');
        }
        
        // Store auth token and user data
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('user_data', JSON.stringify(data.user));
        
        // Redirect to dashboard
        window.location.href = '/dashboard.html';
        
    } catch (error) {
        if (errorMsg) errorMsg.textContent = error.message;
        console.error('Login error:', error);
    } finally {
        // Reset button state
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Login';
        }
    }
}

// Handle register form submission
async function handleRegister(event) {
    event.preventDefault();
    
    const usernameInput = document.getElementById('username');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    const errorMsg = document.getElementById('register-error');
    
    // Clear previous error
    if (errorMsg) errorMsg.textContent = '';
    
    // Validate input
    if (!usernameInput.value || !emailInput.value || !passwordInput.value) {
        if (errorMsg) errorMsg.textContent = 'All fields are required';
        return;
    }
    
    if (passwordInput.value !== confirmPasswordInput.value) {
        if (errorMsg) errorMsg.textContent = 'Passwords do not match';
        return;
    }
    
    // Show loading state
    const submitBtn = document.querySelector('#register-form button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creating account...';
    }
    
    try {
        // Send register request
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: usernameInput.value,
                email: emailInput.value,
                password: passwordInput.value,
                first_name: document.getElementById('first-name')?.value || '',
                last_name: document.getElementById('last-name')?.value || ''
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Registration failed');
        }
        
        // Store auth token and user data
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('user_data', JSON.stringify(data.user));
        
        // Redirect to dashboard
        window.location.href = '/dashboard.html';
        
    } catch (error) {
        if (errorMsg) errorMsg.textContent = error.message;
        console.error('Registration error:', error);
    } finally {
        // Reset button state
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Create Account';
        }
    }
}

// Handle logout
function handleLogout() {
    // Clear auth data
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    
    // Redirect to login page
    window.location.href = '/login.html';
}

// Get authenticated headers for API requests
function getAuthHeaders() {
    const token = localStorage.getItem('auth_token');
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
}