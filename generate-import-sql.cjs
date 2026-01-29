const XLSX = require('xlsx');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

async function generateImportSQL() {
  try {
    console.log('🔄 Starting Excel to SQL conversion...');
    
    // 1. Read Excel file
    const excelPath = path.join(__dirname, 'public', 'customers.xlsx');
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
    
    // Helper function to determine client type
    function getClientType(companyName) {
      const name = companyName.toUpperCase();
      if (name.includes('ONG') || name.includes('STE') || name.includes('ASBL')) {
        return 'MORALE';
      }
      return 'PHYSIQUE';
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
    
    // 2. Group data by company name to identify duplicates
    const groupedData = {};
    data.forEach((row, index) => {
      const companyName = row['nameCustomer'];
      
      if (!companyName) {
        console.warn(`⚠️ Row ${index + 1}: No company name found, skipping`);
        return;
      }
      
      const cleanedName = cleanTextForSQL(companyName);
      const normalizedName = cleanedName.toUpperCase();
      
      if (!groupedData[normalizedName]) {
        groupedData[normalizedName] = [];
      }
      groupedData[normalizedName].push({ 
        ...row, 
        originalCompanyName: cleanedName, 
        rowIndex: index + 1 
      });
    });
    
    console.log(`🏢 Found ${Object.keys(groupedData).length} unique companies`);
    
    // 3. Generate SQL statements
    let sqlStatements = [];
    let clientsCreated = 0;
    let sitesCreated = 0;
    let moraleCount = 0;
    let physiqueCount = 0;
    
    sqlStatements.push('-- Excel Import SQL Statements');
    sqlStatements.push('-- Generated on: ' + new Date().toISOString());
    sqlStatements.push('-- Client Type Classification: ONG, Ste, ASBL = MORALE; Others = PHYSIQUE');
    sqlStatements.push('');
    
    // Process each company group
    for (const [normalizedName, records] of Object.entries(groupedData)) {
      console.log(`🔄 Processing company: ${normalizedName} (${records.length} records)`);
      
      const firstRecord = records[0];
      const clientId = crypto.randomUUID();
      const clientType = getClientType(firstRecord.originalCompanyName);
      
      if (clientType === 'MORALE') {
        moraleCount++;
      } else {
        physiqueCount++;
      }
      
      // Generate client insert statement
      const clientData = {
        id: clientId,
        type_client: clientType,
        nom_entreprise: firstRecord.originalCompanyName,
        nif: null,
        contact_nom: cleanTextForSQL(firstRecord['nameRepCustomer']),
        telephone: cleanTextForSQL(firstRecord['phoneCustomer']),
        contact_email: cleanTextForSQL(firstRecord['emailCustomer']),
        adresse_facturation: cleanTextForSQL(firstRecord['addressCustomer']),
        devise_preferee: 'USD',
        statut: 'ACTIF'
      };
      
      sqlStatements.push(`-- Client: ${clientData.nom_entreprise} (${clientType})`);
      sqlStatements.push(`INSERT OR IGNORE INTO clients_gas (`);
      sqlStatements.push(`  id, type_client, nom_entreprise, nif, contact_nom, telephone,`);
      sqlStatements.push(`  contact_email, adresse_facturation, devise_preferee, statut`);
      sqlStatements.push(`) VALUES (`);
      sqlStatements.push(`  '${clientData.id}',`);
      sqlStatements.push(`  '${clientData.type_client}',`);
      sqlStatements.push(`  '${clientData.nom_entreprise}',`);
      sqlStatements.push(`  ${clientData.nif ? `'${clientData.nif}'` : 'NULL'},`);
      sqlStatements.push(`  ${clientData.contact_nom ? `'${clientData.contact_nom}'` : 'NULL'},`);
      sqlStatements.push(`  ${clientData.telephone ? `'${clientData.telephone}'` : 'NULL'},`);
      sqlStatements.push(`  ${clientData.contact_email ? `'${clientData.contact_email}'` : 'NULL'},`);
      sqlStatements.push(`  ${clientData.adresse_facturation ? `'${clientData.adresse_facturation}'` : 'NULL'},`);
      sqlStatements.push(`  '${clientData.devise_preferee}',`);
      sqlStatements.push(`  '${clientData.statut}'`);
      sqlStatements.push(`);`);
      sqlStatements.push('');
      
      clientsCreated++;
      
      // Generate site insert statements for all records
      for (const record of records) {
        const siteId = crypto.randomUUID();
        const siteName = cleanTextForSQL(record['siteCodeName'] || `${record.originalCompanyName} - Site ${record.rowIndex}`);
        
        const siteData = {
          id: siteId,
          client_id: clientId,
          nom_site: siteName,
          adresse_physique: cleanTextForSQL(record['addressCustomer']),
          effectif_jour_requis: parseInt(record['agents'] || '1') || 1,
          effectif_nuit_requis: 0,
          tarif_mensuel_client: parseFloat(record['totalPrice'] || '0') || 0,
          cout_unitaire_garde: parseFloat(record['unitPrice'] || '0') || 0,
          est_actif: 1
        };
        
        sqlStatements.push(`-- Site: ${siteData.nom_site}`);
        sqlStatements.push(`INSERT INTO sites_gas (`);
        sqlStatements.push(`  id, client_id, nom_site, adresse_physique, effectif_jour_requis,`);
        sqlStatements.push(`  effectif_nuit_requis, tarif_mensuel_client, cout_unitaire_garde, est_actif`);
        sqlStatements.push(`) VALUES (`);
        sqlStatements.push(`  '${siteData.id}',`);
        sqlStatements.push(`  '${siteData.client_id}',`);
        sqlStatements.push(`  '${siteData.nom_site}',`);
        sqlStatements.push(`  ${siteData.adresse_physique ? `'${siteData.adresse_physique}'` : 'NULL'},`);
        sqlStatements.push(`  ${siteData.effectif_jour_requis},`);
        sqlStatements.push(`  ${siteData.effectif_nuit_requis},`);
        sqlStatements.push(`  ${siteData.tarif_mensuel_client},`);
        sqlStatements.push(`  ${siteData.cout_unitaire_garde},`);
        sqlStatements.push(`  ${siteData.est_actif}`);
        sqlStatements.push(`);`);
        sqlStatements.push('');
        
        sitesCreated++;
      }
    }
    
    // Add summary comment
    sqlStatements.push('-- Import Summary:');
    sqlStatements.push(`-- Clients to create: ${clientsCreated}`);
    sqlStatements.push(`-- Sites to create: ${sitesCreated}`);
    sqlStatements.push(`-- Total rows processed: ${data.length}`);
    sqlStatements.push(`-- Client Types: ${moraleCount} MORALE (companies), ${physiqueCount} PHYSIQUE (individuals)`);
    
    // Write SQL file
    const sqlContent = sqlStatements.join('\n');
    const sqlFilePath = path.join(__dirname, 'import-customers.sql');
    fs.writeFileSync(sqlFilePath, sqlContent, 'utf8');
    
    console.log(`\n✅ SQL file generated successfully!`);
    console.log(`📁 File saved to: ${sqlFilePath}`);
    console.log(`📊 Results:`);
    console.log(`   • Clients to create: ${clientsCreated}`);
    console.log(`   • Sites to create: ${sitesCreated}`);
    console.log(`   • Total rows processed: ${data.length}`);
    console.log(`   • Client Types:`);
    console.log(`     - MORALE (companies): ${moraleCount}`);
    console.log(`     - PHYSIQUE (individuals): ${physiqueCount}`);
    console.log(`\n📋 Next steps:`);
    console.log(`   1. Review the generated SQL file: import-customers.sql`);
    console.log(`   2. Execute the SQL statements in your database`);
    
    return {
      success: true,
      clientsCreated,
      sitesCreated,
      totalProcessed: data.length,
      moraleCount,
      physiqueCount,
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
generateImportSQL()
  .then(result => {
    if (result.success) {
      console.log('\n🎉 SQL generation completed successfully!');
    } else {
      console.log('\n💥 SQL generation failed:', result.error);
    }
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });