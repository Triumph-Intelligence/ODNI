/**
 * Enhanced Dashboard Component with Interactive US Map (v2)
 * Complete replacement for components/dashboard.js
 * - Auto-loads all companies from MockData if DataService is empty/missing fields
 * - Includes all contractors (Guercio, KMP, Red Door, Byers, Fritz, Stable Works, Myers)
 * - True filtering by contractor + company search
 * - Toggleable connection arcs + state density bubbles
 * - Much better tooltips and reliable zoom/pan behavior
 */

const DashboardComponent = {
  // Component state
  state: {
    companies: [],
    locations: [],
    contacts: [],
    gifts: [],
    referrals: [],
    opportunities: [],
    projects: [],
    changeLog: [],
    selectedCompanies: new Set(),
    selectedContractors: new Set(),
    zoomLevel: 1,
    panX: 0,
    panY: 0,
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0,
    hoveredLocation: null,
    searchTerm: '',
    currentOrg: null,
    showConnections: true,
    showStateLabels: true,
    showStateDensity: true, // NEW: toggle state density “bubbles”
  },

  // US State coordinates (centroids)
  stateCoords: {
    'AL': { x: 730, y: 430, name: 'Alabama' },
    'AK': { x: 150, y: 550, name: 'Alaska' },
    'AZ': { x: 250, y: 400, name: 'Arizona' },
    'AR': { x: 650, y: 400, name: 'Arkansas' },
    'CA': { x: 150, y: 300, name: 'California' },
    'CO': { x: 400, y: 320, name: 'Colorado' },
    'CT': { x: 920, y: 220, name: 'Connecticut' },
    'DE': { x: 880, y: 280, name: 'Delaware' },
    'FL': { x: 800, y: 520, name: 'Florida' },
    'GA': { x: 770, y: 450, name: 'Georgia' },
    'HI': { x: 300, y: 580, name: 'Hawaii' },
    'ID': { x: 280, y: 180, name: 'Idaho' },
    'IL': { x: 680, y: 300, name: 'Illinois' },
    'IN': { x: 730, y: 300, name: 'Indiana' },
    'IA': { x: 630, y: 260, name: 'Iowa' },
    'KS': { x: 550, y: 340, name: 'Kansas' },
    'KY': { x: 750, y: 350, name: 'Kentucky' },
    'LA': { x: 650, y: 480, name: 'Louisiana' },
    'ME': { x: 940, y: 140, name: 'Maine' },
    'MD': { x: 860, y: 290, name: 'Maryland' },
    'MA': { x: 930, y: 210, name: 'Massachusetts' },
    'MI': { x: 740, y: 230, name: 'Michigan' },
    'MN': { x: 630, y: 180, name: 'Minnesota' },
    'MS': { x: 680, y: 450, name: 'Mississippi' },
    'MO': { x: 640, y: 340, name: 'Missouri' },
    'MT': { x: 350, y: 150, name: 'Montana' },
    'NE': { x: 530, y: 280, name: 'Nebraska' },
    'NV': { x: 220, y: 300, name: 'Nevada' },
    'NH': { x: 930, y: 180, name: 'New Hampshire' },
    'NJ': { x: 890, y: 260, name: 'New Jersey' },
    'NM': { x: 380, y: 420, name: 'New Mexico' },
    'NY': { x: 870, y: 210, name: 'New York' },
    'NC': { x: 820, y: 390, name: 'North Carolina' },
    'ND': { x: 530, y: 150, name: 'North Dakota' },
    'OH': { x: 780, y: 290, name: 'Ohio' },
    'OK': { x: 550, y: 410, name: 'Oklahoma' },
    'OR': { x: 180, y: 170, name: 'Oregon' },
    'PA': { x: 840, y: 260, name: 'Pennsylvania' },
    'RI': { x: 940, y: 220, name: 'Rhode Island' },
    'SC': { x: 810, y: 420, name: 'South Carolina' },
    'SD': { x: 530, y: 220, name: 'South Dakota' },
    'TN': { x: 740, y: 390, name: 'Tennessee' },
    'TX': { x: 520, y: 470, name: 'Texas' },
    'UT': { x: 300, y: 310, name: 'Utah' },
    'VT': { x: 910, y: 170, name: 'Vermont' },
    'VA': { x: 830, y: 330, name: 'Virginia' },
    'WA': { x: 180, y: 100, name: 'Washington' },
    'WV': { x: 800, y: 320, name: 'West Virginia' },
    'WI': { x: 680, y: 210, name: 'Wisconsin' },
    'WY': { x: 380, y: 240, name: 'Wyoming' }
  },

  // Contractor colors (includes all you asked for)
  contractorColors: {
    'Guercio Energy Group': '#6366f1',
    'Myers Industrial Services': '#ec4899',
    'KMP': '#f59e0b',
    'Stable Works': '#10b981',
    'Red Door': '#ef4444',
    'Fritz Staffing': '#06b6d4',
    'Byers': '#8b5cf6'
  },

  /**
   * Initialize dashboard
   */
  async init() {
    console.log('📊 Dashboard initializing...');
    await this.loadData();
    await this.render();
    this.setupEventListeners();
  },

  /**
   * Load data (with MockData fallback/merge)
   */
  async loadData() {
    // current org (optional filter)
    this.state.currentOrg = (window.VisibilityService?.getCurrentOrg?.() ?? null);

    // try cache/services
    const [
      companiesDS = [],
      contactsDS = [],
      giftsDS = [],
      referralsDS = [],
      opportunitiesDS = [],
      projectsDS = [],
      changeLogDS = [],
      locationsDS = []
    ] = await Promise.all([
      window.DataService?.getCompanies?.(),
      window.DataService?.getContacts?.(),
      window.DataService?.getGifts?.(),
      window.DataService?.getReferrals?.(),
      window.DataService?.getOpportunities?.(),
      window.DataService?.getProjects?.(),
      window.DataService?.getChangeLog?.(),
      window.DataService?.getLocations?.()
    ]);

    // merge with MockData if present (ensures “include all companies with mock data”)
    const MD = window.MockData || {};
    const companies = this._mergeUniqueBy(companiesDS || [], MD.companies || [], 'normalized');
    const contacts = this._mergeUniqueBy(contactsDS || [], MD.contacts || [], 'email');
    const gifts = this._mergeUniqueBy(giftsDS || [], MD.gifts || [], (g) => `${g.contact_email}|${g.date}|${g.description}`);
    const referrals = this._mergeUniqueBy(referralsDS || [], MD.referrals || [], (r) => `${r.referred_name}|${r.company}|${r.followup_date}`);
    const opportunities = this._mergeUniqueBy(opportunitiesDS || [], MD.opportunities || [], (o) => `${o.company}|${o.location}|${o.job}`);
    const projects = this._mergeUniqueBy(projectsDS || [], MD.projects || [], (p) => p.project_code || `${p.company}|${p.location}|${p.job}|${p.performed_on}`);
    const changeLog = this._mergeUniqueBy(changeLogDS || [], MD.changeLog || [], 'timestamp');
    const locations = this._mergeUniqueBy(locationsDS || [], MD.locations || [], (l) => `${l.company}|${l.name}`);

    // optional org visibility filters (no-op if service not present)
    const V = window.VisibilityService || {};
    this.state.companies   = (V.filterCompanies?.(companies, this.state.currentOrg) ?? companies);
    this.state.contacts    = (V.filterContacts?.(contacts, companies, this.state.currentOrg) ?? contacts);
    this.state.gifts       = (V.filterGifts?.(gifts, contacts, companies, this.state.currentOrg) ?? gifts);
    this.state.referrals   = (V.filterReferrals?.(referrals, contacts, companies, this.state.currentOrg) ?? referrals);
    this.state.opportunities = (V.filterOpportunities?.(opportunities, companies, this.state.currentOrg) ?? opportunities);
    this.state.projects    = (V.filterProjects?.(projects, companies, this.state.currentOrg) ?? projects);
    this.state.changeLog   = (V.filterChangeLog?.(changeLog, this.state.currentOrg) ?? changeLog);
    this.state.locations   = (V.filterLocations?.(locations, companies, this.state.currentOrg) ?? locations);

    // Select all companies by default
    this.state.selectedCompanies.clear();
    this.state.companies.forEach(c => this.state.selectedCompanies.add(c.name));

    // Select ALL contractors by default (includes Guercio, KMP, Red Door, Byers, Fritz, Stable Works, Myers)
    this.state.selectedContractors = new Set(this.getUniqueContractors());
  },

  // helper: merge arrays by key or key-fn
  _mergeUniqueBy(a, b, keyOrFn) {
    const keyFn = typeof keyOrFn === 'function' ? keyOrFn : (x) => x?.[keyOrFn];
    const map = new Map();
    for (const item of [...a, ...b]) {
      const k = keyFn(item);
      if (k == null) continue;
      if (!map.has(k)) map.set(k, item);
    }
    return [...map.values()];
  },

  /**
   * Render dashboard
   */
  async render() {
    this.renderStatistics();
    this.renderMap();
    this.renderControlPanel();
    this.renderCompanyList();
    this.renderLegend();
  },

  /**
   * Render statistics cards
   */
  renderStatistics() {
    const statsHTML = `
      <div class="card-grid" style="margin-bottom: 24px;">
        <div class="card kpi-card">
          <div class="kpi-value">${this.state.companies.length}</div>
          <div class="kpi-label">Total Companies</div>
        </div>
        <div class="card kpi-card">
          <div class="kpi-value">${this.state.locations.length}</div>
          <div class="kpi-label">Total Locations</div>
        </div>
        <div class="card kpi-card">
          <div class="kpi-value">${this.state.projects.length}</div>
          <div class="kpi-label">Active Projects</div>
        </div>
        <div class="card kpi-card">
          <div class="kpi-value">${this.getUniqueContractors().length}</div>
          <div class="kpi-label">Active Contractors</div>
        </div>
      </div>
    `;
    const statsContainer = document.getElementById('dashboard-stats');
    if (statsContainer) statsContainer.innerHTML = statsHTML;
  },

  /**
   * Render interactive US map
   */
  renderMap() {
    const mapContainer = document.getElementById('us-map-container');
    if (!mapContainer) return;

    // Preserve current transform across re-renders
    const { zoomLevel, panX, panY } = this.state;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = 'us-map-svg';
    svg.setAttribute('viewBox', '0 0 1000 600');
    svg.style.width = '100%';
    svg.style.height = '600px';
    svg.style.background = 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)';
    svg.style.borderRadius = '12px';
    svg.style.cursor = 'grab';

    // Create main group for zoom/pan
    const mainGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    mainGroup.id = 'map-main-group';

    // Draw states (grid points + labels)
    this.drawStates(mainGroup);

    // State density bubbles (toggle)
    if (this.state.showStateDensity) {
      this.drawStateDensity(mainGroup);
    }

    // Draw connections between locations (toggle)
    if (this.state.showConnections) {
      this.drawConnections(mainGroup);
    }

    // Draw location markers
    this.drawLocations(mainGroup);

    svg.appendChild(mainGroup);
    mapContainer.innerHTML = '';
    mapContainer.appendChild(svg);

    // Restore transform
    this.state.zoomLevel = zoomLevel;
    this.state.panX = panX;
    this.state.panY = panY;
    this.updateTransform();
  },

  /**
   * Draw US states (centroid dots + labels)
   */
  drawStates(container) {
    const statesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    statesGroup.id = 'states-group';

    Object.entries(this.stateCoords).forEach(([stateCode, coords]) => {
      const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');

      // Base circle
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', coords.x);
      circle.setAttribute('cy', coords.y);
      circle.setAttribute('r', '18');
      circle.setAttribute('fill', 'rgba(226, 232, 240, 0.25)');
      circle.setAttribute('stroke', '#cbd5e1');
      circle.setAttribute('stroke-width', '1');

      group.appendChild(circle);

      // State label (toggle visibility)
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', coords.x);
      text.setAttribute('y', coords.y + 5);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('font-size', '11');
      text.setAttribute('font-weight', '600');
      text.setAttribute('fill', '#64748b');
      text.textContent = stateCode;
      text.style.display = this.state.showStateLabels ? 'block' : 'none';

      group.appendChild(text);

      // Tooltip (native)
      const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
      title.textContent = coords.name;
      group.appendChild(title);

      statesGroup.appendChild(group);
    });

    container.appendChild(statesGroup);
  },

  /**
   * Draw state density bubbles sized by number of filtered locations
   */
  drawStateDensity(container) {
    const densityGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    densityGroup.id = 'state-density-group';

    // Count filtered locations per state
    const counts = {};
    const filteredLocs = this._getFilteredLocationsForMap();
    filteredLocs.forEach(loc => {
      counts[loc.state] = (counts[loc.state] ?? 0) + 1;
    });

    // scale radius: 0 -> 0, max -> ~24
    const values = Object.values(counts);
    const max = values.length ? Math.max(...values) : 0;

    Object.entries(this.stateCoords).forEach(([stateCode, coords]) => {
      const count = counts[stateCode] ?? 0;
      if (!count) return;

      const r = 6 + (max ? Math.round((count / max) * 18) : 0);

      const bubble = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      bubble.setAttribute('cx', coords.x);
      bubble.setAttribute('cy', coords.y);
      bubble.setAttribute('r', String(r));
      bubble.setAttribute('fill', 'rgba(99,102,241,0.12)'); // soft indigo
      bubble.setAttribute('stroke', '#6366f1');
      bubble.setAttribute('stroke-width', '1');

      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', coords.x);
      label.setAttribute('y', coords.y - r - 4);
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('font-size', '10');
      label.setAttribute('font-weight', '700');
      label.setAttribute('fill', '#475569');
      label.textContent = count;

      densityGroup.appendChild(bubble);
      densityGroup.appendChild(label);
    });

    container.appendChild(densityGroup);
  },

  /**
   * Draw connections between locations for the same company
   * - Only draws paths for visible companies and filtered contractors
   * - Color attempts: if both endpoints share at least one contractor, use that color; else neutral
   */
  drawConnections(container) {
    const connectionsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    connectionsGroup.id = 'connections-group';

    // Group locations by company (filtered)
    const locationsByCompany = new Map();
    const filteredLocs = this._getFilteredLocationsForMap();

    filteredLocs.forEach(loc => {
      const company = this.state.companies.find(c => c.normalized === loc.company);
      if (!company || !this.state.selectedCompanies.has(company.name)) return;

      if (!locationsByCompany.has(company.name)) locationsByCompany.set(company.name, []);
      locationsByCompany.get(company.name).push(loc);
    });

    // Draw curves
    locationsByCompany.forEach((locations) => {
      if (locations.length < 2) return;

      // build contractor set by location based on filtered projects
      const contractorsByLocation = new Map();
      locations.forEach(loc => {
        const contractors = this._contractorsForCompanyLocation(loc);
        contractorsByLocation.set(loc.name, contractors);
      });

      for (let i = 0; i < locations.length; i++) {
        for (let j = i + 1; j < locations.length; j++) {
          const loc1 = locations[i];
          const loc2 = locations[j];
          const coord1 = this.getLocationCoords(loc1);
          const coord2 = this.getLocationCoords(loc2);
          if (!coord1 || !coord2) continue;

          const set1 = contractorsByLocation.get(loc1.name) || new Set();
          const set2 = contractorsByLocation.get(loc2.name) || new Set();
          const shared = [...set1].filter(s => set2.has(s));
          const color = shared.length ? (this.contractorColors[shared[0]] || '#94a3b8') : '#cbd5e1';

          // curvature
          const midX = (coord1.x + coord2.x) / 2;
          const midY = (coord1.y + coord2.y) / 2;
          const dx = coord2.x - coord1.x;
          const dy = coord2.y - coord1.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const curve = dist * 0.19;

          const controlX = midX - dy / dist * curve;
          const controlY = midY + dx / dist * curve;

          const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          path.setAttribute('d', `M ${coord1.x} ${coord1.y} Q ${controlX} ${controlY} ${coord2.x} ${coord2.y}`);
          path.setAttribute('fill', 'none');
          path.setAttribute('stroke', color);
          path.setAttribute('stroke-width', '2.5');
          path.setAttribute('stroke-dasharray', shared.length ? '0' : '6,6');
          path.setAttribute('opacity', shared.length ? '0.8' : '0.35');
          path.style.transition = 'opacity .15s ease';

          // hover highlight
          path.addEventListener('mouseenter', () => path.setAttribute('opacity', '1'));
          path.addEventListener('mouseleave', () => path.setAttribute('opacity', shared.length ? '0.8' : '0.35'));

          connectionsGroup.appendChild(path);
        }
      }
    });

    container.appendChild(connectionsGroup);
  },

  /**
   * Draw location markers (filtered by contractors & selected companies)
   */
  drawLocations(container) {
    const locationsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    locationsGroup.id = 'locations-group';

    const filteredLocs = this._getFilteredLocationsForMap();

    filteredLocs.forEach(location => {
      const company = this.state.companies.find(c => c.normalized === location.company);
      if (!company || !this.state.selectedCompanies.has(company.name)) return;

      const coords = this.getLocationCoords(location);
      if (!coords) return;

      const contractors = this._contractorsForCompanyLocation(location);
      if (!this._anyContractorSelected(contractors)) return;

      const node = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      node.style.cursor = 'pointer';
      node.dataset.company = company.name;
      node.dataset.location = location.name;

      // Location pin group (with its own translate only)
      const pin = this.createLocationPin(coords.x, coords.y, contractors, company);
      node.appendChild(pin);

      // Hover / Tooltip
      node.addEventListener('mouseenter', () => {
        this.showLocationTooltip(company, location, contractors);
        // keep translate and add scale
        const baseTransform = `translate(${coords.x}, ${coords.y})`;
        pin.setAttribute('transform', `${baseTransform} scale(1.2)`);
      });

      node.addEventListener('mouseleave', () => {
        this.hideLocationTooltip();
        const baseTransform = `translate(${coords.x}, ${coords.y})`;
        pin.setAttribute('transform', `${baseTransform} scale(1)`);
      });

      // Click to “lock” tooltip
      node.addEventListener('click', (e) => {
        e.stopPropagation();
        this.showLocationTooltip(company, location, contractors, true);
      });

      locationsGroup.appendChild(node);
    });

    container.appendChild(locationsGroup);
  },

  /**
   * Location pin
   */
  createLocationPin(x, y, contractors, company) {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('transform', `translate(${x}, ${y}) scale(1)`);

    const primaryContractor = Array.from(contractors)[0];
    const color = this.contractorColors[primaryContractor] || '#6366f1';

    // Shadow
    const ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    ellipse.setAttribute('cx', '0');
    ellipse.setAttribute('cy', '22');
    ellipse.setAttribute('rx', '6');
    ellipse.setAttribute('ry', '2');
    ellipse.setAttribute('fill', 'rgba(0,0,0,0.2)');

    // Pin body
    const pin = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    pin.setAttribute('d', 'M0,-20 C-8,-20 -12,-12 -12,-8 C-12,0 0,20 0,20 C0,20 12,0 12,-8 C12,-12 8,-20 0,-20 Z');
    pin.setAttribute('fill', color);
    pin.setAttribute('stroke', 'white');
    pin.setAttribute('stroke-width', '2');

    // White dot
    const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    dot.setAttribute('cx', '0');
    dot.setAttribute('cy', '-10');
    dot.setAttribute('r', '4');
    dot.setAttribute('fill', 'white');

    // Multiple contractors indicator
    if (contractors.size > 1) {
      const multiIndicator = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      multiIndicator.setAttribute('cx', '8');
      multiIndicator.setAttribute('cy', '-18');
      multiIndicator.setAttribute('r', '5');
      multiIndicator.setAttribute('fill', '#10b981');
      multiIndicator.setAttribute('stroke', 'white');
      multiIndicator.setAttribute('stroke-width', '1.5');

      const multiText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      multiText.setAttribute('x', '8');
      multiText.setAttribute('y', '-16');
      multiText.setAttribute('text-anchor', 'middle');
      multiText.setAttribute('font-size', '8');
      multiText.setAttribute('font-weight', 'bold');
      multiText.setAttribute('fill', 'white');
      multiText.textContent = contractors.size;

      g.appendChild(multiIndicator);
      g.appendChild(multiText);
    }

    g.appendChild(ellipse);
    g.appendChild(pin);
    g.appendChild(dot);

    return g;
  },

  /**
   * Get coordinates for a location
   * - Slight offset to avoid overlapping markers in the same state
   */
  getLocationCoords(location) {
    const stateCoord = this.stateCoords[location.state];
    if (!stateCoord) return null;

    const hash = location.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const offsetX = ((hash % 20) - 10) * 2;
    const offsetY = ((hash % 15) - 7) * 2;

    return { x: stateCoord.x + offsetX, y: stateCoord.y + offsetY };
  },

  /**
   * Render control panel
   */
  renderControlPanel() {
    const panel = document.getElementById('map-controls');
    if (!panel) return;

    panel.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 16px;">
        <!-- Search -->
        <div>
          <input 
            type="text" 
            id="company-search" 
            class="search-input" 
            placeholder="Search companies..."
            style="width: 100%;"
            value="${this.state.searchTerm}"
          >
        </div>

        <!-- Zoom Controls -->
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          <button class="btn btn-sm" id="zoom-in"><span style="font-size: 18px;">+</span> Zoom In</button>
          <button class="btn btn-sm" id="zoom-out"><span style="font-size: 18px;">−</span> Zoom Out</button>
          <button class="btn btn-sm" id="zoom-reset"><span style="font-size: 16px;">⟲</span> Reset</button>
        </div>

        <!-- Quick Actions -->
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          <button class="btn btn-sm btn-ghost" id="select-all">Select All</button>
          <button class="btn btn-sm btn-ghost" id="deselect-all">Deselect All</button>
        </div>

        <!-- Contractor Filter -->
        <div>
          <label style="font-size: 12px; font-weight: 600; color: var(--text-secondary); display: block; margin-bottom: 8px;">
            Filter by Contractor:
          </label>
          <div id="contractor-checkboxes" style="display: flex; flex-direction: column; gap: 6px;">
            ${this.renderContractorCheckboxes()}
          </div>
        </div>

        <!-- View Options -->
        <div>
          <label style="font-size: 12px; font-weight: 600; color: var(--text-secondary); display: block; margin-bottom: 8px;">
            View Options:
          </label>
          <div style="display: flex; flex-direction: column; gap: 6px;">
            <label style="display: flex; align-items: center; gap: 8px; font-size: 13px; cursor: pointer;">
              <input type="checkbox" id="show-connections" ${this.state.showConnections ? 'checked' : ''} style="cursor: pointer;">
              Show Connections
            </label>
            <label style="display: flex; align-items: center; gap: 8px; font-size: 13px; cursor: pointer;">
              <input type="checkbox" id="show-state-labels" ${this.state.showStateLabels ? 'checked' : ''} style="cursor: pointer;">
              Show State Labels
            </label>
            <label style="display: flex; align-items: center; gap: 8px; font-size: 13px; cursor: pointer;">
              <input type="checkbox" id="show-state-density" ${this.state.showStateDensity ? 'checked' : ''} style="cursor: pointer;">
              Show State Density
            </label>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Contractor checkboxes
   */
  renderContractorCheckboxes() {
    const contractors = this.getUniqueContractors();
    return contractors.map(contractor => {
      const color = this.contractorColors[contractor] || '#6366f1';
      const checked = this.state.selectedContractors.has(contractor) ? 'checked' : '';
      return `
        <label style="display: flex; align-items: center; gap: 8px; font-size: 13px; cursor: pointer;">
          <input 
            type="checkbox" 
            class="contractor-checkbox" 
            data-contractor="${contractor}"
            ${checked}
            style="cursor: pointer;"
          >
          <span style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; background: ${color};"></span>
          ${contractor}
        </label>
      `;
    }).join('');
  },

  /**
   * Render company list
   */
  renderCompanyList() {
    const list = document.getElementById('company-list');
    if (!list) return;

    const filteredCompanies = this.getFilteredCompanies();

    list.innerHTML = `
      <div style="max-height: 400px; overflow-y: auto;">
        ${filteredCompanies.map(company => {
          const isSelected = this.state.selectedCompanies.has(company.name);
          const locations = this.state.locations.filter(l => l.company === company.normalized);
          const locCount = locations.length;
          const activeProjects = this.state.projects.filter(p => p.company === company.name).length;

          return `
            <div 
              class="company-item" 
              data-company="${company.name}"
              style="
                padding: 12px;
                border-bottom: 1px solid var(--border-light);
                cursor: pointer;
                background: ${isSelected ? 'rgba(99, 102, 241, 0.05)' : 'transparent'};
                transition: all 0.2s;
              "
            >
              <div style="display: flex; align-items: center; gap: 12px;">
                <input 
                  type="checkbox" 
                  ${isSelected ? 'checked' : ''}
                  style="cursor: pointer;"
                  onclick="event.stopPropagation();"
                >
                <div style="flex: 1;">
                  <div style="font-weight: 600; font-size: 14px; color: var(--text-primary);">
                    ${company.name}
                  </div>
                  <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">
                    ${locCount} location${locCount !== 1 ? 's' : ''} • ${company.tier} • ${activeProjects} project${activeProjects !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  /**
   * Legend
   */
  renderLegend() {
    const legend = document.getElementById('map-legend');
    if (!legend) return;

    const contractors = this.getUniqueContractors();
    
    legend.innerHTML = `
      <div style="display: flex; flex-wrap: wrap; gap: 16px; align-items: center;">
        ${contractors.map(contractor => {
          const color = this.contractorColors[contractor] || '#6366f1';
          return `
            <div style="display: flex; align-items: center; gap: 6px;">
              <div style="width: 16px; height: 16px; border-radius: 50%; background: ${color}; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"></div>
              <span style="font-size: 12px; font-weight: 500; color: var(--text-secondary);">${contractor}</span>
            </div>
          `;
        }).join('')}
        <div style="display: flex; align-items: center; gap: 6px; margin-left: auto;">
          <div style="width: 20px; height: 20px; border-radius: 50%; background: #10b981; border: 2px solid white; color: white; font-size: 10px; font-weight: bold; display: flex; align-items: center; justify-content: center;">2+</div>
          <span style="font-size: 12px; font-weight: 500; color: var(--text-secondary);">Multiple Contractors</span>
        </div>
      </div>
    `;
  },

  /**
   * Tooltip
   */
  showLocationTooltip(company, location, contractors, lock = false) {
    let tooltip = document.getElementById('location-tooltip');
    
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.id = 'location-tooltip';
      tooltip.style.cssText = `
        position: fixed;
        background: white;
        border: 1px solid var(--border);
        border-radius: 8px;
        padding: 12px;
        box-shadow: var(--shadow-xl);
        z-index: 10000;
        pointer-events: none;
        max-width: 320px;
      `;
      document.body.appendChild(tooltip);
    }

    // projects for this company+location, filtered to selected contractors
    const projects = this.state.projects.filter(p => 
      p.company === company.name &&
      p.location === location.name &&
      (!p.performed_by || this.state.selectedContractors.has(p.performed_by))
    );

    const projectsHTML = projects.length
      ? projects.slice(0, 5).map(p => `
        <div style="margin-top: 6px; padding: 8px; border: 1px solid var(--border-light); border-radius: 6px;">
          <div style="font-size: 12px; font-weight: 600; color: var(--text-primary);">${p.job}</div>
          <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">
            ${p.trade ?? '-'} • ${p.work_type ?? '-'} • ${p.performed_on ?? (p.start ?? '')}
          </div>
          <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">
            <span style="display:inline-flex;align-items:center;gap:6px;">
              <span style="width:8px;height:8px;border-radius:50%;background:${this.contractorColors[p.performed_by] || '#64748b'}"></span>
              ${p.performed_by || '—'}
            </span>
          </div>
        </div>
      `).join('')
      : `<div style="font-size:12px;color:var(--text-muted);">No projects (with current contractor filter)</div>`;

    tooltip.innerHTML = `
      <div style="font-weight: 700; font-size: 14px; margin-bottom: 4px; color: var(--text-primary);">
        ${company.name}
      </div>
      <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 8px;">
        ${location.name}, ${location.city}, ${location.state}
      </div>
      <div style="font-size: 12px; margin-top: 8px;">
        <strong>Contractors:</strong><br>
        ${Array.from(contractors).map(c => `
          <div style="display: flex; align-items: center; gap: 6px; margin-top: 4px;">
            <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${this.contractorColors[c] || '#64748b'};"></span>
            ${c}
          </div>
        `).join('')}
      </div>
      <div style="font-size: 12px; margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--border-light);">
        <strong>${projects.length}</strong> project${projects.length !== 1 ? 's' : ''} (filtered)
        ${projectsHTML}
      </div>
    `;

    tooltip.style.display = 'block';
    tooltip.dataset.locked = lock ? '1' : '0';
  },

  hideLocationTooltip() {
    const tooltip = document.getElementById('location-tooltip');
    if (tooltip && tooltip.dataset.locked !== '1') tooltip.style.display = 'none';
  },

  updateTooltipPosition(e) {
    const tooltip = document.getElementById('location-tooltip');
    if (!tooltip || tooltip.style.display === 'none') return;

    // keep tooltip on-screen
    const pad = 12;
    const w = tooltip.offsetWidth || 280;
    const h = tooltip.offsetHeight || 150;
    let x = e.clientX + 15;
    let y = e.clientY + 15;
    if (x + w + pad > window.innerWidth)  x = window.innerWidth - w - pad;
    if (y + h + pad > window.innerHeight) y = window.innerHeight - h - pad;

    tooltip.style.left = x + 'px';
    tooltip.style.top = y + 'px';
  },

  /**
   * Event listeners
   */
  setupEventListeners() {
    // Search
    const searchInput = document.getElementById('company-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.state.searchTerm = e.target.value;
        this.renderCompanyList();
      });
    }

    // Zoom controls
    document.getElementById('zoom-in')?.addEventListener('click', () => this.zoom(1.3));
    document.getElementById('zoom-out')?.addEventListener('click', () => this.zoom(0.7));
    document.getElementById('zoom-reset')?.addEventListener('click', () => this.resetZoom());

    // Select all/none
    document.getElementById('select-all')?.addEventListener('click', () => {
      this.state.companies.forEach(c => this.state.selectedCompanies.add(c.name));
      this.render();
    });
    document.getElementById('deselect-all')?.addEventListener('click', () => {
      this.state.selectedCompanies.clear();
      this.render();
    });

    // Company list items
    document.querySelectorAll('.company-item').forEach(item => {
      item.addEventListener('click', () => {
        const companyName = item.dataset.company;
        const checkbox = item.querySelector('input[type="checkbox"]');
        
        if (this.state.selectedCompanies.has(companyName)) {
          this.state.selectedCompanies.delete(companyName);
          checkbox.checked = false;
        } else {
          this.state.selectedCompanies.add(companyName);
          checkbox.checked = true;
        }
        
        this.renderMap();
        this.renderLegend();
      });
    });

    // Contractor checkboxes
    document.querySelectorAll('.contractor-checkbox').forEach(cb => {
      cb.addEventListener('change', (e) => {
        const name = e.target.dataset.contractor;
        if (e.target.checked) {
          this.state.selectedContractors.add(name);
        } else {
          this.state.selectedContractors.delete(name);
        }
        this.renderMap();
      });
    });

    // View options
    const conns = document.getElementById('show-connections');
    if (conns) conns.addEventListener('change', (e) => {
      this.state.showConnections = !!e.target.checked;
      this.renderMap();
    });
    const labels = document.getElementById('show-state-labels');
    if (labels) labels.addEventListener('change', (e) => {
      this.state.showStateLabels = !!e.target.checked;
      // Just re-render states/labels quickly
      this.renderMap();
    });
    const density = document.getElementById('show-state-density');
    if (density) density.addEventListener('change', (e) => {
      this.state.showStateDensity = !!e.target.checked;
      this.renderMap();
    });

    // Map drag/pan/zoom
    const svg = document.getElementById('us-map-svg');
    if (svg) {
      svg.addEventListener('mousedown', (e) => this.startDrag(e));
      svg.addEventListener('mousemove', (e) => this.drag(e));
      svg.addEventListener('mouseup', () => this.endDrag());
      svg.addEventListener('mouseleave', () => this.endDrag());
      svg.addEventListener('wheel', (e) => this.handleWheel(e), { passive: false });
    }

    // Unlock tooltip when clicking outside
    document.addEventListener('click', (e) => {
      const tooltip = document.getElementById('location-tooltip');
      if (!tooltip) return;
      if (tooltip.dataset.locked === '1') {
        // click outside tooltip unlocks
        if (!tooltip.contains(e.target)) {
          tooltip.dataset.locked = '0';
          tooltip.style.display = 'none';
        }
      }
    });

    // Tooltip follows mouse
    document.addEventListener('mousemove', (e) => this.updateTooltipPosition(e));
  },

  /**
   * Zoom / Pan
   */
  zoom(factor) {
    const prev = this.state.zoomLevel;
    this.state.zoomLevel = Math.max(0.5, Math.min(5, prev * factor));
    this.updateTransform();
  },

  resetZoom() {
    this.state.zoomLevel = 1;
    this.state.panX = 0;
    this.state.panY = 0;
    this.updateTransform();
  },

  handleWheel(e) {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    this.zoom(factor);
  },

  startDrag(e) {
    this.state.isDragging = true;
    this.state.dragStartX = e.clientX - this.state.panX;
    this.state.dragStartY = e.clientY - this.state.panY;
    const svg = document.getElementById('us-map-svg');
    if (svg) svg.style.cursor = 'grabbing';
  },

  drag(e) {
    if (!this.state.isDragging) return;
    this.state.panX = e.clientX - this.state.dragStartX;
    this.state.panY = e.clientY - this.state.dragStartY;
    this.updateTransform();
  },

  endDrag() {
    this.state.isDragging = false;
    const svg = document.getElementById('us-map-svg');
    if (svg) svg.style.cursor = 'grab';
  },

  updateTransform() {
    const group = document.getElementById('map-main-group');
    if (group) {
      group.setAttribute('transform', 
        `translate(${this.state.panX}, ${this.state.panY}) scale(${this.state.zoomLevel})`
      );
    }
  },

  /**
   * Helpers
   */
  getUniqueContractors() {
    const contractors = new Set();
    this.state.projects.forEach(p => {
      const contractor = p.performed_by || p.contractor;
      if (contractor) contractors.add(contractor);
    });
    // Ensure your network always appears, even if no current projects (safety)
    ['Guercio Energy Group','KMP','Red Door','Byers','Fritz Staffing','Stable Works','Myers Industrial Services']
      .forEach(c => contractors.add(c));
    return Array.from(contractors).sort();
  },

  getFilteredCompanies() {
    const term = (this.state.searchTerm || '').toLowerCase();
    if (!term) return this.state.companies;
    return this.state.companies.filter(c => 
      (c.name || '').toLowerCase().includes(term) ||
      (c.tier || '').toLowerCase().includes(term) ||
      (c.status || '').toLowerCase().includes(term)
    );
  },

  _contractorsForCompanyLocation(location) {
    const company = this.state.companies.find(c => c.normalized === location.company);
    if (!company) return new Set();

    const projects = this.state.projects.filter(p =>
      p.company === company.name && p.location === location.name
    );

    const contractors = new Set();
    projects.forEach(p => {
      const contractor = p.performed_by || p.contractor;
      if (contractor) contractors.add(contractor);
    });

    // If no projects yet, fall back to company-level contractor hints (optional)
    if (contractors.size === 0 && company.contractors) {
      Object.values(company.contractors).forEach(v => { if (v) contractors.add(v); });
    }

    return contractors;
  },

  _anyContractorSelected(contractorSet) {
    if (contractorSet.size === 0) return true; // show if unknown
    for (const c of contractorSet) if (this.state.selectedContractors.has(c)) return true;
    return false;
  },

  _getFilteredLocationsForMap() {
    // company filter + contractor filter
    return this.state.locations.filter(loc => {
      const company = this.state.companies.find(c => c.normalized === loc.company);
      if (!company || !this.state.selectedCompanies.has(company.name)) return false;

      const contractors = this._contractorsForCompanyLocation(loc);
      return this._anyContractorSelected(contractors);
    });
  },

  /**
   * Refresh dashboard (called when org changes)
   */
  async refresh() {
    console.log('🔄 Refreshing dashboard...');
    await this.loadData();
    await this.render();
    this.setupEventListeners();
  }
};

// Make available globally
window.DashboardComponent = DashboardComponent;

console.log('📊 Enhanced Dashboard Component v2 loaded and ready');
