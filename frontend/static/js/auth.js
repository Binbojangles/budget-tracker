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
    
    // Validate token if exists
    if (token) {
        validateAuthToken(token)
            .then(isValid => {
                updateAuthUI(isValid, userData);
                if (!isValid) {
                    handleLogout();
                }
            })
            .catch(() => handleLogout());
    } else {
        updateAuthUI(false, {});
    }
    
    // Redirect management
    if (!token && isProtectedPage()) {
        window.location.href = '/login.html';
    }
    
    if (token && isAuthPage()) {
        window.location.href = '/dashboard.html';
    }
}

// Update UI based on authentication state
function updateAuthUI(isAuthenticated, userData) {
    // Update user profile info if authenticated
    if (isAuthenticated && userData) {
        const userDisplayElements = document.querySelectorAll('.user-display-name');
        userDisplayElements.forEach(el => {
            el.textContent = userData.first_name ? `${userData.first_name} ${userData.last_name || ''}` : userData.username;
        });
    }
    
    // Show/hide auth-dependent elements
    document.querySelectorAll('.auth-required').forEach(el => {
        el.style.display = isAuthenticated ? 'block' : 'none';
    });
    
    document.querySelectorAll('.non-auth-required').forEach(el => {
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
    
    console.log('Login form submitted - preventDefault called');
    
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const errorMsg = document.getElementById('login-error');
    
    console.log('Form elements:', {
        usernameInput: usernameInput ? 'Found' : 'Not Found',
        passwordInput: passwordInput ? 'Found' : 'Not Found',
        errorMsg: errorMsg ? 'Found' : 'Not Found'
    });
    
    // Clear previous error
    if (errorMsg) errorMsg.textContent = '';
    
    // Validate input
    if (!usernameInput || !passwordInput) {
        console.error('Form inputs not found');
        if (errorMsg) errorMsg.textContent = 'Form error: Inputs not found';
        return;
    }
    
    if (!usernameInput.value || !passwordInput.value) {
        console.log('Missing username or password');
        if (errorMsg) errorMsg.textContent = 'Username and password are required';
        return;
    }
    
    // Show loading state
    const submitBtn = document.querySelector('#login-form button[type="submit"]');
    console.log('Submit button:', submitBtn ? 'Found' : 'Not Found');
    
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Logging in...';
    }
    
    try {
        // Send login request
        console.log('Sending login request to /api/auth/login');
        console.log('Request payload:', {
            username: usernameInput.value,
            password: '********' // Don't log actual password
        });
        
        // Debug the fetch call
        const url = '/api/auth/login';
        console.log('Request URL:', url);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                username: usernameInput.value,
                password: passwordInput.value
            })
        });
        
        console.log('Login response status:', response.status);
        console.log('Login response headers:', {
            'content-type': response.headers.get('content-type')
        });
        
        // Try to parse response
        let data;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
            console.log('Login response data:', data);
        } else {
            const text = await response.text();
            console.warn('Non-JSON response:', text);
            data = { error: 'Unexpected response format from server' };
        }
        
        if (!response.ok) {
            throw new Error(data.error || `Login failed with status ${response.status}`);
        }
        
        // Store auth token and user data
        console.log('Storing auth token and user data');
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('user_data', JSON.stringify(data.user));
        
        // Update auth UI
        console.log('Updating UI');
        updateAuthUI(true, data.user);
        
        // Redirect to dashboard
        console.log('Redirecting to dashboard');
        window.location.href = '/dashboard';
        
    } catch (error) {
        console.error('Complete login error details:', error);
        if (errorMsg) {
            errorMsg.textContent = error.message || 'Login failed. Please try again.';
            errorMsg.style.display = 'block';
        }
    } finally {
        // Reset button state
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Login';
        }
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

// Handle register form submission
async function handleRegister(event) {
    event.preventDefault();
    
    const usernameInput = document.getElementById('username');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm-confirm-password');
    const firstNameInput = document.getElementById('first-name');
    const lastNameInput = document.getElementById('last-name');
    const termsCheckbox = document.getElementById('terms');
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
    
    if (!termsCheckbox.checked) {
        if (errorMsg) errorMsg.textContent = 'You must agree to the Terms of Service and Privacy Policy';
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
                first_name: firstNameInput?.value || '',
                last_name: lastNameInput?.value || ''
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Registration failed');
        }
        
        // Store auth token and user data
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('user_data', JSON.stringify(data.user));
        
        // Update auth UI
        updateAuthUI(true, data.user);
        
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
    
    // Update UI to logged out state
    updateAuthUI(false, {});
    
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

// Fetch user profile
async function fetchUserProfile() {
    try {
        const response = await fetch('/api/auth/profile', {
            method: 'GET',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch profile');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Profile fetch error:', error);
        handleLogout(); // Logout if profile fetch fails
        return null;
    }
}

// Update user profile
async function updateUserProfile(profileData) {
    try {
        const response = await fetch('/api/auth/profile', {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(profileData)
        });
        
        if (!response.ok) {
            throw new Error('Failed to update profile');
        }
        
        const updatedUser = await response.json();
        
        // Update local storage
        const currentUserData = JSON.parse(localStorage.getItem('user_data') || '{}');
        localStorage.setItem('user_data', JSON.stringify({
            ...currentUserData,
            ...updatedUser
        }));
        
        return updatedUser;
    } catch (error) {
        console.error('Profile update error:', error);
        throw error;
    }
}

// Password change function
async function changePassword(currentPassword, newPassword, confirmNewPassword) {
    if (newPassword !== confirmNewPassword) {
        throw new Error('New passwords do not match');
    }
    
    try {
        const response = await fetch('/api/auth/change-password', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                current_password: currentPassword,
                new_password: newPassword
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to change password');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Password change error:', error);
        throw error;
    }
}

// Validate authentication token
async function validateAuthToken(token) {
    try {
        const response = await fetch('/api/auth/profile', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        return response.ok;
    } catch (error) {
        console.error('Token validation error:', error);
        return false;
    }
}