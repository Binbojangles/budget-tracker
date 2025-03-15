// router.js - Client-side routing for Budget Tracker

document.addEventListener('DOMContentLoaded', () => {
    console.log('Router initialized');
    
    // Route configuration
    const routes = {
        '/': () => loadTemplate('home'),
        '/login': () => loadTemplate('login'),
        '/login.html': () => loadTemplate('login'),
        '/register': () => loadTemplate('register'),
        '/register.html': () => loadTemplate('register'),
        '/dashboard': () => {
            // Ensure user is authenticated before loading dashboard
            if (localStorage.getItem('auth_token')) {
                loadTemplate('dashboard');
            } else {
                window.location.href = '/login';
            }
        },
        '/dashboard.html': () => {
            // Ensure user is authenticated before loading dashboard
            if (localStorage.getItem('auth_token')) {
                loadTemplate('dashboard');
            } else {
                window.location.href = '/login';
            }
        },
        '/transactions': () => {
            if (localStorage.getItem('auth_token')) {
                loadTemplate('transactions');
            } else {
                window.location.href = '/login';
            }
        },
        '/accounts': () => {
            if (localStorage.getItem('auth_token')) {
                loadTemplate('accounts');
            } else {
                window.location.href = '/login';
            }
        },
        '/budgets': () => {
            if (localStorage.getItem('auth_token')) {
                loadTemplate('budgets');
            } else {
                window.location.href = '/login';
            }
        },
        '/reports': () => {
            if (localStorage.getItem('auth_token')) {
                loadTemplate('reports');
            } else {
                window.location.href = '/login';
            }
        },
        '/settings': () => {
            if (localStorage.getItem('auth_token')) {
                loadTemplate('settings');
            } else {
                window.location.href = '/login';
            }
        }
    };

    // Load templates dynamically
    async function loadTemplate(templateName) {
        console.log(`Loading template: ${templateName}`);
        const contentContainer = document.getElementById('content');
        
        try {
            // Dynamically load the appropriate template and script
            const templateResponse = await fetch(`/static/templates/${templateName}.html`);
            const templateHTML = await templateResponse.text();
            
            // Clear previous content and insert new template
            contentContainer.innerHTML = templateHTML;
            
            console.log(`Template ${templateName} loaded successfully`);

            // Dynamically load corresponding script if it exists
            try {
                const scriptResponse = await fetch(`/static/js/${templateName}.js`);
                if (scriptResponse.ok) {
                    const scriptElement = document.createElement('script');
                    scriptElement.src = `/static/js/${templateName}.js`;
                    document.body.appendChild(scriptElement);
                    console.log(`Loaded script for ${templateName}`);
                }
            } catch (scriptError) {
                console.log(`No specific script found for ${templateName}`);
            }

            // If it's a protected route, ensure authentication
            if (localStorage.getItem('auth_token')) {
                updateAuthUI(true, 
                    JSON.parse(localStorage.getItem('user_data') || '{}')
                );
            }
        } catch (error) {
            console.error('Template loading error:', error);
            contentContainer.innerHTML = '<p>Page not found</p>';
        }
    }

    // Handle navigation
    function navigate(path) {
        console.log(`Navigating to: ${path}`);
        // Update browser history
        history.pushState(null, '', path);
        
        // Invoke the corresponding route handler
        const route = routes[path];
        if (route) {
            route();
        } else {
            // Default to home or 404
            console.log(`No route found for ${path}, defaulting to home`);
            routes['/']();
        }
    }

    // Handle link clicks
    document.addEventListener('click', (e) => {
        const target = e.target.closest('a');
        if (target && target.getAttribute('href') && target.getAttribute('href').startsWith('/')) {
            e.preventDefault();
            navigate(target.getAttribute('href'));
        }
    });

    // Handle browser back/forward
    window.addEventListener('popstate', () => {
        const path = window.location.pathname;
        console.log(`Popstate detected, path: ${path}`);
        const route = routes[path];
        if (route) {
            route();
        } else {
            routes['/']();
        }
    });

    // Initial route load
    const initialPath = window.location.pathname;
    console.log(`Initial path: ${initialPath}`);
    if (routes[initialPath]) {
        routes[initialPath]();
    } else {
        console.log(`No route found for initial path ${initialPath}, defaulting to home`);
        routes['/']();
    }
});