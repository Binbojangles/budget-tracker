// Theme handling for Budget Tracker

// This file is now just for initializing the theme at startup.
// The toggle is handled directly in the HTML with onclick attributes.

// Apply theme to charts when needed
function applyChartTheme(theme) {
    if (typeof Chart !== 'undefined') {
        try {
            const textColor = theme === 'dark' ? '#e0e0e0' : '#666';
            const gridColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
            
            // Update global Chart.js defaults if available
            if (Chart.defaults) {
                Chart.defaults.color = textColor;
                
                if (Chart.defaults.scale && Chart.defaults.scale.grid) {
                    Chart.defaults.scale.grid.color = gridColor;
                }
            }
            
            // Update existing chart instances
            if (Chart.instances && Array.isArray(Chart.instances)) {
                Chart.instances.forEach(chart => {
                    if (!chart || !chart.options) return;
                    
                    try {
                        // Update the chart with new theme colors
                        if (typeof chart.update === 'function') {
                            chart.update();
                        }
                    } catch (e) {
                        // Continue even if one chart fails
                        console.warn('Error updating chart:', e);
                    }
                });
            }
        } catch (e) {
            console.warn('Error applying chart theme:', e);
        }
    }
}

// Function to set the initial theme based on user preference
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const themeToggleIcon = document.querySelector('#theme-toggle i');
    
    // Check if there's a saved theme preference
    if (savedTheme === 'dark' || (!savedTheme && prefersDarkScheme)) {
        document.body.classList.add('dark-mode');
        if (themeToggleIcon) {
            themeToggleIcon.className = 'fas fa-sun';
        }
        try {
            applyChartTheme('dark');
        } catch (e) {
            console.warn('Error applying initial chart theme:', e);
        }
    } else {
        document.body.classList.remove('dark-mode');
        if (themeToggleIcon) {
            themeToggleIcon.className = 'fas fa-moon';
        }
        try {
            applyChartTheme('light');
        } catch (e) {
            console.warn('Error applying initial chart theme:', e);
        }
    }
}

// Manually initialize the toggle button when the page loads
function initToggleButton() {
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        // Remove any existing listeners to prevent duplicates
        themeToggle.removeEventListener('click', toggleTheme);
        
        // Add click event listener
        themeToggle.addEventListener('click', toggleTheme);
        console.log('Theme toggle button initialized');
    } else {
        console.warn('Theme toggle button not found in DOM');
        
        // Try again after a short delay in case DOM is still loading
        setTimeout(() => {
            const retryToggle = document.getElementById('theme-toggle');
            if (retryToggle) {
                retryToggle.addEventListener('click', toggleTheme);
                console.log('Theme toggle button initialized after retry');
            }
        }, 500);
    }
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing theme system');
    
    // Initialize theme
    initTheme();
    
    // Initialize toggle button
    initToggleButton();
    
    // Listen for system theme changes
    try {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        
        // Use the appropriate event listener method
        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener('change', handleSystemThemeChange);
        } else if (mediaQuery.addListener) {
            // Fallback for older browsers
            mediaQuery.addListener(handleSystemThemeChange);
        }
    } catch (e) {
        console.warn('Error setting up media query listener:', e);
    }
});

// Handle system theme changes
function handleSystemThemeChange(e) {
    // Only apply if no user preference has been set
    if (!localStorage.getItem('theme')) {
        if (e.matches) {
            document.body.classList.add('dark-mode');
            const icon = document.querySelector('#theme-toggle i');
            if (icon) {
                icon.className = 'fas fa-sun';
            }
            try {
                applyChartTheme('dark');
            } catch (err) {
                console.warn('Error applying system theme change:', err);
            }
        } else {
            document.body.classList.remove('dark-mode');
            const icon = document.querySelector('#theme-toggle i');
            if (icon) {
                icon.className = 'fas fa-moon';
            }
            try {
                applyChartTheme('light');
            } catch (err) {
                console.warn('Error applying system theme change:', err);
            }
        }
    }
}

// Backup initialization in case DOMContentLoaded already fired
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(initToggleButton, 1);
} 