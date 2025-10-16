/**
 * Company Matrix Component
 * Comprehensive view of all companies, their locations, and work status
 */

const CompanyMatrixComponent = {
  // Component state
  state: {
    companies: [],
    locations: [],
    contacts: [],
    projects: [],
    opportunities: [],
    currentOrg: null,
    filters: {
      search: '',
      showOnlyWorked: false,
      showOnlyUnworked: false,
      tier: ''
    },
    expandedCompanies: new Set()
  },

  /**
   * Initialize component
   */
  async init() {
    console.log('📊 Company Matrix Component initializing...');
    
    try {
      // Set current organization
      this.state.currentOrg = VisibilityService.getCurrentOrg();
      
      // Load data
      await this.loadData();
      
      // Setup event listeners
      this.setupEventListeners();
      
      console.log('✅ Company Matrix Component initialized');
    } catch (error) {
      console.error('Error initializing Company Matrix Component:', error);
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
    const projects = await DataService.getProjects();
    const opportunities = await DataService.getOpportunities();
    
    // Apply visibility filters
    this.state.companies = VisibilityService.filterCompanies(companies, this.state.currentOrg);
    this.state.locations = VisibilityService.filterLocations(locations, companies, this.state.currentOrg);
    this.state.contacts = VisibilityService.filterContacts(contacts, companies, this.state.currentOrg);
    this.state.projects = VisibilityService.filterProjects(projects, companies, this.state.currentOrg);
    this.state.opportunities = VisibilityService.filterOpportunities(opportunities, companies, this.state.currentOrg);
    
    // Render the matrix
    this.renderMatrix();
    this.renderStatistics();
  },

  /**
   * Calculate if we've worked at a location
   */
  hasWorkedAtLocation(company, location) {
    // Check projects
    const hasProject = this.state.projects.some(p => 
      p.company === company.name && p.location === location.name
    );
    
    // Check completed opportunities
    const hasCompletedOpp = this.state.opportunities.some(o => 
      o.company === company.name && 
      o.location === location.name && 
      o.status === 'Closed-Won'
    );
    
    return hasProject || hasCompletedOpp;
  },

  /**
   * Calculate total invoiced amount for a location
   */
  getLocationInvoicedAmount(company, location) {
    let total = 0;
    
    // Sum project valuations
    const locationProjects = this.state.projects.filter(p => 
      p.company === company.name && p.location === location.name
    );
    
    locationProjects.forEach(project => {
      const value = this.parseValuation(project.valuation);
      total += value;
    });
    
    return total;
  },

  /**
   * Parse valuation string to number
   */
  parseValuation(valuation) {
    if (!valuation) return 0;
    if (typeof valuation === 'number') return valuation;
    
    const cleaned = valuation.toString().replace(/[$,]/g, '');
    
    if (cleaned.includes('K')) {
      return parseFloat(cleaned.replace('K', '')) * 1000;
    }
    if (cleaned.includes('M')) {
      return parseFloat(cleaned.replace('M', '')) * 1000000;
    }
    
    return parseFloat(cleaned) || 0;
  },

  /**
   * Format currency
   */
  formatCurrency(amount) {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${Math.round(amount / 1000)}K`;
    }
    return `$${amount}`;
  },

  /**
   * Get contacts for a location
   */
  getLocationContacts(company, location) {
    return this.state.contacts.filter(c => 
      c.company === company.normalized && 
      c.location === location.name
    );
  },

  /**
   * Render statistics summary
   */
  renderStatistics() {
    const totalCompanies = this.state.companies.length;
    const totalLocations = this.state.locations.length;
    
    let workedLocations = 0;
    let unworkedLocations = 0;
    let totalInvoiced = 0;
    let locationsWithContacts = 0;
    
    this.state.companies.forEach(company => {
      const companyLocations = this.state.locations.filter(l => 
        l.company === company.normalized
      );
      
      companyLocations.forEach(location => {
        const hasWorked = this.hasWorkedAtLocation(company, location);
        const invoiced = this.getLocationInvoicedAmount(company, location);
        const contacts = this.getLocationContacts(company, location);
        
        if (hasWorked) {
          workedLocations++;
          totalInvoiced += invoiced;
        } else {
          unworkedLocations++;
        }
        
        if (contacts.length > 0) {
          locationsWithContacts++;
        }
      });
    });
    
    const coveragePercent = totalLocations > 0 ? 
      Math.round((workedLocations / totalLocations) * 100) : 0;
    
    const statsContainer = document.getElementById('matrix-stats');
    if (statsContainer) {
      statsContainer.innerHTML = `
        <div class="card-grid" style="margin-bottom: 20px;">
          <div class="card kpi-card">
            <div class="kpi-value">${totalCompanies}</div>
            <div class="kpi-label">Total Companies</div>
          </div>
          <div class="card kpi-card">
            <div class="kpi-value">${totalLocations}</div>
            <div class="kpi-label">Total Locations</div>
          </div>
          <div class="card kpi-card">
            <div class="kpi-value" style="color: var(--success-color);">${workedLocations}</div>
            <div class="kpi-label">Worked Locations</div>
          </div>
          <div class="card kpi-card">
            <div class="kpi-value" style="color: var(--warning-color);">${unworkedLocations}</div>
            <div class="kpi-label">Opportunity Locations</div>
          </div>
          <div class="card kpi-card">
            <div class="kpi-value">${this.formatCurrency(totalInvoiced)}</div>
            <div class="kpi-label">Total Invoiced</div>
          </div>
          <div class="card kpi-card">
            <div class="kpi-value">${coveragePercent}%</div>
            <div class="kpi-label">Coverage Rate</div>
          </div>
        </div>
      `;
    }
  },

  /**
   * Render the company matrix
   */
  renderMatrix() {
    const container = document.getElementById('company-matrix-container');
    if (!container) return;
    
    if (this.state.companies.length === 0) {
      container.innerHTML = '<div class="table-empty">No companies found</div>';
      return;
    }
    
    // Apply filters
    let filteredCompanies = [...this.state.companies];
    
    if (this.state.filters.search) {
      const search = this.state.filters.search.toLowerCase();
      filteredCompanies = filteredCompanies.filter(company => 
        company.name.toLowerCase().includes(search) ||
        company.tier?.toLowerCase().includes(search)
      );
    }
    
    if (this.state.filters.tier) {
      filteredCompanies = filteredCompanies.filter(company => 
        company.tier === this.state.filters.tier
      );
    }
    
    // Build matrix HTML
    const matrixHTML = filteredCompanies.map(company => {
      const companyLocations = this.state.locations.filter(l => 
        l.company === company.normalized
      );
      
      const isExpanded = this.state.expandedCompanies.has(company.normalized);
      
      // Calculate company stats
      let companyWorkedCount = 0;
      let companyUnworkedCount = 0;
      let companyInvoiced = 0;
      
      companyLocations.forEach(location => {
        const hasWorked = this.hasWorkedAtLocation(company, location);
        if (hasWorked) {
          companyWorkedCount++;
          companyInvoiced += this.getLocationInvoicedAmount(company, location);
        } else {
          companyUnworkedCount++;
        }
      });
      
      // Apply location filters
      let displayLocations = companyLocations;
      if (this.state.filters.showOnlyWorked) {
        displayLocations = companyLocations.filter(l => 
          this.hasWorkedAtLocation(company, l)
        );
      } else if (this.state.filters.showOnlyUnworked) {
        displayLocations = companyLocations.filter(l => 
          !this.hasWorkedAtLocation(company, l)
        );
      }
      
      if (displayLocations.length === 0 && (this.state.filters.showOnlyWorked || this.state.filters.showOnlyUnworked)) {
        return ''; // Skip company if no locations match filter
      }
      
      return `
        <div class="card" style="margin-bottom: 20px;">
          <div class="card-header" style="cursor: pointer; user-select: none;" 
               onclick="CompanyMatrixComponent.toggleCompany('${company.normalized}')">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div style="display: flex; align-items: center; gap: 12px;">
                <span style="font-size: 20px; transition: transform 0.3s;">
                  ${isExpanded ? '▼' : '▶'}
                </span>
                <div>
                  <h3 style="margin: 0; font-size: 18px;">${company.name}</h3>
                  <div style="display: flex; gap: 8px; margin-top: 4px;">
                    <span class="badge badge-secondary">${company.tier}</span>
                    <span class="badge ${company.status === 'Active' ? 'badge-success' : 'badge-warning'}">${company.status}</span>
                  </div>
                </div>
              </div>
              <div style="display: flex; gap: 20px; align-items: center;">
                <div style="text-align: center;">
                  <div style="font-size: 20px; font-weight: bold; color: var(--success-color);">
                    ${companyWorkedCount}
                  </div>
                  <div style="font-size: 11px; color: var(--text-muted);">Worked</div>
                </div>
                <div style="text-align: center;">
                  <div style="font-size: 20px; font-weight: bold; color: var(--warning-color);">
                    ${companyUnworkedCount}
                  </div>
                  <div style="font-size: 11px; color: var(--text-muted);">Opportunities</div>
                </div>
                <div style="text-align: center;">
                  <div style="font-size: 20px; font-weight: bold; color: var(--primary-color);">
                    ${this.formatCurrency(companyInvoiced)}
                  </div>
                  <div style="font-size: 11px; color: var(--text-muted);">Total Invoiced</div>
                </div>
              </div>
            </div>
          </div>
          
          ${isExpanded ? `
            <div class="card-body">
              ${displayLocations.length > 0 ? `
                <div class="location-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px;">
                  ${displayLocations.map(location => this.renderLocationCard(company, location)).join('')}
                </div>
              ` : `
                <div class="table-empty">No locations found</div>
              `}
            </div>
          ` : ''}
        </div>
      `;
    }).join('');
    
    container.innerHTML = matrixHTML || '<div class="table-empty">No companies match the current filters</div>';
  },

  /**
   * Render a location card
   */
  renderLocationCard(company, location) {
    const hasWorked = this.hasWorkedAtLocation(company, location);
    const invoiced = this.getLocationInvoicedAmount(company, location);
    const contacts = this.getLocationContacts(company, location);
    
    // Get projects for this location
    const locationProjects = this.state.projects.filter(p => 
      p.company === company.name && p.location === location.name
    );
    
    const cardClass = hasWorked ? 'location-worked' : 'location-opportunity';
    const borderColor = hasWorked ? 'var(--success-color)' : 'var(--warning-color)';
    
    return `
      <div class="location-card ${cardClass}" 
           style="padding: 16px; border: 2px solid ${borderColor}; border-radius: 8px; background: var(--background); cursor: pointer; transition: all 0.3s;"
           onclick="CompanyMatrixComponent.showLocationDetails('${company.normalized}', '${location.name}')">
        
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
          <div>
            <h4 style="margin: 0; font-size: 16px; font-weight: 600;">${location.name}</h4>
            <div style="font-size: 13px; color: var(--text-muted); margin-top: 4px;">
              ${location.city}, ${location.state} ${location.zip}
            </div>
          </div>
          <span class="badge ${hasWorked ? 'badge-success' : 'badge-warning'}" style="font-size: 10px;">
            ${hasWorked ? '✓ Worked' : '○ Opportunity'}
          </span>
        </div>
        
        ${hasWorked ? `
          <div style="margin-bottom: 12px; padding: 12px; background: rgba(16, 185, 129, 0.1); border-radius: 6px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <div style="font-size: 11px; color: var(--text-muted); margin-bottom: 4px;">Invoiced Amount</div>
                <div style="font-size: 20px; font-weight: bold; color: var(--success-color);">
                  ${this.formatCurrency(invoiced)}
                </div>
              </div>
              <div style="text-align: right;">
                <div style="font-size: 11px; color: var(--text-muted); margin-bottom: 4px;">Projects</div>
                <div style="font-size: 18px; font-weight: bold; color: var(--success-color);">
                  ${locationProjects.length}
                </div>
              </div>
            </div>
          </div>
        ` : ''}
        
        <div style="padding: 12px; background: var(--background-alt); border-radius: 6px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <div style="font-size: 12px; font-weight: 600; color: var(--text-primary);">
              Contacts (${contacts.length})
            </div>
            ${contacts.length === 0 ? `
              <span style="font-size: 10px; color: var(--error-color);">No contacts</span>
            ` : ''}
          </div>
          
          ${contacts.length > 0 ? `
            <div style="display: flex; flex-direction: column; gap: 6px;">
              ${contacts.slice(0, 2).map(contact => `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <div style="font-size: 12px;">
                    <strong>${contact.first} ${contact.last}</strong>
                    ${contact.title ? `<span style="color: var(--text-muted);"> - ${contact.title}</span>` : ''}
                  </div>
                  ${contact.last_contacted ? `
                    <span style="font-size: 10px; color: var(--text-muted);">
                      ${this.getRelativeTime(contact.last_contacted)}
                    </span>
                  ` : ''}
                </div>
              `).join('')}
              ${contacts.length > 2 ? `
                <div style="font-size: 11px; color: var(--primary-color); text-align: center;">
                  +${contacts.length - 2} more
                </div>
              ` : ''}
            </div>
          ` : `
            <button class="btn btn-sm btn-warning" style="width: 100%; margin-top: 8px;" 
                    onclick="event.stopPropagation(); CompanyMatrixComponent.addContact('${company.normalized}', '${location.name}')">
              + Add Contact
            </button>
          `}
        </div>
        
        <div style="margin-top: 12px; text-align: center;">
          <button class="btn btn-sm btn-ghost" style="width: 100%;">
            View Details →
          </button>
        </div>
      </div>
    `;
  },

  /**
   * Show location details modal
   */
  showLocationDetails(companyId, locationName) {
    const company = this.state.companies.find(c => c.normalized === companyId);
    const location = this.state.locations.find(l => 
      l.company === companyId && l.name === locationName
    );
    
    if (!company || !location) return;
    
    const hasWorked = this.hasWorkedAtLocation(company, location);
    const invoiced = this.getLocationInvoicedAmount(company, location);
    const contacts = this.getLocationContacts(company, location);
    
    // Get projects
    const locationProjects = this.state.projects.filter(p => 
      p.company === company.name && p.location === location.name
    );
    
    // Get opportunities
    const locationOpportunities = this.state.opportunities.filter(o => 
      o.company === company.name && o.location === location.name
    );
    
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop active';
    modal.innerHTML = `
      <div class="modal active" style="max-width: 800px; width: 90%; max-height: 90vh;">
        <div class="modal-header">
          <h3 class="modal-title">${company.name} - ${location.name}</h3>
          <button class="modal-close" onclick="this.closest('.modal-backdrop').remove()">&times;</button>
        </div>
        <div class="modal-body" style="max-height: 70vh; overflow-y: auto;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
            <div class="card" style="padding: 16px;">
              <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">Location</div>
              <div style="font-size: 14px; font-weight: 600;">${location.city}, ${location.state} ${location.zip}</div>
            </div>
            <div class="card" style="padding: 16px;">
              <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">Status</div>
              <span class="badge ${hasWorked ? 'badge-success' : 'badge-warning'}">
                ${hasWorked ? '✓ Active Location' : '○ Opportunity'}
              </span>
            </div>
          </div>
          
          ${hasWorked ? `
            <div class="card" style="padding: 20px; margin-bottom: 20px; background: linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(16, 185, 129, 0.02) 100%);">
              <h4 style="margin-top: 0; margin-bottom: 16px; color: var(--success-color);">Work History</h4>
              <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                <div>
                  <div style="font-size: 12px; color: var(--text-muted);">Total Invoiced</div>
                  <div style="font-size: 24px; font-weight: bold; color: var(--success-color);">
                    ${this.formatCurrency(invoiced)}
                  </div>
                </div>
                <div>
                  <div style="font-size: 12px; color: var(--text-muted);">Projects</div>
                  <div style="font-size: 24px; font-weight: bold;">${locationProjects.length}</div>
                </div>
                <div>
                  <div style="font-size: 12px; color: var(--text-muted);">Opportunities</div>
                  <div style="font-size: 24px; font-weight: bold;">${locationOpportunities.length}</div>
                </div>
              </div>
              
              ${locationProjects.length > 0 ? `
                <div>
                  <h5 style="margin-bottom: 12px;">Projects</h5>
                  <div style="display: flex; flex-direction: column; gap: 8px;">
                    ${locationProjects.map(project => `
                      <div style="padding: 12px; background: var(--background); border-radius: 6px; border-left: 3px solid var(--success-color);">
                        <div style="display: flex; justify-content: space-between; align-items: start;">
                          <div>
                            <div style="font-weight: 600;">${project.job}</div>
                            <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">
                              ${project.start ? `${new Date(project.start).toLocaleDateString()} - ` : ''}
                              ${project.end ? new Date(project.end).toLocaleDateString() : 'Ongoing'}
                            </div>
                            ${project.contact ? `
                              <div style="font-size: 12px; margin-top: 4px;">
                                <strong>Contact:</strong> ${project.contact}
                              </div>
                            ` : ''}
                          </div>
                          <div style="text-align: right;">
                            <div style="font-size: 18px; font-weight: bold; color: var(--success-color);">
                              ${this.formatCurrency(this.parseValuation(project.valuation))}
                            </div>
                          </div>
                        </div>
                      </div>
                    `).join('')}
                  </div>
                </div>
              ` : ''}
            </div>
          ` : `
            <div class="card" style="padding: 20px; margin-bottom: 20px; background: linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(245, 158, 11, 0.02) 100%);">
              <h4 style="margin-top: 0; margin-bottom: 16px; color: var(--warning-color);">Opportunity Details</h4>
              <p style="color: var(--text-secondary);">This location has not been worked yet. It represents a potential opportunity for business development.</p>
              
              ${locationOpportunities.length > 0 ? `
                <div style="margin-top: 16px;">
                  <h5 style="margin-bottom: 12px;">Open Opportunities</h5>
                  <div style="display: flex; flex-direction: column; gap: 8px;">
                    ${locationOpportunities.map(opp => `
                      <div style="padding: 12px; background: var(--background); border-radius: 6px; border-left: 3px solid var(--warning-color);">
                        <div style="display: flex; justify-content: space-between;">
                          <div>
                            <div style="font-weight: 600;">${opp.job}</div>
                            <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">
                              Start: ${opp.start ? new Date(opp.start).toLocaleDateString() : 'TBD'}
                            </div>
                          </div>
                          <div style="font-size: 18px; font-weight: bold; color: var(--warning-color);">
                            ${this.formatCurrency(this.parseValuation(opp.valuation))}
                          </div>
                        </div>
                      </div>
                    `).join('')}
                  </div>
                </div>
              ` : ''}
            </div>
          `}
          
          <div class="card" style="padding: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
              <h4 style="margin: 0;">Contacts (${contacts.length})</h4>
              <button class="btn btn-sm btn-primary" 
                      onclick="CompanyMatrixComponent.addContactFromModal('${companyId}', '${locationName}')">
                + Add Contact
              </button>
            </div>
            
            ${contacts.length > 0 ? `
              <div class="table-wrapper" style="max-height: 300px; overflow-y: auto;">
                <table class="table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Title</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Last Contact</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${contacts.map(contact => `
                      <tr>
                        <td><strong>${contact.first} ${contact.last}</strong></td>
                        <td>${contact.title || '—'}</td>
                        <td>
                          <a href="mailto:${contact.email}" style="color: var(--primary-color);">
                            ${contact.email}
                          </a>
                        </td>
                        <td>${contact.phone || '—'}</td>
                        <td>
                          ${contact.last_contacted ? 
                            new Date(contact.last_contacted).toLocaleDateString() : 
                            '<span style="color: var(--warning-color);">Never</span>'}
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            ` : `
              <div style="text-align: center; padding: 40px; color: var(--text-muted);">
                <div style="font-size: 48px; margin-bottom: 16px;">👤</div>
                <div>No contacts at this location yet</div>
              </div>
            `}
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
  },

  /**
   * Toggle company expansion
   */
  toggleCompany(companyId) {
    if (this.state.expandedCompanies.has(companyId)) {
      this.state.expandedCompanies.delete(companyId);
    } else {
      this.state.expandedCompanies.add(companyId);
    }
    this.renderMatrix();
  },

  /**
   * Get relative time string
   */
  getRelativeTime(dateStr) {
    if (!dateStr) return 'Never';
    
    const date = new Date(dateStr);
    const now = new Date();
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays}d ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)}w ago`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)}mo ago`;
    return `${Math.floor(diffInDays / 365)}y ago`;
  },

  /**
   * Add contact placeholder
   */
  addContact(companyId, locationName) {
    alert(`Add contact functionality for ${locationName}`);
    // In production, this would open a form to add a new contact
  },

  /**
   * Add contact from modal placeholder
   */
  addContactFromModal(companyId, locationName) {
    this.addContact(companyId, locationName);
  },

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Search input
    const searchInput = document.getElementById('matrix-search');
    if (searchInput) {
      searchInput.addEventListener('input', Utils.debounce((e) => {
        this.state.filters.search = e.target.value.toLowerCase();
        this.renderMatrix();
      }, 300));
    }
    
    // Filter buttons
    const showWorkedBtn = document.getElementById('show-worked-only');
    if (showWorkedBtn) {
      showWorkedBtn.addEventListener('click', () => {
        this.state.filters.showOnlyWorked = !this.state.filters.showOnlyWorked;
        this.state.filters.showOnlyUnworked = false; // Reset other filter
        showWorkedBtn.classList.toggle('btn-primary', this.state.filters.showOnlyWorked);
        showWorkedBtn.textContent = this.state.filters.showOnlyWorked ? 
          'Show All Locations' : 'Show Worked Only';
        
        // Reset unworked button
        const unworkedBtn = document.getElementById('show-unworked-only');
        if (unworkedBtn) {
          unworkedBtn.classList.remove('btn-primary');
          unworkedBtn.textContent = 'Show Opportunities Only';
        }
        
        this.renderMatrix();
      });
    }
    
    const showUnworkedBtn = document.getElementById('show-unworked-only');
    if (showUnworkedBtn) {
      showUnworkedBtn.addEventListener('click', () => {
        this.state.filters.showOnlyUnworked = !this.state.filters.showOnlyUnworked;
        this.state.filters.showOnlyWorked = false; // Reset other filter
        showUnworkedBtn.classList.toggle('btn-primary', this.state.filters.showOnlyUnworked);
        showUnworkedBtn.textContent = this.state.filters.showOnlyUnworked ? 
          'Show All Locations' : 'Show Opportunities Only';
        
        // Reset worked button
        const workedBtn = document.getElementById('show-worked-only');
        if (workedBtn) {
          workedBtn.classList.remove('btn-primary');
          workedBtn.textContent = 'Show Worked Only';
        }
        
        this.renderMatrix();
      });
    }
    
    // Tier filter
    const tierFilter = document.getElementById('matrix-tier-filter');
    if (tierFilter) {
      tierFilter.addEventListener('change', (e) => {
        this.state.filters.tier = e.target.value;
        this.renderMatrix();
      });
    }
    
    // Expand/Collapse all
    const expandAllBtn = document.getElementById('expand-all-btn');
    if (expandAllBtn) {
      expandAllBtn.addEventListener('click', () => {
        this.state.companies.forEach(c => {
          this.state.expandedCompanies.add(c.normalized);
        });
        this.renderMatrix();
      });
    }
    
    const collapseAllBtn = document.getElementById('collapse-all-btn');
    if (collapseAllBtn) {
      collapseAllBtn.addEventListener('click', () => {
        this.state.expandedCompanies.clear();
        this.renderMatrix();
      });
    }
  },

  /**
   * Show error state
   */
  showError() {
    const container = document.getElementById('company-matrix-container');
    if (container) {
      container.innerHTML = '<div class="table-empty">Error loading company matrix</div>';
    }
  },

  /**
   * Refresh component
   */
  async refresh() {
    console.log('🔄 Refreshing Company Matrix Component...');
    await this.loadData();
  }
};

// Make available globally
window.CompanyMatrixComponent = CompanyMatrixComponent;

console.log('📊 Company Matrix Component loaded');
