/**
 * Enhanced Company Matrix Component — vNext
 * OVERVIEW + EXCEL + CONNECT (Trade-Swap)
 *
 * Changes requested:
 * - ❌ Removed "Relationships" button & view entirely.
 * - ✅ "Cards" view renamed to "Overview".
 * - ✅ Overview (collapsed company row) now shows, BEFORE clicking in:
 *      • Which contractor(s) worked there, and what they did (by trade)
 *      • Aggregated, company-wide (not location specific)
 * - ✅ Excel view now has a "Worked By" column with contractor + trade badges.
 * - ✅ Trade-Swap "Connect" view kept as-is.
 *
 * Data notes:
 * - Uses project.performed_by and project.trade when present.
 * - Falls back to project.contractor/vendor/subcontractor and specialty inference.
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
    viewMode: 'overview', // 'overview' | 'excel' | 'connections'
    filters: {
      search: '',
      showOnlyWorked: false,
      showOnlyUnworked: false,
      tier: ''
    },
    expandedCompanies: new Set(),
    connectionData: [] // -> trade-swap intro data (see analyzeTradeSwapConnections)
  },

  /**
   * Initialize component
   */
  async init() {
    console.log('📊 Company Matrix Component initializing...');
    try {
      this.state.currentOrg = VisibilityService.getCurrentOrg();
      await this.loadData();
      this.addViewModeButtons();
      this.setupEventListeners();
      console.log('✅ Company Matrix Component initialized');
    } catch (error) {
      console.error('Error initializing Company Matrix Component:', error);
      this.showError();
    }
  },

  /**
   * Add view mode buttons to the UI
   */
  addViewModeButtons() {
    const controlsContainer = document.querySelector('.page-header .page-actions');
    if (!controlsContainer) return;

    let viewButtonGroup = document.getElementById('view-mode-buttons');
    if (!viewButtonGroup) {
      viewButtonGroup = document.createElement('div');
      viewButtonGroup.id = 'view-mode-buttons';
      viewButtonGroup.className = 'btn-group';
      viewButtonGroup.style.cssText = 'margin-left: auto; display: flex; gap: 4px;';

      viewButtonGroup.innerHTML = `
        <button id="view-overview" class="btn btn-sm btn-primary" title="Overview">
          <span style="font-size: 16px;">▦</span> Overview
        </button>
        <button id="view-excel" class="btn btn-sm btn-ghost" title="Excel View">
          <span style="font-size: 16px;">⊞</span> Excel
        </button>
        <button id="view-connections" class="btn btn-sm btn-ghost" title="Trade-Swap Introductions">
          <span style="font-size: 16px;">🔗</span> Connect
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

    // 🔧 Trade-swap (location + specialty) introductions
    this.analyzeTradeSwapConnections();

    // Render
    this.render();
  },

  /**
   * ---------- TRADE-SWAP CONNECTIONS (CORE LOGIC) ----------
   *
   * We build a precise work map:
   *   workMap[companyName][locationName][specialty] = contractorName
   * from projects + (optional) company.contractors as fallback.
   */
  analyzeTradeSwapConnections() {
    const companiesByName = Object.fromEntries(this.state.companies.map(c => [c.name, c]));
    const companyLocationsIndex = new Map(); // key: companyNormalized|locationName => {city,state,zip}
    this.state.locations.forEach(l => {
      companyLocationsIndex.set(`${l.company}|${l.name}`, { city: l.city, state: l.state, zip: l.zip });
    });

    const normalizeSpec = (s) => (s || '').toString().trim().toLowerCase();

    // Build workMap: company -> location -> specialty -> contractor
    const workMap = {};
    for (const project of this.state.projects) {
      const companyName = project.company;
      const companyObj = companiesByName[companyName];
      if (!companyObj) continue;

      // Determine specialty
      const spec = this.getProjectSpecialty(project);
      if (!spec) continue;

      // Determine contractor (prefer explicit project fields)
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

    // Build pair suggestions: for each client, for each spec pair (A,B) across locations
    const pairsByKey = {}; // key = contractorA||contractorB
    const tierValues = { 'Enterprise': 100, 'Large': 75, 'Mid': 50, 'Small': 25 };

    for (const [companyName, byLocation] of Object.entries(workMap)) {
      const companyObj = companiesByName[companyName];
      const tierVal = tierValues[companyObj?.tier] || 25;

      // spec -> contractor -> Set(locations)
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
          const sA = specs[i];
          const sB = specs[j];

          const contractorsA = Object.keys(specToContractorToLocs[sA] || {});
          const contractorsB = Object.keys(specToContractorToLocs[sB] || {});

          for (const contractorA of contractorsA) {
            for (const contractorB of contractorsB) {
              if (!contractorA || !contractorB || contractorA === contractorB) continue;

              const workedA = Array.from(specToContractorToLocs[sA][contractorA] || []);
              const workedB = Array.from(specToContractorToLocs[sB][contractorB] || []);
              if (workedA.length === 0 || workedB.length === 0) continue;

              // Build intros:
              const introsAtoB = [];
              for (const locName of workedA) {
                const locKey = `${companyObj.normalized}|${locName}`;
                const cityState = companyLocationsIndex.get(locKey) || {};
                const alreadyBAtLocForSB = byLocation[locName] && byLocation[locName][sB] === contractorB;
                if (!alreadyBAtLocForSB) {
                  introsAtoB.push({
                    company: companyName,
                    location: locName,
                    city: cityState.city || '',
                    state: cityState.state || '',
                    specialty: sB
                  });
                }
              }

              const introsBtoA = [];
              for (const locName of workedB) {
                const locKey = `${companyObj.normalized}|${locName}`;
                const cityState = companyLocationsIndex.get(locKey) || {};
                const alreadyAAtLocForSA = byLocation[locName] && byLocation[locName][sA] === contractorA;
                if (!alreadyAAtLocForSA) {
                  introsBtoA.push({
                    company: companyName,
                    location: locName,
                    city: cityState.city || '',
                    state: cityState.state || '',
                    specialty: sA
                  });
                }
              }

              if (introsAtoB.length > 0 || introsBtoA.length > 0) {
                const keyAB = `${contractorA}||${contractorB}`;
                pairsByKey[keyAB] ||= {
                  contractorA,
                  contractorB,
                  pairs: [],
                  potentialValue: 0,
                  type: 'Trade-Swap Introductions'
                };

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
   * Determine a project's specialty (trade).
   * Uses explicit fields if present; otherwise infers from job text.
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

  /**
   * ---------- RENDER ROOT ----------
   */
  render() {
    switch (this.state.viewMode) {
      case 'excel':
        this.renderExcelView();
        break;
      case 'connections':
        this.renderConnectionView();
        break;
      default:
        this.renderOverview();
    }
    this.renderStatistics();
  },

  /**
   * ---------- EXCEL VIEW (improved with "Worked By") ----------
   */
  renderExcelView() {
    const container = document.getElementById('company-matrix-container');
    if (!container) return;

    const states = [...new Set(this.state.locations.map(l => l.state))].sort();

    let html = `
      <div style="overflow-x: auto; max-height: 70vh;">
        <table class="excel-table" style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <thead style="position: sticky; top: 0; background: var(--background-alt); z-index: 10;">
            <tr>
              <th style="border: 1px solid var(--border-color); padding: 8px; position: sticky; left: 0; background: var(--background-alt); z-index: 11;">Company</th>
              <th style="border: 1px solid var(--border-color); padding: 8px; position: sticky; left: 160px; background: var(--background-alt); z-index: 11;">Tier</th>
              <th style="border: 1px solid var(--border-color); padding: 8px; min-width: 220px;">Worked By</th>
              ${states.map(state => `
                <th style="border: 1px solid var(--border-color); padding: 8px; min-width: 100px; text-align: center;">
                  ${state}
                </th>
              `).join('')}
              <th style="border: 1px solid var(--border-color); padding: 8px; background: var(--success-bg); text-align: center;">Total Worked</th>
              <th style="border: 1px solid var(--border-color); padding: 8px; background: var(--warning-bg); text-align: center;">Opportunities</th>
            </tr>
          </thead>
          <tbody>
    `;

    this.state.companies.forEach(company => {
      const companyLocations = this.state.locations.filter(l => l.company === company.normalized);

      // Contractor summary at-a-glance
      const contractorSummary = this.getCompanyContractorSummary(company.name); // [{contractor, trades:Set, count, last}]
      const contractorBadges = contractorSummary.length
        ? contractorSummary.slice(0, 4).map(cs => `
            <span class="badge badge-primary" style="font-size: 10px; margin-right: 4px; margin-bottom: 4px; display:inline-flex; gap:4px; align-items:center;">
              ${cs.contractor}
              <span style="opacity:.75;">(${Array.from(cs.trades).map(t => this.prettyTrade(t)).join(', ')})</span>
            </span>
          `).join('') + (contractorSummary.length > 4 ? `<span class="badge badge-secondary" style="font-size: 10px;">+${contractorSummary.length - 4} more</span>` : '')
        : '<span style="color: var(--text-muted);">—</span>';

      let totalWorked = 0;
      let totalOpportunities = 0;

      html += `
        <tr>
          <td style="border: 1px solid var(--border-color); padding: 8px; font-weight: 600; position: sticky; left: 0; background: var(--background);">
            ${company.name}
          </td>
          <td style="border: 1px solid var(--border-color); padding: 8px; position: sticky; left: 160px; background: var(--background);">
            <span class="badge badge-secondary">${company.tier}</span>
          </td>
          <td style="border: 1px solid var(--border-color); padding: 8px;">
            ${contractorBadges}
          </td>
      `;

      const statesCells = states.map(state => {
        const stateLocations = companyLocations.filter(l => l.state === state);
        const workedCount = stateLocations.filter(l => this.hasWorkedAtLocation(company, l)).length;
        const totalCount = stateLocations.length;

        if (workedCount > 0) totalWorked += workedCount;
        if (totalCount - workedCount > 0) totalOpportunities += (totalCount - workedCount);

        let cellContent = '';
        let cellStyle = 'border: 1px solid var(--border-color); padding: 8px; text-align: center;';

        if (totalCount === 0) {
          cellContent = '—';
          cellStyle += ' color: var(--text-muted);';
        } else if (workedCount === totalCount) {
          cellContent = `✓ ${workedCount}`;
          cellStyle += ' background: rgba(16, 185, 129, 0.1); color: var(--success-color); font-weight: 600;';
        } else if (workedCount > 0) {
          cellContent = `${workedCount}/${totalCount}`;
          cellStyle += ' background: rgba(245, 158, 11, 0.1); color: var(--warning-color);';
        } else {
          cellContent = `○ ${totalCount}`;
          cellStyle += ' color: var(--text-secondary);';
        }

        return `<td style="${cellStyle}" title="${stateLocations.map(l => l.city).join(', ')}">${cellContent}</td>`;
      }).join('');

      html += statesCells;

      html += `
        <td style="border: 1px solid var(--border-color); padding: 8px; text-align: center; background: rgba(16, 185, 129, 0.05); font-weight: 600; color: var(--success-color);">
          ${totalWorked}
        </td>
        <td style="border: 1px solid var(--border-color); padding: 8px; text-align: center; background: rgba(245, 158, 11, 0.05); font-weight: 600; color: var(--warning-color);">
          ${totalOpportunities}
        </td>
      </tr>`;
    });

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
   * ---------- CONNECT VIEW (Trade-Swap Introductions) ----------
   * (unchanged)
   */
  renderConnectionView() {
    const container = document.getElementById('company-matrix-container');
    if (!container) return;

    if (this.state.connectionData.length === 0) {
      container.innerHTML = '<div class="table-empty">No trade-swap introduction opportunities found</div>';
      return;
    }

    const formatSpec = (s) => {
      const map = { electrical: 'Electrical', mechanical: 'Mechanical', interior_gc: 'Interior GC', marketing: 'Marketing', staffing: 'Staffing' };
      return map[(s || '').toLowerCase()] || s;
    };
    const locLabel = (p) => `${p.location} (${p.city || '—'}, ${p.state || '—'})`;

    let html = `
      <div class="relationship-header" style="margin-bottom: 24px;">
        <h3 style="margin: 0; margin-bottom: 8px;">🔗 Trade-Swap Introductions</h3>
        <p style="color: var(--text-secondary); margin: 0;">
          If Contractor A worked Specialty S1 at Location L1 and Contractor B worked Specialty S2 at Location L2 for the <em>same client</em>, suggest A ➜ intro B to L1 for S2, and B ➜ intro A to L2 for S1.
        </p>
      </div>

      <div class="relationship-grid" style="display: grid; gap: 16px;">
    `;

    this.state.connectionData.forEach((conn, index) => {
      const totalIntros = conn.pairs.reduce((acc, p) => acc + p.introsAtoB.length + p.introsBtoA.length, 0);

      html += `
        <div class="relationship-card card" style="padding: 20px; border-left: 4px solid var(--success-color);">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 16px;">
            <div style="display: flex; align-items: center; gap: 16px;">
              <div style="font-size: 24px; font-weight: bold; color: var(--success-color); opacity: 0.3;">#${index + 1}</div>
              <div>
                <h4 style="margin: 0; font-size: 18px;">${conn.contractorA} ↔ ${conn.contractorB}</h4>
                <div style="display: flex; gap: 8px; margin-top: 6px; flex-wrap: wrap;">
                  <span class="badge badge-primary">${conn.type}</span>
                  <span class="badge badge-secondary">Total intros: ${totalIntros}</span>
                </div>
              </div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 11px; color: var(--text-muted); margin-bottom: 4px;">Connection Score</div>
              <div style="font-size: 24px; font-weight: bold; color: var(--success-color);">${conn.potentialValue}</div>
            </div>
          </div>

          ${conn.pairs.map(p => `
            <div style="margin-bottom: 16px; padding: 16px; background: rgba(16,185,129,.06); border-radius: 8px; border: 1px solid rgba(16,185,129,.2);">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <div style="font-weight: 700; font-size: 15px;">${p.company}</div>
                <div><span class="badge badge-secondary" style="font-size:10px;">${p.tier}</span></div>
              </div>

              <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 10px;">
                <div style="padding: 10px; background: #fff; border-radius: 6px; border-left: 3px solid rgba(99,102,241,.5);">
                  <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 6px;">
                    ${conn.contractorA} worked ${formatSpec(p.aSpecialty)} at:
                  </div>
                  ${p.aWorked.map(w => `<div style="font-size: 13px;">• ${locLabel(w)}</div>`).join('') || '<div style="color:var(--text-muted);">—</div>'}
                  ${p.introsAtoB.length > 0 ? `
                    <div style="margin-top: 8px; padding-top: 8px; border-top: 1px dashed var(--border-color);">
                      <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">Introduce <strong>${conn.contractorB}</strong> for <strong>${formatSpec(p.bSpecialty)}</strong> at:</div>
                      ${p.introsAtoB.map(x => `<div style="font-size: 13px;">• ${locLabel(x)}</div>`).join('')}
                    </div>
                  ` : ''}
                </div>

                <div style="padding: 10px; background: #fff; border-radius: 6px; border-left: 3px solid rgba(139,92,246,.5);">
                  <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 6px;">
                    ${conn.contractorB} worked ${formatSpec(p.bSpecialty)} at:
                  </div>
                  ${p.bWorked.map(w => `<div style="font-size: 13px;">• ${locLabel(w)}</div>`).join('') || '<div style="color:var(--text-muted);">—</div>'}
                  ${p.introsBtoA.length > 0 ? `
                    <div style="margin-top: 8px; padding-top: 8px; border-top: 1px dashed var(--border-color);">
                      <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">Introduce <strong>${conn.contractorA}</strong> for <strong>${formatSpec(p.aSpecialty)}</strong> at:</div>
                      ${p.introsBtoA.map(x => `<div style="font-size: 13px;">• ${locLabel(x)}</div>`).join('')}
                    </div>
                  ` : ''}
                </div>
              </div>

              ${(p.introsAtoB.length + p.introsBtoA.length) > 0 ? `
                <div style="display:flex; gap:8px; margin-top: 12px;">
                  <button class="btn btn-sm btn-primary" onclick="CompanyMatrixComponent.createTradeSwapIntro('${conn.contractorA}', '${conn.contractorB}', '${p.company}')">📧 Draft Email (Both Ways)</button>
                  <button class="btn btn-sm btn-ghost" onclick="CompanyMatrixComponent.viewTradeSwapDetails('${conn.contractorA}', '${conn.contractorB}', '${p.company}')">View Details</button>
                </div>
              ` : `
                <div style="margin-top: 10px; font-size: 12px; color: var(--text-secondary);">No introductions needed here — both trades already active at the same locations.</div>
              `}
            </div>
          `).join('')}
        </div>
      `;
    });

    html += '</div>';
    container.innerHTML = html;
  },

  /**
   * Create two-way trade-swap intro email (per client)
   */
  createTradeSwapIntro(contractorA, contractorB, companyName) {
    const conn = this.state.connectionData.find(c => c.contractorA === contractorA && c.contractorB === contractorB);
    if (!conn) return alert('Connection not found');
    const pack = conn.pairs.find(p => p.company === companyName);
    if (!pack) return alert('Client packet not found');

    const fmt = (x) => `${x.location}${x.city || x.state ? ` (${x.city || '—'}, ${x.state || '—'})` : ''}`;
    const spec = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

    const aToB = pack.introsAtoB.length
      ? `\n${contractorA} can introduce ${contractorB} to:\n${pack.introsAtoB.map(x => `• ${companyName} – ${fmt(x)} for ${spec(x.specialty)}`).join('\n')}\n`
      : '';

    const bToA = pack.introsBtoA.length
      ? `\n${contractorB} can introduce ${contractorA} to:\n${pack.introsBtoA.map(x => `• ${companyName} – ${fmt(x)} for ${spec(x.specialty)}`).join('\n')}\n`
      : '';

    const email = `
Subject: Intro Opportunity at ${companyName}: ${contractorA} ↔ ${contractorB}

Hi team,

I noticed complementary work at ${companyName} across different locations and trades:

${aToB}${bToA}
Given this coverage, a quick intro could unlock cross-trade support at those specific sites.

Open to a brief call to coordinate next steps?

Best regards,
[Your Name]`.trim();

    alert('Email Template:\n\n' + email);
  },

  viewTradeSwapDetails(contractorA, contractorB, companyName) {
    const conn = this.state.connectionData.find(c => c.contractorA === contractorA && c.contractorB === contractorB);
    if (!conn) return alert('Connection not found');
    const p = conn.pairs.find(x => x.company === companyName);
    if (!p) return alert('Client packet not found');

    const f = (x) => `${x.location} (${x.city || '—'}, ${x.state || '—'})`;
    const cap = (s) => s ? s[0].toUpperCase() + s.slice(1) : s;

    let txt = `Trade-Swap Detail\n${contractorA} ↔ ${contractorB}\nClient: ${companyName} (${p.tier})\n\n`;
    txt += `${contractorA} worked ${cap(p.aSpecialty)} at:\n${p.aWorked.map(f).map(s => '  • ' + s).join('\n') || '  • —'}\n\n`;
    txt += `${contractorB} worked ${cap(p.bSpecialty)} at:\n${p.bWorked.map(f).map(s => '  • ' + s).join('\n') || '  • —'}\n\n`;

    if (p.introsAtoB.length) {
      txt += `${contractorA} ➜ introduce ${contractorB} for ${cap(p.bSpecialty)} at:\n${p.introsAtoB.map(f).map(s => '  • ' + s).join('\n')}\n\n`;
    }
    if (p.introsBtoA.length) {
      txt += `${contractorB} ➜ introduce ${contractorA} for ${cap(p.aSpecialty)} at:\n${p.introsBtoA.map(f).map(s => '  • ' + s).join('\n')}\n`;
    }

    alert(txt.trim());
  },

  /**
   * ---------- OVERVIEW (formerly "Cards") ----------
   * Adds: "Worked By" summary (contractor + trade) BEFORE expanding a company.
   */
  renderOverview() {
    const container = document.getElementById('company-matrix-container');
    if (!container) return;

    if (this.state.companies.length === 0) {
      container.innerHTML = '<div class="table-empty">No companies found</div>';
      return;
    }

    // Filters
    let filteredCompanies = [...this.state.companies];
    if (this.state.filters.search) {
      const s = this.state.filters.search.toLowerCase();
      filteredCompanies = filteredCompanies.filter(c =>
        c.name.toLowerCase().includes(s) || c.tier?.toLowerCase().includes(s)
      );
    }
    if (this.state.filters.tier) {
      filteredCompanies = filteredCompanies.filter(c => c.tier === this.state.filters.tier);
    }

    const matrixHTML = filteredCompanies.map(company => {
      const companyLocations = this.state.locations.filter(l => l.company === company.normalized);
      const isExpanded = this.state.expandedCompanies.has(company.normalized);

      let companyWorkedCount = 0;
      let companyUnworkedCount = 0;
      let companyInvoiced = 0;

      companyLocations.forEach(location => {
        const hasWorked = this.hasWorkedAtLocation(company, location);
        if (hasWorked) {
          companyWorkedCount++;
          companyInvoiced += this.getLocationInvoicedAmount(company, location);
        } else {
          companyUnworkedCount++;
        }
      });

      // Company-wide contractor summary (not location specific)
      const contractorSummary = this.getCompanyContractorSummary(company.name);
      const workedBySection = contractorSummary.length ? `
        <div style="display:flex; flex-direction:column; gap:6px;">
          <div style="font-size: 11px; color: var(--text-muted);">Worked By</div>
          <div style="display:flex; flex-wrap: wrap; gap:6px;">
            ${contractorSummary.slice(0, 5).map(cs => `
              <span class="badge badge-primary" style="font-size: 10px; padding: 4px 8px;">
                ${cs.contractor} <span style="opacity: .75;">(${Array.from(cs.trades).map(t => this.prettyTrade(t)).join(', ')})</span>
              </span>
            `).join('')}
            ${contractorSummary.length > 5 ? `<span class="badge badge-secondary" style="font-size:10px;">+${contractorSummary.length - 5} more</span>` : ''}
          </div>
        </div>
      ` : `
        <div style="font-size: 11px; color: var(--text-muted);">No work recorded yet</div>
      `;

      // Apply location filters for expansion
      let displayLocations = companyLocations;
      if (this.state.filters.showOnlyWorked) {
        displayLocations = companyLocations.filter(l => this.hasWorkedAtLocation(company, l));
      } else if (this.state.filters.showOnlyUnworked) {
        displayLocations = companyLocations.filter(l => !this.hasWorkedAtLocation(company, l));
      }
      if (displayLocations.length === 0 && (this.state.filters.showOnlyWorked || this.state.filters.showOnlyUnworked)) {
        return '';
      }

      return `
        <div class="card" style="margin-bottom: 20px;">
          <div class="card-header" style="cursor: pointer; user-select: none;"
               onclick="CompanyMatrixComponent.toggleCompany('${company.normalized}')">
            <div style="display: flex; justify-content: space-between; align-items: center; gap: 16px;">
              <div style="display: flex; align-items: center; gap: 12px;">
                <span style="font-size: 20px; transition: transform 0.3s;">${isExpanded ? '▼' : '▶'}</span>
                <div>
                  <h3 style="margin: 0; font-size: 18px;">${company.name}</h3>
                  <div style="display: flex; gap: 8px; margin-top: 4px;">
                    <span class="badge badge-secondary">${company.tier}</span>
                    <span class="badge ${company.status === 'Active' ? 'badge-success' : 'badge-warning'}">${company.status}</span>
                  </div>
                </div>
              </div>

              <div style="display:flex; align-items:flex-start; gap:24px;">
                ${workedBySection}
                <div style="display:flex; gap:20px; align-items:center;">
                  <div style="text-align: center;">
                    <div style="font-size: 20px; font-weight: bold; color: var(--success-color);">${companyWorkedCount}</div>
                    <div style="font-size: 11px; color: var(--text-muted);">Worked</div>
                  </div>
                  <div style="text-align: center;">
                    <div style="font-size: 20px; font-weight: bold; color: var(--warning-color);">${companyUnworkedCount}</div>
                    <div style="font-size: 11px; color: var(--text-muted);">Opportunities</div>
                  </div>
                  <div style="text-align: center;">
                    <div style="font-size: 20px; font-weight: bold; color: var(--primary-color);">${this.formatCurrency(companyInvoiced)}</div>
                    <div style="font-size: 11px; color: var(--text-muted);">Total Invoiced</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          ${isExpanded ? `
            <div class="card-body">
              ${displayLocations.length > 0 ? `
                <div class="location-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px;">
                  ${displayLocations.map(location => this.renderLocationCard(company, location)).join('')}
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
   * Company-wide contractor summary (NOT location-specific)
   * Returns sorted array: [{contractor, trades:Set, count, last}]
   */
  getCompanyContractorSummary(companyName) {
    const rows = this.state.projects.filter(p => p.company === companyName);
    if (!rows.length) return [];

    const map = new Map(); // contractor -> {trades:Set, count, last}
    for (const p of rows) {
      const contractor = p.performed_by || p.contractor || p.vendor || p.subcontractor;
      const trade = (p.trade || this.getProjectSpecialty(p) || '').toLowerCase();
      if (!contractor || !trade) continue;

      const key = contractor.trim();
      if (!map.has(key)) {
        map.set(key, { contractor: key, trades: new Set(), count: 0, last: null });
      }
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
   * Get contractors who worked at a specific location (based on actual projects + specialty inference)
   * Used for small badges on the location cards.
   */
  getLocationContractors(company, location) {
    const contractors = [];
    const locationProjects = this.state.projects.filter(p => p.company === company.name && p.location === location.name);
    if (locationProjects.length === 0) return contractors;

    const seen = new Set();
    for (const p of locationProjects) {
      const spec = (p.trade || this.getProjectSpecialty(p));
      if (!spec) continue;
      const contractor = p.performed_by || p.contractor || p.vendor || p.subcontractor ||
        (this.state.companies.find(c => c.name === company.name)?.contractors?.[spec]);
      if (!contractor) continue;
      const key = `${contractor}::${spec}`;
      if (!seen.has(key)) {
        seen.add(key);
        contractors.push({ name: contractor, specialty: spec });
      }
    }
    return contractors;
  },

  /**
   * Render a location card
   */
  renderLocationCard(company, location) {
    const hasWorked = this.hasWorkedAtLocation(company, location);
    const invoiced = this.getLocationInvoicedAmount(company, location);
    const contacts = this.getLocationContacts(company, location);
    const contractors = this.getLocationContractors(company, location);

    const locationProjects = this.state.projects.filter(p => p.company === company.name && p.location === location.name);

    const cardClass = hasWorked ? 'location-worked' : 'location-opportunity';
    const borderColor = hasWorked ? 'var(--success-color)' : 'var(--warning-color)';

    const formatSpecialty = (spec) => this.prettyTrade(spec);

    return `
      <div class="location-card ${cardClass}"
           style="padding: 16px; border: 2px solid ${borderColor}; border-radius: 8px; background: var(--background); cursor: pointer; transition: all 0.3s;"
           onclick="CompanyMatrixComponent.showLocationDetails('${company.normalized}', '${location.name}')">

        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
          <div>
            <h4 style="margin: 0; font-size: 16px; font-weight: 600;">${location.name}</h4>
            <div style="font-size: 13px; color: var(--text-muted); margin-top: 4px;">
              ${location.city}, ${location.state} ${location.zip || ''}
            </div>
          </div>
          <span class="badge ${hasWorked ? 'badge-success' : 'badge-warning'}" style="font-size: 10px;">
            ${hasWorked ? '✓ Worked' : '○ Opportunity'}
          </span>
        </div>

        ${contractors.length > 0 ? `
          <div style="margin-bottom: 12px; padding: 10px; background: rgba(99, 102, 241, 0.08); border-radius: 6px; border-left: 3px solid var(--primary-color);">
            <div style="font-size: 11px; font-weight: 600; color: var(--primary-color); margin-bottom: 6px;">
              🔧 Contractors at this location:
            </div>
            <div style="display: flex; flex-wrap: wrap; gap: 4px;">
              ${contractors.map(c => `
                <span class="badge badge-primary" style="font-size: 10px; padding: 4px 8px;">
                  ${c.name} <span style="opacity: 0.7;">(${formatSpecialty(c.specialty)})</span>
                </span>
              `).join('')}
            </div>
          </div>
        ` : ''}

        ${hasWorked ? `
          <div style="margin-bottom: 12px; padding: 12px; background: rgba(16, 185, 129, 0.1); border-radius: 6px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <div style="font-size: 11px; color: var(--text-muted); margin-bottom: 4px;">Invoiced Amount</div>
                <div style="font-size: 20px; font-weight: bold; color: var(--success-color);">${this.formatCurrency(invoiced)}</div>
              </div>
              <div style="text-align: right;">
                <div style="font-size: 11px; color: var(--text-muted); margin-bottom: 4px;">Projects</div>
                <div style="font-size: 18px; font-weight: bold; color: var(--success-color);">${locationProjects.length}</div>
              </div>
            </div>
          </div>
        ` : ''}

        <div style="padding: 12px; background: var(--background-alt); border-radius: 6px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <div style="font-size: 12px; font-weight: 600; color: var(--text-primary);">Contacts (${contacts.length})</div>
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
                  ${contact.last_contacted ? `<span style="font-size: 10px; color: var(--text-muted);">${this.getRelativeTime(contact.last_contacted)}</span>` : ''}
                </div>
              `).join('')}
              ${contacts.length > 2 ? `<div style="font-size: 11px; color: var(--primary-color); text-align: center;">+${contacts.length - 2} more</div>` : ''}
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
   * Show location details modal (unchanged structure)
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
              <div style="font-size: 14px; font-weight: 600;">${location.city}, ${location.state} ${location.zip || ''}</div>
            </div>
            <div class="card" style="padding: 16px;">
              <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">Status</div>
              <span class="badge ${hasWorked ? 'badge-success' : 'badge-warning'}">${hasWorked ? '✓ Active Location' : '○ Opportunity'}</span>
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

              ${locationProjects.length > 0 ? `
                <div>
                  <h5 style="margin-bottom: 12px;">Projects</h5>
                  <div style="display: flex; flex-direction: column; gap: 8px;">
                    ${locationProjects.map(project => `
                      <div style="padding: 12px; background: var(--background); border-radius: 6px; border-left: 3px solid var(--success-color);">
                        <div style="display: flex; justify-content: space-between; align-items: start;">
                          <div>
                            <div style="font-weight: 600;">${project.job}</div>
                            <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">
                              ${project.start ? `${new Date(project.start).toLocaleDateString()} - ` : ''}${project.end ? new Date(project.end).toLocaleDateString() : 'Ongoing'}
                            </div>
                            ${project.contact ? `<div style="font-size: 12px; margin-top: 4px;"><strong>Contact:</strong> ${project.contact}</div>` : ''}
                          </div>
                          <div style="text-align: right;">
                            <div style="font-size: 18px; font-weight: bold; color: var(--success-color);">${this.formatCurrency(this.parseValuation(project.valuation))}</div>
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
              ${locationOpportunities.length > 0 ? `
                <div style="margin-top: 16px;">
                  <h5 style="margin-bottom: 12px;">Open Opportunities</h5>
                  <div style="display: flex; flex-direction: column; gap: 8px;">
                    ${locationOpportunities.map(opp => `
                      <div style="padding: 12px; background: var(--background); border-radius: 6px; border-left: 3px solid var(--warning-color);">
                        <div style="display: flex; justify-content: space-between;">
                          <div>
                            <div style="font-weight: 600;">${opp.job}</div>
                            <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">Start: ${opp.start ? new Date(opp.start).toLocaleDateString() : 'TBD'}</div>
                          </div>
                          <div style="font-size: 18px; font-weight: bold; color: var(--warning-color);">${this.formatCurrency(this.parseValuation(opp.valuation))}</div>
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
              <button class="btn btn-sm btn-primary" onclick="CompanyMatrixComponent.addContactFromModal('${companyId}', '${locationName}')">+ Add Contact</button>
            </div>

            ${contacts.length > 0 ? `
              <div class="table-wrapper" style="max-height: 300px; overflow-y: auto;">
                <table class="table">
                  <thead>
                    <tr><th>Name</th><th>Title</th><th>Email</th><th>Phone</th><th>Last Contact</th></tr>
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
   * Utility & UI helpers
   */
  toggleCompany(companyId) {
    if (this.state.expandedCompanies.has(companyId)) this.state.expandedCompanies.delete(companyId);
    else this.state.expandedCompanies.add(companyId);
    this.renderOverview();
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

  addContact(companyId, locationName) {
    alert(`Add contact for ${locationName} (placeholder)`);
  },
  addContactFromModal(companyId, locationName) {
    this.addContact(companyId, locationName);
  },

  setupEventListeners() {
    const searchInput = document.getElementById('matrix-search');
    if (searchInput) {
      searchInput.addEventListener('input', Utils.debounce((e) => {
        this.state.filters.search = e.target.value.toLowerCase();
        this.render();
      }, 300));
    }

    const setActive = (btn) => {
      document.querySelectorAll('#view-mode-buttons button').forEach(b => { b.classList.remove('btn-primary'); b.classList.add('btn-ghost'); });
      btn.classList.remove('btn-ghost'); btn.classList.add('btn-primary');
    };

    const viewOverviewBtn = document.getElementById('view-overview');
    if (viewOverviewBtn) viewOverviewBtn.addEventListener('click', () => { this.state.viewMode = 'overview'; setActive(viewOverviewBtn); this.render(); });

    const viewExcelBtn = document.getElementById('view-excel');
    if (viewExcelBtn) viewExcelBtn.addEventListener('click', () => { this.state.viewMode = 'excel'; setActive(viewExcelBtn); this.render(); });

    const viewConnectionsBtn = document.getElementById('view-connections');
    if (viewConnectionsBtn) viewConnectionsBtn.addEventListener('click', () => { this.state.viewMode = 'connections'; setActive(viewConnectionsBtn); this.render(); });

    const showWorkedBtn = document.getElementById('show-worked-only');
    if (showWorkedBtn) {
      showWorkedBtn.addEventListener('click', () => {
        this.state.filters.showOnlyWorked = !this.state.filters.showOnlyWorked;
        this.state.filters.showOnlyUnworked = false;
        showWorkedBtn.classList.toggle('btn-primary', this.state.filters.showOnlyWorked);
        showWorkedBtn.textContent = this.state.filters.showOnlyWorked ? 'Show All Locations' : 'Show Worked Only';

        const unworkedBtn = document.getElementById('show-unworked-only');
        if (unworkedBtn) { unworkedBtn.classList.remove('btn-primary'); unworkedBtn.textContent = 'Show Opportunities Only'; }
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
        if (workedBtn) { workedBtn.classList.remove('btn-primary'); workedBtn.textContent = 'Show Worked Only'; }
        this.render();
      });
    }

    const tierFilter = document.getElementById('matrix-tier-filter');
    if (tierFilter) tierFilter.addEventListener('change', (e) => { this.state.filters.tier = e.target.value; this.render(); });

    const expandAllBtn = document.getElementById('expand-all-btn');
    if (expandAllBtn) expandAllBtn.addEventListener('click', () => { this.state.companies.forEach(c => this.state.expandedCompanies.add(c.normalized)); this.render(); });

    const collapseAllBtn = document.getElementById('collapse-all-btn');
    if (collapseAllBtn) collapseAllBtn.addEventListener('click', () => { this.state.expandedCompanies.clear(); this.render(); });
  },

  /**
   * Error & Refresh
   */
  showError() {
    const container = document.getElementById('company-matrix-container');
    if (container) container.innerHTML = '<div class="table-empty">Error loading company matrix</div>';
  },

  async refresh() {
    console.log('🔄 Refreshing Company Matrix Component...');
    await this.loadData();
  },

  /**
   * ---------- Shared helpers ----------
   */
  hasWorkedAtLocation(company, location) {
    const hasProject = this.state.projects.some(p => p.company === company.name && p.location === location.name);
    const hasCompletedOpp = this.state.opportunities.some(o => o.company === company.name && o.location === location.name && o.status === 'Closed-Won');
    return hasProject || hasCompletedOpp;
  },

  getLocationInvoicedAmount(company, location) {
    let total = 0;
    const locationProjects = this.state.projects.filter(p => p.company === company.name && p.location === location.name);
    locationProjects.forEach(project => { total += this.parseValuation(project.valuation); });
    return total;
  },

  parseValuation(valuation) {
    if (!valuation) return 0;
    if (typeof valuation === 'number') return valuation;
    const cleaned = valuation.toString().replace(/[$,]/g, '');
    if (/k$/i.test(cleaned)) return parseFloat(cleaned) * 1000;
    if (/m$/i.test(cleaned)) return parseFloat(cleaned) * 1000000;
    const n = parseFloat(cleaned);
    return isNaN(n) ? 0 : n;
  },

  formatCurrency(amount) {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${Math.round(amount / 1000)}K`;
    return `$${amount}`;
  },

  getLocationContacts(company, location) {
    return this.state.contacts.filter(c => c.company === company.normalized && c.location === location.name);
  },

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
        if (hasWorked) { workedLocations++; totalInvoiced += invoiced; }
        else { unworkedLocations++; }
      });
    });

    const coveragePercent = totalLocations > 0 ? Math.round((workedLocations / totalLocations) * 100) : 0;

    const statsContainer = document.getElementById('matrix-stats');
    if (statsContainer) {
      statsContainer.innerHTML = `
        <div class="card-grid" style="margin-bottom: 20px;">
          <div class="card kpi-card"><div class="kpi-value">${totalCompanies}</div><div class="kpi-label">Total Companies</div></div>
          <div class="card kpi-card"><div class="kpi-value">${totalLocations}</div><div class="kpi-label">Total Locations</div></div>
          <div class="card kpi-card"><div class="kpi-value" style="color: var(--success-color);">${workedLocations}</div><div class="kpi-label">Worked Locations</div></div>
          <div class="card kpi-card"><div class="kpi-value" style="color: var(--warning-color);">${unworkedLocations}</div><div class="kpi-label">Opportunity Locations</div></div>
          <div class="card kpi-card"><div class="kpi-value">${this.formatCurrency(totalInvoiced)}</div><div class="kpi-label">Total Invoiced</div></div>
          <div class="card kpi-card"><div class="kpi-value">${coveragePercent}%</div><div class="kpi-label">Coverage Rate</div></div>
        </div>
      `;
    }
  }
};

// Expose globally
window.CompanyMatrixComponent = CompanyMatrixComponent;
console.log('📊 Company Matrix Component loaded (Overview + Excel + Connect)');
