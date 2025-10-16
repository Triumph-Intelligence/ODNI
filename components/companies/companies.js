/**
 * Companies Component
 * Manage companies with full CRUD operations
 */

const CompaniesComponent = {
  // Component state
  state: {
    companies: [],
    locations: [],
    contacts: [],
    filteredCompanies: [],
    currentOrg: null,
    filters: {
      search: '',
      tier: '',
      status: ''
    },
    sortColumn: 'name',
    sortDirection: 'asc',
    selectedCompany: null
  },

  /**
   * Initialize companies component
   */
  async init() {
    console.log('🏢 Companies Component initializing...');
    
    try {
      // Set current organization
      this.state.currentOrg = VisibilityService.getCurrentOrg();
      
      // Load data
      await this.loadData();
      
      // Setup event listeners
      this.setupEventListeners();
      
      console.log('✅ Companies Component initialized');
    } catch (error) {
      console.error('Error initializing Companies Component:', error);
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
    
    // Apply visibility filters
    this.state.companies = VisibilityService.filterCompanies(companies, this.state.currentOrg);
    this.state.locations = VisibilityService.filterLocations(locations, companies, this.state.currentOrg);
    this.state.contacts = VisibilityService.filterContacts(contacts, companies, this.state.currentOrg);
    
    // Initially, filtered = all
    this.state.filteredCompanies = [...this.state.companies];
    
    // Apply any existing filters
    this.applyFilters();
    
    // Render table
    this.renderTable();
  },

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Search input
    const searchInput = document.getElementById('companies-search');
    if (searchInput) {
      searchInput.addEventListener('input', Utils.debounce((e) => {
        this.state.filters.search = e.target.value.toLowerCase();
        this.applyFilters();
      }, 300));
    }
    
    // Tier filter
    const tierFilter = document.getElementById('tier-filter');
    if (tierFilter) {
      tierFilter.addEventListener('change', (e) => {
        this.state.filters.tier = e.target.value;
        this.applyFilters();
      });
    }
    
    // Status filter (if exists)
    const statusFilter = document.getElementById('status-filter');
    if (statusFilter) {
      statusFilter.addEventListener('change', (e) => {
        this.state.filters.status = e.target.value;
        this.applyFilters();
      });
    }
    
    // Add Company button
    const addBtn = document.getElementById('add-company-btn');
    if (addBtn) {
      addBtn.addEventListener('click', () => this.showAddCompanyModal());
    }
    
    // Sortable headers
    document.querySelectorAll('#companies-table-body').forEach(tbody => {
      const table = tbody.closest('table');
      if (table) {
        table.querySelectorAll('th.sortable').forEach(th => {
          th.style.cursor = 'pointer';
          th.addEventListener('click', () => {
            const column = th.dataset.column || th.textContent.toLowerCase().replace(/\s+/g, '_');
            this.sortBy(column);
          });
        });
      }
    });
  },

  /**
   * Apply filters to companies
   */
  applyFilters() {
    let filtered = [...this.state.companies];
    
    // Apply search filter
    if (this.state.filters.search) {
      const search = this.state.filters.search.toLowerCase();
      filtered = filtered.filter(company => 
        company.name.toLowerCase().includes(search) ||
        company.hq_state?.toLowerCase().includes(search) ||
        company.tier?.toLowerCase().includes(search) ||
        company.status?.toLowerCase().includes(search)
      );
    }
    
    // Apply tier filter
    if (this.state.filters.tier && this.state.filters.tier !== '') {
      filtered = filtered.filter(company => company.tier === this.state.filters.tier);
    }
    
    // Apply status filter
    if (this.state.filters.status && this.state.filters.status !== '') {
      filtered = filtered.filter(company => company.status === this.state.filters.status);
    }
    
    this.state.filteredCompanies = filtered;
    this.renderTable();
  },

  /**
   * Sort companies by column
   */
  sortBy(column) {
    // Toggle direction if same column
    if (this.state.sortColumn === column) {
      this.state.sortDirection = this.state.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.state.sortColumn = column;
      this.state.sortDirection = 'asc';
    }
    
    // Sort the filtered companies
    this.state.filteredCompanies.sort((a, b) => {
      let aVal = a[column];
      let bVal = b[column];
      
      // Handle special columns
      if (column === 'locations') {
        aVal = this.state.locations.filter(l => l.company === a.normalized).length;
        bVal = this.state.locations.filter(l => l.company === b.normalized).length;
      } else if (column === 'contacts') {
        aVal = this.state.contacts.filter(c => c.company === a.normalized).length;
        bVal = this.state.contacts.filter(c => c.company === b.normalized).length;
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
      const column = th.dataset.column || th.textContent.toLowerCase().replace(/\s+/g, '_');
      
      // Remove all sort classes
      th.classList.remove('sorted-asc', 'sorted-desc');
      
      // Add current sort class
      if (column === this.state.sortColumn) {
        th.classList.add(`sorted-${this.state.sortDirection}`);
      }
    });
  },

  /**
   * Render companies table
   */
  renderTable() {
    const tbody = document.getElementById('companies-table-body');
    if (!tbody) return;
    
    if (this.state.filteredCompanies.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="table-empty">No companies found</td></tr>';
      return;
    }
    
    // Build table rows
    const rows = this.state.filteredCompanies.map(company => {
      // Count locations and contacts
      const locationCount = this.state.locations.filter(l => l.company === company.normalized).length;
      const contactCount = this.state.contacts.filter(c => c.company === company.normalized).length;
      
      // Determine tier badge color
      const tierBadge = {
        'Enterprise': 'badge-primary',
        'Large': 'badge-info',
        'Mid': 'badge-warning',
        'Small': 'badge-secondary'
      }[company.tier] || 'badge-secondary';
      
      // Determine status badge color
      const statusBadge = {
        'Active': 'badge-success',
        'Prospect': 'badge-warning',
        'Inactive': 'badge-secondary'
      }[company.status] || 'badge-secondary';
      
      // Check contractor coverage
      const contractors = company.contractors || {};
      const contractorCount = Object.values(contractors).filter(c => c).length;
      const hasCoverage = contractorCount > 0;
      
      return `
        <tr class="company-row" data-company-id="${company.normalized}">
          <td>
            <div style="display: flex; align-items: center; gap: 8px;">
              <strong style="cursor: pointer; color: var(--primary-color);" 
                      onclick="CompaniesComponent.viewCompanyDetails('${company.normalized}')">
                ${company.name}
              </strong>
              ${hasCoverage ? `
                <span class="badge badge-info" style="font-size: 10px;">
                  ${contractorCount} contractors
                </span>
              ` : ''}
            </div>
            ${Object.entries(contractors).filter(([k, v]) => v).length > 0 ? `
              <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">
                ${Object.entries(contractors)
                  .filter(([k, v]) => v)
                  .map(([type, contractor]) => {
                    const icon = {
                      electrical: '⚡',
                      mechanical: '🔧',
                      interior_gc: '🏗️',
                      marketing: '📢',
                      staffing: '👥'
                    }[type] || '';
                    return `${icon} ${contractor}`;
                  })
                  .slice(0, 3)
                  .join(' • ')}
                ${Object.entries(contractors).filter(([k, v]) => v).length > 3 ? '...' : ''}
              </div>
            ` : ''}
          </td>
          <td>
            <span class="badge ${tierBadge}">${company.tier}</span>
          </td>
          <td>
            <span class="badge ${statusBadge}">${company.status}</span>
          </td>
          <td>${company.hq_state || '—'}</td>
          <td>
            <strong>${locationCount}</strong>
            ${locationCount > 0 ? `
              <div style="font-size: 11px; color: var(--text-muted);">
                ${this.state.locations
                  .filter(l => l.company === company.normalized)
                  .slice(0, 2)
                  .map(l => l.city)
                  .join(', ')}
                ${locationCount > 2 ? ` +${locationCount - 2}` : ''}
              </div>
            ` : ''}
          </td>
          <td>
            <strong>${contactCount}</strong>
            ${contactCount > 0 ? `
              <div style="font-size: 11px; color: var(--text-muted);">
                ${this.state.contacts
                  .filter(c => c.company === company.normalized)
                  .slice(0, 2)
                  .map(c => `${c.first} ${c.last}`)
                  .join(', ')}
                ${contactCount > 2 ? ` +${contactCount - 2}` : ''}
              </div>
            ` : ''}
          </td>
        </tr>
      `;
    }).join('');
    
    tbody.innerHTML = rows;
  },

  /**
   * View company details (navigate or show modal)
   */
  viewCompanyDetails(companyId) {
    const company = this.state.companies.find(c => c.normalized === companyId);
    if (!company) return;
    
    console.log('View company details:', company);
    
    // Here you could:
    // 1. Navigate to a company detail page
    // 2. Show a modal with details
    // 3. Expand inline details
    
    // For now, show an alert with basic info
    const locations = this.state.locations.filter(l => l.company === company.normalized);
    const contacts = this.state.contacts.filter(c => c.company === company.normalized);
    
    alert(`
Company: ${company.name}
Tier: ${company.tier}
Status: ${company.status}
HQ State: ${company.hq_state || 'N/A'}

Locations: ${locations.length}
${locations.map(l => `  • ${l.name} - ${l.city}, ${l.state}`).join('\n')}

Contacts: ${contacts.length}
${contacts.map(c => `  • ${c.first} ${c.last} - ${c.title}`).join('\n')}

Contractors:
  Electrical: ${company.contractors?.electrical || 'None'}
  Mechanical: ${company.contractors?.mechanical || 'None'}
  Interior GC: ${company.contractors?.interior_gc || 'None'}
  Marketing: ${company.contractors?.marketing || 'None'}
  Staffing: ${company.contractors?.staffing || 'None'}
    `.trim());
  },

  /**
   * Show add company modal
   */
  showAddCompanyModal() {
    // Create a simple prompt for now
    // In production, you'd show a proper modal
    const name = prompt('Enter company name:');
    if (!name) return;
    
    const tier = prompt('Enter tier (Enterprise/Large/Mid/Small):') || 'Mid';
    const status = prompt('Enter status (Active/Prospect/Inactive):') || 'Prospect';
    const hqState = prompt('Enter HQ state (2-letter code):') || '';
    
    this.addCompany({
      name,
      tier,
      status,
      hq_state: hqState
    });
  },

  /**
   * Add new company
   */
  async addCompany(companyData) {
    try {
      // Only Triumph Atlantic can add companies
      if (!VisibilityService.isOversight()) {
        alert('Only Triumph Atlantic users can add companies');
        return;
      }
      
      // Create company
      const result = await DataService.createCompany(companyData);
      
      if (result.success) {
        // Reload data
        await this.loadData();
        
        if (window.App) {
          App.showToast(`Company "${companyData.name}" added successfully`, 'success');
        }
      } else {
        alert('Failed to add company: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error adding company:', error);
      alert('Error adding company');
    }
  },

  /**
   * Edit company
   */
  async editCompany(companyId) {
    const company = this.state.companies.find(c => c.normalized === companyId);
    if (!company) return;
    
    // Only Triumph Atlantic can edit companies
    if (!VisibilityService.isOversight()) {
      alert('Only Triumph Atlantic users can edit companies');
      return;
    }
    
    // Simple prompts for now
    const name = prompt('Company name:', company.name);
    if (name === null) return;
    
    const tier = prompt('Tier:', company.tier);
    const status = prompt('Status:', company.status);
    const hqState = prompt('HQ State:', company.hq_state);
    
    try {
      const result = await DataService.updateCompany(companyId, {
        name: name || company.name,
        tier: tier || company.tier,
        status: status || company.status,
        hq_state: hqState || company.hq_state
      });
      
      if (result.success) {
        await this.loadData();
        if (window.App) {
          App.showToast('Company updated successfully', 'success');
        }
      }
    } catch (error) {
      console.error('Error updating company:', error);
      alert('Error updating company');
    }
  },

  /**
   * Export companies to CSV
   */
  exportToCSV() {
    const data = this.state.filteredCompanies.map(company => {
      const locationCount = this.state.locations.filter(l => l.company === company.normalized).length;
      const contactCount = this.state.contacts.filter(c => c.company === company.normalized).length;
      
      return {
        'Company Name': company.name,
        'Tier': company.tier,
        'Status': company.status,
        'HQ State': company.hq_state || '',
        'Locations': locationCount,
        'Contacts': contactCount,
        'Electrical': company.contractors?.electrical || '',
        'Mechanical': company.contractors?.mechanical || '',
        'Interior GC': company.contractors?.interior_gc || '',
        'Marketing': company.contractors?.marketing || '',
        'Staffing': company.contractors?.staffing || ''
      };
    });
    
    Utils.exportToCSV(data, `companies-${new Date().toISOString().split('T')[0]}.csv`);
    
    if (window.App) {
      App.showToast('Companies exported successfully', 'success');
    }
  },

  /**
   * Show error state
   */
  showError() {
    const tbody = document.getElementById('companies-table-body');
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="6" class="table-empty">Error loading companies</td></tr>';
    }
  },

  /**
   * Refresh component
   */
  async refresh() {
    console.log('🔄 Refreshing Companies Component...');
    await this.loadData();
  }
};

// Make available globally
window.CompaniesComponent = CompaniesComponent;

console.log('🏢 Companies Component loaded');
