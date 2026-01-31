# Go Ahead Security - Management Information System (GAS-MIS)

## Project Overview

Go Ahead Security Management Information System (GAS-MIS) is a comprehensive enterprise application designed for security service companies operating in the Democratic Republic of Congo (DRC). The system manages all aspects of security operations including human resources, client management, site operations, payroll, finance, and reporting.

## Table of Contents

1. [Project Details](#project-details)
2. [Architecture & Technology Stack](#architecture--technology-stack)
3. [Setup Instructions](#setup-instructions)
4. [Core Modules](#core-modules)
5. [Implementation & Development with Kiro](#implementation--development-with-kiro)
6. [Key Features](#key-features)
7. [Database Schema](#database-schema)
8. [Development Workflow](#development-workflow)
9. [Deployment](#deployment)
10. [Troubleshooting](#troubleshooting)

## Project Details

### Business Context
- **Industry**: Private Security Services
- **Geographic Focus**: Democratic Republic of Congo (DRC)
- **Primary Language**: French
- **Currency**: USD
- **Target Users**: Security company management, HR personnel, operations managers, finance teams

### Core Business Requirements
- **Employee Management**: Guards, roteurs (rotating guards), administrative staff
- **Client & Site Management**: Corporate clients, residential sites, commercial properties
- **Operations Management**: Guard deployments, site coverage, rotational schedules
- **Payroll System**: Salary calculations, deductions, advances, payment tracking
- **Financial Management**: Invoicing, payments, expense tracking, OHADA compliance
- **Reporting**: Comprehensive reports for all business aspects

## Architecture & Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **State Management**: React Context API
- **Routing**: React Router (implied from structure)

### Backend/Desktop
- **Runtime**: Electron (for desktop application)
- **Database**: SQLite with better-sqlite3
- **API Layer**: Electron IPC (Inter-Process Communication)

### Development Tools
- **Package Manager**: npm
- **Testing**: Vitest
- **Linting**: ESLint
- **Type Checking**: TypeScript
- **AI Assistant**: Kiro (for development assistance)

### Key Dependencies
```json
{
  "react": "^18.x",
  "typescript": "^5.x",
  "vite": "^5.x",
  "tailwindcss": "^3.x",
  "lucide-react": "^0.x",
  "better-sqlite3": "^x.x",
  "electron": "^x.x"
}
```

## Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Git

### Installation Steps

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd gas-mis
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Database Setup**
   ```bash
   # Initialize database with sample data
   npm run seed-database
   
   # Or run specific setup scripts
   node scripts/seed-database.cjs
   ```

4. **Development Server**
   ```bash
   # Start Vite development server
   npm run dev
   
   # Start Electron application (if available)
   npm run electron:dev
   ```

5. **Build for Production**
   ```bash
   # Build web version
   npm run build
   
   # Build Electron app
   npm run electron:build
   ```

### Environment Configuration
- Database file: `database.sqlite` (auto-created)
- Upload directory: `uploads/employees/` (for employee photos)
- Configuration files in `.kiro/` directory

## Core Modules

### 1. Human Resources (HR)
**Location**: `src/components/HR/`
- **Employee Management**: Complete CRUD operations for all staff
- **Deployment Management**: Assign guards to sites with scheduling
- **Leave Management**: Track vacation, sick leave, and absences
- **Employee Categories**: Guards, Roteurs, Administrative staff
- **Photo Management**: Employee photo upload and storage

### 2. Operations
**Location**: `src/components/Operations/`
- **Agents Management**: Field staff (guards and roteurs) operations
- **Roteur Management**: Specialized rotating guard system with weekly schedules
- **Planning Calendar**: Visual weekly planning for roteur assignments
- **Fleet Management**: Vehicle tracking and maintenance
- **Site Coverage**: Monitor which sites have adequate security coverage

### 3. Finance
**Location**: `src/components/Finance/`
- **Client Management**: Corporate and individual client records
- **Site Management**: Physical locations requiring security services
- **Invoice Management**: Billing and invoice generation
- **Payment Tracking**: Client payment records and status
- **Tax Settings**: OHADA-compliant tax calculations
- **Bulk Operations**: Mass operations on clients and sites

### 4. Payroll
**Location**: `src/components/Payroll/`
- **Salary Management**: Base salary and overtime calculations
- **Deductions Management**: Taxes, advances, disciplinary deductions
- **Advances Management**: Employee cash advances tracking
- **Payslip Generation**: Automated payslip creation and PDF export
- **Unpaid Salaries**: Track and manage salary arrears
- **OHADA Compliance**: Accounting standards compliance

### 5. Disciplinary
**Location**: `src/components/Disciplinary/`
- **Action Management**: Record disciplinary actions
- **Signature Capture**: Digital signatures for disciplinary documents
- **Payroll Integration**: Automatic deduction calculations
- **Document Management**: Store disciplinary records

### 6. Inventory
**Location**: `src/components/Inventory/`
- **Equipment Management**: Security equipment tracking
- **QR Code System**: Equipment identification and scanning
- **Maintenance Tracking**: Equipment service records

### 7. Reports
**Location**: `src/components/Reports/`
- **Financial Reports**: Revenue, expenses, profitability
- **HR Reports**: Employee statistics, attendance
- **Operations Reports**: Site coverage, deployment efficiency
- **Payroll Reports**: Salary summaries, tax reports

## Implementation & Development with Kiro

### Kiro AI Assistant Integration

The project was developed with extensive assistance from Kiro, an AI-powered development assistant. Here's how Kiro was utilized throughout the development process:

#### 1. **Initial Project Setup & Architecture**
- **Kiro's Role**: Analyzed business requirements and recommended optimal technology stack
- **Decisions Made**: 
  - React + TypeScript for type safety and maintainability
  - Electron for desktop deployment in DRC context
  - SQLite for local data storage and offline capability
  - Tailwind CSS for rapid UI development

#### 2. **Component Development Workflow**
```
User Request → Kiro Analysis → Implementation → Testing → Refinement
```

**Example Workflow with Kiro:**
1. **User**: "I need a roteur management system with weekly scheduling"
2. **Kiro Analysis**: 
   - Analyzed existing codebase structure
   - Identified related components and patterns
   - Proposed data models and UI design
3. **Implementation**: 
   - Created `RoteurManagement.tsx` component
   - Implemented weekly scheduling grid
   - Added database integration
4. **Testing & Refinement**:
   - Kiro helped debug TypeScript errors
   - Optimized performance and user experience
   - Added comprehensive error handling

#### 3. **Database Design & Management**
- **Kiro's Contribution**:
  - Designed normalized database schema
  - Created migration scripts for schema updates
  - Implemented data seeding for development
  - Added database debugging utilities

#### 4. **UI/UX Development**
- **Design System**: Kiro helped establish consistent design patterns
- **Responsive Design**: Ensured mobile-friendly interfaces
- **Accessibility**: Implemented WCAG-compliant components
- **Internationalization**: French language support throughout

#### 5. **Complex Feature Implementation**

**Bulk Operations System**:
- **Challenge**: Implement bulk actions across multiple management interfaces
- **Kiro's Approach**:
  1. Created reusable `BulkActions` component
  2. Implemented consistent selection patterns
  3. Added confirmation dialogs and error handling
  4. Applied to Clients, Sites, Employees, and Agents management

**Roteur Weekly Scheduling**:
- **Challenge**: Complex weekly recurring assignments with site rotations
- **Kiro's Solution**:
  1. Designed flexible weekly schedule data structure
  2. Created intuitive grid-based UI for schedule input
  3. Implemented validation for scheduling conflicts
  4. Added visual planning calendar for overview

#### 6. **Debugging & Problem Solving**

**Example: Roteur Planning Display Issue**
- **Problem**: Weekly assignments not displaying in planning calendar
- **Kiro's Debugging Process**:
  1. Added comprehensive logging to track data flow
  2. Analyzed database storage vs retrieval formats
  3. Identified JSON parsing issues
  4. Implemented robust data formatting and fallback mechanisms
  5. Created test scripts for validation

#### 7. **Code Quality & Maintenance**
- **TypeScript Integration**: Kiro helped resolve type errors and improve type safety
- **Error Handling**: Implemented comprehensive error boundaries and user feedback
- **Performance Optimization**: Identified and resolved performance bottlenecks
- **Code Documentation**: Added inline comments and documentation

### Development Patterns Established with Kiro

#### 1. **Component Structure**
```typescript
// Standard component pattern used throughout
interface ComponentProps {
  // Props definition
}

const Component: React.FC<ComponentProps> = ({ props }) => {
  // State management
  const [state, setState] = useState();
  
  // Data loading
  useEffect(() => {
    loadData();
  }, []);
  
  // Event handlers
  const handleAction = async () => {
    // Implementation
  };
  
  // Render
  return (
    <div className="standard-layout">
      {/* Component JSX */}
    </div>
  );
};
```

#### 2. **Data Management Pattern**
```typescript
// Consistent data loading pattern
const loadData = async () => {
  setLoading(true);
  try {
    if (electronMode && window.electronAPI) {
      const data = await window.electronAPI.getData();
      setData(data || []);
    }
  } catch (error) {
    console.error('Error loading data:', error);
  } finally {
    setLoading(false);
  }
};
```

#### 3. **Error Handling Pattern**
```typescript
// Standardized error handling
try {
  const result = await operation();
  if (result.success) {
    // Success handling
  } else {
    throw new Error(result.error);
  }
} catch (error) {
  console.error('Operation failed:', error);
  alert('User-friendly error message');
}
```

## Key Features

### 1. **Multi-Modal Operation**
- **Web Mode**: Browser-based access for remote management
- **Electron Mode**: Desktop application for local deployment
- **Offline Capability**: Local SQLite database for offline operations

### 2. **Comprehensive Employee Management**
- **Categories**: Guards, Roteurs, Administrative staff
- **Deployment System**: Assign guards to specific sites and shifts
- **Photo Management**: Employee photo upload and display
- **Status Tracking**: Active, Inactive, Suspended, Terminated

### 3. **Advanced Roteur System**
- **Weekly Recurring Schedules**: Roteurs assigned to different sites on different days
- **Visual Planning**: Calendar view of all roteur assignments
- **Conflict Detection**: Prevent double-booking and scheduling conflicts
- **Site Coverage Analysis**: Identify sites needing roteur coverage

### 4. **Client & Site Management**
- **Dual Entity System**: Clients can have multiple sites
- **Site Requirements**: Define guard requirements per site (day/night shifts)
- **Pricing Management**: Site-specific pricing and billing
- **Status Management**: Active/Inactive with cascading effects

### 5. **Payroll System**
- **Multiple Payment Modes**: Monthly salary vs daily rates
- **Deduction Management**: Taxes, advances, disciplinary actions
- **Payslip Generation**: PDF export with detailed breakdowns
- **OHADA Compliance**: Accounting standards for DRC

### 6. **Bulk Operations**
- **Mass Actions**: Activate, deactivate, or delete multiple records
- **Confirmation Dialogs**: Prevent accidental bulk operations
- **Progress Tracking**: Visual feedback for long-running operations
- **Error Handling**: Detailed error reporting for failed operations

### 7. **Reporting & Analytics**
- **Financial Reports**: Revenue, expenses, profitability analysis
- **Operational Reports**: Site coverage, deployment efficiency
- **HR Reports**: Employee statistics, payroll summaries
- **Export Capabilities**: PDF and Excel export options

## Database Schema

### Core Tables

#### Employees (employees_gas)
```sql
- id (PRIMARY KEY)
- nom_complet (Full Name)
- matricule (Employee ID)
- categorie (GARDE, ROTEUR, ADMIN)
- statut (ACTIF, INACTIF, SUSPENDU, TERMINE)
- salaire_base (Base Salary)
- mode_remuneration (MENSUEL, JOURNALIER)
- photo_url (Photo Path)
- telephone (Phone Number)
- created_at, updated_at
```

#### Clients (clients_gas)
```sql
- id (PRIMARY KEY)
- nom_entreprise (Company Name)
- type_client (MORALE, PHYSIQUE)
- statut (ACTIF, INACTIF, SUPPRIME)
- contact_nom (Contact Person)
- telephone (Phone)
- adresse_facturation (Billing Address)
- created_at, updated_at
```

#### Sites (sites_gas)
```sql
- id (PRIMARY KEY)
- client_id (FOREIGN KEY)
- nom_site (Site Name)
- adresse_physique (Physical Address)
- effectif_jour_requis (Day Guards Required)
- effectif_nuit_requis (Night Guards Required)
- tarif_mensuel_client (Monthly Rate)
- est_actif (Active Status)
- created_at, updated_at
```

#### Roteur Assignments (affectations_roteur)
```sql
- id (PRIMARY KEY)
- roteur_id (FOREIGN KEY)
- site_id (FOREIGN KEY)
- date_debut (Start Date)
- date_fin (End Date)
- weekly_assignments (JSON - Weekly Schedule)
- statut (PLANIFIE, EN_COURS, TERMINE)
- created_at, updated_at
```

## Development Workflow

### 1. **Feature Development Process**
1. **Requirements Analysis**: Define business requirements
2. **Design Phase**: UI/UX mockups and data model design
3. **Implementation**: Component development with TypeScript
4. **Testing**: Manual testing and bug fixes
5. **Integration**: Ensure compatibility with existing modules
6. **Documentation**: Update documentation and comments

### 2. **Code Review Process**
- **Kiro-Assisted Reviews**: AI-powered code analysis
- **Type Safety**: TypeScript error resolution
- **Performance Checks**: Identify optimization opportunities
- **Accessibility Audit**: Ensure WCAG compliance

### 3. **Database Management**
- **Migration Scripts**: Version-controlled schema changes
- **Seed Data**: Development and testing data
- **Backup Procedures**: Regular database backups
- **Performance Monitoring**: Query optimization

## Deployment

### Development Environment
```bash
npm run dev          # Start Vite dev server
npm run electron:dev # Start Electron in development
```

### Production Build
```bash
npm run build           # Build web application
npm run electron:build  # Build Electron application
```

### Database Deployment
```bash
node scripts/seed-database.cjs  # Initialize with sample data
node scripts/reset-roteur-data.cjs  # Reset roteur assignments
```

## Troubleshooting

### Common Issues

#### 1. **Database Connection Issues**
- **Symptom**: "Database not found" errors
- **Solution**: Run `node scripts/seed-database.cjs` to initialize
- **Prevention**: Ensure `database.sqlite` exists in project root

#### 2. **Electron API Not Available**
- **Symptom**: "window.electronAPI is undefined"
- **Solution**: Check if running in Electron mode vs web mode
- **Code**: Use `isElectron()` helper function for mode detection

#### 3. **TypeScript Errors**
- **Symptom**: Type errors in development
- **Solution**: Update type definitions in `src/types/index.ts`
- **Tool**: Use Kiro for automated type error resolution

#### 4. **Roteur Planning Not Displaying**
- **Symptom**: Empty weekly assignments in planning view
- **Solution**: Check `weekly_assignments` JSON format in database
- **Debug**: Enable console logging in `PlanningCalendar.tsx`

#### 5. **Bulk Operations Failing**
- **Symptom**: Bulk actions not completing
- **Solution**: Check network connectivity and API availability
- **Monitoring**: Watch browser console for error messages

### Performance Optimization

#### 1. **Large Dataset Handling**
- Implement pagination for employee and client lists
- Use virtual scrolling for large tables
- Optimize database queries with proper indexing

#### 2. **Memory Management**
- Clean up event listeners in useEffect cleanup
- Optimize image loading and caching
- Use React.memo for expensive components

#### 3. **Database Optimization**
- Create indexes on frequently queried columns
- Use prepared statements for repeated queries
- Implement connection pooling for concurrent access

## Future Enhancements

### Planned Features
1. **Mobile Application**: React Native mobile app
2. **Cloud Synchronization**: Multi-device data sync
3. **Advanced Reporting**: Business intelligence dashboard
4. **API Integration**: Third-party service integrations
5. **Multi-language Support**: English and Lingala translations

### Technical Improvements
1. **Automated Testing**: Unit and integration test suite
2. **CI/CD Pipeline**: Automated build and deployment
3. **Performance Monitoring**: Application performance tracking
4. **Security Enhancements**: Data encryption and access controls

## Conclusion

The Go Ahead Security MIS represents a comprehensive solution for security service management in the DRC context. Developed with extensive AI assistance from Kiro, the system demonstrates modern web development practices while addressing specific business requirements of the security industry.

The modular architecture, comprehensive feature set, and robust data management make it suitable for scaling from small security firms to large enterprise operations. The combination of web and desktop deployment options ensures accessibility across different technological environments common in the DRC.

---

**Project Status**: Active Development
**Last Updated**: January 2025
**Development Assistant**: Kiro AI
**Primary Language**: French (UI), English (Code)
**License**: Proprietary