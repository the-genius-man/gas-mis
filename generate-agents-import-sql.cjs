const XLSX = require('xlsx');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

async function generateAgentsImportSQL() {
  try {
    console.log('🔄 Starting Agents Excel to SQL conversion...');
    
    // 1. Read Excel file
    const excelPath = path.join(__dirname, 'public', 'agents_guards.xlsx');
    console.log(`📁 Reading Excel file from: ${excelPath}`);
    
    if (!fs.existsSync(excelPath)) {
      throw new Error(`Fichier Excel non trouvé: ${excelPath}`);
    }
    
    // Read the Excel file
    const workbook = XLSX.readFile(excelPath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`📊 Found ${data.length} rows in Excel file`);
    
    if (data.length === 0) {
      throw new Error('Le fichier Excel est vide ou ne contient pas de données valides');
    }
    
    // Helper function to clean text for SQL
    function cleanTextForSQL(text) {
      if (!text) return null;
      return text.toString()
        .replace(/\r\n/g, ' ')  // Replace Windows line breaks
        .replace(/\n/g, ' ')    // Replace Unix line breaks
        .replace(/\r/g, ' ')    // Replace Mac line breaks
        .replace(/'/g, "''")    // Escape single quotes
        .replace(/\s+/g, ' ')   // Replace multiple spaces with single space
        .trim();
    }
    
    // Helper function to convert Excel date to ISO string
    function excelDateToISO(excelDate) {
      if (!excelDate || typeof excelDate !== 'number') return null;
      // Excel dates are days since 1900-01-01 (with leap year bug)
      const excelEpoch = new Date(1900, 0, 1);
      const date = new Date(excelEpoch.getTime() + (excelDate - 2) * 24 * 60 * 60 * 1000);
      return date.toISOString().split('T')[0]; // Return YYYY-MM-DD format
    }
    
    // Helper function to map marital status
    function mapMaritalStatus(status) {
      if (!status) return 'CELIBATAIRE';
      const normalized = status.toString().toUpperCase();
      if (normalized.includes('MARIE') || normalized.includes('MARRIED')) return 'MARIE';
      if (normalized.includes('DIVORCE')) return 'DIVORCE';
      if (normalized.includes('VEUF') || normalized.includes('WIDOW')) return 'VEUF';
      return 'CELIBATAIRE';
    }
    
    // Helper function to determine employee category and position
    function getEmployeeCategory(fonction) {
      if (!fonction) return { categorie: 'GARDE', poste: 'GARDE' };
      const normalized = fonction.toString().toUpperCase();
      
      if (normalized.includes('SUPERVISEUR') || normalized.includes('SUPERVISOR')) {
        return { categorie: 'SUPERVISEUR', poste: 'SUPERVISEUR' };
      }
      if (normalized.includes('ROTEUR') || normalized.includes('ROULANT')) {
        return { categorie: 'GARDE', poste: 'ROTEUR' };
      }
      if (normalized.includes('ADMIN') || normalized.includes('BUREAU')) {
        return { categorie: 'ADMINISTRATION', poste: 'ADMINISTRATEUR' };
      }
      
      // Default to regular guard
      return { categorie: 'GARDE', poste: 'GARDE' };
    }
    
    // 2. Generate SQL statements
    let sqlStatements = [];
    let employeesCreated = 0;
    let activeEmployees = 0;
    let inactiveEmployees = 0;
    
    sqlStatements.push('-- Agents/Guards Import SQL Statements');
    sqlStatements.push('-- Generated on: ' + new Date().toISOString());
    sqlStatements.push('-- Source: agents_guards.xlsx');
    sqlStatements.push('');
    
    // Process each employee record
    for (const record of data) {
      console.log(`🔄 Processing employee: ${record.nom} ${record.postnom} ${record.prenom} (${record.matricule})`);
      
      const employeeId = crypto.randomUUID();
      const { categorie, poste } = getEmployeeCategory(record.fonction);
      const isActive = record.statusGuard === true || record.statusGuard === 1;
      
      if (isActive) {
        activeEmployees++;
      } else {
        inactiveEmployees++;
      }
      
      // Generate full name
      const nomComplet = [
        cleanTextForSQL(record.nom),
        cleanTextForSQL(record.postnom),
        cleanTextForSQL(record.prenom)
      ].filter(Boolean).join(' ');
      
      const employeeData = {
        id: employeeId,
        matricule: cleanTextForSQL(record.matricule) || `EMP-${record.empID}`,
        nom_complet: nomComplet,
        date_naissance: null, // Not available in Excel
        genre: record.sexe === 'F' ? 'F' : 'M',
        etat_civil: mapMaritalStatus(record.maritalStatus),
        numero_id_national: null, // Not available in Excel
        telephone: cleanTextForSQL(record.Telephone),
        email: null, // Not available in Excel
        adresse: null, // Not available in Excel
        photo_url: null,
        document_id_url: null,
        document_cv_url: null,
        document_casier_url: null,
        date_embauche: excelDateToISO(record.dateAffectation) || '2023-01-01',
        poste: poste,
        categorie: categorie,
        site_affecte_id: null, // Will be assigned later through deployments
        mode_remuneration: 'MENSUEL',
        salaire_base: 0, // Default, to be set later
        taux_journalier: 0,
        banque_nom: null,
        banque_compte: null,
        statut: isActive ? 'ACTIF' : 'INACTIF',
        date_fin_contrat: null,
        motif_fin: null
      };
      
      sqlStatements.push(`-- Employee: ${employeeData.nom_complet} (${employeeData.matricule}) - ${employeeData.statut}`);
      sqlStatements.push(`INSERT OR IGNORE INTO employees_gas (`);
      sqlStatements.push(`  id, matricule, nom_complet, date_naissance, genre, etat_civil,`);
      sqlStatements.push(`  numero_id_national, telephone, email, adresse, photo_url,`);
      sqlStatements.push(`  document_id_url, document_cv_url, document_casier_url,`);
      sqlStatements.push(`  date_embauche, poste, categorie, site_affecte_id,`);
      sqlStatements.push(`  mode_remuneration, salaire_base, taux_journalier,`);
      sqlStatements.push(`  banque_nom, banque_compte, statut, date_fin_contrat, motif_fin`);
      sqlStatements.push(`) VALUES (`);
      sqlStatements.push(`  '${employeeData.id}',`);
      sqlStatements.push(`  '${employeeData.matricule}',`);
      sqlStatements.push(`  '${employeeData.nom_complet}',`);
      sqlStatements.push(`  ${employeeData.date_naissance ? `'${employeeData.date_naissance}'` : 'NULL'},`);
      sqlStatements.push(`  '${employeeData.genre}',`);
      sqlStatements.push(`  '${employeeData.etat_civil}',`);
      sqlStatements.push(`  ${employeeData.numero_id_national ? `'${employeeData.numero_id_national}'` : 'NULL'},`);
      sqlStatements.push(`  ${employeeData.telephone ? `'${employeeData.telephone}'` : 'NULL'},`);
      sqlStatements.push(`  ${employeeData.email ? `'${employeeData.email}'` : 'NULL'},`);
      sqlStatements.push(`  ${employeeData.adresse ? `'${employeeData.adresse}'` : 'NULL'},`);
      sqlStatements.push(`  ${employeeData.photo_url ? `'${employeeData.photo_url}'` : 'NULL'},`);
      sqlStatements.push(`  ${employeeData.document_id_url ? `'${employeeData.document_id_url}'` : 'NULL'},`);
      sqlStatements.push(`  ${employeeData.document_cv_url ? `'${employeeData.document_cv_url}'` : 'NULL'},`);
      sqlStatements.push(`  ${employeeData.document_casier_url ? `'${employeeData.document_casier_url}'` : 'NULL'},`);
      sqlStatements.push(`  '${employeeData.date_embauche}',`);
      sqlStatements.push(`  '${employeeData.poste}',`);
      sqlStatements.push(`  '${employeeData.categorie}',`);
      sqlStatements.push(`  ${employeeData.site_affecte_id ? `'${employeeData.site_affecte_id}'` : 'NULL'},`);
      sqlStatements.push(`  '${employeeData.mode_remuneration}',`);
      sqlStatements.push(`  ${employeeData.salaire_base},`);
      sqlStatements.push(`  ${employeeData.taux_journalier},`);
      sqlStatements.push(`  ${employeeData.banque_nom ? `'${employeeData.banque_nom}'` : 'NULL'},`);
      sqlStatements.push(`  ${employeeData.banque_compte ? `'${employeeData.banque_compte}'` : 'NULL'},`);
      sqlStatements.push(`  '${employeeData.statut}',`);
      sqlStatements.push(`  ${employeeData.date_fin_contrat ? `'${employeeData.date_fin_contrat}'` : 'NULL'},`);
      sqlStatements.push(`  ${employeeData.motif_fin ? `'${employeeData.motif_fin}'` : 'NULL'}`);
      sqlStatements.push(`);`);
      sqlStatements.push('');
      
      employeesCreated++;
    }
    
    // Add summary comment
    sqlStatements.push('-- Import Summary:');
    sqlStatements.push(`-- Employees to create: ${employeesCreated}`);
    sqlStatements.push(`-- Active employees: ${activeEmployees}`);
    sqlStatements.push(`-- Inactive employees: ${inactiveEmployees}`);
    sqlStatements.push(`-- Total rows processed: ${data.length}`);
    
    // Write SQL file
    const sqlContent = sqlStatements.join('\n');
    const sqlFilePath = path.join(__dirname, 'import-agents.sql');
    fs.writeFileSync(sqlFilePath, sqlContent, 'utf8');
    
    console.log(`\n✅ SQL file generated successfully!`);
    console.log(`📁 File saved to: ${sqlFilePath}`);
    console.log(`📊 Results:`);
    console.log(`   • Employees to create: ${employeesCreated}`);
    console.log(`   • Active employees: ${activeEmployees}`);
    console.log(`   • Inactive employees: ${inactiveEmployees}`);
    console.log(`   • Total rows processed: ${data.length}`);
    console.log(`\n📋 Next steps:`);
    console.log(`   1. Review the generated SQL file: import-agents.sql`);
    console.log(`   2. Execute the SQL statements in your database`);
    
    return {
      success: true,
      employeesCreated,
      activeEmployees,
      inactiveEmployees,
      totalProcessed: data.length,
      sqlFilePath
    };
    
  } catch (error) {
    console.error('❌ SQL generation failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the SQL generation
generateAgentsImportSQL()
  .then(result => {
    if (result.success) {
      console.log('\n🎉 Agents SQL generation completed successfully!');
    } else {
      console.log('\n💥 Agents SQL generation failed:', result.error);
    }
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });