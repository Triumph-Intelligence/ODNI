/**
 * API Service
 * Handles all API calls to Xano backend
 * 
 * This service provides a wrapper around fetch() with:
 * - Authentication token handling
 * - Error handling
 * - Request/response logging
 * - Retry logic
 */

const ApiService = {
  // Base URL for API
  baseUrl: CONFIG.xano.baseUrl,
  
  // Current auth token
  authToken: null,

  /**
   * Initialize API service
   */
  async init() {
    // Load auth token from storage
    this.authToken = localStorage.getItem(
      CONFIG.storage.prefix + CONFIG.storage.keys.authToken
    );

    Utils.debug('API Service initialized');
  },

  /**
   * Set authentication token
   */
  setAuthToken(token) {
    this.authToken = token;
    localStorage.setItem(
      CONFIG.storage.prefix + CONFIG.storage.keys.authToken,
      token
    );
  },

  /**
   * Clear authentication token
   */
  clearAuthToken() {
    this.authToken = null;
    localStorage.removeItem(
      CONFIG.storage.prefix + CONFIG.storage.keys.authToken
    );
  },

  /**
   * Make API request
   */
  async request(endpoint, options = {}) {
    const {
      method = 'GET',
      body = null,
      headers = {},
      params = null,
      retry = true
    } = options;

    try {
      // Build URL with params
      let url = `${this.baseUrl}${endpoint}`;
      if (params) {
        const queryString = new URLSearchParams(params).toString();
        url += `?${queryString}`;
      }

      // Build headers
      const requestHeaders = {
        ...CONFIG.api.headers,
        ...headers
      };

      // Add auth token if available
      if (this.authToken) {
        requestHeaders['Authorization'] = `Bearer ${this.authToken}`;
      }

      // Build request options
      const requestOptions = {
        method,
        headers: requestHeaders
      };

      // Add body for non-GET requests
      if (body && method !== 'GET') {
        requestOptions.body = JSON.stringify(body);
      }

      // Log request in dev mode
      if (CONFIG.dev.logApiCalls) {
        Utils.debug('API Request:', method, url, body);
      }

      // Make request
      const response = await fetch(url, requestOptions);

      // Log response in dev mode
      if (CONFIG.dev.logApiCalls) {
        Utils.debug('API Response:', response.status, response.statusText);
      }

      // Handle response
      if (!response.ok) {
        throw await this.handleErrorResponse(response);
      }

      // Parse response
      const data = await response.json();
      
      return {
        success: true,
        data: data
      };

    } catch (error) {
      Utils.error('API request failed:', error);

      // Retry logic
      if (retry && error.status >= 500) {
        Utils.debug('Retrying request...');
        await Utils.sleep(CONFIG.api.retryDelay);
        return this.request(endpoint, { ...options, retry: false });
      }

      return {
        success: false,
        error: error
      };
    }
  },

  /**
   * Handle error response
   */
  async handleErrorResponse(response) {
    let errorMessage = response.statusText;
    
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch (e) {
      // Response is not JSON
    }

    const error = new Error(errorMessage);
    error.status = response.status;
    error.statusText = response.statusText;
    
    return error;
  },

  /**
   * GET request
   */
  async get(endpoint, params = null) {
    return this.request(endpoint, { method: 'GET', params });
  },

  /**
   * POST request
   */
  async post(endpoint, body) {
    return this.request(endpoint, { method: 'POST', body });
  },

  /**
   * PUT request
   */
  async put(endpoint, body) {
    return this.request(endpoint, { method: 'PUT', body });
  },

  /**
   * PATCH request
   */
  async patch(endpoint, body) {
    return this.request(endpoint, { method: 'PATCH', body });
  },

  /**
   * DELETE request
   */
  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  },

  // ==========================================
  // Authentication Endpoints
  // ==========================================

  /**
   * Login
   */
  async login(email, password) {
    return this.post(CONFIG.xano.endpoints.login, { email, password });
  },

  /**
   * Sign up
   */
  async signup(email, password, userData = {}) {
    return this.post(CONFIG.xano.endpoints.signup, {
      email,
      password,
      ...userData
    });
  },

  /**
   * Get current user
   */
  async getMe() {
    return this.get(CONFIG.xano.endpoints.me);
  },

  // ==========================================
  // Companies Endpoints
  // ==========================================

  /**
   * Get all companies
   */
  async getCompanies(params = {}) {
    return this.get(CONFIG.xano.endpoints.companies, params);
  },

  /**
   * Get company by ID
   */
  async getCompany(id) {
    const endpoint = CONFIG.xano.endpoints.companyById.replace('{id}', id);
    return this.get(endpoint);
  },

  /**
   * Create company
   */
  async createCompany(companyData) {
    return this.post(CONFIG.xano.endpoints.companies, companyData);
  },

  /**
   * Update company
   */
  async updateCompany(id, companyData) {
    const endpoint = CONFIG.xano.endpoints.companyById.replace('{id}', id);
    return this.put(endpoint, companyData);
  },

  /**
   * Delete company
   */
  async deleteCompany(id) {
    const endpoint = CONFIG.xano.endpoints.companyById.replace('{id}', id);
    return this.delete(endpoint);
  },

  // ==========================================
  // Locations Endpoints
  // ==========================================

  /**
   * Get all locations
   */
  async getLocations(params = {}) {
    return this.get(CONFIG.xano.endpoints.locations, params);
  },

  /**
   * Get locations by company
   */
  async getLocationsByCompany(companyId) {
    const endpoint = CONFIG.xano.endpoints.locationsByCompany.replace('{company_id}', companyId);
    return this.get(endpoint);
  },

  /**
   * Create location
   */
  async createLocation(locationData) {
    return this.post(CONFIG.xano.endpoints.locations, locationData);
  },

  /**
   * Update location
   */
  async updateLocation(id, locationData) {
    return this.put(`${CONFIG.xano.endpoints.locations}/${id}`, locationData);
  },

  /**
   * Delete location
   */
  async deleteLocation(id) {
    return this.delete(`${CONFIG.xano.endpoints.locations}/${id}`);
  },

  // ==========================================
  // Contacts Endpoints
  // ==========================================

  /**
   * Get all contacts
   */
  async getContacts(params = {}) {
    return this.get(CONFIG.xano.endpoints.contacts, params);
  },

  /**
   * Get contact by ID
   */
  async getContact(id) {
    const endpoint = CONFIG.xano.endpoints.contactById.replace('{id}', id);
    return this.get(endpoint);
  },

  /**
   * Get contacts by company
   */
  async getContactsByCompany(companyId) {
    const endpoint = CONFIG.xano.endpoints.contactsByCompany.replace('{company_id}', companyId);
    return this.get(endpoint);
  },

  /**
   * Create contact
   */
  async createContact(contactData) {
    return this.post(CONFIG.xano.endpoints.contacts, contactData);
  },

  /**
   * Update contact
   */
  async updateContact(id, contactData) {
    const endpoint = CONFIG.xano.endpoints.contactById.replace('{id}', id);
    return this.put(endpoint, contactData);
  },

  /**
   * Delete contact
   */
  async deleteContact(id) {
    const endpoint = CONFIG.xano.endpoints.contactById.replace('{id}', id);
    return this.delete(endpoint);
  },

  // ==========================================
  // Activities Endpoints
  // ==========================================

  /**
   * Get all activities
   */
  async getActivities(params = {}) {
    return this.get(CONFIG.xano.endpoints.activities, params);
  },

  /**
   * Get activities by contact
   */
  async getActivitiesByContact(contactId) {
    const endpoint = CONFIG.xano.endpoints.activitiesByContact.replace('{contact_id}', contactId);
    return this.get(endpoint);
  },

  /**
   * Create activity
   */
  async createActivity(activityData) {
    return this.post(CONFIG.xano.endpoints.activities, activityData);
  },

  /**
   * Update activity
   */
  async updateActivity(id, activityData) {
    return this.put(`${CONFIG.xano.endpoints.activities}/${id}`, activityData);
  },

  /**
   * Delete activity
   */
  async deleteActivity(id) {
    return this.delete(`${CONFIG.xano.endpoints.activities}/${id}`);
  },

  // ==========================================
  // Gifts Endpoints
  // ==========================================

  /**
   * Get all gifts
   */
  async getGifts(params = {}) {
    return this.get(CONFIG.xano.endpoints.gifts, params);
  },

  /**
   * Get gifts by contact
   */
  async getGiftsByContact(contactId) {
    const endpoint = CONFIG.xano.endpoints.giftsByContact.replace('{contact_id}', contactId);
    return this.get(endpoint);
  },

  /**
   * Create gift
   */
  async createGift(giftData) {
    return this.post(CONFIG.xano.endpoints.gifts, giftData);
  },

  /**
   * Update gift
   */
  async updateGift(id, giftData) {
    return this.put(`${CONFIG.xano.endpoints.gifts}/${id}`, giftData);
  },

  /**
   * Delete gift
   */
  async deleteGift(id) {
    return this.delete(`${CONFIG.xano.endpoints.gifts}/${id}`);
  },

  // ==========================================
  // Referrals Endpoints
  // ==========================================

  /**
   * Get all referrals
   */
  async getReferrals(params = {}) {
    return this.get(CONFIG.xano.endpoints.referrals, params);
  },

  /**
   * Create referral
   */
  async createReferral(referralData) {
    return this.post(CONFIG.xano.endpoints.referrals, referralData);
  },

  /**
   * Update referral
   */
  async updateReferral(id, referralData) {
    return this.put(`${CONFIG.xano.endpoints.referrals}/${id}`, referralData);
  },

  // ==========================================
  // Opportunities Endpoints
  // ==========================================

  /**
   * Get all opportunities
   */
  async getOpportunities(params = {}) {
    return this.get(CONFIG.xano.endpoints.opportunities, params);
  },

  /**
   * Create opportunity
   */
  async createOpportunity(opportunityData) {
    return this.post(CONFIG.xano.endpoints.opportunities, opportunityData);
  },

  /**
   * Update opportunity
   */
  async updateOpportunity(id, opportunityData) {
    return this.put(`${CONFIG.xano.endpoints.opportunities}/${id}`, opportunityData);
  },

  // ==========================================
  // Projects Endpoints
  // ==========================================

  /**
   * Get all projects
   */
  async getProjects(params = {}) {
    return this.get(CONFIG.xano.endpoints.projects, params);
  },

  /**
   * Create project
   */
  async createProject(projectData) {
    return this.post(CONFIG.xano.endpoints.projects, projectData);
  },

  /**
   * Update project
   */
  async updateProject(id, projectData) {
    return this.put(`${CONFIG.xano.endpoints.projects}/${id}`, projectData);
  },

  // ==========================================
  // Change Log Endpoints
  // ==========================================

  /**
   * Get change log
   */
  async getChangeLog(params = {}) {
    return this.get(CONFIG.xano.endpoints.changeLog, params);
  },

  /**
   * Create change log entry
   */
  async createChangeLogEntry(logData) {
    return this.post(CONFIG.xano.endpoints.changeLog, logData);
  }
};

// Make available globally
window.ApiService = ApiService;

// Log initialization
if (CONFIG.dev.debugMode) {
  console.log('🌐 API Service loaded');
}
