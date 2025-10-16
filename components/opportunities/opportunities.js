/**
 * Opportunities Component
 * Track and manage sales opportunities with valuation
 */

const OpportunitiesComponent = {
  // Component state
  state: {
    opportunities: [],
    companies: [],
    locations: [],
    contacts: [],
    filteredOpportunities: [],
    currentOrg: null,
    filters: {
      search: '',
      company: '',
      dateRange: 'all'
    },
    sortColumn: 'start',
    sortDirection: 'asc',
    selectedOpportunity: null
  },

  /**
   * Initialize opportunities component
   */
  async init() {
    console.log('💼 Opportunities Component initializing...');
    
    try {
      // Set current organization
      this.state.currentOrg = VisibilityService.getCurrentOrg();
      
      // Load data
      await this.loadData();
      
      // Setup event listeners
      this.setupEventListeners();
      
      console.log('✅ Opportunities Component initialized');
    } catch (error) {
      console.error('Error initializing Opportunities Component:', error);
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
    const opportunities = await DataService.getOpportunities();
    
    // Apply visibility filters
    this.state.companies = VisibilityService.filterCompanies(companies, this.state.currentOrg);
    this.state.locations = VisibilityService.filterLocations(locations, companies, this.state.currentOrg);
    this.state.contacts = VisibilityService.filterContacts(contacts, companies, this.state.currentOrg);
    this.state.opportunities = VisibilityService.filterOpportunities(opportunities, companies, this.state.currentOrg);
    
    // Initially, filtered = all
    this.state.filteredOpportunities = [...this.state.opportunities];
    
    // Apply any existing filters
    this.applyFilters();
    
    // Render
    this.renderTable();
    this.renderStatistics();
  },

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Search input
    const searchInput = document.getElementById('opportunities-search');
    if (searchInput) {
      searchInput.addEventListener('input', Utils.debounce((e) => {
        this.state.filters.search = e.target.value.toLowerCase();
        this.applyFilters();
      }, 300));
    }
    
    // Company filter
    const companyFilter = document.getElementById('opportunity-company-filter');
    if (companyFilter) {
      // Populate company options
      companyFilter.innerHTML = `
        <option value="">All Companies</option>
        ${this.state.companies.map(c => `<option value="${c.name}">${c.name}</option>`).join('')}
      `;
      
      companyFilter.addEventListener('change', (e) => {
        this.state.filters.company = e.target.value;
        this.applyFilters();
      });
    }
    
    // Date range filter
    const dateRangeFilter = document.getElementById('opportunity-date-filter');
    if (dateRangeFilter) {
      dateRangeFilter.addEventListener('change', (e) => {
        this.state.filters.dateRange = e.target.value;
        this.applyFilters();
      });
    }
    
    // Add Opportunity button
    const addBtn = document.getElementById('add-opportunity-btn');
    if (addBtn) {
      addBtn.addEventListener('click', () => this.showAddOpportunityModal());
    }
    
    // Sortable headers
    document.querySelectorAll('#opportunities-table-body').forEach(tbody => {
      const table = tbody.closest('table');
      if (table) {
        table.querySelectorAll('th.sortable').forEach(th => {
          th.style.cursor = 'pointer';
          th.addEventListener('click', () => {
            const column = th.dataset.column || 
              th.textContent.toLowerCase().replace(/\s+/g, '_');
            this.sortBy(column);
          });
        });
      }
    });
  },

  /**
   * Apply filters to opportunities
   */
  applyFilters() {
    let filtered = [...this.state.opportunities];
    
    // Apply search filter
    if (this.state.filters.search) {
      const search = this.state.filters.search.toLowerCase();
      filtered = filtered.filter(opp => 
        opp.company?.toLowerCase().includes(search) ||
        opp.location?.toLowerCase().includes(search) ||
        opp.job?.toLowerCase().includes(search) ||
        opp.contact?.toLowerCase().includes(search)
      );
    }
    
    // Apply company filter
    if (this.state.filters.company) {
      filtered = filtered.filter(opp => opp.company === this.state.filters.company);
    }
    
    // Apply date range filter
    if (this.state.filters.dateRange && this.state.filters.dateRange !== 'all') {
      const today = new Date();
      const filterDate = new Date();
      
      switch (this.state.filters.dateRange) {
        case '30days':
          filterDate.setDate(today.getDate() + 30);
          break;
        case '60days':
          filterDate.setDate(today.getDate() + 60);
          break;
        case '90days':
          filterDate.setDate(today.getDate() + 90);
          break;
        case '6months':
          filterDate.setMonth(today.getMonth() + 6);
          break;
        case 'year':
          filterDate.setFullYear(today.getFullYear() + 1);
          break;
      }
      
      filtered = filtered.filter(opp => {
        if (!opp.start) return false;
        const oppDate = new Date(opp.start);
        return oppDate <= filterDate;
      });
    }
    
    this.state.filteredOpportunities = filtered;
    this.renderTable();
    this.renderStatistics();
  },

  /**
   * Sort opportunities by column
   */
  sortBy(column) {
    // Map column names
    const columnMap = {
      'start_date': 'start',
      'valuation': 'valuation'
    };
    
    column = columnMap[column] || column;
    
    // Toggle direction if same column
    if (this.state.sortColumn === column) {
      this.state.sortDirection = this.state.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.state.sortColumn = column;
      this.state.sortDirection = 'asc';
    }
    
    // Sort the filtered opportunities
    this.state.filteredOpportunities.sort((a, b) => {
      let aVal = a[column];
      let bVal = b[column];
      
      // Handle dates
      if (column === 'start') {
        aVal = aVal ? new Date(aVal).getTime() : Number.MAX_VALUE;
        bVal = bVal ? new Date(bVal).getTime() : Number.MAX_VALUE;
      }
      
      // Handle valuation (parse from string like "$125,000")
      if (column === 'valuation') {
        aVal = this.parseValuation(aVal);
        bVal = this.parseValuation(bVal);
      }
      
      // Handle null/undefined
      if (aVal === null || aVal === undefined) aVal = '';
      if (bVal === null || bVal === undefined) bVal = '';
      
      // Compare
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }
      
      if (this.state.sortDirection === 'asc') {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }
    });
    
    this.renderTable();
    this.updateSortIndicators();
  },

  /**
   * Update sort indicators in headers
   */
  updateSortIndicators() {
    document.querySelectorAll('th.sortable').forEach(th => {
      const column = th.dataset.column || 
        th.textContent.toLowerCase().replace(/\s+/g, '_');
      
      // Remove all sort classes
      th.classList.remove('sorted-asc', 'sorted-desc');
      
      // Add current sort class
      if (column === this.state.sortColumn || 
          (column === 'start_date' && this.state.sortColumn === 'start')) {
        th.classList.add(`sorted-${this.state.sortDirection}`);
      }
    });
  },

  /**
   * Parse valuation string to number
   */
  parseValuation(valuation) {
    if (!valuation) return 0;
    if (typeof valuation === 'number') return valuation;
    
    // Remove $, commas, and parse
    const cleaned = valuation.toString().replace(/[$,]/g, '');
    
    // Handle K and M suffixes
    if (cleaned.includes('K')) {
      return parseFloat(cleaned.replace('K', '')) * 1000;
    }
    if (cleaned.includes('M')) {
      return parseFloat(cleaned.replace('M', '')) * 1000000;
    }
    
    return parseFloat(cleaned) || 0;
  },

  /**
   * Format valuation for display
   */
  formatValuation(valuation) {
    const value = this.parseValuation(valuation);
    
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${Math.round(value / 1000)}K`;
    }
    
    return `$${value}`;
  },

  /**
   * Render statistics cards
   */
  renderStatistics() {
    // Calculate stats
    const total = this.state.opportunities.length;
    const totalValue = this.state.opportunities.reduce((sum, opp) => 
      sum + this.parseValuation(opp.valuation), 0
    );
    
    // By date range
    const today = new Date();
    const thisMonth = this.state.opportunities.filter(opp => {
      if (!opp.start) return false;
      const oppDate = new Date(opp.start);
      return oppDate.getMonth() === today.getMonth() && 
             oppDate.getFullYear() === today.getFullYear();
    });
    
    const nextQuarter = this.state.opportunities.filter(opp => {
      if (!opp.start) return false;
      const oppDate = new Date(opp.start);
      const quarterEnd = new Date(today);
      quarterEnd.setMonth(today.getMonth() + 3);
      return oppDate >= today && oppDate <= quarterEnd;
    });
    
    const averageValue = total > 0 ? totalValue / total : 0;
    
    // Update stats in DOM if elements exist
    const statsContainer = document.getElementById('opportunities-stats');
    if (statsContainer) {
      statsContainer.innerHTML = `
        <div class="card-grid" style="margin-bottom: 20px;">
          <div class="card kpi-card">
            <div class="kpi-value">${total}</div>
            <div class="kpi-label">Total Opportunities</div>
          </div>
          <div class="card kpi-card">
            <div class="kpi-value">${this.formatValuation(totalValue)}</div>
            <div class="kpi-label">Pipeline Value</div>
          </div>
          <div class="card kpi-card">
            <div class="kpi-value">${thisMonth.length}</div>
            <div class="kpi-label">Starting This Month</div>
          </div>
          <div class="card kpi-card">
            <div class="kpi-value">${this.formatValuation(averageValue)}</div>
            <div class="kpi-label">Average Deal Size</div>
          </div>
        </div>
      `;
    }
  },

  /**
   * Render opportunities table
   */
  renderTable() {
    const tbody = document.getElementById('opportunities-table-body');
    if (!tbody) return;
    
    if (this.state.filteredOpportunities.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="table-empty">No opportunities found</td></tr>`;
      return;
    }
    
    // Build table rows
    const rows = this.state.filteredOpportunities.map(opp => {
      // Find company details
      const company = this.state.companies.find(c => c.name === opp.company);
      const companyTier = company?.tier || '';
      
      // Find location details
      const location = this.state.locations.find(l => 
        l.name === opp.location && l.company === company?.normalized
      );
      
      // Determine if we have a contact
      const hasContact = opp.contact && opp.contact !== 'New Contact';
      
      // Calculate days until start
      let daysUntil = '';
      let startBadge = '';
      
      if (opp.start) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const startDate = new Date(opp.start);
        startDate.setHours(0, 0, 0, 0);
        
        const days = Math.floor((startDate - today) / (1000 * 60 * 60 * 24));
        
        if (days < 0) {
          daysUntil = `Started ${Math.abs(days)} days ago`;
          startBadge = 'badge-error';
        } else if (days === 0) {
          daysUntil = 'Starts today';
          startBadge = 'badge-warning';
        } else if (days <= 7) {
          daysUntil = `Starts in ${days} days`;
          startBadge = 'badge-warning';
        } else if (days <= 30) {
          daysUntil = `In ${days} days`;
          startBadge = 'badge-info';
        } else {
          daysUntil = `In ${Math.round(days / 30)} months`;
          startBadge = '';
        }
      }
      
      // Contractor assignments
      const contractors = company?.contractors || {};
      const assignedCount = Object.values(contractors).filter(c => c).length;
      
      return `
        <tr data-opportunity-id="${opp.id || opp.job}">
          <td>
            <div style="display: flex; align-items: center; gap: 8px;">
              <strong style="cursor: pointer; color: var(--primary-color);"
                      onclick="OpportunitiesComponent.viewOpportunityDetails('${opp.id || opp.job}')">
                ${opp.company}
              </strong>
              ${companyTier ? `
                <span class="badge badge-secondary" style="font-size: 10px;">
                  ${companyTier}
                </span>
              ` : ''}
            </div>
            ${assignedCount > 0 ? `
              <div style="font-size: 11px; color: var(--text-muted);">
                ${assignedCount} contractors assigned
              </div>
            ` : ''}
          </td>
          <td>
            <strong>${opp.location}</strong>
            ${location ? `
              <div style="font-size: 11px; color: var(--text-muted);">
                ${location.city}, ${location.state}
              </div>
            ` : ''}
          </td>
          <td>
            <div>${opp.job}</div>
          </td>
          <td>
            ${hasContact ? `
              <div>${opp.contact}</div>
              <div style="font-size: 11px; color: var(--success-color);">
                ✓ Contact established
              </div>
            ` : `
              <div style="color: var(--warning-color);">New Contact Needed</div>
              <button class="btn btn-xs btn-warning" 
                      onclick="OpportunitiesComponent.assignContact('${opp.id || opp.job}')">
                Assign
              </button>
            `}
          </td>
          <td>
            ${opp.start ? 
              new Date(opp.start).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              }) : '—'}
            ${daysUntil ? `
              <div style="font-size: 11px;">
                <span class="badge ${startBadge}" style="font-size: 10px;">
                  ${daysUntil}
                </span>
              </div>
            ` : ''}
          </td>
          <td>
            <strong style="color: var(--primary-color);">
              ${this.formatValuation(opp.valuation)}
            </strong>
            <div style="margin-top: 4px;">
              <button class="btn btn-xs btn-primary" 
                      onclick="OpportunitiesComponent.convertToProject('${opp.id || opp.job}')">
                Convert to Project
              </button>
              <button class="btn btn-xs btn-ghost" 
                      onclick="OpportunitiesComponent.editOpportunity('${opp.id || opp.job}')">
                Edit
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
    
    tbody.innerHTML = rows;
  },

  /**
   * View opportunity details
   */
  viewOpportunityDetails(oppId) {
    const opp = this.state.opportunities.find(o => 
      o.id === oppId || o.job === oppId
    );
    if (!opp) return;
    
    const company = this.state.companies.find(c => c.name === opp.company);
    const location = this.state.locations.find(l => 
      l.name === opp.location && l.company === company?.normalized
    );
    
    const details = `
OPPORTUNITY DETAILS

Company: ${opp.company}
${company ? `Tier: ${company.tier}\nStatus: ${company.status}` : ''}

Location: ${opp.location}
${location ? `${location.city}, ${location.state} ${location.zip}` : ''}

Job Description: ${opp.job}

Contact: ${opp.contact || 'None assigned'}

Start Date: ${opp.start ? new Date(opp.start).toLocaleDateString() : 'Not set'}
Valuation: ${this.formatValuation(opp.valuation)}

Contractors Assigned:
${company?.contractors ? 
  Object.entries(company.contractors)
    .filter(([k, v]) => v)
    .map(([type, contractor]) => `  • ${type}: ${contractor}`)
    .join('\n') || '  None assigned' 
  : '  None assigned'}

Notes:
${opp.notes || 'No notes added'}
    `.trim();
    
    alert(details);
  },

  /**
   * Convert opportunity to project
   */
  async convertToProject(oppId) {
    const opp = this.state.opportunities.find(o => 
      o.id === oppId || o.job === oppId
    );
    if (!opp) return;
    
    if (!confirm(`Convert "${opp.job}" to a project?`)) return;
    
    // Calculate default end date (3 months from start)
    const startDate = new Date(opp.start || Date.now());
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 3);
    
    const projectData = {
      company: opp.company,
      location: opp.location,
      job: opp.job,
      contact: opp.contact,
      start: opp.start,
      end: endDate.toISOString().split('T')[0],
      valuation: opp.valuation
    };
    
    // Add to projects (mock)
    if (window.MockData) {
      MockData.projects.push({
        id: Utils.generateId(),
        ...projectData,
        created_at: new Date().toISOString()
      });
      
      // Remove from opportunities
      const oppIndex = MockData.opportunities.findIndex(o => 
        o.id === oppId || o.job === oppId
      );
      if (oppIndex !== -1) {
        MockData.opportunities.splice(oppIndex, 1);
      }
    }
    
    // Update cache
    DataService.cache.projects.push(projectData);
    DataService.cache.opportunities = DataService.cache.opportunities.filter(o =>
      o.id !== oppId && o.job !== oppId
    );
    
    // Log the change
    await DataService.logChange('Opportunity Converted', 
      `Converted opportunity "${opp.job}" to project`
    );
    
    // Reload data
    await this.loadData();
    
    if (window.App) {
      App.showToast('Opportunity converted to project successfully', 'success');
    }
  },

  /**
   * Assign contact to opportunity
   */
  async assignContact(oppId) {
    const opp = this.state.opportunities.find(o => 
      o.id === oppId || o.job === oppId
    );
    if (!opp) return;
    
    // Get contacts for this company
    const company = this.state.companies.find(c => c.name === opp.company);
    const companyContacts = this.state.contacts.filter(c => 
      c.company === company?.normalized
    );
    
    if (companyContacts.length === 0) {
      alert('No contacts found for this company. Please add a contact first.');
      return;
    }
    
    // Simple selection (in production, use a proper modal)
    const contactList = companyContacts.map(c => 
      `${c.first} ${c.last} - ${c.title}`
    ).join('\n');
    
    const selectedName = prompt(
      `Select a contact for this opportunity:\n\n${contactList}\n\nEnter the contact's full name:`
    );
    
    if (!selectedName) return;
    
    // Find the selected contact
    const selectedContact = companyContacts.find(c => 
      `${c.first} ${c.last}`.toLowerCase() === selectedName.toLowerCase()
    );
    
    if (!selectedContact) {
      alert('Contact not found. Please enter the exact name.');
      return;
    }
    
    // Update opportunity
    const index = this.state.opportunities.findIndex(o => 
      o.id === oppId || o.job === oppId
    );
    
    if (index !== -1) {
      this.state.opportunities[index].contact = `${selectedContact.first} ${selectedContact.last}`;
      
      // Update in mock data too
      if (window.MockData) {
        const mockIndex = MockData.opportunities.findIndex(o => 
          o.id === oppId || o.job === oppId
        );
        if (mockIndex !== -1) {
          MockData.opportunities[mockIndex].contact = `${selectedContact.first} ${selectedContact.last}`;
        }
      }
      
      // Log the change
      await DataService.logChange('Contact Assigned', 
        `Assigned ${selectedContact.first} ${selectedContact.last} to opportunity "${opp.job}"`
      );
      
      // Refresh display
      await this.loadData();
      
      if (window.App) {
        App.showToast('Contact assigned successfully', 'success');
      }
    }
  },

  /**
   * Show add opportunity modal
   */
  showAddOpportunityModal() {
    // Simple prompts for now
    const company = prompt('Company name:');
    if (!company) return;
    
    const location = prompt('Location:');
    if (!location) return;
    
    const job = prompt('Job description:');
    if (!job) return;
    
    const valuation = prompt('Valuation ($):');
    if (!valuation) return;
    
    const startDate = prompt('Start date (YYYY-MM-DD):', 
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    );
    
    this.addOpportunity({
      company,
      location,
      job,
      valuation,
      start: startDate,
      contact: 'New Contact'
    });
  },

  /**
   * Add new opportunity
   */
  async addOpportunity(opportunityData) {
    try {
      // Add to mock data
      const newOpp = {
        id: Utils.generateId(),
        ...opportunityData,
        created_at: new Date().toISOString()
      };
      
      if (window.MockData) {
        MockData.opportunities.push(newOpp);
      }
      
      // Update cache
      DataService.cache.opportunities.push(newOpp);
      
      // Log the change
      await DataService.logChange('Opportunity Added', 
        `Added opportunity: ${opportunityData.job} at ${opportunityData.company}`
      );
      
      // Reload data
      await this.loadData();
      
      if (window.App) {
        App.showToast(`Opportunity "${opportunityData.job}" added successfully`, 'success');
      }
    } catch (error) {
      console.error('Error adding opportunity:', error);
      alert('Error adding opportunity');
    }
  },

  /**
   * Edit opportunity
   */
  async editOpportunity(oppId) {
    const opp = this.state.opportunities.find(o => 
      o.id === oppId || o.job === oppId
    );
    if (!opp) return;
    
    const job = prompt('Job description:', opp.job);
    if (job === null) return;
    
    const valuation = prompt('Valuation:', opp.valuation);
    const start = prompt('Start date:', opp.start);
    
    // Update in state
    const index = this.state.opportunities.findIndex(o => 
      o.id === oppId || o.job === oppId
    );
    
    if (index !== -1) {
      this.state.opportunities[index] = {
        ...this.state.opportunities[index],
        job: job || opp.job,
        valuation: valuation || opp.valuation,
        start: start || opp.start,
        updated_at: new Date().toISOString()
      };
      
      // Update in mock data
      if (window.MockData) {
        const mockIndex = MockData.opportunities.findIndex(o => 
          o.id === oppId || o.job === oppId
        );
        if (mockIndex !== -1) {
          MockData.opportunities[mockIndex] = this.state.opportunities[index];
        }
      }
      
      // Log the change
      await DataService.logChange('Opportunity Updated', 
        `Updated opportunity: ${job || opp.job}`
      );
      
      // Refresh display
      await this.loadData();
      
      if (window.App) {
        App.showToast('Opportunity updated successfully', 'success');
      }
    }
  },

  /**
   * Export opportunities to CSV
   */
  exportToCSV() {
    const data = this.state.filteredOpportunities.map(opp => {
      const company = this.state.companies.find(c => c.name === opp.company);
      
      return {
        'Company': opp.company,
        'Company Tier': company?.tier || '',
        'Location': opp.location,
        'Job Description': opp.job,
        'Contact': opp.contact || '',
        'Start Date': opp.start || '',
        'Valuation': opp.valuation,
        'Valuation (Numeric)': this.parseValuation(opp.valuation)
      };
    });
    
    Utils.exportToCSV(data, `opportunities-${new Date().toISOString().split('T')[0]}.csv`);
    
    if (window.App) {
      App.showToast('Opportunities exported successfully', 'success');
    }
  },

  /**
   * Show error state
   */
  showError() {
    const tbody = document.getElementById('opportunities-table-body');
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="6" class="table-empty">Error loading opportunities</td></tr>';
    }
  },

  /**
   * Refresh component
   */
  async refresh() {
    console.log('🔄 Refreshing Opportunities Component...');
    await this.loadData();
  }
};

// Make available globally
window.OpportunitiesComponent = OpportunitiesComponent;

console.log('💼 Opportunities Component loaded');
