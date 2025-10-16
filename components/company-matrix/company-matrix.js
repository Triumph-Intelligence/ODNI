/**
 * Enhanced Company Matrix Component
 * Three views: Cards (default), Excel, Relationships
 * Includes relationship intelligence, intro email drafts, and shared filters/search.
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
    viewMode: 'cards', // 'cards' | 'excel' | 'relationships'
    filters: {
      search: '',
      showOnlyWorked: false,
      showOnlyUnworked: false,
      tier: ''
    },
    expandedCompanies: new Set(),
    relationshipData: [],
    isAnalyzing: false, // NEW: loading state for relationship analysis
    _indexes: null      // NEW: caches for fast lookups
  },

  /**
   * Initialize component
   */
  async init() {
    console.log('📊 Company Matrix Component initializing...');
    try {
      // Inject a few small styles for polish
      this.injectStyles();

      // Set current organization
      this.state.currentOrg = VisibilityService.getCurrentOrg();

      // Load data (companies/locations/contacts/projects/opps)
      await this.loadData();

      // Setup event listeners
      this.setupEventListeners();

      // Add view mode buttons to the page
      this.addViewModeButtons();

      console.log('✅ Company Matrix Component initialized');
    } catch (error) {
      console.error('Error initializing Company Matrix Component:', error);
      this.showError();
    }
  },

  /**
   * Small style sprinkle
   */
  injectStyles() {
    const id = 'company-matrix-inline-styles';
    if (document.getElementById(id)) return;

    const style = document.createElement('style');
    style.id = id;
    style.textContent = `
      .view-switching { opacity: .6; transition: opacity .2s ease; }
      .fade-in { animation: fade-in .25s ease; }
      @keyframes fade-in { from { opacity: 0; transform: translateY(2px); } to { opacity: 1; transform: none; } }
      .btn-group .btn + .btn { margin-left: 4px; }
      .table-empty { padding: 32px; text-align: center; color: var(--text-muted); }
      .kpi-card { padding: 16px; }
      .excel-table th, .excel-table td { white-space: nowrap; }
    `;
    document.head.appendChild(style);
  },

  /**
   * Add view mode buttons to the UI
   */
  addViewModeButtons() {
    const controlsContainer = document.querySelector('.page-header .page-actions');
    if (!controlsContainer) return;

    // Check if buttons already exist
    let viewButtonGroup = document.getElementById('view-mode-buttons');
    if (!viewButtonGroup) {
      viewButtonGroup = document.createElement('div');
      viewButtonGroup.id = 'view-mode-buttons';
      viewButtonGroup.className = 'btn-group';
      viewButtonGroup.style.cssText = 'margin-left: auto; display: flex; gap: 4px;';

      viewButtonGroup.innerHTML = `
        <button id="view-cards" class="btn btn-sm btn-primary" title="Card View">
          <span style="font-size: 16px;">▦</span> Cards
        </button>
        <button id="view-excel" class="btn btn-sm btn-ghost" title="Excel View">
          <span style="font-size: 16px;">⊞</span> Excel
        </button>
        <button id="view-relationships" class="btn btn-sm btn-ghost" title="Relationship Intelligence">
          <span style="font-size: 16px;">🤝</span> Relationships
        </button>
      `;

      controlsContainer.appendChild(viewButtonGroup);
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
    const opportunities = await DataService.getOpportunities();

    // Apply visibility filters
    this.state.companies = VisibilityService.filterCompanies(companies, this.state.currentOrg);
    this.state.locations = VisibilityService.filterLocations(locations, companies, this.state.currentOrg);
    this.state.contacts = VisibilityService.filterContacts(contacts, companies, this.state.currentOrg);
    this.state.projects = VisibilityService.filterProjects(projects, companies, this.state.currentOrg);
    this.state.opportunities = VisibilityService.filterOpportunities(opportunities, companies, this.state.currentOrg);

    // Build fast indexes once
    this._indexes = this.buildIndexes();

    // Analyze relationships once (not on every render)
    this.analyzeRelationships();

    // Render based on current view
    this.render();
  },

  /**
   * Build internal indexes for fast analysis/lookups
   */
  buildIndexes() {
    const byCompany = new Map();            // companyId -> [locations]
    const byCompanyState = new Map();       // `${companyId}|${state}` -> { total, worked, cities:Set }
    const nameById = new Map(this.state.companies.map(c => [c.normalized, c.name]));
    const tierById = new Map(this.state.companies.map(c => [c.normalized, c.tier || 'Small']));

    for (const loc of this.state.locations) {
      if (!byCompany.has(loc.company)) byCompany.set(loc.company, []);
      byCompany.get(loc.company).push(loc);

      const key = `${loc.company}|${loc.state}`;
      const record = byCompanyState.get(key) || { total: 0, worked: 0, cities: new Set() };
      record.total += 1;

      const comp = this.state.companies.find(c => c.normalized === loc.company);
      if (comp && this.hasWorkedAtLocation(comp, loc)) record.worked += 1;
      record.cities.add(loc.city);

      byCompanyState.set(key, record);
    }

    return { byCompany, byCompanyState, nameById, tierById };
  },

  /**
   * Analyze cross-company relationships and introduction opportunities
   * (Runs once after data load; renders later respect filters.)
   */
  analyzeRelationships() {
    if (!this._indexes) return;
    this.state.isAnalyzing = true;

    const { byCompany, byCompanyState, nameById, tierById } = this._indexes;
    const companies = [...this.state.companies].sort((a, b) =>
      a.normalized.localeCompare(b.normalized)
    );

    const relationships = [];

    // Unique pairs (i < j) only to avoid duplicates
    for (let i = 0; i < companies.length; i++) {
      const A = companies[i], AId = A.normalized;
      const ALocs = byCompany.get(AId) || [];
      const AStates = new Set(ALocs.map(l => l.state));

      for (let j = i + 1; j < companies.length; j++) {
        const B = companies[j], BId = B.normalized;
        const BLocs = byCompany.get(BId) || [];
        const BStates = new Set(BLocs.map(l => l.state));

        // Complementarity: A has worked where B has zero worked (and vice versa)
        const aStrong = [];
        for (const s of AStates) {
          const Arec = byCompanyState.get(`${AId}|${s}`) || { worked: 0, total: 0 };
          const Brec = byCompanyState.get(`${BId}|${s}`) || { worked: 0, total: 0 };
          if (Arec.worked > 0 && Brec.worked === 0) aStrong.push(s);
        }

        const bStrong = [];
        for (const s of BStates) {
          const Brec = byCompanyState.get(`${BId}|${s}`) || { worked: 0, total: 0 };
          const Arec = byCompanyState.get(`${AId}|${s}`) || { worked: 0, total: 0 };
          if (Brec.worked > 0 && Arec.worked === 0) bStrong.push(s);
        }

        if (aStrong.length && bStrong.length) {
          relationships.push({
            companyA: nameById.get(AId),
            companyB: nameById.get(BId),
            aStrength: aStrong,
            bStrength: bStrong,
            potentialValue: this.calculateRelationshipValue(
              { tier: tierById.get(AId) }, { tier: tierById.get(BId) }, aStrong, bStrong
            ),
            type: 'Geographic Complementarity'
          });
        }

        // Same-state different-city
        const shared = [...AStates].filter(s => BStates.has(s));
        for (const s of shared) {
          const Arec = byCompanyState.get(`${AId}|${s}`);
          const Brec = byCompanyState.get(`${BId}|${s}`);
          if (!Arec || !Brec) continue;

          const aOnlyCities = [...Arec.cities].filter(c => !Brec.cities.has(c));
          const bOnlyCities = [...Brec.cities].filter(c => !Arec.cities.has(c));

          if (aOnlyCities.length && bOnlyCities.length) {
            const aList = aOnlyCities.map(c => `${c}, ${s}`);
            const bList = bOnlyCities.map(c => `${c}, ${s}`);

            relationships.push({
              companyA: nameById.get(AId),
              companyB: nameById.get(BId),
              aStrength: aList,
              bStrength: bList,
              potentialValue: this.calculateRelationshipValue(
                { tier: tierById.get(AId) }, { tier: tierById.get(BId) }, aOnlyCities, bOnlyCities
              ),
              type: 'Same State Coverage'
            });
          }
        }
      }
    }

    this.state.relationshipData = relationships.sort((a, b) => b.potentialValue - a.potentialValue);
    this.state.isAnalyzing = false;
  },

  /**
   * Calculate potential value of a relationship
   * (Company tiers x number of complementary locations)
   */
  calculateRelationshipValue(companyA, companyB, aStrength, bStrength) {
    const tierValues = { 'Enterprise': 100, 'Large': 75, 'Mid': 50, 'Small': 25 };
    const aValue = tierValues[companyA.tier] || 25;
    const bValue = tierValues[companyB.tier] || 25;
    return (aValue + bValue) * (aStrength.length + bStrength.length);
  },

  /**
   * Main render function (switches views + stats + subtle transition)
   */
  render() {
    const container = document.getElementById('company-matrix-container');
    if (container) container.classList.add('view-switching');

    switch (this.state.viewMode) {
      case 'excel':
        this.renderExcelView();
        break;
      case 'relationships':
        this.renderRelationshipView();
        break;
      default:
        this.renderMatrix();
    }

    this.renderStatistics();

    requestAnimationFrame(() => {
      if (container) container.classList.remove('view-switching');
    });
  },

  /**
   * Excel-like grid view (respects filters/toggles)
   */
  renderExcelView() {
    const container = document.getElementById('company-matrix-container');
    if (!container) return;

    const companies = this.getFilteredCompanies();
    if (!companies.length) {
      container.innerHTML = '<div class="table-empty">No companies match the current filters</div>';
      return;
    }

    const states = [...new Set(this.state.locations.map(l => l.state))].sort();

    let html = `
      <div style="overflow-x: auto; max-height: 70vh;">
        <table class="excel-table" style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <thead style="position: sticky; top: 0; background: var(--background-alt); z-index: 10;">
            <tr>
              <th style="border: 1px solid var(--border-color); padding: 8px; position: sticky; left: 0; background: var(--background-alt); z-index: 11;">Company</th>
              <th style="border: 1px solid var(--border-color); padding: 8px; position: sticky; left: 140px; background: var(--background-alt); z-index: 11;">Tier</th>
              ${states.map(state => `
                <th style="border: 1px solid var(--border-color); padding: 8px; min-width: 100px; text-align: center;">
                  ${state}
                </th>
              `).join('')}
              <th style="border: 1px solid var(--border-color); padding: 8px; background: rgba(16, 185, 129, 0.06); text-align: center;">Total Worked</th>
              <th style="border: 1px solid var(--border-color); padding: 8px; background: rgba(245, 158, 11, 0.06); text-align: center;">Opportunities</th>
            </tr>
          </thead>
          <tbody>
    `;

    for (const company of companies) {
      const allLocs = this.state.locations.filter(l => l.company === company.normalized);
      const locs = this.filterLocationsByWorkedFlag(company, allLocs);

      let totalWorked = 0;
      let totalOpportunities = 0;

      html += `
        <tr>
          <td style="border: 1px solid var(--border-color); padding: 8px; font-weight: 600; position: sticky; left: 0; background: var(--background);">
            ${company.name}
          </td>
          <td style="border: 1px solid var(--border-color); padding: 8px; position: sticky; left: 140px; background: var(--background);">
            <span class="badge badge-secondary">${company.tier}</span>
          </td>
      `;

      for (const state of states) {
        const stateLocsFiltered = locs.filter(l => l.state === state);
        const stateLocsAll = allLocs.filter(l => l.state === state);
        const workedCount = stateLocsAll.filter(l => this.hasWorkedAtLocation(company, l)).length;
        const totalCount = stateLocsAll.length;

        if (workedCount > 0) totalWorked += workedCount;
        totalOpportunities += Math.max(totalCount - workedCount, 0);

        let cellContent = '';
        let cellStyle = 'border: 1px solid var(--border-color); padding: 8px; text-align: center;';

        if (totalCount === 0) {
          cellContent = '—';
          cellStyle += ' color: var(--text-muted);';
        } else if (workedCount === totalCount) {
          cellContent = `✓ ${workedCount}`;
          cellStyle += ' background: rgba(16, 185, 129, 0.10); color: var(--success-color); font-weight: 600;';
        } else if (workedCount > 0) {
          cellContent = `${workedCount}/${totalCount}`;
          cellStyle += ' background: rgba(245, 158, 11, 0.10); color: var(--warning-color);';
        } else {
          cellContent = `○ ${totalCount}`;
          cellStyle += ' color: var(--text-secondary);';
        }

        const title = stateLocsAll.map(l => l.city).join(', ');
        html += `<td style="${cellStyle}" title="${title}">${cellContent}</td>`;
      }

      html += `
        <td style="border: 1px solid var(--border-color); padding: 8px; text-align: center; background: rgba(16, 185, 129, 0.05); font-weight: 600; color: var(--success-color);">
          ${totalWorked}
        </td>
        <td style="border: 1px solid var(--border-color); padding: 8px; text-align: center; background: rgba(245, 158, 11, 0.05); font-weight: 600; color: var(--warning-color);">
          ${totalOpportunities}
        </td>
      </tr>`;
    }

    html += `
          </tbody>
        </table>
      </div>

      <div style="margin-top: 20px; padding: 16px; background: var(--background-alt); border-radius: 8px;">
        <h4 style="margin-top: 0; margin-bottom: 12px;">Legend</h4>
        <div style="display: flex; gap: 24px; flex-wrap: wrap;">
          <div><span style="color: var(--success-color); font-weight: 600;">✓ N</span> = All locations worked (N total)</div>
          <div><span style="color: var(--warning-color);">N/M</span> = Partial coverage (N worked of M total)</div>
          <div><span style="color: var(--text-secondary);">○ N</span> = No work yet (N opportunities)</div>
          <div><span style="color: var(--text-muted);">—</span> = No locations in state</div>
        </div>
      </div>
    `;

    container.innerHTML = html;
  },

  /**
   * Relationship Intelligence View (respects filters; shows loading/empty states)
   */
  renderRelationshipView() {
    const container = document.getElementById('company-matrix-container');
    if (!container) return;

    if (this.state.isAnalyzing) {
      container.innerHTML = '<div class="table-empty">Analyzing relationships…</div>';
      return;
    }

    // Apply current filters to visible pairs
    const visibleNames = new Set(this.getFilteredCompanies().map(c => c.name));
    const workedOnly = this.state.filters.showOnlyWorked;
    const unworkedOnly = this.state.filters.showOnlyUnworked;

    const filtered = this.state.relationshipData.filter(rel => {
      if (!visibleNames.has(rel.companyA) || !visibleNames.has(rel.companyB)) return false;

      // For worked-only: show pairs with at least one side demonstrating worked strengths
      if (workedOnly) {
        const aHas = rel.aStrength && rel.aStrength.length > 0;
        const bHas = rel.bStrength && rel.bStrength.length > 0;
        return aHas || bHas;
      }
      // For unworked-only: keep all (these opportunities inherently reflect gaps)
      if (unworkedOnly) return true;

      return true;
    });

    if (!filtered.length) {
      container.innerHTML = '<div class="table-empty">No cross-company introduction opportunities found for the current filters</div>';
      return;
    }

    let html = `
      <div class="relationship-header" style="margin-bottom: 24px;">
        <h3 style="margin: 0 0 8px 0;">🤝 Introduction Opportunities</h3>
        <p style="color: var(--text-secondary); margin: 0;">
          These companies have complementary geographic coverage or useful in-state differences.
        </p>
      </div>

      <div class="relationship-grid" style="display: grid; gap: 16px;">
    `;

    filtered.slice(0, 10).forEach((rel, index) => {
      const companyA = this.state.companies.find(c => c.name === rel.companyA);
      const companyB = this.state.companies.find(c => c.name === rel.companyB);

      html += `
        <div class="relationship-card card fade-in" style="padding: 20px; border-left: 4px solid var(--primary-color);">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 16px;">
            <div style="display: flex; align-items: center; gap: 16px;">
              <div style="font-size: 24px; font-weight: bold; color: var(--primary-color); opacity: 0.3;">
                #${index + 1}
              </div>
              <div>
                <h4 style="margin: 0; font-size: 18px;">
                  ${rel.companyA} ↔ ${rel.companyB}
                </h4>
                <div style="display: flex; gap: 8px; margin-top: 6px;">
                  <span class="badge badge-secondary">${companyA?.tier}</span>
                  <span class="badge badge-secondary">${companyB?.tier}</span>
                  <span class="badge badge-primary">${rel.type}</span>
                </div>
              </div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 11px; color: var(--text-muted); margin-bottom: 4px;">Potential Score</div>
              <div style="font-size: 24px; font-weight: bold; color: var(--primary-color);">
                ${rel.potentialValue}
              </div>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div style="padding: 12px; background: rgba(16, 185, 129, 0.05); border-radius: 8px;">
              <div style="font-weight: 600; margin-bottom: 8px; color: var(--success-color);">
                ${rel.companyA} knows:
              </div>
              <div style="font-size: 13px; line-height: 1.6;">
                ${rel.aStrength.map(s => `<div>• ${s}</div>`).join('')}
              </div>
            </div>

            <div style="padding: 12px; background: rgba(59, 130, 246, 0.05); border-radius: 8px;">
              <div style="font-weight: 600; margin-bottom: 8px; color: var(--primary-color);">
                ${rel.companyB} knows:
              </div>
              <div style="font-size: 13px; line-height: 1.6;">
                ${rel.bStrength.map(s => `<div>• ${s}</div>`).join('')}
              </div>
            </div>
          </div>

          <div style="margin-top: 16px; padding: 12px; background: var(--background-alt); border-radius: 6px;">
            <div style="font-size: 13px; color: var(--text-secondary);">
              <strong>💡 Opportunity:</strong>
              ${rel.companyA} can open doors in <strong>${rel.aStrength.join(', ')}</strong>;
              ${rel.companyB} can reciprocate in <strong>${rel.bStrength.join(', ')}</strong>.
            </div>
          </div>

          <div style="margin-top: 12px; display: flex; gap: 8px;">
            <button class="btn btn-sm btn-primary" onclick="CompanyMatrixComponent.createIntroduction('${rel.companyA}', '${rel.companyB}')">
              📧 Draft Introduction Email
            </button>
            <button class="btn btn-sm btn-ghost" onclick="CompanyMatrixComponent.viewRelationshipDetails('${rel.companyA}', '${rel.companyB}')">
              View Details
            </button>
          </div>
        </div>
      `;
    });

    html += `</div>`;
    container.innerHTML = html;
  },

  /**
   * Cards View (existing matrix; now reuses shared filter helpers)
   */
  renderMatrix() {
    const container = document.getElementById('company-matrix-container');
    if (!container) return;

    const filteredCompanies = this.getFilteredCompanies();

    if (filteredCompanies.length === 0) {
      container.innerHTML = '<div class="table-empty">No companies match the current filters</div>';
      return;
    }

    const matrixHTML = filteredCompanies.map(company => {
      const companyLocationsAll = this.state.locations.filter(l => l.company === company.normalized);
      const companyLocations = this.filterLocationsByWorkedFlag(company, companyLocationsAll);

      const isExpanded = this.state.expandedCompanies.has(company.normalized);

      // Company stats (always based on full presence, not filtered)
      let workedCount = 0, unworkedCount = 0, invoicedSum = 0;
      companyLocationsAll.forEach(location => {
        const hasWorked = this.hasWorkedAtLocation(company, location);
        if (hasWorked) {
          workedCount++;
          invoicedSum += this.getLocationInvoicedAmount(company, location);
        } else {
          unworkedCount++;
        }
      });

      if (companyLocations.length === 0 && (this.state.filters.showOnlyWorked || this.state.filters.showOnlyUnworked)) {
        return ''; // Skip this company if no locations match the worked/unworked toggle
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
                  <div style="font-size: 20px; font-weight: bold; color: var(--success-color);">${workedCount}</div>
                  <div style="font-size: 11px; color: var(--text-muted);">Worked</div>
                </div>
                <div style="text-align: center;">
                  <div style="font-size: 20px; font-weight: bold; color: var(--warning-color);">${unworkedCount}</div>
                  <div style="font-size: 11px; color: var(--text-muted);">Opportunities</div>
                </div>
                <div style="text-align: center;">
                  <div style="font-size: 20px; font-weight: bold; color: var(--primary-color);">
                    ${this.formatCurrency(invoicedSum)}
                  </div>
                  <div style="font-size: 11px; color: var(--text-muted);">Total Invoiced</div>
                </div>
              </div>
            </div>
          </div>

          ${isExpanded ? `
            <div class="card-body">
              ${companyLocations.length > 0 ? `
                <div class="location-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px;">
                  ${companyLocations.map(location => this.renderLocationCard(company, location)).join('')}
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
   * Render a single location card (clickable -> details modal)
   */
  renderLocationCard(company, location) {
    const hasWorked = this.hasWorkedAtLocation(company, location);
    const invoiced = this.getLocationInvoicedAmount(company, location);
    const contacts = this.getLocationContacts(company, location);

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
            ${contacts.length === 0 ? `<span style="font-size: 10px; color: var(--error-color);">No contacts</span>` : ''}
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
          <button class="btn btn-sm btn-ghost" style="width: 100%;">View Details →</button>
        </div>
      </div>
    `;
  },

  /**
   * Location details modal
   */
  showLocationDetails(companyId, locationName) {
    const company = this.state.companies.find(c => c.normalized === companyId);
    const location = this.state.locations.find(l => l.company === companyId && l.name === locationName);
    if (!company || !location) return;

    const hasWorked = this.hasWorkedAtLocation(company, location);
    const invoiced = this.getLocationInvoicedAmount(company, location);
    const contacts = this.getLocationContacts(company, location);

    const locationProjects = this.state.projects.filter(p => p.company === company.name && p.location === location.name);
    const locationOpportunities = this.state.opportunities.filter(o => o.company === company.name && o.location === location.name);

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
                  <div style="font-size: 24px; font-weight: bold; color: var(--success-color);">${this.formatCurrency(invoiced)}</div>
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

              ${locationProjects.length ? `
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
                            ${project.contact ? `<div style="font-size: 12px; margin-top: 4px;"><strong>Contact:</strong> ${project.contact}</div>` : ''}
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

              ${locationOpportunities.length ? `
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

            ${contacts.length ? `
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
                        <td><a href="mailto:${contact.email}" style="color: var(--primary-color);">${contact.email}</a></td>
                        <td>${contact.phone || '—'}</td>
                        <td>${contact.last_contacted ? new Date(contact.last_contacted).toLocaleDateString() : '<span style="color: var(--warning-color);">Never</span>'}</td>
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
   * Search/Tier shared filter: returns list of companies for current filters
   */
  getFilteredCompanies() {
    let list = [...this.state.companies];

    const { search, tier } = this.state.filters;
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(c =>
        c.name.toLowerCase().includes(s) || (c.tier || '').toLowerCase().includes(s)
      );
    }
    if (tier) list = list.filter(c => c.tier === tier);

    return list;
  },

  /**
   * Worked/Unworked toggle applied to a company’s location list
   */
  filterLocationsByWorkedFlag(company, locations) {
    const workedOnly = this.state.filters.showOnlyWorked;
    const unworkedOnly = this.state.filters.showOnlyUnworked;
    if (!workedOnly && !unworkedOnly) return locations;

    return locations.filter(l => {
      const worked = this.hasWorkedAtLocation(company, l);
      return workedOnly ? worked : !worked;
    });
  },

  /**
   * Create introduction email draft
   */
  createIntroduction(companyA, companyB) {
    const rel = this.state.relationshipData.find(r =>
      (r.companyA === companyA && r.companyB === companyB) ||
      (r.companyA === companyB && r.companyB === companyA)
    );

    if (!rel) {
      alert('Relationship data not found');
      return;
    }

    // Build sides with correct labels
    const aList = (rel.companyA === companyA ? rel.aStrength : rel.bStrength).join(', ');
    const bList = (rel.companyB === companyB ? rel.bStrength : rel.aStrength).join(', ');

    const emailTemplate = `
Subject: Introduction: ${companyA} ↔ ${companyB}

Dear [Contact Name],

I wanted to introduce you to [Other Contact Name] from ${rel.companyA === companyA ? companyB : companyA}.

${companyA} has strong presence in ${aList}, while ${companyB} has established operations in ${bList}.

I believe there could be valuable synergies between your organizations, particularly in terms of geographic coverage and potential collaboration opportunities.

Would you both be interested in a brief introductory call to explore potential areas of mutual benefit?

Best regards,
[Your Name]
    `.trim();

    // Hook into your actual email composer here if you have one
    alert('Email Template:\n\n' + emailTemplate);
  },

  /**
   * View relationship details (simple modal/alert for now)
   */
  viewRelationshipDetails(companyA, companyB) {
    const rel = this.state.relationshipData.find(r =>
      (r.companyA === companyA && r.companyB === companyB) ||
      (r.companyA === companyB && r.companyB === companyA)
    );

    if (!rel) {
      alert('Relationship data not found');
      return;
    }

    alert(`
Relationship Analysis: ${companyA} ↔ ${companyB}

Type: ${rel.type}
Potential Value Score: ${rel.potentialValue}

${companyA} Coverage:
${(rel.companyA === companyA ? rel.aStrength : rel.bStrength).map(s => '• ' + s).join('\n')}

${companyB} Coverage:
${(rel.companyB === companyB ? rel.bStrength : rel.aStrength).map(s => '• ' + s).join('\n')}

This relationship offers strong potential for:
• Geographic expansion opportunities
• Cross-referral partnerships
• Knowledge sharing
• Joint business development
    `.trim());
  },

  /**
   * Worked at location?
   */
  hasWorkedAtLocation(company, location) {
    const hasProject = this.state.projects.some(p =>
      p.company === company.name && p.location === location.name
    );

    const hasCompletedOpp = this.state.opportunities.some(o =>
      o.company === company.name &&
      o.location === location.name &&
      o.status === 'Closed-Won'
    );

    return hasProject || hasCompletedOpp;
  },

  /**
   * Total invoiced at location
   */
  getLocationInvoicedAmount(company, location) {
    let total = 0;
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
   * Parse $ strings (supports K/M)
   */
  parseValuation(valuation) {
    if (!valuation) return 0;
    if (typeof valuation === 'number') return valuation;

    const cleaned = valuation.toString().replace(/[$,]/g, '').trim();

    if (/k$/i.test(cleaned)) return parseFloat(cleaned.replace(/k/i, '')) * 1000;
    if (/m$/i.test(cleaned)) return parseFloat(cleaned.replace(/m/i, '')) * 1000000;

    const num = parseFloat(cleaned);
    return Number.isFinite(num) ? num : 0;
  },

  /**
   * Currency formatter (compact for K/M)
   */
  formatCurrency(amount) {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${Math.round(amount / 1000)}K`;
    return `$${amount}`;
  },

  /**
   * Contacts for a location
   */
  getLocationContacts(company, location) {
    return this.state.contacts.filter(c =>
      c.company === company.normalized &&
      c.location === location.name
    );
  },

  /**
   * Summary KPIs (always computed on full dataset, not filtered)
   */
  renderStatistics() {
    const totalCompanies = this.state.companies.length;
    const totalLocations = this.state.locations.length;

    let workedLocations = 0;
    let unworkedLocations = 0;
    let totalInvoiced = 0;

    this.state.companies.forEach(company => {
      const companyLocations = this.state.locations.filter(l => l.company === company.normalized);
      companyLocations.forEach(location => {
        const hasWorked = this.hasWorkedAtLocation(company, location);
        const invoiced = this.getLocationInvoicedAmount(company, location);
        if (hasWorked) {
          workedLocations++;
          totalInvoiced += invoiced;
        } else {
          unworkedLocations++;
        }
      });
    });

    const coveragePercent = totalLocations > 0 ? Math.round((workedLocations / totalLocations) * 100) : 0;

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
   * Quick relative-time formatting
   */
  getRelativeTime(dateStr) {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
    return `${Math.floor(diffDays / 365)}y ago`;
  },

  /**
   * Add contact placeholder
   */
  addContact(companyId, locationName) {
    alert(`Add contact for ${locationName} (company: ${companyId})`);
  },

  addContactFromModal(companyId, locationName) {
    this.addContact(companyId, locationName);
  },

  /**
   * Enhanced setup event listeners
   */
  setupEventListeners() {
    // Search input
    const searchInput = document.getElementById('matrix-search');
    if (searchInput) {
      searchInput.addEventListener('input', Utils.debounce((e) => {
        this.state.filters.search = e.target.value.toLowerCase();
        this.render();
      }, 300));
    }

    // View mode buttons
    const viewCardsBtn = document.getElementById('view-cards');
    if (viewCardsBtn) {
      viewCardsBtn.addEventListener('click', () => {
        this.state.viewMode = 'cards';
        document.querySelectorAll('#view-mode-buttons button').forEach(btn => {
          btn.classList.remove('btn-primary');
          btn.classList.add('btn-ghost');
        });
        viewCardsBtn.classList.remove('btn-ghost');
        viewCardsBtn.classList.add('btn-primary');
        this.render();
      });
    }

    const viewExcelBtn = document.getElementById('view-excel');
    if (viewExcelBtn) {
      viewExcelBtn.addEventListener('click', () => {
        this.state.viewMode = 'excel';
        document.querySelectorAll('#view-mode-buttons button').forEach(btn => {
          btn.classList.remove('btn-primary');
          btn.classList.add('btn-ghost');
        });
        viewExcelBtn.classList.remove('btn-ghost');
        viewExcelBtn.classList.add('btn-primary');
        this.render();
      });
    }

    const viewRelationshipsBtn = document.getElementById('view-relationships');
    if (viewRelationshipsBtn) {
      viewRelationshipsBtn.addEventListener('click', () => {
        this.state.viewMode = 'relationships';
        document.querySelectorAll('#view-mode-buttons button').forEach(btn => {
          btn.classList.remove('btn-primary');
          btn.classList.add('btn-ghost');
        });
        viewRelationshipsBtn.classList.remove('btn-ghost');
        viewRelationshipsBtn.classList.add('btn-primary');
        this.render();
      });
    }

    // Filter buttons: Worked / Unworked
    const showWorkedBtn = document.getElementById('show-worked-only');
    if (showWorkedBtn) {
      showWorkedBtn.addEventListener('click', () => {
        this.state.filters.showOnlyWorked = !this.state.filters.showOnlyWorked;
        this.state.filters.showOnlyUnworked = false;
        showWorkedBtn.classList.toggle('btn-primary', this.state.filters.showOnlyWorked);
        showWorkedBtn.textContent = this.state.filters.showOnlyWorked ? 'Show All Locations' : 'Show Worked Only';

        const unworkedBtn = document.getElementById('show-unworked-only');
        if (unworkedBtn) {
          unworkedBtn.classList.remove('btn-primary');
          unworkedBtn.textContent = 'Show Opportunities Only';
        }
        this.render();
      });
    }

    const showUnworkedBtn = document.getElementById('show-unworked-only');
    if (showUnworkedBtn) {
      showUnworkedBtn.addEventListener('click', () => {
        this.state.filters.showOnlyUnworked = !this.state.filters.showOnlyUnworked;
        this.state.filters.showOnlyWorked = false;
        showUnworkedBtn.classList.toggle('btn-primary', this.state.filters.showOnlyUnworked);
        showUnworkedBtn.textContent = this.state.filters.showOnlyUnworked ? 'Show All Locations' : 'Show Opportunities Only';

        const workedBtn = document.getElementById('show-worked-only');
        if (workedBtn) {
          workedBtn.classList.remove('btn-primary');
          workedBtn.textContent = 'Show Worked Only';
        }
        this.render();
      });
    }

    // Tier filter
    const tierFilter = document.getElementById('matrix-tier-filter');
    if (tierFilter) {
      tierFilter.addEventListener('change', (e) => {
        this.state.filters.tier = e.target.value;
        this.render();
      });
    }

    // Expand / Collapse all
    const expandAllBtn = document.getElementById('expand-all-btn');
    if (expandAllBtn) {
      expandAllBtn.addEventListener('click', () => {
        this.state.companies.forEach(c => this.state.expandedCompanies.add(c.normalized));
        this.render();
      });
    }

    const collapseAllBtn = document.getElementById('collapse-all-btn');
    if (collapseAllBtn) {
      collapseAllBtn.addEventListener('click', () => {
        this.state.expandedCompanies.clear();
        this.render();
      });
    }
  },

  /**
   * Error state
   */
  showError() {
    const container = document.getElementById('company-matrix-container');
    if (container) {
      container.innerHTML = '<div class="table-empty">Error loading company matrix</div>';
    }
  },

  /**
   * Refresh (re-load + re-render)
   */
  async refresh() {
    console.log('🔄 Refreshing Company Matrix Component...');
    await this.loadData();
  }
};

// Make available globally
window.CompanyMatrixComponent = CompanyMatrixComponent;

console.log('📊 Enhanced Company Matrix Component loaded');
