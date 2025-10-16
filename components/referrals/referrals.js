/**
 * Referrals Component
 * Track and manage referrals with follow-up scheduling
 */

const ReferralsComponent = {
  // Component state
  state: {
    referrals: [],
    contacts: [],
    companies: [],
    filteredReferrals: [],
    currentOrg: null,
    filters: {
      search: '',
      status: '',
      overdueOnly: false
    },
    sortColumn: 'followup_date',
    sortDirection: 'asc',
    selectedReferral: null
  },

  /**
   * Initialize referrals component
   */
  async init() {
    console.log('🤝 Referrals Component initializing...');
    
    try {
      // Set current organization
      this.state.currentOrg = VisibilityService.getCurrentOrg();
      
      // Load data
      await this.loadData();
      
      // Setup event listeners
      this.setupEventListeners();
      
      console.log('✅ Referrals Component initialized');
    } catch (error) {
      console.error('Error initializing Referrals Component:', error);
      this.showError();
    }
  },

  /**
   * Load all data from DataService
   */
  async loadData() {
    // Get all data
    const companies = await DataService.getCompanies();
    const contacts = await DataService.getContacts();
    const referrals = await DataService.getReferrals();
    
    // Apply visibility filters
    this.state.companies = VisibilityService.filterCompanies(companies, this.state.currentOrg);
    this.state.contacts = VisibilityService.filterContacts(contacts, companies, this.state.currentOrg);
    this.state.referrals = VisibilityService.filterReferrals(referrals, contacts, companies, this.state.currentOrg);
    
    // Initially, filtered = all
    this.state.filteredReferrals = [...this.state.referrals];
    
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
    const searchInput = document.getElementById('referrals-search');
    if (searchInput) {
      searchInput.addEventListener('input', Utils.debounce((e) => {
        this.state.filters.search = e.target.value.toLowerCase();
        this.applyFilters();
      }, 300));
    }
    
    // Status filter
    const statusFilter = document.getElementById('referral-status-filter');
    if (statusFilter) {
      // Populate status options
      const statuses = CONFIG.referrals.statuses;
      statusFilter.innerHTML = `
        <option value="">All Statuses</option>
        ${statuses.map(s => `<option value="${s.key}">${s.label}</option>`).join('')}
      `;
      
      statusFilter.addEventListener('change', (e) => {
        this.state.filters.status = e.target.value;
        this.applyFilters();
      });
    }
    
    // Overdue filter
    const overdueBtn = document.getElementById('show-overdue-referrals');
    if (overdueBtn) {
      overdueBtn.addEventListener('click', () => {
        this.state.filters.overdueOnly = !this.state.filters.overdueOnly;
        overdueBtn.classList.toggle('btn-primary', this.state.filters.overdueOnly);
        overdueBtn.textContent = this.state.filters.overdueOnly ? 
          'Show All Referrals' : 'Show Overdue Only';
        this.applyFilters();
      });
    }
    
    // Add Referral button
    const addBtn = document.getElementById('add-referral-btn');
    if (addBtn) {
      addBtn.addEventListener('click', () => this.showAddReferralModal());
    }
    
    // Sortable headers
    document.querySelectorAll('th.sortable').forEach(th => {
      th.style.cursor = 'pointer';
      th.addEventListener('click', () => {
        const column = th.dataset.column || 
          th.textContent.toLowerCase().replace(/\s+/g, '_').replace('-', '_');
        this.sortBy(column);
      });
    });
  },

  /**
   * Apply filters to referrals
   */
  applyFilters() {
    let filtered = [...this.state.referrals];
    
    // Apply search filter
    if (this.state.filters.search) {
      const search = this.state.filters.search.toLowerCase();
      filtered = filtered.filter(referral => 
        referral.referred_name?.toLowerCase().includes(search) ||
        referral.company?.toLowerCase().includes(search) ||
        referral.referrer_email?.toLowerCase().includes(search) ||
        referral.status?.toLowerCase().includes(search)
      );
    }
    
    // Apply status filter
    if (this.state.filters.status) {
      filtered = filtered.filter(referral => referral.status === this.state.filters.status);
    }
    
    // Apply overdue filter
    if (this.state.filters.overdueOnly) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      filtered = filtered.filter(referral => {
        if (!referral.followup_date) return false;
        const followupDate = new Date(referral.followup_date);
        return followupDate < today && referral.status !== 'Closed-Won' && referral.status !== 'Closed-Lost';
      });
    }
    
    this.state.filteredReferrals = filtered;
    this.renderTable();
    this.renderStatistics();
  },

  /**
   * Sort referrals by column
   */
  sortBy(column) {
    // Map column names
    const columnMap = {
      'follow_up_date': 'followup_date',
      'referred_person': 'referred_name',
      'referred_by': 'referrer_email'
    };
    
    column = columnMap[column] || column;
    
    // Toggle direction if same column
    if (this.state.sortColumn === column) {
      this.state.sortDirection = this.state.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.state.sortColumn = column;
      this.state.sortDirection = 'asc';
    }
    
    // Sort the filtered referrals
    this.state.filteredReferrals.sort((a, b) => {
      let aVal = a[column];
      let bVal = b[column];
      
      // Handle dates
      if (column === 'followup_date') {
        aVal = aVal ? new Date(aVal).getTime() : Number.MAX_VALUE;
        bVal = bVal ? new Date(bVal).getTime() : Number.MAX_VALUE;
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
        th.textContent.toLowerCase().replace(/\s+/g, '_').replace('-', '_');
      
      // Remove all sort classes
      th.classList.remove('sorted-asc', 'sorted-desc');
      
      // Add current sort class
      if (column === this.state.sortColumn || 
          (column === 'follow_up_date' && this.state.sortColumn === 'followup_date')) {
        th.classList.add(`sorted-${this.state.sortDirection}`);
      }
    });
  },

  /**
   * Render statistics cards
   */
  renderStatistics() {
    // Calculate stats
    const total = this.state.referrals.length;
    const pending = this.state.referrals.filter(r => r.status === 'Pending').length;
    const contacted = this.state.referrals.filter(r => r.status === 'Contacted').length;
    const scheduled = this.state.referrals.filter(r => r.status === 'Meeting Scheduled').length;
    const won = this.state.referrals.filter(r => r.status === 'Closed-Won').length;
    const lost = this.state.referrals.filter(r => r.status === 'Closed-Lost').length;
    
    // Calculate overdue
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const overdue = this.state.referrals.filter(r => {
      if (!r.followup_date) return false;
      if (r.status === 'Closed-Won' || r.status === 'Closed-Lost') return false;
      const followupDate = new Date(r.followup_date);
      return followupDate < today;
    }).length;
    
    // Calculate conversion rate
    const closed = won + lost;
    const conversionRate = closed > 0 ? Math.round((won / closed) * 100) : 0;
    
    // Update stats in DOM if elements exist
    const statsContainer = document.getElementById('referrals-stats');
    if (statsContainer) {
      statsContainer.innerHTML = `
        <div class="card-grid" style="margin-bottom: 20px;">
          <div class="card kpi-card">
            <div class="kpi-value">${total}</div>
            <div class="kpi-label">Total Referrals</div>
          </div>
          <div class="card kpi-card">
            <div class="kpi-value">${pending}</div>
            <div class="kpi-label">Pending</div>
          </div>
          <div class="card kpi-card">
            <div class="kpi-value" style="color: var(--warning-color);">${overdue}</div>
            <div class="kpi-label">Overdue Follow-ups</div>
          </div>
          <div class="card kpi-card">
            <div class="kpi-value" style="color: var(--success-color);">${conversionRate}%</div>
            <div class="kpi-label">Win Rate</div>
          </div>
        </div>
      `;
    }
  },

  /**
   * Render referrals table
   */
  renderTable() {
    const tbody = document.getElementById('referrals-table-body');
    if (!tbody) return;
    
    if (this.state.filteredReferrals.length === 0) {
      const message = this.state.filters.overdueOnly ? 
        'No overdue referrals found' : 'No referrals found';
      tbody.innerHTML = `<tr><td colspan="5" class="table-empty">${message}</td></tr>`;
      return;
    }
    
    // Build table rows
    const rows = this.state.filteredReferrals.map(referral => {
      // Find referrer contact
      const referrer = this.state.contacts.find(c => c.email === referral.referrer_email);
      const referrerName = referrer ? `${referrer.first} ${referrer.last}` : referral.referrer_email;
      
      // Find referrer's company
      const company = referrer ? 
        this.state.companies.find(c => c.normalized === referrer.company) : null;
      
      // Calculate follow-up status
      let followupStatus = '';
      let followupBadge = '';
      let isOverdue = false;
      
      if (referral.followup_date) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const followupDate = new Date(referral.followup_date);
        followupDate.setHours(0, 0, 0, 0);
        
        const daysUntil = Math.floor((followupDate - today) / (1000 * 60 * 60 * 24));
        
        if (referral.status === 'Closed-Won' || referral.status === 'Closed-Lost') {
          followupStatus = '';
        } else if (daysUntil < 0) {
          followupStatus = `${Math.abs(daysUntil)} days overdue`;
          followupBadge = 'badge-error';
          isOverdue = true;
        } else if (daysUntil === 0) {
          followupStatus = 'Due today';
          followupBadge = 'badge-warning';
        } else if (daysUntil <= 3) {
          followupStatus = `Due in ${daysUntil} days`;
          followupBadge = 'badge-warning';
        } else if (daysUntil <= 7) {
          followupStatus = `In ${daysUntil} days`;
          followupBadge = 'badge-info';
        }
      }
      
      // Status badge color
      const statusConfig = CONFIG.referrals.statuses.find(s => s.key === referral.status) || 
                          { color: '#6b7280', label: referral.status };
      
      const statusBadgeColor = {
        'pending': 'badge-secondary',
        'contacted': 'badge-info',
        'meeting-scheduled': 'badge-warning',
        'closed-won': 'badge-success',
        'closed-lost': 'badge-error'
      }[statusConfig.key] || 'badge-secondary';
      
      return `
        <tr class="${isOverdue ? 'overdue' : ''}" data-referral-id="${referral.id || referral.referred_name}">
          <td>
            <div style="display: flex; align-items: center; gap: 8px;">
              <strong style="cursor: pointer; color: var(--primary-color);"
                      onclick="ReferralsComponent.viewReferralDetails('${referral.id || referral.referred_name}')">
                ${referral.referred_name}
              </strong>
              ${isOverdue ? '<span class="badge badge-error" style="font-size: 10px;">Overdue</span>' : ''}
            </div>
            ${referral.referred_title ? `
              <div style="font-size: 11px; color: var(--text-muted);">
                ${referral.referred_title}
              </div>
            ` : ''}
          </td>
          <td>
            <strong>${referral.company}</strong>
            ${referral.referred_email ? `
              <div style="font-size: 11px; color: var(--text-muted);">
                ${referral.referred_email}
              </div>
            ` : ''}
          </td>
          <td>
            <div>${referrerName}</div>
            ${company ? `
              <div style="font-size: 11px; color: var(--text-muted);">
                ${company.name}
              </div>
            ` : ''}
          </td>
          <td>
            ${referral.followup_date ? 
              new Date(referral.followup_date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              }) : '—'}
            ${followupStatus ? `
              <div style="font-size: 11px;">
                <span class="badge ${followupBadge}" style="font-size: 10px;">
                  ${followupStatus}
                </span>
              </div>
            ` : ''}
          </td>
          <td>
            <span class="badge ${statusBadgeColor}">${statusConfig.label}</span>
            ${referral.notes ? `
              <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">
                ${this.truncate(referral.notes, 50)}
              </div>
            ` : ''}
            <div style="margin-top: 4px;">
              <button class="btn btn-xs btn-ghost" 
                      onclick="ReferralsComponent.updateStatus('${referral.id || referral.referred_name}')">
                Update
              </button>
              ${referral.status === 'Pending' || referral.status === 'Contacted' ? `
                <button class="btn btn-xs btn-success" 
                        onclick="ReferralsComponent.scheduleFollowup('${referral.id || referral.referred_name}')">
                  Follow-up
                </button>
              ` : ''}
            </div>
          </td>
        </tr>
      `;
    }).join('');
    
    tbody.innerHTML = rows;
  },

  /**
   * Truncate text
   */
  truncate(text, maxLength) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  },

  /**
   * View referral details
   */
  viewReferralDetails(referralId) {
    const referral = this.state.referrals.find(r => 
      r.id === referralId || r.referred_name === referralId
    );
    if (!referral) return;
    
    const referrer = this.state.contacts.find(c => c.email === referral.referrer_email);
    const referrerName = referrer ? `${referrer.first} ${referrer.last}` : referral.referrer_email;
    
    const details = `
REFERRAL DETAILS

Referred Person: ${referral.referred_name}
Company: ${referral.company}
Email: ${referral.referred_email || 'Not provided'}
Title: ${referral.referred_title || 'Not provided'}

Referred By: ${referrerName}
${referrer ? `From: ${this.state.companies.find(c => c.normalized === referrer.company)?.name || referrer.company}` : ''}

Status: ${referral.status}
Follow-up Date: ${referral.followup_date ? new Date(referral.followup_date).toLocaleDateString() : 'Not set'}

Notes:
${referral.notes || 'No notes added'}

Created: ${referral.created_at ? new Date(referral.created_at).toLocaleDateString() : 'Unknown'}
    `.trim();
    
    alert(details);
  },

  /**
   * Update referral status
   */
  async updateStatus(referralId) {
    const referral = this.state.referrals.find(r => 
      r.id === referralId || r.referred_name === referralId
    );
    if (!referral) return;
    
    const statuses = CONFIG.referrals.statuses.map(s => s.label);
    const newStatus = prompt(`Update status for ${referral.referred_name}\n\nOptions:\n${statuses.join('\n')}`, referral.status);
    
    if (!newStatus) return;
    
    // Find the status key
    const statusConfig = CONFIG.referrals.statuses.find(s => 
      s.label.toLowerCase() === newStatus.toLowerCase()
    );
    
    if (!statusConfig) {
      alert('Invalid status. Please choose from: ' + statuses.join(', '));
      return;
    }
    
    // Update in mock data
    const index = this.state.referrals.findIndex(r => 
      r.id === referralId || r.referred_name === referralId
    );
    
    if (index !== -1) {
      this.state.referrals[index].status = statusConfig.label;
      
      // If closed-won or closed-lost, clear follow-up date
      if (statusConfig.key === 'closed-won' || statusConfig.key === 'closed-lost') {
        this.state.referrals[index].followup_date = null;
      }
      
      // Log the change
      await DataService.logChange('Referral Updated', 
        `Updated ${referral.referred_name} status to ${statusConfig.label}`
      );
      
      // Refresh display
      await this.loadData();
      
      if (window.App) {
        App.showToast(`Referral status updated to ${statusConfig.label}`, 'success');
      }
    }
  },

  /**
   * Schedule follow-up
   */
  async scheduleFollowup(referralId) {
    const referral = this.state.referrals.find(r => 
      r.id === referralId || r.referred_name === referralId
    );
    if (!referral) return;
    
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + CONFIG.referrals.defaultFollowupDays);
    const dateStr = defaultDate.toISOString().split('T')[0];
    
    const followupDate = prompt(`Schedule follow-up for ${referral.referred_name}`, dateStr);
    if (!followupDate) return;
    
    // Update in mock data
    const index = this.state.referrals.findIndex(r => 
      r.id === referralId || r.referred_name === referralId
    );
    
    if (index !== -1) {
      this.state.referrals[index].followup_date = followupDate;
      
      // Log the change
      await DataService.logChange('Follow-up Scheduled', 
        `Scheduled follow-up with ${referral.referred_name} for ${followupDate}`
      );
      
      // Refresh display
      await this.loadData();
      
      if (window.App) {
        App.showToast(`Follow-up scheduled for ${new Date(followupDate).toLocaleDateString()}`, 'success');
      }
    }
  },

  /**
   * Show add referral modal
   */
  showAddReferralModal() {
    // Simple prompts for now
    const referredName = prompt('Referred person\'s name:');
    if (!referredName) return;
    
    const company = prompt('Company:');
    if (!company) return;
    
    const referrerEmail = prompt('Referrer\'s email (from existing contacts):');
    if (!referrerEmail) return;
    
    // Verify referrer exists
    const referrer = this.state.contacts.find(c => 
      c.email.toLowerCase() === referrerEmail.toLowerCase()
    );
    
    if (!referrer) {
      alert('Referrer not found in contacts. Please add them first.');
      return;
    }
    
    const followupDays = prompt('Follow-up in how many days?', CONFIG.referrals.defaultFollowupDays);
    const followupDate = new Date();
    followupDate.setDate(followupDate.getDate() + parseInt(followupDays));
    
    this.addReferral({
      referred_name: referredName,
      company: company,
      referrer_email: referrer.email,
      followup_date: followupDate.toISOString().split('T')[0],
      status: 'Pending'
    });
  },

  /**
   * Add new referral
   */
  async addReferral(referralData) {
    try {
      // Add to mock data
      const newReferral = {
        id: Utils.generateId(),
        ...referralData,
        created_at: new Date().toISOString()
      };
      
      if (window.MockData) {
        MockData.referrals.push(newReferral);
      }
      
      // Update cache
      DataService.cache.referrals.push(newReferral);
      
      // Log the change
      await DataService.logChange('Referral Added', 
        `Added referral: ${referralData.referred_name} at ${referralData.company}`
      );
      
      // Reload data
      await this.loadData();
      
      if (window.App) {
        App.showToast(`Referral "${referralData.referred_name}" added successfully`, 'success');
      }
    } catch (error) {
      console.error('Error adding referral:', error);
      alert('Error adding referral');
    }
  },

  /**
   * Export referrals to CSV
   */
  exportToCSV() {
    const data = this.state.filteredReferrals.map(referral => {
      const referrer = this.state.contacts.find(c => c.email === referral.referrer_email);
      const referrerName = referrer ? `${referrer.first} ${referrer.last}` : referral.referrer_email;
      
      return {
        'Referred Name': referral.referred_name,
        'Company': referral.company,
        'Email': referral.referred_email || '',
        'Title': referral.referred_title || '',
        'Referred By': referrerName,
        'Follow-up Date': referral.followup_date || '',
        'Status': referral.status,
        'Notes': referral.notes || ''
      };
    });
    
    Utils.exportToCSV(data, `referrals-${new Date().toISOString().split('T')[0]}.csv`);
    
    if (window.App) {
      App.showToast('Referrals exported successfully', 'success');
    }
  },

  /**
   * Show error state
   */
  showError() {
    const tbody = document.getElementById('referrals-table-body');
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="5" class="table-empty">Error loading referrals</td></tr>';
    }
  },

  /**
   * Refresh component
   */
  async refresh() {
    console.log('🔄 Refreshing Referrals Component...');
    await this.loadData();
  }
};

// Make available globally
window.ReferralsComponent = ReferralsComponent;

console.log('🤝 Referrals Component loaded');
