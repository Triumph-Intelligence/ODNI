/**
 * Intelligence Component
 * Office of National Intelligence - Strategic insights, contractor performance, and opportunity analysis
 */

const IntelligenceComponent = {
  // Component state
  state: {
    companies: [],
    locations: [],
    contacts: [],
    projects: [],
    gifts: [],
    currentOrg: null,
    filters: {
      search: '',
      contractor: 'all',
      specialty: 'all'
    }
  },

  /**
   * Initialize intelligence component
   */
  async init() {
    console.log('🕵️ Intelligence Component initializing...');
    
    try {
      this.state.currentOrg = VisibilityService.getCurrentOrg();
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
    const companies = await DataService.getCompanies();
    const locations = await DataService.getLocations();
    const contacts = await DataService.getContacts();
    const projects = await DataService.getProjects();
    const gifts = await DataService.getGifts();
    
    // Apply visibility filters
    this.state.companies = VisibilityService.filterCompanies(companies, this.state.currentOrg);
    this.state.locations = VisibilityService.filterLocations(locations, companies, this.state.currentOrg);
    this.state.contacts = VisibilityService.filterContacts(contacts, companies, this.state.currentOrg);
    this.state.projects = VisibilityService.filterProjects(projects, companies, this.state.currentOrg);
    this.state.gifts = VisibilityService.filterGifts(gifts, contacts, companies, this.state.currentOrg);
    
    // Render all sections
    this.renderSummary();
    this.renderContractorPerformance();
    this.renderOpportunityMatrix();
    this.renderLocationIntelligence();
  },

  /**
   * Get project specialty (same logic as Company Matrix)
   */
  getProjectSpecialty(project) {
    const raw = (project.specialty || project.trade || project.category || '').toString().toLowerCase().trim();
    if (raw) return raw;

    const job = (project.job || '').toString().toLowerCase();
    if (/(electrical|panel|lighting|switchgear|transformer|breaker|feeder|conduit|power)/.test(job)) return 'electrical';
    if (/(mechanical|hvac|air handler|chiller|boiler|duct|vav|rtu|cooling|heating)/.test(job)) return 'mechanical';
    if (/(interior|fit[-\s]?out|fitout|tenant|build[-\s]?out|gc\b|general contractor)/.test(job)) return 'interior_gc';
    if (/(marketing|brand|signage|campaign|promo)/.test(job)) return 'marketing';
    if (/(staffing|temp labor|labor hire|recruit)/.test(job)) return 'staffing';
    return '';
  },

  /**
   * Format specialty name
   */
  formatSpecialty(spec) {
    const names = {
      'electrical': 'Electrical',
      'mechanical': 'Mechanical',
      'interior_gc': 'Interior GC',
      'marketing': 'Marketing',
      'staffing': 'Staffing'
    };
    return names[(spec || '').toLowerCase()] || spec;
  },

  /**
   * Parse project valuation
   */
  parseValuation(valuation) {
    if (!valuation) return 0;
    if (typeof valuation === 'number') return valuation;
    const cleaned = valuation.toString().replace(/[$,]/g, '');
    if (/k$/i.test(cleaned)) return parseFloat(cleaned) * 1000;
    if (/m$/i.test(cleaned)) return parseFloat(cleaned) * 1000000;
    const n = parseFloat(cleaned);
    return isNaN(n) ? 0 : n;
  },

  /**
   * Format currency
   */
  formatCurrency(amount) {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${Math.round(amount / 1000)}K`;
    return `$${Math.round(amount)}`;
  },

  /**
   * Render Intelligence Summary KPIs
   */
  renderSummary() {
    // Calculate total project value
    const totalValue = this.state.projects.reduce((sum, p) => sum + this.parseValuation(p.valuation), 0);
    
    // Count active contractors (unique)
    const activeContractors = new Set();
    this.state.projects.forEach(p => {
      const contractor = p.contractor || p.vendor || p.subcontractor;
      if (contractor) activeContractors.add(contractor);
    });
    
    // Count introduction opportunities
    const introOpportunities = this.calculateIntroductionOpportunities();
    
    // Calculate average project value
    const avgProjectValue = this.state.projects.length > 0 ? totalValue / this.state.projects.length : 0;
    
    // Update DOM
    const totalValueEl = document.getElementById('intel-total-value');
    const activeContractorsEl = document.getElementById('intel-active-contractors');
    const introOppsEl = document.getElementById('intel-intro-opps');
    const avgProjectEl = document.getElementById('intel-avg-project');
    
    if (totalValueEl) totalValueEl.textContent = this.formatCurrency(totalValue);
    if (activeContractorsEl) activeContractorsEl.textContent = activeContractors.size;
    if (introOppsEl) introOppsEl.textContent = introOpportunities;
    if (avgProjectEl) avgProjectEl.textContent = this.formatCurrency(avgProjectValue);
  },

  /**
   * Calculate introduction opportunities
   */
  calculateIntroductionOpportunities() {
    const opportunities = new Map(); // contractor pair -> count
    
    // Group projects by company
    const projectsByCompany = {};
    this.state.projects.forEach(p => {
      if (!projectsByCompany[p.company]) projectsByCompany[p.company] = [];
      projectsByCompany[p.company].push(p);
    });
    
    // For each company, find contractor pairs in different specialties
    let totalOpps = 0;
    Object.values(projectsByCompany).forEach(companyProjects => {
      const contractorsBySpec = {};
      
      companyProjects.forEach(p => {
        const spec = this.getProjectSpecialty(p);
        const contractor = p.contractor || p.vendor || p.subcontractor;
        if (spec && contractor) {
          if (!contractorsBySpec[spec]) contractorsBySpec[spec] = new Set();
          contractorsBySpec[spec].add(contractor);
        }
      });
      
      // Count potential intros between different specialties
      const specs = Object.keys(contractorsBySpec);
      for (let i = 0; i < specs.length; i++) {
        for (let j = i + 1; j < specs.length; j++) {
          const contractorsA = Array.from(contractorsBySpec[specs[i]]);
          const contractorsB = Array.from(contractorsBySpec[specs[j]]);
          totalOpps += contractorsA.length * contractorsB.length;
        }
      }
    });
    
    return totalOpps;
  },

  /**
   * Render Contractor Performance Analysis
   */
  renderContractorPerformance() {
    const tbody = document.getElementById('intel-contractor-body');
    if (!tbody) return;
    
    // Build contractor performance metrics
    const contractorMetrics = new Map();
    
    this.state.projects.forEach(project => {
      const contractor = project.contractor || project.vendor || project.subcontractor;
      if (!contractor) return;
      
      if (!contractorMetrics.has(contractor)) {
        contractorMetrics.set(contractor, {
          name: contractor,
          projects: [],
          clients: new Set(),
          specialties: new Set(),
          totalValue: 0,
          locations: new Set()
        });
      }
      
      const metrics = contractorMetrics.get(contractor);
      metrics.projects.push(project);
      metrics.clients.add(project.company);
      const spec = this.getProjectSpecialty(project);
      if (spec) metrics.specialties.add(spec);
      metrics.totalValue += this.parseValuation(project.valuation);
      metrics.locations.add(`${project.company}|${project.location}`);
    });
    
    // Convert to array and sort by total value
    const contractors = Array.from(contractorMetrics.values())
      .sort((a, b) => b.totalValue - a.totalValue);
    
    if (contractors.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="table-empty">No contractor data found</td></tr>';
      return;
    }
    
    const rows = contractors.map(contractor => {
      const avgProjectValue = contractor.totalValue / contractor.projects.length;
      const maintenanceProjects = contractor.projects.filter(p => 
        (p.projectType || '').toLowerCase().includes('maintenance')
      ).length;
      
      return `
        <tr style="cursor: pointer;" onclick="IntelligenceComponent.showContractorDetails('${contractor.name}')">
          <td>
            <strong style="color: var(--primary-color);">${contractor.name}</strong>
            <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">
              ${Array.from(contractor.specialties).map(s => this.formatSpecialty(s)).join(', ')}
            </div>
          </td>
          <td style="text-align: center;">
            <strong>${contractor.clients.size}</strong>
            <div style="font-size: 11px; color: var(--text-muted);">clients</div>
          </td>
          <td style="text-align: center;">
            <strong>${contractor.locations.size}</strong>
            <div style="font-size: 11px; color: var(--text-muted);">locations</div>
          </td>
          <td style="text-align: center;">
            <strong>${contractor.projects.length}</strong>
            <div style="font-size: 11px; color: var(--text-muted);">projects</div>
          </td>
          <td style="text-align: right;">
            <strong style="color: var(--success-color);">${this.formatCurrency(contractor.totalValue)}</strong>
            <div style="font-size: 11px; color: var(--text-muted);">total value</div>
          </td>
          <td style="text-align: right;">
            <strong>${this.formatCurrency(avgProjectValue)}</strong>
            <div style="font-size: 11px; color: var(--text-muted);">avg project</div>
          </td>
          <td style="text-align: center;">
            ${maintenanceProjects > 0 ? `
              <span class="badge badge-success">${maintenanceProjects} Maintenance</span>
            ` : `
              <span class="badge badge-secondary">Capital Only</span>
            `}
          </td>
        </tr>
      `;
    }).join('');
    
    tbody.innerHTML = rows;
  },

  /**
   * Show detailed contractor modal
   */
  showContractorDetails(contractorName) {
    const contractorProjects = this.state.projects.filter(p => 
      (p.contractor || p.vendor || p.subcontractor) === contractorName
    );
    
    if (contractorProjects.length === 0) return;
    
    // Group by client
    const byClient = {};
    contractorProjects.forEach(p => {
      if (!byClient[p.company]) byClient[p.company] = [];
      byClient[p.company].push(p);
    });
    
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop active';
    modal.innerHTML = `
      <div class="modal active" style="max-width: 900px; width: 90%; max-height: 90vh;">
        <div class="modal-header">
          <h3 class="modal-title">Contractor Intelligence: ${contractorName}</h3>
          <button class="modal-close" onclick="this.closest('.modal-backdrop').remove()">&times;</button>
        </div>
        <div class="modal-body" style="max-height: 70vh; overflow-y: auto;">
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 20px;">
            <div class="card" style="padding: 16px; text-align: center;">
              <div style="font-size: 24px; font-weight: bold; color: var(--primary-color);">${Object.keys(byClient).length}</div>
              <div style="font-size: 12px; color: var(--text-muted);">Clients</div>
            </div>
            <div class="card" style="padding: 16px; text-align: center;">
              <div style="font-size: 24px; font-weight: bold; color: var(--success-color);">${contractorProjects.length}</div>
              <div style="font-size: 12px; color: var(--text-muted);">Projects</div>
            </div>
            <div class="card" style="padding: 16px; text-align: center;">
              <div style="font-size: 24px; font-weight: bold; color: var(--success-color);">
                ${this.formatCurrency(contractorProjects.reduce((s, p) => s + this.parseValuation(p.valuation), 0))}
              </div>
              <div style="font-size: 12px; color: var(--text-muted);">Total Value</div>
            </div>
            <div class="card" style="padding: 16px; text-align: center;">
              <div style="font-size: 24px; font-weight: bold; color: var(--primary-color);">
                ${new Set(contractorProjects.map(p => this.getProjectSpecialty(p)).filter(s => s)).size}
              </div>
              <div style="font-size: 12px; color: var(--text-muted);">Specialties</div>
            </div>
          </div>
          
          <h4 style="margin-bottom: 16px;">Projects by Client</h4>
          ${Object.entries(byClient).map(([client, projects]) => `
            <div class="card" style="padding: 16px; margin-bottom: 12px;">
              <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
                <h5 style="margin: 0;">${client}</h5>
                <span class="badge badge-primary">${projects.length} projects</span>
              </div>
              <div style="display: flex; flex-direction: column; gap: 8px;">
                ${projects.map(p => `
                  <div style="padding: 8px; background: var(--background-alt); border-radius: 4px; border-left: 3px solid var(--success-color);">
                    <div style="display: flex; justify-content: space-between; align-items: start;">
                      <div>
                        <strong>${p.location}</strong> - ${p.job}
                        <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">
                          ${this.formatSpecialty(this.getProjectSpecialty(p))} • ${p.start ? new Date(p.start).toLocaleDateString() : 'TBD'}
                        </div>
                      </div>
                      <div style="text-align: right;">
                        <strong style="color: var(--success-color);">${this.formatCurrency(this.parseValuation(p.valuation))}</strong>
                      </div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
  },

  /**
   * Render Opportunity Matrix - Shows gaps where contractors could be introduced
   */
  renderOpportunityMatrix() {
    const tbody = document.getElementById('intel-opportunity-body');
    if (!tbody) return;
    
    // Build company-location-specialty map
    const companyData = new Map();
    
    this.state.projects.forEach(project => {
      const key = project.company;
      if (!companyData.has(key)) {
        companyData.set(key, {
          company: project.company,
          locations: new Map(),
          contractors: new Set()
        });
      }
      
      const data = companyData.get(key);
      const locKey = project.location;
      
      if (!data.locations.has(locKey)) {
        data.locations.set(locKey, new Map());
      }
      
      const spec = this.getProjectSpecialty(project);
      const contractor = project.contractor || project.vendor || project.subcontractor;
      
      if (spec && contractor) {
        data.locations.get(locKey).set(spec, contractor);
        data.contractors.add(contractor);
      }
    });
    
    // Find opportunities - locations where only some specialties are covered
    const opportunities = [];
    
    companyData.forEach((data, companyName) => {
      const allSpecs = new Set(['electrical', 'mechanical', 'interior_gc']);
      
      data.locations.forEach((specs, locationName) => {
        const coveredSpecs = new Set(specs.keys());
        const missingSpecs = Array.from(allSpecs).filter(s => !coveredSpecs.has(s));
        
        if (missingSpecs.length > 0 && coveredSpecs.size > 0) {
          // There's opportunity - some specs covered, some not
          const activeContractors = Array.from(specs.values());
          
          missingSpecs.forEach(missingSpec => {
            opportunities.push({
              company: companyName,
              location: locationName,
              missingSpecialty: missingSpec,
              activeContractors: activeContractors,
              activeSpecs: Array.from(coveredSpecs)
            });
          });
        }
      });
    });
    
    // Sort by number of active contractors (more = better warm intro opportunity)
    opportunities.sort((a, b) => b.activeContractors.length - a.activeContractors.length);
    
    if (opportunities.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="table-empty">No introduction opportunities found</td></tr>';
      return;
    }
    
    const rows = opportunities.slice(0, 20).map(opp => {
      const location = this.state.locations.find(l => 
        l.company === this.state.companies.find(c => c.name === opp.company)?.normalized &&
        l.name === opp.location
      );
      
      return `
        <tr>
          <td>
            <strong>${opp.company}</strong>
            <div style="font-size: 11px; color: var(--text-muted);">
              ${opp.location}
            </div>
          </td>
          <td>${location ? `${location.city}, ${location.state}` : '—'}</td>
          <td>
            <span class="badge badge-warning">${this.formatSpecialty(opp.missingSpecialty)}</span>
          </td>
          <td>
            <div style="font-size: 12px;">
              ${opp.activeSpecs.map(s => `
                <div style="margin-bottom: 2px;">
                  <span style="color: var(--text-muted);">${this.formatSpecialty(s)}:</span>
                  <strong>${opp.activeContractors[opp.activeSpecs.indexOf(s)] || '—'}</strong>
                </div>
              `).join('')}
            </div>
          </td>
          <td style="text-align: center;">
            <span class="badge badge-success">${opp.activeContractors.length}</span>
            <div style="font-size: 11px; color: var(--text-muted);">warm intros</div>
          </td>
        </tr>
      `;
    }).join('');
    
    tbody.innerHTML = rows;
  },

  /**
   * Render Location Intelligence with project-based insights
   */
  renderLocationIntelligence() {
    const tbody = document.getElementById('intel-locations-body');
    if (!tbody) return;
    
    if (this.state.locations.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="table-empty">No locations found</td></tr>';
      return;
    }
    
    const rows = this.state.locations.map(location => {
      const company = this.state.companies.find(c => c.normalized === location.company);
      if (!company) return '';
      
      // Get projects at this location
      const locationProjects = this.state.projects.filter(p => 
        p.company === company.name && p.location === location.name
      );
      
      // Get contacts
      const locationContacts = this.state.contacts.filter(c => 
        c.company === location.company && c.location === location.name
      );
      
      // Calculate project value
      const totalValue = locationProjects.reduce((sum, p) => sum + this.parseValuation(p.valuation), 0);
      
      // Get unique contractors
      const contractors = new Set();
      locationProjects.forEach(p => {
        const c = p.contractor || p.vendor || p.subcontractor;
        if (c) contractors.add(c);
      });
      
      // Last activity
      let lastActivity = '—';
      let daysAgo = null;
      
      const projectDates = locationProjects
        .filter(p => p.date || p.start)
        .map(p => new Date(p.date || p.start));
      
      const contactDates = locationContacts
        .filter(c => c.last_contacted)
        .map(c => new Date(c.last_contacted));
      
      const allDates = [...projectDates, ...contactDates];
      
      if (allDates.length > 0) {
        const mostRecent = new Date(Math.max(...allDates));
        lastActivity = mostRecent.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        });
        daysAgo = Math.floor((new Date() - mostRecent) / (1000 * 60 * 60 * 24));
      }
      
      // Status
      let status, statusBadge;
      if (locationProjects.length === 0 && locationContacts.length === 0) {
        status = 'Unserved';
        statusBadge = 'badge-error';
      } else if (locationProjects.length > 0) {
        if (daysAgo < 90) {
          status = 'Active';
          statusBadge = 'badge-success';
        } else {
          status = 'Needs Follow-up';
          statusBadge = 'badge-warning';
        }
      } else {
        status = 'Contact Only';
        statusBadge = 'badge-info';
      }
      
      return `
        <tr class="${status === 'Unserved' ? 'table-row-warning' : ''}">
          <td>
            <strong>${company.name}</strong>
            <div style="font-size: 11px; color: var(--text-muted);">
              ${location.name}
            </div>
          </td>
          <td>${location.city}, ${location.state}</td>
          <td style="text-align: center;">
            <strong>${locationProjects.length}</strong>
            <div style="font-size: 11px; color: var(--text-muted);">projects</div>
          </td>
          <td style="text-align: right;">
            <strong style="color: var(--success-color);">${totalValue > 0 ? this.formatCurrency(totalValue) : '—'}</strong>
          </td>
          <td>
            ${contractors.size > 0 ? `
              <div style="font-size: 11px;">
                ${Array.from(contractors).slice(0, 2).join(', ')}
                ${contractors.size > 2 ? ` +${contractors.size - 2}` : ''}
              </div>
            ` : '<span class="text-muted">None</span>'}
          </td>
          <td>
            ${lastActivity}
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
    
    tbody.innerHTML = rows || '<tr><td colspan="7" class="table-empty">No location data available</td></tr>';
  },

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    const searchInput = document.getElementById('intel-search');
    if (searchInput) {
      searchInput.addEventListener('input', Utils.debounce((e) => {
        this.state.filters.search = e.target.value.toLowerCase();
        this.applyFilters();
      }, 300));
    }
    
    const contractorFilter = document.getElementById('contractor-filter');
    if (contractorFilter) {
      contractorFilter.addEventListener('change', (e) => {
        this.state.filters.contractor = e.target.value;
        this.applyFilters();
      });
    }
    
    const specialtyFilter = document.getElementById('specialty-filter');
    if (specialtyFilter) {
      specialtyFilter.addEventListener('change', (e) => {
        this.state.filters.specialty = e.target.value;
        this.applyFilters();
      });
    }
    
    const exportBtn = document.getElementById('export-intelligence-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportIntelligence());
    }
  },

  /**
   * Apply filters
   */
  applyFilters() {
    this.renderContractorPerformance();
    this.renderOpportunityMatrix();
    this.renderLocationIntelligence();
  },

  /**
   * Export intelligence report
   */
  exportIntelligence() {
    const data = [];
    
    this.state.projects.forEach(project => {
      data.push({
        'Company': project.company,
        'Location': project.location,
        'Project': project.job,
        'Project Name': project.projectName || '',
        'Contractor': project.contractor || project.vendor || project.subcontractor || '',
        'Specialty': this.formatSpecialty(this.getProjectSpecialty(project)),
        'Type': project.projectType || '',
        'Start Date': project.start || '',
        'End Date': project.end || '',
        'Value': this.parseValuation(project.valuation)
      });
    });
    
    Utils.exportToCSV(data, `intelligence-report-${new Date().toISOString().split('T')[0]}.csv`);
    
    if (window.App) {
      App.showToast('Intelligence report exported successfully', 'success');
    }
  },

  /**
   * Show error state
   */
  showError() {
    ['intel-total-value', 'intel-active-contractors', 'intel-intro-opps', 'intel-avg-project'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = 'Error';
    });
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

console.log('🕵️ Intelligence Component loaded (ENHANCED VERSION)');
