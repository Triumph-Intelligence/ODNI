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

            // ⭐ CRITICAL: Initialize services first!
            console.log('🔧 Initializing services...');
            await this.initServices();

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

    // ⭐ NEW: Initialize all services
    async initServices() {
        try {
            // Initialize DataService (this loads all the data)
            if (window.DataService) {
                await DataService.init();
                console.log('✅ DataService initialized');
            } else {
                console.warn('⚠️ DataService not found');
            }

            // Initialize VisibilityService with default org
            if (window.VisibilityService && VisibilityService.init) {
                VisibilityService.init('Triumph Atlantic');
                console.log('✅ VisibilityService initialized');
            }

        } catch (error) {
            console.error('❌ Error initializing services:', error);
            throw error;
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
        
        // Triumph Atlantic
        if (email.includes('triumphatlantic') || email.includes('triumphatl')) {
            return 'Triumph Atlantic';
        }
        // Guercio Energy Group
        else if (email.includes('guercio')) {
            return 'Guercio Energy Group';
        }
        // Myers Industrial Services
        else if (email.includes('myers')) {
            return 'Myers Industrial Services';
        }
        // KMP
        else if (email.includes('kmp')) {
            return 'KMP';
        }
        // Stable Works
        else if (email.includes('stable')) {
            return 'Stable Works';
        }
        // Red Door
        else if (email.includes('reddoor')) {
            return 'Red Door';
        }
        // Fritz Staffing
        else if (email.includes('fritz')) {
            return 'Fritz Staffing';
        }
        // Byers
        else if (email.includes('byers')) {
            return 'Byers';
        }
        
        // Default to Triumph Atlantic for unknown emails
        console.warn('Unknown email domain, defaulting to Triumph Atlantic');
        return 'Triumph Atlantic';
    },

    // Initialize UI components
    initUI() {
        console.log('🎨 Initializing UI...');
        
        // Update page title with company name
        this.updatePageTitle();
        
        // Show company name in header
        this.updateHeaderCompanyName();
        
        // Set organization in header
        const orgSelect = document.getElementById('org-select');
        if (orgSelect && this.state.currentOrg) {
            orgSelect.value = this.state.currentOrg;
        }

        // Show/hide org switcher based on access level
        this.updateOrgSwitcherVisibility();

        // Set user email in header (if user menu exists)
        const userEmail = document.getElementById('user-email');
        if (userEmail && this.state.currentUser) {
            userEmail.textContent = this.state.currentUser.email;
        }

        // Show access level badge
        this.updateAccessBadge(this.state.currentOrg);

        // Apply organization theme
        this.applyOrgTheme(this.state.currentOrg);
    },

    // Update page title with company name
    updatePageTitle() {
        document.title = `Triumph Intelligence - ${this.state.currentOrg}`;
    },

    // Update company name in header
    updateHeaderCompanyName() {
        const headerCompanyName = document.getElementById('header-company-name');
        if (headerCompanyName) {
            headerCompanyName.textContent = `- ${this.state.currentOrg}`;
        }
    },

    // Show/hide org switcher based on access level
    updateOrgSwitcherVisibility() {
        const orgSwitcher = document.querySelector('.org-switcher');
        if (!orgSwitcher) return;

        // Only show org switcher for Triumph Atlantic users
        if (this.state.currentOrg === 'Triumph Atlantic') {
            orgSwitcher.style.display = 'flex';
        } else {
            orgSwitcher.style.display = 'none';
        }
    },

    // Update access level badge
    updateAccessBadge(org) {
        const badge = document.getElementById('access-badge');
        if (!badge) return;

        if (org === 'Triumph Atlantic') {
            badge.className = 'badge badge-success';
            badge.innerHTML = '✓ Full Access';
            badge.style.display = 'inline-flex';
        } else {
            badge.className = 'badge badge-warning';
            badge.innerHTML = '⊗ Siloed Access';
            badge.style.display = 'inline-flex';
        }
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
        // Check if component class exists
        const componentClassName = this.capitalize(pageName) + 'Component';
        const ComponentClass = window[componentClassName];
        
        if (ComponentClass && ComponentClass.init) {
            console.log(`🎯 Initializing ${componentClassName}...`);
            await ComponentClass.init();
        } else {
            console.log(`⚠️ No component found for ${pageName}`);
        }
    },

    // Get filtered data based on current organization
    getFilteredData() {
        const org = this.state.currentOrg;
        
        // Get data from DataService cache
        const companies = DataService.cache.companies || [];
        const locations = DataService.cache.locations || [];
        const contacts = DataService.cache.contacts || [];
        const gifts = DataService.cache.gifts || [];
        const referrals = DataService.cache.referrals || [];
        const opportunities = DataService.cache.opportunities || [];
        const projects = DataService.cache.projects || [];
        const changeLog = DataService.cache.changeLog || [];

        // If Triumph Atlantic, return all data
        if (org === 'Triumph Atlantic') {
            return {
                companies,
                locations,
                contacts,
                gifts,
                referrals,
                opportunities,
                projects,
                changeLog
            };
        }

        // Filter data based on visibility service
        return {
            companies: companies.filter(c => 
                VisibilityService.isCompanyVisible(c, org)
            ),
            locations: locations.filter(l => {
                const company = companies.find(c => c.normalized === l.company);
                return company && VisibilityService.isCompanyVisible(company, org);
            }),
            contacts: contacts.filter(c => {
                const company = companies.find(co => co.normalized === c.company);
                return company && VisibilityService.isCompanyVisible(company, org);
            }),
            gifts: gifts.filter(g => {
                const contact = contacts.find(c => c.email === g.contact_email);
                if (!contact) return false;
                const company = companies.find(co => co.normalized === contact.company);
                return company && VisibilityService.isCompanyVisible(company, org);
            }),
            referrals: referrals.filter(r => {
                const contact = contacts.find(c => c.email === r.referrer_email);
                if (!contact) return false;
                const company = companies.find(co => co.normalized === contact.company);
                return company && VisibilityService.isCompanyVisible(company, org);
            }),
            opportunities: opportunities.filter(o => {
                const company = companies.find(c => c.name === o.company);
                return company && VisibilityService.isCompanyVisible(company, org);
            }),
            projects: projects.filter(p => {
                const company = companies.find(c => c.name === p.company);
                return company && VisibilityService.isCompanyVisible(company, org);
            }),
            changeLog: org === 'Triumph Atlantic' ? changeLog : 
                       changeLog.filter(log => log.org === org)
        };
    },

    // Switch organization
    switchOrganization(org) {
        // Only allow Triumph Atlantic to switch organizations
        const userOrg = this.state.currentOrg;
        const isTriumphUser = userOrg === 'Triumph Atlantic';
        
        if (!isTriumphUser) {
            console.warn('⚠️ Siloed users cannot switch organizations');
            this.showToast('You do not have permission to switch organizations', 'error');
            return;
        }

        console.log(`🔄 Switching to organization: ${org}`);
        
        // Update visibility service
        if (window.VisibilityService) {
            VisibilityService.setCurrentOrg(org);
        }
        
        this.state.currentOrg = org;
        
        // Update page title
        this.updatePageTitle();
        
        // Update header company name
        this.updateHeaderCompanyName();
        
        // Update access badge
        this.updateAccessBadge(org);
        
        // Apply org theme
        this.applyOrgTheme(org);
        
        // Refresh current page
        this.refreshCurrentPage();
        
        const accessType = org === 'Triumph Atlantic' ? 'Full Access' : 'Siloed Access';
        this.showToast(`Switched to ${org} (${accessType})`, 'success');
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
