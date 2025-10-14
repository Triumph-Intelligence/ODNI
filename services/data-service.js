/**
 * Data Service
 * Main data management layer
 * 
 * This service:
 * - Provides unified interface for all data operations
 * - Uses Xano API when available (via ApiService)
 * - Falls back to mock data during development
 * - Handles caching
 * - Manages change logging
 */

const DataService = {
  // Data cache
  cache: {
    companies: null,
    locations: null,
    contacts: null,
    activities: null,
    gifts: null,
    referrals: null,
    opportunities: null,
    projects: null,
    changeLog: null
  },

  // Cache timestamps
  cacheTimestamps: {},

  // Use mock data flag
  useMockData: CONFIG.dev.useMockData,

  /**
   * Initialize data service
   */
  async init() {
    Utils.debug('Data Service initializing...');

    // Initialize API service
    if (!this.useMockData && window.ApiService) {
      await ApiService.init();
    }

    // Load initial data
    await this.loadAllData();

    Utils.info('Data Service initialized');
  },

  /**
   * Load all data
   */
  async loadAllData() {
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
    if (!CONFIG.storage.enabled) return true; // If storage disabled, always use memory cache
    
    const timestamp = this.cacheTimestamps[key];
    if (!timestamp) return false;

    const now = Date.now();
    const cacheAge = (now - timestamp) / (1000 * 60); // Age in minutes
    
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
      // Clear all cache
      Object.keys(this.cache).forEach(k => {
        this.cache[k] = null;
      });
      this.cacheTimestamps = {};
    }
  },

  // ==========================================
  // Companies
  // ==========================================

  /**
   * Get all companies
   */
  async getCompanies(forceRefresh = false) {
    if (!forceRefresh && this.isCacheValid('companies')) {
      return this.cache.companies;
    }

    let companies;

    if (this.useMockData) {
      // Use mock data
      companies = window.MockData ? MockData.companies : [];
    } else {
      // Fetch from API
      const response = await ApiService.getCompanies();
      companies = response.success ? response.data : [];
    }

    this.updateCache('companies', companies);
    return companies;
  },

  /**
   * Get company by ID
   */
  async getCompany(id) {
    const companies = await this.getCompanies();
    return companies.find(c => c.id === id || c.normalized === id);
  },

  /**
   * Create company
   */
  async createCompany(companyData) {
    let result;

    if (this.useMockData) {
      // Add to mock data
      const newCompany = {
        id: Utils.generateId(),
        ...companyData,
        normalized: Utils.normalizeCompanyName(companyData.name || companyData.company_name),
        created_at: new Date().toISOString()
      };

      if (window.MockData) {
        MockData.companies.push(newCompany);
      }

      result = { success: true, data: newCompany };
    } else {
      // Create via API
      result = await ApiService.createCompany(companyData);
    }

    if (result.success) {
      this.clearCache('companies');
      this.logChange('Company Created', `Created company: ${companyData.name || companyData.company_name}`);
    }

    return result;
  },

  /**
   * Update company
   */
  async updateCompany(id, updates) {
    let result;

    if (this.useMockData) {
      // Update mock data
      if (window.MockData) {
        const index = MockData.companies.findIndex(c => c.id === id || c.normalized === id);
        if (index !== -1) {
          MockData.companies[index] = {
            ...MockData.companies[index],
            ...updates,
            updated_at: new Date().toISOString()
          };
          result = { success: true, data: MockData.companies[index] };
        } else {
          result = { success: false, error: 'Company not found' };
        }
      }
    } else {
      // Update via API
      result = await ApiService.updateCompany(id, updates);
    }

    if (result.success) {
      this.clearCache('companies');
      this.logChange('Company Updated', `Updated company: ${id}`);
    }

    return result;
  },

  /**
   * Delete company
   */
  async deleteCompany(id) {
    let result;

    if (this.useMockData) {
      // Delete from mock data
      if (window.MockData) {
        const index = MockData.companies.findIndex(c => c.id === id || c.normalized === id);
        if (index !== -1) {
          MockData.companies.splice(index, 1);
          result = { success: true };
        } else {
          result = { success: false, error: 'Company not found' };
        }
      }
    } else {
      // Delete via API
      result = await ApiService.deleteCompany(id);
    }

    if (result.success) {
      this.clearCache('companies');
      this.logChange('Company Deleted', `Deleted company: ${id}`);
    }

    return result;
  },

  // ==========================================
  // Locations
  // ==========================================

  /**
   * Get all locations
   */
  async getLocations(forceRefresh = false) {
    if (!forceRefresh && this.isCacheValid('locations')) {
      return this.cache.locations;
    }

    let locations;

    if (this.useMockData) {
      locations = window.MockData ? MockData.locations : [];
    } else {
      const response = await ApiService.getLocations();
      locations = response.success ? response.data : [];
    }

    this.updateCache('locations', locations);
    return locations;
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

  /**
   * Create location
   */
  async createLocation(locationData) {
    let result;

    if (this.useMockData) {
      const newLocation = {
        id: Utils.generateId(),
        ...locationData,
        created_at: new Date().toISOString()
      };

      if (window.MockData) {
        MockData.locations.push(newLocation);
      }

      result = { success: true, data: newLocation };
    } else {
      result = await ApiService.createLocation(locationData);
    }

    if (result.success) {
      this.clearCache('locations');
      this.logChange('Location Created', `Created location: ${locationData.name}`);
    }

    return result;
  },

  // ==========================================
  // Contacts
  // ==========================================

  /**
   * Get all contacts
   */
  async getContacts(forceRefresh = false) {
    if (!forceRefresh && this.isCacheValid('contacts')) {
      return this.cache.contacts;
    }

    let contacts;

    if (this.useMockData) {
      contacts = window.MockData ? MockData.contacts : [];
    } else {
      const response = await ApiService.getContacts();
      contacts = response.success ? response.data : [];
    }

    this.updateCache('contacts', contacts);
    return contacts;
  },

  /**
   * Get contact by ID
   */
  async getContact(id) {
    const contacts = await this.getContacts();
    return contacts.find(c => c.id === id || c.email === id);
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

      if (window.MockData) {
        MockData.contacts.push(newContact);
      }

      result = { success: true, data: newContact };
    } else {
      result = await ApiService.createContact(contactData);
    }

    if (result.success) {
      this.clearCache('contacts');
      this.logChange('Contact Created', `Created contact: ${contactData.first} ${contactData.last}`);
    }

    return result;
  },

  /**
   * Update contact
   */
  async updateContact(id, updates) {
    let result;

    if (this.useMockData) {
      if (window.MockData) {
        const index = MockData.contacts.findIndex(c => c.id === id || c.email === id);
        if (index !== -1) {
          MockData.contacts[index] = {
            ...MockData.contacts[index],
            ...updates,
            updated_at: new Date().toISOString()
          };
          result = { success: true, data: MockData.contacts[index] };
        } else {
          result = { success: false, error: 'Contact not found' };
        }
      }
    } else {
      result = await ApiService.updateContact(id, updates);
    }

    if (result.success) {
      this.clearCache('contacts');
      this.logChange('Contact Updated', `Updated contact: ${id}`);
    }

    return result;
  },

  // ==========================================
  // Activities
  // ==========================================

  async getActivities(forceRefresh = false) {
    if (!forceRefresh && this.isCacheValid('activities')) {
      return this.cache.activities;
    }

    let activities;

    if (this.useMockData) {
      activities = window.MockData ? MockData.activities : [];
    } else {
      const response = await ApiService.getActivities();
      activities = response.success ? response.data : [];
    }

    this.updateCache('activities', activities);
    return activities;
  },

  async createActivity(activityData) {
    let result;

    if (this.useMockData) {
      const newActivity = {
        id: Utils.generateId(),
        ...activityData,
        created_at: new Date().toISOString()
      };

      if (window.MockData) {
        MockData.activities.push(newActivity);
      }

      result = { success: true, data: newActivity };
    } else {
      result = await ApiService.createActivity(activityData);
    }

    if (result.success) {
      this.clearCache('activities');
      this.logChange('Activity Created', `${activityData.type} with contact ${activityData.contact_id}`);
    }

    return result;
  },

  // ==========================================
  // Gifts
  // ==========================================

  async getGifts(forceRefresh = false) {
    if (!forceRefresh && this.isCacheValid('gifts')) {
      return this.cache.gifts;
    }

    let gifts;

    if (this.useMockData) {
      gifts = window.MockData ? MockData.gifts : [];
    } else {
      const response = await ApiService.getGifts();
      gifts = response.success ? response.data : [];
    }

    this.updateCache('gifts', gifts);
    return gifts;
  },

  async createGift(giftData) {
    let result;

    if (this.useMockData) {
      const newGift = {
        id: Utils.generateId(),
        ...giftData,
        created_at: new Date().toISOString()
      };

      if (window.MockData) {
        MockData.gifts.push(newGift);
      }

      result = { success: true, data: newGift };
    } else {
      result = await ApiService.createGift(giftData);
    }

    if (result.success) {
      this.clearCache('gifts');
      this.logChange('Gift Added', `${giftData.description} ($${giftData.value}) for ${giftData.contact_email}`);
    }

    return result;
  },

  // ==========================================
  // Referrals, Opportunities, Projects
  // ==========================================

  async getReferrals(forceRefresh = false) {
    if (!forceRefresh && this.isCacheValid('referrals')) {
      return this.cache.referrals;
    }

    let referrals;

    if (this.useMockData) {
      referrals = window.MockData ? MockData.referrals : [];
    } else {
      const response = await ApiService.getReferrals();
      referrals = response.success ? response.data : [];
    }

    this.updateCache('referrals', referrals);
    return referrals;
  },

  async getOpportunities(forceRefresh = false) {
    if (!forceRefresh && this.isCacheValid('opportunities')) {
      return this.cache.opportunities;
    }

    let opportunities;

    if (this.useMockData) {
      opportunities = window.MockData ? MockData.opportunities : [];
    } else {
      const response = await ApiService.getOpportunities();
      opportunities = response.success ? response.data : [];
    }

    this.updateCache('opportunities', opportunities);
    return opportunities;
  },

  async getProjects(forceRefresh = false) {
    if (!forceRefresh && this.isCacheValid('projects')) {
      return this.cache.projects;
    }

    let projects;

    if (this.useMockData) {
      projects = window.MockData ? MockData.projects : [];
    } else {
      const response = await ApiService.getProjects();
      projects = response.success ? response.data : [];
    }

    this.updateCache('projects', projects);
    return projects;
  },

  // ==========================================
  // Change Log
  // ==========================================

  async getChangeLog(forceRefresh = false) {
    if (!forceRefresh && this.isCacheValid('changeLog')) {
      return this.cache.changeLog;
    }

    let changeLog;

    if (this.useMockData) {
      changeLog = window.MockData ? MockData.changeLog : [];
    } else {
      const response = await ApiService.getChangeLog();
      changeLog = response.success ? response.data : [];
    }

    this.updateCache('changeLog', changeLog);
    return changeLog;
  },

  /**
   * Log a change
   */
  async logChange(action, details) {
    const entry = {
      id: Utils.generateId(),
      timestamp: new Date().toISOString(),
      user: AuthService.getCurrentUser()?.displayName || 'System',
      organization: VisibilityService.getCurrentOrg(),
      action: action,
      details: details
    };

    if (this.useMockData) {
      if (window.MockData) {
        MockData.changeLog.unshift(entry);
      }
    } else {
      await ApiService.createChangeLogEntry(entry);
    }

    this.clearCache('changeLog');
    
    Utils.debug('Change logged:', action, details);
  }
};

// Make available globally
window.DataService = DataService;

// Log initialization
if (CONFIG.dev.debugMode) {
  console.log('💾 Data Service loaded');
}
