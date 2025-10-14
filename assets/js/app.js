/**
 * CRM Portal - Main Application
 * Initializes the app, manages routing, state, and component loading
 */

const App = {
    // Application state
    state: {
        currentUser: null,
        currentOrg: null,
        currentPage: 'dashboard',
        theme: 'light',
        isLoading: false,
        sidebarCollapsed: false,
        components: {},
        data: {
            companies: [],
            locations: [],
            contacts: [],
            gifts: [],
            referrals: [],
            opportunities: [],
            projects: [],
            changeLog: []
        }
    },

    // Initialize the application
    async init() {
        console.log('🚀 Initializing CRM Portal...');
        
        try {
            // Show loading state
            this.showLoading();

            // Initialize theme from localStorage
            this.initTheme();

            // Initialize Firebase Auth
            await AuthService.init();

            // Check for authenticated user
            const user = await AuthService.getCurrentUser();
            
            if (user) {
                console.log('✅ User authenticated:', user.email);
                this.state.currentUser = user;
                
                // Get user's organization
                const userOrg = await this.getUserOrganization(user);
                this.state.currentOrg = userOrg;
                
                // Load initial data
                await this.loadData();
                
                // Initialize UI
                this.initUI();
                
                // Load components
                await this.loadComponents();
                
                // Setup event listeners
                this.setupEventListeners();
                
                // Show initial page
                this.showPage('dashboard');
                
                console.log('✅ Application initialized successfully');
            } else {
                console.log('❌ No authenticated user, redirecting to login');
                this.showLogin();
            }
            
        } catch (error) {
            console.error('❌ Error initializing application:', error);
            this.showError('Failed to initialize application. Please refresh the page.');
        } finally {
            this.hideLoading();
        }
    },

    // Get user's organization from their email or profile
    async getUserOrganization(user) {
        try {
            // Try to get from Xano user profile first
            const profile = await ApiService.get('/user/profile');
            if (profile && profile.organization) {
                return profile.organization;
            }
        } catch (error) {
            console.log('Could not fetch user profile from Xano, using email domain');
        }

        // Fallback: determine org from email domain
        const email = user.email.toLowerCase();
        
        if (email.includes('triumph') || email.includes('triumphatl')) {
            return 'Triumph Atlantic';
        } else if (email.includes('guercio')) {
            return 'Guercio Energy Group';
        } else if (email.includes('myers')) {
            return 'Myers Industrial Services';
        } else if (email.includes('kmp')) {
            return 'KMP';
        } else if (email.includes('stable')) {
            return 'Stable Works';
        } else if (email.includes('reddoor')) {
            return 'Red Door';
        } else if (email.includes('fritz')) {
            return 'Fritz Staffing';
        } else if (email.includes('byers')) {
            return 'Byers';
        }
        
        // Default to Triumph Atlantic for admin/oversight
        return 'Triumph Atlantic';
    },

    // Load data from API or mock data
    async loadData() {
        console.log('📊 Loading data...');
        
        try {
            // Try to load from Xano API first
            const [companies, locations, contacts, gifts, referrals, opportunities, projects, changeLog] = await Promise.all([
                DataService.getCompanies().catch(() => []),
                DataService.getLocations().catch(() => []),
                DataService.getContacts().catch(() => []),
                DataService.getGifts().catch(() => []),
                DataService.getReferrals().catch(() => []),
                DataService.getOpportunities().catch(() => []),
                DataService.getProjects().catch(() => []),
                DataService.getChangeLog().catch(() => [])
            ]);

            // If we got real data from API, use it
            if (companies.length > 0) {
                console.log('✅ Loaded data from API');
                this.state.data = {
                    companies,
                    locations,
                    contacts,
                    gifts,
                    referrals,
                    opportunities,
                    projects,
                    changeLog
                };
            } else {
                // Fall back to mock data for demo
                console.log('⚠️ Using mock data for demo');
                this.state.data = {
                    companies: MockData.companies,
                    locations: MockData.locations,
                    contacts: MockData.contacts,
                    gifts: MockData.gifts,
                    referrals: MockData.referrals,
                    opportunities: MockData.opportunities,
                    projects: MockData.projects,
                    changeLog: MockData.changeLog
                };
            }

            console.log('✅ Data loaded successfully');
        } catch (error) {
            console.error('❌ Error loading data:', error);
            // Use mock data as fallback
            this.state.data = {
                companies: MockData.companies || [],
                locations: MockData.locations || [],
                contacts: MockData.contacts || [],
                gifts: MockData.gifts || [],
                referrals: MockData.referrals || [],
                opportunities: MockData.opportunities || [],
                projects: MockData.projects || [],
                changeLog: MockData.changeLog || []
            };
        }
    },

    // Initialize UI components
    initUI() {
        console.log('🎨 Initializing UI...');
        
        // Set organization in header
        const orgSelect = document.getElementById('org-select');
        if (orgSelect && this.state.currentOrg) {
            orgSelect.value = this.state.currentOrg;
        }

        // Set user email in header (if user menu exists)
        const userEmail = document.getElementById('user-email');
        if (userEmail && this.state.currentUser) {
            userEmail.textContent = this.state.currentUser.email;
        }

        // Apply organization theme
        this.applyOrgTheme(this.state.currentOrg);
    },

    // Load all components dynamically
    async loadComponents() {
        console.log('📦 Loading components...');
        
        const componentNames = [
            'dashboard',
            'intelligence',
            'companies',
            'contacts',
            'referrals',
            'opportunities',
            'projects'
        ];

        for (const name of componentNames) {
            try {
                // Components will be loaded on-demand when pages are shown
                this.state.components[name] = {
                    loaded: false,
                    instance: null
                };
            } catch (error) {
                console.error(`Failed to register component: ${name}`, error);
            }
        }
    },

    // Setup event listeners
    setupEventListeners() {
        console.log('🎧 Setting up event listeners...');

        // Navigation items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const page = item.dataset.page;
                if (page) {
                    this.showPage(page);
                }
            });
        });

        // Organization switcher
        const orgSelect = document.getElementById('org-select');
        if (orgSelect) {
            orgSelect.addEventListener('change', (e) => {
                this.switchOrganization(e.target.value);
            });
        }

        // Theme toggle
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }

        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.logout();
            });
        }

        // Sidebar toggle (mobile)
        const sidebarToggle = document.getElementById('sidebar-toggle');
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => {
                this.toggleSidebar();
            });
        }

        // Handle browser back/forward
        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.page) {
                this.showPage(e.state.page, false);
            }
        });

        // Listen for data changes
        window.addEventListener('dataUpdated', () => {
            this.refreshCurrentPage();
        });
    },

    // Show a specific page
    showPage(pageName, updateHistory = true) {
        console.log(`📄 Showing page: ${pageName}`);

        // Hide all pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });

        // Show the requested page
        const pageElement = document.getElementById(pageName);
        if (pageElement) {
            pageElement.classList.add('active');
            this.state.currentPage = pageName;

            // Update navigation active state
            document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.remove('active');
                if (item.dataset.page === pageName) {
                    item.classList.add('active');
                }
            });

            // Update browser history
            if (updateHistory) {
                history.pushState({ page: pageName }, '', `#${pageName}`);
            }

            // Load component data if needed
            this.loadPageComponent(pageName);

            // Scroll to top
            const mainContent = document.querySelector('.main-content');
            if (mainContent) {
                mainContent.scrollTop = 0;
            }
        } else {
            console.error(`Page not found: ${pageName}`);
        }
    },

    // Load component for specific page
    async loadPageComponent(pageName) {
        const component = this.state.components[pageName];
        
        if (!component) {
            console.warn(`No component registered for page: ${pageName}`);
            return;
        }

        // If component is already loaded, just refresh it
        if (component.loaded && component.instance && component.instance.render) {
            component.instance.render(this.getFilteredData());
            return;
        }

        // Load component dynamically
        try {
            // Check if component exists in window object
            const ComponentClass = window[this.capitalize(pageName) + 'Component'];
            
            if (ComponentClass) {
                component.instance = new ComponentClass();
                component.loaded = true;
                component.instance.render(this.getFilteredData());
            } else {
                // Render using built-in methods
                this.renderPage(pageName);
            }
        } catch (error) {
            console.error(`Error loading component for ${pageName}:`, error);
            this.renderPage(pageName);
        }
    },

    // Get filtered data based on current organization
    getFilteredData() {
        const org = this.state.currentOrg;
        const data = this.state.data;

        // If Triumph Atlantic, return all data
        if (org === 'Triumph Atlantic') {
            return data;
        }

        // Filter data based on visibility service
        return {
            companies: data.companies.filter(c => 
                VisibilityService.isCompanyVisible(c, org)
            ),
            locations: data.locations.filter(l => {
                const company = data.companies.find(c => c.normalized === l.company);
                return company && VisibilityService.isCompanyVisible(company, org);
            }),
            contacts: data.contacts.filter(c => {
                const company = data.companies.find(co => co.normalized === c.company);
                return company && VisibilityService.isCompanyVisible(company, org);
            }),
            gifts: data.gifts.filter(g => {
                const contact = data.contacts.find(c => c.email === g.contact_email);
                if (!contact) return false;
                const company = data.companies.find(co => co.normalized === contact.company);
                return company && VisibilityService.isCompanyVisible(company, org);
            }),
            referrals: data.referrals.filter(r => {
                const contact = data.contacts.find(c => c.email === r.referrer_email);
                if (!contact) return false;
                const company = data.companies.find(co => co.normalized === contact.company);
                return company && VisibilityService.isCompanyVisible(company, org);
            }),
            opportunities: data.opportunities.filter(o => {
                const company = data.companies.find(c => c.name === o.company);
                return company && VisibilityService.isCompanyVisible(company, org);
            }),
            projects: data.projects.filter(p => {
                const company = data.companies.find(c => c.name === p.company);
                return company && VisibilityService.isCompanyVisible(company, org);
            }),
            changeLog: org === 'Triumph Atlantic' ? data.changeLog : 
                       data.changeLog.filter(log => log.org === org)
        };
    },

    // Render page content
    renderPage(pageName) {
        const data = this.getFilteredData();
        
        switch(pageName) {
            case 'dashboard':
                this.renderDashboard(data);
                break;
            case 'intelligence':
                this.renderIntelligence(data);
                break;
            case 'companies':
                this.renderCompanies(data);
                break;
            case 'contacts':
                this.renderContacts(data);
                break;
            case 'referrals':
                this.renderReferrals(data);
                break;
            case 'opportunities':
                this.renderOpportunities(data);
                break;
            case 'projects':
                this.renderProjects(data);
                break;
            default:
                console.warn(`No render method for page: ${pageName}`);
        }
    },

    // Render methods (to be implemented in separate component files)
    renderDashboard(data) {
        console.log('Rendering dashboard...', data);
        // This will be handled by DashboardComponent when we create it
    },

    renderIntelligence(data) {
        console.log('Rendering intelligence...', data);
        // This will be handled by IntelligenceComponent
    },

    renderCompanies(data) {
        console.log('Rendering companies...', data);
        // This will be handled by CompaniesComponent
    },

    renderContacts(data) {
        console.log('Rendering contacts...', data);
        // This will be handled by ContactsComponent
    },

    renderReferrals(data) {
        console.log('Rendering referrals...', data);
        // This will be handled by ReferralsComponent
    },

    renderOpportunities(data) {
        console.log('Rendering opportunities...', data);
        // This will be handled by OpportunitiesComponent
    },

    renderProjects(data) {
        console.log('Rendering projects...', data);
        // This will be handled by ProjectsComponent
    },

    // Switch organization
    switchOrganization(org) {
        console.log(`🔄 Switching to organization: ${org}`);
        this.state.currentOrg = org;
        this.applyOrgTheme(org);
        this.refreshCurrentPage();
        this.showToast(`Switched to ${org}`, 'success');
    },

    // Apply organization-specific theme
    applyOrgTheme(org) {
        const orgSlug = org.toLowerCase().replace(/\s+/g, '-');
        document.documentElement.setAttribute('data-org', orgSlug);
    },

    // Refresh current page
    refreshCurrentPage() {
        this.loadPageComponent(this.state.currentPage);
    },

    // Theme management
    initTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        this.state.theme = savedTheme;
        document.documentElement.setAttribute('data-theme', savedTheme);
    },

    toggleTheme() {
        const newTheme = this.state.theme === 'light' ? 'dark' : 'light';
        this.state.theme = newTheme;
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        // Add transition class
        document.body.classList.add('theme-transition');
        setTimeout(() => {
            document.body.classList.remove('theme-transition');
        }, 500);
    },

    // Sidebar management
    toggleSidebar() {
        this.state.sidebarCollapsed = !this.state.sidebarCollapsed;
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
            sidebar.classList.toggle('collapsed', this.state.sidebarCollapsed);
        }
    },

    // Show loading overlay
    showLoading() {
        this.state.isLoading = true;
        let overlay = document.getElementById('loading-overlay');
        
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'loading-overlay';
            overlay.className = 'loading-overlay';
            overlay.innerHTML = '<div class="spinner spinner-lg"></div>';
            document.body.appendChild(overlay);
        }
        
        overlay.style.display = 'flex';
    },

    hideLoading() {
        this.state.isLoading = false;
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    },

    // Show login page
    showLogin() {
        window.location.href = '/login.html';
    },

    // Logout
    async logout() {
        try {
            await AuthService.logout();
            this.showToast('Logged out successfully', 'success');
            this.showLogin();
        } catch (error) {
            console.error('Error logging out:', error);
            this.showToast('Error logging out', 'error');
        }
    },

    // Toast notifications
    showToast(message, type = 'success', duration = 3000) {
        const container = document.getElementById('toast-container') || this.createToastContainer();
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const icon = this.getToastIcon(type);
        
        toast.innerHTML = `
            <div class="toast-icon">${icon}</div>
            <div class="toast-content">
                <div class="toast-message">${message}</div>
            </div>
        `;
        
        container.appendChild(toast);
        
        // Show toast
        setTimeout(() => toast.classList.add('show'), 100);
        
        // Hide and remove toast
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },

    createToastContainer() {
        const container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
        return container;
    },

    getToastIcon(type) {
        const icons = {
            success: '✓',
            error: '✗',
            warning: '⚠',
            info: 'ℹ'
        };
        return icons[type] || icons.info;
    },

    // Error handling
    showError(message) {
        this.showToast(message, 'error', 5000);
    },

    // Utility functions
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    },

    formatDate(dateStr) {
        if (!dateStr) return '—';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        });
    },

    formatCurrency(amount) {
        if (typeof amount === 'string') {
            // If already formatted (e.g., "$125K"), return as is
            if (amount.includes('$')) return amount;
            // Try to parse
            amount = parseFloat(amount.replace(/[^0-9.-]/g, ''));
        }
        
        if (isNaN(amount)) return '$0';
        
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }
};

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init());
} else {
    App.init();
}

// Export for use in other modules
window.App = App;
