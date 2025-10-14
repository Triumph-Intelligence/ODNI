/**
 * Visibility Service
 * Handles organization-based data visibility rules
 * 
 * Rules:
 * - Triumph Atlantic (oversight) sees ALL data
 * - Other organizations only see companies where they're assigned as contractors
 */

const VisibilityService = {
  // Current organization
  currentOrg: null,

  /**
   * Initialize the service
   */
  init(organization = null) {
    this.currentOrg = organization || CONFIG.organizations.oversight;
    Utils.debug('Visibility Service initialized for:', this.currentOrg);
  },

  /**
   * Set current organization
   */
  setOrganization(organization) {
    this.currentOrg = organization;
    Utils.debug('Organization changed to:', organization);
    
    // Dispatch event for components to react
    window.dispatchEvent(new CustomEvent('org-changed', {
      detail: { organization }
    }));
  },

  /**
   * Get current organization
   */
  getCurrentOrg() {
    return this.currentOrg;
  },

  /**
   * Check if current org is oversight (Triumph Atlantic)
   */
  isOversight() {
    return CONFIG.organizations.isOversight(this.currentOrg);
  },

  /**
   * Check if organization can see company
   * 
   * @param {Object} company - Company object with contractors property
   * @param {String} organization - Organization name (optional, uses current if not provided)
   * @returns {Boolean}
   */
  canSeeCompany(company, organization = null) {
    const org = organization || this.currentOrg;
    
    // Triumph Atlantic sees everything
    if (CONFIG.organizations.isOversight(org)) {
      return true;
    }
    
    // Check if company has contractors assigned
    if (!company.contractors) {
      return false;
    }
    
    // Check if organization is assigned to any contractor role
    const orgLower = org.toLowerCase();
    const contractors = company.contractors;
    
    return Object.values(contractors).some(contractor => 
      contractor && contractor.toLowerCase() === orgLower
    );
  },

  /**
   * Filter companies by visibility
   * 
   * @param {Array} companies - Array of company objects
   * @param {String} organization - Organization name (optional)
   * @returns {Array} Filtered companies
   */
  filterCompanies(companies, organization = null) {
    const org = organization || this.currentOrg;
    
    // Triumph Atlantic sees all
    if (CONFIG.organizations.isOversight(org)) {
      return companies;
    }
    
    // Filter companies where organization is assigned
    return companies.filter(company => 
      this.canSeeCompany(company, org)
    );
  },

  /**
   * Filter contacts by visibility
   * 
   * @param {Array} contacts - Array of contact objects
   * @param {Array} companies - Array of company objects for reference
   * @param {String} organization - Organization name (optional)
   * @returns {Array} Filtered contacts
   */
  filterContacts(contacts, companies, organization = null) {
    const org = organization || this.currentOrg;
    
    // Triumph Atlantic sees all
    if (CONFIG.organizations.isOversight(org)) {
      return contacts;
    }
    
    // Filter contacts whose companies are visible
    return contacts.filter(contact => {
      const company = companies.find(c => 
        c.normalized === contact.company_norm || c.id === contact.company_id
      );
      return company && this.canSeeCompany(company, org);
    });
  },

  /**
   * Filter locations by visibility
   * 
   * @param {Array} locations - Array of location objects
   * @param {Array} companies - Array of company objects for reference
   * @param {String} organization - Organization name (optional)
   * @returns {Array} Filtered locations
   */
  filterLocations(locations, companies, organization = null) {
    const org = organization || this.currentOrg;
    
    // Triumph Atlantic sees all
    if (CONFIG.organizations.isOversight(org)) {
      return locations;
    }
    
    // Filter locations whose companies are visible
    return locations.filter(location => {
      const company = companies.find(c => 
        c.normalized === location.company_norm || c.id === location.company_id
      );
      return company && this.canSeeCompany(company, org);
    });
  },

  /**
   * Filter activities by visibility
   * 
   * @param {Array} activities - Array of activity objects
   * @param {Array} contacts - Array of contact objects for reference
   * @param {Array} companies - Array of company objects for reference
   * @param {String} organization - Organization name (optional)
   * @returns {Array} Filtered activities
   */
  filterActivities(activities, contacts, companies, organization = null) {
    const org = organization || this.currentOrg;
    
    // Triumph Atlantic sees all
    if (CONFIG.organizations.isOversight(org)) {
      return activities;
    }
    
    // Filter activities for visible contacts
    const visibleContacts = this.filterContacts(contacts, companies, org);
    const visibleContactIds = new Set(
      visibleContacts.map(c => c.id || c.email)
    );
    
    return activities.filter(activity => 
      visibleContactIds.has(activity.contact_id) || 
      visibleContactIds.has(activity.contact_email)
    );
  },

  /**
   * Filter gifts by visibility
   */
  filterGifts(gifts, contacts, companies, organization = null) {
    return this.filterActivities(gifts, contacts, companies, organization);
  },

  /**
   * Filter referrals by visibility
   */
  filterReferrals(referrals, contacts, companies, organization = null) {
    return this.filterActivities(referrals, contacts, companies, organization);
  },

  /**
   * Filter opportunities by visibility
   * 
   * @param {Array} opportunities - Array of opportunity objects
   * @param {Array} companies - Array of company objects for reference
   * @param {String} organization - Organization name (optional)
   * @returns {Array} Filtered opportunities
   */
  filterOpportunities(opportunities, companies, organization = null) {
    const org = organization || this.currentOrg;
    
    // Triumph Atlantic sees all
    if (CONFIG.organizations.isOversight(org)) {
      return opportunities;
    }
    
    // Filter opportunities for visible companies
    return opportunities.filter(opportunity => {
      const company = companies.find(c => 
        c.name === opportunity.company_name || 
        c.normalized === opportunity.company_norm ||
        c.id === opportunity.company_id
      );
      return company && this.canSeeCompany(company, org);
    });
  },

  /**
   * Filter projects by visibility
   */
  filterProjects(projects, companies, organization = null) {
    return this.filterOpportunities(projects, companies, organization);
  },

  /**
   * Filter change log by visibility
   * 
   * @param {Array} changeLog - Array of change log entries
   * @param {String} organization - Organization name (optional)
   * @returns {Array} Filtered change log
   */
  filterChangeLog(changeLog, organization = null) {
    const org = organization || this.currentOrg;
    
    // Triumph Atlantic sees all changes
    if (CONFIG.organizations.isOversight(org)) {
      return changeLog;
    }
    
    // Other organizations only see their own changes
    return changeLog.filter(entry => 
      entry.organization === org || entry.org === org
    );
  },

  /**
   * Check if user can modify company
   * 
   * @param {Object} company - Company object
   * @param {String} organization - Organization name (optional)
   * @returns {Boolean}
   */
  canModifyCompany(company, organization = null) {
    const org = organization || this.currentOrg;
    
    // Only Triumph Atlantic can modify contractor assignments
    return CONFIG.organizations.isOversight(org);
  },

  /**
   * Check if user can modify contact
   * 
   * @param {Object} contact - Contact object
   * @param {Array} companies - Array of company objects for reference
   * @param {String} organization - Organization name (optional)
   * @returns {Boolean}
   */
  canModifyContact(contact, companies, organization = null) {
    const org = organization || this.currentOrg;
    
    // Triumph Atlantic can modify all
    if (CONFIG.organizations.isOversight(org)) {
      return true;
    }
    
    // Organizations can modify contacts at their assigned companies
    const company = companies.find(c => 
      c.normalized === contact.company_norm || c.id === contact.company_id
    );
    
    return company && this.canSeeCompany(company, org);
  },

  /**
   * Get contractor role for organization
   * 
   * @param {Object} company - Company object
   * @param {String} organization - Organization name (optional)
   * @returns {String|null} Contractor role (electrical, mechanical, etc.) or null
   */
  getContractorRole(company, organization = null) {
    const org = organization || this.currentOrg;
    
    if (CONFIG.organizations.isOversight(org)) {
      return 'oversight';
    }
    
    if (!company.contractors) {
      return null;
    }
    
    const orgLower = org.toLowerCase();
    
    for (const [role, contractor] of Object.entries(company.contractors)) {
      if (contractor && contractor.toLowerCase() === orgLower) {
        return role;
      }
    }
    
    return null;
  },

  /**
   * Get statistics for current organization
   * 
   * @param {Object} data - Object containing all data arrays
   * @returns {Object} Statistics object
   */
  getOrgStatistics(data) {
    const {
      companies = [],
      contacts = [],
      locations = [],
      activities = [],
      gifts = [],
      referrals = [],
      opportunities = [],
      projects = []
    } = data;
    
    const visibleCompanies = this.filterCompanies(companies);
    const visibleContacts = this.filterContacts(contacts, companies);
    const visibleLocations = this.filterLocations(locations, companies);
    const visibleActivities = this.filterActivities(activities, contacts, companies);
    const visibleGifts = this.filterGifts(gifts, contacts, companies);
    const visibleReferrals = this.filterReferrals(referrals, contacts, companies);
    const visibleOpportunities = this.filterOpportunities(opportunities, companies);
    const visibleProjects = this.filterProjects(projects, companies);
    
    return {
      companies: visibleCompanies.length,
      contacts: visibleContacts.length,
      locations: visibleLocations.length,
      activities: visibleActivities.length,
      gifts: visibleGifts.length,
      referrals: visibleReferrals.length,
      opportunities: visibleOpportunities.length,
      projects: visibleProjects.length,
      organization: this.currentOrg,
      isOversight: this.isOversight()
    };
  }
};

// Make available globally
window.VisibilityService = VisibilityService;

// Log initialization
if (CONFIG.dev.debugMode) {
  console.log('👁️ Visibility Service loaded');
}
