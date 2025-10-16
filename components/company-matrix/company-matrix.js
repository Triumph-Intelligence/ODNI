/**
 * Enhanced Company Matrix Component
 * Now includes relationship intelligence, introduction opportunities, and contractor connections
 * LOCATION-BASED CONNECTION ANALYSIS
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
    viewMode: 'cards', // 'cards' or 'excel' or 'relationships' or 'connections'
    filters: {
      search: '',
      showOnlyWorked: false,
      showOnlyUnworked: false,
      tier: ''
    },
    expandedCompanies: new Set(),
    relationshipData: [],
    connectionData: []
  },

  /**
   * Initialize component
   */
  async init() {
    console.log('📊 Company Matrix Component initializing...');
    
    try {
      // Set current organization
      this.state.currentOrg = VisibilityService.getCurrentOrg();
      
      // Load data
      await this.loadData();
      
      // ✅ FIXED: Add view mode buttons BEFORE setting up listeners
      this.addViewModeButtons();
      
      // ✅ FIXED: Setup event listeners AFTER buttons exist
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
        <button id="view-connections" class="btn btn-sm btn-ghost" title="Make a Connection">
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
    // Get all data
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
    
    // Analyze relationships
    this.analyzeRelationships();
    
    // Analyze contractor connections (LOCATION-BASED)
    this.analyzeContractorConnections();
    
    // Render based on view mode
    this.render();
  },

  /**
   * Analyze cross-company relationships and introduction opportunities
   */
  analyzeRelationships() {
    const relationships = [];
    
    // Group locations by state
    const locationsByState = {};
    this.state.locations.forEach(location => {
      const state = location.state;
      if (!locationsByState[state]) {
        locationsByState[state] = [];
      }
      locationsByState[state].push({
        ...location,
        company: this.state.companies.find(c => c.normalized === location.company)
      });
    });
    
    // Find companies with complementary geographic presence
    this.state.companies.forEach(companyA => {
      const companyALocations = this.state.locations.filter(l => l.company === companyA.normalized);
      
      this.state.companies.forEach(companyB => {
        if (companyA.normalized >= companyB.normalized) return; // Avoid duplicates
        
        const companyBLocations = this.state.locations.filter(l => l.company === companyB.normalized);
        
        // Check for complementary coverage
        const aStates = new Set(companyALocations.map(l => l.state));
        const bStates = new Set(companyBLocations.map(l => l.state));
        
        // Find where A is strong but B is weak
        const aStrongStates = [];
        const bStrongStates = [];
        
        aStates.forEach(state => {
          const aCount = companyALocations.filter(l => l.state === state && this.hasWorkedAtLocation(companyA, l)).length;
          const bCount = companyBLocations.filter(l => l.state === state && this.hasWorkedAtLocation(companyB, l)).length;
          
          if (aCount > 0 && bCount === 0) {
            aStrongStates.push(state);
          }
        });
        
        bStates.forEach(state => {
          const bCount = companyBLocations.filter(l => l.state === state && this.hasWorkedAtLocation(companyB, l)).length;
          const aCount = companyALocations.filter(l => l.state === state && this.hasWorkedAtLocation(companyA, l)).length;
          
          if (bCount > 0 && aCount === 0) {
            bStrongStates.push(state);
          }
        });
        
        // If there's complementary coverage, create a relationship
        if (aStrongStates.length > 0 && bStrongStates.length > 0) {
          relationships.push({
            companyA: companyA.name,
            companyB: companyB.name,
            aStrength: aStrongStates,
            bStrength: bStrongStates,
            potentialValue: this.calculateRelationshipValue(companyA, companyB, aStrongStates, bStrongStates),
            type: 'Geographic Complementarity'
          });
        }
        
        // Check for same-state different-city opportunities
        const sharedStates = Array.from(aStates).filter(s => bStates.has(s));
        sharedStates.forEach(state => {
          const aCities = new Set(companyALocations.filter(l => l.state === state).map(l => l.city));
          const bCities = new Set(companyBLocations.filter(l => l.state === state).map(l => l.city));
          
          const aOnlyCities = Array.from(aCities).filter(c => !bCities.has(c));
          const bOnlyCities = Array.from(bCities).filter(c => !aCities.has(c));
          
          if (aOnlyCities.length > 0 && bOnlyCities.length > 0) {
            relationships.push({
              companyA: companyA.name,
              companyB: companyB.name,
              aStrength: aOnlyCities.map(c => `${c}, ${state}`),
              bStrength: bOnlyCities.map(c => `${c}, ${state}`),
              potentialValue: this.calculateRelationshipValue(companyA, companyB, aOnlyCities, bOnlyCities),
              type: 'Same State Coverage'
            });
          }
        });
      });
    });
    
    this.state.relationshipData = relationships.sort((a, b) => b.potentialValue - a.potentialValue);
  },

  /**
   * Calculate potential value of a relationship
   */
  calculateRelationshipValue(companyA, companyB, aStrength, bStrength) {
    // Simple scoring: tier value * number of complementary locations
    const tierValues = { 'Enterprise': 100, 'Large': 75, 'Mid': 50, 'Small': 25 };
    const aValue = tierValues[companyA.tier] || 25;
    const bValue = tierValues[companyB.tier] || 25;
    
    return (aValue + bValue) * (aStrength.length + bStrength.length);
  },

  /**
   * Analyze contractor connection opportunities - LOCATION-BASED VERSION
   */
  analyzeContractorConnections() {
    const connections = [];
    
    // Build a map of contractors to the LOCATIONS they've worked at
    const contractorToLocations = {};
    
    // Analyze which contractors have worked at which locations (based on projects)
    this.state.projects.forEach(project => {
      const company = this.state.companies.find(c => c.name === project.company);
      if (!company || !company.contractors) return;
      
      // Check which contractors are assigned to this company
      Object.entries(company.contractors).forEach(([specialty, contractor]) => {
        if (!contractor) return;
        
        if (!contractorToLocations[contractor]) {
          contractorToLocations[contractor] = [];
        }
        
        // Add this location to the contractor's worked locations
        const locationData = {
          company: project.company,
          location: project.location,
          companyNormalized: company.normalized,
          tier: company.tier,
          specialty: specialty,
          projectValue: this.parseValuation(project.valuation),
          projectName: project.job
        };
        
        // Avoid duplicates
        const exists = contractorToLocations[contractor].some(loc => 
          loc.company === locationData.company && 
          loc.location === locationData.location
        );
        
        if (!exists) {
          contractorToLocations[contractor].push(locationData);
        }
      });
    });
    
    // Find contractors who share clients or work at different locations of the same company
    const contractors = Object.keys(contractorToLocations);
    
    for (let i = 0; i < contractors.length; i++) {
      for (let j = i + 1; j < contractors.length; j++) {
        const contractorA = contractors[i];
        const contractorB = contractors[j];
        
        const locationsA = contractorToLocations[contractorA] || [];
        const locationsB = contractorToLocations[contractorB] || [];
        
        // Find shared companies (where they work at different locations)
        const sharedCompaniesMap = {};
        
        locationsA.forEach(locA => {
          const matchingB = locationsB.filter(locB => 
            locB.company === locA.company
          );
          
          if (matchingB.length > 0) {
            if (!sharedCompaniesMap[locA.company]) {
              sharedCompaniesMap[locA.company] = {
                company: locA.company,
                tier: locA.tier,
                aLocations: [],
                bLocations: [],
                aSpecialties: new Set(),
                bSpecialties: new Set()
              };
            }
            
            sharedCompaniesMap[locA.company].aLocations.push(locA);
            sharedCompaniesMap[locA.company].aSpecialties.add(locA.specialty);
            
            matchingB.forEach(locB => {
              sharedCompaniesMap[locA.company].bLocations.push(locB);
              sharedCompaniesMap[locA.company].bSpecialties.add(locB.specialty);
            });
          }
        });
        
        // Convert to array and process shared companies
        const sharedCompanies = Object.values(sharedCompaniesMap).map(item => ({
          company: item.company,
          tier: item.tier,
          aLocations: [...new Map(item.aLocations.map(l => [l.location, l])).values()],
          bLocations: [...new Map(item.bLocations.map(l => [l.location, l])).values()],
          aSpecialties: Array.from(item.aSpecialties),
          bSpecialties: Array.from(item.bSpecialties)
        }));
        
        // Find companies where A worked but B didn't
        const uniqueToA = [];
        locationsA.forEach(locA => {
          const bHasCompany = locationsB.some(locB => locB.company === locA.company);
          if (!bHasCompany) {
            const existing = uniqueToA.find(item => item.company === locA.company);
            if (!existing) {
              uniqueToA.push({
                company: locA.company,
                tier: locA.tier,
                locations: [locA],
                specialties: [locA.specialty]
              });
            } else {
              const locationExists = existing.locations.some(l => l.location === locA.location);
              if (!locationExists) {
                existing.locations.push(locA);
              }
              if (!existing.specialties.includes(locA.specialty)) {
                existing.specialties.push(locA.specialty);
              }
            }
          }
        });
        
        // Find companies where B worked but A didn't
        const uniqueToB = [];
        locationsB.forEach(locB => {
          const aHasCompany = locationsA.some(locA => locA.company === locB.company);
          if (!aHasCompany) {
            const existing = uniqueToB.find(item => item.company === locB.company);
            if (!existing) {
              uniqueToB.push({
                company: locB.company,
                tier: locB.tier,
                locations: [locB],
                specialties: [locB.specialty]
              });
            } else {
              const locationExists = existing.locations.some(l => l.location === locB.location);
              if (!locationExists) {
                existing.locations.push(locB);
              }
              if (!existing.specialties.includes(locB.specialty)) {
                existing.specialties.push(locB.specialty);
              }
            }
          }
        });
        
        // Create connection opportunity if there are shared companies or unique opportunities
        if (sharedCompanies.length > 0 || (uniqueToA.length > 0 && uniqueToB.length > 0)) {
          const allSpecialtiesA = [...new Set(locationsA.map(l => l.specialty))];
          const allSpecialtiesB = [...new Set(locationsB.map(l => l.specialty))];
          
          connections.push({
            contractorA,
            contractorB,
            sharedCompanies,  // Companies where both work but at different locations
            aCanIntroduce: uniqueToA,  // Companies/locations only A has worked at
            bCanIntroduce: uniqueToB,  // Companies/locations only B has worked at
            specialtiesA: allSpecialtiesA,
            specialtiesB: allSpecialtiesB,
            potentialValue: this.calculateLocationConnectionValue(sharedCompanies, uniqueToA, uniqueToB),
            type: this.determineLocationConnectionType(sharedCompanies, uniqueToA, uniqueToB, allSpecialtiesA, allSpecialtiesB)
          });
        }
      }
    }
    
    this.state.connectionData = connections.sort((a, b) => b.potentialValue - a.potentialValue);
  },

  /**
   * Calculate potential value of a location-based contractor connection
   */
  calculateLocationConnectionValue(sharedCompanies, uniqueA, uniqueB) {
    const tierValues = { 'Enterprise': 100, 'Large': 75, 'Mid': 50, 'Small': 25 };
    
    let value = 0;
    
    // Shared companies = strong relationship building opportunity
    // Value increases with number of different locations
    sharedCompanies.forEach(item => {
      const baseValue = tierValues[item.tier] || 25;
      const locationCount = item.aLocations.length + item.bLocations.length;
      value += baseValue * locationCount * 2;  // High multiplier for shared clients
    });
    
    // Unique companies = introduction opportunities
    uniqueA.forEach(item => {
      const baseValue = tierValues[item.tier] || 25;
      value += baseValue * item.locations.length;
    });
    
    uniqueB.forEach(item => {
      const baseValue = tierValues[item.tier] || 25;
      value += baseValue * item.locations.length;
    });
    
    return value;
  },

  /**
   * Determine the type of location-based connection opportunity
   */
  determineLocationConnectionType(sharedCompanies, uniqueA, uniqueB, specialtiesA, specialtiesB) {
    const hasShared = sharedCompanies.length > 0;
    const hasUniqueA = uniqueA.length > 0;
    const hasUniqueB = uniqueB.length > 0;
    const sameSpecialty = specialtiesA.some(s => specialtiesB.includes(s));
    
    if (hasShared && sharedCompanies.length >= 2) {
      return 'Multi-Location Partners';
    } else if (hasShared && !sameSpecialty) {
      return 'Cross-Trade Coordination';
    } else if (hasShared && sameSpecialty) {
      return 'Same-Trade Collaboration';
    } else if (hasUniqueA && hasUniqueB) {
      return 'Location Introduction Swap';
    } else {
      return 'Networking Opportunity';
    }
  },

  /**
   * Main render function
   */
  render() {
    switch(this.state.viewMode) {
      case 'excel':
        this.renderExcelView();
        break;
      case 'relationships':
        this.renderRelationshipView();
        break;
      case 'connections':
        this.renderConnectionView();
        break;
      default:
        this.renderMatrix();
    }
    this.renderStatistics();
  },

  /**
   * Render Excel-like grid view
   */
  renderExcelView() {
    const container = document.getElementById('company-matrix-container');
    if (!container) return;
    
    // Get unique states
    const states = [...new Set(this.state.locations.map(l => l.state))].sort();
    
    // Build Excel grid
    let html = `
      <div style="overflow-x: auto; max-height: 70vh;">
        <table class="excel-table" style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <thead style="position: sticky; top: 0; background: var(--background-alt); z-index: 10;">
            <tr>
              <th style="border: 1px solid var(--border-color); padding: 8px; position: sticky; left: 0; background: var(--background-alt); z-index: 11;">Company</th>
              <th style="border: 1px solid var(--border-color); padding: 8px; position: sticky; left: 120px; background: var(--background-alt); z-index: 11;">Tier</th>
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
    
    // Add rows for each company
    this.state.companies.forEach(company => {
      const companyLocations = this.state.locations.filter(l => l.company === company.normalized);
      let totalWorked = 0;
      let totalOpportunities = 0;
      
      html += `
        <tr>
          <td style="border: 1px solid var(--border-color); padding: 8px; font-weight: 600; position: sticky; left: 0; background: var(--background);">
            ${company.name}
          </td>
          <td style="border: 1px solid var(--border-color); padding: 8px; position: sticky; left: 120px; background: var(--background);">
            <span class="badge badge-secondary">${company.tier}</span>
          </td>
      `;
      
      // Add cells for each state
      states.forEach(state => {
        const stateLocations = companyLocations.filter(l => l.state === state);
        const workedCount = stateLocations.filter(l => this.hasWorkedAtLocation(company, l)).length;
        const totalCount = stateLocations.length;
        
        if (workedCount > 0) totalWorked += workedCount;
        if (totalCount - workedCount > 0) totalOpportunities += totalCount - workedCount;
        
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
        
        html += `<td style="${cellStyle}" title="${stateLocations.map(l => l.city).join(', ')}">${cellContent}</td>`;
      });
      
      // Add totals
      html += `
        <td style="border: 1px solid var(--border-color); padding: 8px; text-align: center; background: rgba(16, 185, 129, 0.05); font-weight: 600; color: var(--success-color);">
          ${totalWorked}
        </td>
        <td style="border: 1px solid var(--border-color); padding: 8px; text-align: center; background: rgba(245, 158, 11, 0.05); font-weight: 600; color: var(--warning-color);">
          ${totalOpportunities}
        </td>
      </tr>
      `;
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
   * Render Relationship Intelligence View
   */
  renderRelationshipView() {
    const container = document.getElementById('company-matrix-container');
    if (!container) return;
    
    if (this.state.relationshipData.length === 0) {
      container.innerHTML = '<div class="table-empty">No cross-company introduction opportunities found</div>';
      return;
    }
    
    let html = `
      <div class="relationship-header" style="margin-bottom: 24px;">
        <h3 style="margin: 0; margin-bottom: 8px;">🤝 Introduction Opportunities</h3>
        <p style="color: var(--text-secondary); margin: 0;">
          These companies have complementary geographic coverage and could benefit from introductions
        </p>
      </div>
      
      <div class="relationship-grid" style="display: grid; gap: 16px;">
    `;
    
    // Show top relationships
    this.state.relationshipData.slice(0, 10).forEach((rel, index) => {
      const companyA = this.state.companies.find(c => c.name === rel.companyA);
      const companyB = this.state.companies.find(c => c.name === rel.companyB);
      
      html += `
        <div class="relationship-card card" style="padding: 20px; border-left: 4px solid var(--primary-color);">
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
              ${rel.companyA} could introduce ${rel.companyB} to their contacts in 
              <strong>${rel.aStrength.join(', ')}</strong>, 
              while ${rel.companyB} could reciprocate with introductions in 
              <strong>${rel.bStrength.join(', ')}</strong>.
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
    
    html += '</div>';
    
    container.innerHTML = html;
  },

  /**
   * Render Contractor Connection View - LOCATION-BASED VERSION
   */
  renderConnectionView() {
    const container = document.getElementById('company-matrix-container');
    if (!container) return;
    
    if (this.state.connectionData.length === 0) {
      container.innerHTML = '<div class="table-empty">No contractor connection opportunities found</div>';
      return;
    }
    
    // Format specialty names
    const formatSpecialty = (spec) => {
      const names = {
        'electrical': 'Electrical',
        'mechanical': 'Mechanical',
        'interior_gc': 'Interior GC',
        'marketing': 'Marketing',
        'staffing': 'Staffing'
      };
      return names[spec] || spec;
    };
    
    let html = `
      <div class="relationship-header" style="margin-bottom: 24px;">
        <h3 style="margin: 0; margin-bottom: 8px;">🔗 Make a Connection</h3>
        <p style="color: var(--text-secondary); margin: 0;">
          Identify contractors working at different locations of the same companies - perfect for coordination and introductions
        </p>
      </div>
      
      <div class="relationship-grid" style="display: grid; gap: 16px;">
    `;
    
    // Show all connections
    this.state.connectionData.forEach((conn, index) => {
      html += `
        <div class="relationship-card card" style="padding: 20px; border-left: 4px solid var(--success-color);">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 16px;">
            <div style="display: flex; align-items: center; gap: 16px;">
              <div style="font-size: 24px; font-weight: bold; color: var(--success-color); opacity: 0.3;">
                #${index + 1}
              </div>
              <div>
                <h4 style="margin: 0; font-size: 18px;">
                  ${conn.contractorA} ↔ ${conn.contractorB}
                </h4>
                <div style="display: flex; gap: 8px; margin-top: 6px; flex-wrap: wrap;">
                  ${conn.specialtiesA.map(s => `<span class="badge badge-secondary">${formatSpecialty(s)}</span>`).join('')}
                  <span style="color: var(--text-muted); padding: 0 4px;">×</span>
                  ${conn.specialtiesB.map(s => `<span class="badge badge-secondary">${formatSpecialty(s)}</span>`).join('')}
                  <span class="badge badge-primary">${conn.type}</span>
                </div>
              </div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 11px; color: var(--text-muted); margin-bottom: 4px;">Connection Score</div>
              <div style="font-size: 24px; font-weight: bold; color: var(--success-color);">
                ${conn.potentialValue}
              </div>
            </div>
          </div>
          
          ${conn.sharedCompanies.length > 0 ? `
            <div style="margin-bottom: 16px; padding: 16px; background: rgba(16, 185, 129, 0.08); border-radius: 8px; border: 2px solid rgba(16, 185, 129, 0.2);">
              <div style="font-weight: 600; margin-bottom: 12px; color: var(--success-color); font-size: 15px;">
                🤝 Working at Different Locations of ${conn.sharedCompanies.length} Shared ${conn.sharedCompanies.length === 1 ? 'Company' : 'Companies'}
              </div>
              ${conn.sharedCompanies.map(shared => `
                <div style="margin-bottom: 12px; padding: 12px; background: white; border-radius: 6px; border-left: 3px solid var(--success-color);">
                  <div style="font-weight: 600; margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
                    <span>${shared.company}</span>
                    <span class="badge badge-secondary" style="font-size: 10px;">${shared.tier}</span>
                  </div>
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 8px;">
                    <div style="padding: 8px; background: rgba(99, 102, 241, 0.05); border-radius: 4px;">
                      <div style="font-size: 11px; color: var(--text-muted); margin-bottom: 4px; font-weight: 600;">
                        ${conn.contractorA} locations:
                      </div>
                      ${shared.aLocations.map(loc => `
                        <div style="font-size: 12px; margin-top: 4px;">
                          • ${loc.location} <span style="color: var(--text-muted); font-size: 10px;">(${formatSpecialty(loc.specialty)})</span>
                        </div>
                      `).join('')}
                    </div>
                    <div style="padding: 8px; background: rgba(139, 92, 246, 0.05); border-radius: 4px;">
                      <div style="font-size: 11px; color: var(--text-muted); margin-bottom: 4px; font-weight: 600;">
                        ${conn.contractorB} locations:
                      </div>
                      ${shared.bLocations.map(loc => `
                        <div style="font-size: 12px; margin-top: 4px;">
                          • ${loc.location} <span style="color: var(--text-muted); font-size: 10px;">(${formatSpecialty(loc.specialty)})</span>
                        </div>
                      `).join('')}
                    </div>
                  </div>
                </div>
              `).join('')}
              <div style="margin-top: 8px; padding: 8px; background: rgba(16, 185, 129, 0.05); border-radius: 4px;">
                <div style="font-size: 12px; color: var(--text-secondary); font-style: italic;">
                  💡 <strong>Key Insight:</strong> These contractors are working at different locations of the same ${conn.sharedCompanies.length === 1 ? 'company' : 'companies'}. 
                  They should coordinate on best practices, pricing strategies, and potential referrals between locations.
                </div>
              </div>
            </div>
          ` : ''}
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
            ${conn.aCanIntroduce.length > 0 ? `
              <div style="padding: 12px; background: rgba(59, 130, 246, 0.05); border-radius: 8px; border: 1px solid rgba(59, 130, 246, 0.2);">
                <div style="font-weight: 600; margin-bottom: 8px; color: var(--primary-color);">
                  ${conn.contractorA} can introduce to (${conn.aCanIntroduce.length} ${conn.aCanIntroduce.length === 1 ? 'company' : 'companies'}):
                </div>
                <div style="font-size: 13px; line-height: 1.6;">
                  ${conn.aCanIntroduce.slice(0, 3).map(item => `
                    <div style="margin-bottom: 8px; padding: 6px; background: white; border-radius: 4px;">
                      <div style="font-weight: 600; font-size: 12px;">
                        ${item.company}
                        <span class="badge badge-secondary" style="font-size: 10px; margin-left: 4px;">${item.tier}</span>
                      </div>
                      <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">
                        ${item.locations.length} location${item.locations.length > 1 ? 's' : ''}: 
                        ${item.locations.slice(0, 2).map(l => l.location).join(', ')}${item.locations.length > 2 ? '...' : ''}
                      </div>
                    </div>
                  `).join('')}
                  ${conn.aCanIntroduce.length > 3 ? `
                    <div style="font-size: 11px; color: var(--primary-color); margin-top: 6px; font-weight: 600;">
                      +${conn.aCanIntroduce.length - 3} more companies
                    </div>
                  ` : ''}
                </div>
              </div>
            ` : '<div></div>'}
            
            ${conn.bCanIntroduce.length > 0 ? `
              <div style="padding: 12px; background: rgba(139, 92, 246, 0.05); border-radius: 8px; border: 1px solid rgba(139, 92, 246, 0.2);">
                <div style="font-weight: 600; margin-bottom: 8px; color: var(--purple-color, var(--primary-color));">
                  ${conn.contractorB} can introduce to (${conn.bCanIntroduce.length} ${conn.bCanIntroduce.length === 1 ? 'company' : 'companies'}):
                </div>
                <div style="font-size: 13px; line-height: 1.6;">
                  ${conn.bCanIntroduce.slice(0, 3).map(item => `
                    <div style="margin-bottom: 8px; padding: 6px; background: white; border-radius: 4px;">
                      <div style="font-weight: 600; font-size: 12px;">
                        ${item.company}
                        <span class="badge badge-secondary" style="font-size: 10px; margin-left: 4px;">${item.tier}</span>
                      </div>
                      <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">
                        ${item.locations.length} location${item.locations.length > 1 ? 's' : ''}: 
                        ${item.locations.slice(0, 2).map(l => l.location).join(', ')}${item.locations.length > 2 ? '...' : ''}
                      </div>
                    </div>
                  `).join('')}
                  ${conn.bCanIntroduce.length > 3 ? `
                    <div style="font-size: 11px; color: var(--primary-color); margin-top: 6px; font-weight: 600;">
                      +${conn.bCanIntroduce.length - 3} more companies
                    </div>
                  ` : ''}
                </div>
              </div>
            ` : '<div></div>'}
          </div>
          
          <div style="padding: 12px; background: var(--background-alt); border-radius: 6px; margin-bottom: 12px;">
            <div style="font-size: 13px; color: var(--text-secondary);">
              <strong>💡 Why Connect:</strong> 
              ${this.generateLocationConnectionReason(conn)}
            </div>
          </div>
          
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-sm btn-primary" onclick="CompanyMatrixComponent.createContractorIntro('${conn.contractorA}', '${conn.contractorB}')">
              📧 Draft Introduction
            </button>
            <button class="btn btn-sm btn-ghost" onclick="CompanyMatrixComponent.viewLocationConnectionDetails('${conn.contractorA}', '${conn.contractorB}')">
              View Full Details
            </button>
          </div>
        </div>
      `;
    });
    
    html += '</div>';
    
    container.innerHTML = html;
  },

  /**
   * Generate connection reason - LOCATION-BASED
   */
  generateLocationConnectionReason(conn) {
    if (conn.type === 'Multi-Location Partners') {
      const totalLocations = conn.sharedCompanies.reduce((sum, company) => 
        sum + company.aLocations.length + company.bLocations.length, 0
      );
      return `${conn.contractorA} and ${conn.contractorB} are working at ${totalLocations} different locations across ${conn.sharedCompanies.length} shared ${conn.sharedCompanies.length === 1 ? 'company' : 'companies'}. They should coordinate strategies, share lessons learned, and potentially cross-refer between locations.`;
    } else if (conn.type === 'Cross-Trade Coordination') {
      return `These contractors work in different trades at locations of ${conn.sharedCompanies[0].company}. Perfect opportunity to coordinate on multi-trade projects and ensure seamless execution across locations.`;
    } else if (conn.type === 'Same-Trade Collaboration') {
      return `These contractors work in the same trade at different locations of ${conn.sharedCompanies[0].company}. They should share best practices, coordinate pricing, and potentially team up on larger multi-location projects.`;
    } else if (conn.type === 'Location Introduction Swap') {
      return `${conn.contractorA} has relationships at ${conn.aCanIntroduce.length} ${conn.aCanIntroduce.length === 1 ? 'company' : 'companies'} that ${conn.contractorB} doesn't, and vice versa. Perfect opportunity for mutual introductions to expand their networks.`;
    } else {
      return `These contractors could benefit from knowing each other for future collaboration and networking opportunities.`;
    }
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
    
    // Create email template
    const emailTemplate = `
Subject: Introduction: ${companyA} ↔ ${companyB}

Dear [Contact Name],

I wanted to introduce you to [Other Contact Name] from ${rel.companyA === companyA ? companyB : companyA}.

${companyA} has strong presence in ${rel.companyA === companyA ? rel.aStrength.join(', ') : rel.bStrength.join(', ')}, while ${companyB} has established operations in ${rel.companyB === companyB ? rel.bStrength.join(', ') : rel.aStrength.join(', ')}.

I believe there could be valuable synergies between your organizations, particularly in terms of geographic coverage and potential collaboration opportunities.

Would you both be interested in a brief introductory call to explore potential areas of mutual benefit?

Best regards,
[Your Name]
    `.trim();
    
    // In production, this would open an email composer
    alert('Email Template:\n\n' + emailTemplate);
  },

  /**
   * View detailed relationship analysis
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
    
    // Show detailed analysis
    alert(`
Relationship Analysis: ${companyA} ↔ ${companyB}

Type: ${rel.type}
Potential Value Score: ${rel.potentialValue}

${companyA} Coverage:
${rel.companyA === companyA ? rel.aStrength.map(s => '• ' + s).join('\n') : rel.bStrength.map(s => '• ' + s).join('\n')}

${companyB} Coverage:
${rel.companyB === companyB ? rel.bStrength.map(s => '• ' + s).join('\n') : rel.aStrength.map(s => '• ' + s).join('\n')}

This relationship offers strong potential for:
- Geographic expansion opportunities
- Cross-referral partnerships
- Knowledge sharing
- Joint business development
    `.trim());
  },

  /**
   * Create contractor introduction email
   */
  createContractorIntro(contractorA, contractorB) {
    const conn = this.state.connectionData.find(c => 
      (c.contractorA === contractorA && c.contractorB === contractorB) ||
      (c.contractorA === contractorB && c.contractorB === contractorA)
    );
    
    if (!conn) {
      alert('Connection data not found');
      return;
    }
    
    const sharedText = conn.sharedCompanies.length > 0 
      ? `\n\nYou're both working at different locations of ${conn.sharedCompanies.map(s => s.company).join(', ')}. This presents great opportunities for coordination and knowledge sharing.`
      : '';
    
    const introAText = conn.aCanIntroduce.length > 0
      ? `\n\n${conn.contractorA} has relationships at: ${conn.aCanIntroduce.slice(0, 3).map(c => c.company).join(', ')}${conn.aCanIntroduce.length > 3 ? ' and others' : ''}.`
      : '';
    
    const introBText = conn.bCanIntroduce.length > 0
      ? `\n${conn.contractorB} has relationships at: ${conn.bCanIntroduce.slice(0, 3).map(c => c.company).join(', ')}${conn.bCanIntroduce.length > 3 ? ' and others' : ''}.`
      : '';
    
    const emailTemplate = `
Subject: Introduction: ${contractorA} ↔ ${contractorB}

Hi [Contact A] and [Contact B],

I wanted to introduce you two as I think there could be valuable synergies between ${contractorA} and ${contractorB}.${sharedText}${introAText}${introBText}

Given your complementary work locations and specialties, I thought you might benefit from:
- Coordinating on multi-location projects
- Sharing best practices and lessons learned
- Cross-referring between your respective locations
- Exploring collaboration opportunities

Would you both be open to a brief call to explore how you might work together?

Best regards,
[Your Name]
    `.trim();
    
    alert('Email Template:\n\n' + emailTemplate);
  },

  /**
   * View location-based connection details
   */
  viewLocationConnectionDetails(contractorA, contractorB) {
    const conn = this.state.connectionData.find(c => 
      (c.contractorA === contractorA && c.contractorB === contractorB) ||
      (c.contractorA === contractorB && c.contractorB === contractorA)
    );
    
    if (!conn) {
      alert('Connection data not found');
      return;
    }
    
    const formatSpecialty = (spec) => {
      const names = {
        'electrical': 'Electrical',
        'mechanical': 'Mechanical',
        'interior_gc': 'Interior GC',
        'marketing': 'Marketing',
        'staffing': 'Staffing'
      };
      return names[spec] || spec;
    };
    
    let details = `Location-Based Connection Analysis\n${contractorA} ↔ ${contractorB}\n\nType: ${conn.type}\nConnection Score: ${conn.potentialValue}\n\n`;
    
    if (conn.sharedCompanies.length > 0) {
      details += `WORKING AT DIFFERENT LOCATIONS OF SHARED COMPANIES (${conn.sharedCompanies.length}):\n\n`;
      conn.sharedCompanies.forEach(shared => {
        details += `${shared.company} (${shared.tier}):\n`;
        details += `  ${contractorA} locations:\n`;
        shared.aLocations.forEach(loc => {
          details += `    • ${loc.location} (${formatSpecialty(loc.specialty)})\n`;
        });
        details += `  ${contractorB} locations:\n`;
        shared.bLocations.forEach(loc => {
          details += `    • ${loc.location} (${formatSpecialty(loc.specialty)})\n`;
        });
        details += '\n';
      });
    }
    
    if (conn.aCanIntroduce.length > 0) {
      details += `${contractorA.toUpperCase()} CAN INTRODUCE TO:\n`;
      conn.aCanIntroduce.forEach(item => {
        details += `${item.company} (${item.tier}) - ${item.locations.length} location(s):\n`;
        item.locations.forEach(loc => {
          details += `  • ${loc.location} (${formatSpecialty(loc.specialty)})\n`;
        });
      });
      details += '\n';
    }
    
    if (conn.bCanIntroduce.length > 0) {
      details += `${contractorB.toUpperCase()} CAN INTRODUCE TO:\n`;
      conn.bCanIntroduce.forEach(item => {
        details += `${item.company} (${item.tier}) - ${item.locations.length} location(s):\n`;
        item.locations.forEach(loc => {
          details += `  • ${loc.location} (${formatSpecialty(loc.specialty)})\n`;
        });
      });
    }
    
    alert(details.trim());
  },

  /**
   * Calculate if we've worked at a location
   */
  hasWorkedAtLocation(company, location) {
    // Check projects
    const hasProject = this.state.projects.some(p => 
      p.company === company.name && p.location === location.name
    );
    
    // Check completed opportunities
    const hasCompletedOpp = this.state.opportunities.some(o => 
      o.company === company.name && 
      o.location === location.name && 
      o.status === 'Closed-Won'
    );
    
    return hasProject || hasCompletedOpp;
  },

  /**
   * Calculate total invoiced amount for a location
   */
  getLocationInvoicedAmount(company, location) {
    let total = 0;
    
    // Sum project valuations
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
   * Parse valuation string to number
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
   * Format currency
   */
  formatCurrency(amount) {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${Math.round(amount / 1000)}K`;
    }
    return `$${amount}`;
  },

  /**
   * Get contacts for a location
   */
  getLocationContacts(company, location) {
    return this.state.contacts.filter(c => 
      c.company === company.normalized && 
      c.location === location.name
    );
  },

  /**
   * Render statistics summary
   */
  renderStatistics() {
    const totalCompanies = this.state.companies.length;
    const totalLocations = this.state.locations.length;
    
    let workedLocations = 0;
    let unworkedLocations = 0;
    let totalInvoiced = 0;
    let locationsWithContacts = 0;
    
    this.state.companies.forEach(company => {
      const companyLocations = this.state.locations.filter(l => 
        l.company === company.normalized
      );
      
      companyLocations.forEach(location => {
        const hasWorked = this.hasWorkedAtLocation(company, location);
        const invoiced = this.getLocationInvoicedAmount(company, location);
        const contacts = this.getLocationContacts(company, location);
        
        if (hasWorked) {
          workedLocations++;
          totalInvoiced += invoiced;
        } else {
          unworkedLocations++;
        }
        
        if (contacts.length > 0) {
          locationsWithContacts++;
        }
      });
    });
    
    const coveragePercent = totalLocations > 0 ? 
      Math.round((workedLocations / totalLocations) * 100) : 0;
    
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
   * Render the company matrix (Cards View)
   */
  renderMatrix() {
    const container = document.getElementById('company-matrix-container');
    if (!container) return;
    
    if (this.state.companies.length === 0) {
      container.innerHTML = '<div class="table-empty">No companies found</div>';
      return;
    }
    
    // Apply filters
    let filteredCompanies = [...this.state.companies];
    
    if (this.state.filters.search) {
      const search = this.state.filters.search.toLowerCase();
      filteredCompanies = filteredCompanies.filter(company => 
        company.name.toLowerCase().includes(search) ||
        company.tier?.toLowerCase().includes(search)
      );
    }
    
    if (this.state.filters.tier) {
      filteredCompanies = filteredCompanies.filter(company => 
        company.tier === this.state.filters.tier
      );
    }
    
    // Build matrix HTML
    const matrixHTML = filteredCompanies.map(company => {
      const companyLocations = this.state.locations.filter(l => 
        l.company === company.normalized
      );
      
      const isExpanded = this.state.expandedCompanies.has(company.normalized);
      
      // Calculate company stats
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
      
      // Apply location filters
      let displayLocations = companyLocations;
      if (this.state.filters.showOnlyWorked) {
        displayLocations = companyLocations.filter(l => 
          this.hasWorkedAtLocation(company, l)
        );
      } else if (this.state.filters.showOnlyUnworked) {
        displayLocations = companyLocations.filter(l => 
          !this.hasWorkedAtLocation(company, l)
        );
      }
      
      if (displayLocations.length === 0 && (this.state.filters.showOnlyWorked || this.state.filters.showOnlyUnworked)) {
        return ''; // Skip company if no locations match filter
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
                  <div style="font-size: 20px; font-weight: bold; color: var(--success-color);">
                    ${companyWorkedCount}
                  </div>
                  <div style="font-size: 11px; color: var(--text-muted);">Worked</div>
                </div>
                <div style="text-align: center;">
                  <div style="font-size: 20px; font-weight: bold; color: var(--warning-color);">
                    ${companyUnworkedCount}
                  </div>
                  <div style="font-size: 11px; color: var(--text-muted);">Opportunities</div>
                </div>
                <div style="text-align: center;">
                  <div style="font-size: 20px; font-weight: bold; color: var(--primary-color);">
                    ${this.formatCurrency(companyInvoiced)}
                  </div>
                  <div style="font-size: 11px; color: var(--text-muted);">Total Invoiced</div>
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
   * Render a location card
   */
  renderLocationCard(company, location) {
    const hasWorked = this.hasWorkedAtLocation(company, location);
    const invoiced = this.getLocationInvoicedAmount(company, location);
    const contacts = this.getLocationContacts(company, location);
    
    // Get projects for this location
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
            ${contacts.length === 0 ? `
              <span style="font-size: 10px; color: var(--error-color);">No contacts</span>
            ` : ''}
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
          <button class="btn btn-sm btn-ghost" style="width: 100%;">
            View Details →
          </button>
        </div>
      </div>
    `;
  },

  /**
   * Show location details modal
   */
  showLocationDetails(companyId, locationName) {
    const company = this.state.companies.find(c => c.normalized === companyId);
    const location = this.state.locations.find(l => 
      l.company === companyId && l.name === locationName
    );
    
    if (!company || !location) return;
    
    const hasWorked = this.hasWorkedAtLocation(company, location);
    const invoiced = this.getLocationInvoicedAmount(company, location);
    const contacts = this.getLocationContacts(company, location);
    
    // Get projects
    const locationProjects = this.state.projects.filter(p => 
      p.company === company.name && p.location === location.name
    );
    
    // Get opportunities
    const locationOpportunities = this.state.opportunities.filter(o => 
      o.company === company.name && o.location === location.name
    );
    
    // Create modal
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
                  <div style="font-size: 24px; font-weight: bold; color: var(--success-color);">
                    ${this.formatCurrency(invoiced)}
                  </div>
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
                              ${project.start ? `${new Date(project.start).toLocaleDateString()} - ` : ''}
                              ${project.end ? new Date(project.end).toLocaleDateString() : 'Ongoing'}
                            </div>
                            ${project.contact ? `
                              <div style="font-size: 12px; margin-top: 4px;">
                                <strong>Contact:</strong> ${project.contact}
                              </div>
                            ` : ''}
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
              
              ${locationOpportunities.length > 0 ? `
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
            
            ${contacts.length > 0 ? `
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
                        <td>
                          <a href="mailto:${contact.email}" style="color: var(--primary-color);">
                            ${contact.email}
                          </a>
                        </td>
                        <td>${contact.phone || '—'}</td>
                        <td>
                          ${contact.last_contacted ? 
                            new Date(contact.last_contacted).toLocaleDateString() : 
                            '<span style="color: var(--warning-color);">Never</span>'}
                        </td>
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
   * Get relative time string
   */
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

  /**
   * Add contact placeholder
   */
  addContact(companyId, locationName) {
    alert(`Add contact functionality for ${locationName}`);
    // In production, this would open a form to add a new contact
  },

  /**
   * Add contact from modal placeholder
   */
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
    
    const viewConnectionsBtn = document.getElementById('view-connections');
    if (viewConnectionsBtn) {
      viewConnectionsBtn.addEventListener('click', () => {
        this.state.viewMode = 'connections';
        document.querySelectorAll('#view-mode-buttons button').forEach(btn => {
          btn.classList.remove('btn-primary');
          btn.classList.add('btn-ghost');
        });
        viewConnectionsBtn.classList.remove('btn-ghost');
        viewConnectionsBtn.classList.add('btn-primary');
        this.render();
      });
    }
    
    // Filter buttons
    const showWorkedBtn = document.getElementById('show-worked-only');
    if (showWorkedBtn) {
      showWorkedBtn.addEventListener('click', () => {
        this.state.filters.showOnlyWorked = !this.state.filters.showOnlyWorked;
        this.state.filters.showOnlyUnworked = false; // Reset other filter
        showWorkedBtn.classList.toggle('btn-primary', this.state.filters.showOnlyWorked);
        showWorkedBtn.textContent = this.state.filters.showOnlyWorked ? 
          'Show All Locations' : 'Show Worked Only';
        
        // Reset unworked button
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
        this.state.filters.showOnlyWorked = false; // Reset other filter
        showUnworkedBtn.classList.toggle('btn-primary', this.state.filters.showOnlyUnworked);
        showUnworkedBtn.textContent = this.state.filters.showOnlyUnworked ? 
          'Show All Locations' : 'Show Opportunities Only';
        
        // Reset worked button
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
    
    // Expand/Collapse all
    const expandAllBtn = document.getElementById('expand-all-btn');
    if (expandAllBtn) {
      expandAllBtn.addEventListener('click', () => {
        this.state.companies.forEach(c => {
          this.state.expandedCompanies.add(c.normalized);
        });
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
   * Show error state
   */
  showError() {
    const container = document.getElementById('company-matrix-container');
    if (container) {
      container.innerHTML = '<div class="table-empty">Error loading company matrix</div>';
    }
  },

  /**
   * Refresh component
   */
  async refresh() {
    console.log('🔄 Refreshing Company Matrix Component...');
    await this.loadData();
  }
};

// Make available globally
window.CompanyMatrixComponent = CompanyMatrixComponent;

console.log('📊 Enhanced Company Matrix Component loaded (LOCATION-BASED VERSION)');
