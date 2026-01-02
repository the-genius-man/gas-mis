const Database = require('better-sqlite3');
const path = require('path');

// Sample data
const sampleEmployees = [
  {
    id: '1',
    employeeNumber: 'EMP001',
    firstName: 'John',
    lastName: 'Smith',
    email: 'john.smith@goaheadsecurity.com',
    phone: '(555) 123-4567',
    dateOfBirth: '1985-03-15',
    nationalId: 'SSN123456789',
    addressStreet: '123 Main St',
    addressCity: 'Springfield',
    addressState: 'IL',
    addressZipCode: '62701',
    emergencyContactName: 'Jane Smith',
    emergencyContactRelationship: 'Spouse',
    emergencyContactPhone: '(555) 123-4568',
    dateHired: '2023-01-15',
    position: 'Security Guard',
    department: 'Field Operations',
    status: 'active',
    salary: 45000,
    bankName: 'First National Bank',
    accountNumber: '****1234',
    routingNumber: '123456789'
  },
  {
    id: '2',
    employeeNumber: 'EMP002',
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.johnson@goaheadsecurity.com',
    phone: '(555) 234-5678',
    dateOfBirth: '1990-07-22',
    nationalId: 'SSN987654321',
    addressStreet: '456 Oak Ave',
    addressCity: 'Springfield',
    addressState: 'IL',
    addressZipCode: '62702',
    emergencyContactName: 'Mike Johnson',
    emergencyContactRelationship: 'Brother',
    emergencyContactPhone: '(555) 234-5679',
    dateHired: '2023-03-01',
    position: 'Senior Security Guard',
    department: 'Field Operations',
    status: 'active',
    salary: 52000,
    bankName: 'Community Bank',
    accountNumber: '****5678',
    routingNumber: '987654321'
  },
  {
    id: '3',
    employeeNumber: 'EMP003',
    firstName: 'Michael',
    lastName: 'Brown',
    email: 'michael.brown@goaheadsecurity.com',
    phone: '(555) 345-6789',
    dateOfBirth: '1988-11-30',
    nationalId: 'SSN456789123',
    addressStreet: '789 Pine St',
    addressCity: 'Springfield',
    addressState: 'IL',
    addressZipCode: '62703',
    emergencyContactName: 'Lisa Brown',
    emergencyContactRelationship: 'Wife',
    emergencyContactPhone: '(555) 345-6790',
    dateHired: '2022-08-15',
    position: 'Security Supervisor',
    department: 'Operations',
    status: 'active',
    salary: 65000,
    bankName: 'Regional Bank',
    accountNumber: '****9012',
    routingNumber: '456789123'
  }
];

const sampleClients = [
  {
    id: '1',
    name: 'Downtown Shopping Mall',
    type: 'corporate',
    primaryContact: 'Robert Wilson',
    email: 'rwilson@downtownmall.com',
    phone: '(555) 111-2222',
    addressStreet: '100 Commerce St',
    addressCity: 'Springfield',
    addressState: 'IL',
    addressZipCode: '62701',
    contractStartDate: '2023-01-01',
    contractEndDate: '2024-12-31',
    serviceLevel: 'Premium',
    hourlyRate: 25,
    billingCycle: 'monthly',
    paymentTerms: 'Net 30',
    status: 'active',
    totalValue: 180000,
    createdDate: '2022-12-15'
  },
  {
    id: '2',
    name: 'Riverside Residential Complex',
    type: 'residential',
    primaryContact: 'Maria Garcia',
    email: 'mgarcia@riverside.com',
    phone: '(555) 222-3333',
    addressStreet: '500 River Road',
    addressCity: 'Springfield',
    addressState: 'IL',
    addressZipCode: '62704',
    contractStartDate: '2023-06-01',
    contractEndDate: '2025-05-31',
    serviceLevel: 'Standard',
    hourlyRate: 22,
    billingCycle: 'monthly',
    paymentTerms: 'Net 15',
    status: 'active',
    totalValue: 220000,
    createdDate: '2023-05-10'
  },
  {
    id: '3',
    name: 'Metro Office Complex',
    type: 'corporate',
    primaryContact: 'David Chen',
    email: 'dchen@metrooffice.com',
    phone: '(555) 333-4444',
    addressStreet: '200 Business Blvd',
    addressCity: 'Springfield',
    addressState: 'IL',
    addressZipCode: '62705',
    contractStartDate: '2023-09-01',
    contractEndDate: '2024-08-31',
    serviceLevel: 'Basic',
    hourlyRate: 20,
    billingCycle: 'monthly',
    paymentTerms: 'Net 30',
    status: 'active',
    totalValue: 96000,
    createdDate: '2023-08-15'
  }
];

const sampleSites = [
  {
    id: '1',
    name: 'Downtown Mall - Main Entrance',
    clientId: '1',
    address: '100 Commerce St',
    city: 'Springfield',
    state: 'IL',
    zipCode: '62701',
    latitude: 39.7817,
    longitude: -89.6501,
    siteType: 'retail',
    size: '500,000 sq ft',
    accessPoints: 'Main Entrance,Employee Entrance,Loading Dock',
    specialInstructions: 'Monitor for shoplifting during peak hours. Check employee bags at end of shift.',
    emergencyProcedures: 'Contact mall security office at ext. 911. Evacuation route through main entrance.',
    guardsRequired: 3,
    shiftPattern: '24/7',
    specialEquipment: 'Radio,Flashlight,First Aid Kit',
    certificationRequired: 'Security Guard License',
    status: 'active'
  },
  {
    id: '2',
    name: 'Downtown Mall - Parking Garage',
    clientId: '1',
    address: '102 Commerce St',
    city: 'Springfield',
    state: 'IL',
    zipCode: '62701',
    latitude: 39.7818,
    longitude: -89.6502,
    siteType: 'retail',
    size: '200,000 sq ft',
    accessPoints: 'Level 1 Entrance,Level 2 Entrance,Pedestrian Bridge',
    specialInstructions: 'Vehicle patrols on all levels. Check for break-ins and vandalism.',
    emergencyProcedures: 'Contact police for vehicle break-ins. Use emergency call boxes for assistance.',
    guardsRequired: 2,
    shiftPattern: '24/7',
    specialEquipment: 'Radio,Flashlight,Vehicle',
    certificationRequired: 'Security Guard License,Driver\'s License',
    status: 'active'
  },
  {
    id: '3',
    name: 'Riverside Complex - Main Gate',
    clientId: '2',
    address: '500 River Road',
    city: 'Springfield',
    state: 'IL',
    zipCode: '62704',
    latitude: 39.7900,
    longitude: -89.6600,
    siteType: 'residential',
    size: '50 acre complex',
    accessPoints: 'Main Gate,Emergency Exit',
    specialInstructions: 'Check visitor ID and maintain visitor log. Patrol common areas after dark.',
    emergencyProcedures: 'Contact management office for noise complaints. Call police for disturbances.',
    guardsRequired: 2,
    shiftPattern: '6 PM - 6 AM',
    specialEquipment: 'Radio,Flashlight,Access Control System',
    certificationRequired: 'Security Guard License',
    status: 'active'
  },
  {
    id: '4',
    name: 'Metro Office Complex',
    clientId: '3',
    address: '200 Business Blvd',
    city: 'Springfield',
    state: 'IL',
    zipCode: '62705',
    latitude: 39.7700,
    longitude: -89.6400,
    siteType: 'office',
    size: '300,000 sq ft',
    accessPoints: 'Main Lobby,Employee Entrance,Loading Dock',
    specialInstructions: 'Monitor elevator access after hours. Escort visitors to their destinations.',
    emergencyProcedures: 'Use building emergency procedures. Contact building management for issues.',
    guardsRequired: 1,
    shiftPattern: '6 PM - 6 AM',
    specialEquipment: 'Radio,Flashlight,Key Card Access',
    certificationRequired: 'Security Guard License',
    status: 'active'
  }
];

const sampleCertifications = [
  {
    id: 'cert1',
    employeeId: '1',
    name: 'Security Guard License',
    issueDate: '2023-01-10',
    expiryDate: '2025-01-10',
    issuingAuthority: 'State Security Board',
    certificateNumber: 'SGL123456',
    status: 'active'
  },
  {
    id: 'cert2',
    employeeId: '1',
    name: 'First Aid Certification',
    issueDate: '2023-06-15',
    expiryDate: '2024-12-15',
    issuingAuthority: 'Red Cross',
    certificateNumber: 'FA789012',
    status: 'expiring-soon'
  },
  {
    id: 'cert3',
    employeeId: '2',
    name: 'Security Guard License',
    issueDate: '2023-02-28',
    expiryDate: '2025-02-28',
    issuingAuthority: 'State Security Board',
    certificateNumber: 'SGL654321',
    status: 'active'
  },
  {
    id: 'cert4',
    employeeId: '3',
    name: 'Security Supervisor License',
    issueDate: '2022-08-10',
    expiryDate: '2024-08-10',
    issuingAuthority: 'State Security Board',
    certificateNumber: 'SSL789456',
    status: 'expiring-soon'
  }
];

const sampleSiteAssignments = [
  { id: 'sa1', siteId: '1', employeeId: '1', assignedDate: '2023-01-15', status: 'active' },
  { id: 'sa2', siteId: '1', employeeId: '2', assignedDate: '2023-03-01', status: 'active' },
  { id: 'sa3', siteId: '2', employeeId: '3', assignedDate: '2022-08-15', status: 'active' },
  { id: 'sa4', siteId: '3', employeeId: '1', assignedDate: '2023-06-01', status: 'active' },
  { id: 'sa5', siteId: '4', employeeId: '2', assignedDate: '2023-09-01', status: 'active' }
];

function seedDatabase() {
  const dbPath = path.join(__dirname, '..', 'database.sqlite');
  const db = new Database(dbPath);

  console.log('Seeding database with sample data...');

  try {
    // Clear existing data
    db.exec('DELETE FROM site_assignments');
    db.exec('DELETE FROM certifications');
    db.exec('DELETE FROM sites');
    db.exec('DELETE FROM clients');
    db.exec('DELETE FROM employees');

    // Insert employees
    const insertEmployee = db.prepare(`
      INSERT INTO employees (
        id, employee_number, first_name, last_name, email, phone, date_of_birth,
        national_id, address_street, address_city, address_state, address_zip_code,
        emergency_contact_name, emergency_contact_relationship, emergency_contact_phone,
        date_hired, position, department, status, salary, bank_name,
        account_number, routing_number
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const emp of sampleEmployees) {
      insertEmployee.run(
        emp.id, emp.employeeNumber, emp.firstName, emp.lastName, emp.email, emp.phone,
        emp.dateOfBirth, emp.nationalId, emp.addressStreet, emp.addressCity, emp.addressState,
        emp.addressZipCode, emp.emergencyContactName, emp.emergencyContactRelationship,
        emp.emergencyContactPhone, emp.dateHired, emp.position, emp.department, emp.status,
        emp.salary, emp.bankName, emp.accountNumber, emp.routingNumber
      );
    }

    // Insert clients
    const insertClient = db.prepare(`
      INSERT INTO clients (
        id, name, type, primary_contact, email, phone, address_street, address_city,
        address_state, address_zip_code, contract_start_date, contract_end_date,
        service_level, hourly_rate, billing_cycle, payment_terms, status, total_value, created_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const client of sampleClients) {
      insertClient.run(
        client.id, client.name, client.type, client.primaryContact, client.email, client.phone,
        client.addressStreet, client.addressCity, client.addressState, client.addressZipCode,
        client.contractStartDate, client.contractEndDate, client.serviceLevel, client.hourlyRate,
        client.billingCycle, client.paymentTerms, client.status, client.totalValue, client.createdDate
      );
    }

    // Insert sites
    const insertSite = db.prepare(`
      INSERT INTO sites (
        id, name, client_id, address, city, state, zip_code, latitude, longitude,
        site_type, size, access_points, special_instructions, emergency_procedures,
        guards_required, shift_pattern, special_equipment, certification_required, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const site of sampleSites) {
      insertSite.run(
        site.id, site.name, site.clientId, site.address, site.city, site.state, site.zipCode,
        site.latitude, site.longitude, site.siteType, site.size, site.accessPoints,
        site.specialInstructions, site.emergencyProcedures, site.guardsRequired,
        site.shiftPattern, site.specialEquipment, site.certificationRequired, site.status
      );
    }

    // Insert certifications
    const insertCertification = db.prepare(`
      INSERT INTO certifications (
        id, employee_id, name, issue_date, expiry_date, issuing_authority,
        certificate_number, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const cert of sampleCertifications) {
      insertCertification.run(
        cert.id, cert.employeeId, cert.name, cert.issueDate, cert.expiryDate,
        cert.issuingAuthority, cert.certificateNumber, cert.status
      );
    }

    // Insert site assignments
    const insertSiteAssignment = db.prepare(`
      INSERT INTO site_assignments (id, site_id, employee_id, assigned_date, status)
      VALUES (?, ?, ?, ?, ?)
    `);

    for (const assignment of sampleSiteAssignments) {
      insertSiteAssignment.run(
        assignment.id, assignment.siteId, assignment.employeeId,
        assignment.assignedDate, assignment.status
      );
    }

    console.log('Database seeded successfully!');
    console.log(`- ${sampleEmployees.length} employees`);
    console.log(`- ${sampleClients.length} clients`);
    console.log(`- ${sampleSites.length} sites`);
    console.log(`- ${sampleCertifications.length} certifications`);
    console.log(`- ${sampleSiteAssignments.length} site assignments`);

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    db.close();
  }
}

// Run if called directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };