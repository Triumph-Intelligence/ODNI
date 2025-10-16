/**
 * Intelligence Component — vNext (Fixed & Enhanced)
 * Office of National Intelligence (kept & upgraded)
 *
 * What's new (meaningful upgrades):
 * - Uses CURRENT DATA: projects, opportunities, gifts (not just static company.contractors)
 * - Live contractor/trade intelligence per company & per location
 * - Contact freshness + outreach status (recently contacted, overdue, unserved)
 * - Trade-Swap Introductions (actionable, derived from cross-trade work at same client)
 * - "Worked By" rollups in matrix + smarter search/filtering by contractor
 * - Richer CSV exports (dynamic top contractor per trade, contact freshness)
 * - Safer DOM guards (renders only where containers exist)
 * - Enhanced logging and error handling
 *
 * Expected DOM ids (existing ones kept):
 *  - KPIs: intel-companies, intel-locations, intel-contacts, intel-unserved (optional extra: intel-worked, intel-overdue, intel-gifts, intel-swaps-kpi)
 *  - Tables: intel-matrix-body, intel-locations-body
 *  - Trade-swap cards (optional): intel-swaps
 *  - Inputs: intel-search, contractor-filter
 */

const IntelligenceComponent = {
  // Component state
  state: {
    companies: [],
    locations: [],
    contacts: [],
    gifts: [],
    projects: [],
    opportunities: [],
    currentOrg: null,
    contractorIndex: new Map(), // contractor -> {companies:Set, trades:Set, count}
    connectionData: [],         // trade-swap intros
    // quick caches
    summariesByCompany: new Map(), // companyName -> [{contractor, trades:Set, count, last}]
    lastProjectByCompany: new Map(), // companyName -> timestamp
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
      console.log('📋 Current organization:', this.state.currentOrg);

      // Load and render data
      await this.loadData();
      
      // Analyze must happen after loadData completes
      await this.analyze(); // build summaries, indexes, trade-swap, freshness
      
      this.setupEventListeners();

      // Initial renders - ensure analysis is complete first
      this.renderSummary();
      this.renderContractorMatrix();
      this.renderLocationIntelligence();
      this.renderTradeSwapSection();

      console.log('✅ Intelligence Component initialized');
      console.log('📊 Final state:', {
        companies: this.state.companies.length,
        locations: this.state.locations.length,
        contacts: this.state.contacts.length,
        projects: this.state.projects.length,
        opportunities: this.state.opportunities.length,
        summaries: this.state.summariesByCompany.size,
        connections: this.state.connectionData.length
      });
    } catch (error) {
      console.error('❌ Error initializing Intelligence Component:', error);
      console.error('Stack trace:', error.stack);
      this.showError();
    }
  },

  /**
   * Load all data from DataService
   */
  async loadData() {
    console.log('📥 Loading intelligence data...');
    
    try {
      const companies = await DataService.getCompanies();
      const locations = await DataService.getLocations();
      const contacts = await DataService.getContacts();
      const gifts = await DataService.getGifts();
      const projects = await DataService.getProjects();
      const opportunities = await DataService.getOpportunities();

      console.log('📦 Raw data loaded:', {
        companies: companies.length,
        locations: locations.length,
        contacts: contacts.length,
        gifts: gifts.length,
        projects: projects.length,
        opportunities: opportunities.length
      });

      // Apply visibility filters
      this.state.companies = VisibilityService.filterCompanies(companies, this.state.currentOrg);
      this.state.locations = VisibilityService.filterLocations(locations, companies, this.state.currentOrg);
      this.state.contacts = VisibilityService.filterContacts(contacts, companies, this.state.currentOrg);
      this.state.gifts = VisibilityService.filterGifts(gifts, contacts, companies, this.state.currentOrg);
      
      // Handle projects and opportunities - check if filter methods exist
      if (VisibilityService.filterProjects && typeof VisibilityService.filterProjects === 'function') {
        this.state.projects = VisibilityService.filterProjects(projects, companies, this.state.currentOrg);
      } else {
        console.warn('⚠️ VisibilityService.filterProjects not available, using fallback');
        // Fallback: filter by company visibility
        this.state.projects = projects.filter(p => {
          const company = companies.find(c => c.name === p.company);
          return company && VisibilityService.canSeeCompany(company, this.state.currentOrg);
        });
      }
      
      if (VisibilityService.filterOpportunities && typeof VisibilityService.filterOpportunities === 'function') {
        this.state.opportunities = VisibilityService.filterOpportunities(opportunities, companies, this.state.currentOrg);
      } else {
        console.warn('⚠️ VisibilityService.filterOpportunities not available, using fallback');
        // Fallback: filter by company visibility
        this.state.opportunities = opportunities.filter(o => {
          const company = companies.find(c => c.name === o.company);
          return company && VisibilityService.canSeeCompany(company, this.state.currentOrg);
        });
      }

      console.log('✅ Filtered data:', {
        companies: this.state.companies.length,
        locations: this.state.locations.length,
        contacts: this.state.contacts.length,
        gifts: this.state.gifts.length,
        projects: this.state.projects.length,
        opportunities: this.state.opportunities.length,
        currentOrg: this.state.currentOrg
      });
    } catch (error) {
      console.error('❌ Error in loadData:', error);
      throw error;
    }
  },

  /**
   * Analyze derived intelligence:
   * - Company contractor summaries (from projects)
   * - Last project dates
   * - Global contractor index
   * - Trade-swap connections
   */
  async analyze() {
    console.log('🔍 Analyzing intelligence data...');
    
    try {
      this.state.summariesByCompany.clear();
      this.state.lastProjectByCompany.clear();
      this.state.contractorIndex.clear();

      const companiesByName = Object.fromEntries(this.state.companies.map(c => [c.name, c]));

      // Build per-company contractor summaries & last project timestamps
      const projectsByCompany = new Map();
      for (const p of this.state.projects) {
        if (!p.company) continue;
        if (!projectsByCompany.has(p.company)) projectsByCompany.set(p.company, []);
        projectsByCompany.get(p.company).push(p);
      }

      console.log('📊 Projects grouped by company:', projectsByCompany.size);

      for (const [companyName, rows] of projectsByCompany.entries()) {
        const summary = this.getCompanyContractorSummary(companyName, rows);
        this.state.summariesByCompany.set(companyName, summary);

        // last project timestamp (for freshness KPI)
        const lastTs = rows
          .map(p => new Date(p.performed_on || p.end || p.start || 0).getTime())
          .filter(Boolean)
          .sort((a,b)=>b-a)[0];
        if (lastTs) this.state.lastProjectByCompany.set(companyName, lastTs);

        // Update global contractor index
        for (const s of summary) {
          if (!this.state.contractorIndex.has(s.contractor)) {
            this.state.contractorIndex.set(s.contractor, { companies: new Set(), trades: new Set(), count: 0 });
          }
          const idx = this.state.contractorIndex.get(s.contractor);
          idx.companies.add(companyName);
          s.trades.forEach(t => idx.trades.add(t));
          idx.count += s.count;
        }
      }

      console.log('📈 Analysis results:', {
        summaries: this.state.summariesByCompany.size,
        contractors: this.state.contractorIndex.size,
        lastProjects: this.state.lastProjectByCompany.size
      });

      // Build trade-swap connections (across companies)
      this.analyzeTradeSwapConnections(companiesByName);
      
      console.log('🔗 Trade-swap connections found:', this.state.connectionData.length);
    } catch (error) {
      console.error('❌ Error in analyze:', error);
      throw error;
    }
  },

  /**
   * Contractor/trade summary for a company from its projects
   * Returns: [{contractor, trades:Set, count, last}]
   */
  getCompanyContractorSummary(companyName, rows = null) {
    const recs = rows || this.state.projects.filter(p => p.company === companyName);
    if (!recs.length) return [];
    const map = new Map(); // contractor -> {trades:Set, count, last}
    for (const p of recs) {
      const contractor = p.performed_by || p.contractor || p.vendor || p.subcontractor;
      const trade = (p.trade || this.getProjectSpecialty(p) || '').toLowerCase();
      if (!contractor || !trade) continue;

      const key = contractor.trim();
      if (!map.has(key)) map.set(key, { contractor: key, trades: new Set(), count: 0, last: null });
      const rec = map.get(key);
      rec.trades.add(trade);
      rec.count += 1;

      const d = p.performed_on || p.end || p.start;
      if (d) {
        const time = new Date(d).getTime();
        if (!rec.last || time > rec.last) rec.last = time;
      }
    }

    return Array.from(map.values()).sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return (b.last || 0) - (a.last || 0);
    });
  },

  /**
   * Trade-Swap analysis (client/location + complementary trades)
   * Produces this.state.connectionData (sorted by potential value)
   */
  analyzeTradeSwapConnections(companiesByName) {
    const normalizeSpec = (s) => (s || '').toString().trim().toLowerCase();

    // Index locations (city/state) for nicer labels
    const companyLocationsIndex = new Map(); // key: companyNormalized|locationName => {city,state,zip}
    this.state.locations.forEach(l => {
      companyLocationsIndex.set(`${l.company}|${l.name}`, { city: l.city, state: l.state, zip: l.zip });
    });

    // Build workMap: company -> location -> specialty -> contractor
    const workMap = {};
    for (const project of this.state.projects) {
      const companyName = project.company;
      const companyObj = companiesByName[companyName];
      if (!companyObj) continue;

      const spec = this.getProjectSpecialty(project);
      if (!spec) continue;

      const contractorFromProject =
        project.performed_by || project.contractor || project.vendor || project.subcontractor;
      const contractor =
        contractorFromProject ||
        (companyObj.contractors && companyObj.contractors[normalizeSpec(spec)]) ||
        null;

      if (!contractor) continue;

      workMap[companyName] ||= {};
      workMap[companyName][project.location] ||= {};
      if (!workMap[companyName][project.location][spec]) {
        workMap[companyName][project.location][spec] = contractor;
      }
    }

    // Build pairs & scores
    const pairsByKey = {};
    const tierValues = { 'Enterprise': 100, 'Large': 75, 'Mid': 50, 'Small': 25 };

    for (const [companyName, byLocation] of Object.entries(workMap)) {
      const companyObj = companiesByName[companyName];
      const tierVal = tierValues[companyObj?.tier] || 25;

      const specToContractorToLocs = {};
      for (const [locName, specToContractor] of Object.entries(byLocation)) {
        for (const [spec, contractor] of Object.entries(specToContractor)) {
          const nSpec = normalizeSpec(spec);
          specToContractorToLocs[nSpec] ||= {};
          specToContractorToLocs[nSpec][contractor] ||= new Set();
          specToContractorToLocs[nSpec][contractor].add(locName);
        }
      }

      const specs = Object.keys(specToContractorToLocs);
      for (let i = 0; i < specs.length; i++) {
        for (let j = i + 1; j < specs.length; j++) {
          const sA = specs[i], sB = specs[j];
          const contractorsA = Object.keys(specToContractorToLocs[sA] || {});
          const contractorsB = Object.keys(specToContractorToLocs[sB] || {});

          for (const contractorA of contractorsA) {
            for (const contractorB of contractorsB) {
              if (!contractorA || !contractorB || contractorA === contractorB) continue;

              const workedA = Array.from(specToContractorToLocs[sA][contractorA] || []);
              const workedB = Array.from(specToContractorToLocs[sB][contractorB] || []);
              if (workedA.length === 0 || workedB.length === 0) continue;

              // Build intros
              const introsAtoB = [];
              for (const locName of workedA) {
                const locKey = `${companyObj.normalized}|${locName}`;
                const cityState = companyLocationsIndex.get(locKey) || {};
                const alreadyBAtLocForSB = byLocation[locName] && byLocation[locName][sB] === contractorB;
                if (!alreadyBAtLocForSB) {
                  introsAtoB.push({ company: companyName, location: locName, city: cityState.city || '', state: cityState.state || '', specialty: sB });
                }
              }

              const introsBtoA = [];
              for (const locName of workedB) {
                const locKey = `${companyObj.normalized}|${locName}`;
                const cityState = companyLocationsIndex.get(locKey) || {};
                const alreadyAAtLocForSA = byLocation[locName] && byLocation[locName][sA] === contractorA;
                if (!alreadyAAtLocForSA) {
                  introsBtoA.push({ company: companyName, location: locName, city: cityState.city || '', state: cityState.state || '', specialty: sA });
                }
              }

              if (introsAtoB.length > 0 || introsBtoA.length > 0) {
                const keyAB = `${contractorA}||${contractorB}`;
                pairsByKey[keyAB] ||= { contractorA, contractorB, pairs: [], potentialValue: 0, type: 'Trade-Swap Introductions' };

                const workedDetailsA = workedA.map(locName => {
                  const locKey = `${companyObj.normalized}|${locName}`;
                  const { city = '', state = '' } = companyLocationsIndex.get(locKey) || {};
                  return { location: locName, city, state, specialty: sA };
                });

                const workedDetailsB = workedB.map(locName => {
                  const locKey = `${companyObj.normalized}|${locName}`;
                  const { city = '', state = '' } = companyLocationsIndex.get(locKey) || {};
                  return { location: locName, city, state, specialty: sB };
                });

                pairsByKey[keyAB].pairs.push({
                  company: companyName,
                  tier: companyObj?.tier || '—',
                  aSpecialty: sA,
                  bSpecialty: sB,
                  aWorked: workedDetailsA,
                  bWorked: workedDetailsB,
                  introsAtoB,
                  introsBtoA
                });

                pairsByKey[keyAB].potentialValue += tierVal * (introsAtoB.length + introsBtoA.length);
              }
            }
          }
        }
      }
    }

    this.state.connectionData = Object.values(pairsByKey).sort((a, b) => b.potentialValue - a.potentialValue);
  },

  /**
   * Render Intelligence Summary KPIs
   */
  renderSummary() {
    console.log('📊 Rendering intelligence summary...');
    
    try {
      // Base KPIs
      const companiesTracked = this.state.companies.length;
      const totalLocations = this.state.locations.length;
      const totalContacts = this.state.contacts.length;

      const unservedLocations = this.calculateUnservedLocations();
      const overdueLocations = this.calculateOverdueLocations(90);
      const workedCompanies = this.countWorkedCompanies();
      const giftsCount = this.state.gifts.length;
      const swapOppsCount = this.state.connectionData.reduce((acc, c) =>
        acc + c.pairs.reduce((a,p)=>a + p.introsAtoB.length + p.introsBtoA.length, 0), 0);

      console.log('📈 KPI values:', {
        companiesTracked,
        totalLocations,
        totalContacts,
        unservedLocations,
        overdueLocations,
        workedCompanies,
        giftsCount,
        swapOppsCount
      });

      // Update DOM (existing)
      this.setText('intel-companies', companiesTracked);
      this.setText('intel-locations', totalLocations);
      this.setText('intel-contacts', totalContacts);
      this.setText('intel-unserved', unservedLocations);

      // Optional extras (render if present)
      this.setText('intel-overdue', overdueLocations);
      this.setText('intel-worked', workedCompanies);
      this.setText('intel-gifts', giftsCount);
      this.setText('intel-swaps-kpi', swapOppsCount);
      
      console.log('✅ Summary rendered successfully');
    } catch (error) {
      console.error('❌ Error rendering summary:', error);
    }
  },

  setText(id, value) {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = String(value);
    } else {
      console.warn(`⚠️ Element not found: #${id}`);
    }
  },

  /**
   * Calculate unserved locations (0 contacts)
   */
  calculateUnservedLocations() {
    const locationContactMap = new Map();
    this.state.locations.forEach(location => {
      const key = `${location.company}-${location.name}`;
      locationContactMap.set(key, 0);
    });

    this.state.contacts.forEach(contact => {
      if (contact.location) {
        const key = `${contact.company}-${contact.location}`;
        const current = locationContactMap.get(key) || 0;
        locationContactMap.set(key, current + 1);
      }
    });

    let unserved = 0;
    locationContactMap.forEach(count => { if (count === 0) unserved++; });
    return unserved;
  },

  /**
   * Calculate overdue locations by last-contact freshness
   */
  calculateOverdueLocations(thresholdDays = 90) {
    let overdue = 0;
    const byKey = new Map(); // company|location -> most recent contact ts

    this.state.contacts.forEach(c => {
      if (!c.location) return;
      const key = `${c.company}|${c.location}`;
      const t = c.last_contacted ? new Date(c.last_contacted).getTime() : null;
      if (!byKey.has(key)) byKey.set(key, t);
      else {
        const ex = byKey.get(key);
        if (t && (!ex || t > ex)) byKey.set(key, t);
      }
    });

    const now = Date.now();
    this.state.locations.forEach(l => {
      const key = `${l.company}|${l.name}`;
      const t = byKey.get(key);
      if (t == null) return; // unserved handled elsewhere
      const days = Math.floor((now - t) / (1000 * 60 * 60 * 24));
      if (days > thresholdDays) overdue++;
    });
    return overdue;
  },

  /**
   * Count companies with at least one project ("worked")
   */
  countWorkedCompanies() {
    const set = new Set(this.state.projects.map(p => p.company).filter(Boolean));
    return set.size;
  },

  /**
   * Render Contractor Intelligence Matrix (now dynamic, from projects)
   */
  renderContractorMatrix() {
    console.log('🏗️ Rendering contractor matrix...');
    
    const tbody = document.getElementById('intel-matrix-body');
    if (!tbody) {
      console.warn('⚠️ Contractor matrix table body not found (#intel-matrix-body)');
      return;
    }

    if (this.state.companies.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="table-empty">No companies found</td></tr>';
      return;
    }

    // Filtered companies
    const filtered = this.state.companies.filter(company => {
      const summary = this.state.summariesByCompany.get(company.name) || [];
      const text = (company.name + ' ' + summary.map(s => `${s.contractor} ${Array.from(s.trades).join(' ')}`).join(' ')).toLowerCase();
      const matchesSearch = this.state.filters.search ? text.includes(this.state.filters.search) : true;
      const matchesContractor = this.state.filters.contractor === 'all'
        ? true
        : summary.some(s => s.contractor.toLowerCase() === this.state.filters.contractor.toLowerCase());
      return matchesSearch && matchesContractor;
    });

    console.log(`📋 Filtered companies: ${filtered.length} of ${this.state.companies.length}`);

    // Build rows
    const rows = filtered.map(company => {
      const summary = this.state.summariesByCompany.get(company.name) || [];
      const locationCount = this.state.locations.filter(l => l.company === company.normalized).length;
      const contactCount = this.state.contacts.filter(c => c.company === company.normalized).length;
      const lastProjectTs = this.state.lastProjectByCompany.get(company.name) || null;

      // dynamic top contractor per trade (from projects)
      const topByTrade = this.getTopContractorByTrade(company.name);

      // coverage across 5 trades
      const tradeKeys = ['electrical','mechanical','interior_gc','marketing','staffing'];
      const coverageScore = tradeKeys.filter(t => topByTrade[t]?.name).length;
      const coverageBadge = coverageScore >= 4 ? 'badge-success' : coverageScore >= 2 ? 'badge-warning' : 'badge-error';

      // worked-by chips (top 4)
      const workedBy = summary.slice(0,4).map(s => `
        <span class="badge" style="font-size:10px; background: ${this.stringToHslColor(s.contractor)}20; color: ${this.stringToHslColor(s.contractor, true)}; border:1px solid ${this.stringToHslColor(s.contractor, true)}33;">
          ${s.contractor} <span style="opacity:.7;">(${Array.from(s.trades).map(t => this.prettyTrade(t)).join(', ')})</span>
        </span>
      `).join('') + (summary.length > 4 ? ` <span class="badge badge-secondary" style="font-size:10px;">+${summary.length - 4} more</span>` : '');

      const fmtCell = (rec) => {
        if (!rec?.name) return '<span class="text-muted">—</span>';
        return `
          <span style="font-weight:600; color:${this.stringToHslColor(rec.name, true)}">${rec.name}</span>
          <div style="font-size:11px; color:var(--text-muted);">${rec.count} project${rec.count>1?'s':''}</div>
        `;
      };

      return `
        <tr>
          <td>
            <div style="display:flex; align-items:center; gap:8px;">
              <strong style="cursor:pointer; color:var(--primary-color);" onclick="IntelligenceComponent.showCompanyMap('${company.normalized}')">${company.name}</strong>
              <span class="badge ${coverageBadge}" style="font-size:10px;">${coverageScore}/5</span>
            </div>
            <div style="font-size:11px; color:var(--text-muted); margin-top:2px;">
              ${locationCount} locations • ${contactCount} contacts
              ${lastProjectTs ? `• last project ${this.getRelativeTime(new Date(lastProjectTs).toISOString())}` : ''}
            </div>
            <div style="display:flex; gap:6px; flex-wrap:wrap; margin-top:6px;">${workedBy || '<span class="text-muted">No work recorded yet</span>'}</div>
          </td>
          <td>${fmtCell(topByTrade.electrical)}</td>
          <td>${fmtCell(topByTrade.mechanical)}</td>
          <td>${fmtCell(topByTrade.interior_gc)}</td>
          <td>${fmtCell(topByTrade.marketing)}</td>
          <td>${fmtCell(topByTrade.staffing)}</td>
        </tr>
      `;
    }).join('');

    tbody.innerHTML = rows || '<tr><td colspan="7" class="table-empty">No companies match the current filters</td></tr>';

    // (optional) populate contractor filter options if empty
    const contractorFilter = document.getElementById('contractor-filter');
    if (contractorFilter && contractorFilter.options.length <= 1) {
      const all = Array.from(this.state.contractorIndex.keys()).sort((a,b)=>a.localeCompare(b));
      const frag = document.createDocumentFragment();
      all.forEach(name => {
        const opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        frag.appendChild(opt);
      });
      contractorFilter.appendChild(frag);
    }
    
    console.log('✅ Contractor matrix rendered successfully');
  },

  /**
   * Compute top contractor per trade for a company (from projects)
   * Returns: { tradeKey: {name, count} }
   */
  getTopContractorByTrade(companyName) {
    const rows = this.state.projects.filter(p => p.company === companyName);
    const trades = ['electrical','mechanical','interior_gc','marketing','staffing'];
    const counts = Object.fromEntries(trades.map(t => [t, new Map()]));

    for (const p of rows) {
      const trade = (p.trade || this.getProjectSpecialty(p) || '').toLowerCase();
      const contractor = p.performed_by || p.contractor || p.vendor || p.subcontractor;
      if (!trade || !contractor) continue;
      if (!counts[trade]) continue;
      const m = counts[trade];
      m.set(contractor, (m.get(contractor) || 0) + 1);
    }

    const result = {};
    trades.forEach(t => {
      const m = counts[t];
      if (!m || m.size === 0) { result[t] = null; return; }
      const [name, count] = Array.from(m.entries()).sort((a,b)=>b[1]-a[1])[0];
      result[t] = { name, count };
    });
    return result;
  },

  /**
   * Show company map with all companies (kept)
   */
  showCompanyMap(companyId) {
    const selectedCompany = this.state.companies.find(c => c.normalized === companyId);
    if (!selectedCompany) return;

    const modal = this.createMapModal(selectedCompany);
    document.body.appendChild(modal);
    this.drawUSMap(selectedCompany);
    modal.style.display = 'block';
    modal.classList.add('active');
  },

  /**
   * Create map modal (kept)
   */
  createMapModal(selectedCompany) {
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
          <div style="display:flex; gap:20px; align-items:center; margin-bottom:20px;">
            <div style="display:flex; align-items:center; gap:8px;">
              <div style="width:0;height:0;border-left:8px solid transparent;border-right:8px solid transparent;border-bottom:16px solid var(--success-color);"></div>
              <span style="font-size:14px; font-weight:600;">Companies We Work With</span>
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
              <div style="width:0;height:0;border-left:8px solid transparent;border-right:8px solid transparent;border-bottom:16px solid var(--error-color);"></div>
              <span style="font-size:14px; font-weight:600;">Potential Opportunities</span>
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
              <div style="width:0;height:0;border-left:8px solid transparent;border-right:8px solid transparent;border-bottom:16px solid var(--primary-color); border:3px solid var(--primary-color);"></div>
              <span style="font-size:14px; font-weight:600;">${selectedCompany.name} (Selected)</span>
            </div>
          </div>
          <svg id="us-map-svg" width="100%" height="600" viewBox="0 0 900 500" style="background: var(--background-alt); border-radius: 8px;"></svg>
          <div id="company-stats" style="margin-top:20px; display:grid; grid-template-columns: repeat(auto-fit, minmax(200px,1fr)); gap:16px;"></div>
        </div>
      </div>
    `;
    return modal;
  },

  /**
   * Draw US map (kept, simplified)
   */
  drawUSMap(selectedCompany) {
    const svg = document.getElementById('us-map-svg');
    if (!svg) return;

    const stateCoordinates = {
      'AL': { x: 650, y: 350 }, 'AZ': { x: 250, y: 350 }, 'AR': { x: 550, y: 340 }, 'CA': { x: 100, y: 250 },
      'CO': { x: 380, y: 260 }, 'CT': { x: 820, y: 180 }, 'DE': { x: 800, y: 230 }, 'FL': { x: 700, y: 420 },
      'GA': { x: 680, y: 350 }, 'ID': { x: 250, y: 150 }, 'IL': { x: 600, y: 250 }, 'IN': { x: 640, y: 250 },
      'IA': { x: 550, y: 210 }, 'KS': { x: 480, y: 280 }, 'KY': { x: 650, y: 290 }, 'LA': { x: 580, y: 400 },
      'ME': { x: 850, y: 100 }, 'MD': { x: 780, y: 230 }, 'MA': { x: 840, y: 160 }, 'MI': { x: 650, y: 180 },
      'MN': { x: 550, y: 120 }, 'MS': { x: 600, y: 380 }, 'MO': { x: 550, y: 280 }, 'MT': { x: 350, y: 100 },
      'NE': { x: 480, y: 220 }, 'NV': { x: 180, y: 240 }, 'NH': { x: 840, y: 130 }, 'NJ': { x: 800, y: 210 },
      'NM': { x: 350, y: 350 }, 'NY': { x: 780, y: 150 }, 'NC': { x: 740, y: 310 }, 'ND': { x: 480, y: 100 },
      'OH': { x: 700, y: 230 }, 'OK': { x: 480, y: 340 }, 'OR': { x: 120, y: 120 }, 'PA': { x: 760, y: 200 },
      'RI': { x: 840, y: 180 }, 'SC': { x: 730, y: 340 }, 'SD': { x: 480, y: 160 }, 'TN': { x: 650, y: 320 },
      'TX': { x: 480, y: 400 }, 'UT': { x: 280, y: 260 }, 'VT': { x: 820, y: 120 }, 'VA': { x: 760, y: 280 },
      'WA': { x: 120, y: 60 },  'WV': { x: 730, y: 250 }, 'WI': { x: 600, y: 160 }, 'WY': { x: 370, y: 180 }
    };

    svg.innerHTML = '';

    const statesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    statesGroup.setAttribute('id', 'states');

    Object.entries(stateCoordinates).forEach(([state, coords]) => {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', coords.x); circle.setAttribute('cy', coords.y);
      circle.setAttribute('r', '15');
      circle.setAttribute('fill', 'var(--background)'); circle.setAttribute('stroke', 'var(--border)'); circle.setAttribute('stroke-width','1'); circle.setAttribute('opacity','0.8');
      statesGroup.appendChild(circle);

      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', coords.x); text.setAttribute('y', coords.y + 5);
      text.setAttribute('text-anchor', 'middle'); text.setAttribute('font-size','12'); text.setAttribute('fill', 'var(--text-secondary)');
      text.textContent = state;
      statesGroup.appendChild(text);
    });
    svg.appendChild(statesGroup);

    // Companies grouped by HQ with/without contractors (dynamic, from projects)
    const companiesByState = {};
    const stats = { withContractors: 0, withoutContractors: 0, selected: 1 };

    this.state.companies.forEach(company => {
      if (!company.hq_state || !stateCoordinates[company.hq_state]) return;
      if (!companiesByState[company.hq_state]) companiesByState[company.hq_state] = { withContractors: [], withoutContractors: [] };

      const hasProjects = this.state.projects.some(p => p.company === company.name);
      if (hasProjects) { companiesByState[company.hq_state].withContractors.push(company); stats.withContractors++; }
      else { companiesByState[company.hq_state].withoutContractors.push(company); stats.withoutContractors++; }
    });

    const arrowsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    arrowsGroup.setAttribute('id', 'arrows');

    Object.entries(companiesByState).forEach(([state, bucket]) => {
      const coords = stateCoordinates[state];
      let offset = 0;

      const draw = (company, color, selected) => {
        const angle = (offset * 45) * Math.PI / 180;
        const distance = 35;
        const x = coords.x + Math.cos(angle) * distance;
        const y = coords.y + Math.sin(angle) * distance;
        this.drawArrow(arrowsGroup, x, y, coords.x, coords.y, selected ? 'var(--primary-color)' : color, company.name, selected);
        offset++;
      };

      bucket.withContractors.forEach(c => draw(c, 'var(--success-color)', c.normalized === selectedCompany.normalized));
      bucket.withoutContractors.forEach(c => draw(c, 'var(--error-color)',   c.normalized === selectedCompany.normalized));
    });
    svg.appendChild(arrowsGroup);

    const statsDiv = document.getElementById('company-stats');
    if (statsDiv) {
      statsDiv.innerHTML = `
        <div class="card" style="text-align:center; padding:16px;">
          <div style="font-size:24px; font-weight:bold; color:var(--success-color);">${stats.withContractors}</div>
          <div style="font-size:12px; color:var(--text-secondary);">Active Relationships</div>
        </div>
        <div class="card" style="text-align:center; padding:16px;">
          <div style="font-size:24px; font-weight:bold; color:var(--error-color);">${stats.withoutContractors}</div>
          <div style="font-size:12px; color:var(--text-secondary);">Potential Opportunities</div>
        </div>
        <div class="card" style="text-align:center; padding:16px;">
          <div style="font-size:24px; font-weight:bold; color:var(--primary-color);">${Object.keys(companiesByState).length}</div>
          <div style="font-size:12px; color:var(--text-secondary);">States with Presence</div>
        </div>
        <div class="card" style="text-align:center; padding:16px;">
          <div style="font-size:24px; font-weight:bold; color:var(--primary-color);">${this.state.companies.length}</div>
          <div style="font-size:12px; color:var(--text-secondary);">Total Companies</div>
        </div>
      `;
    }
  },

  /**
   * Draw an arrow (kept)
   */
  drawArrow(parent, x1, y1, x2, y2, color, label, isSelected) {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.style.cursor = 'pointer';

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

    group.addEventListener('mouseenter', () => { arrow.setAttribute('opacity', '1'); arrow.setAttribute('transform', `scale(1.2)`); arrow.style.transformOrigin = `${x1}px ${y1}px`; });
    group.addEventListener('mouseleave', () => { arrow.setAttribute('opacity', isSelected ? '1' : '0.8'); arrow.setAttribute('transform', 'scale(1)'); });

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
    if (modal) modal.remove();
  },

  /**
   * Render Location Intelligence (upgraded with contractors + last project)
   */
  renderLocationIntelligence() {
    console.log('📍 Rendering location intelligence...');
    
    const tbody = document.getElementById('intel-locations-body');
    if (!tbody) {
      console.warn('⚠️ Location intelligence table body not found (#intel-locations-body)');
      return;
    }

    if (this.state.locations.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="table-empty">No locations found</td></tr>';
      return;
    }

    const rows = this.state.locations.map(location => {
      const company = this.state.companies.find(c => c.normalized === location.company);
      if (!company) return '';

      // Contacts at this location
      const locationContacts = this.state.contacts.filter(c => c.company === location.company && c.location === location.name);

      // Last contacted
      let lastContacted = '—';
      let daysAgo = null;
      if (locationContacts.length > 0) {
        const dates = locationContacts.filter(c => c.last_contacted).map(c => new Date(c.last_contacted));
        if (dates.length > 0) {
          const mostRecent = new Date(Math.max(...dates));
          lastContacted = mostRecent.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
          const today = new Date(); daysAgo = Math.floor((today - mostRecent) / (1000 * 60 * 60 * 24));
        }
      }

      // Contractors at this location (from projects)
      const locProjects = this.state.projects.filter(p => p.company === company.name && p.location === location.name);
      const locContractors = [];
      const seen = new Set();
      for (const p of locProjects) {
        const spec = (p.trade || this.getProjectSpecialty(p));
        const contractor = p.performed_by || p.contractor || p.vendor || p.subcontractor;
        if (!contractor || !spec) continue;
        const key = `${contractor}::${spec}`;
        if (!seen.has(key)) { seen.add(key); locContractors.push({ name: contractor, specialty: spec }); }
      }

      // Status
      let status = '', statusBadge = '';
      if (locationContacts.length === 0) { status = 'Unserved'; statusBadge = 'badge-error'; }
      else if (daysAgo === null) { status = 'Never Contacted'; statusBadge = 'badge-warning'; }
      else if (daysAgo > 90) { status = 'Overdue'; statusBadge = 'badge-error'; }
      else if (daysAgo > 60) { status = 'Needs Attention'; statusBadge = 'badge-warning'; }
      else if (daysAgo > 30) { status = 'Active'; statusBadge = 'badge-info'; }
      else { status = 'Recently Contacted'; statusBadge = 'badge-success'; }

      // Last project at this site
      const lastProject = locProjects
        .map(p => new Date(p.performed_on || p.end || p.start || 0).getTime())
        .filter(Boolean).sort((a,b)=>b-a)[0];
      const lastProjectTxt = lastProject ? new Date(lastProject).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

      return `
        <tr class="${status === 'Unserved' || status === 'Overdue' ? 'table-row-warning' : ''}">
          <td>
            <strong>${company.name}</strong>
            <div style="font-size:11px; color:var(--text-muted);">${company.tier} • ${company.status}</div>
          </td>
          <td>${location.name}</td>
          <td>${location.city}, ${location.state}</td>
          <td>
            <strong>${locationContacts.length}</strong>
            ${locationContacts.length > 0 ? `
              <div style="font-size:11px; color:var(--text-muted);">
                ${locationContacts.map(c => `${c.first} ${c.last}`).slice(0, 2).join(', ')}
                ${locationContacts.length > 2 ? `+${locationContacts.length - 2}` : ''}
              </div>` : ''}
          </td>
          <td>
            ${lastContacted}
            ${daysAgo !== null ? `<div style="font-size:11px; color:var(--text-muted);">${daysAgo} days ago</div>` : ''}
          </td>
          <td>${lastProjectTxt}</td>
          <td>
            ${locContractors.length ? `
              <div style="display:flex; gap:4px; flex-wrap:wrap;">
                ${locContractors.slice(0,4).map(c => `
                  <span class="badge" style="font-size:10px; background:${this.stringToHslColor(c.name)}20; color:${this.stringToHslColor(c.name, true)}; border:1px solid ${this.stringToHslColor(c.name, true)}33;">
                    ${c.name} <span style="opacity:.7;">(${this.prettyTrade(c.specialty)})</span>
                  </span>`).join('')}
                ${locContractors.length > 4 ? `<span class="badge badge-secondary" style="font-size:10px;">+${locContractors.length - 4} more</span>` : ''}
              </div>` : '<span class="text-muted">—</span>'}
          </td>
          <td><span class="badge ${statusBadge}">${status}</span></td>
        </tr>
      `;
    }).filter(Boolean).join('');

    tbody.innerHTML = rows || '<tr><td colspan="8" class="table-empty">No location data available</td></tr>';
    console.log('✅ Location intelligence rendered successfully');
  },

  /**
   * Render Trade-Swap Intelligence (top connections)
   * Writes into #intel-swaps (or #intel-relationships) if present.
   */
  renderTradeSwapSection() {
    console.log('🔗 Rendering trade-swap section...');
    
    const container = document.getElementById('intel-swaps') || document.getElementById('intel-relationships');
    if (!container) {
      console.warn('⚠️ Trade-swap container not found (#intel-swaps or #intel-relationships)');
      return;
    }

    if (this.state.connectionData.length === 0) {
      container.innerHTML = '<div class="table-empty">No trade-swap introduction opportunities found</div>';
      return;
    }

    const top = this.state.connectionData.slice(0, 8);
    const pretty = (s) => this.prettyTrade(s);
    const badge = (txt) => `<span class="badge badge-secondary" style="font-size:10px;">${txt}</span>`;

    container.innerHTML = `
      <div style="display:grid; gap:12px;">
        ${top.map(conn => {
          const totalIntros = conn.pairs.reduce((acc, p) => acc + p.introsAtoB.length + p.introsBtoA.length, 0);
          return `
            <div class="card" style="padding:16px; border-left:4px solid var(--success-color);">
              <div style="display:flex; justify-content:space-between; align-items:start;">
                <div>
                  <div style="font-weight:700;">${conn.contractorA} ↔ ${conn.contractorB}</div>
                  <div style="display:flex; gap:6px; flex-wrap:wrap; margin-top:6px;">
                    ${badge('Trade-Swap')}
                    ${badge(`Total intros: ${totalIntros}`)}
                    ${badge(`Score: ${conn.potentialValue}`)}
                  </div>
                </div>
              </div>
              <div style="margin-top:10px;">
                ${conn.pairs.slice(0,3).map(p => `
                  <div style="padding:10px; border:1px dashed var(--border-color); border-radius:8px; margin-bottom:8px;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                      <div style="font-weight:600;">${p.company}</div>
                      <span class="badge badge-secondary" style="font-size:10px;">${p.tier}</span>
                    </div>
                    <div style="font-size:12px; color:var(--text-secondary); margin-top:6px;">
                      ${conn.contractorA} (${pretty(p.aSpecialty)}) can intro ${conn.contractorB} at <strong>${p.introsAtoB.length}</strong> site(s);
                      ${conn.contractorB} (${pretty(p.bSpecialty)}) can intro ${conn.contractorA} at <strong>${p.introsBtoA.length}</strong> site(s).
                    </div>
                  </div>
                `).join('')}
                ${conn.pairs.length > 3 ? `<div style="font-size:12px; color:var(--text-muted);">+${conn.pairs.length - 3} more clients</div>` : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
    
    console.log('✅ Trade-swap section rendered successfully');
  },

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    console.log('🎧 Setting up event listeners...');
    
    const searchInput = document.getElementById('intel-search');
    if (searchInput) {
      searchInput.addEventListener('input', Utils.debounce((e) => {
        this.state.filters.search = (e.target.value || '').toLowerCase();
        this.applyFilters();
      }, 300));
    }

    const contractorFilter = document.getElementById('contractor-filter');
    if (contractorFilter) {
      contractorFilter.addEventListener('change', (e) => {
        this.state.filters.contractor = e.target.value || 'all';
        this.applyFilters();
      });
    }

    const exportMatrixBtn = document.getElementById('export-matrix-btn');
    if (exportMatrixBtn) exportMatrixBtn.addEventListener('click', () => this.exportMatrix());

    const exportLocationsBtn = document.getElementById('export-locations-btn');
    if (exportLocationsBtn) exportLocationsBtn.addEventListener('click', () => this.exportLocations());
  },

  /**
   * Apply filters to data
   */
  applyFilters() {
    this.renderContractorMatrix();
    this.renderLocationIntelligence();
    this.renderTradeSwapSection();
  },

  /**
   * Export contractor matrix to CSV (dynamic, from projects)
   */
  exportMatrix() {
    const rows = this.state.companies.map(company => {
      const topByTrade = this.getTopContractorByTrade(company.name);
      const summary = this.state.summariesByCompany.get(company.name) || [];
      return {
        'Company': company.name,
        'Tier': company.tier,
        'Status': company.status,
        'HQ State': company.hq_state,
        'Electrical (Top)': topByTrade.electrical?.name || '',
        'Electrical (#Projects)': topByTrade.electrical?.count || 0,
        'Mechanical (Top)': topByTrade.mechanical?.name || '',
        'Mechanical (#Projects)': topByTrade.mechanical?.count || 0,
        'Interior GC (Top)': topByTrade.interior_gc?.name || '',
        'Interior GC (#Projects)': topByTrade.interior_gc?.count || 0,
        'Marketing (Top)': topByTrade.marketing?.name || '',
        'Marketing (#Projects)': topByTrade.marketing?.count || 0,
        'Staffing (Top)': topByTrade.staffing?.name || '',
        'Staffing (#Projects)': topByTrade.staffing?.count || 0,
        'Worked By (summary)': summary.map(s => `${s.contractor} [${Array.from(s.trades).join('|')}] x${s.count}`).join('; ')
      };
    });

    Utils.exportToCSV(rows, `contractor-intelligence-${new Date().toISOString().split('T')[0]}.csv`);
    if (window.App) App.showToast('Contractor intelligence exported', 'success');
  },

  /**
   * Export location intelligence to CSV (with freshness + contractors)
   */
  exportLocations() {
    const data = [];
    this.state.locations.forEach(location => {
      const company = this.state.companies.find(c => c.normalized === location.company);

      const locationContacts = this.state.contacts.filter(c => c.company === location.company && c.location === location.name);

      let lastContacted = '';
      if (locationContacts.length > 0) {
        const dates = locationContacts.filter(c => c.last_contacted).map(c => new Date(c.last_contacted));
        if (dates.length > 0) {
          const mostRecent = new Date(Math.max(...dates));
          lastContacted = mostRecent.toISOString();
        }
      }

      // Contractors at this location
      const locProjects = this.state.projects.filter(p => p.company === company?.name && p.location === location.name);
      const contractorsList = [];
      const seen = new Set();
      for (const p of locProjects) {
        const spec = (p.trade || this.getProjectSpecialty(p));
        const contractor = p.performed_by || p.contractor || p.vendor || p.subcontractor;
        if (!contractor || !spec) continue;
        const key = `${contractor}::${spec}`;
        if (!seen.has(key)) { seen.add(key); contractorsList.push(`${contractor} (${this.prettyTrade(spec)})`); }
      }

      data.push({
        'Company': company?.name || location.company,
        'Location': location.name,
        'City': location.city,
        'State': location.state,
        'ZIP': location.zip,
        'Contact Count': locationContacts.length,
        'Contacts': locationContacts.map(c => `${c.first} ${c.last}`).join('; '),
        'Last Contacted (ISO)': lastContacted || '',
        'Contractors @Location': contractorsList.join('; ')
      });
    });

    Utils.exportToCSV(data, `location-intelligence-${new Date().toISOString().split('T')[0]}.csv`);
    if (window.App) App.showToast('Location intelligence exported', 'success');
  },

  /**
   * Error state
   */
  showError() {
    console.error('🚨 Showing error state');
    ['intel-companies', 'intel-locations', 'intel-contacts', 'intel-unserved'].forEach(id => this.setText(id, 'Error'));
    const matrixBody = document.getElementById('intel-matrix-body');
    if (matrixBody) matrixBody.innerHTML = '<tr><td colspan="7" class="table-empty">Error loading contractor matrix</td></tr>';
    const locationsBody = document.getElementById('intel-locations-body');
    if (locationsBody) locationsBody.innerHTML = '<tr><td colspan="8" class="table-empty">Error loading location intelligence</td></tr>';
    const swaps = document.getElementById('intel-swaps');
    if (swaps) swaps.innerHTML = '<div class="table-empty">Error loading trade-swap intelligence</div>';
  },

  /**
   * Refresh component
   */
  async refresh() {
    console.log('🔄 Refreshing Intelligence Component...');
    await this.loadData();
    await this.analyze();
    this.renderSummary();
    this.renderContractorMatrix();
    this.renderLocationIntelligence();
    this.renderTradeSwapSection();
  },

  /* ----------------------- Helpers ----------------------- */

  /**
   * Determine a project's specialty (trade).
   */
  getProjectSpecialty(project) {
    const raw = (project.trade || project.specialty || project.category || '').toString().toLowerCase().trim();
    if (raw) return raw;

    const job = (project.job || '').toString().toLowerCase();
    if (/(electrical|panel|lighting|switchgear|transformer|breaker|feeder|conduit|power)/.test(job)) return 'electrical';
    if (/(mechanical|hvac|air handler|chiller|boiler|duct|vav|rtu|cooling|heating)/.test(job)) return 'mechanical';
    if (/(interior|fit[-\s]?out|fitout|tenant|build[-\s]?out|gc\b|general contractor)/.test(job)) return 'interior_gc';
    if (/(marketing|brand|signage|campaign|promo)/.test(job)) return 'marketing';
    if (/(staffing|temp labor|labor hire|recruit)/.test(job)) return 'staffing';
    return '';
  },

  prettyTrade(spec) {
    const names = { electrical: 'Electrical', mechanical: 'Mechanical', interior_gc: 'Interior GC', marketing: 'Marketing', staffing: 'Staffing' };
    return names[(spec || '').toLowerCase()] || spec || '—';
  },

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

  stringToHslColor(str, darkText = false) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    const h = Math.abs(hash) % 360;
    const s = 65; const l = darkText ? 35 : 60;
    return `hsl(${h} ${s}% ${l}%)`;
  }
};

// Make available globally
window.IntelligenceComponent = IntelligenceComponent;

console.log('🕵️ Intelligence Component loaded (vNext - Fixed & Enhanced)');
