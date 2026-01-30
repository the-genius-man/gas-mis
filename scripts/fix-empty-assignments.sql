-- Fix empty weekly assignments
-- This script removes assignments with empty or null weekly_assignments

-- Check current assignments with empty weekly_assignments
SELECT id, roteur_nom, site_nom, weekly_assignments, 
       CASE 
         WHEN weekly_assignments IS NULL THEN 'NULL'
         WHEN weekly_assignments = '' THEN 'EMPTY STRING'
         WHEN weekly_assignments = '[]' THEN 'EMPTY ARRAY'
         ELSE 'HAS DATA'
       END as assignment_status
FROM affectations_roteur 
WHERE statut IN ('EN_COURS', 'PLANIFIE');

-- Delete assignments with empty weekly_assignments
DELETE FROM affectations_roteur 
WHERE statut IN ('EN_COURS', 'PLANIFIE') 
  AND (weekly_assignments IS NULL 
       OR weekly_assignments = '' 
       OR weekly_assignments = '[]'
       OR json_array_length(weekly_assignments) = 0);

-- Verify cleanup
SELECT 'After cleanup:' as info;
SELECT id, roteur_nom, site_nom, weekly_assignments
FROM affectations_roteur 
WHERE statut IN ('EN_COURS', 'PLANIFIE');