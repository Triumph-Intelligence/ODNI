/**
 * Mock Data for Triumph Intelligence — V2
 * - No overlapping contractors at the same client/location
 * - Adds per-project performed_on, performed_by, trade, work_type
 * - Keeps your existing arrays/keys so it drops in cleanly
 */

const MockData = {
  // 20 Food & Beverage Manufacturing Companies
  companies: [
    // IMPORTANT: For each company, only ONE of Guercio/Myers is set at company level
    // to avoid "everyone everywhere" in current UI. Actual jobs below carry true contractor.
    { name: 'PepsiCo', normalized: 'pepsico', tier: 'Enterprise', status: 'Active', hq_state: 'NY',
      contractors: { electrical: 'Guercio Energy Group', mechanical: '', interior_gc: 'KMP', marketing: 'Red Door', staffing: 'Fritz Staffing' } },
    { name: 'Coca-Cola Company', normalized: 'coca-cola', tier: 'Enterprise', status: 'Active', hq_state: 'GA',
      contractors: { electrical: '', mechanical: 'Myers Industrial Services', interior_gc: 'Stable Works', marketing: 'Red Door', staffing: 'Byers' } },
    { name: 'Mondelez International', normalized: 'mondelez', tier: 'Enterprise', status: 'Active', hq_state: 'IL',
      contractors: { electrical: 'Guercio Energy Group', mechanical: '', interior_gc: 'KMP', marketing: 'Red Door', staffing: 'Byers' } },
    { name: 'Nestlé USA', normalized: 'nestle-usa', tier: 'Large', status: 'Prospect', hq_state: 'CA',
      contractors: { electrical: '', mechanical: 'Myers Industrial Services', interior_gc: 'Stable Works', marketing: '', staffing: 'Byers' } },
    { name: 'General Mills', normalized: 'general-mills', tier: 'Large', status: 'Active', hq_state: 'MN',
      contractors: { electrical: 'Guercio Energy Group', mechanical: '', interior_gc: 'KMP', marketing: 'Red Door', staffing: 'Fritz Staffing' } },
    { name: 'Kellogg Company', normalized: 'kellogg', tier: 'Large', status: 'Active', hq_state: 'MI',
      contractors: { electrical: '', mechanical: 'Myers Industrial Services', interior_gc: 'Stable Works', marketing: '', staffing: 'Fritz Staffing' } },
    { name: 'Mars Incorporated', normalized: 'mars', tier: 'Enterprise', status: 'Prospect', hq_state: 'VA',
      contractors: { electrical: 'Guercio Energy Group', mechanical: '', interior_gc: 'KMP', marketing: 'Red Door', staffing: 'Fritz Staffing' } },
    { name: 'Kraft Heinz', normalized: 'kraft-heinz', tier: 'Enterprise', status: 'Active', hq_state: 'IL',
      contractors: { electrical: '', mechanical: 'Myers Industrial Services', interior_gc: 'Stable Works', marketing: '', staffing: 'Byers' } },
    { name: 'Conagra Brands', normalized: 'conagra', tier: 'Large', status: 'Active', hq_state: 'IL',
      contractors: { electrical: 'Guercio Energy Group', mechanical: '', interior_gc: 'KMP', marketing: 'Red Door', staffing: '' } },
    { name: 'Campbell Soup Company', normalized: 'campbell', tier: 'Mid', status: 'Prospect', hq_state: 'NJ',
      contractors: { electrical: '', mechanical: 'Myers Industrial Services', interior_gc: 'Stable Works', marketing: '', staffing: 'Fritz Staffing' } },
    { name: 'Tyson Foods', normalized: 'tyson', tier: 'Enterprise', status: 'Active', hq_state: 'AR',
      contractors: { electrical: 'Guercio Energy Group', mechanical: '', interior_gc: 'KMP', marketing: '', staffing: 'Fritz Staffing' } },
    { name: 'JBS USA', normalized: 'jbs', tier: 'Enterprise', status: 'Active', hq_state: 'CO',
      contractors: { electrical: '', mechanical: 'Myers Industrial Services', interior_gc: 'Stable Works', marketing: 'Red Door', staffing: 'Byers' } },
    { name: 'Smithfield Foods', normalized: 'smithfield', tier: 'Large', status: 'Prospect', hq_state: 'VA',
      contractors: { electrical: 'Guercio Energy Group', mechanical: '', interior_gc: 'KMP', marketing: '', staffing: '' } },
    { name: 'Hormel Foods', normalized: 'hormel', tier: 'Large', status: 'Active', hq_state: 'MN',
      contractors: { electrical: '', mechanical: 'Myers Industrial Services', interior_gc: 'Stable Works', marketing: 'Red Door', staffing: 'Fritz Staffing' } },
    { name: "Pilgrim's Pride", normalized: 'pilgrims', tier: 'Large', status: 'Active', hq_state: 'CO',
      contractors: { electrical: 'Guercio Energy Group', mechanical: '', interior_gc: 'Stable Works', marketing: '', staffing: 'Byers' } },
    { name: 'Perdue Farms', normalized: 'perdue', tier: 'Mid', status: 'Prospect', hq_state: 'MD',
      contractors: { electrical: '', mechanical: '', interior_gc: 'KMP', marketing: 'Red Door', staffing: '' } },
    { name: 'Dean Foods', normalized: 'dean', tier: 'Mid', status: 'Active', hq_state: 'TX',
      contractors: { electrical: 'Guercio Energy Group', mechanical: '', interior_gc: 'Stable Works', marketing: '', staffing: 'Fritz Staffing' } },
    { name: 'Blue Diamond Growers', normalized: 'blue-diamond', tier: 'Mid', status: 'Prospect', hq_state: 'CA',
      contractors: { electrical: '', mechanical: '', interior_gc: 'Stable Works', marketing: 'Red Door', staffing: '' } },
    { name: 'Land O Lakes', normalized: 'land-o-lakes', tier: 'Large', status: 'Active', hq_state: 'MN',
      contractors: { electrical: 'Guercio Energy Group', mechanical: '', interior_gc: 'KMP', marketing: '', staffing: 'Byers' } },
    { name: 'Ocean Spray', normalized: 'ocean-spray', tier: 'Mid', status: 'Active', hq_state: 'MA',
      contractors: { electrical: 'Guercio Energy Group', mechanical: '', interior_gc: '', marketing: 'Red Door', staffing: 'Fritz Staffing' } }
  ],

  // Locations (added Pepsi PA Allentown Plant and varied across)
  locations: [
    // PepsiCo
    { company: 'pepsico', name: 'Purchase HQ', city: 'Purchase', state: 'NY', zip: '10577' },
    { company: 'pepsico', name: 'Newark Bottling', city: 'Newark', state: 'NJ', zip: '07102' },
    { company: 'pepsico', name: 'Chicago Distribution', city: 'Chicago', state: 'IL', zip: '60601' },
    { company: 'pepsico', name: 'Dallas Plant', city: 'Dallas', state: 'TX', zip: '75201' },
    { company: 'pepsico', name: 'Phoenix Facility', city: 'Phoenix', state: 'AZ', zip: '85001' },
    { company: 'pepsico', name: 'Allentown Plant', city: 'Allentown', state: 'PA', zip: '18101' },

    // Coca-Cola
    { company: 'coca-cola', name: 'Atlanta HQ', city: 'Atlanta', state: 'GA', zip: '30313' },
    { company: 'coca-cola', name: 'Miami Distribution', city: 'Miami', state: 'FL', zip: '33101' },
    { company: 'coca-cola', name: 'Houston Bottling', city: 'Houston', state: 'TX', zip: '77001' },
    { company: 'coca-cola', name: 'Seattle Facility', city: 'Seattle', state: 'WA', zip: '98101' },

    // Mondelez
    { company: 'mondelez', name: 'Chicago HQ', city: 'Chicago', state: 'IL', zip: '60601' },
    { company: 'mondelez', name: 'Philadelphia Plant', city: 'Philadelphia', state: 'PA', zip: '19019' },
    { company: 'mondelez', name: 'Portland Facility', city: 'Portland', state: 'OR', zip: '97201' },

    // Nestlé
    { company: 'nestle-usa', name: 'Glendale HQ', city: 'Glendale', state: 'CA', zip: '91203' },
    { company: 'nestle-usa', name: 'San Francisco Office', city: 'San Francisco', state: 'CA', zip: '94102' },
    { company: 'nestle-usa', name: 'Denver Distribution', city: 'Denver', state: 'CO', zip: '80201' },

    // General Mills
    { company: 'general-mills', name: 'Minneapolis HQ', city: 'Minneapolis', state: 'MN', zip: '55426' },
    { company: 'general-mills', name: 'Buffalo Plant', city: 'Buffalo', state: 'NY', zip: '14201' },
    { company: 'general-mills', name: 'Kansas City Facility', city: 'Kansas City', state: 'MO', zip: '64101' },

    // Kellogg
    { company: 'kellogg', name: 'Battle Creek HQ', city: 'Battle Creek', state: 'MI', zip: '49017' },
    { company: 'kellogg', name: 'Memphis Plant', city: 'Memphis', state: 'TN', zip: '38101' },
    { company: 'kellogg', name: 'Omaha Facility', city: 'Omaha', state: 'NE', zip: '68101' },

    // Mars
    { company: 'mars', name: 'McLean HQ', city: 'McLean', state: 'VA', zip: '22101' },
    { company: 'mars', name: 'Hackettstown Plant', city: 'Hackettstown', state: 'NJ', zip: '07840' },
    { company: 'mars', name: 'Waco Facility', city: 'Waco', state: 'TX', zip: '76701' },

    // Kraft Heinz
    { company: 'kraft-heinz', name: 'Chicago HQ', city: 'Chicago', state: 'IL', zip: '60604' },
    { company: 'kraft-heinz', name: 'Pittsburgh Office', city: 'Pittsburgh', state: 'PA', zip: '15201' },
    { company: 'kraft-heinz', name: 'Ontario Plant', city: 'Ontario', state: 'CA', zip: '91761' },
    { company: 'kraft-heinz', name: 'Madison Facility', city: 'Madison', state: 'WI', zip: '53701' },

    // Conagra
    { company: 'conagra', name: 'Chicago HQ', city: 'Chicago', state: 'IL', zip: '60654' },
    { company: 'conagra', name: 'Omaha Office', city: 'Omaha', state: 'NE', zip: '68102' },
    { company: 'conagra', name: 'Milton PA Plant', city: 'Milton', state: 'PA', zip: '17847' },

    // Campbell
    { company: 'campbell', name: 'Camden HQ', city: 'Camden', state: 'NJ', zip: '08103' },
    { company: 'campbell', name: 'Charlotte Plant', city: 'Charlotte', state: 'NC', zip: '28201' },
    { company: 'campbell', name: 'Sacramento Facility', city: 'Sacramento', state: 'CA', zip: '95814' },

    // Tyson Foods
    { company: 'tyson', name: 'Springdale HQ', city: 'Springdale', state: 'AR', zip: '72762' },
    { company: 'tyson', name: 'Dakota City Plant', city: 'Dakota City', state: 'NE', zip: '68731' },
    { company: 'tyson', name: 'Temperanceville Plant', city: 'Temperanceville', state: 'VA', zip: '23442' },
    { company: 'tyson', name: 'Amarillo Facility', city: 'Amarillo', state: 'TX', zip: '79101' },

    // JBS
    { company: 'jbs', name: 'Greeley HQ', city: 'Greeley', state: 'CO', zip: '80631' },
    { company: 'jbs', name: 'Grand Island Plant', city: 'Grand Island', state: 'NE', zip: '68801' },
    { company: 'jbs', name: 'Marshalltown Facility', city: 'Marshalltown', state: 'IA', zip: '50158' },

    // Smithfield
    { company: 'smithfield', name: 'Smithfield HQ', city: 'Smithfield', state: 'VA', zip: '23430' },
    { company: 'smithfield', name: 'Tar Heel Plant', city: 'Tar Heel', state: 'NC', zip: '28392' },
    { company: 'smithfield', name: 'Sioux Falls Facility', city: 'Sioux Falls', state: 'SD', zip: '57104' },

    // Hormel
    { company: 'hormel', name: 'Austin HQ', city: 'Austin', state: 'MN', zip: '55912' },
    { company: 'hormel', name: 'Fremont Plant', city: 'Fremont', state: 'NE', zip: '68025' },
    { company: 'hormel', name: 'Dubuque Facility', city: 'Dubuque', state: 'IA', zip: '52001' },

    // Pilgrim's
    { company: 'pilgrims', name: 'Greeley HQ', city: 'Greeley', state: 'CO', zip: '80634' },
    { company: 'pilgrims', name: 'Pittsburg Plant', city: 'Pittsburg', state: 'TX', zip: '75686' },
    { company: 'pilgrims', name: 'Athens Facility', city: 'Athens', state: 'GA', zip: '30601' },

    // Perdue
    { company: 'perdue', name: 'Salisbury HQ', city: 'Salisbury', state: 'MD', zip: '21801' },
    { company: 'perdue', name: 'Accomac Plant', city: 'Accomac', state: 'VA', zip: '23301' },
    { company: 'perdue', name: 'Bridgewater Facility', city: 'Bridgewater', state: 'VA', zip: '22812' },

    // Dean
    { company: 'dean', name: 'Dallas HQ', city: 'Dallas', state: 'TX', zip: '75234' },
    { company: 'dean', name: 'Louisville Plant', city: 'Louisville', state: 'KY', zip: '40209' },
    { company: 'dean', name: 'Rochester Facility', city: 'Rochester', state: 'MN', zip: '55901' },

    // Blue Diamond
    { company: 'blue-diamond', name: 'Sacramento HQ', city: 'Sacramento', state: 'CA', zip: '95817' },
    { company: 'blue-diamond', name: 'Salida Plant', city: 'Salida', state: 'CA', zip: '95368' },
    { company: 'blue-diamond', name: 'Turlock Facility', city: 'Turlock', state: 'CA', zip: '95380' },

    // Land O Lakes
    { company: 'land-o-lakes', name: 'Arden Hills HQ', city: 'Arden Hills', state: 'MN', zip: '55126' },
    { company: 'land-o-lakes', name: 'Spencer Plant', city: 'Spencer', state: 'WI', zip: '54479' },
    { company: 'land-o-lakes', name: 'Kiel Facility', city: 'Kiel', state: 'WI', zip: '53042' },

    // Ocean Spray
    { company: 'ocean-spray', name: 'Lakeville HQ', city: 'Lakeville', state: 'MA', zip: '02347' },
    { company: 'ocean-spray', name: 'Kenosha Plant', city: 'Kenosha', state: 'WI', zip: '53142' },
    { company: 'ocean-spray', name: 'Bordentown Facility', city: 'Bordentown', state: 'NJ', zip: '08505' }
  ],

  // Contacts (added Pepsi Allentown)
  contacts: [
    { first: 'John', last: 'Smith', email: 'john.smith@pepsico.com', phone: '555-0101', title: 'VP Operations', company: 'pepsico', location: 'Purchase HQ', last_contacted: '2024-10-05', channel: 'email', cadence: 30, last_gift: '2024-09-15' },
    { first: 'Sarah', last: 'Johnson', email: 'sarah.johnson@pepsico.com', phone: '555-0102', title: 'Plant Manager', company: 'pepsico', location: 'Newark Bottling', last_contacted: '2024-09-25', channel: 'phone', cadence: 45, last_gift: '' },
    { first: 'Michael', last: 'Chen', email: 'michael.chen@pepsico.com', phone: '555-0103', title: 'Distribution Director', company: 'pepsico', location: 'Chicago Distribution', last_contacted: '2024-08-15', channel: 'email', cadence: 30, last_gift: '2024-07-20' },
    { first: 'Anthony', last: 'DeLuca', email: 'anthony.deluca@pepsico.com', phone: '555-0104', title: 'Maintenance Manager', company: 'pepsico', location: 'Allentown Plant', last_contacted: '2024-10-11', channel: 'email', cadence: 60, last_gift: '' },

    { first: 'David', last: 'Williams', email: 'dwilliams@coca-cola.com', phone: '555-0201', title: 'SVP Operations', company: 'coca-cola', location: 'Atlanta HQ', last_contacted: '2024-10-08', channel: 'email', cadence: 30, last_gift: '2024-10-01' },
    { first: 'Jennifer', last: 'Taylor', email: 'jen.taylor@coca-cola.com', phone: '555-0202', title: 'Regional Manager', company: 'coca-cola', location: 'Miami Distribution', last_contacted: '2024-10-10', channel: 'phone', cadence: 30, last_gift: '2024-09-22' },
    { first: 'Robert', last: 'Brown', email: 'rbrown@coca-cola.com', phone: '555-0203', title: 'Operations Manager', company: 'coca-cola', location: 'Houston Bottling', last_contacted: '2024-09-10', channel: 'email', cadence: 60, last_gift: '' },

    { first: 'Lisa', last: 'Anderson', email: 'lisa.anderson@mondelez.com', phone: '555-0301', title: 'VP Facilities', company: 'mondelez', location: 'Chicago HQ', last_contacted: '2024-09-25', channel: 'email', cadence: 45, last_gift: '2024-08-30' },
    { first: 'James', last: 'Martinez', email: 'james.m@mondelez.com', phone: '555-0302', title: 'Plant Director', company: 'mondelez', location: 'Philadelphia Plant', last_contacted: '2024-09-20', channel: 'phone', cadence: 30, last_gift: '' },

    // ... (keep the rest of your original contacts — unchanged)
  ],

  // Gifts, Referrals — keep your originals (omitted here for brevity)
  gifts: [
    { contact_email: 'john.smith@pepsico.com', description: 'Starbucks Gift Card', value: 50.00, date: '2024-09-15' },
    // ... (unchanged from your set)
  ],
  referrals: [
    { referred_name: 'Susan Chen', company: 'Minute Maid', referrer_email: 'dwilliams@coca-cola.com', followup_date: '2024-10-28', status: 'Pending' },
    // ... (unchanged from your set)
  ],

  // Opportunities — added work_type where relevant
  opportunities: [
    { company: 'PepsiCo', location: 'Dallas Plant', job: 'Electrical System Upgrade', contact: 'Emily Rodriguez', start: '2025-02-01', valuation: '$125,000', status: 'Proposal', work_type: 'Capital Project Awarded' },
    { company: 'Coca-Cola Company', location: 'Seattle Facility', job: 'HVAC Replacement', contact: 'New Contact', start: '2025-01-15', valuation: '$85,000', status: 'Qualification', work_type: 'Capital Project Awarded' },
    { company: 'Mondelez International', location: 'Portland Facility', job: 'Interior Renovation', contact: 'Patricia Wilson', start: '2025-03-01', valuation: '$200,000', status: 'Discovery', work_type: 'Capital Project Awarded' },
    { company: 'Kellogg Company', location: 'Omaha Facility', job: 'Preventive Maintenance Program', contact: 'New Contact', start: '2025-02-15', valuation: '$150,000', status: 'Qualification', work_type: 'Maintenance Contract Awarded' },
    { company: 'Mars Incorporated', location: 'Waco Facility', job: 'Complete Facility Modernization', contact: 'New Contact', start: '2025-04-01', valuation: '$350,000', status: 'Discovery', work_type: 'Capital Project Awarded' },
    { company: 'Tyson Foods', location: 'Amarillo Facility', job: 'Production Line Electrical', contact: 'William Foster', start: '2025-01-20', valuation: '$175,000', status: 'Proposal', work_type: 'Capital Project Awarded' },
    { company: 'JBS USA', location: 'Marshalltown Facility', job: 'Refrigeration System Upgrade', contact: 'Gregory Hall', start: '2025-03-15', valuation: '$220,000', status: 'Proposal', work_type: 'Capital Project Awarded' },
    { company: 'Hormel Foods', location: 'Dubuque Facility', job: 'Building Automation System', contact: 'Peter Brooks', start: '2025-02-10', valuation: '$95,000', status: 'Qualification', work_type: 'Capital Project Awarded' },
    { company: 'Land O Lakes', location: 'Kiel Facility', job: 'Site Maintenance Services', contact: 'Ronald Gray', start: '2025-01-25', valuation: '$110,000', status: 'Discovery', work_type: 'Maintenance Contract Awarded' },
    { company: 'Ocean Spray', location: 'Kenosha Plant', job: 'Manufacturing Equipment Install', contact: 'George Butler', start: '2025-03-20', valuation: '$185,000', status: 'Proposal', work_type: 'Capital Project Awarded' },
    { company: 'Dean Foods', location: 'Louisville Plant', job: 'HVAC & Mechanical Systems', contact: 'Charles Powell', start: '2025-02-05', valuation: '$145,000', status: 'Qualification', work_type: 'Capital Project Awarded' },
    { company: 'Kraft Heinz', location: 'Madison Facility', job: 'Facility Expansion - Electrical', contact: 'New Contact', start: '2025-04-15', valuation: '$280,000', status: 'Discovery', work_type: 'Capital Project Awarded' }
  ],

  /**
   * Projects — NOW WITH:
   *  - performed_on (single “work date” for the job)
   *  - performed_by (contractor)
   *  - trade: 'electrical' | 'mechanical' | 'interior_gc' | 'marketing' | 'staffing'
   *  - work_type: 'Capital Project Awarded' | 'Maintenance Contract Awarded' | 'Maintenance Contract Discontinued'
   * 
   * Rule enforced: No two contractors at the same company+location record.
   * Multiple jobs for the same client are represented by multiple rows (often on different dates).
   */
  projects: [
    // —— PEPSICO ——
    // Guercio @ NJ (Electrical) — capital award
    { company: 'PepsiCo', location: 'Newark Bottling', job: 'Electrical Panel Upgrade', project_code: 'PEP-NWK-EP01',
      performed_on: '2024-10-12', start: '2024-09-01', end: '2024-12-15',
      valuation: '$95,000', performed_by: 'Guercio Energy Group', trade: 'electrical', work_type: 'Capital Project Awarded', contact: 'Sarah Johnson' },

    // Myers @ PA (Mechanical) — maintenance award (distinct location)
    { company: 'PepsiCo', location: 'Allentown Plant', job: 'Boiler Overhaul & PM Startup', project_code: 'PEP-ALL-ME01',
      performed_on: '2024-09-18', start: '2024-09-10', end: '2024-10-05',
      valuation: '$140,000', performed_by: 'Myers Industrial Services', trade: 'mechanical', work_type: 'Maintenance Contract Awarded', contact: 'Anthony DeLuca' },

    // Guercio @ IL (Electrical) — maintenance discontinued example (closing out)
    { company: 'PepsiCo', location: 'Chicago Distribution', job: 'Lighting Controls Service (Closeout)', project_code: 'PEP-CHI-EL99',
      performed_on: '2024-07-31', start: '2024-05-01', end: '2024-07-31',
      valuation: '$12,500', performed_by: 'Guercio Energy Group', trade: 'electrical', work_type: 'Maintenance Contract Discontinued', contact: 'Michael Chen' },

    // —— COCA-COLA ——
    // Myers @ TX (Mechanical) — capital project
    { company: 'Coca-Cola Company', location: 'Houston Bottling', job: 'Chiller Replacement & Piping', project_code: 'KO-HOU-ME01',
      performed_on: '2024-10-22', start: '2024-10-05', end: '2025-01-10',
      valuation: '$225,000', performed_by: 'Myers Industrial Services', trade: 'mechanical', work_type: 'Capital Project Awarded', contact: 'Robert Brown' },

    // Stable Works (interior GC) @ FL — capital project
    { company: 'Coca-Cola Company', location: 'Miami Distribution', job: 'Warehouse Office Buildout', project_code: 'KO-MIA-IG01',
      performed_on: '2024-09-14', start: '2024-08-20', end: '2024-11-25',
      valuation: '$185,000', performed_by: 'Stable Works', trade: 'interior_gc', work_type: 'Capital Project Awarded', contact: 'Jennifer Taylor' },

    // —— MONDELEZ ——
    // Guercio @ IL (Electrical) — capital project
    { company: 'Mondelez International', location: 'Chicago HQ', job: 'Power Distribution Upgrade', project_code: 'MDLZ-CHI-EL01',
      performed_on: '2024-11-03', start: '2024-09-15', end: '2024-12-15',
      valuation: '$132,000', performed_by: 'Guercio Energy Group', trade: 'electrical', work_type: 'Capital Project Awarded', contact: 'Lisa Anderson' },

    // KMP (interior) @ OR — capital project
    { company: 'Mondelez International', location: 'Portland Facility', job: 'Manufacturing Floor Interior', project_code: 'MDLZ-PDX-IG01',
      performed_on: '2024-10-02', start: '2024-08-25', end: '2024-11-20',
      valuation: '$145,000', performed_by: 'KMP', trade: 'interior_gc', work_type: 'Capital Project Awarded', contact: 'Lisa Anderson' },

    // —— NESTLE ——
    // Myers @ CA — maintenance award
    { company: 'Nestlé USA', location: 'Glendale HQ', job: 'Campus Mechanical PM Program', project_code: 'NES-GLN-ME01',
      performed_on: '2024-09-27', start: '2024-09-10', end: '2025-09-09',
      valuation: '$180,000', performed_by: 'Myers Industrial Services', trade: 'mechanical', work_type: 'Maintenance Contract Awarded', contact: 'Thomas Garcia' },

    // —— GENERAL MILLS ——
    // Guercio @ MN — capital project
    { company: 'General Mills', location: 'Minneapolis HQ', job: 'Electrical Infrastructure Phase 1', project_code: 'GIS-MSP-EL01',
      performed_on: '2024-10-09', start: '2024-09-05', end: '2025-02-01',
      valuation: '$295,000', performed_by: 'Guercio Energy Group', trade: 'electrical', work_type: 'Capital Project Awarded', contact: 'Christopher Moore' },

    // KMP @ MO — capital project
    { company: 'General Mills', location: 'Kansas City Facility', job: 'Warehouse Interior Construction', project_code: 'GIS-MCI-IG01',
      performed_on: '2024-11-04', start: '2024-10-01', end: '2025-01-20',
      valuation: '$165,000', performed_by: 'KMP', trade: 'interior_gc', work_type: 'Capital Project Awarded', contact: 'Daniel Thompson' },

    // —— KELLOGG ——
    // Myers @ TN — capital project
    { company: 'Kellogg Company', location: 'Memphis Plant', job: 'Mechanical HVAC Upgrade', project_code: 'K- MEM-ME01',
      performed_on: '2024-09-18', start: '2024-08-10', end: '2024-11-30',
      valuation: '$195,000', performed_by: 'Myers Industrial Services', trade: 'mechanical', work_type: 'Capital Project Awarded', contact: 'Kevin Harris' },

    // —— MARS ——
    // Guercio @ VA — capital project
    { company: 'Mars Incorporated', location: 'McLean HQ', job: 'Corporate Electrical Remodel', project_code: 'MRS-MCL-EL01',
      performed_on: '2024-11-01', start: '2024-09-12', end: '2024-12-20',
      valuation: '$175,000', performed_by: 'Guercio Energy Group', trade: 'electrical', work_type: 'Capital Project Awarded', contact: 'Jessica Clark' },

    // —— KRAFT HEINZ ——
    // Myers @ PA — maintenance discontinued (closing)
    { company: 'Kraft Heinz', location: 'Pittsburgh Office', job: 'Regional Mechanical Services (Closeout)', project_code: 'KHC-PIT-ME99',
      performed_on: '2024-12-05', start: '2024-08-20', end: '2024-12-05',
      valuation: '$145,000', performed_by: 'Myers Industrial Services', trade: 'mechanical', work_type: 'Maintenance Contract Discontinued', contact: 'Steven Hall' },

    // Stable Works @ WI — capital project
    { company: 'Kraft Heinz', location: 'Madison Facility', job: 'Warehouse Interior Construction', project_code: 'KHC-MSN-IG01',
      performed_on: '2024-10-28', start: '2024-09-25', end: '2024-12-30',
      valuation: '$125,000', performed_by: 'Stable Works', trade: 'interior_gc', work_type: 'Capital Project Awarded', contact: 'Rachel Walker' },

    // —— CONAGRA ——
    // Guercio @ IL — capital project
    { company: 'Conagra Brands', location: 'Chicago HQ', job: 'Main Switchgear Replacement', project_code: 'CAG-CHI-EL01',
      performed_on: '2024-09-26', start: '2024-09-01', end: '2024-11-10',
      valuation: '$210,000', performed_by: 'Guercio Energy Group', trade: 'electrical', work_type: 'Capital Project Awarded', contact: 'Laura Young' },

    // —— CAMPBELL ——
    // Myers @ NJ — maintenance award
    { company: 'Campbell Soup Company', location: 'Camden HQ', job: 'Campus Mechanical PM Program', project_code: 'CPB-CMD-ME01',
      performed_on: '2024-10-06', start: '2024-10-01', end: '2025-09-30',
      valuation: '$160,000', performed_by: 'Myers Industrial Services', trade: 'mechanical', work_type: 'Maintenance Contract Awarded', contact: 'Angela King' },

    // —— TYSON ——
    // Guercio @ AR — capital project
    { company: 'Tyson Foods', location: 'Springdale HQ', job: 'Corporate Campus Electrical', project_code: 'TSN-SPR-EL01',
      performed_on: '2024-10-15', start: '2024-09-10', end: '2025-01-20',
      valuation: '$285,000', performed_by: 'Guercio Energy Group', trade: 'electrical', work_type: 'Capital Project Awarded', contact: 'Mark Patterson' },

    // —— JBS ——
    // Myers @ NE — capital project
    { company: 'JBS USA', location: 'Grand Island Plant', job: 'Ammonia System Upgrade (Mech)', project_code: 'JBS-GRI-ME01',
      performed_on: '2024-09-29', start: '2024-09-10', end: '2024-12-15',
      valuation: '$230,000', performed_by: 'Myers Industrial Services', trade: 'mechanical', work_type: 'Capital Project Awarded', contact: 'Gregory Hall' },

    // —— SMITHFIELD ——
    // Guercio @ VA — capital project
    { company: 'Smithfield Foods', location: 'Smithfield HQ', job: 'HQ Electrical Modernization', project_code: 'SFD-SMF-EL01',
      performed_on: '2024-10-03', start: '2024-09-18', end: '2024-12-15',
      valuation: '$155,000', performed_by: 'Guercio Energy Group', trade: 'electrical', work_type: 'Capital Project Awarded', contact: 'Christine Lee' },

    // —— HORMEL ——
    // Myers @ MN — maintenance award
    { company: 'Hormel Foods', location: 'Austin HQ', job: 'Steam/Boiler PM Program', project_code: 'HRL-AUS-ME01',
      performed_on: '2024-10-04', start: '2024-10-01', end: '2025-09-30',
      valuation: '$175,000', performed_by: 'Myers Industrial Services', trade: 'mechanical', work_type: 'Maintenance Contract Awarded', contact: 'Diana Murphy' },

    // —— PILGRIM’S ——
    // Guercio @ CO — capital project
    { company: "Pilgrim's Pride", location: 'Greeley HQ', job: 'Office Electrical Upgrade', project_code: 'PPC-GRE-EL01',
      performed_on: '2024-10-07', start: '2024-09-20', end: '2024-12-10',
      valuation: '$120,000', performed_by: 'Guercio Energy Group', trade: 'electrical', work_type: 'Capital Project Awarded', contact: 'Samantha Price' },

    // —— PERDUE ——
    // KMP interior @ MD — capital project
    { company: 'Perdue Farms', location: 'Salisbury HQ', job: 'HQ Lobby Renovation', project_code: 'PRD-SBY-IG01',
      performed_on: '2024-09-21', start: '2024-09-05', end: '2024-11-30',
      valuation: '$90,000', performed_by: 'KMP', trade: 'interior_gc', work_type: 'Capital Project Awarded', contact: 'Karen Bailey' },

    // —— DEAN FOODS ——
    // Guercio @ TX — maintenance discontinued (closeout)
    { company: 'Dean Foods', location: 'Dallas HQ', job: 'Lighting Service (Closeout)', project_code: 'DF-DAL-EL99',
      performed_on: '2024-10-09', start: '2024-06-01', end: '2024-10-09',
      valuation: '$22,000', performed_by: 'Guercio Energy Group', trade: 'electrical', work_type: 'Maintenance Contract Discontinued', contact: 'Linda Torres' },

    // —— BLUE DIAMOND ——
    // Stable Works @ CA — capital project
    { company: 'Blue Diamond Growers', location: 'Salida Plant', job: 'Breakroom & Locker Interior', project_code: 'BDG-SLD-IG01',
      performed_on: '2024-10-01', start: '2024-09-10', end: '2024-11-25',
      valuation: '$130,000', performed_by: 'Stable Works', trade: 'interior_gc', work_type: 'Capital Project Awarded', contact: 'Edward Simmons' },

    // —— LAND O LAKES ——
    // Guercio @ MN — capital project
    { company: 'Land O Lakes', location: 'Arden Hills HQ', job: 'Office Electrical Upgrade', project_code: 'LOL-ARH-EL01',
      performed_on: '2024-10-11', start: '2024-09-08', end: '2024-12-10',
      valuation: '$125,000', performed_by: 'Guercio Energy Group', trade: 'electrical', work_type: 'Capital Project Awarded', contact: 'Susan Bennett' },

    // —— OCEAN SPRAY ——
    // Guercio @ MA — capital project
    { company: 'Ocean Spray', location: 'Lakeville HQ', job: 'HVAC & Electrical — Corp Offices', project_code: 'OS-LKV-EL01',
      performed_on: '2024-10-16', start: '2024-10-01', end: '2024-12-30',
      valuation: '$125,000', performed_by: 'Guercio Energy Group', trade: 'electrical', work_type: 'Capital Project Awarded', contact: 'Margaret Perry' },

    // Myers is NOT used at any of the same company+location already used by Guercio
    // (and vice versa) anywhere in this list.
  ],

  // Change Log (sample entries updated to reflect new projects/types)
  changeLog: [
    { timestamp: '2024-10-16T09:30:00', user: 'Ryan Morris', org: 'Triumph Atlantic', action: 'Project Updated', details: 'Ocean Spray Lakeville HQ performed_on set to 2024-10-16' },
    { timestamp: '2024-10-15T14:30:00', user: 'Ryan Morris', org: 'Triumph Atlantic', action: 'Project Logged', details: 'Tyson Springdale Campus Electrical performed_on 2024-10-15 (Capital Project Awarded)' },
    { timestamp: '2024-10-12T11:05:00', user: 'Gianfranco Guercio', org: 'Guercio Energy Group', action: 'Project Performed', details: 'PepsiCo Newark Bottling Electrical Panel Upgrade performed_on 2024-10-12' },
    { timestamp: '2024-10-11T10:00:00', user: 'Bill Myers', org: 'Myers Industrial Services', action: 'Project Performed', details: 'PepsiCo Allentown Plant Boiler Overhaul performed_on 2024-09-18 (Maintenance Contract Awarded)' },
    { timestamp: '2024-10-09T16:00:00', user: 'Ryan Morris', org: 'Triumph Atlantic', action: 'Contract Discontinued', details: 'Dean Foods Dallas Lighting Service closed on 2024-10-09 (Maintenance Contract Discontinued)' }
  ]
};

// Export to window
window.MockData = MockData;
