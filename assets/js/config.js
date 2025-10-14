/**
 * CRM Portal - Configuration
 * Central configuration for the entire application
 */

const CONFIG = {
  // Application metadata
  app: {
    name: 'CRM Portal',
    version: '1.0.0',
    description: 'Office of National Intelligence CRM System',
    environment: 'development' // 'development' | 'production'
  },

  // Firebase Configuration (Authentication)
  firebase: {
    apiKey: "YOUR_FIREBASE_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
  },

  // Xano Configuration (Backend/Database)
  xano: {
    baseUrl: "https://YOUR_WORKSPACE.xano.io/api:YOUR_API_GROUP",
    // API endpoints
    endpoints: {
      // Auth
      login: "/auth/login",
      signup: "/auth/signup",
      me: "/auth/me",
      
      // Companies
      companies: "/companies",
      companyById: "/companies/{id}",
      
      // Locations
      locations: "/locations",
      locationsByCompany: "/locations/company/{company_id}",
      
      // Contacts
      contacts: "/contacts",
      contactById: "/contacts/{id}",
      contactsByCompany: "/contacts/company/{company_id}",
      
      // Activities
      activities: "/activities",
      activitiesByContact: "/activities/contact/{contact_id}",
      
      // Gifts
      gifts: "/gifts",
      giftsByContact: "/gifts/contact/{contact_id}",
      
      // Referrals
      referrals: "/referrals",
      referralsByContact: "/referrals/contact/{contact_id}",
      
      // Opportunities
      opportunities: "/opportunities",
      opportunitiesByCompany: "/opportunities/company/{company_id}",
      
      // Projects
      projects: "/projects",
      projectsByCompany: "/projects/company/{company_id}",
      
      // Change Log
      changeLog: "/change_log",
      
      // Contractors (for assignments)
      contractors: "/contractors"
    }
  },

  // Organizations
  organizations: {
    // Oversight organization - sees everything
    oversight: 'Triumph Atlantic',
    
    // Contractor organizations - siloed views
    contractors: [
      {
        id: 'guercio',
        name: 'Guercio Energy Group',
        type: 'electrical',
        description: 'Electrical Contractor',
        color: '#f59e0b'
      },
      {
        id: 'myers',
        name: 'Myers Industrial Services',
        type: 'mechanical',
        description: 'Mechanical Contractor',
        color: '#3b82f6'
      },
      {
        id: 'kmp',
        name: 'KMP',
        type: 'mechanical',
        description: 'Mechanical Services',
        color: '#8b5cf6'
      },
      {
        id: 'stable-works',
        name: 'Stable Works',
        type: 'interior_gc',
        description: 'Commercial Office Fit-outs & Excavation',
        color: '#10b981'
      },
      {
        id: 'red-door',
        name: 'Red Door',
        type: 'marketing',
        description: 'Marketing Services',
        color: '#ef4444'
      },
      {
        id: 'fritz-staffing',
        name: 'Fritz Staffing',
        type: 'staffing',
        description: 'Staffing Services',
        color: '#06b6d4'
      },
      {
        id: 'byers',
        name: 'Byers',
        type: 'staffing',
        description: 'Staffing Services',
        color: '#ec4899'
      }
    ],
    
    // Get all organization names
    getAll() {
      return [
        this.oversight,
        ...this.contractors.map(c => c.name)
      ];
    },
    
    // Check if organization is oversight
    isOversight(orgName) {
      return orgName === this.oversight;
    },
    
    // Get organization by name
    getByName(name) {
      if (name === this.oversight) {
        return { id: 'triumph', name: this.oversight, type: 'oversight' };
      }
      return this.contractors.find(c => c.name === name);
    }
  },

  // Contractor service types
  contractorTypes: [
    { key: 'electrical', label: 'Electrical Contractor', icon: '⚡' },
    { key: 'mechanical', label: 'Mechanical Contractor', icon: '🔧' },
    { key: 'interior_gc', label: 'Interior General Contractor', icon: '🏗️' },
    { key: 'marketing', label: 'Marketing', icon: '📢' },
    { key: 'staffing', label: 'Staffing', icon: '👥' }
  ],

  // Company tiers
  companyTiers: [
    { key: 'enterprise', label: 'Enterprise', color: '#6366f1' },
    { key: 'large', label: 'Large', color: '#8b5cf6' },
    { key: 'mid', label: 'Mid', color: '#ec4899' },
    { key: 'small', label: 'Small', color: '#f59e0b' }
  ],

  // Company statuses
  companyStatuses: [
    { key: 'active', label: 'Active', color: '#10b981' },
    { key: 'prospect', label: 'Prospect', color: '#f59e0b' },
    { key: 'inactive', label: 'Inactive', color: '#6b7280' }
  ],

  // Contact settings
  contacts: {
    // Available contact channels
    channels: ['email', 'phone', 'linkedin', 'in-person'],
    
    // Standard cadence options (in days)
    cadenceOptions: [7, 14, 30, 45, 60, 90],
    
    // Default cadence for new contacts
    defaultCadence: 30,
    
    // Days to consider a location "unserved"
    unservedThreshold: 90
  },

  // Gift tracking settings
  gifts: {
    enabled: true,
    maxValue: 250, // Company policy limit
    taxReportingThreshold: 600, // Annual threshold for tax reporting
    categories: [
      'Gift Card',
      'Restaurant',
      'Coffee',
      'Lunch/Dinner',
      'Event Tickets',
      'Holiday Gift',
      'Thank You Gift',
      'Other'
    ]
  },

  // Referral settings
  referrals: {
    enabled: true,
    defaultFollowupDays: 7,
    statuses: [
      { key: 'pending', label: 'Pending', color: '#6b7280' },
      { key: 'contacted', label: 'Contacted', color: '#3b82f6' },
      { key: 'meeting-scheduled', label: 'Meeting Scheduled', color: '#f59e0b' },
      { key: 'closed-won', label: 'Closed-Won', color: '#10b981' },
      { key: 'closed-lost', label: 'Closed-Lost', color: '#ef4444' }
    ]
  },

  // Opportunity settings
  opportunities: {
    enabled: true,
    stages: [
      { key: 'lead', label: 'Lead', color: '#6b7280' },
      { key: 'qualified', label: 'Qualified', color: '#3b82f6' },
      { key: 'proposal', label: 'Proposal', color: '#8b5cf6' },
      { key: 'negotiation', label: 'Negotiation', color: '#f59e0b' },
      { key: 'closed-won', label: 'Closed-Won', color: '#10b981' },
      { key: 'closed-lost', label: 'Closed-Lost', color: '#ef4444' }
    ]
  },

  // Project settings
  projects: {
    enabled: true,
    statuses: [
      { key: 'planning', label: 'Planning', color: '#6b7280' },
      { key: 'in-progress', label: 'In Progress', color: '#3b82f6' },
      { key: 'on-hold', label: 'On Hold', color: '#f59e0b' },
      { key: 'completed', label: 'Completed', color: '#10b981' },
      { key: 'cancelled', label: 'Cancelled', color: '#ef4444' }
    ]
  },

  // Feature flags
  features: {
    // Core features
    dashboard: true,
    intelligence: true,
    companies: true,
    contacts: true,
    gifts: true,
    referrals: true,
    opportunities: true,
    projects: true,
    
    // Advanced features
    csvImport: true,
    csvExport: true,
    bulkOperations: true,
    advancedFilters: true,
    
    // Future integrations
    emailIntegration: false,
    calendarIntegration: false,
    aiRecommendations: false,
    estimatingSoftware: false,
    projectTracking: false
  },

  // UI settings
  ui: {
    // Default items per page for tables
    defaultPageSize: 25,
    pageSizeOptions: [10, 25, 50, 100],
    
    // Animation timing
    toastDuration: 3000, // milliseconds
    transitionDuration: 300, // milliseconds
    
    // Date formats
    dateFormat: 'en-US',
    dateStyle: { month: 'short', day: 'numeric', year: 'numeric' },
    dateTimeStyle: { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    },
    
    // Theme
    defaultTheme: 'light', // 'light' or 'dark'
    
    // Colors
    colors: {
      primary: '#6366f1',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6'
    }
  },

  // Storage settings (for offline/cache)
  storage: {
    // Use localStorage for caching
    enabled: true,
    prefix: 'crm_',
    
    // Cache duration (in minutes)
    cacheDuration: 30,
    
    // Storage keys
    keys: {
      currentUser: 'current_user',
      currentOrg: 'current_org',
      authToken: 'auth_token',
      theme: 'theme',
      
      // Cache keys
      companiesCache: 'cache_companies',
      contactsCache: 'cache_contacts',
      locationsCache: 'cache_locations'
    }
  },

  // API settings
  api: {
    timeout: 30000, // milliseconds
    retryAttempts: 3,
    retryDelay: 1000, // milliseconds
    
    // Headers
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  },

  // Security settings
  security: {
    // Session timeout (minutes)
    sessionTimeout: 60,
    
    // Password requirements (handled by Firebase)
    passwordMinLength: 8,
    passwordRequireSpecialChar: true,
    passwordRequireNumber: true,
    passwordRequireUppercase: true,
    
    // Auto-logout on inactivity
    autoLogout: true,
    autoLogoutTimeout: 30 // minutes
  },

  // Validation rules
  validation: {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    phone: /^[\d\s\-\+\(\)]+$/,
    zip: /^\d{5}(-\d{4})?$/,
    url: /^https?:\/\/.+/,
    currency: /^\$?\d+(\.\d{2})?$/
  },

  // Development settings
  dev: {
    // Enable debug logging
    debugMode: true,
    
    // Use mock data (set to false when Xano is connected)
    useMockData: true,
    
    // Show developer tools
    showDevTools: false,
    
    // Log API calls
    logApiCalls: true
  }
};

// Freeze config to prevent accidental modifications
Object.freeze(CONFIG);
Object.freeze(CONFIG.organizations);
Object.freeze(CONFIG.firebase);
Object.freeze(CONFIG.xano);

// Make available globally
window.CONFIG = CONFIG;

// Log initialization
if (CONFIG.dev.debugMode) {
  console.log('📋 Configuration loaded:', {
    environment: CONFIG.app.environment,
    version: CONFIG.app.version,
    mockData: CONFIG.dev.useMockData,
    firebase: CONFIG.firebase.projectId ? '✅ Configured' : '❌ Not configured',
    xano: CONFIG.xano.baseUrl.includes('YOUR') ? '❌ Not configured' : '✅ Configured'
  });
}
