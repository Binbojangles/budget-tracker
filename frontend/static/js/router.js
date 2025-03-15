// router.js - Client-side routing for Budget Tracker

document.addEventListener('DOMContentLoaded', () => {
    // Route configuration
    const routes = {
        '/': () => loadTemplate('home'),
        '/login': () => loadTemplate('login'),
        '/register': () => loadTemplate('register'),
        '/dashboard': () => {
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
        const contentContainer = document.getElementById('content');
        
        try {
            // Dynamically load the appropriate template and script
            const templateResponse = await fetch(`/static/templates/${templateName}.html`);
            const templateHTML = await templateResponse.text();
            
            // Clear previous content and insert new template
            contentContainer.innerHTML = templateHTML;

            // Dynamically load corresponding script if it exists
            try {
                const scriptResponse = await fetch(`/static/js/${templateName}.js`);
                if (scriptResponse.ok) {
                    const scriptElement = document.createElement('script');
                    scriptElement.src = `/static/js/${templateName}.js`;
                    document.body.appendChild(scriptElement);
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
        // Update browser history
        history.pushState(null, '', path);
        
        // Invoke the corresponding route handler
        const route = routes[path];
        if (route) {
            route();
        } else {
            // Default to home or 404
            routes['/']();
        }
    }

    // Handle link clicks
    document.addEventListener('click', (e) => {
        const target = e.target.closest('a');
        if (target && target.getAttribute('href').startsWith('/')) {
            e.preventDefault();
            navigate(target.getAttribute('href'));
        }
    });

    // Handle browser back/forward
    window.addEventListener('popstate', () => {
        const path = window.location.pathname;
        const route = routes[path];
        if (route) {
            route();
        } else {
            routes['/']();
        }
    });

    // Initial route load
    const initialPath = window.location.pathname;
    if (routes[initialPath]) {
        routes[initialPath]();
    } else {
        routes['/']();
    }
});