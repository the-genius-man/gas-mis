const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const Database = require('better-sqlite3');

let mainWindow;
let db;

// Initialize SQLite database
function initDatabase() {
  const dbPath = isDev 
    ? path.join(__dirname, '..', 'database.sqlite')
    : path.join(process.resourcesPath, 'database.sqlite');
  
  db = new Database(dbPath);
  
  // Create tables
  createTables();
  
  console.log('Database initialized at:', dbPath);
}

function createTables() {
  // Employees table
  db.exec(`
    CREATE TABLE IF NOT EXISTS employees (
      id TEXT PRIMARY KEY,
      employee_number TEXT UNIQUE NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      date_of_birth TEXT,
      national_id TEXT,
      address_street TEXT,
      address_city TEXT,
      address_state TEXT,
      address_zip_code TEXT,
      emergency_contact_name TEXT,
      emergency_contact_relationship TEXT,
      emergency_contact_phone TEXT,
      photo TEXT,
      date_hired TEXT NOT NULL,
      position TEXT NOT NULL,
      department TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      salary REAL,
      bank_name TEXT,
      account_number TEXT,
      routing_number TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Clients table
  db.exec(`
    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      primary_contact TEXT,
      email TEXT,
      phone TEXT,
      address_street TEXT,
      address_city TEXT,
      address_state TEXT,
      address_zip_code TEXT,
      contract_start_date TEXT,
      contract_end_date TEXT,
      service_level TEXT,
      hourly_rate REAL,
      billing_cycle TEXT,
      payment_terms TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      total_value REAL,
      created_date TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Sites table
  db.exec(`
    CREATE TABLE IF NOT EXISTS sites (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      client_id TEXT NOT NULL,
      address TEXT,
      city TEXT,
      state TEXT,
      zip_code TEXT,
      latitude REAL,
      longitude REAL,
      site_type TEXT,
      size TEXT,
      access_points TEXT,
      special_instructions TEXT,
      emergency_procedures TEXT,
      guards_required INTEGER,
      shift_pattern TEXT,
      special_equipment TEXT,
      certification_required TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients (id)
    )
  `);

  // Certifications table
  db.exec(`
    CREATE TABLE IF NOT EXISTS certifications (
      id TEXT PRIMARY KEY,
      employee_id TEXT NOT NULL,
      name TEXT NOT NULL,
      issue_date TEXT,
      expiry_date TEXT,
      issuing_authority TEXT,
      certificate_number TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      document_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (employee_id) REFERENCES employees (id)
    )
  `);

  // Site assignments table
  db.exec(`
    CREATE TABLE IF NOT EXISTS site_assignments (
      id TEXT PRIMARY KEY,
      site_id TEXT NOT NULL,
      employee_id TEXT NOT NULL,
      assigned_date TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (site_id) REFERENCES sites (id),
      FOREIGN KEY (employee_id) REFERENCES employees (id)
    )
  `);

  // Attendance records table
  db.exec(`
    CREATE TABLE IF NOT EXISTS attendance_records (
      id TEXT PRIMARY KEY,
      employee_id TEXT NOT NULL,
      date TEXT NOT NULL,
      clock_in TEXT,
      clock_out TEXT,
      status TEXT NOT NULL,
      hours_worked REAL,
      site_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (employee_id) REFERENCES employees (id),
      FOREIGN KEY (site_id) REFERENCES sites (id)
    )
  `);

  console.log('Database tables created successfully');
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.cjs')
    },
    icon: path.join(__dirname, 'icon.png'), // Add your app icon
    show: false
  });

  const startUrl = isDev 
    ? 'http://localhost:5173' 
    : `file://${path.join(__dirname, '../dist/index.html')}`;
  
  mainWindow.loadURL(startUrl);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  initDatabase();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (db) {
      db.close();
    }
    app.quit();
  }
});

// IPC handlers for database operations
ipcMain.handle('db-get-employees', async () => {
  try {
    const stmt = db.prepare(`
      SELECT e.*, 
             GROUP_CONCAT(c.id || '|' || c.name || '|' || c.status || '|' || c.expiry_date) as certifications
      FROM employees e
      LEFT JOIN certifications c ON e.id = c.employee_id
      GROUP BY e.id
      ORDER BY e.last_name, e.first_name
    `);
    const rows = stmt.all();
    
    return rows.map(row => ({
      id: row.id,
      employeeNumber: row.employee_number,
      personalInfo: {
        firstName: row.first_name,
        lastName: row.last_name,
        email: row.email,
        phone: row.phone,
        dateOfBirth: row.date_of_birth,
        nationalId: row.national_id,
        address: {
          street: row.address_street,
          city: row.address_city,
          state: row.address_state,
          zipCode: row.address_zip_code
        },
        emergencyContact: {
          name: row.emergency_contact_name,
          relationship: row.emergency_contact_relationship,
          phone: row.emergency_contact_phone
        },
        photo: row.photo
      },
      employment: {
        dateHired: row.date_hired,
        position: row.position,
        department: row.department,
        status: row.status,
        salary: row.salary,
        payrollInfo: {
          bankName: row.bank_name,
          accountNumber: row.account_number,
          routingNumber: row.routing_number
        }
      },
      certifications: row.certifications ? row.certifications.split(',').map(cert => {
        const [id, name, status, expiryDate] = cert.split('|');
        return { id, name, status, expiryDate };
      }) : [],
      documents: [],
      performanceRecords: [],
      attendanceRecords: []
    }));
  } catch (error) {
    console.error('Error fetching employees:', error);
    throw error;
  }
});

ipcMain.handle('db-add-employee', async (event, employee) => {
  try {
    const stmt = db.prepare(`
      INSERT INTO employees (
        id, employee_number, first_name, last_name, email, phone, date_of_birth,
        national_id, address_street, address_city, address_state, address_zip_code,
        emergency_contact_name, emergency_contact_relationship, emergency_contact_phone,
        photo, date_hired, position, department, status, salary, bank_name,
        account_number, routing_number
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      employee.id,
      employee.employeeNumber,
      employee.personalInfo.firstName,
      employee.personalInfo.lastName,
      employee.personalInfo.email,
      employee.personalInfo.phone,
      employee.personalInfo.dateOfBirth,
      employee.personalInfo.nationalId,
      employee.personalInfo.address.street,
      employee.personalInfo.address.city,
      employee.personalInfo.address.state,
      employee.personalInfo.address.zipCode,
      employee.personalInfo.emergencyContact.name,
      employee.personalInfo.emergencyContact.relationship,
      employee.personalInfo.emergencyContact.phone,
      employee.personalInfo.photo,
      employee.employment.dateHired,
      employee.employment.position,
      employee.employment.department,
      employee.employment.status,
      employee.employment.salary,
      employee.employment.payrollInfo.bankName,
      employee.employment.payrollInfo.accountNumber,
      employee.employment.payrollInfo.routingNumber
    );
    
    return { success: true, id: employee.id };
  } catch (error) {
    console.error('Error adding employee:', error);
    throw error;
  }
});

ipcMain.handle('db-get-clients', async () => {
  try {
    const stmt = db.prepare(`
      SELECT c.*,
             GROUP_CONCAT(s.id) as site_ids
      FROM clients c
      LEFT JOIN sites s ON c.id = s.client_id
      GROUP BY c.id
      ORDER BY c.name
    `);
    const rows = stmt.all();
    
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      type: row.type,
      contactInfo: {
        primaryContact: row.primary_contact,
        email: row.email,
        phone: row.phone,
        address: {
          street: row.address_street,
          city: row.address_city,
          state: row.address_state,
          zipCode: row.address_zip_code
        }
      },
      contract: {
        startDate: row.contract_start_date,
        endDate: row.contract_end_date,
        serviceLevel: row.service_level,
        hourlyRate: row.hourly_rate,
        billingCycle: row.billing_cycle,
        paymentTerms: row.payment_terms
      },
      status: row.status,
      sites: row.site_ids ? row.site_ids.split(',') : [],
      totalValue: row.total_value,
      createdDate: row.created_date
    }));
  } catch (error) {
    console.error('Error fetching clients:', error);
    throw error;
  }
});

ipcMain.handle('db-get-sites', async () => {
  try {
    const stmt = db.prepare(`
      SELECT s.*,
             GROUP_CONCAT(sa.employee_id) as assigned_guard_ids
      FROM sites s
      LEFT JOIN site_assignments sa ON s.id = sa.site_id AND sa.status = 'active'
      GROUP BY s.id
      ORDER BY s.name
    `);
    const rows = stmt.all();
    
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      clientId: row.client_id,
      location: {
        address: row.address,
        city: row.city,
        state: row.state,
        zipCode: row.zip_code,
        coordinates: {
          lat: row.latitude || 0,
          lng: row.longitude || 0
        }
      },
      siteDetails: {
        type: row.site_type,
        size: row.size,
        accessPoints: row.access_points ? row.access_points.split(',') : [],
        specialInstructions: row.special_instructions,
        emergencyProcedures: row.emergency_procedures,
        patrolRoutes: []
      },
      securityRequirements: {
        guardsRequired: row.guards_required,
        shiftPattern: row.shift_pattern,
        specialEquipment: row.special_equipment ? row.special_equipment.split(',') : [],
        certificationRequired: row.certification_required ? row.certification_required.split(',') : []
      },
      status: row.status,
      assignedGuards: row.assigned_guard_ids ? row.assigned_guard_ids.split(',') : []
    }));
  } catch (error) {
    console.error('Error fetching sites:', error);
    throw error;
  }
});

ipcMain.handle('db-get-dashboard-stats', async () => {
  try {
    const totalEmployees = db.prepare('SELECT COUNT(*) as count FROM employees').get().count;
    const activeGuards = db.prepare('SELECT COUNT(*) as count FROM employees WHERE status = "active"').get().count;
    const totalClients = db.prepare('SELECT COUNT(*) as count FROM clients').get().count;
    const activeSites = db.prepare('SELECT COUNT(*) as count FROM sites WHERE status = "active"').get().count;
    
    // Calculate monthly revenue (this would need more complex logic in real app)
    const monthlyRevenue = db.prepare('SELECT SUM(total_value/12) as revenue FROM clients WHERE status = "active"').get().revenue || 0;
    
    // Get expiring certifications (within 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const expiringCerts = db.prepare(`
      SELECT COUNT(*) as count 
      FROM certifications 
      WHERE date(expiry_date) <= date(?) AND date(expiry_date) > date('now')
    `).get(thirtyDaysFromNow.toISOString().split('T')[0]).count;
    
    return {
      totalEmployees,
      activeGuards,
      totalClients,
      activeSites,
      monthlyRevenue: Math.round(monthlyRevenue),
      pendingIncidents: 0, // Would need incidents table
      expiringCertifications: expiringCerts,
      upcomingShifts: 0 // Would need shifts/schedule table
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
});

// Additional IPC handlers for CRUD operations
ipcMain.handle('db-update-employee', async (event, employee) => {
  try {
    const stmt = db.prepare(`
      UPDATE employees SET
        employee_number = ?, first_name = ?, last_name = ?, email = ?, phone = ?,
        date_of_birth = ?, national_id = ?, address_street = ?, address_city = ?,
        address_state = ?, address_zip_code = ?, emergency_contact_name = ?,
        emergency_contact_relationship = ?, emergency_contact_phone = ?, photo = ?,
        date_hired = ?, position = ?, department = ?, status = ?, salary = ?,
        bank_name = ?, account_number = ?, routing_number = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    const result = stmt.run(
      employee.employeeNumber,
      employee.personalInfo.firstName,
      employee.personalInfo.lastName,
      employee.personalInfo.email,
      employee.personalInfo.phone,
      employee.personalInfo.dateOfBirth,
      employee.personalInfo.nationalId,
      employee.personalInfo.address.street,
      employee.personalInfo.address.city,
      employee.personalInfo.address.state,
      employee.personalInfo.address.zipCode,
      employee.personalInfo.emergencyContact.name,
      employee.personalInfo.emergencyContact.relationship,
      employee.personalInfo.emergencyContact.phone,
      employee.personalInfo.photo,
      employee.employment.dateHired,
      employee.employment.position,
      employee.employment.department,
      employee.employment.status,
      employee.employment.salary,
      employee.employment.payrollInfo.bankName,
      employee.employment.payrollInfo.accountNumber,
      employee.employment.payrollInfo.routingNumber,
      employee.id
    );
    
    return { success: true };
  } catch (error) {
    console.error('Error updating employee:', error);
    throw error;
  }
});

ipcMain.handle('db-delete-employee', async (event, id) => {
  try {
    // Delete related records first
    db.prepare('DELETE FROM site_assignments WHERE employee_id = ?').run(id);
    db.prepare('DELETE FROM certifications WHERE employee_id = ?').run(id);
    db.prepare('DELETE FROM attendance_records WHERE employee_id = ?').run(id);
    
    // Delete employee
    const stmt = db.prepare('DELETE FROM employees WHERE id = ?');
    const result = stmt.run(id);
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting employee:', error);
    throw error;
  }
});

ipcMain.handle('db-add-client', async (event, client) => {
  try {
    const stmt = db.prepare(`
      INSERT INTO clients (
        id, name, type, primary_contact, email, phone, address_street, address_city,
        address_state, address_zip_code, contract_start_date, contract_end_date,
        service_level, hourly_rate, billing_cycle, payment_terms, status, total_value, created_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      client.id,
      client.name,
      client.type,
      client.contactInfo.primaryContact,
      client.contactInfo.email,
      client.contactInfo.phone,
      client.contactInfo.address.street,
      client.contactInfo.address.city,
      client.contactInfo.address.state,
      client.contactInfo.address.zipCode,
      client.contract.startDate,
      client.contract.endDate,
      client.contract.serviceLevel,
      client.contract.hourlyRate,
      client.contract.billingCycle,
      client.contract.paymentTerms,
      client.status,
      client.totalValue,
      client.createdDate
    );
    
    return { success: true, id: client.id };
  } catch (error) {
    console.error('Error adding client:', error);
    throw error;
  }
});

ipcMain.handle('db-update-client', async (event, client) => {
  try {
    const stmt = db.prepare(`
      UPDATE clients SET
        name = ?, type = ?, primary_contact = ?, email = ?, phone = ?,
        address_street = ?, address_city = ?, address_state = ?, address_zip_code = ?,
        contract_start_date = ?, contract_end_date = ?, service_level = ?, hourly_rate = ?,
        billing_cycle = ?, payment_terms = ?, status = ?, total_value = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    const result = stmt.run(
      client.name,
      client.type,
      client.contactInfo.primaryContact,
      client.contactInfo.email,
      client.contactInfo.phone,
      client.contactInfo.address.street,
      client.contactInfo.address.city,
      client.contactInfo.address.state,
      client.contactInfo.address.zipCode,
      client.contract.startDate,
      client.contract.endDate,
      client.contract.serviceLevel,
      client.contract.hourlyRate,
      client.contract.billingCycle,
      client.contract.paymentTerms,
      client.status,
      client.totalValue,
      client.id
    );
    
    return { success: true };
  } catch (error) {
    console.error('Error updating client:', error);
    throw error;
  }
});

ipcMain.handle('db-delete-client', async (event, id) => {
  try {
    // Delete related records first
    const sites = db.prepare('SELECT id FROM sites WHERE client_id = ?').all(id);
    for (const site of sites) {
      db.prepare('DELETE FROM site_assignments WHERE site_id = ?').run(site.id);
    }
    db.prepare('DELETE FROM sites WHERE client_id = ?').run(id);
    
    // Delete client
    const stmt = db.prepare('DELETE FROM clients WHERE id = ?');
    const result = stmt.run(id);
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting client:', error);
    throw error;
  }
});

ipcMain.handle('db-add-site', async (event, site) => {
  try {
    const stmt = db.prepare(`
      INSERT INTO sites (
        id, name, client_id, address, city, state, zip_code, latitude, longitude,
        site_type, size, access_points, special_instructions, emergency_procedures,
        guards_required, shift_pattern, special_equipment, certification_required, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      site.id,
      site.name,
      site.clientId,
      site.location.address,
      site.location.city,
      site.location.state,
      site.location.zipCode,
      site.location.coordinates.lat,
      site.location.coordinates.lng,
      site.siteDetails.type,
      site.siteDetails.size,
      site.siteDetails.accessPoints.join(','),
      site.siteDetails.specialInstructions,
      site.siteDetails.emergencyProcedures,
      site.securityRequirements.guardsRequired,
      site.securityRequirements.shiftPattern,
      site.securityRequirements.specialEquipment.join(','),
      site.securityRequirements.certificationRequired.join(','),
      site.status
    );
    
    return { success: true, id: site.id };
  } catch (error) {
    console.error('Error adding site:', error);
    throw error;
  }
});

ipcMain.handle('db-update-site', async (event, site) => {
  try {
    const stmt = db.prepare(`
      UPDATE sites SET
        name = ?, client_id = ?, address = ?, city = ?, state = ?, zip_code = ?,
        latitude = ?, longitude = ?, site_type = ?, size = ?, access_points = ?,
        special_instructions = ?, emergency_procedures = ?, guards_required = ?,
        shift_pattern = ?, special_equipment = ?, certification_required = ?, status = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    const result = stmt.run(
      site.name,
      site.clientId,
      site.location.address,
      site.location.city,
      site.location.state,
      site.location.zipCode,
      site.location.coordinates.lat,
      site.location.coordinates.lng,
      site.siteDetails.type,
      site.siteDetails.size,
      site.siteDetails.accessPoints.join(','),
      site.siteDetails.specialInstructions,
      site.siteDetails.emergencyProcedures,
      site.securityRequirements.guardsRequired,
      site.securityRequirements.shiftPattern,
      site.securityRequirements.specialEquipment.join(','),
      site.securityRequirements.certificationRequired.join(','),
      site.status,
      site.id
    );
    
    return { success: true };
  } catch (error) {
    console.error('Error updating site:', error);
    throw error;
  }
});

ipcMain.handle('db-delete-site', async (event, id) => {
  try {
    // Delete related records first
    db.prepare('DELETE FROM site_assignments WHERE site_id = ?').run(id);
    
    // Delete site
    const stmt = db.prepare('DELETE FROM sites WHERE id = ?');
    const result = stmt.run(id);
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting site:', error);
    throw error;
  }
});

// Seed database with sample data
ipcMain.handle('db-seed-data', async () => {
  try {
    // Sample data
    const sampleEmployees = [
      {
        id: '1', employeeNumber: 'EMP001', firstName: 'John', lastName: 'Smith',
        email: 'john.smith@goaheadsecurity.com', phone: '(555) 123-4567',
        dateOfBirth: '1985-03-15', nationalId: 'SSN123456789',
        addressStreet: '123 Main St', addressCity: 'Springfield', addressState: 'IL', addressZipCode: '62701',
        emergencyContactName: 'Jane Smith', emergencyContactRelationship: 'Spouse', emergencyContactPhone: '(555) 123-4568',
        dateHired: '2023-01-15', position: 'Security Guard', department: 'Field Operations',
        status: 'active', salary: 45000, bankName: 'First National Bank', accountNumber: '****1234', routingNumber: '123456789'
      },
      {
        id: '2', employeeNumber: 'EMP002', firstName: 'Sarah', lastName: 'Johnson',
        email: 'sarah.johnson@goaheadsecurity.com', phone: '(555) 234-5678',
        dateOfBirth: '1990-07-22', nationalId: 'SSN987654321',
        addressStreet: '456 Oak Ave', addressCity: 'Springfield', addressState: 'IL', addressZipCode: '62702',
        emergencyContactName: 'Mike Johnson', emergencyContactRelationship: 'Brother', emergencyContactPhone: '(555) 234-5679',
        dateHired: '2023-03-01', position: 'Senior Security Guard', department: 'Field Operations',
        status: 'active', salary: 52000, bankName: 'Community Bank', accountNumber: '****5678', routingNumber: '987654321'
      },
      {
        id: '3', employeeNumber: 'EMP003', firstName: 'Michael', lastName: 'Brown',
        email: 'michael.brown@goaheadsecurity.com', phone: '(555) 345-6789',
        dateOfBirth: '1988-11-30', nationalId: 'SSN456789123',
        addressStreet: '789 Pine St', addressCity: 'Springfield', addressState: 'IL', addressZipCode: '62703',
        emergencyContactName: 'Lisa Brown', emergencyContactRelationship: 'Wife', emergencyContactPhone: '(555) 345-6790',
        dateHired: '2022-08-15', position: 'Security Supervisor', department: 'Operations',
        status: 'active', salary: 65000, bankName: 'Regional Bank', accountNumber: '****9012', routingNumber: '456789123'
      }
    ];

    const sampleClients = [
      {
        id: '1', name: 'Downtown Shopping Mall', type: 'corporate', primaryContact: 'Robert Wilson',
        email: 'rwilson@downtownmall.com', phone: '(555) 111-2222',
        addressStreet: '100 Commerce St', addressCity: 'Springfield', addressState: 'IL', addressZipCode: '62701',
        contractStartDate: '2023-01-01', contractEndDate: '2024-12-31', serviceLevel: 'Premium',
        hourlyRate: 25, billingCycle: 'monthly', paymentTerms: 'Net 30',
        status: 'active', totalValue: 180000, createdDate: '2022-12-15'
      },
      {
        id: '2', name: 'Riverside Residential Complex', type: 'residential', primaryContact: 'Maria Garcia',
        email: 'mgarcia@riverside.com', phone: '(555) 222-3333',
        addressStreet: '500 River Road', addressCity: 'Springfield', addressState: 'IL', addressZipCode: '62704',
        contractStartDate: '2023-06-01', contractEndDate: '2025-05-31', serviceLevel: 'Standard',
        hourlyRate: 22, billingCycle: 'monthly', paymentTerms: 'Net 15',
        status: 'active', totalValue: 220000, createdDate: '2023-05-10'
      },
      {
        id: '3', name: 'Metro Office Complex', type: 'corporate', primaryContact: 'David Chen',
        email: 'dchen@metrooffice.com', phone: '(555) 333-4444',
        addressStreet: '200 Business Blvd', addressCity: 'Springfield', addressState: 'IL', addressZipCode: '62705',
        contractStartDate: '2023-09-01', contractEndDate: '2024-08-31', serviceLevel: 'Basic',
        hourlyRate: 20, billingCycle: 'monthly', paymentTerms: 'Net 30',
        status: 'active', totalValue: 96000, createdDate: '2023-08-15'
      }
    ];

    const sampleSites = [
      {
        id: '1', name: 'Downtown Mall - Main Entrance', clientId: '1',
        address: '100 Commerce St', city: 'Springfield', state: 'IL', zipCode: '62701',
        latitude: 39.7817, longitude: -89.6501, siteType: 'retail', size: '500,000 sq ft',
        accessPoints: 'Main Entrance,Employee Entrance,Loading Dock',
        specialInstructions: 'Monitor for shoplifting during peak hours. Check employee bags at end of shift.',
        emergencyProcedures: 'Contact mall security office at ext. 911. Evacuation route through main entrance.',
        guardsRequired: 3, shiftPattern: '24/7', specialEquipment: 'Radio,Flashlight,First Aid Kit',
        certificationRequired: 'Security Guard License', status: 'active'
      },
      {
        id: '2', name: 'Downtown Mall - Parking Garage', clientId: '1',
        address: '102 Commerce St', city: 'Springfield', state: 'IL', zipCode: '62701',
        latitude: 39.7818, longitude: -89.6502, siteType: 'retail', size: '200,000 sq ft',
        accessPoints: 'Level 1 Entrance,Level 2 Entrance,Pedestrian Bridge',
        specialInstructions: 'Vehicle patrols on all levels. Check for break-ins and vandalism.',
        emergencyProcedures: 'Contact police for vehicle break-ins. Use emergency call boxes for assistance.',
        guardsRequired: 2, shiftPattern: '24/7', specialEquipment: 'Radio,Flashlight,Vehicle',
        certificationRequired: 'Security Guard License,Driver License', status: 'active'
      },
      {
        id: '3', name: 'Riverside Complex - Main Gate', clientId: '2',
        address: '500 River Road', city: 'Springfield', state: 'IL', zipCode: '62704',
        latitude: 39.7900, longitude: -89.6600, siteType: 'residential', size: '50 acre complex',
        accessPoints: 'Main Gate,Emergency Exit',
        specialInstructions: 'Check visitor ID and maintain visitor log. Patrol common areas after dark.',
        emergencyProcedures: 'Contact management office for noise complaints. Call police for disturbances.',
        guardsRequired: 2, shiftPattern: '6 PM - 6 AM', specialEquipment: 'Radio,Flashlight,Access Control System',
        certificationRequired: 'Security Guard License', status: 'active'
      },
      {
        id: '4', name: 'Metro Office Complex', clientId: '3',
        address: '200 Business Blvd', city: 'Springfield', state: 'IL', zipCode: '62705',
        latitude: 39.7700, longitude: -89.6400, siteType: 'office', size: '300,000 sq ft',
        accessPoints: 'Main Lobby,Employee Entrance,Loading Dock',
        specialInstructions: 'Monitor elevator access after hours. Escort visitors to their destinations.',
        emergencyProcedures: 'Use building emergency procedures. Contact building management for issues.',
        guardsRequired: 1, shiftPattern: '6 PM - 6 AM', specialEquipment: 'Radio,Flashlight,Key Card Access',
        certificationRequired: 'Security Guard License', status: 'active'
      }
    ];

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

    // Insert some certifications
    const insertCertification = db.prepare(`
      INSERT INTO certifications (id, employee_id, name, issue_date, expiry_date, issuing_authority, certificate_number, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const certifications = [
      { id: 'cert1', employeeId: '1', name: 'Security Guard License', issueDate: '2023-01-10', expiryDate: '2025-01-10', issuingAuthority: 'State Security Board', certificateNumber: 'SGL123456', status: 'active' },
      { id: 'cert2', employeeId: '1', name: 'First Aid Certification', issueDate: '2023-06-15', expiryDate: '2024-12-15', issuingAuthority: 'Red Cross', certificateNumber: 'FA789012', status: 'expiring-soon' },
      { id: 'cert3', employeeId: '2', name: 'Security Guard License', issueDate: '2023-02-28', expiryDate: '2025-02-28', issuingAuthority: 'State Security Board', certificateNumber: 'SGL654321', status: 'active' },
      { id: 'cert4', employeeId: '3', name: 'Security Supervisor License', issueDate: '2022-08-10', expiryDate: '2024-08-10', issuingAuthority: 'State Security Board', certificateNumber: 'SSL789456', status: 'expiring-soon' }
    ];

    for (const cert of certifications) {
      insertCertification.run(cert.id, cert.employeeId, cert.name, cert.issueDate, cert.expiryDate, cert.issuingAuthority, cert.certificateNumber, cert.status);
    }

    // Insert site assignments
    const insertSiteAssignment = db.prepare(`
      INSERT INTO site_assignments (id, site_id, employee_id, assigned_date, status)
      VALUES (?, ?, ?, ?, ?)
    `);

    const assignments = [
      { id: 'sa1', siteId: '1', employeeId: '1', assignedDate: '2023-01-15', status: 'active' },
      { id: 'sa2', siteId: '1', employeeId: '2', assignedDate: '2023-03-01', status: 'active' },
      { id: 'sa3', siteId: '2', employeeId: '3', assignedDate: '2022-08-15', status: 'active' },
      { id: 'sa4', siteId: '3', employeeId: '1', assignedDate: '2023-06-01', status: 'active' },
      { id: 'sa5', siteId: '4', employeeId: '2', assignedDate: '2023-09-01', status: 'active' }
    ];

    for (const assignment of assignments) {
      insertSiteAssignment.run(assignment.id, assignment.siteId, assignment.employeeId, assignment.assignedDate, assignment.status);
    }

    console.log('Database seeded successfully!');
    return { success: true, message: 'Sample data loaded successfully' };
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
});