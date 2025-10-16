/**
 * Projects Component
 * Track and manage active projects with timeline and valuation
 */

const ProjectsComponent = {
  // Component state
  state: {
    projects: [],
    companies: [],
    locations: [],
    contacts: [],
    filteredProjects: [],
    currentOrg: null,
    filters: {
      search: '',
      company: '',
      status: 'all'
    },
    sortColumn: 'start',
    sortDirection: 'desc',
    selectedProject: null
  },

  /**
   * Initialize projects component
   */
  async init() {
    console.log('🚧 Projects Component initializing...');
    
    try {
      // Set current organization
      this.state.currentOrg = VisibilityService.getCurrentOrg();
      
      // Load data
      await this.loadData();
      
      // Setup event listeners
      this.setupEventListeners();
      
      console.log('✅ Projects Component initialized');
    } catch (error) {
      console.error('Error initializing Projects Component:', error);
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
    
    // Apply visibility filters
    this.state.companies = VisibilityService.filterCompanies(companies, this.state.currentOrg);
    this.state.locations = VisibilityService.filterLocations(locations, companies, this.state.currentOrg);
    this.state.contacts = VisibilityService.filterContacts(contacts, companies, this.state.currentOrg);
    this.state.projects = VisibilityService.filterProjects(projects, companies, this.state.currentOrg);
    
    // Initially, filtered = all
    this.state.filteredProjects = [...this.state.projects];
    
    // Apply any existing filters
    this.applyFilters();
    
    // Render table
    this.renderTable();
  },

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Add Project button
    const addBtn = document.getElementById('add-project-btn');
    if (addBtn) {
      addBtn.addEventListener('click', () => this.showAddProjectModal());
    }
    
    // Sortable headers - target the specific projects table
    const projectsTable = document.querySelector('#projects-table-body');
    if (projectsTable) {
      const table = projectsTable.closest('table');
      if (table) {
        table.querySelectorAll('th').forEach((th, index) => {
          // Make specific columns sortable
          const headerText = th.textContent.trim();
          if (headerText === 'Start Date' || headerText === 'End Date' || headerText === 'Valuation') {
            th.style.cursor = 'pointer';
            th.classList.add('sortable');
            
            th.addEventListener('click', () => {
              let column = '';
              if (headerText === 'Start Date') column = 'start';
              else if (headerText === 'End Date') column = 'end';
              else if (headerText === 'Valuation') column = 'valuation';
              
              if (column) this.sortBy(column);
            });
          }
        });
      }
    }
  },

  /**
   * Calculate project status
   */
  getProjectStatus(project) {
    if (!project.start) return 'Not Started';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(project.start);
    startDate.setHours(0, 0, 0, 0);
    const endDate = project.end ? new Date(project.end) : null;
    if (endDate) endDate.setHours(0, 0, 0, 0);
    
    if (startDate > today) {
      return 'Not Started';
    } else if (endDate && endDate < today) {
      return 'Completed';
    } else {
      return 'In Progress';
    }
  },

  /**
   * Calculate project progress percentage
   */
  getProjectProgress(project) {
    if (!project.start || !project.end) return 0;
    
    const today = new Date();
    const startDate = new Date(project.start);
    const endDate = new Date(project.end);
    
    if (today < startDate) return 0;
    if (today > endDate) return 100;
    
    const totalDuration = endDate - startDate;
    const elapsed = today - startDate;
    
    return Math.round((elapsed / totalDuration) * 100);
  },

  /**
   * Apply filters to projects
   */
  applyFilters() {
    let filtered = [...this.state.projects];
    
    // Apply search filter
    if (this.state.filters.search) {
      const search = this.state.filters.search.toLowerCase();
      filtered = filtered.filter(project => 
        project.company?.toLowerCase().includes(search) ||
        project.location?.toLowerCase().includes(search) ||
        project.job?.toLowerCase().includes(search) ||
        project.contact?.toLowerCase().includes(search)
      );
    }
    
    // Apply company filter
    if (this.state.filters.company) {
      filtered = filtered.filter(project => project.company === this.state.filters.company);
    }
    
    // Apply status filter
    if (this.state.filters.status && this.state.filters.status !== 'all') {
      filtered = filtered.filter(project => {
        const status = this.getProjectStatus(project);
        
        switch (this.state.filters.status) {
          case 'active':
            return status === 'In Progress';
          case 'upcoming':
            return status === 'Not Started';
          case 'completed':
            return status === 'Completed';
          case 'overdue':
            return status === 'In Progress' && project.end && new Date(project.end) < new Date();
          default:
            return true;
        }
      });
    }
    
    this.state.filteredProjects = filtered;
    this.renderTable();
  },

  /**
   * Sort projects by column
   */
  sortBy(column) {
    // Toggle direction if same column
    if (this.state.sortColumn === column) {
      this.state.sortDirection = this.state.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.state.sortColumn = column;
      this.state.sortDirection = 'asc';
    }
    
    // Sort the filtered projects
    this.state.filteredProjects.sort((a, b) => {
      let aVal = a[column];
      let bVal = b[column];
      
      // Handle dates
      if (column === 'start' || column === 'end') {
        aVal = aVal ? new Date(aVal).getTime() : Number.MAX_VALUE;
        bVal = bVal ? new Date(bVal).getTime() : Number.MAX_VALUE;
      }
      
      // Handle valuation
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
   * Update sort indicators
   */
  updateSortIndicators() {
    const projectsTable = document.querySelector('#projects-table-body');
    if (!projectsTable) return;
    
    const table = projectsTable.closest('table');
    if (!table) return;
    
    table.querySelectorAll('th').forEach(th => {
      // Remove all sort classes
      th.classList.remove('sorted-asc', 'sorted-desc');
      
      const headerText = th.textContent.trim();
      let column = '';
      
      if (headerText === 'Start Date') column = 'start';
      else if (headerText === 'End Date') column = 'end';
      else if (headerText === 'Valuation') column = 'valuation';
      
      // Add current sort class
      if (column && column === this.state.sortColumn) {
        th.classList.add(`sorted-${this.state.sortDirection}`);
      }
    });
  },

  /**
   * Parse valuation string
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
   * Format valuation
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
   * Get days remaining
   */
  getDaysRemaining(project) {
    if (!project.end) return null;
    
    const today = new Date();
    const endDate = new Date(project.end);
    const days = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
    
    return days > 0 ? days : 0;
  },

  /**
   * Render projects table
   */
  renderTable() {
    const tbody = document.getElementById('projects-table-body');
    if (!tbody) {
      console.warn('Projects table body not found');
      return;
    }
    
    if (this.state.filteredProjects.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="table-empty">No projects found</td></tr>`;
      return;
    }
    
    // Build table rows
    const rows = this.state.filteredProjects.map(project => {
      // Find company details
      const company = this.state.companies.find(c => c.name === project.company);
      
      // Find location details
      const location = this.state.locations.find(l => 
        l.name === project.location && l.company === company?.normalized
      );
      
      const status = this.getProjectStatus(project);
      const progress = this.getProjectProgress(project);
      const daysRemaining = this.getDaysRemaining(project);
      
      // Status badge
      let statusBadge = '';
      let statusClass = '';
      
      switch (status) {
        case 'In Progress':
          statusClass = 'badge-info';
          break;
        case 'Completed':
          statusClass = 'badge-success';
          break;
        case 'Not Started':
          statusClass = 'badge-warning';
          break;
      }
      
      // Check if overdue
      const isOverdue = status === 'In Progress' && daysRemaining !== null && daysRemaining <= 0;
      if (isOverdue) {
        statusClass = 'badge-error';
        statusBadge = 'Overdue';
      } else {
        statusBadge = status;
      }
      
      return `
        <tr class="${isOverdue ? 'overdue' : ''}" data-project-id="${project.id || project.job}">
          <td>
            <div style="display: flex; align-items: center; gap: 8px;">
              <strong style="cursor: pointer; color: var(--primary-color);"
                      onclick="ProjectsComponent.viewProjectDetails('${project.id || project.job}')">
                ${project.company}
              </strong>
              ${company?.tier ? `
                <span class="badge badge-secondary" style="font-size: 10px;">
                  ${company.tier}
                </span>
              ` : ''}
            </div>
          </td>
          <td>
            <strong>${project.location}</strong>
            ${location ? `
              <div style="font-size: 11px; color: var(--text-muted);">
                ${location.city}, ${location.state}
              </div>
            ` : ''}
          </td>
          <td>
            <div>${project.job}</div>
            ${status === 'In Progress' ? `
              <div style="margin-top: 4px;">
                <div style="width: 100px; height: 4px; background: var(--border); border-radius: 2px; overflow: hidden;">
                  <div style="width: ${progress}%; height: 100%; background: var(--primary-color);"></div>
                </div>
                <div style="font-size: 10px; color: var(--text-muted); margin-top: 2px;">
                  ${progress}% complete
                </div>
              </div>
            ` : ''}
          </td>
          <td>
            ${project.contact || '—'}
            ${project.contact && project.contact !== 'New Contact' ? `
              <div style="font-size: 11px; color: var(--success-color);">
                ✓ Active
              </div>
            ` : ''}
          </td>
          <td>
            ${project.start ? 
              new Date(project.start).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              }) : '—'}
          </td>
          <td>
            ${project.end ? 
              new Date(project.end).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              }) : '—'}
            ${daysRemaining !== null && status === 'In Progress' ? `
              <div style="font-size: 11px; color: ${daysRemaining < 15 ? 'var(--error-color)' : 'var(--text-muted)'};">
                ${daysRemaining} days left
              </div>
            ` : ''}
          </td>
          <td>
            <div style="display: flex; align-items: center; gap: 8px;">
              <strong style="color: var(--primary-color);">
                ${this.formatValuation(project.valuation)}
              </strong>
              <span class="badge ${statusClass}" style="font-size: 10px;">
                ${statusBadge}
              </span>
            </div>
            <div style="margin-top: 4px;">
              <button class="btn btn-xs btn-ghost" 
                      onclick="ProjectsComponent.updateStatus('${project.id || project.job}')">
                Update
              </button>
              ${status === 'In Progress' ? `
                <button class="btn btn-xs btn-success" 
                        onclick="ProjectsComponent.markComplete('${project.id || project.job}')">
                  Complete
                </button>
              ` : ''}
            </div>
          </td>
        </tr>
      `;
    }).join('');
    
    tbody.innerHTML = rows;
    
    // Log success
    console.log(`✅ Rendered ${this.state.filteredProjects.length} projects`);
  },

  /**
   * View project details
   */
  viewProjectDetails(projectId) {
    const project = this.state.projects.find(p => 
      p.id === projectId || p.job === projectId
    );
    if (!project) return;
    
    const company = this.state.companies.find(c => c.name === project.company);
    const location = this.state.locations.find(l => 
      l.name === project.location && l.company === company?.normalized
    );
    const status = this.getProjectStatus(project);
    const progress = this.getProjectProgress(project);
    const daysRemaining = this.getDaysRemaining(project);
    
    const details = `
PROJECT DETAILS

Company: ${project.company}
${company ? `Tier: ${company.tier}\nStatus: ${company.status}` : ''}

Location: ${project.location}
${location ? `${location.city}, ${location.state} ${location.zip}` : ''}

Job Description: ${project.job}
Contact: ${project.contact || 'None assigned'}

Timeline:
  Start: ${project.start ? new Date(project.start).toLocaleDateString() : 'Not set'}
  End: ${project.end ? new Date(project.end).toLocaleDateString() : 'Not set'}
  Status: ${status}
  Progress: ${progress}%
  ${daysRemaining !== null ? `Days Remaining: ${daysRemaining}` : ''}

Valuation: ${this.formatValuation(project.valuation)}

Contractors Assigned:
${company?.contractors ? 
  Object.entries(company.contractors)
    .filter(([k, v]) => v)
    .map(([type, contractor]) => `  • ${type}: ${contractor}`)
    .join('\n') || '  None assigned' 
  : '  None assigned'}

Notes:
${project.notes || 'No notes added'}
    `.trim();
    
    alert(details);
  },

  /**
   * Mark project complete
   */
  async markComplete(projectId) {
    const project = this.state.projects.find(p => 
      p.id === projectId || p.job === projectId
    );
    if (!project) return;
    
    if (!confirm(`Mark "${project.job}" as complete?`)) return;
    
    // Update end date to today if not set
    const index = this.state.projects.findIndex(p => 
      p.id === projectId || p.job === projectId
    );
    
    if (index !== -1) {
      this.state.projects[index].end = 
        this.state.projects[index].end || new Date().toISOString().split('T')[0];
      
      // Update in mock data
      if (window.MockData) {
        const mockIndex = MockData.projects.findIndex(p => 
          p.id === projectId || p.job === projectId
        );
        if (mockIndex !== -1) {
          MockData.projects[mockIndex].end = this.state.projects[index].end;
        }
      }
      
      // Log the change
      await DataService.logChange('Project Completed', 
        `Marked project "${project.job}" as complete`
      );
      
      // Refresh display
      await this.loadData();
      
      if (window.App) {
        App.showToast('Project marked as complete', 'success');
      }
    }
  },

  /**
   * Update project status/timeline
   */
  async updateStatus(projectId) {
    const project = this.state.projects.find(p => 
      p.id === projectId || p.job === projectId
    );
    if (!project) return;
    
    const start = prompt('Start date (YYYY-MM-DD):', project.start);
    if (start === null) return;
    
    const end = prompt('End date (YYYY-MM-DD):', project.end);
    if (end === null) return;
    
    // Update in state
    const index = this.state.projects.findIndex(p => 
      p.id === projectId || p.job === projectId
    );
    
    if (index !== -1) {
      this.state.projects[index] = {
        ...this.state.projects[index],
        start: start || project.start,
        end: end || project.end,
        updated_at: new Date().toISOString()
      };
      
      // Update in mock data
      if (window.MockData) {
        const mockIndex = MockData.projects.findIndex(p => 
          p.id === projectId || p.job === projectId
        );
        if (mockIndex !== -1) {
          MockData.projects[mockIndex] = this.state.projects[index];
        }
      }
      
      // Log the change
      await DataService.logChange('Project Updated', 
        `Updated timeline for project "${project.job}"`
      );
      
      // Refresh display
      await this.loadData();
      
      if (window.App) {
        App.showToast('Project timeline updated', 'success');
      }
    }
  },

  /**
   * Show add project modal
   */
  showAddProjectModal() {
    const company = prompt('Company name:');
    if (!company) return;
    
    const location = prompt('Location:');
    if (!location) return;
    
    const job = prompt('Job description:');
    if (!job) return;
    
    const valuation = prompt('Valuation ($):');
    if (!valuation) return;
    
    const startDate = prompt('Start date (YYYY-MM-DD):', 
      new Date().toISOString().split('T')[0]
    );
    
    // Default end date 3 months from start
    const defaultEnd = new Date(startDate || Date.now());
    defaultEnd.setMonth(defaultEnd.getMonth() + 3);
    
    const endDate = prompt('End date (YYYY-MM-DD):', 
      defaultEnd.toISOString().split('T')[0]
    );
    
    this.addProject({
      company,
      location,
      job,
      valuation,
      start: startDate,
      end: endDate,
      contact: prompt('Contact name (optional):') || ''
    });
  },

  /**
   * Add new project
   */
  async addProject(projectData) {
    try {
      const newProject = {
        id: Utils.generateId(),
        ...projectData,
        created_at: new Date().toISOString()
      };
      
      if (window.MockData) {
        MockData.projects.push(newProject);
      }
      
      DataService.cache.projects.push(newProject);
      
      await DataService.logChange('Project Added', 
        `Added project: ${projectData.job} at ${projectData.company}`
      );
      
      await this.loadData();
      
      if (window.App) {
        App.showToast(`Project "${projectData.job}" added successfully`, 'success');
      }
    } catch (error) {
      console.error('Error adding project:', error);
      alert('Error adding project');
    }
  },

  /**
   * Export projects to CSV
   */
  exportToCSV() {
    const data = this.state.filteredProjects.map(project => {
      const company = this.state.companies.find(c => c.name === project.company);
      const status = this.getProjectStatus(project);
      const progress = this.getProjectProgress(project);
      
      return {
        'Company': project.company,
        'Company Tier': company?.tier || '',
        'Location': project.location,
        'Job Description': project.job,
        'Contact': project.contact || '',
        'Start Date': project.start || '',
        'End Date': project.end || '',
        'Status': status,
        'Progress (%)': progress,
        'Valuation': project.valuation,
        'Valuation (Numeric)': this.parseValuation(project.valuation)
      };
    });
    
    Utils.exportToCSV(data, `projects-${new Date().toISOString().split('T')[0]}.csv`);
    
    if (window.App) {
      App.showToast('Projects exported successfully', 'success');
    }
  },

  /**
   * Show error state
   */
  showError() {
    const tbody = document.getElementById('projects-table-body');
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="7" class="table-empty">Error loading projects</td></tr>';
    }
  },

  /**
   * Refresh component
   */
  async refresh() {
    console.log('🔄 Refreshing Projects Component...');
    await this.loadData();
  }
};

// Make available globally
window.ProjectsComponent = ProjectsComponent;

console.log('🚧 Projects Component loaded');
