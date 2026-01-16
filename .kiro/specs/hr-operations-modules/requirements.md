# Requirements Document

## Introduction

This document defines the requirements for the Human Resources (HR), Operations, Inventory, and Disciplinary modules for the Go Ahead Security Management Information System. These modules will manage employee profiles, leave tracking, scheduling/rotation, fleet management, equipment inventory, and disciplinary actions with legal compliance.

## Glossary

- **Employee**: A security guard or staff member employed by Go Ahead Security
- **Rôteur**: A rotating guard who fills in for absent employees at various sites
- **Leave_Provision**: Accumulated leave days an employee has earned
- **Fleet_Vehicle**: A company vehicle or motorcycle used for operations
- **Equipment**: Physical items (uniforms, radios, weapons) assigned to employees
- **Disciplinary_Action**: A formal record of employee misconduct with financial impact
- **Supervisor**: A manager who can initiate disciplinary actions
- **Ops_Manager**: Operations manager who validates disciplinary actions

## Requirements

### Requirement 1: Employee Master Profile

**User Story:** As an HR manager, I want to maintain comprehensive employee profiles, so that I can track all employee information in one centralized location.

#### Acceptance Criteria

1. THE System SHALL store employee civil status including full name, date of birth, gender, marital status, and national ID number
2. THE System SHALL store employee contact information including phone number, email, and physical address
3. THE System SHALL support digital document storage for ID copies, CV, and criminal background check (Casier Judiciaire)
4. THE System SHALL track payroll configuration specifying whether employee is paid monthly or daily
5. THE System SHALL maintain a complete employment history including hire date, position changes, and salary adjustments
6. WHEN an employee profile is created, THE System SHALL generate a unique employee number
7. THE System SHALL track employee status (ACTIF, INACTIF, SUSPENDU, TERMINE)
8. THE System SHALL store bank account information for salary payments

### Requirement 2: Guard Deployment History

**User Story:** As an operations manager, I want to track the complete deployment history of each guard, so that I can see who worked where and when.

#### Acceptance Criteria

1. THE System SHALL record each site assignment for a guard with start date and end date
2. THE System SHALL track the shift type (day/night) for each deployment
3. WHEN a guard is reassigned to a new site, THE System SHALL automatically close the previous deployment record
4. THE System SHALL maintain the reason for deployment changes (transfer, client request, disciplinary, etc.)
5. THE System SHALL allow viewing a guard's complete deployment timeline
6. THE System SHALL allow viewing all guards who have worked at a specific site
7. THE System SHALL calculate total days worked at each site for reporting

### Requirement 3: Leave Management and Provisions

**User Story:** As an HR manager, I want to automatically track employee leave accrual and manage leave requests, so that I can ensure proper coverage and legal compliance.

#### Acceptance Criteria

1. THE System SHALL automatically calculate leave accrual based on employment duration (1.5 days per month worked)
2. THE System SHALL track different leave types: Annual Leave, Sick Leave, Maternity/Paternity Leave, Unpaid Leave
3. WHEN an employee requests leave, THE System SHALL verify sufficient leave balance before approval
4. WHEN leave is approved, THE System SHALL deduct the days from the employee's leave balance
5. THE System SHALL generate alerts for leave requests that require rôteur coverage
6. THE System SHALL maintain a leave history for each employee
7. WHEN calculating leave provisions, THE System SHALL consider the employee's daily rate for financial provisioning

### Requirement 4: Planning and Rôteur Management

**User Story:** As an operations manager, I want to visualize staffing needs and intelligently assign rôteurs, so that all sites maintain required coverage.

#### Acceptance Criteria

1. THE System SHALL display a calendar view of all site staffing requirements
2. THE System SHALL show which sites have coverage gaps due to leave or absences
3. THE System SHALL maintain a pool of available rôteurs with their skills and certifications
4. WHEN a coverage gap exists, THE System SHALL suggest qualified rôteurs based on skills match
5. THE System SHALL prevent double-booking of rôteurs across sites
6. THE System SHALL track rôteur assignments with start and end dates
7. WHEN a rôteur is assigned, THE System SHALL notify the relevant site supervisor

### Requirement 5: Fleet Vehicle Management

**User Story:** As an operations manager, I want to track all company vehicles and their compliance status, so that I can ensure legal operation and proper maintenance.

#### Acceptance Criteria

1. THE System SHALL maintain a complete vehicle registry including type (car, motorcycle), make, model, plate number, and chassis number
2. THE System SHALL track vehicle assignment history showing which employee is responsible for each vehicle
3. THE System SHALL store insurance policy details including provider, policy number, and expiration date
4. THE System SHALL store technical inspection (Contrôle Technique) dates and expiration
5. WHEN insurance expires within 30 days (J-30), THE System SHALL generate an alert
6. WHEN technical inspection expires within 15 days (J-15), THE System SHALL generate an alert
7. THE System SHALL track annual road tax (Taxe de Voirie) and vehicle sticker (Vignette) payments
8. THE System SHALL record fuel consumption linked to account 6063 (Carburant) with optional mileage tracking

### Requirement 6: Equipment and Inventory Management

**User Story:** As a logistics manager, I want to track equipment assignment and returns, so that I can maintain accountability for company assets.

#### Acceptance Criteria

1. THE System SHALL maintain an equipment registry with unique rugged codes and QR codes
2. THE System SHALL track equipment categories: Uniforms, Radios, Weapons, Protective Gear, Other
3. WHEN equipment is assigned to an employee, THE System SHALL record the assignment with date and digital signature
4. WHEN equipment is returned, THE System SHALL record the return with date, condition, and digital signature
5. THE System SHALL track equipment condition: NEW, GOOD, FAIR, DAMAGED, LOST
6. THE System SHALL generate reports of equipment currently assigned to each employee
7. IF equipment is lost or damaged, THE System SHALL flag for potential payroll deduction

### Requirement 7: Disciplinary Action Management

**User Story:** As a supervisor, I want to formally document employee misconduct with proper approval workflow, so that disciplinary actions are legally valid and impact payroll correctly.

#### Acceptance Criteria

1. THE System SHALL allow supervisors to create disciplinary action records with incident details
2. THE System SHALL require the employee's digital signature acknowledging the disciplinary action
3. THE System SHALL require Operations Manager validation before the action becomes effective
4. THE System SHALL track disciplinary action types: Warning, Written Warning, Suspension, Termination
5. WHEN a disciplinary action has financial impact, THE System SHALL calculate the deduction amount
6. THE System SHALL link validated disciplinary actions to the payroll system for automatic deductions
7. THE System SHALL maintain a complete disciplinary history for each employee
8. THE System SHALL track the workflow status: DRAFT, PENDING_EMPLOYEE_SIGNATURE, PENDING_VALIDATION, VALIDATED, REJECTED

### Requirement 8: Automated Alerts and Notifications

**User Story:** As a system administrator, I want the system to automatically generate alerts for compliance deadlines, so that nothing is missed.

#### Acceptance Criteria

1. THE System SHALL run daily checks for upcoming compliance deadlines
2. WHEN insurance expiration is within 30 days, THE System SHALL create an alert notification
3. WHEN technical inspection expiration is within 15 days, THE System SHALL create an alert notification
4. WHEN employee certifications are expiring within 30 days, THE System SHALL create an alert notification
5. THE System SHALL display pending alerts on the dashboard
6. THE System SHALL allow users to acknowledge and dismiss alerts
7. THE System SHALL maintain an alert history for audit purposes

### Requirement 9: Integration with Payroll

**User Story:** As an HR manager, I want disciplinary deductions and leave provisions to automatically reflect in payroll, so that salary calculations are accurate.

#### Acceptance Criteria

1. THE System SHALL calculate monthly leave provisions based on employee daily rate
2. THE System SHALL aggregate all validated disciplinary deductions for the pay period
3. THE System SHALL provide a payroll summary showing base salary, deductions, and net pay
4. WHEN generating payroll, THE System SHALL include leave provision amounts
5. THE System SHALL track payment status for each pay period
