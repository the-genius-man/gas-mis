// Fix Site Assignment Data Sync Issue
// This script will sync site_affecte_id with active deployments

console.log('🔧 Starting Site Assignment Sync Fix...');

// Step 1: Check current inconsistencies
console.log('\n📊 Checking current data inconsistencies...');

// Get employees with active deployments but NULL site_affecte_id
const inconsistentEmployees = `
  SELECT 
    e.id,
    e.nom_complet,
    e.matricule,
    e.site_affecte_id as current_site_id,
    h.site_id as deployment_site_id,
    s.nom_site as deployment_site_name
  FROM employees_gas e
  JOIN historique_deployements h ON e.id = h.employe_id AND h.est_actif = 1
  JOIN sites_gas s ON h.site_id = s.id
  WHERE e.site_affecte_id IS NULL OR e.site_affecte_id != h.site_id
  ORDER BY e.nom_complet
`;

console.log('Query to find inconsistent employees:');
console.log(inconsistentEmployees);

// Step 2: Fix the inconsistencies
const fixQuery = `
  UPDATE employees_gas 
  SET site_affecte_id = (
    SELECT h.site_id 
    FROM historique_deployements h 
    WHERE h.employe_id = employees_gas.id AND h.est_actif = 1
  ),
  modifie_le = CURRENT_TIMESTAMP
  WHERE id IN (
    SELECT e.id
    FROM employees_gas e
    JOIN historique_deployements h ON e.id = h.employe_id AND h.est_actif = 1
    WHERE e.site_affecte_id IS NULL OR e.site_affecte_id != h.site_id
  )
`;

console.log('\n🔄 Fix query to sync site assignments:');
console.log(fixQuery);

// Step 3: Verification query
const verificationQuery = `
  SELECT 
    e.id,
    e.nom_complet,
    e.matricule,
    e.site_affecte_id,
    s1.nom_site as employee_site_name,
    h.site_id as deployment_site_id,
    s2.nom_site as deployment_site_name,
    CASE 
      WHEN e.site_affecte_id = h.site_id THEN '✅ SYNCED'
      WHEN e.site_affecte_id IS NULL AND h.site_id IS NOT NULL THEN '❌ EMPLOYEE NULL'
      WHEN e.site_affecte_id IS NOT NULL AND h.site_id IS NULL THEN '❌ DEPLOYMENT NULL'
      WHEN e.site_affecte_id != h.site_id THEN '❌ MISMATCH'
      ELSE '✅ BOTH NULL'
    END as sync_status
  FROM employees_gas e
  LEFT JOIN sites_gas s1 ON e.site_affecte_id = s1.id
  LEFT JOIN historique_deployements h ON e.id = h.employe_id AND h.est_actif = 1
  LEFT JOIN sites_gas s2 ON h.site_id = s2.id
  WHERE e.statut = 'ACTIF'
  ORDER BY sync_status, e.nom_complet
`;

console.log('\n🔍 Verification query to check sync status:');
console.log(verificationQuery);

console.log('\n📋 Instructions:');
console.log('1. Open the Electron app');
console.log('2. Go to Settings → Maintenance tab');
console.log('3. Run "Check Data Consistency" to see current issues');
console.log('4. Run "Cleanup Roteur Assignments" to fix the sync');
console.log('5. Or run the queries above in the database directly');

console.log('\n🎯 Expected Result:');
console.log('- Chantal Mwamini should show "Residence Baudouoin" in both views');
console.log('- All employees with active deployments should have matching site_affecte_id');