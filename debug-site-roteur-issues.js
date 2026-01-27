// Debug script to identify site assignment and roteur issues
console.log('🔍 Debugging Site Assignment and Roteur Issues...');

// Check 1: ROTEUR employees with site assignments
console.log('\n1. ROTEUR employees with site assignments (should be 0):');
const roteurWithSites = `
  SELECT id, nom_complet, matricule, site_affecte_id, poste, statut
  FROM employees_gas 
  WHERE poste = 'ROTEUR' AND site_affecte_id IS NOT NULL
`;
console.log(roteurWithSites);

// Check 2: ROTEUR employees with active deployments
console.log('\n2. ROTEUR employees with active deployments (should be 0):');
const roteurWithDeployments = `
  SELECT h.id, h.employe_id, e.nom_complet, e.matricule, s.nom_site, h.date_debut
  FROM historique_deployements h
  JOIN employees_gas e ON h.employe_id = e.id
  JOIN sites_gas s ON h.site_id = s.id
  WHERE e.poste = 'ROTEUR' AND h.est_actif = 1
`;
console.log(roteurWithDeployments);

// Check 3: Regular employees with mismatched site assignments
console.log('\n3. Regular employees with site/deployment mismatch:');
const mismatchedEmployees = `
  SELECT 
    e.id, e.nom_complet, e.matricule, e.poste,
    e.site_affecte_id as employee_site_id,
    s1.nom_site as employee_site_name,
    h.site_id as deployment_site_id,
    s2.nom_site as deployment_site_name,
    CASE 
      WHEN e.site_affecte_id IS NULL AND h.site_id IS NOT NULL THEN 'EMPLOYEE_NULL'
      WHEN e.site_affecte_id IS NOT NULL AND h.site_id IS NULL THEN 'DEPLOYMENT_NULL'
      WHEN e.site_affecte_id != h.site_id THEN 'MISMATCH'
      ELSE 'OK'
    END as issue_type
  FROM employees_gas e
  LEFT JOIN sites_gas s1 ON e.site_affecte_id = s1.id
  LEFT JOIN historique_deployements h ON e.id = h.employe_id AND h.est_actif = 1
  LEFT JOIN sites_gas s2 ON h.site_id = s2.id
  WHERE e.poste != 'ROTEUR' 
    AND e.statut = 'ACTIF'
    AND (
      (e.site_affecte_id IS NULL AND h.site_id IS NOT NULL) OR
      (e.site_affecte_id IS NOT NULL AND h.site_id IS NULL) OR
      (e.site_affecte_id != h.site_id)
    )
  ORDER BY issue_type, e.nom_complet
`;
console.log(mismatchedEmployees);

// Check 4: Roteur assignments status
console.log('\n4. Roteur assignments overview:');
const roteurAssignments = `
  SELECT 
    a.id,
    r.nom_complet as roteur_nom,
    r.matricule as roteur_matricule,
    s.nom_site as site_nom,
    a.date_debut,
    a.date_fin,
    a.statut,
    CASE 
      WHEN a.date_fin < date('now') THEN 'EXPIRED'
      WHEN a.date_debut > date('now') THEN 'FUTURE'
      ELSE 'CURRENT'
    END as time_status
  FROM affectations_roteur a
  JOIN employees_gas r ON a.roteur_id = r.id
  JOIN sites_gas s ON a.site_id = s.id
  WHERE a.statut IN ('PLANIFIE', 'EN_COURS')
  ORDER BY a.date_debut DESC
`;
console.log(roteurAssignments);

// Check 5: Sites with guard counts
console.log('\n5. Sites with guard assignments:');
const siteGuardCounts = `
  SELECT 
    s.id,
    s.nom_site,
    s.effectif_jour_requis + s.effectif_nuit_requis as total_capacity,
    COUNT(h.id) as active_deployments,
    COUNT(e.id) as employees_with_site_affecte,
    GROUP_CONCAT(e.nom_complet, ', ') as assigned_employees
  FROM sites_gas s
  LEFT JOIN historique_deployements h ON s.id = h.site_id AND h.est_actif = 1
  LEFT JOIN employees_gas e ON s.id = e.site_affecte_id AND e.statut = 'ACTIF'
  WHERE s.est_actif = 1
  GROUP BY s.id, s.nom_site, s.effectif_jour_requis, s.effectif_nuit_requis
  ORDER BY s.nom_site
`;
console.log(siteGuardCounts);

// Check 6: Employees without site but with active deployment
console.log('\n6. Employees with active deployment but no site_affecte_id:');
const employeesNoSiteWithDeployment = `
  SELECT 
    e.id, e.nom_complet, e.matricule, e.poste,
    e.site_affecte_id,
    h.site_id as deployment_site_id,
    s.nom_site as deployment_site_name
  FROM employees_gas e
  JOIN historique_deployements h ON e.id = h.employe_id AND h.est_actif = 1
  JOIN sites_gas s ON h.site_id = s.id
  WHERE e.site_affecte_id IS NULL
    AND e.poste != 'ROTEUR'
    AND e.statut = 'ACTIF'
  ORDER BY e.nom_complet
`;
console.log(employeesNoSiteWithDeployment);

console.log('\n📋 Instructions:');
console.log('1. Run these queries in the database to identify specific issues');
console.log('2. Use the maintenance tab to run consistency checks');
console.log('3. Use the sync function to fix mismatched assignments');
console.log('4. Check roteur assignments for expired or conflicting entries');