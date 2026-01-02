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