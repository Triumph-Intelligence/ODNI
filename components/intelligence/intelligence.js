/**
 * Intelligence Component
 * Office of National Intelligence - Comprehensive view of all companies, contacts, and relationships
 */

const IntelligenceComponent = {
  // Component state
  state: {
    companies: [],
    locations: [],
    contacts: [],
    gifts: [],
    currentOrg: null,
    filters: {
      search: '',
      contractor: 'all'
    }
  },

  /**
   * Initialize intelligence component
   */
  async init() {
    console.log('🕵️ Intelligence Component initializing...');
    
    try {
      // Set current organization
      this.state.currentOrg = VisibilityService.getCurrentOrg();
      
      // Load and render data
      await this.loadData();
      this.setupEventListeners();
      
      console.log('✅ Intelligence Component initialized');
    } catch (error) {
      console.error('Error initializing Intelligence Component:', error);
      this.showError();
    }
  },

  /**
   * Load all data from DataService
   */
  async loadData() {
    // Get all data
    const companies = await DataService.getCompanies();
    const locations = await DataService.getLocations();
    const contacts = await DataService.getContacts();
    const gifts = await DataService.getGifts();
    
    // Apply visibility filters
    this.state.companies = VisibilityService.filterCompanies(companies, this.state.currentOrg);
    this.state.locations = VisibilityService.filterLocations(locations, companies, this.state.currentOrg);
    this.state.contacts = VisibilityService.filterContacts(contacts, companies, this.state.currentOrg);
    this.state.gifts = VisibilityService.filterGifts(gifts, contacts, companies, this.state.currentOrg);
    
    // Render all sections
    this.renderSummary();
    this.renderContractorMatrix();
    this.renderLocationIntelligence();
  },

  /**
   * Render Intelligence Summary KPIs
   */
  renderSummary() {
    // Update KPI values
    const companiesTracked = this.state.companies.length;
    const totalLocations = this.state.locations.length;
    const totalContacts = this.state.contacts.length;
    
    // Calculate unserved locations (locations with no contacts)
    const unservedLocations = this.calculateUnservedLocations();
    
    // Update DOM
    const companiesEl = document.getElementById('intel-companies');
    const locationsEl = document.getElementById('intel-locations');
    const contactsEl = document.getElementById('intel-contacts');
    const unservedEl = document.getElementById('intel-unserved');
    
    if (companiesEl) companiesEl.textContent = companiesTracked;
    if (locationsEl) locationsEl.textContent = totalLocations;
    if (contactsEl) contactsEl.textContent = totalContacts;
    if (unservedEl) unservedEl.textContent = unservedLocations;
  },

  /**
   * Calculate unserved locations
   */
  calculateUnservedLocations() {
    const locationContactMap = new Map();
    
    // Initialize all locations as unserved
    this.state.locations.forEach(location => {
      const key = `${location.company}-${location.name}`;
      locationContactMap.set(key, 0);
    });
    
    // Count contacts per location
    this.state.contacts.forEach(contact => {
      if (contact.location) {
        const key = `${contact.company}-${contact.location}`;
        const current = locationContactMap.get(key) || 0;
        locationContactMap.set(key, current + 1);
      }
    });
    
    // Count unserved (0 contacts)
    let unserved = 0;
    locationContactMap.forEach(count => {
      if (count === 0) unserved++;
    });
    
    return unserved;
  },

  /**
   * Render Contractor Intelligence Matrix
   */
  renderContractorMatrix() {
    const tbody = document.getElementById('intel-matrix-body');
    if (!tbody) return;
    
    if (this.state.companies.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="table-empty">No companies found</td></tr>';
      return;
    }
    
    // Build matrix rows
    const rows = this.state.companies.map(company => {
      const contractors = company.contractors || {};
      
      // Helper function to format contractor cell
      const formatContractor = (contractor, type) => {
        if (!contractor) return '<span class="text-muted">—</span>';
        
        // Get contractor org info
        const orgInfo = CONFIG.organizations.contractors.find(c => c.name === contractor);
        const color = orgInfo ? orgInfo.color : '#6b7280';
        
        return `<span style="color: ${color}; font-weight: 600;">${contractor}</span>`;
      };
      
      // Count metrics for this company
      const locationCount = this.state.locations.filter(l => l.company === company.normalized).length;
      const contactCount = this.state.contacts.filter(c => c.company === company.normalized).length;
      
      // Determine coverage status
      const coverageScore = Object.values(contractors).filter(c => c).length;
      const coverageBadge = coverageScore >= 4 ? 'badge-success' : 
                           coverageScore >= 2 ? 'badge-warning' : 
                           'badge-error';
      
      return `
        <tr>
          <td>
            <div style="display: flex; align-items: center; gap: 8px;">
              <strong>${company.name}</strong>
              <span class="badge ${coverageBadge}" style="font-size: 10px;">
                ${coverageScore}/5
              </span>
            </div>
            <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">
              ${locationCount} locations • ${contactCount} contacts
            </div>
          </td>
          <td>${formatContractor(contractors.electrical, 'electrical')}</td>
          <td>${formatContractor(contractors.mechanical, 'mechanical')}</td>
          <td>${formatContractor(contractors.interior_gc, 'interior_gc')}</td>
          <td>${formatContractor(contractors.marketing, 'marketing')}</td>
          <td>${formatContractor(contractors.staffing, 'staffing')}</td>
        </tr>
      `;
    }).join('');
    
    tbody.innerHTML = rows;
  },

  /**
   * Render Location Intelligence
   */
  renderLocationIntelligence() {
    const tbody = document.getElementById('intel-locations-body');
    if (!tbody) return;
    
    if (this.state.locations.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="table-empty">No locations found</td></tr>';
      return;
    }
    
    // Build location rows with intelligence data
    const rows = this.state.locations.map(location => {
      // Find company
      const company = this.state.companies.find(c => c.normalized === location.company);
      if (!company) return ''; // Skip if company not found
      
      // Find contacts at this location
      const locationContacts = this.state.contacts.filter(c => 
        c.company === location.company && 
        c.location === location.name
      );
      
      // Calculate last contacted
      let lastContacted = '—';
      let daysAgo = null;
      
      if (locationContacts.length > 0) {
        const dates = locationContacts
          .filter(c => c.last_contacted)
          .map(c => new Date(c.last_contacted));
        
        if (dates.length > 0) {
          const mostRecent = new Date(Math.max(...dates));
          lastContacted = mostRecent.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
          });
          
          // Calculate days ago
          const today = new Date();
          daysAgo = Math.floor((today - mostRecent) / (1000 * 60 * 60 * 24));
        }
      }
      
      // Determine status
      let status = '';
      let statusBadge = '';
      
      if (locationContacts.length === 0) {
        status = 'Unserved';
        statusBadge = 'badge-error';
      } else if (daysAgo === null) {
        status = 'Never Contacted';
        statusBadge = 'badge-warning';
      } else if (daysAgo > 90) {
        status = 'Overdue';
        statusBadge = 'badge-error';
      } else if (daysAgo > 60) {
        status = 'Needs Attention';
        statusBadge = 'badge-warning';
      } else if (daysAgo > 30) {
        status = 'Active';
        statusBadge = 'badge-info';
      } else {
        status = 'Recently Contacted';
        statusBadge = 'badge-success';
      }
      
      return `
        <tr class="${status === 'Unserved' || status === 'Overdue' ? 'table-row-warning' : ''}">
          <td>
            <strong>${company.name}</strong>
            <div style="font-size: 11px; color: var(--text-muted);">
              ${company.tier} • ${company.status}
            </div>
          </td>
          <td>${location.name}</td>
          <td>${location.city}, ${location.state}</td>
          <td>
            <strong>${locationContacts.length}</strong>
            ${locationContacts.length > 0 ? `
              <div style="font-size: 11px; color: var(--text-muted);">
                ${locationContacts.map(c => `${c.first} ${c.last}`).slice(0, 2).join(', ')}
                ${locationContacts.length > 2 ? `+${locationContacts.length - 2}` : ''}
              </div>
            ` : ''}
          </td>
          <td>
            ${lastContacted}
            ${daysAgo !== null ? `
              <div style="font-size: 11px; color: var(--text-muted);">
                ${daysAgo} days ago
              </div>
            ` : ''}
          </td>
          <td>
            <span class="badge ${statusBadge}">${status}</span>
          </td>
        </tr>
      `;
    }).filter(row => row).join('');
    
    tbody.innerHTML = rows || '<tr><td colspan="6" class="table-empty">No location data available</td></tr>';
  },

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Search functionality (if search input exists)
    const searchInput = document.getElementById('intel-search');
    if (searchInput) {
      searchInput.addEventListener('input', Utils.debounce((e) => {
        this.state.filters.search = e.target.value.toLowerCase();
        this.applyFilters();
      }, 300));
    }
    
    // Contractor filter (if exists)
    const contractorFilter = document.getElementById('contractor-filter');
    if (contractorFilter) {
      contractorFilter.addEventListener('change', (e) => {
        this.state.filters.contractor = e.target.value;
        this.applyFilters();
      });
    }
    
    // Export buttons
    const exportMatrixBtn = document.getElementById('export-matrix-btn');
    if (exportMatrixBtn) {
      exportMatrixBtn.addEventListener('click', () => this.exportMatrix());
    }
    
    const exportLocationsBtn = document.getElementById('export-locations-btn');
    if (exportLocationsBtn) {
      exportLocationsBtn.addEventListener('click', () => this.exportLocations());
    }
  },

  /**
   * Apply filters to data
   */
  applyFilters() {
    // Re-render with filters
    this.renderContractorMatrix();
    this.renderLocationIntelligence();
  },

  /**
   * Export contractor matrix to CSV
   */
  exportMatrix() {
    const data = this.state.companies.map(company => ({
      'Company': company.name,
      'Tier': company.tier,
      'Status': company.status,
      'HQ State': company.hq_state,
      'Electrical': company.contractors?.electrical || '',
      'Mechanical': company.contractors?.mechanical || '',
      'Interior GC': company.contractors?.interior_gc || '',
      'Marketing': company.contractors?.marketing || '',
      'Staffing': company.contractors?.staffing || ''
    }));
    
    Utils.exportToCSV(data, `contractor-matrix-${new Date().toISOString().split('T')[0]}.csv`);
    
    if (window.App) {
      App.showToast('Contractor matrix exported successfully', 'success');
    }
  },

  /**
   * Export location intelligence to CSV
   */
  exportLocations() {
    const data = [];
    
    this.state.locations.forEach(location => {
      const company = this.state.companies.find(c => c.normalized === location.company);
      const locationContacts = this.state.contacts.filter(c => 
        c.company === location.company && c.location === location.name
      );
      
      data.push({
        'Company': company?.name || location.company,
        'Location': location.name,
        'City': location.city,
        'State': location.state,
        'ZIP': location.zip,
        'Contact Count': locationContacts.length,
        'Contacts': locationContacts.map(c => `${c.first} ${c.last}`).join('; ')
      });
    });
    
    Utils.exportToCSV(data, `location-intelligence-${new Date().toISOString().split('T')[0]}.csv`);
    
    if (window.App) {
      App.showToast('Location intelligence exported successfully', 'success');
    }
  },

  /**
   * Show error state
   */
  showError() {
    // Update KPIs to show error
    ['intel-companies', 'intel-locations', 'intel-contacts', 'intel-unserved'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = 'Error';
    });
    
    // Show error in tables
    const matrixBody = document.getElementById('intel-matrix-body');
    if (matrixBody) {
      matrixBody.innerHTML = '<tr><td colspan="6" class="table-empty">Error loading contractor matrix</td></tr>';
    }
    
    const locationsBody = document.getElementById('intel-locations-body');
    if (locationsBody) {
      locationsBody.innerHTML = '<tr><td colspan="6" class="table-empty">Error loading location intelligence</td></tr>';
    }
  },

  /**
   * Refresh component
   */
  async refresh() {
    console.log('🔄 Refreshing Intelligence Component...');
    await this.loadData();
  }
};

// Make available globally
window.IntelligenceComponent = IntelligenceComponent;

console.log('🕵️ Intelligence Component loaded');
