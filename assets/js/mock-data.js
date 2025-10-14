/**
 * Mock Data for CRM Portal
 * Used for development and testing
 * 
 * This will be replaced with real Xano data in production
 * Set CONFIG.dev.useMockData = false to use real API
 */

const MOCK_DATA = {
  // Companies with contractor assignments
  companies: [
    {
      id: '1',
      name: 'PepsiCo',
      normalized: 'pepsico',
      tier: 'enterprise',
      status: 'active',
      hq_state: 'NY',
      contractors: {
        electrical: 'Guercio Energy Group',
        mechanical: 'Myers Industrial Services',
        interior_gc: 'KMP',
        marketing: 'Red Door',
        staffing: 'Fritz Staffing'
      }
    },
    {
      id: '2',
      name: 'Coca-Cola Company',
      normalized: 'coca-cola-company',
      tier: 'enterprise',
      status: 'active',
      hq_state: 'GA',
      contractors: {
        electrical: 'Guercio Energy Group',
        mechanical: '',
        interior_gc: 'Stable Works',
        marketing: 'Red Door',
        staffing: ''
      }
    },
    {
      id: '3',
      name: 'Mondelez International',
      normalized: 'mondelez-international',
      tier: 'enterprise',
      status: 'active',
      hq_state: 'IL',
      contractors: {
        electrical: '',
        mechanical: 'Myers Industrial Services',
        interior_gc: 'KMP',
        marketing: '',
        staffing: 'Byers'
      }
    },
    {
      id: '4',
      name: 'Nestlé USA',
      normalized: 'nestle-usa',
      tier: 'large',
      status: 'prospect',
      hq_state: 'CA',
      contractors: {
        electrical: '',
        mechanical: 'Myers Industrial Services',
        interior_gc: '',
        marketing: '',
        staffing: 'Byers'
      }
    },
    {
      id: '5',
      name: 'General Mills',
      normalized: 'general-mills',
      tier: 'large',
      status: 'active',
      hq_state: 'MN',
      contractors: {
        electrical: '',
        mechanical: '',
        interior_gc: 'KMP',
        marketing: 'Red Door',
        staffing: 'Fritz Staffing'
      }
    },
    {
      id: '6',
      name: 'Kellogg Company',
      normalized: 'kellogg-company',
      tier: 'large',
      status: 'active',
      hq_state: 'MI',
      contractors: {
        electrical: 'Guercio Energy Group',
        mechanical: 'Myers Industrial Services',
        interior_gc: 'Stable Works',
        marketing: '',
        staffing: ''
      }
    },
    {
      id: '7',
      name: 'Mars Inc',
      normalized: 'mars-inc',
      tier: 'enterprise',
      status: 'prospect',
      hq_state: 'VA',
      contractors: {
        electrical: '',
        mechanical: '',
        interior_gc: 'KMP',
        marketing: 'Red Door',
        staffing: 'Fritz Staffing'
      }
    },
    {
      id: '8',
      name: 'Kraft Heinz',
      normalized: 'kraft-heinz',
      tier: 'enterprise',
      status: 'active',
      hq_state: 'IL',
      contractors: {
        electrical: 'Guercio Energy Group',
        mechanical: 'Myers Industrial Services',
        interior_gc: 'Stable Works',
        marketing: '',
        staffing: 'Byers'
      }
    },
    {
      id: '9',
      name: 'Conagra Brands',
      normalized: 'conagra-brands',
      tier: 'large',
      status: 'active',
      hq_state: 'IL',
      contractors: {
        electrical: '',
        mechanical: '',
        interior_gc: 'KMP',
        marketing: 'Red Door',
        staffing: ''
      }
    },
    {
      id: '10',
      name: 'Campbell Soup',
      normalized: 'campbell-soup',
      tier: 'mid',
      status: 'prospect',
      hq_state: 'NJ',
      contractors: {
        electrical: 'Guercio Energy Group',
        mechanical: '',
        interior_gc: '',
        marketing: '',
        staffing: 'Fritz Staffing'
      }
    }
  ],

  // Locations
  locations: [
    // PepsiCo locations
    { id: '1', company_norm: 'pepsico', company_id: '1', name: 'Purchase HQ', city: 'Purchase', state: 'NY', zip: '10577' },
    { id: '2', company_norm: 'pepsico', company_id: '1', name: 'Newark Bottling', city: 'Newark', state: 'NJ', zip: '07102' },
    { id: '3', company_norm: 'pepsico', company_id: '1', name: 'Chicago Distribution', city: 'Chicago', state: 'IL', zip: '60601' },
    { id: '4', company_norm: 'pepsico', company_id: '1', name: 'Dallas Plant', city: 'Dallas', state: 'TX', zip: '75201' },
    { id: '5', company_norm: 'pepsico', company_id: '1', name: 'Phoenix Facility', city: 'Phoenix', state: 'AZ', zip: '85001' },
    
    // Coca-Cola locations
    { id: '6', company_norm: 'coca-cola-company', company_id: '2', name: 'Atlanta HQ', city: 'Atlanta', state: 'GA', zip: '30313' },
    { id: '7', company_norm: 'coca-cola-company', company_id: '2', name: 'Miami Distribution', city: 'Miami', state: 'FL', zip: '33101' },
    { id: '8', company_norm: 'coca-cola-company', company_id: '2', name: 'Houston Bottling', city: 'Houston', state: 'TX', zip: '77001' },
    { id: '9', company_norm: 'coca-cola-company', company_id: '2', name: 'Seattle Facility', city: 'Seattle', state: 'WA', zip: '98101' },
    
    // Mondelez locations
    { id: '10', company_norm: 'mondelez-international', company_id: '3', name: 'Chicago HQ', city: 'Chicago', state: 'IL', zip: '60601' },
    { id: '11', company_norm: 'mondelez-international', company_id: '3', name: 'Philadelphia Plant', city: 'Philadelphia', state: 'PA', zip: '19019' },
    { id: '12', company_norm: 'mondelez-international', company_id: '3', name: 'Portland Facility', city: 'Portland', state: 'OR', zip: '97201' },
    
    // Nestlé locations
    { id: '13', company_norm: 'nestle-usa', company_id: '4', name: 'Glendale HQ', city: 'Glendale', state: 'CA', zip: '91203' },
    { id: '14', company_norm: 'nestle-usa', company_id: '4', name: 'San Francisco Office', city: 'San Francisco', state: 'CA', zip: '94102' },
    { id: '15', company_norm: 'nestle-usa', company_id: '4', name: 'Denver Distribution', city: 'Denver', state: 'CO', zip: '80201' },
    
    // General Mills locations
    { id: '16', company_norm: 'general-mills', company_id: '5', name: 'Minneapolis HQ', city: 'Minneapolis', state: 'MN', zip: '55426' },
    { id: '17', company_norm: 'general-mills', company_id: '5', name: 'Buffalo Plant', city: 'Buffalo', state: 'NY', zip: '14201' },
    { id: '18', company_norm: 'general-mills', company_id: '5', name: 'Kansas City Facility', city: 'Kansas City', state: 'MO', zip: '64101' },
    
    // Additional locations for other companies...
    { id: '19', company_norm: 'kellogg-company', company_id: '6', name: 'Battle Creek HQ', city: 'Battle Creek', state: 'MI', zip: '49017' },
    { id: '20', company_norm: 'kellogg-company', company_id: '6', name: 'Memphis Plant', city: 'Memphis', state: 'TN', zip: '38101' },
    { id: '21', company_norm: 'mars-inc', company_id: '7', name: 'McLean HQ', city: 'McLean', state: 'VA', zip: '22101' },
    { id: '22', company_norm: 'mars-inc', company_id: '7', name: 'Hackettstown Plant', city: 'Hackettstown', state: 'NJ', zip: '07840' },
    { id: '23', company_norm: 'kraft-heinz', company_id: '8', name: 'Chicago HQ', city: 'Chicago', state: 'IL', zip: '60604' },
    { id: '24', company_norm: 'conagra-brands', company_id: '9', name: 'Chicago HQ', city: 'Chicago', state: 'IL', zip: '60654' },
    { id: '25', company_norm: 'campbell-soup', company_id: '10', name: 'Camden HQ', city: 'Camden', state: 'NJ', zip: '08103' }
  ],

  // Contacts
  contacts: [
    // PepsiCo contacts
    { id: '1', first: 'John', last: 'Smith', email: 'john.smith@pepsico.com', phone: '555-0101', title: 'VP Operations', company_norm: 'pepsico', company_id: '1', location_name: 'Purchase HQ', last_contacted: '2024-12-20', preferred_channel: 'email', cadence_days: 30, last_gift_date: '2024-11-15' },
    { id: '2', first: 'Sarah', last: 'Johnson', email: 'sarah.johnson@pepsico.com', phone: '555-0102', title: 'Plant Manager', company_norm: 'pepsico', company_id: '1', location_name: 'Newark Bottling', last_contacted: '2024-11-25', preferred_channel: 'phone', cadence_days: 45, last_gift_date: '' },
    { id: '3', first: 'Michael', last: 'Chen', email: 'michael.chen@pepsico.com', phone: '555-0103', title: 'Distribution Director', company_norm: 'pepsico', company_id: '1', location_name: 'Chicago Distribution', last_contacted: '2024-10-15', preferred_channel: 'email', cadence_days: 30, last_gift_date: '2024-09-20' },
    { id: '4', first: 'Emily', last: 'Rodriguez', email: 'emily.r@pepsico.com', phone: '555-0104', title: 'Facilities Manager', company_norm: 'pepsico', company_id: '1', location_name: 'Dallas Plant', last_contacted: '', preferred_channel: 'linkedin', cadence_days: 60, last_gift_date: '' },
    
    // Coca-Cola contacts
    { id: '5', first: 'David', last: 'Williams', email: 'dwilliams@coca-cola.com', phone: '555-0201', title: 'SVP Operations', company_norm: 'coca-cola-company', company_id: '2', location_name: 'Atlanta HQ', last_contacted: '2024-12-18', preferred_channel: 'email', cadence_days: 30, last_gift_date: '2024-12-10' },
    { id: '6', first: 'Jennifer', last: 'Taylor', email: 'jen.taylor@coca-cola.com', phone: '555-0202', title: 'Regional Manager', company_norm: 'coca-cola-company', company_id: '2', location_name: 'Miami Distribution', last_contacted: '2024-12-15', preferred_channel: 'phone', cadence_days: 30, last_gift_date: '2024-11-22' },
    { id: '7', first: 'Robert', last: 'Brown', email: 'rbrown@coca-cola.com', phone: '555-0203', title: 'Operations Manager', company_norm: 'coca-cola-company', company_id: '2', location_name: 'Houston Bottling', last_contacted: '2024-11-10', preferred_channel: 'email', cadence_days: 60, last_gift_date: '' },
    
    // Mondelez contacts
    { id: '8', first: 'Lisa', last: 'Anderson', email: 'lisa.anderson@mondelez.com', phone: '555-0301', title: 'VP Facilities', company_norm: 'mondelez-international', company_id: '3', location_name: 'Chicago HQ', last_contacted: '2024-12-05', preferred_channel: 'email', cadence_days: 45, last_gift_date: '2024-10-30' },
    { id: '9', first: 'James', last: 'Martinez', email: 'james.m@mondelez.com', phone: '555-0302', title: 'Plant Director', company_norm: 'mondelez-international', company_id: '3', location_name: 'Philadelphia Plant', last_contacted: '2024-11-20', preferred_channel: 'phone', cadence_days: 30, last_gift_date: '' },
    { id: '10', first: 'Patricia', last: 'Wilson', email: 'pwilson@mondelez.com', phone: '555-0303', title: 'Maintenance Manager', company_norm: 'mondelez-international', company_id: '3', location_name: 'Portland Facility', last_contacted: '', preferred_channel: 'email', cadence_days: 90, last_gift_date: '' },
    
    // Nestlé contacts
    { id: '11', first: 'Thomas', last: 'Garcia', email: 'thomas.garcia@nestle.com', phone: '555-0401', title: 'Director Operations', company_norm: 'nestle-usa', company_id: '4', location_name: 'Glendale HQ', last_contacted: '2024-12-08', preferred_channel: 'email', cadence_days: 60, last_gift_date: '' },
    { id: '12', first: 'Nancy', last: 'Lee', email: 'nancy.lee@nestle.com', phone: '555-0402', title: 'Facilities Coordinator', company_norm: 'nestle-usa', company_id: '4', location_name: 'San Francisco Office', last_contacted: '2024-10-20', preferred_channel: 'linkedin', cadence_days: 90, last_gift_date: '' },
    
    // General Mills contacts
    { id: '13', first: 'Christopher', last: 'Moore', email: 'chris.moore@genmills.com', phone: '555-0501', title: 'VP Engineering', company_norm: 'general-mills', company_id: '5', location_name: 'Minneapolis HQ', last_contacted: '2024-12-12', preferred_channel: 'email', cadence_days: 30, last_gift_date: '2024-12-05' },
    { id: '14', first: 'Amanda', last: 'Davis', email: 'amanda.davis@genmills.com', phone: '555-0502', title: 'Plant Manager', company_norm: 'general-mills', company_id: '5', location_name: 'Buffalo Plant', last_contacted: '2024-11-28', preferred_channel: 'phone', cadence_days: 45, last_gift_date: '' },
    { id: '15', first: 'Daniel', last: 'Thompson', email: 'dthompson@genmills.com', phone: '555-0503', title: 'Operations Lead', company_norm: 'general-mills', company_id: '5', location_name: 'Kansas City Facility', last_contacted: '2024-10-05', preferred_channel: 'email', cadence_days: 30, last_gift_date: '' },
    
    // Additional contacts
    { id: '16', first: 'Michelle', last: 'White', email: 'michelle.white@kellogg.com', phone: '555-0601', title: 'Director Facilities', company_norm: 'kellogg-company', company_id: '6', location_name: 'Battle Creek HQ', last_contacted: '2024-12-10', preferred_channel: 'email', cadence_days: 30, last_gift_date: '' },
    { id: '17', first: 'Kevin', last: 'Harris', email: 'kevin.harris@kellogg.com', phone: '555-0602', title: 'Plant Supervisor', company_norm: 'kellogg-company', company_id: '6', location_name: 'Memphis Plant', last_contacted: '2024-11-15', preferred_channel: 'phone', cadence_days: 60, last_gift_date: '2024-10-25' },
    { id: '18', first: 'Jessica', last: 'Clark', email: 'jessica.clark@mars.com', phone: '555-0701', title: 'VP Operations', company_norm: 'mars-inc', company_id: '7', location_name: 'McLean HQ', last_contacted: '2024-12-01', preferred_channel: 'email', cadence_days: 45, last_gift_date: '' },
    { id: '19', first: 'Rachel', last: 'Walker', email: 'rachel.walker@kraftheinz.com', phone: '555-0801', title: 'SVP Manufacturing', company_norm: 'kraft-heinz', company_id: '8', location_name: 'Chicago HQ', last_contacted: '2024-12-14', preferred_channel: 'email', cadence_days: 30, last_gift_date: '2024-11-30' }
  ],

  // Activities
  activities: [
    { id: '1', contact_id: '1', contact_email: 'john.smith@pepsico.com', type: 'call', date: '2024-12-20', notes: 'Discussed upcoming facility expansion' },
    { id: '2', contact_id: '5', contact_email: 'dwilliams@coca-cola.com', type: 'email', date: '2024-12-18', notes: 'Sent proposal for new project' },
    { id: '3', contact_id: '13', contact_email: 'chris.moore@genmills.com', type: 'meeting', date: '2024-12-12', notes: 'Site visit and facility walkthrough' }
  ],

  // Gifts
  gifts: [
    { id: '1', contact_email: 'john.smith@pepsico.com', contact_id: '1', description: 'Starbucks Gift Card', value: 50.00, date: '2024-11-15', notes: 'Holiday gift' },
    { id: '2', contact_email: 'michael.chen@pepsico.com', contact_id: '3', description: 'Holiday Gift Basket', value: 75.00, date: '2024-09-20', notes: 'Thank you for referral' },
    { id: '3', contact_email: 'dwilliams@coca-cola.com', contact_id: '5', description: 'Restaurant Gift Card', value: 100.00, date: '2024-12-10', notes: 'Appreciation for project' },
    { id: '4', contact_email: 'jen.taylor@coca-cola.com', contact_id: '6', description: 'Wine & Cheese Basket', value: 85.00, date: '2024-11-22', notes: 'Holiday gift' },
    { id: '5', contact_email: 'lisa.anderson@mondelez.com', contact_id: '8', description: 'Amazon Gift Card', value: 50.00, date: '2024-10-30', notes: 'Thank you' },
    { id: '6', contact_email: 'chris.moore@genmills.com', contact_id: '13', description: 'Coffee Subscription', value: 60.00, date: '2024-12-05', notes: 'Holiday gift' },
    { id: '7', contact_email: 'kevin.harris@kellogg.com', contact_id: '17', description: 'Sports Tickets', value: 150.00, date: '2024-10-25', notes: 'Thank you for large project' },
    { id: '8', contact_email: 'rachel.walker@kraftheinz.com', contact_id: '19', description: 'Spa Gift Certificate', value: 120.00, date: '2024-11-30', notes: 'Appreciation' }
  ],

  // Referrals
  referrals: [
    { id: '1', referred_name: 'Mark Patterson', company: 'Frito-Lay', referrer_email: 'john.smith@pepsico.com', referrer_id: '1', followup_date: '2024-12-30', cadence_days: 7, status: 'pending' },
    { id: '2', referred_name: 'Susan Chen', company: 'Minute Maid', referrer_email: 'dwilliams@coca-cola.com', referrer_id: '5', followup_date: '2024-12-28', cadence_days: 7, status: 'pending' },
    { id: '3', referred_name: 'Robert Kim', company: 'Cadbury', referrer_email: 'lisa.anderson@mondelez.com', referrer_id: '8', followup_date: '2025-01-05', cadence_days: 7, status: 'contacted' },
    { id: '4', referred_name: 'Maria Gonzalez', company: 'Purina', referrer_email: 'thomas.garcia@nestle.com', referrer_id: '11', followup_date: '2024-12-25', cadence_days: 7, status: 'meeting-scheduled' },
    { id: '5', referred_name: 'Andrew Foster', company: 'Pillsbury', referrer_email: 'chris.moore@genmills.com', referrer_id: '13', followup_date: '2025-01-10', cadence_days: 7, status: 'pending' },
    { id: '6', referred_name: 'Nicole Sanders', company: 'Pringles', referrer_email: 'michelle.white@kellogg.com', referrer_id: '16', followup_date: '2024-12-22', cadence_days: 7, status: 'closed-won' }
  ],

  // Opportunities
  opportunities: [
    { id: '1', company: 'PepsiCo', company_norm: 'pepsico', company_id: '1', location: 'Dallas Plant', job: 'Electrical System Upgrade', contact: 'Emily Rodriguez', start: '2025-02-01', valuation: 125000, stage: 'proposal' },
    { id: '2', company: 'Coca-Cola Company', company_norm: 'coca-cola-company', company_id: '2', location: 'Seattle Facility', job: 'HVAC Replacement', contact: 'New Contact', start: '2025-01-15', valuation: 85000, stage: 'qualified' },
    { id: '3', company: 'Mondelez International', company_norm: 'mondelez-international', company_id: '3', location: 'Portland Facility', job: 'Interior Renovation', contact: 'Patricia Wilson', start: '2025-03-01', valuation: 200000, stage: 'negotiation' },
    { id: '4', company: 'Kellogg Company', company_norm: 'kellogg-company', company_id: '6', location: 'Memphis Plant', job: 'Electrical & Mechanical Upgrades', contact: 'Kevin Harris', start: '2025-02-15', valuation: 150000, stage: 'proposal' },
    { id: '5', company: 'Mars Inc', company_norm: 'mars-inc', company_id: '7', location: 'Hackettstown Plant', job: 'Complete Facility Modernization', contact: 'New Contact', start: '2025-04-01', valuation: 350000, stage: 'lead' }
  ],

  // Projects
  projects: [
    { id: '1', company: 'PepsiCo', company_norm: 'pepsico', company_id: '1', location: 'Chicago Distribution', job: 'Warehouse Lighting Upgrade', contact: 'Michael Chen', start: '2024-11-01', end: '2025-01-15', valuation: 95000, status: 'in-progress' },
    { id: '2', company: 'Coca-Cola Company', company_norm: 'coca-cola-company', company_id: '2', location: 'Atlanta HQ', job: 'Office Renovation - Floor 3', contact: 'David Williams', start: '2024-12-01', end: '2025-02-28', valuation: 180000, status: 'in-progress' },
    { id: '3', company: 'General Mills', company_norm: 'general-mills', company_id: '5', location: 'Buffalo Plant', job: 'Production Line Electrical', contact: 'Amanda Davis', start: '2024-10-15', end: '2025-01-30', valuation: 220000, status: 'in-progress' },
    { id: '4', company: 'Kraft Heinz', company_norm: 'kraft-heinz', company_id: '8', location: 'Chicago HQ', job: 'Building Automation System', contact: 'Rachel Walker', start: '2024-11-15', end: '2025-03-01', valuation: 165000, status: 'in-progress' }
  ],

  // Change Log
  changeLog: [
    { id: '1', timestamp: '2024-12-15T10:30:00', user: 'John Doe', organization: 'Triumph Atlantic', action: 'Contractor Assignment', details: 'PepsiCo: Assigned Guercio Energy Group as electrical contractor' },
    { id: '2', timestamp: '2024-12-15T09:15:00', user: 'Jane Smith', organization: 'Red Door', action: 'Contact Added', details: 'Added Jennifer Taylor (jen.taylor@coca-cola.com) at Coca-Cola' },
    { id: '3', timestamp: '2024-12-14T16:45:00', user: 'Mike Johnson', organization: 'Myers Industrial Services', action: 'Activity Logged', details: 'Phone call with Lisa Anderson on 2024-12-14' },
    { id: '4', timestamp: '2024-12-14T14:20:00', user: 'Sarah Williams', organization: 'Triumph Atlantic', action: 'Gift Added', details: 'Restaurant Gift Card ($100.00) for David Williams' },
    { id: '5', timestamp: '2024-12-13T11:30:00', user: 'John Doe', organization: 'KMP', action: 'Contractor Assignment', details: 'Mondelez: Assigned KMP as interior GC' },
    { id: '6', timestamp: '2024-12-13T10:00:00', user: 'Jane Smith', organization: 'Fritz Staffing', action: 'Contact Updated', details: 'Updated Christopher Moore last contact date to 2024-12-12' },
    { id: '7', timestamp: '2024-12-12T15:30:00', user: 'Mike Johnson', organization: 'Guercio Energy Group', action: 'Opportunity Created', details: 'New opportunity: PepsiCo Dallas Plant - $125K' },
    { id: '8', timestamp: '2024-12-12T09:45:00', user: 'Sarah Williams', organization: 'Triumph Atlantic', action: 'Location Imported', details: 'Kellogg: 3 locations added' },
    { id: '9', timestamp: '2024-12-11T16:15:00', user: 'John Doe', organization: 'Stable Works', action: 'Contact Added', details: 'Added Michelle White (michelle.white@kellogg.com)' },
    { id: '10', timestamp: '2024-12-11T13:20:00', user: 'Jane Smith', organization: 'Myers Industrial Services', action: 'Activity Logged', details: 'Meeting with Thomas Garcia on 2024-12-08' }
  ]
};

// Make available globally
window.MOCK_DATA = MOCK_DATA;

// Log initialization
if (CONFIG.dev.debugMode) {
  console.log('📊 Mock data loaded:', {
    companies: MOCK_DATA.companies.length,
    locations: MOCK_DATA.locations.length,
    contacts: MOCK_DATA.contacts.length,
    activities: MOCK_DATA.activities.length,
    gifts: MOCK_DATA.gifts.length,
    referrals: MOCK_DATA.referrals.length,
    opportunities: MOCK_DATA.opportunities.length,
    projects: MOCK_DATA.projects.length,
    changeLog: MOCK_DATA.changeLog.length
  });
}
