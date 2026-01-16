# Implementation Tasks

## Phase 1: Database Schema & Foundation

### Task 1.1: Create Database Tables
- [x] Add `employees_gas` table with all fields (enhanced employee profile)
- [x] Add `historique_deployements` table for guard deployment history
- [x] Add `conges_provisions` table for leave tracking
- [x] Add `demandes_conge` table for leave requests
- [x] Add `affectations_roteur` table for rôteur assignments
- [x] Add `vehicules_flotte` table for fleet management
- [x] Add `consommation_carburant` table for fuel tracking
- [x] Add `equipements` table for equipment registry
- [x] Add `affectations_equipement` table for equipment assignments
- [x] Add `actions_disciplinaires` table for disciplinary actions
- [x] Add `alertes_systeme` table for system alerts
- [x] Create all necessary indexes

### Task 1.2: Add TypeScript Types
- [x] Add new type definitions to `src/types/index.ts`
- [x] Add employee-related types (EmployeeGASFull, etc.)
- [x] Add deployment history types (HistoriqueDeployement, MotifAffectation)
- [x] Add leave-related types (DemandeConge, CongeProvision)
- [x] Add vehicle-related types (VehiculeFlotte, ConsommationCarburant)
- [x] Add equipment-related types (Equipement, AffectationEquipement)
- [x] Add disciplinary types (ActionDisciplinaire)
- [x] Add alert types (AlerteSysteme)

---

## Phase 2: HR Module - Employee Management

### Task 2.1: Employee IPC Handlers
- [x] Add `db-get-employees-gas` handler (with filters)
- [x] Add `db-get-employee-gas` handler (single employee with details)
- [x] Add `db-create-employee-gas` handler
- [x] Add `db-update-employee-gas` handler
- [x] Add `db-delete-employee-gas` handler (soft delete)
- [x] Add handlers to both `public/electron.cjs` and `electron/main.js`
- [x] Add preload API methods

### Task 2.2: Employee UI Components
- [x] Create `src/components/HR/HRModule.tsx` (main container with tabs)
- [x] Create `src/components/HR/EmployeesManagement.tsx` (list/grid view)
- [x] Create `src/components/HR/EmployeeForm.tsx` (create/edit form)
- [x] Create `src/components/HR/EmployeeDetailModal.tsx` (tabbed detail view)
- [x] Add employee module to App.tsx navigation

### Task 2.3: Deployment History
- [x] Add `db-get-employee-deployments` handler
- [x] Add `db-get-site-deployment-history` handler
- [x] Add `db-create-deployment` handler (auto-closes previous)
- [x] Add `db-end-deployment` handler
- [x] Create `src/components/HR/DeploymentHistory.tsx` (timeline view)
- [x] Create `src/components/HR/DeploymentForm.tsx` (transfer/assign guard)
- [x] Add deployment tab to EmployeeDetailModal
- [x] Add "Historique des gardes" view in site details (SiteDetailModal)

---

## Phase 3: HR Module - Leave Management

### Task 3.1: Leave IPC Handlers
- [x] Add `db-get-leave-requests` handler
- [x] Add `db-create-leave-request` handler
- [x] Add `db-approve-leave-request` handler
- [x] Add `db-reject-leave-request` handler
- [x] Add `db-get-leave-provisions` handler
- [x] Add `db-calculate-leave-provisions` handler (auto-calculate accrual)

### Task 3.2: Leave UI Components
- [x] Create `src/components/HR/LeaveManagement.tsx` (requests list)
- [x] Create `src/components/HR/LeaveRequestForm.tsx` (create request) - integrated in LeaveManagement
- [x] Create `src/components/HR/LeaveCalendar.tsx` (calendar view)
- [x] Create `src/components/HR/LeaveProvisions.tsx` (balance overview) - integrated in LeaveManagement
- [x] Add leave tab to EmployeeDetailModal

---

## Phase 4: Operations Module - Planning & Rôteurs

### Task 4.1: Rôteur IPC Handlers
- [x] Add `db-get-roteurs` handler (employees with categorie='ROTEUR')
- [x] Add `db-get-roteur-assignments` handler
- [x] Add `db-create-roteur-assignment` handler
- [x] Add `db-update-roteur-assignment` handler
- [x] Add `db-get-site-coverage-gaps` handler

### Task 4.2: Planning UI Components
- [x] Create `src/components/Operations/OperationsModule.tsx` (main container)
- [x] Create `src/components/Operations/PlanningCalendar.tsx` (staffing calendar)
- [x] Create `src/components/Operations/RoteurManagement.tsx` (rôteur pool)
- [x] Create `src/components/Operations/RoteurAssignmentForm.tsx` (assign rôteur) - integrated in RoteurManagement
- [x] Add operations module to App.tsx navigation

---

## Phase 5: Operations Module - Fleet Management

### Task 5.1: Fleet IPC Handlers
- [x] Add `db-get-vehicles` handler
- [x] Add `db-get-vehicle` handler
- [x] Add `db-create-vehicle` handler
- [x] Add `db-update-vehicle` handler
- [x] Add `db-delete-vehicle` handler (soft delete)
- [x] Add `db-get-fuel-consumption` handler
- [x] Add `db-create-fuel-consumption` handler

### Task 5.2: Fleet UI Components
- [x] Create `src/components/Operations/FleetManagement.tsx` (vehicle list)
- [x] Create `src/components/Operations/VehicleForm.tsx` (create/edit) - integrated in FleetManagement
- [x] Create `src/components/Operations/VehicleDetailModal.tsx` (details with compliance)
- [x] Create `src/components/Operations/FuelConsumptionForm.tsx` (record fuel)
- [x] Add compliance status badges (insurance, technical inspection)

---

## Phase 6: Inventory Module

### Task 6.1: Equipment IPC Handlers
- [x] Add `db-get-equipment` handler
- [x] Add `db-get-equipment-item` handler
- [x] Add `db-create-equipment` handler
- [x] Add `db-update-equipment` handler
- [x] Add `db-assign-equipment` handler
- [x] Add `db-return-equipment` handler
- [x] Add `db-get-employee-equipment` handler

### Task 6.2: Equipment UI Components
- [x] Create `src/components/Inventory/InventoryModule.tsx` (main container)
- [x] Create `src/components/Inventory/EquipmentManagement.tsx` (equipment list)
- [x] Create `src/components/Inventory/EquipmentForm.tsx` (create/edit) - integrated in EquipmentManagement
- [x] Create `src/components/Inventory/EquipmentAssignment.tsx` (assign to employee) - integrated in EquipmentManagement
- [x] Create `src/components/Inventory/EquipmentReturn.tsx` (process return) - integrated in EquipmentManagement
- [x] Add equipment tab to EmployeeDetailModal
- [x] Add inventory module to App.tsx navigation

### Task 6.3: QR Code Feature (Optional)
- [x] Create `src/components/Inventory/QRCodeGenerator.tsx` (generate QR)
- [x] Create `src/components/Inventory/QRCodeScanner.tsx` (scan QR)
- [x] Integrate QR scanning for quick equipment lookup

---

## Phase 7: Disciplinary Module

### Task 7.1: Disciplinary IPC Handlers
- [x] Add `db-get-disciplinary-actions` handler
- [x] Add `db-get-disciplinary-action` handler
- [x] Add `db-create-disciplinary-action` handler
- [x] Add `db-update-disciplinary-action` handler
- [x] Add `db-sign-disciplinary-action` handler (employee signature)
- [x] Add `db-validate-disciplinary-action` handler (manager validation)
- [x] Add `db-reject-disciplinary-action` handler
- [x] Add `db-get-employee-disciplinary-history` handler

### Task 7.2: Disciplinary UI Components
- [x] Create `src/components/Disciplinary/DisciplinaryModule.tsx` (main container)
- [x] Create `src/components/Disciplinary/ActionsManagement.tsx` (actions list)
- [x] Create `src/components/Disciplinary/ActionForm.tsx` (create action)
- [x] Create `src/components/Disciplinary/ActionDetailModal.tsx` (details with workflow)
- [x] Create `src/components/Disciplinary/SignatureCapture.tsx` (digital signature)
- [ ] Create `src/components/Disciplinary/ActionValidation.tsx` (validation workflow)
- [x] Add disciplinary tab to EmployeeDetailModal
- [x] Add disciplinary module to App.tsx navigation

---

## Phase 8: Alerts System

### Task 8.1: Alert IPC Handlers
- [x] Add `db-get-alerts` handler (with filters)c
- [x] Add `db-acknowledge-alert` handler
- [x] Add `db-run-alert-check` handler (manual trigger)
- [x] Add `db-get-alert-counts` handler (for dashboard badge)
- [x] Implement automatic alert generation logic

### Task 8.2: Alert UI Components
- [x] Create `src/components/Alerts/AlertsPanel.tsx` (sidebar panel)
- [x] Create `src/components/Alerts/AlertCard.tsx` (individual alert)
- [x] Create `src/components/Alerts/AlertsManagement.tsx` (full management)
- [x] Add alert badge to header/navigation
- [x] Add alerts widget to Dashboard

### Task 8.3: Automated Alert Checks
- [x] Implement insurance expiration check (J-30)
- [x] Implement technical inspection check (J-15)
- [x] Implement certification expiration check (J-30)
- [x] Run checks on app startup
- [x] Add manual "Check Now" button

---

## Phase 9: Integration & Payroll Link

### Task 9.1: Payroll Integration
- [ ] Add `db-get-payroll-deductions` handler (disciplinary deductions for period)
- [ ] Add `db-get-leave-provisions-summary` handler (for payroll)
- [ ] Create payroll summary view showing deductions
- [ ] Link validated disciplinary actions to pay period

### Task 9.2: Dashboard Integration
- [ ] Add HR stats to dashboard (employee count, on leave, etc.)
- [ ] Add fleet compliance stats to dashboard
- [ ] Add pending alerts count to dashboard
- [ ] Add pending disciplinary actions count

---

## Phase 10: Testing & Polish

### Task 10.1: Testing
- [ ] Test employee CRUD operations
- [ ] Test leave request workflow
- [ ] Test rôteur assignment logic
- [ ] Test vehicle compliance alerts
- [ ] Test equipment assignment/return
- [ ] Test disciplinary workflow (create → sign → validate)
- [ ] Test alert generation and acknowledgment

### Task 10.2: UI Polish
- [ ] Ensure consistent French labels throughout
- [ ] Add loading states to all async operations
- [ ] Add error handling and user feedback
- [ ] Ensure responsive design for all new components
- [ ] Add keyboard navigation support

---

## Dependencies

- Phase 2 depends on Phase 1 (database schema)
- Phase 3 depends on Phase 2 (employee management)
- Phase 4 depends on Phase 2 (employee management)
- Phase 5 depends on Phase 4 (operations module structure)
- Phase 6 depends on Phase 2 (employee management)
- Phase 7 depends on Phase 2 (employee management)
- Phase 8 depends on Phase 5 (fleet management for vehicle alerts)
- Phase 9 depends on Phases 3, 7 (leave and disciplinary)
- Phase 10 depends on all previous phases

## Estimated Effort

| Phase | Description | Estimated Time |
|-------|-------------|----------------|
| 1 | Database Schema | 2-3 hours |
| 2 | Employee Management | 4-5 hours |
| 3 | Leave Management | 3-4 hours |
| 4 | Planning & Rôteurs | 4-5 hours |
| 5 | Fleet Management | 3-4 hours |
| 6 | Inventory | 4-5 hours |
| 7 | Disciplinary | 5-6 hours |
| 8 | Alerts System | 3-4 hours |
| 9 | Integration | 2-3 hours |
| 10 | Testing & Polish | 3-4 hours |
| **Total** | | **33-43 hours** |
