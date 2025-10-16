<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Enhanced Contractor Network Dashboard</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        :root {
            --primary: #6366f1;
            --success: #10b981;
            --warning: #f59e0b;
            --danger: #ef4444;
            --background: #ffffff;
            --text: #1f2937;
            --text-muted: #6b7280;
            --border: #e5e7eb;
            --shadow: 0 1px 3px rgba(0,0,0,0.1);
            --shadow-lg: 0 10px 25px rgba(0,0,0,0.1);
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(to bottom, #f9fafb, #f3f4f6);
            min-height: 100vh;
            color: var(--text);
        }

        .dashboard-container {
            display: flex;
            height: 100vh;
            overflow: hidden;
        }

        .map-container {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            position: relative;
        }

        .map-wrapper {
            width: 100%;
            max-width: 1200px;
            background: white;
            border-radius: 16px;
            box-shadow: var(--shadow-lg);
            padding: 20px;
        }

        #us-map {
            width: 100%;
            height: 600px;
            background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
            border-radius: 12px;
            cursor: grab;
        }

        #us-map.grabbing {
            cursor: grabbing;
        }

        .right-panel {
            width: 380px;
            background: white;
            border-left: 1px solid var(--border);
            overflow-y: auto;
            padding: 24px;
        }

        .panel-section {
            margin-bottom: 24px;
            padding-bottom: 24px;
            border-bottom: 1px solid var(--border);
        }

        .panel-section:last-child {
            border-bottom: none;
        }

        .section-title {
            font-size: 14px;
            font-weight: 600;
            color: var(--text);
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .btn-group {
            display: flex;
            gap: 4px;
        }

        .btn {
            padding: 6px 12px;
            border: none;
            border-radius: 6px;
            font-size: 13px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
            background: var(--primary);
            color: white;
        }

        .btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .btn-sm {
            padding: 4px 8px;
            font-size: 12px;
        }

        .btn-ghost {
            background: transparent;
            color: var(--text-muted);
            border: 1px solid var(--border);
        }

        .btn-ghost:hover {
            background: var(--border);
        }

        .search-input {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid var(--border);
            border-radius: 8px;
            font-size: 14px;
            transition: all 0.2s;
        }

        .search-input:focus {
            outline: none;
            border-color: var(--primary);
            box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .checkbox-group {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .checkbox-item {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 6px 8px;
            border-radius: 6px;
            cursor: pointer;
            transition: background 0.2s;
        }

        .checkbox-item:hover {
            background: #f9fafb;
        }

        .checkbox-item input[type="checkbox"] {
            cursor: pointer;
        }

        .contractor-dot {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            flex-shrink: 0;
        }

        .location-tooltip {
            position: absolute;
            background: white;
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 16px;
            box-shadow: var(--shadow-lg);
            pointer-events: none;
            max-width: 360px;
            z-index: 1000;
            display: none;
        }

        .location-tooltip.active {
            display: block;
            pointer-events: auto;
        }

        .tooltip-header {
            font-weight: 600;
            font-size: 16px;
            margin-bottom: 4px;
        }

        .tooltip-subheader {
            font-size: 13px;
            color: var(--text-muted);
            margin-bottom: 12px;
        }

        .tooltip-section {
            margin-top: 12px;
            padding-top: 12px;
            border-top: 1px solid var(--border);
        }

        .contractor-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 4px 10px;
            background: #f3f4f6;
            border-radius: 999px;
            font-size: 12px;
            margin: 4px 4px 4px 0;
        }

        .connection-suggestion {
            background: linear-gradient(135deg, rgba(99, 102, 241, 0.05), rgba(99, 102, 241, 0.02));
            border: 1px solid rgba(99, 102, 241, 0.2);
            border-radius: 8px;
            padding: 12px;
            margin-top: 8px;
        }

        .stats-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
            margin-bottom: 20px;
        }

        .stat-card {
            padding: 12px;
            background: #f9fafb;
            border-radius: 8px;
            text-align: center;
        }

        .stat-value {
            font-size: 24px;
            font-weight: 700;
            color: var(--primary);
        }

        .stat-label {
            font-size: 11px;
            color: var(--text-muted);
            margin-top: 4px;
        }

        .mini-map {
            position: absolute;
            bottom: 20px;
            left: 20px;
            width: 180px;
            height: 108px;
            background: rgba(255, 255, 255, 0.95);
            border: 1px solid var(--border);
            border-radius: 8px;
            box-shadow: var(--shadow);
        }

        .state-path {
            fill: rgba(255, 255, 255, 0.9);
            stroke: #94a3b8;
            stroke-width: 0.5;
            transition: all 0.2s;
            cursor: pointer;
        }

        .state-path:hover {
            fill: rgba(99, 102, 241, 0.1);
            stroke: var(--primary);
            stroke-width: 1;
        }

        .state-path.active {
            fill: rgba(99, 102, 241, 0.15);
        }
    </style>
</head>
<body>
    <div class="dashboard-container">
        <!-- Centered Map -->
        <div class="map-container">
            <div class="map-wrapper">
                <svg id="us-map" viewBox="0 0 1000 600" xmlns="http://www.w3.org/2000/svg">
                    <g id="map-content">
                        <!-- States layer with boundaries -->
                        <g id="states-layer"></g>
                        <!-- Connections layer -->
                        <g id="connections-layer"></g>
                        <!-- Locations layer -->
                        <g id="locations-layer"></g>
                    </g>
                </svg>
                
                <!-- Mini Map -->
                <div class="mini-map">
                    <svg viewBox="0 0 1000 600" style="width: 100%; height: 100%;">
                        <rect id="viewport-rect" fill="rgba(99,102,241,0.2)" stroke="#6366f1" stroke-width="2"/>
                    </svg>
                </div>
            </div>
        </div>

        <!-- Right Control Panel -->
        <div class="right-panel">
            <!-- Statistics -->
            <div class="panel-section">
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-value" id="stat-companies">0</div>
                        <div class="stat-label">Companies</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value" id="stat-locations">0</div>
                        <div class="stat-label">Locations</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value" id="stat-contractors">0</div>
                        <div class="stat-label">Contractors</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value" id="stat-connections">0</div>
                        <div class="stat-label">Connections</div>
                    </div>
                </div>
            </div>

            <!-- Search -->
            <div class="panel-section">
                <div class="section-title">Search</div>
                <input type="text" class="search-input" placeholder="Search companies or locations..." id="search-input">
            </div>

            <!-- View Controls -->
            <div class="panel-section">
                <div class="section-title">Map Controls</div>
                <div class="btn-group" style="margin-bottom: 12px;">
                    <button class="btn btn-sm" onclick="zoomIn()">Zoom In</button>
                    <button class="btn btn-sm" onclick="zoomOut()">Zoom Out</button>
                    <button class="btn btn-sm" onclick="resetView()">Reset</button>
                </div>
                <div class="btn-group">
                    <button class="btn btn-sm btn-ghost" onclick="fitToData()">Fit to Data</button>
                    <button class="btn btn-sm btn-ghost" onclick="exportMap()">Export PNG</button>
                </div>
            </div>

            <!-- Flow Mode -->
            <div class="panel-section">
                <div class="section-title">Connection View</div>
                <div class="checkbox-group">
                    <label class="checkbox-item">
                        <input type="radio" name="flow-mode" value="company" checked>
                        <span>Company Connections</span>
                    </label>
                    <label class="checkbox-item">
                        <input type="radio" name="flow-mode" value="contractor">
                        <span>Contractor Network</span>
                    </label>
                </div>
            </div>

            <!-- Contractors Filter -->
            <div class="panel-section">
                <div class="section-title">
                    <span>Contractors</span>
                    <div class="btn-group">
                        <button class="btn btn-sm btn-ghost" onclick="selectAllContractors()">All</button>
                        <button class="btn btn-sm btn-ghost" onclick="clearContractors()">None</button>
                    </div>
                </div>
                <div class="checkbox-group" id="contractor-filters">
                    <!-- Populated dynamically -->
                </div>
            </div>

            <!-- View Options -->
            <div class="panel-section">
                <div class="section-title">Display Options</div>
                <div class="checkbox-group">
                    <label class="checkbox-item">
                        <input type="checkbox" id="show-connections" checked>
                        <span>Show Connections</span>
                    </label>
                    <label class="checkbox-item">
                        <input type="checkbox" id="show-state-labels" checked>
                        <span>Show State Labels</span>
                    </label>
                    <label class="checkbox-item">
                        <input type="checkbox" id="show-density" checked>
                        <span>Show Location Density</span>
                    </label>
                </div>
            </div>
        </div>
    </div>

    <!-- Location Details Tooltip -->
    <div class="location-tooltip" id="location-tooltip"></div>

    <script>
        // US State paths (simplified boundaries)
        const statePaths = {
            'WA': 'M 120,80 L 240,80 240,140 120,140 Z',
            'OR': 'M 120,140 L 240,140 240,200 120,200 Z',
            'CA': 'M 120,200 L 200,200 200,380 120,380 Z',
            'NV': 'M 200,240 L 280,240 280,340 200,340 Z',
            'ID': 'M 240,80 L 340,80 340,220 240,220 Z',
            'MT': 'M 340,80 L 480,80 480,180 340,180 Z',
            'WY': 'M 340,180 L 480,180 480,280 340,280 Z',
            'UT': 'M 280,240 L 360,240 360,340 280,340 Z',
            'CO': 'M 360,280 L 480,280 480,380 360,380 Z',
            'AZ': 'M 200,340 L 320,340 320,440 200,440 Z',
            'NM': 'M 320,380 L 440,380 440,480 320,480 Z',
            'ND': 'M 480,80 L 600,80 600,180 480,180 Z',
            'SD': 'M 480,180 L 600,180 600,260 480,260 Z',
            'NE': 'M 480,260 L 600,260 600,340 480,340 Z',
            'KS': 'M 480,340 L 600,340 600,420 480,420 Z',
            'OK': 'M 480,420 L 600,420 600,480 480,480 Z',
            'TX': 'M 440,480 L 600,480 600,580 440,580 Z',
            'MN': 'M 600,100 L 700,100 700,220 600,220 Z',
            'IA': 'M 600,220 L 700,220 700,300 600,300 Z',
            'MO': 'M 600,300 L 700,300 700,400 600,400 Z',
            'AR': 'M 600,400 L 700,400 700,480 600,480 Z',
            'LA': 'M 600,480 L 700,480 700,560 600,560 Z',
            'WI': 'M 700,140 L 780,140 780,240 700,240 Z',
            'IL': 'M 700,240 L 760,240 760,360 700,360 Z',
            'MS': 'M 700,400 L 760,400 760,500 700,500 Z',
            'MI': 'M 780,140 L 840,140 840,280 780,280 Z',
            'IN': 'M 760,260 L 820,260 820,340 760,340 Z',
            'KY': 'M 760,340 L 860,340 860,400 760,400 Z',
            'TN': 'M 760,400 L 860,400 860,440 760,440 Z',
            'AL': 'M 760,440 L 820,440 820,520 760,520 Z',
            'OH': 'M 820,240 L 880,240 880,320 820,320 Z',
            'WV': 'M 860,300 L 920,300 920,360 860,360 Z',
            'VA': 'M 860,360 L 940,360 940,420 860,420 Z',
            'NC': 'M 860,420 L 960,420 960,460 860,460 Z',
            'SC': 'M 860,460 L 920,460 920,500 860,500 Z',
            'GA': 'M 820,500 L 900,500 900,560 820,560 Z',
            'FL': 'M 840,560 L 900,560 900,600 840,600 Z',
            'PA': 'M 880,200 L 960,200 960,280 880,280 Z',
            'NY': 'M 880,140 L 980,140 980,220 880,220 Z',
            'VT': 'M 960,140 L 980,140 980,200 960,200 Z',
            'NH': 'M 980,140 L 1000,140 1000,200 980,200 Z',
            'ME': 'M 980,80 L 1000,80 1000,160 980,160 Z',
            'MA': 'M 960,200 L 1000,200 1000,240 960,240 Z',
            'CT': 'M 960,240 L 1000,240 1000,260 960,260 Z',
            'RI': 'M 980,240 L 1000,240 1000,260 980,260 Z',
            'NJ': 'M 940,260 L 960,260 960,320 940,320 Z',
            'DE': 'M 940,320 L 960,320 960,340 940,340 Z',
            'MD': 'M 900,340 L 940,340 940,360 900,360 Z'
        };

        // State centers for labels
        const stateCenters = {
            'AL': {x: 790, y: 480}, 'AK': {x: 150, y: 550}, 'AZ': {x: 260, y: 390},
            'AR': {x: 650, y: 440}, 'CA': {x: 160, y: 290}, 'CO': {x: 420, y: 330},
            'CT': {x: 980, y: 250}, 'DE': {x: 950, y: 330}, 'FL': {x: 870, y: 560},
            'GA': {x: 860, y: 530}, 'HI': {x: 300, y: 580}, 'ID': {x: 290, y: 150},
            'IL': {x: 730, y: 300}, 'IN': {x: 790, y: 300}, 'IA': {x: 650, y: 260},
            'KS': {x: 540, y: 380}, 'KY': {x: 810, y: 370}, 'LA': {x: 650, y: 520},
            'ME': {x: 990, y: 120}, 'MD': {x: 920, y: 350}, 'MA': {x: 980, y: 220},
            'MI': {x: 810, y: 210}, 'MN': {x: 650, y: 160}, 'MS': {x: 730, y: 450},
            'MO': {x: 650, y: 350}, 'MT': {x: 410, y: 130}, 'NE': {x: 540, y: 300},
            'NV': {x: 240, y: 290}, 'NH': {x: 990, y: 170}, 'NJ': {x: 950, y: 290},
            'NM': {x: 380, y: 430}, 'NY': {x: 930, y: 180}, 'NC': {x: 910, y: 440},
            'ND': {x: 540, y: 130}, 'OH': {x: 850, y: 280}, 'OK': {x: 540, y: 450},
            'OR': {x: 180, y: 170}, 'PA': {x: 920, y: 240}, 'RI': {x: 990, y: 250},
            'SC': {x: 890, y: 480}, 'SD': {x: 540, y: 220}, 'TN': {x: 810, y: 420},
            'TX': {x: 520, y: 530}, 'UT': {x: 320, y: 290}, 'VT': {x: 970, y: 170},
            'VA': {x: 900, y: 390}, 'WA': {x: 180, y: 110}, 'WV': {x: 890, y: 330},
            'WI': {x: 740, y: 190}, 'WY': {x: 410, y: 230}
        };

        // Contractor colors
        const contractorColors = {
            'Guercio Energy Group': '#6366f1',
            'Myers Industrial Services': '#ec4899',
            'KMP': '#f59e0b',
            'Stable Works': '#10b981',
            'Red Door': '#ef4444',
            'Fritz Staffing': '#06b6d4',
            'Byers': '#8b5cf6'
        };

        // Mock data
        const mockData = {
            companies: [
                {name: 'TechCorp', normalized: 'techcorp', tier: 'Enterprise'},
                {name: 'RetailChain', normalized: 'retailchain', tier: 'Large'},
                {name: 'ManufactureCo', normalized: 'manufactureco', tier: 'Mid'}
            ],
            locations: [
                {company: 'techcorp', name: 'HQ', city: 'San Francisco', state: 'CA'},
                {company: 'techcorp', name: 'East Office', city: 'New York', state: 'NY'},
                {company: 'techcorp', name: 'Austin Branch', city: 'Austin', state: 'TX'},
                {company: 'retailchain', name: 'Store #1', city: 'Chicago', state: 'IL'},
                {company: 'retailchain', name: 'Store #2', city: 'Miami', state: 'FL'},
                {company: 'manufactureco', name: 'Factory', city: 'Detroit', state: 'MI'},
                {company: 'manufactureco', name: 'Warehouse', city: 'Denver', state: 'CO'}
            ],
            projects: [
                {company: 'TechCorp', location: 'HQ', performed_by: 'Guercio Energy Group', trade: 'Electrical', job: 'Panel Upgrade'},
                {company: 'TechCorp', location: 'East Office', performed_by: 'KMP', trade: 'Mechanical', job: 'HVAC Retrofit'},
                {company: 'TechCorp', location: 'Austin Branch', performed_by: 'Guercio Energy Group', trade: 'Electrical', job: 'Lighting Upgrade'},
                {company: 'RetailChain', location: 'Store #1', performed_by: 'Red Door', trade: 'Interior', job: 'Store Renovation'},
                {company: 'RetailChain', location: 'Store #2', performed_by: 'Red Door', trade: 'Interior', job: 'Display Installation'},
                {company: 'ManufactureCo', location: 'Factory', performed_by: 'Myers Industrial Services', trade: 'Industrial', job: 'Equipment Install'},
                {company: 'ManufactureCo', location: 'Warehouse', performed_by: 'Stable Works', trade: 'General', job: 'Facility Maintenance'}
            ]
        };

        let currentZoom = 1;
        let currentPanX = 0;
        let currentPanY = 0;

        // Initialize the dashboard
        function initDashboard() {
            drawStates();
            drawLocations();
            drawConnections();
            populateContractorFilters();
            updateStats();
            setupEventListeners();
        }

        // Draw state boundaries
        function drawStates() {
            const statesLayer = document.getElementById('states-layer');
            
            // Draw state paths
            Object.entries(statePaths).forEach(([state, path]) => {
                const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                pathEl.setAttribute('d', path);
                pathEl.classList.add('state-path');
                pathEl.setAttribute('data-state', state);
                
                const center = stateCenters[state];
                if (center) {
                    // Add state label
                    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                    text.setAttribute('x', center.x);
                    text.setAttribute('y', center.y);
                    text.setAttribute('text-anchor', 'middle');
                    text.setAttribute('font-size', '12');
                    text.setAttribute('font-weight', '600');
                    text.setAttribute('fill', '#64748b');
                    text.textContent = state;
                    text.classList.add('state-label');
                    
                    statesLayer.appendChild(pathEl);
                    statesLayer.appendChild(text);
                    
                    // Click handler for state
                    pathEl.addEventListener('click', () => selectState(state));
                }
            });
        }

        // Draw location pins
        function drawLocations() {
            const locationsLayer = document.getElementById('locations-layer');
            locationsLayer.innerHTML = '';
            
            mockData.locations.forEach(location => {
                const center = stateCenters[location.state];
                if (!center) return;
                
                // Add slight offset for multiple locations in same state
                const offset = Math.random() * 30 - 15;
                const x = center.x + offset;
                const y = center.y + offset;
                
                const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                g.style.cursor = 'pointer';
                
                // Find contractor for this location
                const project = mockData.projects.find(p => 
                    p.company === mockData.companies.find(c => c.normalized === location.company)?.name &&
                    p.location === location.name
                );
                
                const color = project ? (contractorColors[project.performed_by] || '#6366f1') : '#94a3b8';
                
                // Create pin path
                const pin = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                pin.setAttribute('d', 'M0,-15 C-6,-15 -9,-9 -9,-6 C-9,0 0,15 0,15 C0,15 9,0 9,-6 C9,-9 6,-15 0,-15 Z');
                pin.setAttribute('fill', color);
                pin.setAttribute('stroke', 'white');
                pin.setAttribute('stroke-width', '2');
                pin.setAttribute('transform', `translate(${x}, ${y})`);
                
                // Inner circle
                const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                circle.setAttribute('cx', x);
                circle.setAttribute('cy', y - 7);
                circle.setAttribute('r', '3');
                circle.setAttribute('fill', 'white');
                
                g.appendChild(pin);
                g.appendChild(circle);
                
                // Click handler
                g.addEventListener('click', () => showLocationDetails(location));
                
                locationsLayer.appendChild(g);
            });
        }

        // Draw connections between locations
        function drawConnections() {
            const connectionsLayer = document.getElementById('connections-layer');
            connectionsLayer.innerHTML = '';
            
            // Group locations by company
            const locationsByCompany = {};
            mockData.locations.forEach(loc => {
                if (!locationsByCompany[loc.company]) {
                    locationsByCompany[loc.company] = [];
                }
                locationsByCompany[loc.company].push(loc);
            });
            
            // Draw connections for each company
            Object.values(locationsByCompany).forEach(locations => {
                if (locations.length < 2) return;
                
                for (let i = 0; i < locations.length - 1; i++) {
                    for (let j = i + 1; j < locations.length; j++) {
                        const loc1 = locations[i];
                        const loc2 = locations[j];
                        
                        const center1 = stateCenters[loc1.state];
                        const center2 = stateCenters[loc2.state];
                        
                        if (center1 && center2) {
                            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                            line.setAttribute('x1', center1.x);
                            line.setAttribute('y1', center1.y);
                            line.setAttribute('x2', center2.x);
                            line.setAttribute('y2', center2.y);
                            line.setAttribute('stroke', '#cbd5e1');
                            line.setAttribute('stroke-width', '1');
                            line.setAttribute('stroke-dasharray', '4,4');
                            line.setAttribute('opacity', '0.5');
                            
                            connectionsLayer.appendChild(line);
                        }
                    }
                }
            });
        }

        // Show location details with contractor info and connections
        function showLocationDetails(location) {
            const tooltip = document.getElementById('location-tooltip');
            const company = mockData.companies.find(c => c.normalized === location.company);
            const project = mockData.projects.find(p => 
                p.company === company?.name && p.location === location.name
            );
            
            // Find potential connections
            const connections = findConnectionsForLocation(location, project);
            
            let html = `
                <div class="tooltip-header">${company?.name || 'Unknown Company'}</div>
                <div class="tooltip-subheader">${location.name} - ${location.city}, ${location.state}</div>
            `;
            
            if (project) {
                html += `
                    <div class="tooltip-section">
                        <strong>Contractor Work:</strong>
                        <div class="contractor-badge">
                            <span class="contractor-dot" style="background: ${contractorColors[project.performed_by] || '#6366f1'}"></span>
                            ${project.performed_by}
                        </div>
                        <div style="margin-top: 8px; font-size: 13px;">
                            <div><strong>Trade:</strong> ${project.trade}</div>
                            <div><strong>Job:</strong> ${project.job}</div>
                        </div>
                    </div>
                `;
            }
            
            if (connections.length > 0) {
                html += `
                    <div class="tooltip-section">
                        <strong>Suggested Connections:</strong>
                        ${connections.map(conn => `
                            <div class="connection-suggestion">
                                <div style="font-weight: 600; margin-bottom: 4px;">${conn.type}</div>
                                <div style="font-size: 12px; color: var(--text-muted);">
                                    ${conn.description}
                                </div>
                                <button class="btn btn-sm" style="margin-top: 8px;" onclick="initiateConnection('${conn.id}')">
                                    Connect →
                                </button>
                            </div>
                        `).join('')}
                    </div>
                `;
            }
            
            tooltip.innerHTML = html;
            tooltip.classList.add('active');
            
            // Position tooltip near the map center
            const mapRect = document.getElementById('us-map').getBoundingClientRect();
            tooltip.style.left = `${mapRect.left + mapRect.width / 2 - 180}px`;
            tooltip.style.top = `${mapRect.top + 100}px`;
        }

        // Find connection opportunities
        function findConnectionsForLocation(location, project) {
            const connections = [];
            
            if (project) {
                // Find other contractors who could work at this location
                const otherProjects = mockData.projects.filter(p => 
                    p.performed_by !== project.performed_by &&
                    p.trade !== project.trade
                );
                
                const uniqueContractors = [...new Set(otherProjects.map(p => p.performed_by))];
                
                uniqueContractors.slice(0, 2).forEach(contractor => {
                    connections.push({
                        id: `${location.company}-${location.name}-${contractor}`,
                        type: 'Trade Introduction',
                        description: `Introduce ${contractor} for additional services at this location`
                    });
                });
            }
            
            return connections;
        }

        // Populate contractor filters
        function populateContractorFilters() {
            const container = document.getElementById('contractor-filters');
            const contractors = [...new Set(mockData.projects.map(p => p.performed_by))];
            
            container.innerHTML = contractors.map(contractor => `
                <label class="checkbox-item">
                    <input type="checkbox" checked data-contractor="${contractor}">
                    <span class="contractor-dot" style="background: ${contractorColors[contractor] || '#6366f1'}"></span>
                    <span>${contractor}</span>
                </label>
            `).join('');
        }

        // Update statistics
        function updateStats() {
            document.getElementById('stat-companies').textContent = mockData.companies.length;
            document.getElementById('stat-locations').textContent = mockData.locations.length;
            document.getElementById('stat-contractors').textContent = [...new Set(mockData.projects.map(p => p.performed_by))].length;
            document.getElementById('stat-connections').textContent = mockData.projects.length;
        }

        // Map control functions
        function zoomIn() {
            currentZoom = Math.min(currentZoom * 1.2, 3);
            updateMapTransform();
        }

        function zoomOut() {
            currentZoom = Math.max(currentZoom / 1.2, 0.5);
            updateMapTransform();
        }

        function resetView() {
            currentZoom = 1;
            currentPanX = 0;
            currentPanY = 0;
            updateMapTransform();
        }

        function fitToData() {
            // Calculate bounds of all locations
            currentZoom = 0.9;
            updateMapTransform();
        }

        function updateMapTransform() {
            const g = document.getElementById('map-content');
            g.setAttribute('transform', `translate(${currentPanX}, ${currentPanY}) scale(${currentZoom})`);
            
            // Update mini-map viewport
            const viewport = document.getElementById('viewport-rect');
            if (viewport) {
                const vx = -currentPanX / currentZoom;
                const vy = -currentPanY / currentZoom;
                const vw = 1000 / currentZoom;
                const vh = 600 / currentZoom;
                viewport.setAttribute('x', vx);
                viewport.setAttribute('y', vy);
                viewport.setAttribute('width', vw);
                viewport.setAttribute('height', vh);
            }
        }

        function selectState(state) {
            document.querySelectorAll('.state-path').forEach(el => {
                el.classList.remove('active');
            });
            event.target.classList.add('active');
        }

        function selectAllContractors() {
            document.querySelectorAll('#contractor-filters input').forEach(cb => cb.checked = true);
            drawLocations();
        }

        function clearContractors() {
            document.querySelectorAll('#contractor-filters input').forEach(cb => cb.checked = false);
            drawLocations();
        }

        function initiateConnection(connectionId) {
            alert(`Initiating connection: ${connectionId}\n\nThis would open a dialog to compose an introduction email or schedule a meeting.`);
        }

        function exportMap() {
            alert('Export functionality would generate a high-resolution PNG of the current map view.');
        }

        // Setup event listeners
        function setupEventListeners() {
            // Map dragging
            const svg = document.getElementById('us-map');
            let isDragging = false;
            let startX, startY;
            
            svg.addEventListener('mousedown', (e) => {
                if (e.target === svg || e.target.classList.contains('state-path')) {
                    isDragging = true;
                    startX = e.clientX - currentPanX;
                    startY = e.clientY - currentPanY;
                    svg.classList.add('grabbing');
                }
            });
            
            window.addEventListener('mousemove', (e) => {
                if (isDragging) {
                    currentPanX = e.clientX - startX;
                    currentPanY = e.clientY - startY;
                    updateMapTransform();
                }
            });
            
            window.addEventListener('mouseup', () => {
                isDragging = false;
                svg.classList.remove('grabbing');
            });
            
            // Mouse wheel zoom
            svg.addEventListener('wheel', (e) => {
                e.preventDefault();
                if (e.deltaY < 0) {
                    zoomIn();
                } else {
                    zoomOut();
                }
            });
            
            // Close tooltip when clicking outside
            document.addEventListener('click', (e) => {
                const tooltip = document.getElementById('location-tooltip');
                if (!tooltip.contains(e.target) && !e.target.closest('#locations-layer')) {
                    tooltip.classList.remove('active');
                }
            });
            
            // View options
            document.getElementById('show-connections').addEventListener('change', (e) => {
                document.getElementById('connections-layer').style.display = e.target.checked ? 'block' : 'none';
            });
            
            document.getElementById('show-state-labels').addEventListener('change', (e) => {
                document.querySelectorAll('.state-label').forEach(label => {
                    label.style.display = e.target.checked ? 'block' : 'none';
                });
            });
        }

        // Initialize on load
        window.addEventListener('DOMContentLoaded', initDashboard);
    </script>
</body>
</html>
