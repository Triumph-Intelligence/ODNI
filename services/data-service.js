/**
 * Data Service - FIXED VERSION
 * Main data management layer with proper MockData loading
 */

const DataService = {
  // Data cache
  cache: {
    companies: [],
    locations: [],
    contacts: [],
    activities: [],
    gifts: [],
    referrals: [],
    opportunities: [],
    projects: [],
    changeLog: []
  },

  // Cache timestamps
  cacheTimestamps: {},

  // Use mock data flag
  useMockData: true, // Force to true for testing

  /**
   * Initialize data service
   */
  async init() {
    console.log('💾 Data Service initializing...');

    // Initialize API service if not using mock data
    if (!this.useMockData && window.ApiService) {
      await ApiService.init();
    }

    // CRITICAL FIX: Directly load MockData into cache if using mock data
    if (this.useMockData && window.MockData) {
      console.log('📦 Loading MockData directly into cache...');
      
      // Directly populate cache with MockData
      this.cache = {
        companies: MockData.companies || [],
        locations: MockData.locations || [],
        contacts: MockData.contacts || [],
        activities: MockData.activities || [],
        gifts: MockData.gifts || [],
        referrals: MockData.referrals || [],
        opportunities: MockData.opportunities || [],
        projects: MockData.projects || [],
        changeLog: MockData.changeLog || []
      };

      // Set cache timestamps
      const now = Date.now();
      Object.keys(this.cache).forEach(key => {
        this.cacheTimestamps[key] = now;
      });

      console.log('✅ MockData loaded into cache:', {
        companies: this.cache.companies.length,
        locations: this.cache.locations.length,
        contacts: this.cache.contacts.length,
        gifts: this.cache.gifts.length,
        referrals: this.cache.referrals.length,
        opportunities: this.cache.opportunities.length,
        projects: this.cache.projects.length,
        changeLog: this.cache.changeLog.length
      });
    } else {
      // Load from API
      await this.loadAllData();
    }

    console.log('✅ Data Service initialized');
  },

  /**
   * Load all data from API
   */
  async loadAllData() {
    if (this.useMockData) {
      // Already loaded in init()
      return;
    }

    await Promise.all([
      this.getCompanies(true),
      this.getLocations(true),
      this.getContacts(true),
      this.getActivities(true),
      this.getGifts(true),
      this.getReferrals(true),
      this.getOpportunities(true),
      this.getProjects(true),
      this.getChangeLog(true)
    ]);
  },

  /**
   * Check if cache is valid
   */
  isCacheValid(key) {
    if (!this.cache[key]) return false;
    if (!CONFIG.storage.enabled) return true;
    
    const timestamp = this.cacheTimestamps[key];
    if (!timestamp) return false;

    const now = Date.now();
    const cacheAge = (now - timestamp) / (1000 * 60);
    
    return cacheAge < CONFIG.storage.cacheDuration;
  },

  /**
   * Update cache
   */
  updateCache(key, data) {
    this.cache[key] = data;
    this.cacheTimestamps[key] = Date.now();
  },

  /**
   * Clear cache
   */
  clearCache(key = null) {
    if (key) {
      this.cache[key] = null;
      delete this.cacheTimestamps[key];
    } else {
      Object.keys(this.cache).forEach(k => {
        this.cache[k] = null;
      });
      this.cacheTimestamps = {};
    }
  },

  // ==========================================
  // Data Getters - Return cache directly when using MockData
  // ==========================================

  /**
   * Get all companies
   */
  async getCompanies(forceRefresh = false) {
    // If using mock data, always return from cache
    if (this.useMockData) {
      return this.cache.companies || [];
    }

    if (!forceRefresh && this.isCacheValid('companies')) {
      return this.cache.companies;
    }

    // Fetch from API
    const response = await ApiService.getCompanies();
    const companies = response.success ? response.data : [];
    this.updateCache('companies', companies);
    return companies;
  },

  /**
   * Get all locations
   */
  async getLocations(forceRefresh = false) {
    if (this.useMockData) {
      return this.cache.locations || [];
    }

    if (!forceRefresh && this.isCacheValid('locations')) {
      return this.cache.locations;
    }

    const response = await ApiService.getLocations();
    const locations = response.success ? response.data : [];
    this.updateCache('locations', locations);
    return locations;
  },

  /**
   * Get all contacts
   */
  async getContacts(forceRefresh = false) {
    if (this.useMockData) {
      return this.cache.contacts || [];
    }

    if (!forceRefresh && this.isCacheValid('contacts')) {
      return this.cache.contacts;
    }

    const response = await ApiService.getContacts();
    const contacts = response.success ? response.data : [];
    this.updateCache('contacts', contacts);
    return contacts;
  },

  /**
   * Get all activities
   */
  async getActivities(forceRefresh = false) {
    if (this.useMockData) {
      return this.cache.activities || [];
    }

    if (!forceRefresh && this.isCacheValid('activities')) {
      return this.cache.activities;
    }

    const response = await ApiService.getActivities();
    const activities = response.success ? response.data : [];
    this.updateCache('activities', activities);
    return activities;
  },

  /**
   * Get all gifts
   */
  async getGifts(forceRefresh = false) {
    if (this.useMockData) {
      return this.cache.gifts || [];
    }

    if (!forceRefresh && this.isCacheValid('gifts')) {
      return this.cache.gifts;
    }

    const response = await ApiService.getGifts();
    const gifts = response.success ? response.data : [];
    this.updateCache('gifts', gifts);
    return gifts;
  },

  /**
   * Get all referrals
   */
  async getReferrals(forceRefresh = false) {
    if (this.useMockData) {
      return this.cache.referrals || [];
    }

    if (!forceRefresh && this.isCacheValid('referrals')) {
      return this.cache.referrals;
    }

    const response = await ApiService.getReferrals();
    const referrals = response.success ? response.data : [];
    this.updateCache('referrals', referrals);
    return referrals;
  },

  /**
   * Get all opportunities
   */
  async getOpportunities(forceRefresh = false) {
    if (this.useMockData) {
      return this.cache.opportunities || [];
    }

    if (!forceRefresh && this.isCacheValid('opportunities')) {
      return this.cache.opportunities;
    }

    const response = await ApiService.getOpportunities();
    const opportunities = response.success ? response.data : [];
    this.updateCache('opportunities', opportunities);
    return opportunities;
  },

  /**
   * Get all projects
   */
  async getProjects(forceRefresh = false) {
    if (this.useMockData) {
      return this.cache.projects || [];
    }

    if (!forceRefresh && this.isCacheValid('projects')) {
      return this.cache.projects;
    }

    const response = await ApiService.getProjects();
    const projects = response.success ? response.data : [];
    this.updateCache('projects', projects);
    return projects;
  },

  /**
   * Get change log
   */
  async getChangeLog(forceRefresh = false) {
    if (this.useMockData) {
      return this.cache.changeLog || [];
    }

    if (!forceRefresh && this.isCacheValid('changeLog')) {
      return this.cache.changeLog;
    }

    const response = await ApiService.getChangeLog();
    const changeLog = response.success ? response.data : [];
    this.updateCache('changeLog', changeLog);
    return changeLog;
  },

  /**
   * Get company by ID
   */
  async getCompany(id) {
    const companies = await this.getCompanies();
    return companies.find(c => c.id === id || c.normalized === id);
  },

  /**
   * Get contact by ID
   */
  async getContact(id) {
    const contacts = await this.getContacts();
    return contacts.find(c => c.id === id || c.email === id);
  },

  /**
   * Get locations by company
   */
  async getLocationsByCompany(companyId) {
    const locations = await this.getLocations();
    return locations.filter(l => 
      l.company_id === companyId || l.company === companyId
    );
  },

  // ==========================================
  // Data Mutations (Create, Update, Delete)
  // ==========================================

  /**
   * Create company
   */
  async createCompany(companyData) {
    let result;

    if (this.useMockData) {
      const newCompany = {
        id: Utils.generateId(),
        ...companyData,
        normalized: Utils.normalizeCompanyName(companyData.name || companyData.company_name),
        created_at: new Date().toISOString()
      };

      this.cache.companies.push(newCompany);
      result = { success: true, data: newCompany };
    } else {
      result = await ApiService.createCompany(companyData);
      if (result.success) {
        this.clearCache('companies');
      }
    }

    if (result.success) {
      await this.logChange('Company Created', `Created company: ${companyData.name || companyData.company_name}`);
    }

    return result;
  },

  /**
   * Update company
   */
  async updateCompany(id, updates) {
    let result;

    if (this.useMockData) {
      const index = this.cache.companies.findIndex(c => c.id === id || c.normalized === id);
      if (index !== -1) {
        this.cache.companies[index] = {
          ...this.cache.companies[index],
          ...updates,
          updated_at: new Date().toISOString()
        };
        result = { success: true, data: this.cache.companies[index] };
      } else {
        result = { success: false, error: 'Company not found' };
      }
    } else {
      result = await ApiService.updateCompany(id, updates);
      if (result.success) {
        this.clearCache('companies');
      }
    }

    if (result.success) {
      await this.logChange('Company Updated', `Updated company: ${id}`);
    }

    return result;
  },

  /**
   * Create contact
   */
  async createContact(contactData) {
    let result;

    if (this.useMockData) {
      const newContact = {
        id: Utils.generateId(),
        ...contactData,
        created_at: new Date().toISOString()
      };

      this.cache.contacts.push(newContact);
      result = { success: true, data: newContact };
    } else {
      result = await ApiService.createContact(contactData);
      if (result.success) {
        this.clearCache('contacts');
      }
    }

    if (result.success) {
      await this.logChange('Contact Created', `Created contact: ${contactData.first} ${contactData.last}`);
    }

    return result;
  },

  /**
   * Update contact
   */
  async updateContact(id, updates) {
    let result;

    if (this.useMockData) {
      const index = this.cache.contacts.findIndex(c => c.id === id || c.email === id);
      if (index !== -1) {
        this.cache.contacts[index] = {
          ...this.cache.contacts[index],
          ...updates,
          updated_at: new Date().toISOString()
        };
        result = { success: true, data: this.cache.contacts[index] };
      } else {
        result = { success: false, error: 'Contact not found' };
      }
    } else {
      result = await ApiService.updateContact(id, updates);
      if (result.success) {
        this.clearCache('contacts');
      }
    }

    if (result.success) {
      await this.logChange('Contact Updated', `Updated contact: ${id}`);
    }

    return result;
  },

  /**
   * Log a change
   */
  async logChange(action, details) {
    const entry = {
      id: Utils.generateId(),
      timestamp: new Date().toISOString(),
      user: window.AuthService?.currentUser?.displayName || 'System',
      org: window.VisibilityService?.getCurrentOrg() || 'System',
      action: action,
      details: details
    };

    if (this.useMockData) {
      this.cache.changeLog.unshift(entry);
    } else {
      await ApiService.createChangeLogEntry(entry);
      this.clearCache('changeLog');
    }
    
    console.log('📝 Change logged:', action, details);
  }
};

// Make available globally
window.DataService = DataService;

// Log initialization
console.log('💾 Data Service loaded (FIXED VERSION)');
