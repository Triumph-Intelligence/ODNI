/**
 * Enhanced Dashboard Component with Interactive US Map (v3 — Master)
 * Complete replacement for components/dashboard.js
 *
 * Highlights:
 * - Keeps existing "company connectors" alive and adds Contractor Flow mode
 * - Auto-load & merge: DataService + window.MockData
 * - Filters: Contractors, Trades, Work Types
 * - View: State density bubbles, labels, connection toggles
 * - Mini-map with draggable viewport
 * - Fit-to-data, PNG export
 * - Keyboard (arrows, +/-/0) & touch (pinch) navigation
 * - Persists view & filters to localStorage
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
    selectedTrades: new Set(),
    selectedWorkTypes: new Set(),
    flowMode: 'company', // 'company' | 'contractor'

    zoomLevel: 1,
    panX: 0,
    panY: 0,
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0,

    isSelecting: false,
    selStart: null,

    hoveredLocation: null,
    searchTerm: '',
    currentOrg: null,

    showConnections: true,
    showStateLabels: true,
    showStateDensity: true,

    // runtime flags
    _eventsAttached: false,
    _rafTransform: null,
  },

  // US State centroid coords
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

  // Contractor colors
  contractorColors: {
    'Guercio Energy Group': '#6366f1',
    'Myers Industrial Services': '#ec4899',
    'KMP': '#f59e0b',
    'Stable Works': '#10b981',
    'Red Door': '#ef4444',
    'Fritz Staffing': '#06b6d4',
    'Byers': '#8b5cf6'
  },

  // Work type badges
  workTypeStyle: {
    'Capital Project Awarded': { bg: '#eef2ff', fg: '#3730a3' },
    'Maintenance Contract Awarded': { bg: '#ecfeff', fg: '#155e75' },
    'Maintenance Contract Discontinued': { bg: '#fff7ed', fg: '#9a3412' }
  },

  /**
   * Initialize dashboard
   */
  async init() {
    console.log('📊 Dashboard (v3 — Master) initializing...');
    await this.loadData();
    this.restoreViewFromStorage();
    await this.render();
    this.setupEventListeners();
    this.observeResize();
  },

  /**
   * Load data (with MockData fallback/merge)
   */
  async loadData() {
    // current org (optional)
    this.state.currentOrg = (window.VisibilityService?.getCurrentOrg?.() ?? null);

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

    const MD = window.MockData || {};
    const companies = this._mergeUniqueBy(companiesDS || [], MD.companies || [], 'normalized');
    const contacts = this._mergeUniqueBy(contactsDS || [], MD.contacts || [], 'email');
    const gifts = this._mergeUniqueBy(giftsDS || [], MD.gifts || [], (g) => `${g.contact_email}|${g.date}|${g.description}`);
    const referrals = this._mergeUniqueBy(referralsDS || [], MD.referrals || [], (r) => `${r.referred_name}|${r.company}|${r.followup_date}`);
    const opportunities = this._mergeUniqueBy(opportunitiesDS || [], MD.opportunities || [], (o) => `${o.company}|${o.location}|${o.job}`);
    const projects = this._mergeUniqueBy(projectsDS || [], MD.projects || [], (p) => p.project_code || `${p.company}|${p.location}|${p.job}|${p.performed_on}`);
    const changeLog = this._mergeUniqueBy(changeLogDS || [], MD.changeLog || [], 'timestamp');
    const locations = this._mergeUniqueBy(locationsDS || [], MD.locations || [], (l) => `${l.company}|${l.name}`);

    const V = window.VisibilityService || {};
    this.state.companies     = (V.filterCompanies?.(companies, this.state.currentOrg) ?? companies);
    this.state.contacts      = (V.filterContacts?.(contacts, companies, this.state.currentOrg) ?? contacts);
    this.state.gifts         = (V.filterGifts?.(gifts, contacts, companies, this.state.currentOrg) ?? gifts);
    this.state.referrals     = (V.filterReferrals?.(referrals, contacts, companies, this.state.currentOrg) ?? referrals);
    this.state.opportunities = (V.filterOpportunities?.(opportunities, companies, this.state.currentOrg) ?? opportunities);
    this.state.projects      = (V.filterProjects?.(projects, companies, this.state.currentOrg) ?? projects);
    this.state.changeLog     = (V.filterChangeLog?.(changeLog, this.state.currentOrg) ?? changeLog);
    this.state.locations     = (V.filterLocations?.(locations, companies, this.state.currentOrg) ?? locations);

    // Select all companies by default
    this.state.selectedCompanies.clear();
    this.state.companies.forEach(c => this.state.selectedCompanies.add(c.name));

    // Select ALL contractors + compute Trades/Work Types
    this.state.selectedContractors = new Set(this.getUniqueContractors());
    this.state.selectedTrades      = new Set(this.getUniqueTrades());
    this.state.selectedWorkTypes   = new Set(this.getUniqueWorkTypes());
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
   * KPI cards
   */
  renderStatistics() {
    const statsHTML = `
      <div class="card-grid" style="margin-bottom: 16px;">
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
          <div class="kpi-label">Projects</div>
        </div>
        <div class="card kpi-card">
          <div class="kpi-value">${this.getUniqueContractors().length}</div>
          <div class="kpi-label">Network Contractors</div>
        </div>
      </div>
    `;
    const statsContainer = document.getElementById('dashboard-stats');
    if (statsContainer) statsContainer.innerHTML = statsHTML;
  },

  /**
   * Main map
   */
  renderMap() {
    const mapContainer = document.getElementById('us-map-container');
    if (!mapContainer) return;

    // Preserve current transform
    const { zoomLevel, panX, panY } = this.state;

    // SVG
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = 'us-map-svg';
    svg.setAttribute('viewBox', '0 0 1000 600');
    svg.style.width = '100%';
    svg.style.height = '600px';
    svg.style.background = 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)';
    svg.style.borderRadius = '12px';
    svg.style.cursor = 'grab';
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'US contractor network map');

    // Layers (order matters)
    const mainGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    mainGroup.id = 'map-main-group';

    const stateLayer     = document.createElementNS('http://www.w3.org/2000/svg', 'g'); stateLayer.id = 'states-layer';
    const densityLayer   = document.createElementNS('http://www.w3.org/2000/svg', 'g'); densityLayer.id = 'density-layer';
    const connectionLayer= document.createElementNS('http://www.w3.org/2000/svg', 'g'); connectionLayer.id = 'connections-layer';
    const locationLayer  = document.createElementNS('http://www.w3.org/2000/svg', 'g'); locationLayer.id = 'locations-layer';
    const selectionLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g'); selectionLayer.id = 'selection-layer';

    // Draw states and labels
    this.drawStates(stateLayer);

    // State density
    if (this.state.showStateDensity) this.drawStateDensity(densityLayer);

    // Connections
    if (this.state.showConnections) {
      if (this.state.flowMode === 'company') {
        this.drawCompanyConnections(connectionLayer);
      } else {
        this.drawContractorConnections(connectionLayer);
      }
    }

    // Pins
    this.drawLocations(locationLayer);

    // Selection rectangle (hidden until used)
    const selRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    selRect.id = 'selection-rect';
    selRect.setAttribute('x', '0'); selRect.setAttribute('y', '0');
    selRect.setAttribute('width', '0'); selRect.setAttribute('height', '0');
    selRect.setAttribute('fill', 'rgba(59,130,246,0.12)');
    selRect.setAttribute('stroke', '#3b82f6');
    selRect.setAttribute('stroke-dasharray', '4,3');
    selRect.style.display = 'none';
    selectionLayer.appendChild(selRect);

    mainGroup.appendChild(stateLayer);
    mainGroup.appendChild(densityLayer);
    mainGroup.appendChild(connectionLayer);
    mainGroup.appendChild(locationLayer);
    mainGroup.appendChild(selectionLayer);

    svg.appendChild(mainGroup);

    // Replace DOM
    mapContainer.innerHTML = '';
    mapContainer.style.position = 'relative'; // for minimap absolute positioning
    mapContainer.appendChild(svg);

    // Restore transform
    this.state.zoomLevel = zoomLevel;
    this.state.panX = panX;
    this.state.panY = panY;
    this.updateTransform();

    // Mini-map
    this.renderMiniMap(mapContainer);

    // Save view to storage
    this.saveViewToStorage();
  },

  /**
   * States (centroids + labels)
   */
  drawStates(container) {
    const frag = document.createDocumentFragment();

    Object.entries(this.stateCoords).forEach(([code, coords]) => {
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');

      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', coords.x);
      circle.setAttribute('cy', coords.y);
      circle.setAttribute('r', '18');
      circle.setAttribute('fill', 'rgba(226,232,240,0.25)');
      circle.setAttribute('stroke', '#cbd5e1');
      circle.setAttribute('stroke-width', '1');
      g.appendChild(circle);

      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', coords.x);
      label.setAttribute('y', coords.y + 5);
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('font-size', '11');
      label.setAttribute('font-weight', '600');
      label.setAttribute('fill', '#64748b');
      label.textContent = code;
      label.style.display = this.state.showStateLabels ? 'block' : 'none';
      g.appendChild(label);

      const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
      title.textContent = coords.name;
      g.appendChild(title);

      frag.appendChild(g);
    });

    container.appendChild(frag);
  },

  /**
   * State density layer
   */
  drawStateDensity(container) {
    const counts = {};
    const filtered = this._getFilteredLocationsForMap();
    filtered.forEach(loc => { counts[loc.state] = (counts[loc.state] ?? 0) + 1; });

    const values = Object.values(counts);
    const max = values.length ? Math.max(...values) : 0;

    const frag = document.createDocumentFragment();

    Object.entries(this.stateCoords).forEach(([stateCode, coords]) => {
      const count = counts[stateCode] ?? 0;
      if (!count) return;
      const r = 6 + (max ? Math.round((count / max) * 18) : 0);

      const bubble = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      bubble.setAttribute('cx', coords.x);
      bubble.setAttribute('cy', coords.y);
      bubble.setAttribute('r', String(r));
      bubble.setAttribute('fill', 'rgba(99,102,241,0.12)');
      bubble.setAttribute('stroke', '#6366f1');
      bubble.setAttribute('stroke-width', '1');
      bubble.style.cursor = 'pointer';

      bubble.addEventListener('click', () => {
        // Quick filter: toggle all companies that have locations in this state
        const set = new Set(
          this.state.locations
            .filter(l => l.state === stateCode)
            .map(l => this.state.companies.find(c => c.normalized === l.company)?.name)
            .filter(Boolean)
        );
        // If most are off, turn on; else toggle off
        let onCount = 0; set.forEach(n => { if (this.state.selectedCompanies.has(n)) onCount++; });
        const turnOn = onCount < set.size / 2;
        set.forEach(n => turnOn ? this.state.selectedCompanies.add(n) : this.state.selectedCompanies.delete(n));
        this.render(); // re-render everything for clarity
      });

      const countLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      countLabel.setAttribute('x', coords.x);
      countLabel.setAttribute('y', coords.y - r - 4);
      countLabel.setAttribute('text-anchor', 'middle');
      countLabel.setAttribute('font-size', '10');
      countLabel.setAttribute('font-weight', '700');
      countLabel.setAttribute('fill', '#475569');
      countLabel.textContent = count;

      frag.appendChild(bubble);
      frag.appendChild(countLabel);
    });

    container.appendChild(frag);
  },

  /**
   * Connectors — Company Flow (keeps original behavior alive)
   */
  drawCompanyConnections(container) {
    const locationsByCompany = new Map();
    const filteredLocs = this._getFilteredLocationsForMap();
    filteredLocs.forEach(loc => {
      const comp = this.state.companies.find(c => c.normalized === loc.company);
      if (!comp || !this.state.selectedCompanies.has(comp.name)) return;
      if (!locationsByCompany.has(comp.name)) locationsByCompany.set(comp.name, []);
      locationsByCompany.get(comp.name).push(loc);
    });

    const frag = document.createDocumentFragment();

    locationsByCompany.forEach((locs) => {
      if (locs.length < 2) return;
      const contractorsByLoc = new Map();
      locs.forEach(l => contractorsByLoc.set(l.name, this._contractorsForCompanyLocation(l)));

      for (let i = 0; i < locs.length; i++) {
        for (let j = i + 1; j < locs.length; j++) {
          const a = this.getLocationCoords(locs[i]); if (!a) continue;
          const b = this.getLocationCoords(locs[j]); if (!b) continue;

          const set1 = contractorsByLoc.get(locs[i].name) || new Set();
          const set2 = contractorsByLoc.get(locs[j].name) || new Set();
          const shared = [...set1].filter(s => set2.has(s));
          const color = shared.length ? (this.contractorColors[shared[0]] || '#94a3b8') : '#cbd5e1';

          frag.appendChild(this._curvedPath(a, b, color, shared.length ? 2.6 : 2.2, shared.length ? 0.85 : 0.35, shared.length ? '' : '6,6'));
        }
      }
    });

    container.appendChild(frag);
  },

  /**
   * Connectors — Contractor Flow (nearest-neighbor stitching)
   */
  drawContractorConnections(container) {
    const filteredLocs = this._getFilteredLocationsForMap();

    // Group by contractor
    const byContractor = new Map();
    filteredLocs.forEach(loc => {
      const contrs = this._contractorsForCompanyLocation(loc);
      contrs.forEach(c => {
        if (!this.state.selectedContractors.has(c)) return;
        if (!byContractor.has(c)) byContractor.set(c, []);
        byContractor.get(c).push(loc);
      });
    });

    const frag = document.createDocumentFragment();

    byContractor.forEach((locs, contractor) => {
      if (locs.length < 2) return;
      const color = this.contractorColors[contractor] || '#64748b';

      // Build point list
      const pts = locs.map(l => ({ l, p: this.getLocationCoords(l) })).filter(v => !!v.p);
      // Connect each point to its nearest neighbor with higher index to avoid duplicates
      for (let i = 0; i < pts.length; i++) {
        let bestJ = -1, bestD = Infinity;
        for (let j = 0; j < pts.length; j++) {
          if (i === j) continue;
          const dx = pts[j].p.x - pts[i].p.x;
          const dy = pts[j].p.y - pts[i].p.y;
          const d = dx*dx + dy*dy;
          if (d < bestD) { bestD = d; bestJ = j; }
        }
        if (bestJ > i) {
          frag.appendChild(this._curvedPath(pts[i].p, pts[bestJ].p, color, 2.6, 0.8, ''));
        }
      }
    });

    container.appendChild(frag);
  },

  _curvedPath(a, b, color, width = 2.4, opacity = 0.7, dash = '') {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');

    const midX = (a.x + b.x) / 2;
    const midY = (a.y + b.y) / 2;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
    const curve = dist * 0.19;
    const cx = midX - dy / dist * curve;
    const cy = midY + dx / dist * curve;

    path.setAttribute('d', `M ${a.x} ${a.y} Q ${cx} ${cy} ${b.x} ${b.y}`);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', color);
    path.setAttribute('stroke-width', String(width));
    if (dash) path.setAttribute('stroke-dasharray', dash);
    path.setAttribute('opacity', String(opacity));
    path.style.transition = 'opacity .15s ease';

    path.addEventListener('mouseenter', () => path.setAttribute('opacity', '1'));
    path.addEventListener('mouseleave', () => path.setAttribute('opacity', String(opacity)));

    return path;
  },

  /**
   * Location markers
   */
  drawLocations(container) {
    const frag = document.createDocumentFragment();
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

      const pin = this.createLocationPin(coords.x, coords.y, contractors);
      node.appendChild(pin);

      node.addEventListener('mouseenter', () => {
        this.showLocationTooltip(company, location, contractors);
        const base = `translate(${coords.x}, ${coords.y})`;
        pin.setAttribute('transform', `${base} scale(1.2)`);
        node.parentNode?.appendChild(node); // bring to front
      });
      node.addEventListener('mouseleave', () => {
        this.hideLocationTooltip();
        const base = `translate(${coords.x}, ${coords.y})`;
        pin.setAttribute('transform', `${base} scale(1)`);
      });
      node.addEventListener('click', (e) => {
        e.stopPropagation();
        this.showLocationTooltip(company, location, contractors, true);
      });

      frag.appendChild(node);
    });

    container.appendChild(frag);
  },

  /**
   * Pin SVG
   */
  createLocationPin(x, y, contractors) {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('transform', `translate(${x}, ${y}) scale(1)`);

    const primary = Array.from(contractors)[0];
    const color = this.contractorColors[primary] || '#6366f1';

    const shadow = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    shadow.setAttribute('cx', '0'); shadow.setAttribute('cy', '22');
    shadow.setAttribute('rx', '6'); shadow.setAttribute('ry', '2');
    shadow.setAttribute('fill', 'rgba(0,0,0,0.2)');

    const pin = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    pin.setAttribute('d', 'M0,-20 C-8,-20 -12,-12 -12,-8 C-12,0 0,20 0,20 C0,20 12,0 12,-8 C12,-12 8,-20 0,-20 Z');
    pin.setAttribute('fill', color);
    pin.setAttribute('stroke', 'white');
    pin.setAttribute('stroke-width', '2');

    const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    dot.setAttribute('cx', '0'); dot.setAttribute('cy', '-10');
    dot.setAttribute('r', '4'); dot.setAttribute('fill', 'white');

    if (contractors.size > 1) {
      const bubble = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      bubble.setAttribute('cx', '8'); bubble.setAttribute('cy', '-18');
      bubble.setAttribute('r', '5'); bubble.setAttribute('fill', '#10b981');
      bubble.setAttribute('stroke', 'white'); bubble.setAttribute('stroke-width', '1.5');

      const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      t.setAttribute('x', '8'); t.setAttribute('y', '-16');
      t.setAttribute('text-anchor', 'middle');
      t.setAttribute('font-size', '8'); t.setAttribute('font-weight', 'bold');
      t.setAttribute('fill', 'white'); t.textContent = contractors.size;

      g.appendChild(bubble); g.appendChild(t);
    }

    g.appendChild(shadow); g.appendChild(pin); g.appendChild(dot);
    return g;
  },

  /**
   * Coords for location with slight deterministic offset per name
   */
  getLocationCoords(location) {
    const s = this.stateCoords[location.state];
    if (!s) return null;
    const hash = location.name.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    const offsetX = ((hash % 20) - 10) * 2;
    const offsetY = ((hash % 15) - 7) * 2;
    return { x: s.x + offsetX, y: s.y + offsetY };
  },

  /**
   * Controls
   */
  renderControlPanel() {
    const panel = document.getElementById('map-controls');
    if (!panel) return;

    const tradeOptions = this.getUniqueTrades().map(t => `
      <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer;">
        <input type="checkbox" class="trade-checkbox" data-trade="${t}" ${this.state.selectedTrades.has(t) ? 'checked':''}>
        <span>${t}</span>
      </label>
    `).join('');

    const wtOptions = this.getUniqueWorkTypes().map(t => `
      <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer;">
        <input type="checkbox" class="worktype-checkbox" data-worktype="${t}" ${this.state.selectedWorkTypes.has(t) ? 'checked':''}>
        <span>${t}</span>
      </label>
    `).join('');

    panel.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:16px;">
        <!-- Search -->
        <div>
          <input id="company-search" class="search-input" placeholder="Search companies..."
            style="width:100%;" value="${this.state.searchTerm}">
        </div>

        <!-- Zoom + View -->
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button class="btn btn-sm" id="zoom-in"><span style="font-size:18px;">+</span> Zoom In</button>
          <button class="btn btn-sm" id="zoom-out"><span style="font-size:18px;">−</span> Zoom Out</button>
          <button class="btn btn-sm" id="zoom-reset"><span style="font-size:16px;">⟲</span> Reset</button>
          <button class="btn btn-sm" id="fit-to-data">Fit to Data</button>
          <button class="btn btn-sm" id="export-png">Export PNG</button>
        </div>

        <!-- Quick company actions -->
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button class="btn btn-sm btn-ghost" id="select-all">Select All Companies</button>
          <button class="btn btn-sm btn-ghost" id="deselect-all">Deselect All</button>
        </div>

        <!-- Flow Mode -->
        <div>
          <label style="font-size:12px;font-weight:600;color:var(--text-secondary);display:block;margin-bottom:8px;">Flow Mode:</label>
          <label style="display:flex;align-items:center;gap:8px;font-size:13px;"><input type="radio" name="flowmode" value="company" ${this.state.flowMode==='company'?'checked':''}> Company (original)</label>
          <label style="display:flex;align-items:center;gap:8px;font-size:13px;"><input type="radio" name="flowmode" value="contractor" ${this.state.flowMode==='contractor'?'checked':''}> Contractor (network)</label>
        </div>

        <!-- Contractors -->
        <div>
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
            <label style="font-size:12px;font-weight:600;color:var(--text-secondary);">Filter by Contractor:</label>
            <div style="display:flex;gap:6px;">
              <button class="btn btn-xs" id="contractors-all">All</button>
              <button class="btn btn-xs" id="contractors-none">None</button>
            </div>
          </div>
          <div id="contractor-checkboxes" style="display:flex;flex-direction:column;gap:6px;">
            ${this.renderContractorCheckboxes()}
          </div>
        </div>

        <!-- Trades -->
        <div>
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
            <label style="font-size:12px;font-weight:600;color:var(--text-secondary);">Filter by Trade:</label>
            <div style="display:flex;gap:6px;">
              <button class="btn btn-xs" id="trades-all">All</button>
              <button class="btn btn-xs" id="trades-none">None</button>
            </div>
          </div>
          <div id="trade-checkboxes" style="display:flex;flex-direction:column;gap:6px;">${tradeOptions}</div>
        </div>

        <!-- Work Types -->
        <div>
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
            <label style="font-size:12px;font-weight:600;color:var(--text-secondary);">Filter by Work Type:</label>
            <div style="display:flex;gap:6px;">
              <button class="btn btn-xs" id="worktypes-all">All</button>
              <button class="btn btn-xs" id="worktypes-none">None</button>
            </div>
          </div>
          <div id="worktype-checkboxes" style="display:flex;flex-direction:column;gap:6px;">${wtOptions}</div>
        </div>

        <!-- View Options -->
        <div>
          <label style="font-size:12px;font-weight:600;color:var(--text-secondary);display:block;margin-bottom:8px;">View Options:</label>
          <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer;">
            <input type="checkbox" id="show-connections" ${this.state.showConnections ? 'checked' : ''}> Show Connections
          </label>
          <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer;">
            <input type="checkbox" id="show-state-labels" ${this.state.showStateLabels ? 'checked' : ''}> Show State Labels
          </label>
          <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer;">
            <input type="checkbox" id="show-state-density" ${this.state.showStateDensity ? 'checked' : ''}> Show State Density
          </label>
          <div style="font-size:11px;color:var(--text-muted);margin-top:6px;">Tip: Hold <strong>Shift</strong> and drag to box‑select locations.</div>
        </div>
      </div>
    `;
  },

  /**
   * Contractor checkboxes
   */
  renderContractorCheckboxes() {
    const contractors = this.getUniqueContractors();
    return contractors.map(c => {
      const color = this.contractorColors[c] || '#6366f1';
      const checked = this.state.selectedContractors.has(c) ? 'checked' : '';
      return `
        <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer;">
          <input type="checkbox" class="contractor-checkbox" data-contractor="${c}" ${checked}>
          <span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${color};"></span>
          ${c}
          <button class="btn btn-xxs" data-action="solo-contractor" data-contractor="${c}" style="margin-left:auto;">Only</button>
        </label>
      `;
    }).join('');
  },

  /**
   * Company list
   */
  renderCompanyList() {
    const list = document.getElementById('company-list');
    if (!list) return;
    const filtered = this.getFilteredCompanies();

    list.innerHTML = `
      <div style="max-height:400px;overflow-y:auto;">
        ${filtered.map(company => {
          const isSelected = this.state.selectedCompanies.has(company.name);
          const locCount = this.state.locations.filter(l => l.company === company.normalized).length;
          const projCount = this.state.projects.filter(p => p.company === company.name).length;
          return `
            <div class="company-item" data-company="${company.name}"
              style="padding:12px;border-bottom:1px solid var(--border-light);cursor:pointer;background:${isSelected?'rgba(99,102,241,0.05)':'transparent'};">
              <div style="display:flex;align-items:center;gap:12px;">
                <input type="checkbox" ${isSelected?'checked':''} onclick="event.stopPropagation();" style="cursor:pointer;">
                <div style="flex:1;">
                  <div style="font-weight:600;font-size:14px;color:var(--text-primary);">${company.name}</div>
                  <div style="font-size:12px;color:var(--text-muted);margin-top:2px;">
                    ${locCount} location${locCount!==1?'s':''} • ${company.tier} • ${projCount} project${projCount!==1?'s':''}
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
      <div style="display:flex;flex-wrap:wrap;gap:16px;align-items:center;">
        ${contractors.map(c => {
          const color = this.contractorColors[c] || '#6366f1';
          return `
            <div class="contractor-chip" data-contractor="${c}" title="Click to solo this contractor"
                 style="display:flex;align-items:center;gap:6px;cursor:pointer;">
              <div style="width:16px;height:16px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.1);"></div>
              <span style="font-size:12px;font-weight:500;color:var(--text-secondary);">${c}</span>
            </div>
          `;
        }).join('')}
        <div style="display:flex;align-items:center;gap:6px;margin-left:auto;">
          <div style="width:20px;height:20px;border-radius:50%;background:#10b981;border:2px solid white;color:white;font-size:10px;font-weight:bold;display:flex;align-items:center;justify-content:center;">2+</div>
          <span style="font-size:12px;font-weight:500;color:var(--text-secondary);">Multiple Contractors</span>
        </div>
      </div>
    `;
  },

  /**
   * Tooltip
   */
  showLocationTooltip(company, location, contractors, lock = false) {
    let tip = document.getElementById('location-tooltip');
    if (!tip) {
      tip = document.createElement('div');
      tip.id = 'location-tooltip';
      tip.style.cssText = `
        position: fixed; background: white; border: 1px solid var(--border);
        border-radius: 8px; padding: 12px; box-shadow: var(--shadow-xl);
        z-index: 10000; pointer-events: none; max-width: 340px;
      `;
      document.body.appendChild(tip);
    }

    const projects = this.state.projects.filter(p =>
      p.company === company.name &&
      p.location === location.name &&
      this._projectPassesFilters(p)
    );

    const projHTML = projects.length
      ? projects.slice(0, 5).map(p => {
          const badge = this.workTypeStyle[p.work_type] || { bg: '#f1f5f9', fg: '#334155' };
          return `
            <div style="margin-top:6px;padding:8px;border:1px solid var(--border-light);border-radius:6px;">
              <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
                <div style="font-size:12px;font-weight:600;color:var(--text-primary);">${p.job}</div>
                <span style="font-size:10px;padding:2px 6px;border-radius:999px;background:${badge.bg};color:${badge.fg};">${p.work_type || ''}</span>
              </div>
              <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">
                ${p.trade ?? '-'} • ${p.performed_on ?? (p.start ?? '')}
              </div>
              <div style="font-size:11px;color:var(--text-muted);margin-top:2px;display:inline-flex;align-items:center;gap:6px;">
                <span style="width:8px;height:8px;border-radius:50%;background:${this.contractorColors[p.performed_by] || '#64748b'}"></span>
                ${p.performed_by || '—'}
              </div>
            </div>
          `;
        }).join('')
      : `<div style="font-size:12px;color:var(--text-muted);">No projects match current filters here.</div>`;

    tip.innerHTML = `
      <div style="font-weight:700;font-size:14px;margin-bottom:4px;color:var(--text-primary);">${company.name}</div>
      <div style="font-size:12px;color:var(--text-muted);margin-bottom:8px;">${location.name}, ${location.city}, ${location.state}</div>
      <div style="font-size:12px;">
        <strong>Contractors:</strong>
        ${Array.from(contractors).map(c => `
          <div style="display:flex;align-items:center;gap:6px;margin-top:4px;">
            <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${this.contractorColors[c] || '#64748b'};"></span>
            ${c}
          </div>`).join('')}
      </div>
      <div style="font-size:12px;margin-top:8px;padding-top:8px;border-top:1px solid var(--border-light);">
        <strong>${projects.length}</strong> project${projects.length!==1?'s':''} (filtered)
        ${projHTML}
      </div>
    `;

    tip.style.display = 'block';
    tip.dataset.locked = lock ? '1' : '0';
  },

  hideLocationTooltip() {
    const tip = document.getElementById('location-tooltip');
    if (tip && tip.dataset.locked !== '1') tip.style.display = 'none';
  },

  updateTooltipPosition(e) {
    const tip = document.getElementById('location-tooltip');
    if (!tip || tip.style.display === 'none') return;
    const pad = 12;
    const w = tip.offsetWidth || 280;
    const h = tip.offsetHeight || 150;
    let x = e.clientX + 15, y = e.clientY + 15;
    if (x + w + pad > window.innerWidth)  x = window.innerWidth - w - pad;
    if (y + h + pad > window.innerHeight) y = window.innerHeight - h - pad;
    tip.style.left = x + 'px';
    tip.style.top = y + 'px';
  },

  /**
   * Event listeners (attach once)
   */
  setupEventListeners() {
    if (this.state._eventsAttached) return;
    this.state._eventsAttached = true;

    // Search
    const searchInput = document.getElementById('company-search');
    if (searchInput) {
      let t; searchInput.addEventListener('input', (e) => {
        clearTimeout(t);
        t = setTimeout(() => {
          this.state.searchTerm = e.target.value;
          this.renderCompanyList();
        }, 150);
      });
    }

    // Zoom controls
    document.getElementById('zoom-in')?.addEventListener('click', () => this.zoom(1.3));
    document.getElementById('zoom-out')?.addEventListener('click', () => this.zoom(0.7));
    document.getElementById('zoom-reset')?.addEventListener('click', () => this.resetZoom());
    document.getElementById('fit-to-data')?.addEventListener('click', () => this.fitToData());
    document.getElementById('export-png')?.addEventListener('click', () => this.exportPNG());

    // Contractor quick actions
    document.getElementById('contractors-all')?.addEventListener('click', () => {
      this.state.selectedContractors = new Set(this.getUniqueContractors());
      this.renderMap(); this.renderLegend();
    });
    document.getElementById('contractors-none')?.addEventListener('click', () => {
      this.state.selectedContractors.clear();
      this.renderMap(); this.renderLegend();
    });

    // Trade/WorkType quick actions
    document.getElementById('trades-all')?.addEventListener('click', () => {
      this.state.selectedTrades = new Set(this.getUniqueTrades());
      this.renderMap();
    });
    document.getElementById('trades-none')?.addEventListener('click', () => {
      this.state.selectedTrades.clear(); this.renderMap();
    });
    document.getElementById('worktypes-all')?.addEventListener('click', () => {
      this.state.selectedWorkTypes = new Set(this.getUniqueWorkTypes()); this.renderMap();
    });
    document.getElementById('worktypes-none')?.addEventListener('click', () => {
      this.state.selectedWorkTypes.clear(); this.renderMap();
    });

    // Companies select
    document.getElementById('select-all')?.addEventListener('click', () => {
      this.state.companies.forEach(c => this.state.selectedCompanies.add(c.name));
      this.render();
    });
    document.getElementById('deselect-all')?.addEventListener('click', () => {
      this.state.selectedCompanies.clear();
      this.render();
    });

    // Company list toggles
    document.addEventListener('click', (e) => {
      const item = e.target.closest('.company-item');
      if (!item) return;
      const companyName = item.dataset.company;
      const checkbox = item.querySelector('input[type="checkbox"]');
      if (this.state.selectedCompanies.has(companyName)) {
        this.state.selectedCompanies.delete(companyName); if (checkbox) checkbox.checked = false;
      } else {
        this.state.selectedCompanies.add(companyName); if (checkbox) checkbox.checked = true;
      }
      this.renderMap(); this.renderLegend();
    });

    // Contractor checkboxes + "Only"
    document.getElementById('contractor-checkboxes')?.addEventListener('change', (e) => {
      const cb = e.target.closest('.contractor-checkbox'); if (!cb) return;
      const name = cb.dataset.contractor;
      if (e.target.checked) this.state.selectedContractors.add(name);
      else this.state.selectedContractors.delete(name);
      this.renderMap(); this.renderLegend();
    });
    document.getElementById('contractor-checkboxes')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action="solo-contractor"]'); if (!btn) return;
      const name = btn.dataset.contractor;
      this.state.selectedContractors = new Set([name]);
      this.renderMap(); this.renderLegend();
    });

    // Trades / Work Types
    document.getElementById('trade-checkboxes')?.addEventListener('change', (e) => {
      const cb = e.target.closest('.trade-checkbox'); if (!cb) return;
      const t = cb.dataset.trade;
      if (e.target.checked) this.state.selectedTrades.add(t);
      else this.state.selectedTrades.delete(t);
      this.renderMap();
    });
    document.getElementById('worktype-checkboxes')?.addEventListener('change', (e) => {
      const cb = e.target.closest('.worktype-checkbox'); if (!cb) return;
      const t = cb.dataset.worktype;
      if (e.target.checked) this.state.selectedWorkTypes.add(t);
      else this.state.selectedWorkTypes.delete(t);
      this.renderMap();
    });

    // Flow mode
    document.querySelectorAll('input[name="flowmode"]').forEach(r => {
      r.addEventListener('change', (e) => {
        this.state.flowMode = e.target.value === 'contractor' ? 'contractor' : 'company';
        this.renderMap();
      });
    });

    // View toggles
    document.getElementById('show-connections')?.addEventListener('change', (e) => {
      this.state.showConnections = !!e.target.checked; this.renderMap();
    });
    document.getElementById('show-state-labels')?.addEventListener('change', (e) => {
      this.state.showStateLabels = !!e.target.checked; this.renderMap();
    });
    document.getElementById('show-state-density')?.addEventListener('change', (e) => {
      this.state.showStateDensity = !!e.target.checked; this.renderMap();
    });

    // Map drag/pan/zoom
    const svg = document.getElementById('us-map-svg');
    if (svg) {
      svg.addEventListener('mousedown', (e) => this.startPointer(e));
      svg.addEventListener('mousemove', (e) => this.movePointer(e));
      svg.addEventListener('mouseup',   () => this.endPointer());
      svg.addEventListener('mouseleave',() => this.endPointer());
      svg.addEventListener('wheel', (e) => this.handleWheel(e), { passive: false });

      // Touch (pinch)
      svg.addEventListener('touchstart', (e) => this.touchStart(e), { passive: false });
      svg.addEventListener('touchmove',  (e) => this.touchMove(e),  { passive: false });
      svg.addEventListener('touchend',   () => this.touchEnd(),     { passive: false });
    }

    // Tooltip follows mouse
    document.addEventListener('mousemove', (e) => this.updateTooltipPosition(e));

    // Click outside unlocks tooltip
    document.addEventListener('click', (e) => {
      const tip = document.getElementById('location-tooltip'); if (!tip) return;
      if (tip.dataset.locked === '1' && !tip.contains(e.target)) {
        tip.dataset.locked = '0'; tip.style.display = 'none';
      }
    });

    // Keyboard navigation
    window.addEventListener('keydown', (e) => {
      const step = 40;
      if (e.key === 'ArrowLeft')  { this.state.panX += step; this.updateTransform(true); }
      if (e.key === 'ArrowRight') { this.state.panX -= step; this.updateTransform(true); }
      if (e.key === 'ArrowUp')    { this.state.panY += step; this.updateTransform(true); }
      if (e.key === 'ArrowDown')  { this.state.panY -= step; this.updateTransform(true); }
      if (e.key === '+') { this.zoom(1.15); }
      if (e.key === '-') { this.zoom(0.87); }
      if (e.key === '0') { this.resetZoom(); }
    });
  },

  /**
   * Pointer / selection handling
   */
  startPointer(e) {
    const svg = document.getElementById('us-map-svg');
    if (!svg) return;
    // Box select with Shift
    if (e.shiftKey) {
      this.state.isSelecting = true;
      const pt = { x: e.clientX, y: e.clientY };
      this.state.selStart = pt;
      const rect = document.getElementById('selection-rect');
      rect.style.display = 'block';
      rect.setAttribute('x', String(pt.x));
      rect.setAttribute('y', String(pt.y));
      rect.setAttribute('width', '0'); rect.setAttribute('height', '0');
      return;
    }
    // Pan
    this.state.isDragging = true;
    this.state.dragStartX = e.clientX - this.state.panX;
    this.state.dragStartY = e.clientY - this.state.panY;
    svg.style.cursor = 'grabbing';
  },

  movePointer(e) {
    if (this.state.isSelecting && this.state.selStart) {
      const rect = document.getElementById('selection-rect');
      const x = Math.min(this.state.selStart.x, e.clientX);
      const y = Math.min(this.state.selStart.y, e.clientY);
      const w = Math.abs(e.clientX - this.state.selStart.x);
      const h = Math.abs(e.clientY - this.state.selStart.y);
      rect.setAttribute('x', String(x));
      rect.setAttribute('y', String(y));
      rect.setAttribute('width', String(w));
      rect.setAttribute('height', String(h));
      return;
    }

    if (!this.state.isDragging) return;
    this.state.panX = e.clientX - this.state.dragStartX;
    this.state.panY = e.clientY - this.state.dragStartY;
    this.updateTransform(true);
  },

  endPointer() {
    const svg = document.getElementById('us-map-svg');
    if (this.state.isDragging) {
      this.state.isDragging = false;
      if (svg) svg.style.cursor = 'grab';
      this.saveViewToStorage();
    }

    if (this.state.isSelecting) {
      this.state.isSelecting = false;
      const rect = document.getElementById('selection-rect');
      rect.style.display = 'none';
      // Compute selection against pin nodes via getBoundingClientRect
      const sel = {
        x: parseFloat(rect.getAttribute('x') || '0'),
        y: parseFloat(rect.getAttribute('y') || '0'),
        w: parseFloat(rect.getAttribute('width') || '0'),
        h: parseFloat(rect.getAttribute('height') || '0')
      };
      const nodes = document.querySelectorAll('#locations-layer > g');
      const selectedCompanies = new Set(this.state.selectedCompanies);
      nodes.forEach(node => {
        const r = node.getBoundingClientRect();
        const intersect = !(r.right < sel.x || r.left > sel.x + sel.w || r.bottom < sel.y || r.top > sel.y + sel.h);
        if (intersect) {
          const comp = node.dataset.company;
          if (comp) selectedCompanies.add(comp);
        }
      });
      this.state.selectedCompanies = selectedCompanies;
      this.renderCompanyList();
      this.renderMap();
    }
  },

  /**
   * Zoom / pan
   */
  zoom(factor) {
    const center = { x: 500, y: 300 }; // viewBox center
    const prev = this.state.zoomLevel;
    const next = Math.max(0.5, Math.min(6, prev * factor));
    // zoom around center of viewport (approx)
    const k = next / prev;
    this.state.panX = center.x - k * (center.x - this.state.panX);
    this.state.panY = center.y - k * (center.y - this.state.panY);
    this.state.zoomLevel = next;
    this.updateTransform(true);
    this.saveViewToStorage();
  },

  resetZoom() {
    this.state.zoomLevel = 1;
    this.state.panX = 0;
    this.state.panY = 0;
    this.updateTransform(true);
    this.saveViewToStorage();
  },

  handleWheel(e) {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    this.zoom(factor);
  },

  updateTransform(throttle = false) {
    const apply = () => {
      const g = document.getElementById('map-main-group');
      if (g) g.setAttribute('transform', `translate(${this.state.panX}, ${this.state.panY}) scale(${this.state.zoomLevel})`);
      this.updateMiniMapViewport();
    };
    if (!throttle) { apply(); return; }
    if (this.state._rafTransform) cancelAnimationFrame(this.state._rafTransform);
    this.state._rafTransform = requestAnimationFrame(apply);
  },

  /**
   * Mini-map
   */
  renderMiniMap(container) {
    // clear existing
    const old = container.querySelector('#us-map-minimap');
    if (old) old.remove();

    const mw = 200, mh = 120;
    const mm = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    mm.id = 'us-map-minimap';
    mm.setAttribute('viewBox', '0 0 1000 600'); // same coords
    mm.style.cssText = `
      position:absolute; right:12px; bottom:12px; width:${mw}px; height:${mh}px;
      background:rgba(255,255,255,0.85); border:1px solid #e5e7eb; border-radius:8px; backdrop-filter: blur(2px);
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    `;

    // states dots
    const statesG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    Object.entries(this.stateCoords).forEach(([_, c]) => {
      const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      dot.setAttribute('cx', c.x); dot.setAttribute('cy', c.y);
      dot.setAttribute('r', '3'); dot.setAttribute('fill', '#cbd5e1');
      statesG.appendChild(dot);
    });
    mm.appendChild(statesG);

    // pins (small)
    const pinsG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this._getFilteredLocationsForMap().forEach(loc => {
      const p = this.getLocationCoords(loc); if (!p) return;
      const circ = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circ.setAttribute('cx', p.x); circ.setAttribute('cy', p.y);
      circ.setAttribute('r', '2.5'); circ.setAttribute('fill', '#6366f1'); circ.setAttribute('opacity', '0.75');
      pinsG.appendChild(circ);
    });
    mm.appendChild(pinsG);

    // viewport rect
    const vp = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    vp.id = 'minimap-viewport';
    vp.setAttribute('x', '0'); vp.setAttribute('y', '0'); vp.setAttribute('width', '0'); vp.setAttribute('height', '0');
    vp.setAttribute('fill', 'rgba(99,102,241,0.10)');
    vp.setAttribute('stroke', '#6366f1'); vp.setAttribute('stroke-width', '2');
    vp.style.cursor = 'move';
    mm.appendChild(vp);

    const onMMPos = (evt) => {
      const rect = mm.getBoundingClientRect();
      const x = ((evt.clientX - rect.left) / rect.width) * 1000;
      const y = ((evt.clientY - rect.top) / rect.height) * 600;
      // center main view on this point
      const s = this.state.zoomLevel;
      const vw = 1000 / s, vh = 600 / s;
      this.state.panX = -(x - vw / 2) * s;
      this.state.panY = -(y - vh / 2) * s;
      this.updateTransform();
      this.saveViewToStorage();
    };

    let dragging = false;
    mm.addEventListener('mousedown', (e) => { dragging = true; onMMPos(e); });
    window.addEventListener('mousemove', (e) => { if (dragging) onMMPos(e); });
    window.addEventListener('mouseup',   () => { dragging = false; });

    container.appendChild(mm);
    this.updateMiniMapViewport();
  },

  updateMiniMapViewport() {
    const mm = document.getElementById('us-map-minimap');
    const vp = document.getElementById('minimap-viewport');
    if (!mm || !vp) return;
    const s = this.state.zoomLevel;
    const vx = -this.state.panX / s;
    const vy = -this.state.panY / s;
    const vw = 1000 / s;
    const vh = 600 / s;
    vp.setAttribute('x', String(vx));
    vp.setAttribute('y', String(vy));
    vp.setAttribute('width', String(vw));
    vp.setAttribute('height', String(vh));
  },

  observeResize() {
    const container = document.getElementById('us-map-container');
    if (!container || window.ResizeObserver == null) return;
    const ro = new ResizeObserver(() => this.updateMiniMapViewport());
    ro.observe(container);
  },

  /**
   * Touch (pinch zoom)
   */
  touchState: null,
  touchStart(e) {
    if (e.touches.length === 2) {
      e.preventDefault();
      const [a, b] = e.touches;
      const d = Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
      this.touchState = { startDist: d, startZoom: this.state.zoomLevel };
    }
  },
  touchMove(e) {
    if (this.touchState && e.touches.length === 2) {
      e.preventDefault();
      const [a, b] = e.touches;
      const d = Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
      const factor = d / (this.touchState.startDist || d);
      this.state.zoomLevel = Math.max(0.5, Math.min(6, this.touchState.startZoom * factor));
      this.updateTransform(true);
    }
  },
  touchEnd() { this.touchState = null; this.saveViewToStorage(); },

  /**
   * Fit to visible pins
   */
  fitToData() {
    const pts = [];
    this._getFilteredLocationsForMap().forEach(loc => {
      const p = this.getLocationCoords(loc); if (p) pts.push(p);
    });
    if (!pts.length) return this.resetZoom();
    const minX = Math.min(...pts.map(p => p.x)), maxX = Math.max(...pts.map(p => p.x));
    const minY = Math.min(...pts.map(p => p.y)), maxY = Math.max(...pts.map(p => p.y));
    const pad = 30;
    const w = (maxX - minX) + pad * 2;
    const h = (maxY - minY) + pad * 2;
    const sx = 1000 / w;
    const sy = 600 / h;
    const s = Math.min(6, Math.max(0.5, Math.min(sx, sy)));
    this.state.zoomLevel = s;
    this.state.panX = -(minX - pad) * s;
    this.state.panY = -(minY - pad) * s;
    this.updateTransform();
    this.saveViewToStorage();
  },

  /**
   * PNG Export
   */
  exportPNG() {
    const svg = document.getElementById('us-map-svg');
    if (!svg) return;
    const xml = new XMLSerializer().serializeToString(svg);
    const svg64 = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml);
    const img = new Image();
    img.onload = () => {
      const scale = 2; // hi-res
      const canvas = document.createElement('canvas');
      canvas.width = 1000 * scale; canvas.height = 600 * scale;
      const ctx = canvas.getContext('2d');
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url; a.download = 'contractor_map.png';
      document.body.appendChild(a); a.click(); a.remove();
    };
    img.src = svg64;
  },

  /**
   * Helpers
   */
  getUniqueContractors() {
    const set = new Set();
    this.state.projects.forEach(p => { const c = p.performed_by || p.contractor; if (c) set.add(c); });
    ['Guercio Energy Group','KMP','Red Door','Byers','Fritz Staffing','Stable Works','Myers Industrial Services']
      .forEach(c => set.add(c));
    return Array.from(set).sort();
  },

  getUniqueTrades() {
    const set = new Set();
    this.state.projects.forEach(p => { if (p.trade) set.add(p.trade); });
    // safety defaults if empty
    if (!set.size) ['electrical','mechanical','interior_gc','marketing','staffing'].forEach(t => set.add(t));
    return Array.from(set).sort();
  },

  getUniqueWorkTypes() {
    const set = new Set();
    this.state.projects.forEach(p => { if (p.work_type) set.add(p.work_type); });
    if (!set.size) ['Capital Project Awarded','Maintenance Contract Awarded','Maintenance Contract Discontinued'].forEach(t => set.add(t));
    return Array.from(set).sort();
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

  _projectPassesFilters(p) {
    const contractorOk = !p.performed_by || this.state.selectedContractors.has(p.performed_by);
    const tradeOk = !p.trade || this.state.selectedTrades.has(p.trade);
    const wtOk = !p.work_type || this.state.selectedWorkTypes.has(p.work_type);
    return contractorOk && tradeOk && wtOk;
  },

  _contractorsForCompanyLocation(location) {
    const company = this.state.companies.find(c => c.normalized === location.company);
    if (!company) return new Set();

    const projects = this.state.projects.filter(p =>
      p.company === company.name && p.location === location.name && this._projectPassesFilters(p)
    );

    const contractors = new Set();
    projects.forEach(p => { const c = p.performed_by || p.contractor; if (c) contractors.add(c); });

    if (contractors.size === 0 && company.contractors) {
      Object.values(company.contractors).forEach(v => { if (v) contractors.add(v); });
    }
    return contractors;
  },

  _anyContractorSelected(set) {
    if (set.size === 0) return true; // show if unknown
    for (const c of set) if (this.state.selectedContractors.has(c)) return true;
    return false;
  },

  _getFilteredLocationsForMap() {
    return this.state.locations.filter(loc => {
      const comp = this.state.companies.find(c => c.normalized === loc.company);
      if (!comp || !this.state.selectedCompanies.has(comp.name)) return false;
      const contractors = this._contractorsForCompanyLocation(loc);
      return this._anyContractorSelected(contractors);
    });
  },

  /**
   * Persistence
   */
  saveViewToStorage() {
    try {
      const payload = {
        zoomLevel: this.state.zoomLevel, panX: this.state.panX, panY: this.state.panY,
        flowMode: this.state.flowMode,
        selectedCompanies: Array.from(this.state.selectedCompanies),
        selectedContractors: Array.from(this.state.selectedContractors),
        selectedTrades: Array.from(this.state.selectedTrades),
        selectedWorkTypes: Array.from(this.state.selectedWorkTypes),
        showConnections: this.state.showConnections,
        showStateLabels: this.state.showStateLabels,
        showStateDensity: this.state.showStateDensity,
        searchTerm: this.state.searchTerm
      };
      localStorage.setItem('dashboard-map-v3', JSON.stringify(payload));
    } catch {}
  },

  restoreViewFromStorage() {
    try {
      const raw = localStorage.getItem('dashboard-map-v3');
      if (!raw) return;
      const v = JSON.parse(raw);
      if (v.zoomLevel) this.state.zoomLevel = v.zoomLevel;
      if (typeof v.panX === 'number') this.state.panX = v.panX;
      if (typeof v.panY === 'number') this.state.panY = v.panY;
      if (v.flowMode) this.state.flowMode = v.flowMode;
      if (Array.isArray(v.selectedCompanies)) this.state.selectedCompanies = new Set(v.selectedCompanies);
      if (Array.isArray(v.selectedContractors)) this.state.selectedContractors = new Set(v.selectedContractors);
      if (Array.isArray(v.selectedTrades)) this.state.selectedTrades = new Set(v.selectedTrades);
      if (Array.isArray(v.selectedWorkTypes)) this.state.selectedWorkTypes = new Set(v.selectedWorkTypes);
      if (typeof v.showConnections === 'boolean') this.state.showConnections = v.showConnections;
      if (typeof v.showStateLabels === 'boolean') this.state.showStateLabels = v.showStateLabels;
      if (typeof v.showStateDensity === 'boolean') this.state.showStateDensity = v.showStateDensity;
      if (typeof v.searchTerm === 'string') this.state.searchTerm = v.searchTerm;
    } catch {}
  },

  /**
   * Refresh dashboard (when org changes)
   */
  async refresh() {
    console.log('🔄 Refreshing dashboard...');
    await this.loadData();
    await this.render();
    // listeners already attached
  }
};

// Expose globally
window.DashboardComponent = DashboardComponent;
console.log('📊 Enhanced Dashboard Component (v3 — Master) loaded and ready');
