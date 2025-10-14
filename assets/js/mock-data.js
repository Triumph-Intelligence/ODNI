/**
 * Mock Data for Triumph Intelligence
 * Comprehensive dataset for demo purposes
 */

const MockData = {
    // 20 Food & Beverage Manufacturing Companies
    companies: [
        { name: 'PepsiCo', normalized: 'pepsico', tier: 'Enterprise', status: 'Active', hq_state: 'NY', 
          contractors: { electrical: 'Guercio Energy Group', mechanical: 'Myers Industrial Services', interior_gc: 'KMP', marketing: 'Red Door', staffing: 'Fritz Staffing' }},
        { name: 'Coca-Cola Company', normalized: 'coca-cola', tier: 'Enterprise', status: 'Active', hq_state: 'GA',
          contractors: { electrical: 'Guercio Energy Group', mechanical: '', interior_gc: 'Stable Works', marketing: 'Red Door', staffing: '' }},
        { name: 'Mondelez International', normalized: 'mondelez', tier: 'Enterprise', status: 'Active', hq_state: 'IL',
          contractors: { electrical: '', mechanical: 'Myers Industrial Services', interior_gc: 'KMP', marketing: '', staffing: 'Byers' }},
        { name: 'Nestlé USA', normalized: 'nestle-usa', tier: 'Large', status: 'Prospect', hq_state: 'CA',
          contractors: { electrical: '', mechanical: 'Myers Industrial Services', interior_gc: '', marketing: '', staffing: 'Byers' }},
        { name: 'General Mills', normalized: 'general-mills', tier: 'Large', status: 'Active', hq_state: 'MN',
          contractors: { electrical: '', mechanical: '', interior_gc: 'KMP', marketing: 'Red Door', staffing: 'Fritz Staffing' }},
        { name: 'Kellogg Company', normalized: 'kellogg', tier: 'Large', status: 'Active', hq_state: 'MI',
          contractors: { electrical: 'Guercio Energy Group', mechanical: 'Myers Industrial Services', interior_gc: 'Stable Works', marketing: '', staffing: '' }},
        { name: 'Mars Incorporated', normalized: 'mars', tier: 'Enterprise', status: 'Prospect', hq_state: 'VA',
          contractors: { electrical: '', mechanical: '', interior_gc: 'KMP', marketing: 'Red Door', staffing: 'Fritz Staffing' }},
        { name: 'Kraft Heinz', normalized: 'kraft-heinz', tier: 'Enterprise', status: 'Active', hq_state: 'IL',
          contractors: { electrical: 'Guercio Energy Group', mechanical: 'Myers Industrial Services', interior_gc: 'Stable Works', marketing: '', staffing: 'Byers' }},
        { name: 'Conagra Brands', normalized: 'conagra', tier: 'Large', status: 'Active', hq_state: 'IL',
          contractors: { electrical: '', mechanical: '', interior_gc: 'KMP', marketing: 'Red Door', staffing: '' }},
        { name: 'Campbell Soup Company', normalized: 'campbell', tier: 'Mid', status: 'Prospect', hq_state: 'NJ',
          contractors: { electrical: 'Guercio Energy Group', mechanical: '', interior_gc: '', marketing: '', staffing: 'Fritz Staffing' }},
        { name: 'Tyson Foods', normalized: 'tyson', tier: 'Enterprise', status: 'Active', hq_state: 'AR',
          contractors: { electrical: 'Guercio Energy Group', mechanical: 'Myers Industrial Services', interior_gc: 'KMP', marketing: '', staffing: 'Fritz Staffing' }},
        { name: 'JBS USA', normalized: 'jbs', tier: 'Enterprise', status: 'Active', hq_state: 'CO',
          contractors: { electrical: '', mechanical: 'Myers Industrial Services', interior_gc: 'Stable Works', marketing: 'Red Door', staffing: 'Byers' }},
        { name: 'Smithfield Foods', normalized: 'smithfield', tier: 'Large', status: 'Prospect', hq_state: 'VA',
          contractors: { electrical: 'Guercio Energy Group', mechanical: '', interior_gc: 'KMP', marketing: '', staffing: '' }},
        { name: 'Hormel Foods', normalized: 'hormel', tier: 'Large', status: 'Active', hq_state: 'MN',
          contractors: { electrical: '', mechanical: 'Myers Industrial Services', interior_gc: '', marketing: 'Red Door', staffing: 'Fritz Staffing' }},
        { name: "Pilgrim's Pride", normalized: 'pilgrims', tier: 'Large', status: 'Active', hq_state: 'CO',
          contractors: { electrical: 'Guercio Energy Group', mechanical: '', interior_gc: 'Stable Works', marketing: '', staffing: 'Byers' }},
        { name: 'Perdue Farms', normalized: 'perdue', tier: 'Mid', status: 'Prospect', hq_state: 'MD',
          contractors: { electrical: '', mechanical: '', interior_gc: 'KMP', marketing: 'Red Door', staffing: '' }},
        { name: 'Dean Foods', normalized: 'dean', tier: 'Mid', status: 'Active', hq_state: 'TX',
          contractors: { electrical: 'Guercio Energy Group', mechanical: 'Myers Industrial Services', interior_gc: '', marketing: '', staffing: 'Fritz Staffing' }},
        { name: 'Blue Diamond Growers', normalized: 'blue-diamond', tier: 'Mid', status: 'Prospect', hq_state: 'CA',
          contractors: { electrical: '', mechanical: '', interior_gc: 'Stable Works', marketing: 'Red Door', staffing: '' }},
        { name: 'Land O Lakes', normalized: 'land-o-lakes', tier: 'Large', status: 'Active', hq_state: 'MN',
          contractors: { electrical: '', mechanical: 'Myers Industrial Services', interior_gc: 'KMP', marketing: '', staffing: 'Byers' }},
        { name: 'Ocean Spray', normalized: 'ocean-spray', tier: 'Mid', status: 'Active', hq_state: 'MA',
          contractors: { electrical: 'Guercio Energy Group', mechanical: '', interior_gc: '', marketing: 'Red Door', staffing: 'Fritz Staffing' }}
    ],
    
    // 65 Locations (3-4 per company)
    locations: [
        // PepsiCo (5 locations)
        { company: 'pepsico', name: 'Purchase HQ', city: 'Purchase', state: 'NY', zip: '10577' },
        { company: 'pepsico', name: 'Newark Bottling', city: 'Newark', state: 'NJ', zip: '07102' },
        { company: 'pepsico', name: 'Chicago Distribution', city: 'Chicago', state: 'IL', zip: '60601' },
        { company: 'pepsico', name: 'Dallas Plant', city: 'Dallas', state: 'TX', zip: '75201' },
        { company: 'pepsico', name: 'Phoenix Facility', city: 'Phoenix', state: 'AZ', zip: '85001' },
        
        // Coca-Cola (4 locations)
        { company: 'coca-cola', name: 'Atlanta HQ', city: 'Atlanta', state: 'GA', zip: '30313' },
        { company: 'coca-cola', name: 'Miami Distribution', city: 'Miami', state: 'FL', zip: '33101' },
        { company: 'coca-cola', name: 'Houston Bottling', city: 'Houston', state: 'TX', zip: '77001' },
        { company: 'coca-cola', name: 'Seattle Facility', city: 'Seattle', state: 'WA', zip: '98101' },
        
        // Mondelez (3 locations)
        { company: 'mondelez', name: 'Chicago HQ', city: 'Chicago', state: 'IL', zip: '60601' },
        { company: 'mondelez', name: 'Philadelphia Plant', city: 'Philadelphia', state: 'PA', zip: '19019' },
        { company: 'mondelez', name: 'Portland Facility', city: 'Portland', state: 'OR', zip: '97201' },
        
        // Nestlé USA (3 locations)
        { company: 'nestle-usa', name: 'Glendale HQ', city: 'Glendale', state: 'CA', zip: '91203' },
        { company: 'nestle-usa', name: 'San Francisco Office', city: 'San Francisco', state: 'CA', zip: '94102' },
        { company: 'nestle-usa', name: 'Denver Distribution', city: 'Denver', state: 'CO', zip: '80201' },
        
        // General Mills (3 locations)
        { company: 'general-mills', name: 'Minneapolis HQ', city: 'Minneapolis', state: 'MN', zip: '55426' },
        { company: 'general-mills', name: 'Buffalo Plant', city: 'Buffalo', state: 'NY', zip: '14201' },
        { company: 'general-mills', name: 'Kansas City Facility', city: 'Kansas City', state: 'MO', zip: '64101' },
        
        // Kellogg (3 locations)
        { company: 'kellogg', name: 'Battle Creek HQ', city: 'Battle Creek', state: 'MI', zip: '49017' },
        { company: 'kellogg', name: 'Memphis Plant', city: 'Memphis', state: 'TN', zip: '38101' },
        { company: 'kellogg', name: 'Omaha Facility', city: 'Omaha', state: 'NE', zip: '68101' },
        
        // Mars (3 locations)
        { company: 'mars', name: 'McLean HQ', city: 'McLean', state: 'VA', zip: '22101' },
        { company: 'mars', name: 'Hackettstown Plant', city: 'Hackettstown', state: 'NJ', zip: '07840' },
        { company: 'mars', name: 'Waco Facility', city: 'Waco', state: 'TX', zip: '76701' },
        
        // Kraft Heinz (4 locations)
        { company: 'kraft-heinz', name: 'Chicago HQ', city: 'Chicago', state: 'IL', zip: '60604' },
        { company: 'kraft-heinz', name: 'Pittsburgh Office', city: 'Pittsburgh', state: 'PA', zip: '15201' },
        { company: 'kraft-heinz', name: 'Ontario Plant', city: 'Ontario', state: 'CA', zip: '91761' },
        { company: 'kraft-heinz', name: 'Madison Facility', city: 'Madison', state: 'WI', zip: '53701' },
        
        // Conagra (3 locations)
        { company: 'conagra', name: 'Chicago HQ', city: 'Chicago', state: 'IL', zip: '60654' },
        { company: 'conagra', name: 'Omaha Office', city: 'Omaha', state: 'NE', zip: '68102' },
        { company: 'conagra', name: 'Milton PA Plant', city: 'Milton', state: 'PA', zip: '17847' },
        
        // Campbell (3 locations)
        { company: 'campbell', name: 'Camden HQ', city: 'Camden', state: 'NJ', zip: '08103' },
        { company: 'campbell', name: 'Charlotte Plant', city: 'Charlotte', state: 'NC', zip: '28201' },
        { company: 'campbell', name: 'Sacramento Facility', city: 'Sacramento', state: 'CA', zip: '95814' },
        
        // Tyson Foods (4 locations)
        { company: 'tyson', name: 'Springdale HQ', city: 'Springdale', state: 'AR', zip: '72762' },
        { company: 'tyson', name: 'Dakota City Plant', city: 'Dakota City', state: 'NE', zip: '68731' },
        { company: 'tyson', name: 'Temperanceville Plant', city: 'Temperanceville', state: 'VA', zip: '23442' },
        { company: 'tyson', name: 'Amarillo Facility', city: 'Amarillo', state: 'TX', zip: '79101' },
        
        // JBS USA (3 locations)
        { company: 'jbs', name: 'Greeley HQ', city: 'Greeley', state: 'CO', zip: '80631' },
        { company: 'jbs', name: 'Grand Island Plant', city: 'Grand Island', state: 'NE', zip: '68801' },
        { company: 'jbs', name: 'Marshalltown Facility', city: 'Marshalltown', state: 'IA', zip: '50158' },
        
        // Smithfield Foods (3 locations)
        { company: 'smithfield', name: 'Smithfield HQ', city: 'Smithfield', state: 'VA', zip: '23430' },
        { company: 'smithfield', name: 'Tar Heel Plant', city: 'Tar Heel', state: 'NC', zip: '28392' },
        { company: 'smithfield', name: 'Sioux Falls Facility', city: 'Sioux Falls', state: 'SD', zip: '57104' },
        
        // Hormel Foods (3 locations)
        { company: 'hormel', name: 'Austin HQ', city: 'Austin', state: 'MN', zip: '55912' },
        { company: 'hormel', name: 'Fremont Plant', city: 'Fremont', state: 'NE', zip: '68025' },
        { company: 'hormel', name: 'Dubuque Facility', city: 'Dubuque', state: 'IA', zip: '52001' },
        
        // Pilgrim's Pride (3 locations)
        { company: 'pilgrims', name: 'Greeley HQ', city: 'Greeley', state: 'CO', zip: '80634' },
        { company: 'pilgrims', name: 'Pittsburg Plant', city: 'Pittsburg', state: 'TX', zip: '75686' },
        { company: 'pilgrims', name: 'Athens Facility', city: 'Athens', state: 'GA', zip: '30601' },
        
        // Perdue Farms (3 locations)
        { company: 'perdue', name: 'Salisbury HQ', city: 'Salisbury', state: 'MD', zip: '21801' },
        { company: 'perdue', name: 'Accomac Plant', city: 'Accomac', state: 'VA', zip: '23301' },
        { company: 'perdue', name: 'Bridgewater Facility', city: 'Bridgewater', state: 'VA', zip: '22812' },
        
        // Dean Foods (3 locations)
        { company: 'dean', name: 'Dallas HQ', city: 'Dallas', state: 'TX', zip: '75234' },
        { company: 'dean', name: 'Louisville Plant', city: 'Louisville', state: 'KY', zip: '40209' },
        { company: 'dean', name: 'Rochester Facility', city: 'Rochester', state: 'MN', zip: '55901' },
        
        // Blue Diamond (3 locations)
        { company: 'blue-diamond', name: 'Sacramento HQ', city: 'Sacramento', state: 'CA', zip: '95817' },
        { company: 'blue-diamond', name: 'Salida Plant', city: 'Salida', state: 'CA', zip: '95368' },
        { company: 'blue-diamond', name: 'Turlock Facility', city: 'Turlock', state: 'CA', zip: '95380' },
        
        // Land O Lakes (3 locations)
        { company: 'land-o-lakes', name: 'Arden Hills HQ', city: 'Arden Hills', state: 'MN', zip: '55126' },
        { company: 'land-o-lakes', name: 'Spencer Plant', city: 'Spencer', state: 'WI', zip: '54479' },
        { company: 'land-o-lakes', name: 'Kiel Facility', city: 'Kiel', state: 'WI', zip: '53042' },
        
        // Ocean Spray (3 locations)
        { company: 'ocean-spray', name: 'Lakeville HQ', city: 'Lakeville', state: 'MA', zip: '02347' },
        { company: 'ocean-spray', name: 'Kenosha Plant', city: 'Kenosha', state: 'WI', zip: '53142' },
        { company: 'ocean-spray', name: 'Bordentown Facility', city: 'Bordentown', state: 'NJ', zip: '08505' }
    ],
    
    // 55 Contacts (2-3 per company)
    contacts: [
        // PepsiCo contacts (3)
        { first: 'John', last: 'Smith', email: 'john.smith@pepsico.com', phone: '555-0101', title: 'VP Operations', company: 'pepsico', location: 'Purchase HQ', last_contacted: '2024-10-05', channel: 'email', cadence: 30, last_gift: '2024-09-15' },
        { first: 'Sarah', last: 'Johnson', email: 'sarah.johnson@pepsico.com', phone: '555-0102', title: 'Plant Manager', company: 'pepsico', location: 'Newark Bottling', last_contacted: '2024-09-25', channel: 'phone', cadence: 45, last_gift: '' },
        { first: 'Michael', last: 'Chen', email: 'michael.chen@pepsico.com', phone: '555-0103', title: 'Distribution Director', company: 'pepsico', location: 'Chicago Distribution', last_contacted: '2024-08-15', channel: 'email', cadence: 30, last_gift: '2024-07-20' },
        
        // Coca-Cola contacts (3)
        { first: 'David', last: 'Williams', email: 'dwilliams@coca-cola.com', phone: '555-0201', title: 'SVP Operations', company: 'coca-cola', location: 'Atlanta HQ', last_contacted: '2024-10-08', channel: 'email', cadence: 30, last_gift: '2024-10-01' },
        { first: 'Jennifer', last: 'Taylor', email: 'jen.taylor@coca-cola.com', phone: '555-0202', title: 'Regional Manager', company: 'coca-cola', location: 'Miami Distribution', last_contacted: '2024-10-10', channel: 'phone', cadence: 30, last_gift: '2024-09-22' },
        { first: 'Robert', last: 'Brown', email: 'rbrown@coca-cola.com', phone: '555-0203', title: 'Operations Manager', company: 'coca-cola', location: 'Houston Bottling', last_contacted: '2024-09-10', channel: 'email', cadence: 60, last_gift: '' },
        
        // Mondelez contacts (2)
        { first: 'Lisa', last: 'Anderson', email: 'lisa.anderson@mondelez.com', phone: '555-0301', title: 'VP Facilities', company: 'mondelez', location: 'Chicago HQ', last_contacted: '2024-09-25', channel: 'email', cadence: 45, last_gift: '2024-08-30' },
        { first: 'James', last: 'Martinez', email: 'james.m@mondelez.com', phone: '555-0302', title: 'Plant Director', company: 'mondelez', location: 'Philadelphia Plant', last_contacted: '2024-09-20', channel: 'phone', cadence: 30, last_gift: '' },
        
        // Nestlé contacts (2)
        { first: 'Thomas', last: 'Garcia', email: 'thomas.garcia@nestle.com', phone: '555-0401', title: 'Director Operations', company: 'nestle-usa', location: 'Glendale HQ', last_contacted: '2024-09-28', channel: 'email', cadence: 60, last_gift: '' },
        { first: 'Nancy', last: 'Lee', email: 'nancy.lee@nestle.com', phone: '555-0402', title: 'Facilities Coordinator', company: 'nestle-usa', location: 'San Francisco Office', last_contacted: '2024-08-20', channel: 'linkedin', cadence: 90, last_gift: '' },
        
        // General Mills contacts (3)
        { first: 'Christopher', last: 'Moore', email: 'chris.moore@genmills.com', phone: '555-0501', title: 'VP Engineering', company: 'general-mills', location: 'Minneapolis HQ', last_contacted: '2024-10-12', channel: 'email', cadence: 30, last_gift: '2024-10-05' },
        { first: 'Amanda', last: 'Davis', email: 'amanda.davis@genmills.com', phone: '555-0502', title: 'Plant Manager', company: 'general-mills', location: 'Buffalo Plant', last_contacted: '2024-09-28', channel: 'phone', cadence: 45, last_gift: '' },
        { first: 'Daniel', last: 'Thompson', email: 'dthompson@genmills.com', phone: '555-0503', title: 'Operations Lead', company: 'general-mills', location: 'Kansas City Facility', last_contacted: '2024-08-05', channel: 'email', cadence: 30, last_gift: '' },
        
        // Kellogg contacts (2)
        { first: 'Michelle', last: 'White', email: 'michelle.white@kellogg.com', phone: '555-0601', title: 'Director Facilities', company: 'kellogg', location: 'Battle Creek HQ', last_contacted: '2024-10-10', channel: 'email', cadence: 30, last_gift: '' },
        { first: 'Kevin', last: 'Harris', email: 'kevin.harris@kellogg.com', phone: '555-0602', title: 'Plant Supervisor', company: 'kellogg', location: 'Memphis Plant', last_contacted: '2024-09-15', channel: 'phone', cadence: 60, last_gift: '2024-08-25' },
        
        // Mars contacts (2)
        { first: 'Jessica', last: 'Clark', email: 'jessica.clark@mars.com', phone: '555-0701', title: 'VP Operations', company: 'mars', location: 'McLean HQ', last_contacted: '2024-09-21', channel: 'email', cadence: 45, last_gift: '' },
        { first: 'Brian', last: 'Lewis', email: 'brian.lewis@mars.com', phone: '555-0702', title: 'Site Manager', company: 'mars', location: 'Hackettstown Plant', last_contacted: '', channel: 'phone', cadence: 60, last_gift: '' },
        
        // Kraft Heinz contacts (3)
        { first: 'Rachel', last: 'Walker', email: 'rachel.walker@kraftheinz.com', phone: '555-0801', title: 'SVP Manufacturing', company: 'kraft-heinz', location: 'Chicago HQ', last_contacted: '2024-10-14', channel: 'email', cadence: 30, last_gift: '2024-09-30' },
        { first: 'Steven', last: 'Hall', email: 'steven.hall@kraftheinz.com', phone: '555-0802', title: 'Regional Director', company: 'kraft-heinz', location: 'Pittsburgh Office', last_contacted: '2024-09-22', channel: 'phone', cadence: 45, last_gift: '' },
        { first: 'Patricia', last: 'Young', email: 'patricia.young@kraftheinz.com', phone: '555-0803', title: 'Plant Manager', company: 'kraft-heinz', location: 'Ontario Plant', last_contacted: '2024-09-18', channel: 'email', cadence: 30, last_gift: '2024-08-15' },
        
        // Conagra contacts (2)
        { first: 'Laura', last: 'Young', email: 'laura.young@conagra.com', phone: '555-0901', title: 'Operations Director', company: 'conagra', location: 'Chicago HQ', last_contacted: '2024-09-23', channel: 'email', cadence: 60, last_gift: '' },
        { first: 'Jason', last: 'Allen', email: 'jason.allen@conagra.com', phone: '555-0902', title: 'Plant Manager', company: 'conagra', location: 'Milton PA Plant', last_contacted: '2024-08-18', channel: 'phone', cadence: 30, last_gift: '' },
        
        // Campbell contacts (2)
        { first: 'Angela', last: 'King', email: 'angela.king@campbells.com', phone: '555-1001', title: 'Director Engineering', company: 'campbell', location: 'Camden HQ', last_contacted: '2024-09-05', channel: 'email', cadence: 90, last_gift: '' },
        { first: 'Timothy', last: 'Wright', email: 'timothy.wright@campbells.com', phone: '555-1002', title: 'Facilities Manager', company: 'campbell', location: 'Charlotte Plant', last_contacted: '', channel: 'linkedin', cadence: 60, last_gift: '' },
        
        // Tyson Foods contacts (3)
        { first: 'Mark', last: 'Patterson', email: 'mark.patterson@tyson.com', phone: '555-1101', title: 'VP Operations', company: 'tyson', location: 'Springdale HQ', last_contacted: '2024-10-11', channel: 'email', cadence: 30, last_gift: '2024-09-28' },
        { first: 'Emily', last: 'Rodriguez', email: 'emily.r@tyson.com', phone: '555-1102', title: 'Plant Manager', company: 'tyson', location: 'Dakota City Plant', last_contacted: '2024-09-30', channel: 'phone', cadence: 45, last_gift: '' },
        { first: 'William', last: 'Foster', email: 'william.foster@tyson.com', phone: '555-1103', title: 'Operations Manager', company: 'tyson', location: 'Amarillo Facility', last_contacted: '2024-09-15', channel: 'email', cadence: 30, last_gift: '2024-08-20' },
        
        // JBS USA contacts (2)
        { first: 'Nicole', last: 'Sanders', email: 'nicole.sanders@jbs.com', phone: '555-1201', title: 'Regional Director', company: 'jbs', location: 'Greeley HQ', last_contacted: '2024-10-02', channel: 'email', cadence: 45, last_gift: '' },
        { first: 'Gregory', last: 'Hall', email: 'gregory.hall@jbs.com', phone: '555-1202', title: 'Plant Supervisor', company: 'jbs', location: 'Grand Island Plant', last_contacted: '2024-09-20', channel: 'phone', cadence: 60, last_gift: '2024-08-15' },
        
        // Smithfield contacts (2)
        { first: 'Christine', last: 'Lee', email: 'christine.lee@smithfield.com', phone: '555-1301', title: 'VP Manufacturing', company: 'smithfield', location: 'Smithfield HQ', last_contacted: '2024-09-27', channel: 'email', cadence: 60, last_gift: '' },
        { first: 'Andrew', last: 'Mitchell', email: 'andrew.mitchell@smithfield.com', phone: '555-1302', title: 'Operations Manager', company: 'smithfield', location: 'Tar Heel Plant', last_contacted: '', channel: 'phone', cadence: 45, last_gift: '' },
        
        // Hormel contacts (2)
        { first: 'Diana', last: 'Murphy', email: 'diana.murphy@hormel.com', phone: '555-1401', title: 'Director Operations', company: 'hormel', location: 'Austin HQ', last_contacted: '2024-10-03', channel: 'email', cadence: 30, last_gift: '2024-09-15' },
        { first: 'Peter', last: 'Brooks', email: 'peter.brooks@hormel.com', phone: '555-1402', title: 'Plant Manager', company: 'hormel', location: 'Fremont Plant', last_contacted: '2024-09-18', channel: 'phone', cadence: 60, last_gift: '' },
        
        // Pilgrim's Pride contacts (2)
        { first: 'Samantha', last: 'Price', email: 'samantha.price@pilgrims.com', phone: '555-1501', title: 'Regional VP', company: 'pilgrims', location: 'Greeley HQ', last_contacted: '2024-10-08', channel: 'email', cadence: 45, last_gift: '2024-09-20' },
        { first: 'Richard', last: 'Coleman', email: 'richard.coleman@pilgrims.com', phone: '555-1502', title: 'Operations Lead', company: 'pilgrims', location: 'Pittsburg Plant', last_contacted: '2024-09-25', channel: 'phone', cadence: 30, last_gift: '' },
        
        // Perdue Farms contacts (2)
        { first: 'Karen', last: 'Bailey', email: 'karen.bailey@perdue.com', phone: '555-1601', title: 'VP Operations', company: 'perdue', location: 'Salisbury HQ', last_contacted: '2024-09-12', channel: 'email', cadence: 90, last_gift: '' },
        { first: 'Joseph', last: 'Reed', email: 'joseph.reed@perdue.com', phone: '555-1602', title: 'Plant Manager', company: 'perdue', location: 'Accomac Plant', last_contacted: '', channel: 'phone', cadence: 60, last_gift: '' },
        
        // Dean Foods contacts (2)
        { first: 'Linda', last: 'Torres', email: 'linda.torres@deanfoods.com', phone: '555-1701', title: 'Director Manufacturing', company: 'dean', location: 'Dallas HQ', last_contacted: '2024-10-09', channel: 'email', cadence: 30, last_gift: '2024-09-25' },
        { first: 'Charles', last: 'Powell', email: 'charles.powell@deanfoods.com', phone: '555-1702', title: 'Operations Manager', company: 'dean', location: 'Louisville Plant', last_contacted: '2024-09-28', channel: 'phone', cadence: 45, last_gift: '' },
        
        // Blue Diamond contacts (2)
        { first: 'Barbara', last: 'Hughes', email: 'barbara.hughes@bdgrowers.com', phone: '555-1801', title: 'VP Operations', company: 'blue-diamond', location: 'Sacramento HQ', last_contacted: '2024-09-15', channel: 'email', cadence: 60, last_gift: '' },
        { first: 'Edward', last: 'Simmons', email: 'edward.simmons@bdgrowers.com', phone: '555-1802', title: 'Plant Director', company: 'blue-diamond', location: 'Salida Plant', last_contacted: '', channel: 'phone', cadence: 90, last_gift: '' },
        
        // Land O Lakes contacts (2)
        { first: 'Susan', last: 'Bennett', email: 'susan.bennett@landolakes.com', phone: '555-1901', title: 'Regional Director', company: 'land-o-lakes', location: 'Arden Hills HQ', last_contacted: '2024-10-01', channel: 'email', cadence: 45, last_gift: '2024-09-10' },
        { first: 'Ronald', last: 'Gray', email: 'ronald.gray@landolakes.com', phone: '555-1902', title: 'Operations Manager', company: 'land-o-lakes', location: 'Spencer Plant', last_contacted: '2024-09-22', channel: 'phone', cadence: 30, last_gift: '' },
        
        // Ocean Spray contacts (3)
        { first: 'Margaret', last: 'Perry', email: 'margaret.perry@oceanspray.com', phone: '555-2001', title: 'VP Manufacturing', company: 'ocean-spray', location: 'Lakeville HQ', last_contacted: '2024-10-13', channel: 'email', cadence: 30, last_gift: '2024-10-01' },
        { first: 'George', last: 'Butler', email: 'george.butler@oceanspray.com', phone: '555-2002', title: 'Plant Manager', company: 'ocean-spray', location: 'Kenosha Plant', last_contacted: '2024-09-29', channel: 'phone', cadence: 45, last_gift: '' },
        { first: 'Dorothy', last: 'Russell', email: 'dorothy.russell@oceanspray.com', phone: '555-2003', title: 'Operations Lead', company: 'ocean-spray', location: 'Bordentown Facility', last_contacted: '2024-09-16', channel: 'email', cadence: 60, last_gift: '2024-08-28' }
    ],
    
    // 25 Gift Records
    gifts: [
        { contact_email: 'john.smith@pepsico.com', description: 'Starbucks Gift Card', value: 50.00, date: '2024-09-15' },
        { contact_email: 'michael.chen@pepsico.com', description: 'Holiday Gift Basket', value: 75.00, date: '2024-07-20' },
        { contact_email: 'dwilliams@coca-cola.com', description: 'Restaurant Gift Card', value: 100.00, date: '2024-10-01' },
        { contact_email: 'jen.taylor@coca-cola.com', description: 'Wine & Cheese Basket', value: 85.00, date: '2024-09-22' },
        { contact_email: 'lisa.anderson@mondelez.com', description: 'Amazon Gift Card', value: 50.00, date: '2024-08-30' },
        { contact_email: 'chris.moore@genmills.com', description: 'Coffee Subscription', value: 60.00, date: '2024-10-05' },
        { contact_email: 'kevin.harris@kellogg.com', description: 'Sports Tickets', value: 150.00, date: '2024-08-25' },
        { contact_email: 'rachel.walker@kraftheinz.com', description: 'Spa Gift Certificate', value: 120.00, date: '2024-09-30' },
        { contact_email: 'patricia.young@kraftheinz.com', description: 'Dinner Gift Card', value: 75.00, date: '2024-08-15' },
        { contact_email: 'mark.patterson@tyson.com', description: 'Golf Accessories', value: 95.00, date: '2024-09-28' },
        { contact_email: 'william.foster@tyson.com', description: 'BBQ Gift Set', value: 65.00, date: '2024-08-20' },
        { contact_email: 'gregory.hall@jbs.com', description: 'Visa Gift Card', value: 100.00, date: '2024-08-15' },
        { contact_email: 'diana.murphy@hormel.com', description: 'Luxury Candle Set', value: 55.00, date: '2024-09-15' },
        { contact_email: 'samantha.price@pilgrims.com', description: 'Gourmet Food Basket', value: 85.00, date: '2024-09-20' },
        { contact_email: 'linda.torres@deanfoods.com', description: 'Target Gift Card', value: 75.00, date: '2024-09-25' },
        { contact_email: 'susan.bennett@landolakes.com', description: 'Chocolate Gift Box', value: 45.00, date: '2024-09-10' },
        { contact_email: 'margaret.perry@oceanspray.com', description: 'Premium Coffee Set', value: 70.00, date: '2024-10-01' },
        { contact_email: 'dorothy.russell@oceanspray.com', description: 'Wine Gift Set', value: 90.00, date: '2024-08-28' },
        { contact_email: 'john.smith@pepsico.com', description: 'Tech Accessories', value: 80.00, date: '2024-06-15' },
        { contact_email: 'david.williams@coca-cola.com', description: 'Executive Desk Set', value: 110.00, date: '2024-07-20' },
        { contact_email: 'chris.moore@genmills.com', description: 'Wireless Headphones', value: 125.00, date: '2024-08-05' },
        { contact_email: 'michelle.white@kellogg.com', description: 'Fitness Tracker', value: 95.00, date: '2024-06-28' },
        { contact_email: 'rachel.walker@kraftheinz.com', description: 'Leather Portfolio', value: 85.00, date: '2024-07-10' },
        { contact_email: 'mark.patterson@tyson.com', description: 'Yeti Cooler', value: 150.00, date: '2024-06-05' },
        { contact_email: 'margaret.perry@oceanspray.com', description: 'Personalized Notebook', value: 40.00, date: '2024-07-15' }
    ],
    
    // 20 Referrals
    referrals: [
        { referred_name: 'Susan Chen', company: 'Minute Maid', referrer_email: 'dwilliams@coca-cola.com', followup_date: '2024-10-28', status: 'Pending' },
        { referred_name: 'Robert Kim', company: 'Cadbury', referrer_email: 'lisa.anderson@mondelez.com', followup_date: '2024-11-05', status: 'Contacted' },
        { referred_name: 'Maria Gonzalez', company: 'Purina', referrer_email: 'thomas.garcia@nestle.com', followup_date: '2024-10-25', status: 'Meeting Scheduled' },
        { referred_name: 'Andrew Foster', company: 'Pillsbury', referrer_email: 'chris.moore@genmills.com', followup_date: '2024-11-10', status: 'Pending' },
        { referred_name: 'Nicole Sanders', company: 'Pringles', referrer_email: 'michelle.white@kellogg.com', followup_date: '2024-10-22', status: 'Closed-Won' },
        { referred_name: 'Peter Brooks', company: 'M&Ms', referrer_email: 'jessica.clark@mars.com', followup_date: '2024-11-08', status: 'Pending' },
        { referred_name: 'Christine Lee', company: 'Oscar Mayer', referrer_email: 'rachel.walker@kraftheinz.com', followup_date: '2024-10-27', status: 'Contacted' },
        { referred_name: 'Gregory Hall', company: 'Birds Eye', referrer_email: 'laura.young@conagra.com', followup_date: '2024-11-15', status: 'Pending' },
        { referred_name: 'Samantha Price', company: 'Pepperidge Farm', referrer_email: 'angela.king@campbells.com', followup_date: '2024-11-12', status: 'Pending' },
        { referred_name: 'William Torres', company: 'Jimmy Dean', referrer_email: 'mark.patterson@tyson.com', followup_date: '2024-10-29', status: 'Contacted' },
        { referred_name: 'Diana Murphy', company: 'Swift Premium', referrer_email: 'nicole.sanders@jbs.com', followup_date: '2024-11-03', status: 'Pending' },
        { referred_name: 'Amanda Davis', company: 'Eckrich', referrer_email: 'christine.lee@smithfield.com', followup_date: '2024-11-01', status: 'Meeting Scheduled' },
        { referred_name: 'Kevin Martinez', company: 'Jennie-O', referrer_email: 'diana.murphy@hormel.com', followup_date: '2024-10-30', status: 'Contacted' },
        { referred_name: 'Laura Thompson', company: 'Gold Kist', referrer_email: 'samantha.price@pilgrims.com', followup_date: '2024-11-07', status: 'Pending' },
        { referred_name: 'Michael Rivera', company: 'Harvestland', referrer_email: 'karen.bailey@perdue.com', followup_date: '2024-11-20', status: 'Pending' },
        { referred_name: 'Jennifer Scott', company: 'TruMoo', referrer_email: 'linda.torres@deanfoods.com', followup_date: '2024-10-26', status: 'Contacted' },
        { referred_name: 'David Anderson', company: 'Almond Breeze', referrer_email: 'barbara.hughes@bdgrowers.com', followup_date: '2024-11-18', status: 'Pending' },
        { referred_name: 'Patricia Wilson', company: 'Alpine Lace', referrer_email: 'susan.bennett@landolakes.com', followup_date: '2024-11-02', status: 'Meeting Scheduled' },
        { referred_name: 'Thomas Clark', company: 'Craisins', referrer_email: 'margaret.perry@oceanspray.com', followup_date: '2024-10-24', status: 'Contacted' },
        { referred_name: 'Elizabeth Moore', company: 'Tropicana', referrer_email: 'john.smith@pepsico.com', followup_date: '2024-11-09', status: 'Pending' }
    ],
    
    // 12 Opportunities
    opportunities: [
        { company: 'PepsiCo', location: 'Dallas Plant', job: 'Electrical System Upgrade', contact: 'Emily Rodriguez', start: '2025-02-01', valuation: '$125,000' },
        { company: 'Coca-Cola Company', location: 'Seattle Facility', job: 'HVAC Replacement', contact: 'New Contact', start: '2025-01-15', valuation: '$85,000' },
        { company: 'Mondelez International', location: 'Portland Facility', job: 'Interior Renovation', contact: 'Patricia Wilson', start: '2025-03-01', valuation: '$200,000' },
        { company: 'Kellogg Company', location: 'Omaha Facility', job: 'Electrical & Mechanical Upgrades', contact: 'New Contact', start: '2025-02-15', valuation: '$150,000' },
        { company: 'Mars Incorporated', location: 'Waco Facility', job: 'Complete Facility Modernization', contact: 'New Contact', start: '2025-04-01', valuation: '$350,000' },
        { company: 'Tyson Foods', location: 'Amarillo Facility', job: 'Production Line Electrical', contact: 'William Foster', start: '2025-01-20', valuation: '$175,000' },
        { company: 'JBS USA', location: 'Marshalltown Facility', job: 'Refrigeration System Upgrade', contact: 'Gregory Hall', start: '2025-03-15', valuation: '$220,000' },
        { company: 'Hormel Foods', location: 'Dubuque Facility', job: 'Building Automation System', contact: 'Peter Brooks', start: '2025-02-10', valuation: '$95,000' },
        { company: 'Land O Lakes', location: 'Kiel Facility', job: 'Lighting & Electrical Upgrade', contact: 'Ronald Gray', start: '2025-01-25', valuation: '$110,000' },
        { company: 'Ocean Spray', location: 'Kenosha Plant', job: 'Manufacturing Equipment Install', contact: 'George Butler', start: '2025-03-20', valuation: '$185,000' },
        { company: 'Dean Foods', location: 'Louisville Plant', job: 'HVAC & Mechanical Systems', contact: 'Charles Powell', start: '2025-02-05', valuation: '$145,000' },
        { company: 'Kraft Heinz', location: 'Madison Facility', job: 'Facility Expansion - Electrical', contact: 'New Contact', start: '2025-04-15', valuation: '$280,000' }
    ],
    
    // 10 Active Projects
    projects: [
        { company: 'PepsiCo', location: 'Chicago Distribution', job: 'Warehouse Lighting Upgrade', contact: 'Michael Chen', start: '2024-09-01', end: '2024-12-15', valuation: '$95,000' },
        { company: 'Coca-Cola Company', location: 'Atlanta HQ', job: 'Office Renovation - Floor 3', contact: 'David Williams', start: '2024-10-01', end: '2025-01-28', valuation: '$180,000' },
        { company: 'General Mills', location: 'Buffalo Plant', job: 'Production Line Electrical', contact: 'Amanda Davis', start: '2024-08-15', end: '2024-12-30', valuation: '$220,000' },
        { company: 'Kraft Heinz', location: 'Chicago HQ', job: 'Building Automation System', contact: 'Rachel Walker', start: '2024-09-15', end: '2025-02-01', valuation: '$165,000' },
        { company: 'Tyson Foods', location: 'Dakota City Plant', job: 'Refrigeration System Replacement', contact: 'Emily Rodriguez', start: '2024-09-20', end: '2024-12-20', valuation: '$245,000' },
        { company: 'Kellogg Company', location: 'Memphis Plant', job: 'Mechanical System Upgrade', contact: 'Kevin Harris', start: '2024-08-01', end: '2024-11-30', valuation: '$190,000' },
        { company: 'Mondelez International', location: 'Philadelphia Plant', job: 'Interior Build-Out', contact: 'James Martinez', start: '2024-10-10', end: '2025-01-15', valuation: '$155,000' },
        { company: "Pilgrim's Pride", location: 'Athens Facility', job: 'Electrical Infrastructure Upgrade', contact: 'Richard Coleman', start: '2024-09-05', end: '2024-12-10', valuation: '$135,000' },
        { company: 'Ocean Spray', location: 'Lakeville HQ', job: 'Office HVAC Replacement', contact: 'Margaret Perry', start: '2024-10-01', end: '2024-12-30', valuation: '$125,000' },
        { company: 'Dean Foods', location: 'Dallas HQ', job: 'Conference Center Renovation', contact: 'Linda Torres', start: '2024-09-25', end: '2025-01-20', valuation: '$210,000' }
    ],
    
    // 35 Change Log Entries
    changeLog: [
        { timestamp: '2024-10-14T14:30:00', user: 'Ryan Morris', org: 'Triumph Atlantic', action: 'Contact Added', details: 'Added Margaret Perry (margaret.perry@oceanspray.com) at Ocean Spray' },
        { timestamp: '2024-10-14T11:15:00', user: 'Gianfranco Guercio', org: 'Guercio Energy Group', action: 'Opportunity Created', details: 'New opportunity: Ocean Spray Kenosha Plant - $185K' },
        { timestamp: '2024-10-13T16:45:00', user: 'Ryan Morris', org: 'Triumph Atlantic', action: 'Activity Logged', details: 'Phone call with Margaret Perry on 2024-10-13' },
        { timestamp: '2024-10-13T10:20:00', user: 'Bill Myers', org: 'Myers Industrial Services', action: 'Project Updated', details: 'Updated Tyson Dakota City project timeline' },
        { timestamp: '2024-10-12T15:30:00', user: 'Ryan Morris', org: 'Triumph Atlantic', action: 'Gift Added', details: 'Coffee Subscription ($60) for Christopher Moore' },
        { timestamp: '2024-10-12T09:00:00', user: 'Eric Quidort', org: 'Red Door', action: 'Contact Updated', details: 'Updated Christopher Moore last contact date to 2024-10-12' },
        { timestamp: '2024-10-11T14:15:00', user: 'Ryan Morris', org: 'Triumph Atlantic', action: 'Activity Logged', details: 'Meeting with Mark Patterson on 2024-10-11' },
        { timestamp: '2024-10-11T11:00:00', user: 'Gianfranco Guercio', org: 'Guercio Energy Group', action: 'Contractor Assignment', details: 'Tyson Foods: Assigned Guercio Energy Group as electrical contractor' },
        { timestamp: '2024-10-10T16:30:00', user: 'Ryan Morris', org: 'Triumph Atlantic', action: 'Project Started', details: 'Mondelez Philadelphia Plant - Interior Build-Out started' },
        { timestamp: '2024-10-10T13:45:00', user: 'Wade Zane', org: 'Stable Works', action: 'Activity Logged', details: 'Site visit at Coca-Cola Miami Distribution' },
        { timestamp: '2024-10-09T10:15:00', user: 'Ryan Morris', org: 'Triumph Atlantic', action: 'Gift Added', details: 'Target Gift Card ($75) for Linda Torres' },
        { timestamp: '2024-10-08T15:20:00', user: 'Nick Wagner', org: 'Fritz Staffing', action: 'Contact Updated', details: 'Updated David Williams last contact date to 2024-10-08' },
        { timestamp: '2024-10-08T11:30:00', user: 'Ryan Morris', org: 'Triumph Atlantic', action: 'Referral Added', details: 'New referral: Peter Brooks at M&Ms' },
        { timestamp: '2024-10-05T14:00:00', user: 'Gianfranco Guercio', org: 'Guercio Energy Group', action: 'Opportunity Updated', details: 'PepsiCo Dallas Plant opportunity moved to proposal stage' },
        { timestamp: '2024-10-03T16:45:00', user: 'Ryan Morris', org: 'Triumph Atlantic', action: 'Activity Logged', details: 'Email exchange with Diana Murphy on 2024-10-03' },
        { timestamp: '2024-10-02T10:30:00', user: 'Bill Myers', org: 'Myers Industrial Services', action: 'Contact Updated', details: 'Updated Nicole Sanders last contact date to 2024-10-02' },
        { timestamp: '2024-10-01T15:15:00', user: 'Ryan Morris', org: 'Triumph Atlantic', action: 'Gift Added', details: 'Premium Coffee Set ($70) for Margaret Perry' },
        { timestamp: '2024-10-01T09:00:00', user: 'Ryan Morris', org: 'Triumph Atlantic', action: 'Project Started', details: 'Ocean Spray Lakeville HQ - Office HVAC Replacement started' },
        { timestamp: '2024-09-30T14:20:00', user: 'Eric Quidort', org: 'Red Door', action: 'Activity Logged', details: 'Marketing consultation with Emily Rodriguez' },
        { timestamp: '2024-09-30T11:00:00', user: 'Ryan Morris', org: 'Triumph Atlantic', action: 'Gift Added', details: 'Spa Gift Certificate ($120) for Rachel Walker' },
        { timestamp: '2024-09-29T16:30:00', user: 'Ryan Morris', org: 'Triumph Atlantic', action: 'Contact Added', details: 'Added George Butler (george.butler@oceanspray.com) at Ocean Spray' },
        { timestamp: '2024-09-28T13:45:00', user: 'Gianfranco Guercio', org: 'Guercio Energy Group', action: 'Activity Logged', details: 'Site inspection at PepsiCo Dallas Plant' },
        { timestamp: '2024-09-28T10:15:00', user: 'Ryan Morris', org: 'Triumph Atlantic', action: 'Gift Added', details: 'Golf Accessories ($95) for Mark Patterson' },
        { timestamp: '2024-09-27T15:00:00', user: 'Wade Zane', org: 'Stable Works', action: 'Contact Updated', details: 'Updated Christine Lee last contact date to 2024-09-27' },
        { timestamp: '2024-09-25T14:30:00', user: 'Ryan Morris', org: 'Triumph Atlantic', action: 'Project Started', details: 'Dean Foods Dallas HQ - Conference Center Renovation started' },
        { timestamp: '2024-09-25T09:45:00', user: 'Bill Myers', org: 'Myers Industrial Services', action: 'Activity Logged', details: 'Mechanical assessment at Kellogg Memphis Plant' },
        { timestamp: '2024-09-22T16:15:00', user: 'Ryan Morris', org: 'Triumph Atlantic', action: 'Gift Added', details: 'Wine & Cheese Basket ($85) for Jennifer Taylor' },
        { timestamp: '2024-09-20T13:20:00', user: 'Gianfranco Guercio', org: 'Guercio Energy Group', action: 'Opportunity Created', details: 'New opportunity: Kraft Heinz Madison Facility - $280K' },
        { timestamp: '2024-09-20T10:00:00', user: 'Ryan Morris', org: 'Triumph Atlantic', action: 'Project Started', details: 'Tyson Dakota City Plant - Refrigeration System started' },
        { timestamp: '2024-09-18T15:30:00', user: 'Eric Quidort', org: 'Red Door', action: 'Activity Logged', details: 'Strategy meeting with Patricia Young' },
        { timestamp: '2024-09-15T14:00:00', user: 'Ryan Morris', org: 'Triumph Atlantic', action: 'Gift Added', details: 'Luxury Candle Set ($55) for Diana Murphy' },
        { timestamp: '2024-09-15T11:15:00', user: 'Nick Wagner', org: 'Fritz Staffing', action: 'Contact Updated', details: 'Updated William Foster contact information' },
        { timestamp: '2024-09-10T16:45:00', user: 'Ryan Morris', org: 'Triumph Atlantic', action: 'Contractor Assignment', details: 'Ocean Spray: Assigned Guercio Energy Group as electrical contractor' },
        { timestamp: '2024-09-05T13:30:00', user: 'Wade Zane', org: 'Stable Works', action: 'Project Started', details: "Pilgrim's Pride Athens Facility - Electrical Infrastructure started" },
        { timestamp: '2024-09-01T09:00:00', user: 'Gianfranco Guercio', org: 'Guercio Energy Group', action: 'Project Started', details: 'PepsiCo Chicago Distribution - Warehouse Lighting started' }
    ]
};

// Export to window
window.MockData = MockData;
