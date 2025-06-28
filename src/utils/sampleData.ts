import { Employee, Client, Site, DashboardStats } from '../types';

export const sampleEmployees: Employee[] = [
  {
    id: '1',
    employeeNumber: 'EMP001',
    personalInfo: {
      firstName: 'John',
      lastName: 'Smith',
      email: 'john.smith@goaheadsecurity.com',
      phone: '(555) 123-4567',
      dateOfBirth: '1985-03-15',
      nationalId: 'SSN123456789',
      address: {
        street: '123 Main St',
        city: 'Springfield',
        state: 'IL',
        zipCode: '62701'
      },
      emergencyContact: {
        name: 'Jane Smith',
        relationship: 'Spouse',
        phone: '(555) 123-4568'
      }
    },
    employment: {
      dateHired: '2023-01-15',
      position: 'Security Guard',
      department: 'Field Operations',
      status: 'active',
      salary: 45000,
      payrollInfo: {
        bankName: 'First National Bank',
        accountNumber: '****1234',
        routingNumber: '123456789'
      }
    },
    certifications: [
      {
        id: 'cert1',
        name: 'Security Guard License',
        issueDate: '2023-01-10',
        expiryDate: '2025-01-10',
        issuingAuthority: 'State Security Board',
        certificateNumber: 'SGL123456',
        status: 'active'
      },
      {
        id: 'cert2',
        name: 'First Aid Certification',
        issueDate: '2023-06-15',
        expiryDate: '2024-12-15',
        issuingAuthority: 'Red Cross',
        certificateNumber: 'FA789012',
        status: 'expiring-soon'
      }
    ],
    documents: [],
    performanceRecords: [],
    attendanceRecords: []
  },
  {
    id: '2',
    employeeNumber: 'EMP002',
    personalInfo: {
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'sarah.johnson@goaheadsecurity.com',
      phone: '(555) 234-5678',
      dateOfBirth: '1990-07-22',
      nationalId: 'SSN987654321',
      address: {
        street: '456 Oak Ave',
        city: 'Springfield',
        state: 'IL',
        zipCode: '62702'
      },
      emergencyContact: {
        name: 'Mike Johnson',
        relationship: 'Brother',
        phone: '(555) 234-5679'
      }
    },
    employment: {
      dateHired: '2023-03-01',
      position: 'Senior Security Guard',
      department: 'Field Operations',
      status: 'active',
      salary: 52000,
      payrollInfo: {
        bankName: 'Community Bank',
        accountNumber: '****5678',
        routingNumber: '987654321'
      }
    },
    certifications: [
      {
        id: 'cert3',
        name: 'Security Guard License',
        issueDate: '2023-02-28',
        expiryDate: '2025-02-28',
        issuingAuthority: 'State Security Board',
        certificateNumber: 'SGL654321',
        status: 'active'
      }
    ],
    documents: [],
    performanceRecords: [],
    attendanceRecords: []
  },
  {
    id: '3',
    employeeNumber: 'EMP003',
    personalInfo: {
      firstName: 'Michael',
      lastName: 'Brown',
      email: 'michael.brown@goaheadsecurity.com',
      phone: '(555) 345-6789',
      dateOfBirth: '1988-11-30',
      nationalId: 'SSN456789123',
      address: {
        street: '789 Pine St',
        city: 'Springfield',
        state: 'IL',
        zipCode: '62703'
      },
      emergencyContact: {
        name: 'Lisa Brown',
        relationship: 'Wife',
        phone: '(555) 345-6790'
      }
    },
    employment: {
      dateHired: '2022-08-15',
      position: 'Security Supervisor',
      department: 'Operations',
      status: 'active',
      salary: 65000,
      payrollInfo: {
        bankName: 'Regional Bank',
        accountNumber: '****9012',
        routingNumber: '456789123'
      }
    },
    certifications: [
      {
        id: 'cert4',
        name: 'Security Supervisor License',
        issueDate: '2022-08-10',
        expiryDate: '2024-08-10',
        issuingAuthority: 'State Security Board',
        certificateNumber: 'SSL789456',
        status: 'expiring-soon'
      }
    ],
    documents: [],
    performanceRecords: [],
    attendanceRecords: []
  }
];

export const sampleClients: Client[] = [
  {
    id: '1',
    name: 'Downtown Shopping Mall',
    type: 'corporate',
    contactInfo: {
      primaryContact: 'Robert Wilson',
      email: 'rwilson@downtownmall.com',
      phone: '(555) 111-2222',
      address: {
        street: '100 Commerce St',
        city: 'Springfield',
        state: 'IL',
        zipCode: '62701'
      }
    },
    contract: {
      startDate: '2023-01-01',
      endDate: '2024-12-31',
      serviceLevel: 'Premium',
      hourlyRate: 25,
      billingCycle: 'monthly',
      paymentTerms: 'Net 30'
    },
    status: 'active',
    sites: ['1', '2'],
    totalValue: 180000,
    createdDate: '2022-12-15'
  },
  {
    id: '2',
    name: 'Riverside Residential Complex',
    type: 'residential',
    contactInfo: {
      primaryContact: 'Maria Garcia',
      email: 'mgarcia@riverside.com',
      phone: '(555) 222-3333',
      address: {
        street: '500 River Road',
        city: 'Springfield',
        state: 'IL',
        zipCode: '62704'
      }
    },
    contract: {
      startDate: '2023-06-01',
      endDate: '2025-05-31',
      serviceLevel: 'Standard',
      hourlyRate: 22,
      billingCycle: 'monthly',
      paymentTerms: 'Net 15'
    },
    status: 'active',
    sites: ['3'],
    totalValue: 220000,
    createdDate: '2023-05-10'
  },
  {
    id: '3',
    name: 'Metro Office Complex',
    type: 'corporate',
    contactInfo: {
      primaryContact: 'David Chen',
      email: 'dchen@metrooffice.com',
      phone: '(555) 333-4444',
      address: {
        street: '200 Business Blvd',
        city: 'Springfield',
        state: 'IL',
        zipCode: '62705'
      }
    },
    contract: {
      startDate: '2023-09-01',
      endDate: '2024-08-31',
      serviceLevel: 'Basic',
      hourlyRate: 20,
      billingCycle: 'monthly',
      paymentTerms: 'Net 30'
    },
    status: 'active',
    sites: ['4'],
    totalValue: 96000,
    createdDate: '2023-08-15'
  }
];

export const sampleSites: Site[] = [
  {
    id: '1',
    name: 'Downtown Mall - Main Entrance',
    clientId: '1',
    location: {
      address: '100 Commerce St',
      city: 'Springfield',
      state: 'IL',
      zipCode: '62701',
      coordinates: { lat: 39.7817, lng: -89.6501 }
    },
    siteDetails: {
      type: 'retail',
      size: '500,000 sq ft',
      accessPoints: ['Main Entrance', 'Employee Entrance', 'Loading Dock'],
      specialInstructions: 'Monitor for shoplifting during peak hours. Check employee bags at end of shift.',
      emergencyProcedures: 'Contact mall security office at ext. 911. Evacuation route through main entrance.',
      patrolRoutes: [
        {
          id: 'route1',
          name: 'Main Floor Patrol',
          checkpoints: [
            { id: 'cp1', name: 'Main Entrance', location: 'Front doors', instructions: 'Check for suspicious activity' },
            { id: 'cp2', name: 'Food Court', location: 'Center court', instructions: 'Monitor crowd behavior' }
          ],
          estimatedDuration: 30,
          frequency: 'Every 2 hours'
        }
      ]
    },
    securityRequirements: {
      guardsRequired: 3,
      shiftPattern: '24/7',
      specialEquipment: ['Radio', 'Flashlight', 'First Aid Kit'],
      certificationRequired: ['Security Guard License']
    },
    status: 'active',
    assignedGuards: ['1', '2']
  },
  {
    id: '2',
    name: 'Downtown Mall - Parking Garage',
    clientId: '1',
    location: {
      address: '102 Commerce St',
      city: 'Springfield',
      state: 'IL',
      zipCode: '62701',
      coordinates: { lat: 39.7818, lng: -89.6502 }
    },
    siteDetails: {
      type: 'retail',
      size: '200,000 sq ft',
      accessPoints: ['Level 1 Entrance', 'Level 2 Entrance', 'Pedestrian Bridge'],
      specialInstructions: 'Vehicle patrols on all levels. Check for break-ins and vandalism.',
      emergencyProcedures: 'Contact police for vehicle break-ins. Use emergency call boxes for assistance.',
      patrolRoutes: [
        {
          id: 'route2',
          name: 'Garage Security Patrol',
          checkpoints: [
            { id: 'cp3', name: 'Level 1', location: 'Main parking level', instructions: 'Check all vehicles' },
            { id: 'cp4', name: 'Level 2', location: 'Upper parking level', instructions: 'Monitor for suspicious activity' }
          ],
          estimatedDuration: 45,
          frequency: 'Every 3 hours'
        }
      ]
    },
    securityRequirements: {
      guardsRequired: 2,
      shiftPattern: '24/7',
      specialEquipment: ['Radio', 'Flashlight', 'Vehicle'],
      certificationRequired: ['Security Guard License', 'Driver\'s License']
    },
    status: 'active',
    assignedGuards: ['3']
  },
  {
    id: '3',
    name: 'Riverside Complex - Main Gate',
    clientId: '2',
    location: {
      address: '500 River Road',
      city: 'Springfield',
      state: 'IL',
      zipCode: '62704',
      coordinates: { lat: 39.7900, lng: -89.6600 }
    },
    siteDetails: {
      type: 'residential',
      size: '50 acre complex',
      accessPoints: ['Main Gate', 'Emergency Exit'],
      specialInstructions: 'Check visitor ID and maintain visitor log. Patrol common areas after dark.',
      emergencyProcedures: 'Contact management office for noise complaints. Call police for disturbances.',
      patrolRoutes: [
        {
          id: 'route3',
          name: 'Residential Patrol',
          checkpoints: [
            { id: 'cp5', name: 'Main Gate', location: 'Entry checkpoint', instructions: 'Monitor vehicle access' },
            { id: 'cp6', name: 'Pool Area', location: 'Recreation center', instructions: 'Check after hours access' }
          ],
          estimatedDuration: 60,
          frequency: 'Every 4 hours'
        }
      ]
    },
    securityRequirements: {
      guardsRequired: 2,
      shiftPattern: '6 PM - 6 AM',
      specialEquipment: ['Radio', 'Flashlight', 'Access Control System'],
      certificationRequired: ['Security Guard License']
    },
    status: 'active',
    assignedGuards: ['1']
  },
  {
    id: '4',
    name: 'Metro Office Complex',
    clientId: '3',
    location: {
      address: '200 Business Blvd',
      city: 'Springfield',
      state: 'IL',
      zipCode: '62705',
      coordinates: { lat: 39.7700, lng: -89.6400 }
    },
    siteDetails: {
      type: 'office',
      size: '300,000 sq ft',
      accessPoints: ['Main Lobby', 'Employee Entrance', 'Loading Dock'],
      specialInstructions: 'Monitor elevator access after hours. Escort visitors to their destinations.',
      emergencyProcedures: 'Use building emergency procedures. Contact building management for issues.',
      patrolRoutes: [
        {
          id: 'route4',
          name: 'Office Building Patrol',
          checkpoints: [
            { id: 'cp7', name: 'Main Lobby', location: 'Reception area', instructions: 'Check visitor sign-in' },
            { id: 'cp8', name: 'Parking Garage', location: 'Underground parking', instructions: 'Security sweep' }
          ],
          estimatedDuration: 40,
          frequency: 'Every 2 hours'
        }
      ]
    },
    securityRequirements: {
      guardsRequired: 1,
      shiftPattern: '6 PM - 6 AM',
      specialEquipment: ['Radio', 'Flashlight', 'Key Card Access'],
      certificationRequired: ['Security Guard License']
    },
    status: 'active',
    assignedGuards: ['2']
  }
];

export const sampleDashboardStats: DashboardStats = {
  totalEmployees: 25,
  activeGuards: 22,
  totalClients: 12,
  activeSites: 18,
  monthlyRevenue: 185000,
  pendingIncidents: 3,
  expiringCertifications: 5,
  upcomingShifts: 48
};