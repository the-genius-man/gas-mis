// Core data types for the Go Ahead Security management system

export interface Employee {
  id: string;
  employeeNumber: string;
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    nationalId: string;
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
    };
    emergencyContact: {
      name: string;
      relationship: string;
      phone: string;
    };
    photo?: string;
  };
  employment: {
    dateHired: string;
    position: string;
    department: string;
    status: 'active' | 'inactive' | 'terminated';
    salary: number;
    payrollInfo: {
      bankName: string;
      accountNumber: string;
      routingNumber: string;
    };
  };
  certifications: Certification[];
  documents: Document[];
  performanceRecords: PerformanceRecord[];
  attendanceRecords: AttendanceRecord[];
}

export interface Certification {
  id: string;
  name: string;
  issueDate: string;
  expiryDate: string;
  issuingAuthority: string;
  certificateNumber: string;
  status: 'active' | 'expired' | 'expiring-soon';
  documentUrl?: string;
}

export interface Document {
  id: string;
  name: string;
  type: 'contract' | 'id' | 'background-check' | 'certificate' | 'other';
  uploadDate: string;
  fileUrl: string;
  size: number;
}

export interface PerformanceRecord {
  id: string;
  date: string;
  type: 'review' | 'commendation' | 'disciplinary';
  title: string;
  description: string;
  rating?: number;
  supervisor: string;
}

export interface AttendanceRecord {
  id: string;
  date: string;
  clockIn: string;
  clockOut?: string;
  status: 'present' | 'absent' | 'late' | 'left-early';
  hoursWorked: number;
  siteId?: string;
}

export interface Client {
  id: string;
  name: string;
  type: 'corporate' | 'residential' | 'event' | 'government';
  contactInfo: {
    primaryContact: string;
    email: string;
    phone: string;
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
    };
  };
  contract: {
    startDate: string;
    endDate: string;
    serviceLevel: string;
    hourlyRate: number;
    billingCycle: 'weekly' | 'monthly' | 'quarterly';
    paymentTerms: string;
  };
  status: 'active' | 'inactive' | 'pending';
  sites: string[]; // Array of site IDs
  totalValue: number;
  createdDate: string;
}

export interface Site {
  id: string;
  name: string;
  clientId: string;
  location: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  siteDetails: {
    type: 'office' | 'warehouse' | 'retail' | 'residential' | 'event' | 'other';
    size: string;
    accessPoints: string[];
    specialInstructions: string;
    emergencyProcedures: string;
    patrolRoutes: PatrolRoute[];
  };
  securityRequirements: {
    guardsRequired: number;
    shiftPattern: string;
    specialEquipment: string[];
    certificationRequired: string[];
  };
  status: 'active' | 'inactive' | 'setup';
  assignedGuards: string[]; // Array of employee IDs
}

export interface PatrolRoute {
  id: string;
  name: string;
  checkpoints: Checkpoint[];
  estimatedDuration: number;
  frequency: string;
}

export interface Checkpoint {
  id: string;
  name: string;
  location: string;
  instructions: string;
  qrCode?: string;
  nfcTag?: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'hr-manager' | 'operations-supervisor' | 'guard';
  permissions: string[];
  lastLogin: string;
  isActive: boolean;
}

export interface DashboardStats {
  totalEmployees: number;
  activeGuards: number;
  totalClients: number;
  activeSites: number;
  monthlyRevenue: number;
  pendingIncidents: number;
  expiringCertifications: number;
  upcomingShifts: number;
}