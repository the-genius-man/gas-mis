# Enhanced Payroll Deductions System - Design

## Architecture Overview

The enhanced deductions system will be built as a comprehensive module that integrates seamlessly with the existing payroll, HR, and disciplinary systems. It will use a flexible, schedule-based approach to handle various deduction types and payment plans.

## Database Design

### Core Tables

#### 1. `deduction_types` - Deduction Categories Configuration
```sql
CREATE TABLE deduction_types (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,           -- 'DISCIPLINARY', 'UNIFORM', 'LOAN', 'CONTRIBUTION'
  nom TEXT NOT NULL,                   -- Display name in French
  description TEXT,
  calculation_method TEXT NOT NULL,    -- 'FIXED_AMOUNT', 'PERCENTAGE', 'CUSTOM'
  default_schedule_type TEXT,          -- 'ONE_TIME', 'INSTALLMENTS', 'RECURRING'
  max_percentage_salary REAL,         -- Maximum % of salary for this type
  priority_order INTEGER DEFAULT 100, -- Processing priority (lower = higher priority)
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

#### 2. `employee_deductions` - Main Deductions Registry
```sql
CREATE TABLE employee_deductions (
  id TEXT PRIMARY KEY,
  employe_id TEXT NOT NULL,
  deduction_type_id TEXT NOT NULL,
  source_type TEXT,                    -- 'DISCIPLINARY', 'MANUAL', 'SYSTEM'
  source_id TEXT,                      -- Reference to disciplinary action, etc.
  
  -- Deduction Details
  title TEXT NOT NULL,                 -- Description of deduction
  total_amount REAL NOT NULL,          -- Total amount to be deducted
  amount_deducted REAL DEFAULT 0,      -- Amount already deducted
  amount_remaining REAL NOT NULL,      -- Remaining balance
  
  -- Schedule Configuration
  schedule_type TEXT NOT NULL,         -- 'ONE_TIME', 'INSTALLMENTS', 'RECURRING', 'CUSTOM'
  installment_amount REAL,             -- Fixed installment amount
  number_of_installments INTEGER,      -- Total number of installments
  installments_completed INTEGER DEFAULT 0,
  
  -- Timing
  start_date TEXT NOT NULL,            -- When deductions should start
  end_date TEXT,                       -- When deductions should end (optional)
  next_deduction_date TEXT,            -- Next scheduled deduction
  
  -- Status and Control
  status TEXT DEFAULT 'ACTIVE',       -- 'ACTIVE', 'SUSPENDED', 'COMPLETED', 'CANCELLED'
  max_per_period REAL,                -- Maximum amount per payroll period
  skip_periods TEXT,                   -- JSON array of periods to skip
  
  -- Audit
  created_by TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  modified_at TEXT DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (employe_id) REFERENCES employees_gas(id),
  FOREIGN KEY (deduction_type_id) REFERENCES deduction_types(id)
);
```

#### 3. `deduction_schedule` - Custom Payment Schedules
```sql
CREATE TABLE deduction_schedule (
  id TEXT PRIMARY KEY,
  deduction_id TEXT NOT NULL,
  period_year INTEGER NOT NULL,
  period_month INTEGER NOT NULL,
  scheduled_amount REAL NOT NULL,
  actual_amount REAL DEFAULT 0,
  status TEXT DEFAULT 'PENDING',       -- 'PENDING', 'APPLIED', 'SKIPPED', 'FAILED'
  applied_date TEXT,
  bulletin_paie_id TEXT,               -- Link to payslip where applied
  notes TEXT,
  
  FOREIGN KEY (deduction_id) REFERENCES employee_deductions(id),
  FOREIGN KEY (bulletin_paie_id) REFERENCES bulletins_paie(id),
  UNIQUE(deduction_id, period_year, period_month)
);
```

#### 4. `deduction_history` - Payment History Tracking
```sql
CREATE TABLE deduction_history (
  id TEXT PRIMARY KEY,
  deduction_id TEXT NOT NULL,
  bulletin_paie_id TEXT NOT NULL,
  amount_deducted REAL NOT NULL,
  period_year INTEGER NOT NULL,
  period_month INTEGER NOT NULL,
  deduction_date TEXT NOT NULL,
  status TEXT DEFAULT 'APPLIED',       -- 'APPLIED', 'REVERSED', 'ADJUSTED'
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (deduction_id) REFERENCES employee_deductions(id),
  FOREIGN KEY (bulletin_paie_id) REFERENCES bulletins_paie(id)
);
```

### Enhanced Existing Tables

#### Update `actions_disciplinaires` for Deduction Integration
```sql
-- Add columns to link disciplinary actions to deductions
ALTER TABLE actions_disciplinaires ADD COLUMN deduction_id TEXT;
ALTER TABLE actions_disciplinaires ADD COLUMN payment_schedule TEXT; -- JSON config
ALTER TABLE actions_disciplinaires ADD COLUMN installments INTEGER DEFAULT 1;
```

#### Update `bulletins_paie` for Enhanced Deduction Tracking
```sql
-- Add detailed deduction breakdown
ALTER TABLE bulletins_paie ADD COLUMN deductions_disciplinaires REAL DEFAULT 0;
ALTER TABLE bulletins_paie ADD COLUMN deductions_uniformes REAL DEFAULT 0;
ALTER TABLE bulletins_paie ADD COLUMN deductions_contributions REAL DEFAULT 0;
ALTER TABLE bulletins_paie ADD COLUMN deductions_autres REAL DEFAULT 0;
ALTER TABLE bulletins_paie ADD COLUMN total_deductions_detail REAL DEFAULT 0;
```

## Core Components

### 1. Deduction Engine (`DeductionEngine`)

**Responsibilities:**
- Calculate deductions for a given payroll period
- Apply business rules and constraints
- Handle insufficient salary scenarios
- Update deduction balances and schedules

**Key Methods:**
```typescript
interface DeductionEngine {
  calculateDeductionsForEmployee(employeeId: string, period: PayrollPeriod): DeductionCalculation[];
  applyDeductionsToPayslip(payslip: BulletinPaie, deductions: DeductionCalculation[]): void;
  processInsufficientSalary(payslip: BulletinPaie, deductions: DeductionCalculation[]): void;
  updateDeductionBalances(deductions: DeductionCalculation[]): void;
}
```

### 2. Schedule Manager (`ScheduleManager`)

**Responsibilities:**
- Generate payment schedules for new deductions
- Calculate installment amounts
- Handle custom schedules and modifications
- Manage schedule suspension and resumption

**Key Methods:**
```typescript
interface ScheduleManager {
  createSchedule(deduction: EmployeeDeduction): DeductionSchedule[];
  calculateInstallments(totalAmount: number, periods: number, startDate: Date): number[];
  modifySchedule(deductionId: string, modifications: ScheduleModification): void;
  suspendSchedule(deductionId: string, reason: string): void;
}
```

### 3. Deduction Service (`DeductionService`)

**Responsibilities:**
- CRUD operations for deductions
- Integration with disciplinary actions
- Validation and business rule enforcement
- Reporting and analytics

**Key Methods:**
```typescript
interface DeductionService {
  createDeduction(deduction: CreateDeductionRequest): EmployeeDeduction;
  getEmployeeDeductions(employeeId: string, filters?: DeductionFilters): EmployeeDeduction[];
  updateDeduction(deductionId: string, updates: DeductionUpdate): void;
  cancelDeduction(deductionId: string, reason: string): void;
  getDeductionHistory(deductionId: string): DeductionHistory[];
}
```

## Integration Points

### 1. Payroll Calculation Integration

**Modified Payroll Flow:**
1. Calculate base salary and benefits
2. **NEW:** Calculate applicable deductions using DeductionEngine
3. Apply social security and tax calculations
4. **NEW:** Apply deductions with priority ordering
5. **NEW:** Handle insufficient salary scenarios
6. Generate final payslip with detailed deduction breakdown
7. **NEW:** Update deduction balances and schedules

### 2. Disciplinary Actions Integration

**Enhanced Disciplinary Flow:**
1. Create disciplinary action with financial impact
2. **NEW:** Configure payment schedule (installments, timing)
3. Validate and approve disciplinary action
4. **NEW:** Automatically create deduction record with schedule
5. **NEW:** Link disciplinary action to deduction for audit trail

### 3. Employee Self-Service Integration

**New Employee Portal Features:**
- View active deductions and payment schedules
- See deduction history and remaining balances
- Understand deduction categories and reasons
- Request payment plan modifications (with approval workflow)

## Business Logic

### Deduction Calculation Algorithm

```typescript
function calculateEmployeeDeductions(employeeId: string, period: PayrollPeriod): DeductionCalculation[] {
  // 1. Get all active deductions for employee
  const activeDeductions = getActiveDeductions(employeeId, period);
  
  // 2. Sort by priority order
  activeDeductions.sort((a, b) => a.priority - b.priority);
  
  // 3. Calculate amounts for this period
  const calculations: DeductionCalculation[] = [];
  let availableSalary = getEmployeeSalary(employeeId, period);
  
  for (const deduction of activeDeductions) {
    const scheduledAmount = getScheduledAmount(deduction, period);
    const maxAllowed = Math.min(
      scheduledAmount,
      deduction.max_per_period || scheduledAmount,
      availableSalary * MAX_DEDUCTION_PERCENTAGE
    );
    
    const actualAmount = Math.min(maxAllowed, availableSalary);
    
    calculations.push({
      deductionId: deduction.id,
      scheduledAmount,
      actualAmount,
      shortfall: scheduledAmount - actualAmount,
      type: deduction.type
    });
    
    availableSalary -= actualAmount;
  }
  
  return calculations;
}
```

### Schedule Generation Logic

```typescript
function generateInstallmentSchedule(
  totalAmount: number,
  installments: number,
  startDate: Date,
  skipPeriods: string[] = []
): DeductionSchedule[] {
  const baseAmount = Math.floor((totalAmount / installments) * 100) / 100;
  const remainder = totalAmount - (baseAmount * installments);
  
  const schedule: DeductionSchedule[] = [];
  let currentDate = new Date(startDate);
  
  for (let i = 0; i < installments; i++) {
    // Skip periods if specified
    while (skipPeriods.includes(formatPeriod(currentDate))) {
      currentDate = addMonths(currentDate, 1);
    }
    
    const amount = i === 0 ? baseAmount + remainder : baseAmount;
    
    schedule.push({
      period_year: currentDate.getFullYear(),
      period_month: currentDate.getMonth() + 1,
      scheduled_amount: amount,
      status: 'PENDING'
    });
    
    currentDate = addMonths(currentDate, 1);
  }
  
  return schedule;
}
```

## User Interface Design

### 1. Deductions Management Dashboard
- Overview of all employee deductions
- Filter by type, status, employee
- Quick actions for common operations
- Summary statistics and metrics

### 2. Create/Edit Deduction Form
- Employee selection
- Deduction type and category
- Amount and schedule configuration
- Advanced options (max per period, skip periods)
- Preview of payment schedule

### 3. Employee Deductions View
- List of active deductions per employee
- Payment history and remaining balances
- Quick actions (suspend, modify, cancel)
- Integration with employee profile

### 4. Payroll Integration View
- Deductions summary during payroll calculation
- Alerts for insufficient salary scenarios
- Detailed breakdown by category
- Override options for special cases

## API Endpoints

### Deduction Management
- `GET /api/deductions` - List deductions with filters
- `POST /api/deductions` - Create new deduction
- `PUT /api/deductions/:id` - Update deduction
- `DELETE /api/deductions/:id` - Cancel deduction
- `GET /api/deductions/:id/schedule` - Get payment schedule
- `PUT /api/deductions/:id/schedule` - Modify schedule

### Employee-Specific
- `GET /api/employees/:id/deductions` - Employee's deductions
- `GET /api/employees/:id/deductions/history` - Payment history
- `POST /api/employees/:id/deductions/request-modification` - Request changes

### Payroll Integration
- `GET /api/payroll/:periodId/deductions` - Deductions for period
- `POST /api/payroll/:periodId/apply-deductions` - Apply deductions
- `GET /api/payroll/deductions/insufficient-salary` - Problem cases

## Configuration and Settings

### System Configuration
- Maximum deduction percentage per payroll period
- Default payment schedule types per deduction category
- Priority ordering for deduction types
- Insufficient salary handling policies

### Deduction Type Configuration
- Custom deduction categories
- Calculation methods and rules
- Default schedules and constraints
- Integration with accounting codes

## Reporting and Analytics

### Standard Reports
- Deductions summary by employee/period/type
- Outstanding balances report
- Collection efficiency metrics
- Payroll impact analysis

### Dashboard Metrics
- Total active deductions
- Monthly collection amounts
- Problem cases requiring attention
- Trend analysis and forecasting

## Migration Strategy

### Phase 1: Core Infrastructure
- Create new database tables
- Implement basic deduction engine
- Migrate existing disciplinary deductions

### Phase 2: Enhanced Features
- Add schedule management
- Implement multiple deduction types
- Create management interfaces

### Phase 3: Integration and Optimization
- Full payroll integration
- Employee self-service features
- Advanced reporting and analytics

## Testing Strategy

### Unit Tests
- Deduction calculation algorithms
- Schedule generation logic
- Business rule validation
- Edge case handling

### Integration Tests
- Payroll system integration
- Disciplinary actions workflow
- Database operations and constraints
- API endpoint functionality

### User Acceptance Tests
- End-to-end deduction workflows
- Payroll processing scenarios
- Employee self-service features
- Administrative operations

## Performance Considerations

### Optimization Strategies
- Efficient database queries with proper indexing
- Caching of frequently accessed deduction data
- Batch processing for large payroll runs
- Asynchronous processing for complex calculations

### Scalability
- Support for large employee bases (10,000+ employees)
- Efficient handling of multiple concurrent payroll periods
- Optimized reporting queries for large datasets
- Horizontal scaling capabilities for future growth