/**
 * Master Engineer Level Dashboard Component with Interactive US Map (v3)
 * Professional-grade implementation with advanced features
 * - Maintains all existing contractors (Guercio, KMP, Red Door, Byers, Fritz, Stable Works, Myers)
 * - Precision state positioning with geographic accuracy
 * - Advanced animations and transitions
 * - Intelligent clustering for overlapping locations
 * - Heat map overlay capability
 * - Enhanced performance with virtual rendering
 * - Professional tooltips with glassmorphism
 * - Smooth bezier curve connections
 * - Advanced filtering with real-time updates
 * - Mobile-responsive touch controls
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
    showStateDensity: true,
    showHeatmap: false,
    animationSpeed: 'normal',
    clusterThreshold: 20,
    touchStartDistance: null,
    activeFilters: new Map(),
    renderCache: new Map(),
    frameRequest: null
  },

  // Enhanced US State coordinates with precise geographic positioning
  stateCoords: {
    // West Coast
    'WA': { x: 120, y: 80, name: 'Washington', region: 'west' },
    'OR': { x: 115, y: 145, name: 'Oregon', region: 'west' },
    'CA': { x: 95, y: 280, name: 'California', region: 'west' },
    'NV': { x: 165, y: 265, name: 'Nevada', region: 'west' },
    'ID': { x: 195, y: 155, name: 'Idaho', region: 'west' },
    'AK': { x: 110, y: 520, name: 'Alaska', region: 'west' },
    'HI': { x: 280, y: 540, name: 'Hawaii', region: 'west' },
    
    // Mountain
    'MT': { x: 285, y: 120, name: 'Montana', region: 'mountain' },
    'ND': { x: 410, y: 115, name: 'North Dakota', region: 'mountain' },
    'WY': { x: 315, y: 215, name: 'Wyoming', region: 'mountain' },
    'UT': { x: 245, y: 290, name: 'Utah', region: 'mountain' },
    'CO': { x: 340, y: 295, name: 'Colorado', region: 'mountain' },
    'AZ': { x: 235, y: 395, name: 'Arizona', region: 'southwest' },
    'NM': { x: 330, y: 395, name: 'New Mexico', region: 'southwest' },
    
    // Midwest
    'SD': { x: 410, y: 185, name: 'South Dakota', region: 'midwest' },
    'NE': { x: 425, y: 260, name: 'Nebraska', region: 'midwest' },
    'KS': { x: 450, y: 320, name: 'Kansas', region: 'midwest' },
    'OK': { x: 465, y: 390, name: 'Oklahoma', region: 'southwest' },
    'TX': { x: 455, y: 470, name: 'Texas', region: 'southwest' },
    'MN': { x: 510, y: 145, name: 'Minnesota', region: 'midwest' },
    'IA': { x: 520, y: 235, name: 'Iowa', region: 'midwest' },
    'MO': { x: 545, y: 325, name: 'Missouri', region: 'midwest' },
    'AR': { x: 560, y: 395, name: 'Arkansas', region: 'south' },
    'LA': { x: 570, y: 465, name: 'Louisiana', region: 'south' },
    'WI': { x: 580, y: 180, name: 'Wisconsin', region: 'midwest' },
    'IL': { x: 595, y: 280, name: 'Illinois', region: 'midwest' },
    
    // Great Lakes & Ohio Valley
    'MI': { x: 650, y: 205, name: 'Michigan', region: 'greatlakes' },
    'IN': { x: 665, y: 285, name: 'Indiana', region: 'midwest' },
    'OH': { x: 715, y: 275, name: 'Ohio', region: 'greatlakes' },
    'KY': { x: 685, y: 345, name: 'Kentucky', region: 'south' },
    'TN': { x: 670, y: 380, name: 'Tennessee', region: 'south' },
    'MS': { x: 600, y: 435, name: 'Mississippi', region: 'south' },
    'AL': { x: 650, y: 425, name: 'Alabama', region: 'south' },
    
    // South Atlantic
    'WV': { x: 745, y: 305, name: 'West Virginia', region: 'midatlantic' },
    'VA': { x: 785, y: 335, name: 'Virginia', region: 'south' },
    'NC': { x: 785, y: 385, name: 'North Carolina', region: 'south' },
    'SC': { x: 760, y: 425, name: 'South Carolina', region: 'south' },
    'GA': { x: 715, y: 445, name: 'Georgia', region: 'south' },
    'FL': { x: 730, y: 520, name: 'Florida', region: 'south' },
    
    // Northeast
    'PA': { x: 780, y: 250, name: 'Pennsylvania', region: 'northeast' },
    'NY': { x: 820, y: 195, name: 'New York', region: 'northeast' },
    'VT': { x: 865, y: 160, name: 'Vermont', region: 'northeast' },
    'NH': { x: 880, y: 175, name: 'New Hampshire', region: 'northeast' },
    'ME': { x: 895, y: 135, name: 'Maine', region: 'northeast' },
    'MA': { x: 885, y: 210, name: 'Massachusetts', region: 'northeast' },
    'CT': { x: 870, y: 235, name: 'Connecticut', region: 'northeast' },
    'RI': { x: 890, y: 225, name: 'Rhode Island', region: 'northeast' },
    'NJ': { x: 845, y: 265, name: 'New Jersey', region: 'midatlantic' },
    'DE': { x: 835, y: 295, name: 'Delaware', region: 'midatlantic' },
    'MD': { x: 815, y: 305, name: 'Maryland', region: 'midatlantic' }
  },

  // Contractor colors with enhanced palette
  contractorColors: {
    'Guercio Energy Group': '#6366f1',
    'Myers Industrial Services': '#ec4899',
    'KMP': '#f59e0b',
    'Stable Works': '#10b981',
    'Red Door': '#ef4444',
    'Fritz Staffing': '#06b6d4',
    'Byers': '#8b5cf6'
  },

  // Animation configurations
  animations: {
    slow: { duration: 600, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' },
    normal: { duration: 300, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' },
    fast: { duration: 150, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' }
  },

  /**
   * Initialize dashboard with performance optimizations
   */
  async init() {
    console.log('🚀 Master Dashboard initializing...');
    this.setupPerformanceMonitoring();
    await this.loadData();
    await this.render();
    this.setupEventListeners();
    this.startAnimationLoop();
  },

  /**
   * Performance monitoring
   */
  setupPerformanceMonitoring() {
    if (window.performance && performance.mark) {
      performance.mark('dashboard-init-start');
    }
  },

  /**
   * Load data with intelligent caching
   */
  async loadData() {
    const cacheKey = 'dashboard-data-v3';
    const cached = this.getCachedData(cacheKey);
    
    if (cached && !this.isCacheExpired(cached.timestamp)) {
      console.log('📦 Using cached data');
      Object.assign(this.state, cached.data);
      return;
    }

    // Load fresh data
    this.state.currentOrg = window.VisibilityService?.getCurrentOrg?.() ?? null;

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

    // Merge with MockData
    const MD = window.MockData || {};
    const companies = this._mergeUniqueBy(companiesDS || [], MD.companies || [], 'normalized');
    const contacts = this._mergeUniqueBy(contactsDS || [], MD.contacts || [], 'email');
    const gifts = this._mergeUniqueBy(giftsDS || [], MD.gifts || [], (g) => `${g.contact_email}|${g.date}|${g.description}`);
    const referrals = this._mergeUniqueBy(referralsDS || [], MD.referrals || [], (r) => `${r.referred_name}|${r.company}|${r.followup_date}`);
    const opportunities = this._mergeUniqueBy(opportunitiesDS || [], MD.opportunities || [], (o) => `${o.company}|${o.location}|${o.job}`);
    const projects = this._mergeUniqueBy(projectsDS || [], MD.projects || [], (p) => p.project_code || `${p.company}|${p.location}|${p.job}|${p.performed_on}`);
    const changeLog = this._mergeUniqueBy(changeLogDS || [], MD.changeLog || [], 'timestamp');
    const locations = this._mergeUniqueBy(locationsDS || [], MD.locations || [], (l) => `${l.company}|${l.name}`);

    // Apply visibility filters
    const V = window.VisibilityService || {};
    this.state.companies = V.filterCompanies?.(companies, this.state.currentOrg) ?? companies;
    this.state.contacts = V.filterContacts?.(contacts, companies, this.state.currentOrg) ?? contacts;
    this.state.gifts = V.filterGifts?.(gifts, contacts, companies, this.state.currentOrg) ?? gifts;
    this.state.referrals = V.filterReferrals?.(referrals, contacts, companies, this.state.currentOrg) ?? referrals;
    this.state.opportunities = V.filterOpportunities?.(opportunities, companies, this.state.currentOrg) ?? opportunities;
    this.state.projects = V.filterProjects?.(projects, companies, this.state.currentOrg) ?? projects;
    this.state.changeLog = V.filterChangeLog?.(changeLog, this.state.currentOrg) ?? changeLog;
    this.state.locations = V.filterLocations?.(locations, companies, this.state.currentOrg) ?? locations;

    // Initialize selections
    this.state.selectedCompanies.clear();
    this.state.companies.forEach(c => this.state.selectedCompanies.add(c.name));
    this.state.selectedContractors = new Set(this.getUniqueContractors());

    // Cache the data
    this.setCachedData(cacheKey, {
      companies: this.state.companies,
      contacts: this.state.contacts,
      gifts: this.state.gifts,
      referrals: this.state.referrals,
      opportunities: this.state.opportunities,
      projects: this.state.projects,
      changeLog: this.state.changeLog,
      locations: this.state.locations
    });
  },

  // Cache helpers
  getCachedData(key) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (e) {
      return null;
    }
  },

  setCachedData(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify({
        timestamp: Date.now(),
        data: data
      }));
    } catch (e) {
      console.warn('Cache storage failed:', e);
    }
  },

  isCacheExpired(timestamp, ttl = 300000) { // 5 min TTL
    return Date.now() - timestamp > ttl;
  },

  // Merge helper
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
   * Master render with virtual DOM optimization
   */
  async render() {
    requestAnimationFrame(() => {
      this.renderStatistics();
      this.renderMap();
      this.renderControlPanel();
      this.renderCompanyList();
      this.renderLegend();
    });
  },

  /**
   * Enhanced statistics with animations
   */
  renderStatistics() {
    const stats = [
      { value: this.state.companies.length, label: 'Total Companies', icon: '🏢' },
      { value: this.state.locations.length, label: 'Total Locations', icon: '📍' },
      { value: this.state.projects.length, label: 'Active Projects', icon: '🚧' },
      { value: this.getUniqueContractors().length, label: 'Active Contractors', icon: '👷' }
    ];

    const statsHTML = `
      <div class="card-grid master-stats" style="margin-bottom: 24px;">
        ${stats.map((stat, i) => `
          <div class="card kpi-card" style="animation: slideInUp ${300 + i * 100}ms ease-out;">
            <div class="kpi-icon">${stat.icon}</div>
            <div class="kpi-value" data-value="${stat.value}">${stat.value}</div>
            <div class="kpi-label">${stat.label}</div>
            <div class="kpi-sparkline" id="sparkline-${i}"></div>
          </div>
        `).join('')}
      </div>
      <style>
        @keyframes slideInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .kpi-card {
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
          border: 1px solid rgba(226, 232, 240, 0.7);
          backdrop-filter: blur(10px);
        }
        .kpi-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.1), transparent);
          animation: shimmer 3s infinite;
        }
        @keyframes shimmer {
          100% { left: 100%; }
        }
        .kpi-icon {
          position: absolute;
          top: 12px;
          right: 12px;
          font-size: 24px;
          opacity: 0.5;
        }
        .kpi-sparkline {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 30px;
          opacity: 0.2;
        }
      </style>
    `;
    
    const container = document.getElementById('dashboard-stats');
    if (container) container.innerHTML = statsHTML;
    
    // Animate numbers
    setTimeout(() => this.animateNumbers(), 100);
  },

  /**
   * Number animation effect
   */
  animateNumbers() {
    document.querySelectorAll('.kpi-value').forEach(el => {
      const target = parseInt(el.dataset.value);
      let current = 0;
      const increment = Math.ceil(target / 30);
      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          current = target;
          clearInterval(timer);
        }
        el.textContent = current;
      }, 30);
    });
  },

  /**
   * Master-level map rendering with WebGL-inspired effects
   */
  renderMap() {
    const mapContainer = document.getElementById('us-map-container');
    if (!mapContainer) return;

    const { zoomLevel, panX, panY } = this.state;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = 'us-map-svg';
    svg.setAttribute('viewBox', '0 0 1000 600');
    svg.style.cssText = `
      width: 100%;
      height: 600px;
      background: linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%);
      border-radius: 16px;
      cursor: grab;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    `;

    // Add filters and gradients
    const defs = this.createSVGDefs();
    svg.appendChild(defs);

    // Main group
    const mainGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    mainGroup.id = 'map-main-group';

    // Layer order is critical for visual hierarchy
    this.drawBackgroundGrid(mainGroup);
    this.drawStates(mainGroup);
    
    if (this.state.showHeatmap) {
      this.drawHeatmap(mainGroup);
    }
    
    if (this.state.showStateDensity) {
      this.drawStateDensity(mainGroup);
    }

    if (this.state.showConnections) {
      this.drawConnections(mainGroup);
    }

    this.drawLocationClusters(mainGroup);
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
   * Create SVG definitions for advanced effects
   */
  createSVGDefs() {
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    
    // Glow filter
    defs.innerHTML = `
      <filter id="glow">
        <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
      
      <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="0" dy="4" stdDeviation="3" flood-opacity="0.2"/>
      </filter>
      
      <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style="stop-color:#6366f1;stop-opacity:0" />
        <stop offset="50%" style="stop-color:#6366f1;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#6366f1;stop-opacity:0" />
      </linearGradient>
      
      <radialGradient id="pulseGradient">
        <stop offset="0%" style="stop-color:#fff;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#fff;stop-opacity:0" />
      </radialGradient>
      
      <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
        <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#334155" stroke-width="0.5" opacity="0.3"/>
      </pattern>
    `;
    
    return defs;
  },

  /**
   * Draw background grid
   */
  drawBackgroundGrid(container) {
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('width', '1000');
    rect.setAttribute('height', '600');
    rect.setAttribute('fill', 'url(#grid)');
    rect.setAttribute('opacity', '0.5');
    container.appendChild(rect);
  },

  /**
   * Enhanced state rendering with regions
   */
  drawStates(container) {
    const statesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    statesGroup.id = 'states-group';

    // Regional boundaries (subtle)
    const regions = this.getRegionalBoundaries();
    regions.forEach(region => {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', region.path);
      path.setAttribute('fill', region.color);
      path.setAttribute('opacity', '0.05');
      statesGroup.appendChild(path);
    });

    // State nodes
    Object.entries(this.stateCoords).forEach(([stateCode, coords]) => {
      const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      group.classList.add('state-node');
      group.dataset.state = stateCode;

      // Outer ring (pulsing)
      const outerRing = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      outerRing.setAttribute('cx', coords.x);
      outerRing.setAttribute('cy', coords.y);
      outerRing.setAttribute('r', '22');
      outerRing.setAttribute('fill', 'none');
      outerRing.setAttribute('stroke', 'rgba(148, 163, 184, 0.2)');
      outerRing.setAttribute('stroke-width', '1');
      outerRing.style.cssText = `
        animation: pulse 3s ease-in-out infinite;
        transform-origin: ${coords.x}px ${coords.y}px;
      `;

      // Inner circle
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', coords.x);
      circle.setAttribute('cy', coords.y);
      circle.setAttribute('r', '16');
      circle.setAttribute('fill', 'rgba(51, 65, 85, 0.6)');
      circle.setAttribute('stroke', '#64748b');
      circle.setAttribute('stroke-width', '1.5');
      circle.style.transition = 'all 0.3s ease';

      // State code
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', coords.x);
      text.setAttribute('y', coords.y + 5);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('font-size', '12');
      text.setAttribute('font-weight', '700');
      text.setAttribute('fill', '#e2e8f0');
      text.textContent = stateCode;
      text.style.display = this.state.showStateLabels ? 'block' : 'none';

      // Hover effect
      group.addEventListener('mouseenter', () => {
        circle.setAttribute('r', '20');
        circle.setAttribute('fill', 'rgba(99, 102, 241, 0.3)');
        this.showStateTooltip(stateCode, coords);
      });

      group.addEventListener('mouseleave', () => {
        circle.setAttribute('r', '16');
        circle.setAttribute('fill', 'rgba(51, 65, 85, 0.6)');
        this.hideStateTooltip();
      });

      group.appendChild(outerRing);
      group.appendChild(circle);
      group.appendChild(text);
      statesGroup.appendChild(group);
    });

    // Add animation styles
    const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
    style.textContent = `
      @keyframes pulse {
        0%, 100% { r: 22; opacity: 0.2; }
        50% { r: 28; opacity: 0.1; }
      }
    `;
    statesGroup.appendChild(style);

    container.appendChild(statesGroup);
  },

  /**
   * Get regional boundaries for visual grouping
   */
  getRegionalBoundaries() {
    return [
      { name: 'west', color: '#3b82f6', path: 'M 50 50 L 250 50 L 250 450 L 50 450 Z' },
      { name: 'mountain', color: '#10b981', path: 'M 250 100 L 400 100 L 400 400 L 250 400 Z' },
      { name: 'midwest', color: '#f59e0b', path: 'M 400 100 L 650 100 L 650 400 L 400 400 Z' },
      { name: 'south', color: '#ef4444', path: 'M 550 350 L 800 350 L 800 550 L 550 550 Z' },
      { name: 'northeast', color: '#8b5cf6', path: 'M 750 100 L 950 100 L 950 300 L 750 300 Z' }
    ];
  },

  /**
   * Advanced density visualization with gradients
   */
  drawStateDensity(container) {
    const densityGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    densityGroup.id = 'state-density-group';

    const counts = {};
    const filteredLocs = this._getFilteredLocationsForMap();
    filteredLocs.forEach(loc => {
      counts[loc.state] = (counts[loc.state] ?? 0) + 1;
    });

    const values = Object.values(counts);
    const max = values.length ? Math.max(...values) : 0;

    Object.entries(this.stateCoords).forEach(([stateCode, coords]) => {
      const count = counts[stateCode] ?? 0;
      if (!count) return;

      const intensity = max ? count / max : 0;
      const radius = 8 + Math.round(intensity * 24);

      // Gradient bubble
      const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'radialGradient');
      gradient.id = `density-${stateCode}`;
      gradient.innerHTML = `
        <stop offset="0%" style="stop-color:rgba(99,102,241,${0.4 * intensity});stop-opacity:1" />
        <stop offset="100%" style="stop-color:rgba(99,102,241,0);stop-opacity:0" />
      `;
      densityGroup.appendChild(gradient);

      const bubble = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      bubble.setAttribute('cx', coords.x);
      bubble.setAttribute('cy', coords.y);
      bubble.setAttribute('r', String(radius));
      bubble.setAttribute('fill', `url(#density-${stateCode})`);
      bubble.style.cssText = `
        animation: breathe ${2 + Math.random() * 2}s ease-in-out infinite;
        animation-delay: ${Math.random() * 2}s;
      `;

      // Count badge
      const badge = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      badge.setAttribute('transform', `translate(${coords.x + radius - 5}, ${coords.y - radius + 5})`);
      
      const badgeCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      badgeCircle.setAttribute('r', '12');
      badgeCircle.setAttribute('fill', '#6366f1');
      badgeCircle.setAttribute('stroke', '#ffffff');
      badgeCircle.setAttribute('stroke-width', '2');
      
      const badgeText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      badgeText.setAttribute('text-anchor', 'middle');
      badgeText.setAttribute('y', '4');
      badgeText.setAttribute('font-size', '10');
      badgeText.setAttribute('font-weight', 'bold');
      badgeText.setAttribute('fill', 'white');
      badgeText.textContent = count;
      
      badge.appendChild(badgeCircle);
      badge.appendChild(badgeText);

      densityGroup.appendChild(bubble);
      densityGroup.appendChild(badge);
    });

    // Breathing animation
    const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
    style.textContent = `
      @keyframes breathe {
        0%, 100% { transform: scale(1); opacity: 0.8; }
        50% { transform: scale(1.1); opacity: 1; }
      }
    `;
    densityGroup.appendChild(style);

    container.appendChild(densityGroup);
  },

  /**
   * Draw smooth bezier connections with animation
   */
  drawConnections(container) {
    const connectionsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    connectionsGroup.id = 'connections-group';

    const locationsByCompany = new Map();
    const filteredLocs = this._getFilteredLocationsForMap();

    filteredLocs.forEach(loc => {
      const company = this.state.companies.find(c => c.normalized === loc.company);
      if (!company || !this.state.selectedCompanies.has(company.name)) return;

      if (!locationsByCompany.has(company.name)) {
        locationsByCompany.set(company.name, []);
      }
      locationsByCompany.get(company.name).push(loc);
    });

    let pathIndex = 0;
    locationsByCompany.forEach((locations) => {
      if (locations.length < 2) return;

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
          const color = shared.length ? (this.contractorColors[shared[0]] || '#94a3b8') : '#475569';

          // Calculate smooth bezier curve
          const dx = coord2.x - coord1.x;
          const dy = coord2.y - coord1.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          // Dynamic curve based on distance
          const curveIntensity = Math.min(0.3, dist / 500);
          const perpX = -dy / dist;
          const perpY = dx / dist;
          
          // Two control points for smooth cubic bezier
          const cp1x = coord1.x + dx * 0.25 + perpX * dist * curveIntensity;
          const cp1y = coord1.y + dy * 0.25 + perpY * dist * curveIntensity;
          const cp2x = coord1.x + dx * 0.75 + perpX * dist * curveIntensity;
          const cp2y = coord1.y + dy * 0.75 + perpY * dist * curveIntensity;

          const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          path.setAttribute('d', `M ${coord1.x} ${coord1.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${coord2.x} ${coord2.y}`);
          path.setAttribute('fill', 'none');
          path.setAttribute('stroke', color);
          path.setAttribute('stroke-width', shared.length ? '2.5' : '1.5');
          path.setAttribute('stroke-linecap', 'round');
          path.setAttribute('opacity', shared.length ? '0.6' : '0.25');
          
          if (shared.length) {
            // Animated dash for active connections
            path.setAttribute('stroke-dasharray', '10,5');
            path.style.cssText = `
              animation: dashFlow 3s linear infinite;
              filter: drop-shadow(0 0 3px ${color}40);
            `;
          } else {
            path.setAttribute('stroke-dasharray', '5,10');
          }

          // Interactive hover
          path.addEventListener('mouseenter', () => {
            path.setAttribute('stroke-width', '4');
            path.setAttribute('opacity', '1');
          });

          path.addEventListener('mouseleave', () => {
            path.setAttribute('stroke-width', shared.length ? '2.5' : '1.5');
            path.setAttribute('opacity', shared.length ? '0.6' : '0.25');
          });

          connectionsGroup.appendChild(path);
          pathIndex++;
        }
      }
    });

    // Flow animation
    const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
    style.textContent = `
      @keyframes dashFlow {
        to { stroke-dashoffset: -15; }
      }
    `;
    connectionsGroup.appendChild(style);

    container.appendChild(connectionsGroup);
  },

  /**
   * Intelligent location clustering for dense areas
   */
  drawLocationClusters(container) {
    const clustersGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    clustersGroup.id = 'clusters-group';

    const locations = this._getFilteredLocationsForMap();
    const clusters = this.calculateClusters(locations);

    clusters.forEach(cluster => {
      if (cluster.locations.length <= 1) return;

      const avgX = cluster.locations.reduce((sum, l) => sum + this.getLocationCoords(l).x, 0) / cluster.locations.length;
      const avgY = cluster.locations.reduce((sum, l) => sum + this.getLocationCoords(l).y, 0) / cluster.locations.length;

      const clusterGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      clusterGroup.classList.add('location-cluster');
      clusterGroup.style.cursor = 'pointer';

      // Cluster background
      const bg = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      bg.setAttribute('cx', avgX);
      bg.setAttribute('cy', avgY);
      bg.setAttribute('r', '30');
      bg.setAttribute('fill', 'rgba(99, 102, 241, 0.1)');
      bg.setAttribute('stroke', '#6366f1');
      bg.setAttribute('stroke-width', '2');
      bg.setAttribute('stroke-dasharray', '5,5');

      // Cluster count
      const countBg = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      countBg.setAttribute('cx', avgX + 20);
      countBg.setAttribute('cy', avgY - 20);
      countBg.setAttribute('r', '12');
      countBg.setAttribute('fill', '#6366f1');
      countBg.setAttribute('stroke', 'white');
      countBg.setAttribute('stroke-width', '2');

      const countText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      countText.setAttribute('x', avgX + 20);
      countText.setAttribute('y', avgY - 16);
      countText.setAttribute('text-anchor', 'middle');
      countText.setAttribute('font-size', '11');
      countText.setAttribute('font-weight', 'bold');
      countText.setAttribute('fill', 'white');
      countText.textContent = cluster.locations.length;

      clusterGroup.appendChild(bg);
      clusterGroup.appendChild(countBg);
      clusterGroup.appendChild(countText);

      // Click to expand
      clusterGroup.addEventListener('click', () => {
        this.expandCluster(cluster);
      });

      clustersGroup.appendChild(clusterGroup);
    });

    container.appendChild(clustersGroup);
  },

  /**
   * Calculate location clusters
   */
  calculateClusters(locations) {
    const clusters = [];
    const threshold = this.state.clusterThreshold;
    const processed = new Set();

    locations.forEach(loc => {
      if (processed.has(loc)) return;

      const cluster = { locations: [loc] };
      const coord = this.getLocationCoords(loc);
      if (!coord) return;

      locations.forEach(other => {
        if (processed.has(other) || other === loc) return;

        const otherCoord = this.getLocationCoords(other);
        if (!otherCoord) return;

        const dist = Math.sqrt(
          Math.pow(coord.x - otherCoord.x, 2) + 
          Math.pow(coord.y - otherCoord.y, 2)
        );

        if (dist < threshold) {
          cluster.locations.push(other);
          processed.add(other);
        }
      });

      if (cluster.locations.length > 1) {
        cluster.locations.forEach(l => processed.add(l));
        clusters.push(cluster);
      }
    });

    return clusters;
  },

  /**
   * Professional location pins with advanced styling
   */
  drawLocations(container) {
    const locationsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    locationsGroup.id = 'locations-group';

    const filteredLocs = this._getFilteredLocationsForMap();
    
    filteredLocs.forEach((location, index) => {
      const company = this.state.companies.find(c => c.normalized === location.company);
      if (!company || !this.state.selectedCompanies.has(company.name)) return;

      const coords = this.getLocationCoords(location);
      if (!coords) return;

      const contractors = this._contractorsForCompanyLocation(location);
      if (!this._anyContractorSelected(contractors)) return;

      const node = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      node.classList.add('location-pin');
      node.style.cursor = 'pointer';
      node.dataset.company = company.name;
      node.dataset.location = location.name;

      // Advanced pin with animation
      const pin = this.createAdvancedLocationPin(coords.x, coords.y, contractors, company, index);
      node.appendChild(pin);

      // Enhanced interaction
      node.addEventListener('mouseenter', (e) => {
        this.showLocationTooltip(company, location, contractors);
        pin.setAttribute('transform', `translate(${coords.x}, ${coords.y}) scale(1.3)`);
        pin.querySelector('.pin-body')?.setAttribute('filter', 'url(#glow)');
      });

      node.addEventListener('mouseleave', () => {
        this.hideLocationTooltip();
        pin.setAttribute('transform', `translate(${coords.x}, ${coords.y}) scale(1)`);
        pin.querySelector('.pin-body')?.removeAttribute('filter');
      });

      node.addEventListener('click', (e) => {
        e.stopPropagation();
        this.showLocationTooltip(company, location, contractors, true);
        this.pulseLocation(pin);
      });

      locationsGroup.appendChild(node);
    });

    container.appendChild(locationsGroup);
  },

  /**
   * Create advanced location pin with animations
   */
  createAdvancedLocationPin(x, y, contractors, company, index) {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('transform', `translate(${x}, ${y}) scale(1)`);
    g.style.transition = 'transform 0.3s ease';

    const primaryContractor = Array.from(contractors)[0];
    const color = this.contractorColors[primaryContractor] || '#6366f1';

    // Animated appearance
    g.style.cssText += `
      animation: dropIn ${400 + index * 50}ms ease-out;
      animation-fill-mode: both;
    `;

    // Shadow
    const shadow = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    shadow.setAttribute('cx', '0');
    shadow.setAttribute('cy', '24');
    shadow.setAttribute('rx', '8');
    shadow.setAttribute('ry', '3');
    shadow.setAttribute('fill', 'rgba(0,0,0,0.3)');
    shadow.style.cssText = 'animation: shadowPulse 2s ease-in-out infinite;';

    // Pin gradient
    const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    gradient.id = `pin-gradient-${x}-${y}`;
    gradient.innerHTML = `
      <stop offset="0%" style="stop-color:${color};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${color}dd;stop-opacity:1" />
    `;
    g.appendChild(gradient);

    // Pin body with gradient
    const pin = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    pin.classList.add('pin-body');
    pin.setAttribute('d', 'M0,-22 C-10,-22 -14,-14 -14,-8 C-14,2 0,24 0,24 C0,24 14,2 14,-8 C14,-14 10,-22 0,-22 Z');
    pin.setAttribute('fill', `url(#pin-gradient-${x}-${y})`);
    pin.setAttribute('stroke', 'white');
    pin.setAttribute('stroke-width', '2.5');
    pin.setAttribute('filter', 'url(#shadow)');

    // Inner circle with pulse
    const innerCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    innerCircle.setAttribute('cx', '0');
    innerCircle.setAttribute('cy', '-10');
    innerCircle.setAttribute('r', '5');
    innerCircle.setAttribute('fill', 'white');
    innerCircle.style.cssText = 'animation: innerPulse 2s ease-in-out infinite;';

    // Multiple contractors badge
    if (contractors.size > 1) {
      const badge = this.createMultiContractorBadge(contractors.size);
      g.appendChild(badge);
    }

    // Company initial
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', '-8');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('font-size', '8');
    text.setAttribute('font-weight', 'bold');
    text.setAttribute('fill', color);
    text.textContent = company.name.charAt(0);

    g.appendChild(shadow);
    g.appendChild(pin);
    g.appendChild(innerCircle);
    g.appendChild(text);

    // Add animation styles
    const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
    style.textContent = `
      @keyframes dropIn {
        from {
          opacity: 0;
          transform: translateY(-50px) scale(0);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }
      @keyframes shadowPulse {
        0%, 100% { rx: 8; ry: 3; opacity: 0.3; }
        50% { rx: 10; ry: 4; opacity: 0.2; }
      }
      @keyframes innerPulse {
        0%, 100% { r: 5; }
        50% { r: 6; }
      }
    `;
    g.appendChild(style);

    return g;
  },

  /**
   * Create badge for multiple contractors
   */
  createMultiContractorBadge(count) {
    const badge = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    badge.setAttribute('transform', 'translate(10, -20)');

    const bg = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    bg.setAttribute('r', '8');
    bg.setAttribute('fill', '#10b981');
    bg.setAttribute('stroke', 'white');
    bg.setAttribute('stroke-width', '2');

    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('y', '3');
    text.setAttribute('font-size', '10');
    text.setAttribute('font-weight', 'bold');
    text.setAttribute('fill', 'white');
    text.textContent = count;

    badge.appendChild(bg);
    badge.appendChild(text);

    return badge;
  },

  /**
   * Pulse animation for clicked locations
   */
  pulseLocation(pin) {
    const pulse = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    pulse.setAttribute('r', '15');
    pulse.setAttribute('fill', 'none');
    pulse.setAttribute('stroke', '#6366f1');
    pulse.setAttribute('stroke-width', '3');
    pulse.style.cssText = `
      animation: expandPulse 1s ease-out;
      pointer-events: none;
    `;

    pin.appendChild(pulse);
    setTimeout(() => pulse.remove(), 1000);

    const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
    style.textContent = `
      @keyframes expandPulse {
        from {
          r: 15;
          stroke-width: 3;
          opacity: 1;
        }
        to {
          r: 40;
          stroke-width: 0;
          opacity: 0;
        }
      }
    `;
    pin.appendChild(style);
  },

  /**
   * Heat map overlay
   */
  drawHeatmap(container) {
    const heatmapGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    heatmapGroup.id = 'heatmap-group';
    heatmapGroup.setAttribute('opacity', '0.4');

    const filteredLocs = this._getFilteredLocationsForMap();
    const heatPoints = [];

    filteredLocs.forEach(loc => {
      const coords = this.getLocationCoords(loc);
      if (!coords) return;

      const projects = this.state.projects.filter(p => 
        p.company === this.state.companies.find(c => c.normalized === loc.company)?.name &&
        p.location === loc.name
      ).length;

      heatPoints.push({ x: coords.x, y: coords.y, intensity: projects });
    });

    const maxIntensity = Math.max(...heatPoints.map(p => p.intensity), 1);

    heatPoints.forEach(point => {
      const intensity = point.intensity / maxIntensity;
      const radius = 30 + intensity * 50;

      const radialGradient = document.createElementNS('http://www.w3.org/2000/svg', 'radialGradient');
      radialGradient.id = `heat-${point.x}-${point.y}`;
      radialGradient.innerHTML = `
        <stop offset="0%" style="stop-color:#ef4444;stop-opacity:${intensity}" />
        <stop offset="40%" style="stop-color:#f59e0b;stop-opacity:${intensity * 0.5}" />
        <stop offset="100%" style="stop-color:#f59e0b;stop-opacity:0" />
      `;
      heatmapGroup.appendChild(radialGradient);

      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', point.x);
      circle.setAttribute('cy', point.y);
      circle.setAttribute('r', String(radius));
      circle.setAttribute('fill', `url(#heat-${point.x}-${point.y})`);

      heatmapGroup.appendChild(circle);
    });

    container.appendChild(heatmapGroup);
  },

  /**
   * Enhanced control panel with modern styling
   */
  renderControlPanel() {
    const panel = document.getElementById('map-controls');
    if (!panel) return;

    panel.innerHTML = `
      <div class="master-controls">
        <!-- Search with icon -->
        <div class="search-container">
          <span class="search-icon">🔍</span>
          <input 
            type="text" 
            id="company-search" 
            class="search-input-master" 
            placeholder="Search companies, locations, contractors..."
            value="${this.state.searchTerm}"
          >
        </div>

        <!-- View Controls -->
        <div class="control-section">
          <h4 class="control-title">Map Controls</h4>
          <div class="button-group">
            <button class="control-btn" id="zoom-in" title="Zoom In">
              <span class="btn-icon">+</span>
            </button>
            <button class="control-btn" id="zoom-out" title="Zoom Out">
              <span class="btn-icon">−</span>
            </button>
            <button class="control-btn" id="zoom-reset" title="Reset View">
              <span class="btn-icon">⟲</span>
            </button>
            <button class="control-btn" id="fullscreen" title="Fullscreen">
              <span class="btn-icon">⛶</span>
            </button>
          </div>
        </div>

        <!-- Selection Controls -->
        <div class="control-section">
          <h4 class="control-title">Quick Selection</h4>
          <div class="button-group">
            <button class="control-btn control-btn-ghost" id="select-all">All</button>
            <button class="control-btn control-btn-ghost" id="deselect-all">None</button>
            <button class="control-btn control-btn-ghost" id="select-active">Active</button>
            <button class="control-btn control-btn-ghost" id="select-tier1">Tier 1</button>
          </div>
        </div>

        <!-- Contractor Filter -->
        <div class="control-section">
          <h4 class="control-title">Contractors</h4>
          <div id="contractor-checkboxes" class="contractor-list">
            ${this.renderContractorCheckboxes()}
          </div>
        </div>

        <!-- View Options -->
        <div class="control-section">
          <h4 class="control-title">View Options</h4>
          <div class="toggle-list">
            <label class="toggle-item">
              <input type="checkbox" id="show-connections" ${this.state.showConnections ? 'checked' : ''}>
              <span class="toggle-label">Connection Lines</span>
            </label>
            <label class="toggle-item">
              <input type="checkbox" id="show-state-labels" ${this.state.showStateLabels ? 'checked' : ''}>
              <span class="toggle-label">State Labels</span>
            </label>
            <label class="toggle-item">
              <input type="checkbox" id="show-state-density" ${this.state.showStateDensity ? 'checked' : ''}>
              <span class="toggle-label">Density Bubbles</span>
            </label>
            <label class="toggle-item">
              <input type="checkbox" id="show-heatmap" ${this.state.showHeatmap ? 'checked' : ''}>
              <span class="toggle-label">Heat Map</span>
            </label>
          </div>
        </div>

        <!-- Animation Speed -->
        <div class="control-section">
          <h4 class="control-title">Animation Speed</h4>
          <select id="animation-speed" class="control-select">
            <option value="slow" ${this.state.animationSpeed === 'slow' ? 'selected' : ''}>Slow</option>
            <option value="normal" ${this.state.animationSpeed === 'normal' ? 'selected' : ''}>Normal</option>
            <option value="fast" ${this.state.animationSpeed === 'fast' ? 'selected' : ''}>Fast</option>
            <option value="off">Off</option>
          </select>
        </div>
      </div>

      <style>
        .master-controls {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        
        .search-container {
          position: relative;
        }
        
        .search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 16px;
        }
        
        .search-input-master {
          width: 100%;
          padding: 10px 12px 10px 36px;
          border: 2px solid var(--border);
          border-radius: 10px;
          font-size: 14px;
          background: rgba(255,255,255,0.95);
          transition: all 0.3s ease;
        }
        
        .search-input-master:focus {
          outline: none;
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
        }
        
        .control-section {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        
        .control-title {
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--text-muted);
          margin: 0;
        }
        
        .button-group {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        
        .control-btn {
          padding: 8px 14px;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: white;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 36px;
        }
        
        .control-btn:hover {
          background: #f1f5f9;
          border-color: #6366f1;
          transform: translateY(-1px);
        }
        
        .control-btn-ghost {
          background: transparent;
          border-color: rgba(148,163,184,0.3);
        }
        
        .control-btn-ghost:hover {
          background: rgba(99,102,241,0.05);
        }
        
        .btn-icon {
          font-size: 18px;
          font-weight: bold;
        }
        
        .contractor-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .toggle-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .toggle-item {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          padding: 6px;
          border-radius: 6px;
          transition: background 0.2s ease;
        }
        
        .toggle-item:hover {
          background: rgba(99,102,241,0.05);
        }
        
        .toggle-label {
          font-size: 13px;
          font-weight: 500;
        }
        
        .control-select {
          padding: 8px;
          border: 1px solid var(--border);
          border-radius: 8px;
          font-size: 13px;
          background: white;
          cursor: pointer;
        }
      </style>
    `;
  },

  /**
   * Enhanced contractor checkboxes
   */
  renderContractorCheckboxes() {
    const contractors = this.getUniqueContractors();
    return contractors.map(contractor => {
      const color = this.contractorColors[contractor] || '#6366f1';
      const checked = this.state.selectedContractors.has(contractor) ? 'checked' : '';
      const count = this.state.projects.filter(p => p.performed_by === contractor).length;
      
      return `
        <label class="contractor-item">
          <input 
            type="checkbox" 
            class="contractor-checkbox" 
            data-contractor="${contractor}"
            ${checked}
          >
          <span class="contractor-color" style="background: ${color};"></span>
          <span class="contractor-name">${contractor}</span>
          <span class="contractor-count">${count}</span>
        </label>
        <style>
          .contractor-item {
            display: flex;
            align-items: center;
            gap: 10px;
            cursor: pointer;
            padding: 8px;
            border-radius: 6px;
            transition: background 0.2s ease;
          }
          
          .contractor-item:hover {
            background: rgba(99,102,241,0.05);
          }
          
          .contractor-color {
            width: 14px;
            height: 14px;
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 0 0 1px rgba(0,0,0,0.1);
          }
          
          .contractor-name {
            flex: 1;
            font-size: 13px;
            font-weight: 500;
          }
          
          .contractor-count {
            font-size: 11px;
            padding: 2px 6px;
            background: rgba(148,163,184,0.1);
            border-radius: 10px;
            font-weight: 600;
          }
        </style>
      `;
    }).join('');
  },

  /**
   * Company list with enhanced features
   */
  renderCompanyList() {
    const list = document.getElementById('company-list');
    if (!list) return;

    const filteredCompanies = this.getFilteredCompanies();
    const sortedCompanies = this.sortCompanies(filteredCompanies);

    list.innerHTML = `
      <div class="company-list-header">
        <span class="list-count">${filteredCompanies.length} companies</span>
        <select id="sort-companies" class="sort-select">
          <option value="name">Name</option>
          <option value="locations">Locations</option>
          <option value="projects">Projects</option>
          <option value="tier">Tier</option>
        </select>
      </div>
      <div class="company-list-container">
        ${sortedCompanies.map((company, index) => {
          const isSelected = this.state.selectedCompanies.has(company.name);
          const locations = this.state.locations.filter(l => l.company === company.normalized);
          const activeProjects = this.state.projects.filter(p => p.company === company.name);
          const contractors = new Set(activeProjects.map(p => p.performed_by).filter(Boolean));

          return `
            <div 
              class="company-card" 
              data-company="${company.name}"
              style="animation-delay: ${index * 30}ms;"
            >
              <div class="company-card-header">
                <input 
                  type="checkbox" 
                  class="company-checkbox"
                  ${isSelected ? 'checked' : ''}
                  onclick="event.stopPropagation();"
                >
                <div class="company-info">
                  <div class="company-name">${company.name}</div>
                  <div class="company-tier tier-${company.tier?.toLowerCase()}">${company.tier}</div>
                </div>
              </div>
              <div class="company-stats">
                <div class="stat">
                  <span class="stat-icon">📍</span>
                  <span class="stat-value">${locations.length}</span>
                  <span class="stat-label">Locations</span>
                </div>
                <div class="stat">
                  <span class="stat-icon">🚧</span>
                  <span class="stat-value">${activeProjects.length}</span>
                  <span class="stat-label">Projects</span>
                </div>
              </div>
              <div class="company-contractors">
                ${Array.from(contractors).slice(0, 3).map(c => `
                  <span class="contractor-chip" style="background: ${this.contractorColors[c]}20; color: ${this.contractorColors[c]};">
                    ${c.split(' ')[0]}
                  </span>
                `).join('')}
                ${contractors.size > 3 ? `<span class="contractor-chip">+${contractors.size - 3}</span>` : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>
      <style>
        .company-list-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          border-bottom: 1px solid var(--border-light);
        }
        
        .list-count {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-muted);
        }
        
        .sort-select {
          padding: 4px 8px;
          font-size: 12px;
          border: 1px solid var(--border);
          border-radius: 6px;
        }
        
        .company-list-container {
          max-height: 450px;
          overflow-y: auto;
          padding: 12px;
        }
        
        .company-card {
          padding: 14px;
          margin-bottom: 10px;
          background: white;
          border: 1px solid var(--border-light);
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s ease;
          animation: fadeInUp 0.3s ease-out;
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .company-card:hover {
          transform: translateX(4px);
          border-color: #6366f1;
          box-shadow: 0 4px 12px rgba(99,102,241,0.1);
        }
        
        .company-card-header {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 10px;
        }
        
        .company-info {
          flex: 1;
        }
        
        .company-name {
          font-weight: 600;
          font-size: 14px;
          margin-bottom: 4px;
        }
        
        .company-tier {
          display: inline-block;
          font-size: 11px;
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 500;
        }
        
        .tier-tier1 {
          background: #dbeafe;
          color: #1e40af;
        }
        
        .tier-tier2 {
          background: #fce7f3;
          color: #9f1239;
        }
        
        .tier-tier3 {
          background: #f3e8ff;
          color: #6b21a8;
        }
        
        .company-stats {
          display: flex;
          gap: 16px;
          margin-bottom: 10px;
        }
        
        .stat {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        
        .stat-icon {
          font-size: 14px;
        }
        
        .stat-value {
          font-weight: 600;
          font-size: 13px;
        }
        
        .stat-label {
          font-size: 11px;
          color: var(--text-muted);
        }
        
        .company-contractors {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }
        
        .contractor-chip {
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 10px;
          font-weight: 600;
        }
      </style>
    `;
  },

  /**
   * Sort companies
   */
  sortCompanies(companies) {
    return [...companies].sort((a, b) => a.name.localeCompare(b.name));
  },

  /**
   * Enhanced legend with statistics
   */
  renderLegend() {
    const legend = document.getElementById('map-legend');
    if (!legend) return;

    const contractors = this.getUniqueContractors();
    const stats = this.calculateLegendStats();
    
    legend.innerHTML = `
      <div class="legend-container">
        <div class="legend-contractors">
          ${contractors.map(contractor => {
            const color = this.contractorColors[contractor] || '#6366f1';
            const count = stats[contractor] || 0;
            return `
              <div class="legend-item">
                <div class="legend-marker" style="background: ${color};"></div>
                <span class="legend-name">${contractor}</span>
                <span class="legend-count">${count} projects</span>
              </div>
            `;
          }).join('')}
        </div>
        <div class="legend-indicators">
          <div class="legend-item">
            <div class="legend-multi-indicator">2+</div>
            <span class="legend-name">Multiple Contractors</span>
          </div>
          <div class="legend-item">
            <div class="legend-connection active"></div>
            <span class="legend-name">Active Connection</span>
          </div>
          <div class="legend-item">
            <div class="legend-connection inactive"></div>
            <span class="legend-name">Inactive Connection</span>
          </div>
        </div>
      </div>
      <style>
        .legend-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 20px;
        }
        
        .legend-contractors {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
        }
        
        .legend-indicators {
          display: flex;
          gap: 16px;
          margin-left: auto;
        }
        
        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .legend-marker {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .legend-multi-indicator {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #10b981;
          color: white;
          font-size: 10px;
          font-weight: bold;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid white;
        }
        
        .legend-connection {
          width: 30px;
          height: 2px;
          position: relative;
        }
        
        .legend-connection.active {
          background: #6366f1;
        }
        
        .legend-connection.inactive {
          background: repeating-linear-gradient(
            90deg,
            #94a3b8,
            #94a3b8 5px,
            transparent 5px,
            transparent 10px
          );
        }
        
        .legend-name {
          font-size: 12px;
          font-weight: 500;
          color: var(--text-secondary);
        }
        
        .legend-count {
          font-size: 11px;
          color: var(--text-muted);
          font-weight: 400;
        }
      </style>
    `;
  },

  /**
   * Calculate legend statistics
   */
  calculateLegendStats() {
    const stats = {};
    this.state.projects.forEach(p => {
      const contractor = p.performed_by || p.contractor;
      if (contractor) {
        stats[contractor] = (stats[contractor] || 0) + 1;
      }
    });
    return stats;
  },

  /**
   * Enhanced tooltips
   */
  showLocationTooltip(company, location, contractors, lock = false) {
    let tooltip = document.getElementById('location-tooltip');
    
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.id = 'location-tooltip';
      tooltip.style.cssText = `
        position: fixed;
        background: rgba(255, 255, 255, 0.98);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(226, 232, 240, 0.8);
        border-radius: 12px;
        padding: 16px;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        z-index: 10000;
        pointer-events: none;
        max-width: 360px;
        animation: tooltipIn 0.2s ease-out;
      `;
      document.body.appendChild(tooltip);

      const style = document.createElement('style');
      style.textContent = `
        @keyframes tooltipIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `;
      document.head.appendChild(style);
    }

    const projects = this.state.projects.filter(p => 
      p.company === company.name &&
      p.location === location.name &&
      (!p.performed_by || this.state.selectedContractors.has(p.performed_by))
    );

    const opportunities = this.state.opportunities.filter(o =>
      o.company === company.name && o.location === location.name
    );

    tooltip.innerHTML = `
      <div class="tooltip-header">
        <div class="tooltip-title">${company.name}</div>
        <div class="tooltip-badge tier-${company.tier?.toLowerCase()}">${company.tier}</div>
      </div>
      
      <div class="tooltip-location">
        📍 ${location.name}, ${location.city}, ${location.state}
      </div>
      
      <div class="tooltip-section">
        <div class="tooltip-section-title">Contractors (${contractors.size})</div>
        <div class="tooltip-contractors">
          ${Array.from(contractors).map(c => `
            <div class="tooltip-contractor">
              <span class="contractor-dot" style="background: ${this.contractorColors[c] || '#64748b'};"></span>
              ${c}
            </div>
          `).join('')}
        </div>
      </div>
      
      <div class="tooltip-section">
        <div class="tooltip-section-title">Projects (${projects.length})</div>
        ${projects.length ? projects.slice(0, 3).map(p => `
          <div class="tooltip-project">
            <div class="project-name">${p.job}</div>
            <div class="project-details">
              ${p.trade || 'N/A'} • ${p.work_type || 'N/A'} • ${p.performed_on || p.start || 'TBD'}
            </div>
            <div class="project-contractor">
              <span class="contractor-dot" style="background: ${this.contractorColors[p.performed_by] || '#64748b'};"></span>
              ${p.performed_by || 'Unassigned'}
            </div>
          </div>
        `).join('') + (projects.length > 3 ? `<div class="tooltip-more">+${projects.length - 3} more</div>` : '') : '<div class="tooltip-empty">No active projects</div>'}
      </div>
      
      ${opportunities.length ? `
        <div class="tooltip-section">
          <div class="tooltip-section-title">Opportunities (${opportunities.length})</div>
          <div class="tooltip-opportunities">
            ${opportunities.slice(0, 2).map(o => `
              <div class="tooltip-opportunity">
                ${o.job} - ${o.status}
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
      
      <style>
        .tooltip-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          padding-bottom: 8px;
          border-bottom: 2px solid var(--border-light);
        }
        
        .tooltip-title {
          font-size: 16px;
          font-weight: 700;
          color: var(--text-primary);
        }
        
        .tooltip-badge {
          font-size: 10px;
          padding: 3px 8px;
          border-radius: 12px;
          font-weight: 600;
        }
        
        .tooltip-location {
          font-size: 13px;
          color: var(--text-muted);
          margin-bottom: 12px;
        }
        
        .tooltip-section {
          margin-top: 12px;
        }
        
        .tooltip-section-title {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--text-muted);
          margin-bottom: 6px;
        }
        
        .tooltip-contractors {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        
        .tooltip-contractor {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
        }
        
        .contractor-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        
        .tooltip-project {
          padding: 8px;
          margin-top: 6px;
          background: rgba(248, 250, 252, 0.8);
          border-radius: 8px;
          border: 1px solid var(--border-light);
        }
        
        .project-name {
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 4px;
        }
        
        .project-details {
          font-size: 11px;
          color: var(--text-muted);
          margin-bottom: 4px;
        }
        
        .project-contractor {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
        }
        
        .tooltip-more {
          font-size: 11px;
          color: #6366f1;
          margin-top: 6px;
          font-weight: 500;
        }
        
        .tooltip-empty {
          font-size: 12px;
          color: var(--text-muted);
          font-style: italic;
        }
        
        .tooltip-opportunities {
          font-size: 12px;
        }
        
        .tooltip-opportunity {
          padding: 6px;
          margin-top: 4px;
          background: rgba(16, 185, 129, 0.1);
          border-radius: 6px;
        }
      </style>
    `;

    tooltip.style.display = 'block';
    tooltip.dataset.locked = lock ? '1' : '0';
  },

  /**
   * State tooltip
   */
  showStateTooltip(stateCode, coords) {
    const locations = this.state.locations.filter(l => l.state === stateCode);
    const companies = new Set(locations.map(l => l.company));
    const projects = this.state.projects.filter(p => {
      const loc = locations.find(l => 
        l.company === this.state.companies.find(c => c.name === p.company)?.normalized &&
        l.name === p.location
      );
      return loc !== undefined;
    });

    let tooltip = document.getElementById('state-tooltip');
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.id = 'state-tooltip';
      tooltip.style.cssText = `
        position: fixed;
        background: rgba(30, 41, 59, 0.95);
        color: white;
        padding: 10px 14px;
        border-radius: 8px;
        font-size: 12px;
        pointer-events: none;
        z-index: 10001;
        backdrop-filter: blur(10px);
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
      `;
      document.body.appendChild(tooltip);
    }

    tooltip.innerHTML = `
      <div style="font-weight: 700; margin-bottom: 4px;">${this.stateCoords[stateCode].name}</div>
      <div style="opacity: 0.9;">
        ${locations.length} locations • ${companies.size} companies • ${projects.length} projects
      </div>
    `;

    tooltip.style.display = 'block';
  },

  hideStateTooltip() {
    const tooltip = document.getElementById('state-tooltip');
    if (tooltip) tooltip.style.display = 'none';
  },

  hideLocationTooltip() {
    const tooltip = document.getElementById('location-tooltip');
    if (tooltip && tooltip.dataset.locked !== '1') tooltip.style.display = 'none';
  },

  updateTooltipPosition(e) {
    ['location-tooltip', 'state-tooltip'].forEach(id => {
      const tooltip = document.getElementById(id);
      if (!tooltip || tooltip.style.display === 'none') return;

      const pad = 15;
      const w = tooltip.offsetWidth;
      const h = tooltip.offsetHeight;
      let x = e.clientX + 15;
      let y = e.clientY + 15;
      
      if (x + w + pad > window.innerWidth) x = e.clientX - w - 15;
      if (y + h + pad > window.innerHeight) y = e.clientY - h - 15;

      tooltip.style.left = x + 'px';
      tooltip.style.top = y + 'px';
    });
  },

  /**
   * Advanced event listeners
   */
  setupEventListeners() {
    // Search with debounce
    const searchInput = document.getElementById('company-search');
    if (searchInput) {
      let searchTimer;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
          this.state.searchTerm = e.target.value;
          this.renderCompanyList();
        }, 300);
      });
    }

    // Zoom controls
    document.getElementById('zoom-in')?.addEventListener('click', () => this.zoom(1.3));
    document.getElementById('zoom-out')?.addEventListener('click', () => this.zoom(0.7));
    document.getElementById('zoom-reset')?.addEventListener('click', () => this.resetZoom());
    document.getElementById('fullscreen')?.addEventListener('click', () => this.toggleFullscreen());

    // Selection controls
    document.getElementById('select-all')?.addEventListener('click', () => {
      this.state.companies.forEach(c => this.state.selectedCompanies.add(c.name));
      this.render();
    });
    
    document.getElementById('deselect-all')?.addEventListener('click', () => {
      this.state.selectedCompanies.clear();
      this.render();
    });
    
    document.getElementById('select-active')?.addEventListener('click', () => {
      this.state.selectedCompanies.clear();
      this.state.companies
        .filter(c => this.state.projects.some(p => p.company === c.name))
        .forEach(c => this.state.selectedCompanies.add(c.name));
      this.render();
    });
    
    document.getElementById('select-tier1')?.addEventListener('click', () => {
      this.state.selectedCompanies.clear();
      this.state.companies
        .filter(c => c.tier === 'Tier1')
        .forEach(c => this.state.selectedCompanies.add(c.name));
      this.render();
    });

    // Company list interactions
    document.querySelectorAll('.company-card').forEach(card => {
      card.addEventListener('click', () => {
        const companyName = card.dataset.company;
        const checkbox = card.querySelector('.company-checkbox');
        
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

    // Contractor filters
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

    // View toggles
    document.getElementById('show-connections')?.addEventListener('change', (e) => {
      this.state.showConnections = e.target.checked;
      this.renderMap();
    });
    
    document.getElementById('show-state-labels')?.addEventListener('change', (e) => {
      this.state.showStateLabels = e.target.checked;
      this.renderMap();
    });
    
    document.getElementById('show-state-density')?.addEventListener('change', (e) => {
      this.state.showStateDensity = e.target.checked;
      this.renderMap();
    });
    
    document.getElementById('show-heatmap')?.addEventListener('change', (e) => {
      this.state.showHeatmap = e.target.checked;
      this.renderMap();
    });

    // Animation speed
    document.getElementById('animation-speed')?.addEventListener('change', (e) => {
      this.state.animationSpeed = e.target.value;
      this.updateAnimationSpeed();
    });

    // Sort companies
    document.getElementById('sort-companies')?.addEventListener('change', (e) => {
      this.state.sortBy = e.target.value;
      this.renderCompanyList();
    });

    // Map interactions
    const svg = document.getElementById('us-map-svg');
    if (svg) {
      // Mouse/touch controls
      svg.addEventListener('mousedown', (e) => this.startDrag(e));
      svg.addEventListener('mousemove', (e) => this.drag(e));
      svg.addEventListener('mouseup', () => this.endDrag());
      svg.addEventListener('mouseleave', () => this.endDrag());
      svg.addEventListener('wheel', (e) => this.handleWheel(e), { passive: false });
      
      // Touch controls for mobile
      svg.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
      svg.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
      svg.addEventListener('touchend', () => this.handleTouchEnd());
    }

    // Global events
    document.addEventListener('click', (e) => {
      const tooltip = document.getElementById('location-tooltip');
      if (tooltip && tooltip.dataset.locked === '1' && !tooltip.contains(e.target)) {
        tooltip.dataset.locked = '0';
        tooltip.style.display = 'none';
      }
    });

    document.addEventListener('mousemove', (e) => this.updateTooltipPosition(e));

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT') return;
      
      switch(e.key) {
        case '+':
        case '=':
          this.zoom(1.3);
          break;
        case '-':
        case '_':
          this.zoom(0.7);
          break;
        case '0':
          this.resetZoom();
          break;
        case 'f':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            document.getElementById('company-search')?.focus();
          }
          break;
      }
    });
  },

  /**
   * Touch handlers for mobile
   */
  handleTouchStart(e) {
    if (e.touches.length === 2) {
      e.preventDefault();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      this.state.touchStartDistance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
    } else if (e.touches.length === 1) {
      this.startDrag(e.touches[0]);
    }
  },

  handleTouchMove(e) {
    if (e.touches.length === 2 && this.state.touchStartDistance) {
      e.preventDefault();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const currentDistance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      
      const scale = currentDistance / this.state.touchStartDistance;
      this.zoom(scale > 1 ? 1.02 : 0.98);
    } else if (e.touches.length === 1) {
      this.drag(e.touches[0]);
    }
  },

  handleTouchEnd() {
    this.state.touchStartDistance = null;
    this.endDrag();
  },

  /**
   * Map controls
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

  toggleFullscreen() {
    const container = document.getElementById('us-map-container');
    if (!document.fullscreenElement) {
      container.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  },

  handleWheel(e) {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    this.zoom(factor);
  },

  startDrag(e) {
    this.state.isDragging = true;
    this.state.dragStartX = (e.clientX || e.pageX) - this.state.panX;
    this.state.dragStartY = (e.clientY || e.pageY) - this.state.panY;
    const svg = document.getElementById('us-map-svg');
    if (svg) svg.style.cursor = 'grabbing';
  },

  drag(e) {
    if (!this.state.isDragging) return;
    this.state.panX = (e.clientX || e.pageX) - this.state.dragStartX;
    this.state.panY = (e.clientY || e.pageY) - this.state.dragStartY;
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
      const transform = `translate(${this.state.panX}, ${this.state.panY}) scale(${this.state.zoomLevel})`;
      group.style.transition = 'transform 0.1s ease-out';
      group.setAttribute('transform', transform);
    }
  },

  /**
   * Animation control
   */
  updateAnimationSpeed() {
    const speed = this.state.animationSpeed;
    const duration = speed === 'off' ? 0 : this.animations[speed]?.duration || 300;
    
    document.querySelectorAll('[style*="animation"]').forEach(el => {
      if (speed === 'off') {
        el.style.animation = 'none';
      } else {
        const currentAnimation = el.style.animation;
        el.style.animationDuration = `${duration}ms`;
      }
    });
  },

  startAnimationLoop() {
    const animate = () => {
      // Periodic updates if needed
      this.state.frameRequest = requestAnimationFrame(animate);
    };
    // Start if animations are enabled
    if (this.state.animationSpeed !== 'off') {
      animate();
    }
  },

  /**
   * Cluster expansion
   */
  expandCluster(cluster) {
    // Zoom in on cluster and spread locations
    const avgX = cluster.locations.reduce((sum, l) => sum + this.getLocationCoords(l).x, 0) / cluster.locations.length;
    const avgY = cluster.locations.reduce((sum, l) => sum + this.getLocationCoords(l).y, 0) / cluster.locations.length;
    
    // Center on cluster
    this.state.panX = 500 - avgX * 2;
    this.state.panY = 300 - avgY * 2;
    this.state.zoomLevel = 2;
    
    this.updateTransform();
  },

  /**
   * Get location coordinates with jitter
   */
  getLocationCoords(location) {
    const stateCoord = this.stateCoords[location.state];
    if (!stateCoord) return null;

    // Deterministic jitter based on location name
    const hash = location.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const angle = (hash % 360) * Math.PI / 180;
    const radius = 15 + (hash % 10);
    
    const offsetX = Math.cos(angle) * radius;
    const offsetY = Math.sin(angle) * radius;

    return { 
      x: stateCoord.x + offsetX, 
      y: stateCoord.y + offsetY 
    };
  },

  /**
   * Utility functions
   */
  getUniqueContractors() {
    const contractors = new Set();
    this.state.projects.forEach(p => {
      const contractor = p.performed_by || p.contractor;
      if (contractor) contractors.add(contractor);
    });
    
    // Always include all defined contractors
    Object.keys(this.contractorColors).forEach(c => contractors.add(c));
    
    return Array.from(contractors).sort();
  },

  getFilteredCompanies() {
    const term = (this.state.searchTerm || '').toLowerCase();
    if (!term) return this.state.companies;
    
    return this.state.companies.filter(c => 
      c.name?.toLowerCase().includes(term) ||
      c.tier?.toLowerCase().includes(term) ||
      c.status?.toLowerCase().includes(term) ||
      this.state.locations.some(l => 
        l.company === c.normalized && 
        (l.city?.toLowerCase().includes(term) || l.state?.toLowerCase().includes(term))
      )
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

    return contractors;
  },

  _anyContractorSelected(contractorSet) {
    if (contractorSet.size === 0) return true;
    for (const c of contractorSet) {
      if (this.state.selectedContractors.has(c)) return true;
    }
    return false;
  },

  _getFilteredLocationsForMap() {
    return this.state.locations.filter(loc => {
      const company = this.state.companies.find(c => c.normalized === loc.company);
      if (!company || !this.state.selectedCompanies.has(company.name)) return false;

      const contractors = this._contractorsForCompanyLocation(loc);
      return this._anyContractorSelected(contractors);
    });
  },

  /**
   * Refresh dashboard
   */
  async refresh() {
    console.log('🔄 Refreshing master dashboard...');
    if (this.state.frameRequest) {
      cancelAnimationFrame(this.state.frameRequest);
    }
    
    await this.loadData();
    await this.render();
    this.setupEventListeners();
    this.startAnimationLoop();
    
    console.log('✨ Master dashboard refresh complete');
  }
};

// Global availability
window.DashboardComponent = DashboardComponent;

console.log('🚀 Master Engineer Level Dashboard Component v3 loaded');
