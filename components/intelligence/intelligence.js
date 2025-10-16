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
              <strong style="cursor: pointer; color: var(--primary-color);" 
                      onclick="IntelligenceComponent.showCompanyMap('${company.normalized}')">
                ${company.name}
              </strong>
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
   * Show company map with all companies
   */
  showCompanyMap(companyId) {
    const selectedCompany = this.state.companies.find(c => c.normalized === companyId);
    if (!selectedCompany) return;
    
    // Create modal
    const modal = this.createMapModal(selectedCompany);
    document.body.appendChild(modal);
    
    // Draw the map
    this.drawUSMap(selectedCompany);
    
    // Show modal
    modal.style.display = 'block';
    modal.classList.add('active');
  },

  /**
   * Create map modal
   */
  createMapModal(selectedCompany) {
    // Remove existing modal if any
    const existingModal = document.getElementById('company-map-modal');
    if (existingModal) existingModal.remove();
    
    const modal = document.createElement('div');
    modal.id = 'company-map-modal';
    modal.className = 'modal-backdrop active';
    modal.innerHTML = `
      <div class="modal active" style="max-width: 1200px; width: 90%; max-height: 90vh;">
        <div class="modal-header">
          <h3 class="modal-title">US Company Coverage Map - ${selectedCompany.name}</h3>
          <button class="modal-close" onclick="IntelligenceComponent.closeMapModal()">&times;</button>
        </div>
        <div class="modal-body" style="padding: 20px;">
          <div style="display: flex; gap: 20px; align-items: center; margin-bottom: 20px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="width: 0; height: 0; border-left: 8px solid transparent; border-right: 8px solid transparent; border-bottom: 16px solid var(--success-color);"></div>
              <span style="font-size: 14px; font-weight: 600;">Companies We Work With</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="width: 0; height: 0; border-left: 8px solid transparent; border-right: 8px solid transparent; border-bottom: 16px solid var(--error-color);"></div>
              <span style="font-size: 14px; font-weight: 600;">Potential Opportunities</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="width: 0; height: 0; border-left: 8px solid transparent; border-right: 8px solid transparent; border-bottom: 16px solid var(--primary-color); border: 3px solid var(--primary-color);"></div>
              <span style="font-size: 14px; font-weight: 600;">${selectedCompany.name} (Selected)</span>
            </div>
          </div>
          
          <svg id="us-map-svg" width="100%" height="600" viewBox="0 0 900 500" style="background: var(--background-alt); border-radius: 8px;">
            <!-- Map will be drawn here -->
          </svg>
          
          <div id="company-stats" style="margin-top: 20px; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
            <!-- Stats will be added here -->
          </div>
        </div>
      </div>
    `;
    
    return modal;
  },

  /**
   * Draw US map with company markers
   */
  drawUSMap(selectedCompany) {
    const svg = document.getElementById('us-map-svg');
    if (!svg) return;
    
    // Simple US state coordinates (approximate centers for continental 48 states)
    const stateCoordinates = {
      'AL': { x: 650, y: 350 },
      'AZ': { x: 250, y: 350 },
      'AR': { x: 550, y: 340 },
      'CA': { x: 100, y: 250 },
      'CO': { x: 380, y: 260 },
      'CT': { x: 820, y: 180 },
      'DE': { x: 800, y: 230 },
      'FL': { x: 700, y: 420 },
      'GA': { x: 680, y: 350 },
      'ID': { x: 250, y: 150 },
      'IL': { x: 600, y: 250 },
      'IN': { x: 640, y: 250 },
      'IA': { x: 550, y: 210 },
      'KS': { x: 480, y: 280 },
      'KY': { x: 650, y: 290 },
      'LA': { x: 580, y: 400 },
      'ME': { x: 850, y: 100 },
      'MD': { x: 780, y: 230 },
      'MA': { x: 840, y: 160 },
      'MI': { x: 650, y: 180 },
      'MN': { x: 550, y: 120 },
      'MS': { x: 600, y: 380 },
      'MO': { x: 550, y: 280 },
      'MT': { x: 350, y: 100 },
      'NE': { x: 480, y: 220 },
      'NV': { x: 180, y: 240 },
      'NH': { x: 840, y: 130 },
      'NJ': { x: 800, y: 210 },
      'NM': { x: 350, y: 350 },
      'NY': { x: 780, y: 150 },
      'NC': { x: 740, y: 310 },
      'ND': { x: 480, y: 100 },
      'OH': { x: 700, y: 230 },
      'OK': { x: 480, y: 340 },
      'OR': { x: 120, y: 120 },
      'PA': { x: 760, y: 200 },
      'RI': { x: 840, y: 180 },
      'SC': { x: 730, y: 340 },
      'SD': { x: 480, y: 160 },
      'TN': { x: 650, y: 320 },
      'TX': { x: 480, y: 400 },
      'UT': { x: 280, y: 260 },
      'VT': { x: 820, y: 120 },
      'VA': { x: 760, y: 280 },
      'WA': { x: 120, y: 60 },
      'WV': { x: 730, y: 250 },
      'WI': { x: 600, y: 160 },
      'WY': { x: 370, y: 180 }
    };
    
    // Clear existing content
    svg.innerHTML = '';
    
    // Draw state boundaries (simplified)
    const statesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    statesGroup.setAttribute('id', 'states');
    
    // Draw state circles and labels
    Object.entries(stateCoordinates).forEach(([state, coords]) => {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', coords.x);
      circle.setAttribute('cy', coords.y);
      circle.setAttribute('r', '15');
      circle.setAttribute('fill', 'var(--background)');
      circle.setAttribute('stroke', 'var(--border)');
      circle.setAttribute('stroke-width', '1');
      circle.setAttribute('opacity', '0.8');
      statesGroup.appendChild(circle);
      
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', coords.x);
      text.setAttribute('y', coords.y + 5);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('font-size', '12');
      text.setAttribute('fill', 'var(--text-secondary)');
      text.textContent = state;
      statesGroup.appendChild(text);
    });
    
    svg.appendChild(statesGroup);
    
    // Group companies by state and contractor status
    const companiesByState = {};
    const stats = {
      withContractors: 0,
      withoutContractors: 0,
      selected: 1
    };
    
    this.state.companies.forEach(company => {
      if (!company.hq_state || !stateCoordinates[company.hq_state]) return;
      
      if (!companiesByState[company.hq_state]) {
        companiesByState[company.hq_state] = {
          withContractors: [],
          withoutContractors: []
        };
      }
      
      const hasContractors = Object.values(company.contractors || {}).some(c => c);
      
      if (hasContractors) {
        companiesByState[company.hq_state].withContractors.push(company);
        stats.withContractors++;
      } else {
        companiesByState[company.hq_state].withoutContractors.push(company);
        stats.withoutContractors++;
      }
    });
    
    // Draw arrows for each state with companies
    const arrowsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    arrowsGroup.setAttribute('id', 'arrows');
    
    Object.entries(companiesByState).forEach(([state, companies]) => {
      const coords = stateCoordinates[state];
      const isSelectedState = selectedCompany.hq_state === state;
      
      // Position arrows around the state
      let offset = 0;
      
      // Draw arrows for companies with contractors (green)
      companies.withContractors.forEach((company, i) => {
        const isSelected = company.normalized === selectedCompany.normalized;
        const angle = (offset * 45) * Math.PI / 180;
        const distance = 35;
        const x = coords.x + Math.cos(angle) * distance;
        const y = coords.y + Math.sin(angle) * distance;
        
        this.drawArrow(arrowsGroup, x, y, coords.x, coords.y, 
                      isSelected ? 'var(--primary-color)' : 'var(--success-color)',
                      company.name, isSelected);
        offset++;
      });
      
      // Draw arrows for companies without contractors (red)
      companies.withoutContractors.forEach((company, i) => {
        const isSelected = company.normalized === selectedCompany.normalized;
        const angle = (offset * 45) * Math.PI / 180;
        const distance = 35;
        const x = coords.x + Math.cos(angle) * distance;
        const y = coords.y + Math.sin(angle) * distance;
        
        this.drawArrow(arrowsGroup, x, y, coords.x, coords.y,
                      isSelected ? 'var(--primary-color)' : 'var(--error-color)',
                      company.name, isSelected);
        offset++;
      });
    });
    
    svg.appendChild(arrowsGroup);
    
    // Add statistics
    const statsDiv = document.getElementById('company-stats');
    if (statsDiv) {
      statsDiv.innerHTML = `
        <div class="card" style="text-align: center; padding: 16px;">
          <div style="font-size: 24px; font-weight: bold; color: var(--success-color);">${stats.withContractors}</div>
          <div style="font-size: 12px; color: var(--text-secondary);">Active Relationships</div>
        </div>
        <div class="card" style="text-align: center; padding: 16px;">
          <div style="font-size: 24px; font-weight: bold; color: var(--error-color);">${stats.withoutContractors}</div>
          <div style="font-size: 12px; color: var(--text-secondary);">Potential Opportunities</div>
        </div>
        <div class="card" style="text-align: center; padding: 16px;">
          <div style="font-size: 24px; font-weight: bold; color: var(--primary-color);">${Object.keys(companiesByState).length}</div>
          <div style="font-size: 12px; color: var(--text-secondary);">States with Presence</div>
        </div>
        <div class="card" style="text-align: center; padding: 16px;">
          <div style="font-size: 24px; font-weight: bold; color: var(--primary-color);">${this.state.companies.length}</div>
          <div style="font-size: 12px; color: var(--text-secondary);">Total Companies</div>
        </div>
      `;
    }
  },

  /**
   * Draw an arrow pointing to a state
   */
  drawArrow(parent, x1, y1, x2, y2, color, label, isSelected) {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.style.cursor = 'pointer';
    
    // Create arrow path
    const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    const arrowSize = isSelected ? 12 : 8;
    const points = [
      [x1, y1 - arrowSize],
      [x1 - arrowSize/2, y1 + arrowSize/2],
      [x1 + arrowSize/2, y1 + arrowSize/2]
    ].map(p => p.join(',')).join(' ');
    
    arrow.setAttribute('points', points);
    arrow.setAttribute('fill', color);
    arrow.setAttribute('stroke', isSelected ? 'white' : color);
    arrow.setAttribute('stroke-width', isSelected ? '2' : '0');
    arrow.setAttribute('opacity', isSelected ? '1' : '0.8');
    
    // Add hover effect
    group.addEventListener('mouseenter', () => {
      arrow.setAttribute('opacity', '1');
      arrow.setAttribute('transform', `scale(1.2)`);
      arrow.style.transformOrigin = `${x1}px ${y1}px`;
    });
    
    group.addEventListener('mouseleave', () => {
      arrow.setAttribute('opacity', isSelected ? '1' : '0.8');
      arrow.setAttribute('transform', 'scale(1)');
    });
    
    // Add tooltip
    const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
    title.textContent = label;
    group.appendChild(title);
    
    group.appendChild(arrow);
    parent.appendChild(group);
  },

  /**
   * Close map modal
   */
  closeMapModal() {
    const modal = document.getElementById('company-map-modal');
    if (modal) {
      modal.remove();
    }
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
