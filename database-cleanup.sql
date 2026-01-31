-- Database Cleanup Script
-- Generated: 2026-01-31T08:38:08.928Z
-- 
-- This script removes duplicate and unused tables from the database
-- IMPORTANT: Run this only after backing up your database!

-- Check current table status
SELECT 'Current table status:' as info;
SELECT name, 
       (SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name=t.name) as exists,
       CASE 
         WHEN name IN ('employees', 'clients', 'sites') THEN 'LEGACY - Consider removing'
         WHEN name IN ('employees_gas', 'clients_gas', 'sites_gas') THEN 'ACTIVE - Keep'
         WHEN name IN ('certifications', 'site_assignments', 'attendance_records') THEN 'POTENTIALLY_UNUSED'
         ELSE 'REVIEW_NEEDED'
       END as status
FROM (
  SELECT 'employees' as name UNION ALL
  SELECT 'employees_gas' UNION ALL
  SELECT 'clients' UNION ALL
  SELECT 'clients_gas' UNION ALL
  SELECT 'sites' UNION ALL
  SELECT 'sites_gas' UNION ALL
  SELECT 'certifications' UNION ALL
  SELECT 'site_assignments' UNION ALL
  SELECT 'attendance_records'
) t;

-- Check data in potentially duplicate tables
SELECT 'Data check for legacy tables:' as info;

-- Check employees vs employees_gas
SELECT 'employees table:' as table_name, COUNT(*) as record_count FROM employees
UNION ALL
SELECT 'employees_gas table:', COUNT(*) FROM employees_gas;

-- Check clients vs clients_gas  
SELECT 'clients table:' as table_name, COUNT(*) as record_count FROM clients
UNION ALL
SELECT 'clients_gas table:', COUNT(*) FROM clients_gas;

-- Check sites vs sites_gas
SELECT 'sites table:' as table_name, COUNT(*) as record_count FROM sites
UNION ALL
SELECT 'sites_gas table:', COUNT(*) FROM sites_gas;

-- Check potentially unused tables
SELECT 'certifications table:' as table_name, COUNT(*) as record_count FROM certifications
UNION ALL
SELECT 'site_assignments table:', COUNT(*) FROM site_assignments
UNION ALL
SELECT 'attendance_records table:', COUNT(*) FROM attendance_records;

-- CLEANUP COMMANDS (uncomment to execute)
-- WARNING: These commands will permanently delete data!

-- Step 1: Remove legacy tables (only if _gas versions have data)
-- DROP TABLE IF EXISTS employees;
-- DROP TABLE IF EXISTS clients;  
-- DROP TABLE IF EXISTS sites;

-- Step 2: Remove unused tables (only if empty)
-- DROP TABLE IF EXISTS certifications;
-- DROP TABLE IF EXISTS site_assignments;
-- DROP TABLE IF EXISTS attendance_records;

-- Step 3: Remove any other empty/unused tables
-- DROP TABLE IF EXISTS affectations_roteur_journalieres; -- If not used

-- Step 4: Optimize database
-- VACUUM;
-- ANALYZE;

-- Final verification
SELECT 'Cleanup completed. Remaining tables:' as info;
SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;
