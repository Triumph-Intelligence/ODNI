/**
 * Contacts Component
 * Manage contacts and gift tracking with cadence management
 */

const ContactsComponent = {
  // Component state
  state: {
    contacts: [],
    companies: [],
    locations: [],
    gifts: [],
    filteredContacts: [],
    currentOrg: null,
    filters: {
      search: '',
      company: '',
      showOverdueOnly: false,
      channel: ''
    },
    sortColumn: 'last_contacted',
    sortDirection: 'desc',
    selectedContact: null
  },

  /**
   * Initialize contacts component
   */
  async init() {
    console.log('👥 Contacts Component initializing...');
    
    try {
      // Set current organization
      this.state.currentOrg = VisibilityService.getCurrentOrg();
      
      // Load data
      await this.loadData();
      
      // Setup event listeners
      this.setupEventListeners();
      
      console.log('✅ Contacts Component initialized');
    } catch (error) {
      console.error('Error initializing Contacts Component:', error);
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
    
    // Initially, filtered = all
    this.state.filteredContacts = [...this.state.contacts];
    
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
    const searchInput = document.getElementById('contacts-search');
    if (searchInput) {
      searchInput.addEventListener('input', Utils.debounce((e) => {
        this.state.filters.search = e.target.value.toLowerCase();
        this.applyFilters();
      }, 300));
    }
    
    // Show overdue only button
    const showOverdueBtn = document.getElementById('show-overdue-btn');
    if (showOverdueBtn) {
      showOverdueBtn.addEventListener('click', () => {
        this.state.filters.showOverdueOnly = !this.state.filters.showOverdueOnly;
        showOverdueBtn.classList.toggle('btn-primary', this.state.filters.showOverdueOnly);
        showOverdueBtn.textContent = this.state.filters.showOverdueOnly ? 
          'Show All Contacts' : 'Show Overdue Only';
        this.applyFilters();
      });
    }
    
    // Add Contact button
    const addBtn = document.getElementById('add-contact-btn');
    if (addBtn) {
      addBtn.addEventListener('click', () => this.showAddContactModal());
    }
    
    // Company filter (if exists)
    const companyFilter = document.getElementById('company-filter');
    if (companyFilter) {
      companyFilter.addEventListener('change', (e) => {
        this.state.filters.company = e.target.value;
        this.applyFilters();
      });
    }
    
    // Channel filter (if exists)
    const channelFilter = document.getElementById('channel-filter');
    if (channelFilter) {
      channelFilter.addEventListener('change', (e) => {
        this.state.filters.channel = e.target.value;
        this.applyFilters();
      });
    }
    
    // Sortable headers
    document.querySelectorAll('th.sortable').forEach(th => {
      th.style.cursor = 'pointer';
      th.addEventListener('click', () => {
        const column = th.dataset.column || th.textContent.toLowerCase().replace(/\s+/g, '_');
        this.sortBy(column);
      });
    });
  },

  /**
   * Calculate if contact is overdue
   */
  isContactOverdue(contact) {
    if (!contact.last_contacted || !contact.cadence) return false;
    
    const lastDate = new Date(contact.last_contacted);
    const today = new Date();
    const daysSince = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
    
    return daysSince > contact.cadence;
  },

  /**
   * Calculate next touch date
   */
  calculateNextTouch(contact) {
    if (!contact.last_contacted || !contact.cadence) return null;
    
    const lastDate = new Date(contact.last_contacted);
    const nextDate = new Date(lastDate.getTime() + (contact.cadence * 24 * 60 * 60 * 1000));
    
    return nextDate;
  },

  /**
   * Apply filters to contacts
   */
  applyFilters() {
    let filtered = [...this.state.contacts];
    
    // Apply search filter
    if (this.state.filters.search) {
      const search = this.state.filters.search.toLowerCase();
      filtered = filtered.filter(contact => 
        `${contact.first} ${contact.last}`.toLowerCase().includes(search) ||
        contact.email?.toLowerCase().includes(search) ||
        contact.title?.toLowerCase().includes(search) ||
        contact.company?.toLowerCase().includes(search) ||
        contact.location?.toLowerCase().includes(search)
      );
    }
    
    // Apply company filter
    if (this.state.filters.company) {
      filtered = filtered.filter(contact => contact.company === this.state.filters.company);
    }
    
    // Apply channel filter
    if (this.state.filters.channel) {
      filtered = filtered.filter(contact => contact.channel === this.state.filters.channel);
    }
    
    // Apply overdue filter
    if (this.state.filters.showOverdueOnly) {
      filtered = filtered.filter(contact => this.isContactOverdue(contact));
    }
    
    this.state.filteredContacts = filtered;
    this.renderTable();
  },

  /**
   * Sort contacts by column
   */
  sortBy(column) {
    // Toggle direction if same column
    if (this.state.sortColumn === column) {
      this.state.sortDirection = this.state.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.state.sortColumn = column;
      this.state.sortDirection = 'asc';
    }
    
    // Sort the filtered contacts
    this.state.filteredContacts.sort((a, b) => {
      let aVal, bVal;
      
      // Handle special columns
      if (column === 'name') {
        aVal = `${a.first} ${a.last}`;
        bVal = `${b.first} ${b.last}`;
      } else if (column === 'next_touch_due') {
        aVal = this.calculateNextTouch(a);
        bVal = this.calculateNextTouch(b);
        aVal = aVal ? aVal.getTime() : Number.MAX_VALUE;
        bVal = bVal ? bVal.getTime() : Number.MAX_VALUE;
      } else {
        aVal = a[column];
        bVal = b[column];
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
   * Render contacts table
   */
  renderTable() {
    const tbody = document.getElementById('contacts-table-body');
    if (!tbody) return;
    
    if (this.state.filteredContacts.length === 0) {
      const message = this.state.filters.showOverdueOnly ? 
        'No overdue contacts found' : 'No contacts found';
      tbody.innerHTML = `<tr><td colspan="8" class="table-empty">${message}</td></tr>`;
      return;
    }
    
    // Build table rows
    const rows = this.state.filteredContacts.map(contact => {
      // Calculate overdue status
      const isOverdue = this.isContactOverdue(contact);
      const nextTouch = this.calculateNextTouch(contact);
      const nextTouchStr = nextTouch ? nextTouch.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      }) : '—';
      
      // Days until/since next touch
      let touchStatus = '';
      let touchBadge = '';
      
      if (nextTouch) {
        const today = new Date();
        const daysUntil = Math.floor((nextTouch - today) / (1000 * 60 * 60 * 24));
        
        if (daysUntil < -30) {
          touchStatus = `${Math.abs(daysUntil)} days overdue`;
          touchBadge = 'badge-error';
        } else if (daysUntil < 0) {
          touchStatus = `${Math.abs(daysUntil)} days overdue`;
          touchBadge = 'badge-warning';
        } else if (daysUntil === 0) {
          touchStatus = 'Due today';
          touchBadge = 'badge-warning';
        } else if (daysUntil <= 7) {
          touchStatus = `Due in ${daysUntil} days`;
          touchBadge = 'badge-info';
        } else {
          touchStatus = `In ${daysUntil} days`;
          touchBadge = '';
        }
      }
      
      // Find last gift
      const contactGifts = this.state.gifts.filter(g => 
        g.contact_email === contact.email
      );
      const lastGift = contactGifts.sort((a, b) => 
        new Date(b.date) - new Date(a.date)
      )[0];
      
      // Channel icon
      const channelIcon = {
        'email': '📧',
        'phone': '☎️',
        'linkedin': '💼',
        'in-person': '🤝'
      }[contact.channel] || '📬';
      
      // Company badge color
      const company = this.state.companies.find(c => c.normalized === contact.company);
      const companyTier = company?.tier || '';
      
      return `
        <tr class="${isOverdue ? 'overdue' : ''}" data-contact-id="${contact.email}">
          <td>
            <div style="display: flex; align-items: center; gap: 8px;">
              <strong style="cursor: pointer; color: var(--primary-color);" 
                      onclick="ContactsComponent.viewContactDetails('${contact.email}')">
                ${contact.first} ${contact.last}
              </strong>
              ${isOverdue ? '<span class="badge badge-error" style="font-size: 10px;">Overdue</span>' : ''}
            </div>
            ${contact.email ? `
              <div style="font-size: 11px; color: var(--text-muted);">
                ${contact.email}
              </div>
            ` : ''}
          </td>
          <td>
            ${contact.title || '—'}
            ${contact.phone ? `
              <div style="font-size: 11px; color: var(--text-muted);">
                ${contact.phone}
              </div>
            ` : ''}
          </td>
          <td>
            <strong>${company?.name || contact.company}</strong>
            ${companyTier ? `
              <div style="font-size: 11px; color: var(--text-muted);">
                ${companyTier}
              </div>
            ` : ''}
          </td>
          <td>${contact.location || '—'}</td>
          <td>
            <span title="${contact.channel || 'Not set'}">
              ${channelIcon} ${contact.channel || '—'}
            </span>
            ${contact.cadence ? `
              <div style="font-size: 11px; color: var(--text-muted);">
                Every ${contact.cadence} days
              </div>
            ` : ''}
          </td>
          <td>
            ${contact.last_contacted || '—'}
            ${contact.last_contacted ? `
              <div style="font-size: 11px; color: var(--text-muted);">
                ${this.getRelativeTime(contact.last_contacted)}
              </div>
            ` : ''}
          </td>
          <td>
            ${nextTouchStr}
            ${touchStatus ? `
              <div style="font-size: 11px;">
                <span class="badge ${touchBadge}" style="font-size: 10px;">
                  ${touchStatus}
                </span>
              </div>
            ` : ''}
          </td>
          <td>
            ${lastGift ? `
              <div>
                ${lastGift.description}
                <div style="font-size: 11px; color: var(--text-muted);">
                  $${lastGift.value} • ${new Date(lastGift.date).toLocaleDateString()}
                </div>
              </div>
            ` : contact.last_gift || '—'}
            ${contactGifts.length > 1 ? `
              <div style="font-size: 11px; color: var(--primary-color); cursor: pointer;"
                   onclick="ContactsComponent.viewGiftHistory('${contact.email}')">
                View ${contactGifts.length} gifts →
              </div>
            ` : ''}
          </td>
        </tr>
      `;
    }).join('');
    
    tbody.innerHTML = rows;
  },

  /**
   * Get relative time string
   */
  getRelativeTime(dateStr) {
    if (!dateStr) return '';
    
    const date = new Date(dateStr);
    const now = new Date();
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
    return `${Math.floor(diffInDays / 365)} years ago`;
  },

  /**
   * View contact details
   */
  viewContactDetails(contactEmail) {
    const contact = this.state.contacts.find(c => c.email === contactEmail);
    if (!contact) return;
    
    const company = this.state.companies.find(c => c.normalized === contact.company);
    const gifts = this.state.gifts.filter(g => g.contact_email === contact.email);
    
    const details = `
Contact: ${contact.first} ${contact.last}
Email: ${contact.email}
Phone: ${contact.phone || 'N/A'}
Title: ${contact.title || 'N/A'}

Company: ${company?.name || contact.company}
Location: ${contact.location || 'N/A'}

Communication:
  Channel: ${contact.channel || 'Not set'}
  Cadence: Every ${contact.cadence || 'N/A'} days
  Last Contacted: ${contact.last_contacted || 'Never'}
  Next Touch: ${this.calculateNextTouch(contact)?.toLocaleDateString() || 'N/A'}

Gift History (${gifts.length}):
${gifts.map(g => `  • ${g.description} - $${g.value} (${new Date(g.date).toLocaleDateString()})`).join('\n') || '  No gifts recorded'}

Total Gift Value: $${gifts.reduce((sum, g) => sum + g.value, 0)}
    `.trim();
    
    alert(details);
  },

  /**
   * View gift history
   */
  viewGiftHistory(contactEmail) {
    const contact = this.state.contacts.find(c => c.email === contactEmail);
    const gifts = this.state.gifts.filter(g => g.contact_email === contactEmail);
    
    if (gifts.length === 0) {
      alert('No gifts recorded for this contact');
      return;
    }
    
    const total = gifts.reduce((sum, g) => sum + g.value, 0);
    
    const history = `
Gift History for ${contact.first} ${contact.last}

${gifts.sort((a, b) => new Date(b.date) - new Date(a.date))
  .map(g => `• ${g.description}
  Amount: $${g.value}
  Date: ${new Date(g.date).toLocaleDateString()}`)
  .join('\n\n')}

Total Gifts: ${gifts.length}
Total Value: $${total}
Average Gift: $${Math.round(total / gifts.length)}
    `.trim();
    
    alert(history);
  },

  /**
   * Show add contact modal
   */
  showAddContactModal() {
    // Simple prompts for now
    const first = prompt('First name:');
    if (!first) return;
    
    const last = prompt('Last name:');
    if (!last) return;
    
    const email = prompt('Email address:');
    if (!email) return;
    
    const company = prompt('Company (from existing companies):');
    const title = prompt('Title:');
    const phone = prompt('Phone number:');
    const location = prompt('Location:');
    const cadence = prompt('Touch cadence (days):', '30');
    const channel = prompt('Preferred channel (email/phone/linkedin/in-person):', 'email');
    
    this.addContact({
      first,
      last,
      email,
      company,
      title,
      phone,
      location,
      cadence: parseInt(cadence) || 30,
      channel
    });
  },

  /**
   * Add new contact
   */
  async addContact(contactData) {
    try {
      // Normalize company name
      const company = this.state.companies.find(c => 
        c.name.toLowerCase() === contactData.company?.toLowerCase()
      );
      
      if (company) {
        contactData.company = company.normalized;
      }
      
      // Create contact
      const result = await DataService.createContact(contactData);
      
      if (result.success) {
        // Reload data
        await this.loadData();
        
        if (window.App) {
          App.showToast(`Contact "${contactData.first} ${contactData.last}" added successfully`, 'success');
        }
      } else {
        alert('Failed to add contact: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error adding contact:', error);
      alert('Error adding contact');
    }
  },

  /**
   * Log activity (contact touch)
   */
  async logActivity(contactEmail, activityType = 'email') {
    try {
      const contact = this.state.contacts.find(c => c.email === contactEmail);
      if (!contact) return;
      
      // Update last contacted date
      const result = await DataService.updateContact(contactEmail, {
        last_contacted: new Date().toISOString().split('T')[0],
        channel: activityType
      });
      
      if (result.success) {
        await this.loadData();
        if (window.App) {
          App.showToast(`Activity logged for ${contact.first} ${contact.last}`, 'success');
        }
      }
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  },

  /**
   * Add gift
   */
  async addGift(contactEmail) {
    const contact = this.state.contacts.find(c => c.email === contactEmail);
    if (!contact) return;
    
    const description = prompt('Gift description:');
    if (!description) return;
    
    const value = prompt('Gift value ($):');
    if (!value) return;
    
    try {
      const result = await DataService.createGift({
        contact_email: contactEmail,
        description,
        value: parseFloat(value) || 0,
        date: new Date().toISOString().split('T')[0]
      });
      
      if (result.success) {
        await this.loadData();
        if (window.App) {
          App.showToast(`Gift recorded for ${contact.first} ${contact.last}`, 'success');
        }
      }
    } catch (error) {
      console.error('Error adding gift:', error);
      alert('Error adding gift');
    }
  },

  /**
   * Export contacts to CSV
   */
  exportToCSV() {
    const data = this.state.filteredContacts.map(contact => {
      const company = this.state.companies.find(c => c.normalized === contact.company);
      const nextTouch = this.calculateNextTouch(contact);
      const gifts = this.state.gifts.filter(g => g.contact_email === contact.email);
      
      return {
        'First Name': contact.first,
        'Last Name': contact.last,
        'Email': contact.email,
        'Phone': contact.phone || '',
        'Title': contact.title || '',
        'Company': company?.name || contact.company,
        'Location': contact.location || '',
        'Channel': contact.channel || '',
        'Cadence (Days)': contact.cadence || '',
        'Last Contacted': contact.last_contacted || '',
        'Next Touch Due': nextTouch?.toLocaleDateString() || '',
        'Total Gifts': gifts.length,
        'Total Gift Value': gifts.reduce((sum, g) => sum + g.value, 0)
      };
    });
    
    Utils.exportToCSV(data, `contacts-${new Date().toISOString().split('T')[0]}.csv`);
    
    if (window.App) {
      App.showToast('Contacts exported successfully', 'success');
    }
  },

  /**
   * Show error state
   */
  showError() {
    const tbody = document.getElementById('contacts-table-body');
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="8" class="table-empty">Error loading contacts</td></tr>';
    }
  },

  /**
   * Refresh component
   */
  async refresh() {
    console.log('🔄 Refreshing Contacts Component...');
    await this.loadData();
  }
};

// Make available globally
window.ContactsComponent = ContactsComponent;

console.log('👥 Contacts Component loaded');
