const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const Database = require('better-sqlite3');
const crypto = require('crypto');

let mainWindow;
let db;

// Hash password using crypto
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Initialize SQLite database
function initDatabase() {
  const dbPath = isDev 
    ? path.join(__dirname, '..', 'database.sqlite')
    : path.join(process.resourcesPath, 'database.sqlite');
  
  db = new Database(dbPath);
  
  // Create tables
  createTables();
  
  console.log('Database initialized at:', dbPath);
}

function createTables() {
  // Employees table
  db.exec(`
    CREATE TABLE IF NOT EXISTS employees (
      id TEXT PRIMARY KEY,
      employee_number TEXT UNIQUE NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      date_of_birth TEXT,
      national_id TEXT,
      address_street TEXT,
      address_city TEXT,
      address_state TEXT,
      address_zip_code TEXT,
      emergency_contact_name TEXT,
      emergency_contact_relationship TEXT,
      emergency_contact_phone TEXT,
      photo TEXT,
      date_hired TEXT NOT NULL,
      position TEXT NOT NULL,
      department TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      salary REAL,
      bank_name TEXT,
      account_number TEXT,
      routing_number TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Clients table
  db.exec(`
    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      primary_contact TEXT,
      email TEXT,
      phone TEXT,
      address_street TEXT,
      address_city TEXT,
      address_state TEXT,
      address_zip_code TEXT,
      contract_start_date TEXT,
      contract_end_date TEXT,
      service_level TEXT,
      hourly_rate REAL,
      billing_cycle TEXT,
      payment_terms TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      total_value REAL,
      created_date TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Sites table
  db.exec(`
    CREATE TABLE IF NOT EXISTS sites (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      client_id TEXT NOT NULL,
      address TEXT,
      city TEXT,
      state TEXT,
      zip_code TEXT,
      latitude REAL,
      longitude REAL,
      site_type TEXT,
      size TEXT,
      access_points TEXT,
      special_instructions TEXT,
      emergency_procedures TEXT,
      guards_required INTEGER,
      shift_pattern TEXT,
      special_equipment TEXT,
      certification_required TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients (id)
    )
  `);

  // Certifications table
  db.exec(`
    CREATE TABLE IF NOT EXISTS certifications (
      id TEXT PRIMARY KEY,
      employee_id TEXT NOT NULL,
      name TEXT NOT NULL,
      issue_date TEXT,
      expiry_date TEXT,
      issuing_authority TEXT,
      certificate_number TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      document_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (employee_id) REFERENCES employees (id)
    )
  `);

  // Site assignments table
  db.exec(`
    CREATE TABLE IF NOT EXISTS site_assignments (
      id TEXT PRIMARY KEY,
      site_id TEXT NOT NULL,
      employee_id TEXT NOT NULL,
      assigned_date TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (site_id) REFERENCES sites (id),
      FOREIGN KEY (employee_id) REFERENCES employees (id)
    )
  `);

  // Attendance records table
  db.exec(`
    CREATE TABLE IF NOT EXISTS attendance_records (
      id TEXT PRIMARY KEY,
      employee_id TEXT NOT NULL,
      date TEXT NOT NULL,
      clock_in TEXT,
      clock_out TEXT,
      status TEXT NOT NULL,
      hours_worked REAL,
      site_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (employee_id) REFERENCES employees (id),
      FOREIGN KEY (site_id) REFERENCES sites (id)
    )
  `);

  // ============================================================================
  // GUARDIAN COMMAND - Tables GAS (Conformes au schéma SQL OHADA)
  // ============================================================================

  // Clients GAS (Tiers contractuels)
  db.exec(`
    CREATE TABLE IF NOT EXISTS clients_gas (
      id TEXT PRIMARY KEY,
      type_client TEXT NOT NULL DEFAULT 'MORALE',
      nom_entreprise TEXT NOT NULL,
      nif TEXT,
      rccm TEXT,
      id_national TEXT,
      numero_contrat TEXT,
      contrat_url TEXT,
      contact_nom TEXT,
      contact_email TEXT,
      telephone TEXT,
      contact_urgence_nom TEXT,
      contact_urgence_telephone TEXT,
      adresse_facturation TEXT,
      devise_preferee TEXT NOT NULL DEFAULT 'USD',
      delai_paiement_jours INTEGER NOT NULL DEFAULT 30,
      est_actif INTEGER NOT NULL DEFAULT 1,
      cree_le DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Add est_actif column to existing clients_gas table if it doesn't exist
  try {
    db.exec(`ALTER TABLE clients_gas ADD COLUMN est_actif INTEGER NOT NULL DEFAULT 1`);
    console.log('✅ Added est_actif column to clients_gas table');
  } catch (error) {
    if (error.message.includes('duplicate column name')) {
      console.log('✅ est_actif column already exists in clients_gas table');
    } else {
      console.log('⚠️ Error adding est_actif column to clients_gas:', error.message);
    }
  }

  // Sites GAS (Lieux physiques sécurisés)
  db.exec(`
    CREATE TABLE IF NOT EXISTS sites_gas (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL,
      nom_site TEXT NOT NULL,
      adresse_physique TEXT,
      latitude REAL,
      longitude REAL,
      effectif_jour_requis INTEGER NOT NULL DEFAULT 0,
      effectif_nuit_requis INTEGER NOT NULL DEFAULT 0,
      cout_unitaire_garde REAL NOT NULL DEFAULT 0,
      tarif_mensuel_client REAL NOT NULL DEFAULT 0,
      consignes_specifiques TEXT,
      est_actif INTEGER NOT NULL DEFAULT 1,
      cree_le DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients_gas (id)
    )
  `);
  
  // Add cout_unitaire_garde column to sites_gas if it doesn't exist (migration)
  try {
    db.exec(`ALTER TABLE sites_gas ADD COLUMN cout_unitaire_garde REAL NOT NULL DEFAULT 0`);
  } catch (e) {
    // Column already exists, ignore
  }

  // Add modifie_le column to clients_gas if it doesn't exist (migration)
  try {
    db.exec(`ALTER TABLE clients_gas ADD COLUMN modifie_le DATETIME DEFAULT CURRENT_TIMESTAMP`);
  } catch (e) {
    // Column already exists, ignore
  }

  // Add modifie_le column to sites_gas if it doesn't exist (migration)
  try {
    db.exec(`ALTER TABLE sites_gas ADD COLUMN modifie_le DATETIME DEFAULT CURRENT_TIMESTAMP`);
  } catch (e) {
    // Column already exists, ignore
  }

  // Add statut column to clients_gas if it doesn't exist (migration)
  try {
    db.exec(`ALTER TABLE clients_gas ADD COLUMN statut TEXT DEFAULT 'ACTIF'`);
  } catch (e) {
    // Column already exists, ignore
  }

  // Add jour_semaine column to affectations_roteur if it doesn't exist (migration)
  try {
    db.exec(`ALTER TABLE affectations_roteur ADD COLUMN jour_semaine TEXT CHECK(jour_semaine IN ('LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI'))`);
  } catch (e) {
    // Column already exists, ignore
  }

  // Add arrieres column to bulletins_paie if it doesn't exist (migration)
  try {
    db.exec(`ALTER TABLE bulletins_paie ADD COLUMN arrieres REAL DEFAULT 0`);
  } catch (e) {
    // Column already exists, ignore
  }

  // Factures Clients GAS (Comptabilité OHADA)
  db.exec(`
    CREATE TABLE IF NOT EXISTS factures_clients (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL,
      numero_facture TEXT UNIQUE NOT NULL,
      date_emission TEXT NOT NULL,
      date_echeance TEXT,
      periode_mois INTEGER,
      periode_annee INTEGER,
      total_gardiens_factures INTEGER NOT NULL DEFAULT 0,
      montant_ht_prestation REAL NOT NULL DEFAULT 0,
      montant_frais_supp REAL NOT NULL DEFAULT 0,
      motif_frais_supp TEXT,
      creances_anterieures REAL NOT NULL DEFAULT 0,
      montant_total_ttc REAL NOT NULL DEFAULT 0,
      montant_total_du_client REAL NOT NULL DEFAULT 0,
      devise TEXT NOT NULL DEFAULT 'USD',
      statut_paiement TEXT NOT NULL DEFAULT 'BROUILLON',
      notes_facture TEXT,
      cree_le DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients_gas (id)
    )
  `);

  // Détails Factures (Lignes par site)
  db.exec(`
    CREATE TABLE IF NOT EXISTS factures_details (
      id TEXT PRIMARY KEY,
      facture_id TEXT NOT NULL,
      site_id TEXT NOT NULL,
      nombre_gardiens_site INTEGER NOT NULL DEFAULT 0,
      montant_forfaitaire_site REAL NOT NULL DEFAULT 0,
      description_ligne TEXT,
      FOREIGN KEY (facture_id) REFERENCES factures_clients (id),
      FOREIGN KEY (site_id) REFERENCES sites_gas (id)
    )
  `);

  // Paiements (Encaissements clients)
  db.exec(`
    CREATE TABLE IF NOT EXISTS paiements (
      id TEXT PRIMARY KEY,
      facture_id TEXT NOT NULL,
      date_paiement TEXT NOT NULL,
      montant_paye REAL NOT NULL DEFAULT 0,
      devise TEXT NOT NULL DEFAULT 'USD',
      mode_paiement TEXT NOT NULL DEFAULT 'ESPECES',
      reference_paiement TEXT,
      banque_origine TEXT,
      notes TEXT,
      cree_le DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (facture_id) REFERENCES factures_clients (id)
    )
  `);

  console.log('Database tables created successfully');

  // ============================================================================
  // HR, OPERATIONS, INVENTORY & DISCIPLINARY MODULE TABLES
  // ============================================================================
  createHROperationsTables();
}

function createHROperationsTables() {
  // Enhanced Employees GAS table
  db.exec(`
    CREATE TABLE IF NOT EXISTS employees_gas (
      id TEXT PRIMARY KEY,
      matricule TEXT UNIQUE NOT NULL,
      nom_complet TEXT NOT NULL,
      date_naissance TEXT,
      genre TEXT CHECK(genre IN ('M', 'F')),
      etat_civil TEXT CHECK(etat_civil IN ('CELIBATAIRE', 'MARIE', 'DIVORCE', 'VEUF')),
      numero_id_national TEXT,
      telephone TEXT,
      email TEXT,
      adresse TEXT,
      photo_url TEXT,
      document_id_url TEXT,
      document_cv_url TEXT,
      document_casier_url TEXT,
      date_embauche TEXT NOT NULL,
      categorie TEXT CHECK(categorie IN ('GARDE', 'ADMINISTRATION')) DEFAULT 'GARDE',
      poste TEXT CHECK(poste IN ('GARDE', 'ROTEUR', 'DIRECTEUR_GERANT', 'ADMINISTRATEUR_GERANT', 'FINANCIER', 'COMPTABLE', 'CHEF_OPERATIONS', 'SUPERVISEUR', 'CHAUFFEUR')) DEFAULT 'GARDE',
      site_affecte_id TEXT REFERENCES sites_gas(id),
      mode_remuneration TEXT CHECK(mode_remuneration IN ('MENSUEL', 'JOURNALIER')) DEFAULT 'MENSUEL',
      salaire_base REAL DEFAULT 0,
      taux_journalier REAL DEFAULT 0,
      banque_nom TEXT,
      banque_compte TEXT,
      statut TEXT CHECK(statut IN ('ACTIF', 'INACTIF', 'SUSPENDU', 'TERMINE')) DEFAULT 'ACTIF',
      date_fin_contrat TEXT,
      motif_fin TEXT,
      cree_le TEXT DEFAULT CURRENT_TIMESTAMP,
      modifie_le TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Guard Deployment History
  db.exec(`
    CREATE TABLE IF NOT EXISTS historique_deployements (
      id TEXT PRIMARY KEY,
      employe_id TEXT NOT NULL REFERENCES employees_gas(id),
      site_id TEXT NOT NULL REFERENCES sites_gas(id),
      date_debut TEXT NOT NULL,
      date_fin TEXT,
      poste TEXT CHECK(poste IN ('JOUR', 'NUIT', 'MIXTE')) DEFAULT 'JOUR',
      motif_affectation TEXT CHECK(motif_affectation IN ('EMBAUCHE', 'TRANSFERT', 'REMPLACEMENT', 'ROTATION', 'DEMANDE_EMPLOYE', 'DEMANDE_CLIENT', 'DISCIPLINAIRE', 'REORGANISATION', 'FIN_CONTRAT_SITE', 'AUTRE')) DEFAULT 'EMBAUCHE',
      notes TEXT,
      est_actif INTEGER DEFAULT 1,
      cree_par TEXT,
      cree_le TEXT DEFAULT CURRENT_TIMESTAMP,
      modifie_le TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Leave Provisions
  db.exec(`
    CREATE TABLE IF NOT EXISTS conges_provisions (
      id TEXT PRIMARY KEY,
      employe_id TEXT NOT NULL REFERENCES employees_gas(id),
      annee INTEGER NOT NULL,
      jours_acquis REAL DEFAULT 0,
      jours_pris REAL DEFAULT 0,
      provision_montant REAL DEFAULT 0,
      cree_le TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(employe_id, annee)
    )
  `);

  // Leave Requests
  db.exec(`
    CREATE TABLE IF NOT EXISTS demandes_conge (
      id TEXT PRIMARY KEY,
      employe_id TEXT NOT NULL REFERENCES employees_gas(id),
      type_conge TEXT CHECK(type_conge IN ('ANNUEL', 'MALADIE', 'MATERNITE', 'PATERNITE', 'SANS_SOLDE')) NOT NULL,
      date_debut TEXT NOT NULL,
      date_fin TEXT NOT NULL,
      nombre_jours REAL NOT NULL,
      motif TEXT,
      statut TEXT CHECK(statut IN ('EN_ATTENTE', 'APPROUVE', 'REFUSE', 'ANNULE')) DEFAULT 'EN_ATTENTE',
      approuve_par TEXT,
      date_approbation TEXT,
      notes_approbation TEXT,
      roteur_remplacant_id TEXT REFERENCES employees_gas(id),
      cree_le TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Rôteur Assignments
  db.exec(`
    CREATE TABLE IF NOT EXISTS affectations_roteur (
      id TEXT PRIMARY KEY,
      roteur_id TEXT NOT NULL REFERENCES employees_gas(id),
      site_id TEXT NOT NULL REFERENCES sites_gas(id),
      jour_semaine TEXT CHECK(jour_semaine IN ('LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI')),
      date_debut TEXT NOT NULL,
      date_fin TEXT NOT NULL,
      poste TEXT CHECK(poste IN ('JOUR', 'NUIT')) DEFAULT 'JOUR',
      statut TEXT CHECK(statut IN ('PLANIFIE', 'EN_COURS', 'TERMINE', 'ANNULE')) DEFAULT 'PLANIFIE',
      notes TEXT,
      weekly_assignments TEXT,
      cree_le TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Add weekly_assignments column if it doesn't exist (for existing databases)
  try {
    db.exec(`ALTER TABLE affectations_roteur ADD COLUMN weekly_assignments TEXT`);
  } catch (e) {
    // Column already exists, ignore
  }

  // Add roteur_sites column to historique_deployements if it doesn't exist (migration)
  try {
    db.exec(`ALTER TABLE historique_deployements ADD COLUMN roteur_sites TEXT`);
  } catch (e) {
    // Column already exists, ignore
  }

  // Update motif_affectation CHECK constraint to include ROTATION and other missing values
  try {
    // Check if we need to update the constraint by testing if ROTATION is allowed
    const testStmt = db.prepare(`INSERT INTO historique_deployements (id, employe_id, site_id, date_debut, motif_affectation) VALUES (?, ?, ?, ?, ?)`);
    try {
      testStmt.run('test-rotation-constraint', 'test-emp', 'test-site', '2024-01-01', 'ROTATION');
      // If we get here, ROTATION is already allowed, clean up the test record
      db.exec(`DELETE FROM historique_deployements WHERE id = 'test-rotation-constraint'`);
      console.log('✅ motif_affectation constraint already supports ROTATION');
    } catch (constraintError) {
      if (constraintError.message.includes('CHECK constraint failed')) {
        console.log('🔧 Updating motif_affectation constraint to support ROTATION...');
        
        // Create new table with updated constraint
        db.exec(`
          CREATE TABLE historique_deployements_new (
            id TEXT PRIMARY KEY,
            employe_id TEXT NOT NULL REFERENCES employees_gas(id),
            site_id TEXT NOT NULL REFERENCES sites_gas(id),
            date_debut TEXT NOT NULL,
            date_fin TEXT,
            poste TEXT CHECK(poste IN ('JOUR', 'NUIT', 'MIXTE')) DEFAULT 'JOUR',
            motif_affectation TEXT CHECK(motif_affectation IN ('EMBAUCHE', 'TRANSFERT', 'REMPLACEMENT', 'ROTATION', 'DEMANDE_EMPLOYE', 'DEMANDE_CLIENT', 'DISCIPLINAIRE', 'REORGANISATION', 'FIN_CONTRAT_SITE', 'AUTRE')) DEFAULT 'EMBAUCHE',
            notes TEXT,
            est_actif INTEGER DEFAULT 1,
            cree_par TEXT,
            cree_le TEXT DEFAULT CURRENT_TIMESTAMP,
            modifie_le TEXT DEFAULT CURRENT_TIMESTAMP,
            roteur_sites TEXT
          )
        `);
        
        // Copy data from old table
        db.exec(`
          INSERT INTO historique_deployements_new 
          SELECT id, employe_id, site_id, date_debut, date_fin, poste, motif_affectation, notes, est_actif, cree_par, cree_le, modifie_le, roteur_sites
          FROM historique_deployements
        `);
        
        // Drop old table and rename new one
        db.exec(`DROP TABLE historique_deployements`);
        db.exec(`ALTER TABLE historique_deployements_new RENAME TO historique_deployements`);
        
        console.log('✅ motif_affectation constraint updated successfully');
      } else {
        throw constraintError;
      }
    }
  } catch (e) {
    console.log('⚠️ Error updating motif_affectation constraint:', e.message);
  }
  
  // Make jour_semaine nullable for weekly assignments (for existing databases)
  try {
    // SQLite doesn't support ALTER COLUMN, so we'll handle this in the application logic
    console.log('Note: jour_semaine field is now optional for weekly assignments');
  } catch (e) {
    // Ignore
  }

  // Fleet Vehicles
  db.exec(`
    CREATE TABLE IF NOT EXISTS vehicules_flotte (
      id TEXT PRIMARY KEY,
      type_vehicule TEXT CHECK(type_vehicule IN ('VOITURE', 'MOTO', 'CAMIONNETTE')) NOT NULL,
      marque TEXT NOT NULL,
      modele TEXT,
      immatriculation TEXT UNIQUE NOT NULL,
      numero_chassis TEXT,
      annee_fabrication INTEGER,
      couleur TEXT,
      employe_responsable_id TEXT REFERENCES employees_gas(id),
      date_affectation TEXT,
      assurance_compagnie TEXT,
      assurance_numero_police TEXT,
      assurance_date_debut TEXT,
      assurance_date_fin TEXT,
      controle_technique_date TEXT,
      controle_technique_expiration TEXT,
      vignette_annee INTEGER,
      vignette_montant REAL,
      taxe_voirie_annee INTEGER,
      taxe_voirie_montant REAL,
      statut TEXT CHECK(statut IN ('ACTIF', 'EN_REPARATION', 'HORS_SERVICE')) DEFAULT 'ACTIF',
      kilometrage_actuel INTEGER DEFAULT 0,
      cree_le TEXT DEFAULT CURRENT_TIMESTAMP,
      modifie_le TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Fuel Consumption
  db.exec(`
    CREATE TABLE IF NOT EXISTS consommation_carburant (
      id TEXT PRIMARY KEY,
      vehicule_id TEXT NOT NULL REFERENCES vehicules_flotte(id),
      date_plein TEXT NOT NULL,
      quantite_litres REAL NOT NULL,
      prix_unitaire REAL NOT NULL,
      montant_total REAL NOT NULL,
      kilometrage INTEGER,
      station TEXT,
      conducteur_id TEXT REFERENCES employees_gas(id),
      depense_id TEXT REFERENCES depenses(id),
      notes TEXT,
      cree_le TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Vehicle Repairs/Maintenance
  db.exec(`
    CREATE TABLE IF NOT EXISTS reparations_vehicules (
      id TEXT PRIMARY KEY,
      vehicule_id TEXT NOT NULL REFERENCES vehicules_flotte(id),
      date_reparation TEXT NOT NULL,
      type_reparation TEXT CHECK(type_reparation IN ('ENTRETIEN', 'REPARATION', 'REVISION', 'PNEUS', 'FREINS', 'MOTEUR', 'CARROSSERIE', 'AUTRE')) NOT NULL,
      description TEXT NOT NULL,
      garage TEXT,
      cout_main_oeuvre REAL DEFAULT 0,
      cout_pieces REAL DEFAULT 0,
      montant_total REAL NOT NULL,
      kilometrage INTEGER,
      prochaine_revision_km INTEGER,
      prochaine_revision_date TEXT,
      depense_id TEXT REFERENCES depenses(id),
      notes TEXT,
      cree_le TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Equipment Registry
  db.exec(`
    CREATE TABLE IF NOT EXISTS equipements (
      id TEXT PRIMARY KEY,
      code_equipement TEXT UNIQUE NOT NULL,
      qr_code TEXT UNIQUE,
      categorie TEXT CHECK(categorie IN ('UNIFORME', 'RADIO', 'TORCHE', 'PR24', 'AUTRE')) NOT NULL,
      designation TEXT NOT NULL,
      description TEXT,
      numero_serie TEXT,
      date_acquisition TEXT,
      cout_acquisition REAL,
      etat TEXT CHECK(etat IN ('NEUF', 'BON', 'USAGE', 'ENDOMMAGE', 'PERDU')) DEFAULT 'NEUF',
      statut TEXT CHECK(statut IN ('DISPONIBLE', 'AFFECTE', 'EN_REPARATION', 'RETIRE')) DEFAULT 'DISPONIBLE',
      cree_le TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Equipment Assignments
  db.exec(`
    CREATE TABLE IF NOT EXISTS affectations_equipement (
      id TEXT PRIMARY KEY,
      equipement_id TEXT NOT NULL REFERENCES equipements(id),
      employe_id TEXT NOT NULL REFERENCES employees_gas(id),
      date_affectation TEXT NOT NULL,
      signature_affectation TEXT,
      date_retour TEXT,
      signature_retour TEXT,
      etat_retour TEXT CHECK(etat_retour IN ('BON', 'USAGE', 'ENDOMMAGE', 'PERDU')),
      notes TEXT,
      cree_le TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Disciplinary Actions
  db.exec(`
    CREATE TABLE IF NOT EXISTS actions_disciplinaires (
      id TEXT PRIMARY KEY,
      employe_id TEXT NOT NULL REFERENCES employees_gas(id),
      type_action TEXT CHECK(type_action IN ('AVERTISSEMENT_VERBAL', 'AVERTISSEMENT_ECRIT', 'SUSPENSION', 'LICENCIEMENT')) NOT NULL,
      date_incident TEXT NOT NULL,
      description_incident TEXT NOT NULL,
      lieu_incident TEXT,
      temoins TEXT,
      impact_financier INTEGER DEFAULT 0,
      montant_deduction REAL DEFAULT 0,
      jours_suspension INTEGER DEFAULT 0,
      statut TEXT CHECK(statut IN ('BROUILLON', 'EN_ATTENTE_SIGNATURE', 'EN_ATTENTE_VALIDATION', 'VALIDE', 'REJETE')) DEFAULT 'BROUILLON',
      signature_employe TEXT,
      date_signature_employe TEXT,
      commentaire_employe TEXT,
      valide_par TEXT,
      date_validation TEXT,
      commentaire_validation TEXT,
      periode_paie_mois INTEGER,
      periode_paie_annee INTEGER,
      applique_paie INTEGER DEFAULT 0,
      deduction_id TEXT,
      payment_schedule TEXT,
      installments INTEGER DEFAULT 1,
      cree_par TEXT,
      cree_le TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Add new columns to actions_disciplinaires if they don't exist
  try {
    db.exec(`ALTER TABLE actions_disciplinaires ADD COLUMN deduction_id TEXT`);
  } catch (e) {
    // Column already exists, ignore
  }
  try {
    db.exec(`ALTER TABLE actions_disciplinaires ADD COLUMN payment_schedule TEXT`);
  } catch (e) {
    // Column already exists, ignore
  }
  try {
    db.exec(`ALTER TABLE actions_disciplinaires ADD COLUMN installments INTEGER DEFAULT 1`);
  } catch (e) {
    // Column already exists, ignore
  }

  // System Alerts
  db.exec(`
    CREATE TABLE IF NOT EXISTS alertes_systeme (
      id TEXT PRIMARY KEY,
      type_alerte TEXT CHECK(type_alerte IN ('ASSURANCE', 'CONTROLE_TECHNIQUE', 'CERTIFICATION', 'CONGE', 'AUTRE')) NOT NULL,
      reference_type TEXT NOT NULL,
      reference_id TEXT NOT NULL,
      titre TEXT NOT NULL,
      message TEXT NOT NULL,
      date_echeance TEXT,
      priorite TEXT CHECK(priorite IN ('BASSE', 'MOYENNE', 'HAUTE', 'CRITIQUE')) DEFAULT 'MOYENNE',
      statut TEXT CHECK(statut IN ('ACTIVE', 'ACQUITTEE', 'EXPIREE')) DEFAULT 'ACTIVE',
      acquittee_par TEXT,
      date_acquittement TEXT,
      cree_le TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // ============================================================================
  // PAYROLL MODULE TABLES
  // ============================================================================

  // Payroll Periods
  db.exec(`
    CREATE TABLE IF NOT EXISTS periodes_paie (
      id TEXT PRIMARY KEY,
      mois INTEGER NOT NULL CHECK(mois BETWEEN 1 AND 12),
      annee INTEGER NOT NULL,
      statut TEXT NOT NULL DEFAULT 'BROUILLON' CHECK(statut IN ('BROUILLON', 'CALCULEE', 'VALIDEE', 'VERROUILLEE')),
      date_calcul TEXT,
      calculee_par TEXT,
      date_validation TEXT,
      validee_par TEXT,
      date_verrouillage TEXT,
      verrouillee_par TEXT,
      notes TEXT,
      cree_le TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(mois, annee)
    )
  `);

  // Payslips
  db.exec(`
    CREATE TABLE IF NOT EXISTS bulletins_paie (
      id TEXT PRIMARY KEY,
      periode_paie_id TEXT NOT NULL,
      employe_id TEXT NOT NULL,
      matricule TEXT,
      nom_complet TEXT,
      categorie TEXT,
      mode_remuneration TEXT,
      salaire_base REAL NOT NULL DEFAULT 0,
      jours_travailles INTEGER DEFAULT 0,
      taux_journalier REAL DEFAULT 0,
      primes REAL DEFAULT 0,
      arrieres REAL DEFAULT 0,
      salaire_brut REAL NOT NULL DEFAULT 0,
      cnss REAL DEFAULT 0,
      onem REAL DEFAULT 0,
      inpp REAL DEFAULT 0,
      total_retenues_sociales REAL DEFAULT 0,
      salaire_imposable REAL DEFAULT 0,
      ipr REAL DEFAULT 0,
      retenues_disciplinaires REAL DEFAULT 0,
      avances REAL DEFAULT 0,
      autres_retenues REAL DEFAULT 0,
      deductions_disciplinaires REAL DEFAULT 0,
      deductions_uniformes REAL DEFAULT 0,
      deductions_contributions REAL DEFAULT 0,
      deductions_autres REAL DEFAULT 0,
      total_deductions_detail REAL DEFAULT 0,
      total_retenues REAL DEFAULT 0,
      salaire_net REAL NOT NULL DEFAULT 0,
      devise TEXT DEFAULT 'USD' CHECK(devise IN ('USD', 'CDF')),
      statut TEXT DEFAULT 'BROUILLON' CHECK(statut IN ('BROUILLON', 'VALIDE', 'PAYE')),
      date_paiement TEXT,
      mode_paiement TEXT,
      reference_paiement TEXT,
      cree_le TEXT DEFAULT CURRENT_TIMESTAMP,
      modifie_le TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (periode_paie_id) REFERENCES periodes_paie(id) ON DELETE CASCADE,
      FOREIGN KEY (employe_id) REFERENCES employees_gas(id) ON DELETE CASCADE,
      UNIQUE(periode_paie_id, employe_id)
    )
  `);

  // Add detailed deduction columns to bulletins_paie if they don't exist
  try {
    db.exec(`ALTER TABLE bulletins_paie ADD COLUMN deductions_disciplinaires REAL DEFAULT 0`);
  } catch (e) {
    // Column already exists, ignore
  }
  try {
    db.exec(`ALTER TABLE bulletins_paie ADD COLUMN deductions_uniformes REAL DEFAULT 0`);
  } catch (e) {
    // Column already exists, ignore
  }
  try {
    db.exec(`ALTER TABLE bulletins_paie ADD COLUMN deductions_contributions REAL DEFAULT 0`);
  } catch (e) {
    // Column already exists, ignore
  }
  try {
    db.exec(`ALTER TABLE bulletins_paie ADD COLUMN deductions_autres REAL DEFAULT 0`);
  } catch (e) {
    // Column already exists, ignore
  }
  try {
    db.exec(`ALTER TABLE bulletins_paie ADD COLUMN total_deductions_detail REAL DEFAULT 0`);
  } catch (e) {
    // Column already exists, ignore
  }

  // Employee Advances
  db.exec(`
    CREATE TABLE IF NOT EXISTS avances_employes (
      id TEXT PRIMARY KEY,
      employe_id TEXT NOT NULL,
      date_avance TEXT NOT NULL,
      montant_total REAL NOT NULL,
      montant_rembourse REAL DEFAULT 0,
      montant_restant REAL NOT NULL,
      nombre_mensualites INTEGER NOT NULL,
      mensualite_montant REAL NOT NULL,
      statut TEXT DEFAULT 'EN_COURS' CHECK(statut IN ('EN_COURS', 'REMBOURSE', 'ANNULE')),
      notes TEXT,
      cree_par TEXT,
      cree_le TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (employe_id) REFERENCES employees_gas(id) ON DELETE CASCADE
    )
  `);

  // Advance Repayments
  db.exec(`
    CREATE TABLE IF NOT EXISTS remboursements_avances (
      id TEXT PRIMARY KEY,
      avance_id TEXT NOT NULL,
      bulletin_paie_id TEXT NOT NULL,
      montant_rembourse REAL NOT NULL,
      date_remboursement TEXT NOT NULL,
      cree_le TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (avance_id) REFERENCES avances_employes(id) ON DELETE CASCADE,
      FOREIGN KEY (bulletin_paie_id) REFERENCES bulletins_paie(id) ON DELETE CASCADE
    )
  `);

  // Users table (Authentication & RBAC)
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      nom_utilisateur TEXT UNIQUE NOT NULL,
      mot_de_passe_hash TEXT NOT NULL,
      nom_complet TEXT NOT NULL,
      email TEXT,
      role TEXT NOT NULL CHECK (role IN ('ADMIN', 'FINANCE_MANAGER', 'OPERATIONS_MANAGER', 'ASSISTANT_OPERATIONS_MANAGER')) DEFAULT 'ASSISTANT_OPERATIONS_MANAGER',
      statut TEXT NOT NULL CHECK (statut IN ('ACTIF', 'SUSPENDU')) DEFAULT 'ACTIF',
      derniere_connexion TEXT,
      cree_le TEXT DEFAULT CURRENT_TIMESTAMP,
      modifie_le TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // User Settings (Quick Actions & Preferences)
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_settings (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      user_role TEXT NOT NULL,
      quick_actions TEXT,
      preferences TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tax Settings (Social & Income Tax Rates)
  db.exec(`
    CREATE TABLE IF NOT EXISTS tax_settings (
      id TEXT PRIMARY KEY,
      setting_name TEXT UNIQUE NOT NULL,
      setting_value TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_by TEXT
    )
  `);

  // ============================================================================
  // OHADA PAYROLL TRACKING - Salaires Impayés & Charges Sociales
  // ============================================================================

  // Compte 422 - Personnel, Rémunérations Dues (Salaires impayés)
  db.exec(`
    CREATE TABLE IF NOT EXISTS salaires_impayes (
      id TEXT PRIMARY KEY,
      bulletin_paie_id TEXT NOT NULL,
      employe_id TEXT NOT NULL,
      periode_paie_id TEXT NOT NULL,
      matricule TEXT,
      nom_complet TEXT,
      montant_net_du REAL NOT NULL,
      montant_paye REAL DEFAULT 0,
      montant_restant REAL NOT NULL,
      devise TEXT DEFAULT 'USD' CHECK(devise IN ('USD', 'CDF')),
      date_echeance TEXT NOT NULL,
      statut TEXT DEFAULT 'IMPAYE' CHECK(statut IN ('IMPAYE', 'PAYE_PARTIEL', 'PAYE_TOTAL')),
      compte_comptable TEXT DEFAULT '4211',
      notes TEXT,
      cree_le TEXT DEFAULT CURRENT_TIMESTAMP,
      modifie_le TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (bulletin_paie_id) REFERENCES bulletins_paie(id) ON DELETE CASCADE,
      FOREIGN KEY (employe_id) REFERENCES employees_gas(id) ON DELETE CASCADE,
      FOREIGN KEY (periode_paie_id) REFERENCES periodes_paie(id) ON DELETE CASCADE
    )
  `);

  // Paiements de Salaires (Historique des paiements partiels/totaux)
  db.exec(`
    CREATE TABLE IF NOT EXISTS paiements_salaires (
      id TEXT PRIMARY KEY,
      salaire_impaye_id TEXT NOT NULL,
      montant_paye REAL NOT NULL,
      devise TEXT DEFAULT 'USD' CHECK(devise IN ('USD', 'CDF')),
      date_paiement TEXT NOT NULL,
      mode_paiement TEXT CHECK(mode_paiement IN ('ESPECES', 'VIREMENT', 'CHEQUE', 'MOBILE_MONEY')),
      reference_paiement TEXT,
      compte_tresorerie_id TEXT,
      effectue_par TEXT,
      notes TEXT,
      cree_le TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (salaire_impaye_id) REFERENCES salaires_impayes(id) ON DELETE CASCADE,
      FOREIGN KEY (compte_tresorerie_id) REFERENCES comptes_tresorerie(id)
    )
  `);

  // Compte 42x - Charges Sociales à Payer
  db.exec(`
    CREATE TABLE IF NOT EXISTS charges_sociales_dues (
      id TEXT PRIMARY KEY,
      periode_paie_id TEXT NOT NULL,
      organisme TEXT NOT NULL CHECK(organisme IN ('CNSS', 'ONEM', 'INPP', 'IPR')),
      montant_du REAL NOT NULL,
      montant_paye REAL DEFAULT 0,
      montant_restant REAL NOT NULL,
      devise TEXT DEFAULT 'USD' CHECK(devise IN ('USD', 'CDF')),
      date_echeance TEXT NOT NULL,
      statut TEXT DEFAULT 'IMPAYE' CHECK(statut IN ('IMPAYE', 'PAYE_PARTIEL', 'PAYE_TOTAL')),
      compte_comptable TEXT NOT NULL,
      mois_reference TEXT NOT NULL,
      annee_reference INTEGER NOT NULL,
      penalites REAL DEFAULT 0,
      notes TEXT,
      cree_le TEXT DEFAULT CURRENT_TIMESTAMP,
      modifie_le TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (periode_paie_id) REFERENCES periodes_paie(id) ON DELETE CASCADE,
      UNIQUE(periode_paie_id, organisme)
    )
  `);

  // Paiements de Charges Sociales
  db.exec(`
    CREATE TABLE IF NOT EXISTS paiements_charges_sociales (
      id TEXT PRIMARY KEY,
      charge_sociale_id TEXT NOT NULL,
      montant_paye REAL NOT NULL,
      devise TEXT DEFAULT 'USD' CHECK(devise IN ('USD', 'CDF')),
      date_paiement TEXT NOT NULL,
      mode_paiement TEXT CHECK(mode_paiement IN ('ESPECES', 'VIREMENT', 'CHEQUE')),
      reference_paiement TEXT,
      numero_bordereau TEXT,
      compte_tresorerie_id TEXT,
      effectue_par TEXT,
      notes TEXT,
      cree_le TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (charge_sociale_id) REFERENCES charges_sociales_dues(id) ON DELETE CASCADE,
      FOREIGN KEY (compte_tresorerie_id) REFERENCES comptes_tresorerie(id)
    )
  `);

  // Écritures Comptables (Journal OHADA)
  db.exec(`
    CREATE TABLE IF NOT EXISTS ecritures_comptables (
      id TEXT PRIMARY KEY,
      date_ecriture TEXT NOT NULL,
      numero_piece TEXT,
      libelle TEXT NOT NULL,
      type_operation TEXT CHECK(type_operation IN ('PAIE', 'PAIEMENT_SALAIRE', 'PAIEMENT_CHARGES', 'DEPENSE', 'RECETTE', 'AUTRE')),
      source_id TEXT,
      montant_total REAL NOT NULL,
      devise TEXT DEFAULT 'USD' CHECK(devise IN ('USD', 'CDF')),
      statut TEXT DEFAULT 'BROUILLON' CHECK(statut IN ('BROUILLON', 'VALIDE', 'CLOTURE')),
      cree_par TEXT,
      valide_par TEXT,
      date_validation TEXT,
      cree_le TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Lignes d'Écritures (Débit/Crédit)
  db.exec(`
    CREATE TABLE IF NOT EXISTS lignes_ecritures (
      id TEXT PRIMARY KEY,
      ecriture_id TEXT NOT NULL,
      compte_comptable TEXT NOT NULL,
      libelle_compte TEXT,
      sens TEXT NOT NULL CHECK(sens IN ('DEBIT', 'CREDIT')),
      montant REAL NOT NULL,
      devise TEXT DEFAULT 'USD' CHECK(devise IN ('USD', 'CDF')),
      tiers_id TEXT,
      tiers_nom TEXT,
      cree_le TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ecriture_id) REFERENCES ecritures_comptables(id) ON DELETE CASCADE
    )
  `);

  // ============================================================================
  // ENHANCED DEDUCTIONS SYSTEM - Multi-Period & Multi-Type Deductions
  // ============================================================================

  // Deduction Types Configuration
  db.exec(`
    CREATE TABLE IF NOT EXISTS deduction_types (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      nom TEXT NOT NULL,
      description TEXT,
      calculation_method TEXT NOT NULL CHECK(calculation_method IN ('FIXED_AMOUNT', 'PERCENTAGE', 'CUSTOM')),
      default_schedule_type TEXT CHECK(default_schedule_type IN ('ONE_TIME', 'INSTALLMENTS', 'RECURRING')),
      max_percentage_salary REAL,
      priority_order INTEGER DEFAULT 100,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Employee Deductions Registry
  db.exec(`
    CREATE TABLE IF NOT EXISTS employee_deductions (
      id TEXT PRIMARY KEY,
      employe_id TEXT NOT NULL,
      deduction_type_id TEXT NOT NULL,
      source_type TEXT CHECK(source_type IN ('DISCIPLINARY', 'MANUAL', 'SYSTEM', 'UNIFORM', 'LOAN', 'CONTRIBUTION')),
      source_id TEXT,
      
      title TEXT NOT NULL,
      total_amount REAL NOT NULL,
      amount_deducted REAL DEFAULT 0,
      amount_remaining REAL NOT NULL,
      
      schedule_type TEXT NOT NULL CHECK(schedule_type IN ('ONE_TIME', 'INSTALLMENTS', 'RECURRING', 'CUSTOM')),
      installment_amount REAL,
      number_of_installments INTEGER,
      installments_completed INTEGER DEFAULT 0,
      
      start_date TEXT NOT NULL,
      end_date TEXT,
      next_deduction_date TEXT,
      
      status TEXT DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'SUSPENDED', 'COMPLETED', 'CANCELLED')),
      max_per_period REAL,
      skip_periods TEXT,
      
      created_by TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      modified_at TEXT DEFAULT CURRENT_TIMESTAMP,
      
      FOREIGN KEY (employe_id) REFERENCES employees_gas(id) ON DELETE CASCADE,
      FOREIGN KEY (deduction_type_id) REFERENCES deduction_types(id)
    )
  `);

  // Custom Payment Schedules
  db.exec(`
    CREATE TABLE IF NOT EXISTS deduction_schedule (
      id TEXT PRIMARY KEY,
      deduction_id TEXT NOT NULL,
      period_year INTEGER NOT NULL,
      period_month INTEGER NOT NULL,
      scheduled_amount REAL NOT NULL,
      actual_amount REAL DEFAULT 0,
      status TEXT DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'APPLIED', 'SKIPPED', 'FAILED')),
      applied_date TEXT,
      bulletin_paie_id TEXT,
      notes TEXT,
      
      FOREIGN KEY (deduction_id) REFERENCES employee_deductions(id) ON DELETE CASCADE,
      FOREIGN KEY (bulletin_paie_id) REFERENCES bulletins_paie(id),
      UNIQUE(deduction_id, period_year, period_month)
    )
  `);

  // Payment History Tracking
  db.exec(`
    CREATE TABLE IF NOT EXISTS deduction_history (
      id TEXT PRIMARY KEY,
      deduction_id TEXT NOT NULL,
      bulletin_paie_id TEXT NOT NULL,
      amount_deducted REAL NOT NULL,
      period_year INTEGER NOT NULL,
      period_month INTEGER NOT NULL,
      deduction_date TEXT NOT NULL,
      status TEXT DEFAULT 'APPLIED' CHECK(status IN ('APPLIED', 'REVERSED', 'ADJUSTED')),
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      
      FOREIGN KEY (deduction_id) REFERENCES employee_deductions(id) ON DELETE CASCADE,
      FOREIGN KEY (bulletin_paie_id) REFERENCES bulletins_paie(id) ON DELETE CASCADE
    )
  `);

  // Initialize default tax settings if not exists
  try {
    const existingSettings = db.prepare('SELECT COUNT(*) as count FROM tax_settings').get();
    console.log('Tax settings count:', existingSettings.count);
    
    if (existingSettings.count === 0) {
      console.log('Initializing default tax settings...');
      const defaultTaxSettings = [
        { id: crypto.randomUUID(), setting_name: 'CNSS_RATE', setting_value: '0.05', description: 'Caisse Nationale de Sécurité Sociale', category: 'SOCIAL' },
        { id: crypto.randomUUID(), setting_name: 'ONEM_RATE', setting_value: '0.015', description: 'Office National de l\'Emploi', category: 'SOCIAL' },
        { id: crypto.randomUUID(), setting_name: 'INPP_RATE', setting_value: '0.005', description: 'Institut National de Préparation Professionnelle', category: 'SOCIAL' },
        { id: crypto.randomUUID(), setting_name: 'IPR_BRACKETS', setting_value: JSON.stringify([
          { min: 0, max: 72000, taux: 0 },
          { min: 72001, max: 144000, taux: 0.03 },
          { min: 144001, max: 288000, taux: 0.05 },
          { min: 288001, max: 576000, taux: 0.10 },
          { min: 576001, max: 1152000, taux: 0.15 },
          { min: 1152001, max: 2304000, taux: 0.20 },
          { min: 2304001, max: 4608000, taux: 0.25 },
          { min: 4608001, max: 9216000, taux: 0.30 },
          { min: 9216001, max: 18432000, taux: 0.35 },
          { min: 18432001, max: 36864000, taux: 0.40 },
          { min: 36864001, max: Infinity, taux: 0.45 }
        ]), description: 'Barème progressif IPR (Impôt Professionnel sur les Rémunérations)', category: 'IPR' }
      ];
      
      const insertTaxSetting = db.prepare(`
        INSERT INTO tax_settings (id, setting_name, setting_value, description, category)
        VALUES (?, ?, ?, ?, ?)
      `);
      
      for (const setting of defaultTaxSettings) {
        try {
          insertTaxSetting.run(setting.id, setting.setting_name, setting.setting_value, setting.description, setting.category);
          console.log(`  ✓ Inserted ${setting.setting_name}`);
        } catch (insertError) {
          console.error(`  ✗ Error inserting ${setting.setting_name}:`, insertError.message);
        }
      }
      
      console.log('Default tax settings initialized successfully');
    } else {
      console.log('Tax settings already initialized');
    }
  } catch (e) {
    console.error('Error initializing tax settings:', e.message);
  }

  // Initialize default deduction types
  try {
    const existingDeductionTypes = db.prepare('SELECT COUNT(*) as count FROM deduction_types').get();
    console.log('Deduction types count:', existingDeductionTypes.count);
    
    if (existingDeductionTypes.count === 0) {
      console.log('Initializing default deduction types...');
      const defaultDeductionTypes = [
        { 
          id: crypto.randomUUID(), 
          code: 'DISCIPLINARY', 
          nom: 'Retenues Disciplinaires', 
          description: 'Déductions liées aux actions disciplinaires',
          calculation_method: 'FIXED_AMOUNT',
          default_schedule_type: 'INSTALLMENTS',
          max_percentage_salary: 0.25,
          priority_order: 10
        },
        { 
          id: crypto.randomUUID(), 
          code: 'UNIFORM', 
          nom: 'Uniformes et Équipements', 
          description: 'Paiements pour uniformes et équipements',
          calculation_method: 'FIXED_AMOUNT',
          default_schedule_type: 'INSTALLMENTS',
          max_percentage_salary: 0.15,
          priority_order: 30
        },
        { 
          id: crypto.randomUUID(), 
          code: 'LOAN', 
          nom: 'Remboursement Avances', 
          description: 'Remboursement des avances et prêts',
          calculation_method: 'FIXED_AMOUNT',
          default_schedule_type: 'INSTALLMENTS',
          max_percentage_salary: 0.30,
          priority_order: 20
        },
        { 
          id: crypto.randomUUID(), 
          code: 'CONTRIBUTION', 
          nom: 'Contributions et Cotisations', 
          description: 'Cotisations syndicales, assurances, etc.',
          calculation_method: 'FIXED_AMOUNT',
          default_schedule_type: 'RECURRING',
          max_percentage_salary: 0.10,
          priority_order: 40
        },
        { 
          id: crypto.randomUUID(), 
          code: 'OTHER', 
          nom: 'Autres Retenues', 
          description: 'Autres types de retenues diverses',
          calculation_method: 'FIXED_AMOUNT',
          default_schedule_type: 'ONE_TIME',
          max_percentage_salary: 0.20,
          priority_order: 50
        }
      ];
      
      const insertDeductionType = db.prepare(`
        INSERT INTO deduction_types (id, code, nom, description, calculation_method, default_schedule_type, max_percentage_salary, priority_order)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      for (const type of defaultDeductionTypes) {
        try {
          insertDeductionType.run(
            type.id, type.code, type.nom, type.description, 
            type.calculation_method, type.default_schedule_type, 
            type.max_percentage_salary, type.priority_order
          );
          console.log(`  ✓ Inserted deduction type: ${type.nom}`);
        } catch (insertError) {
          console.error(`  ✗ Error inserting deduction type ${type.nom}:`, insertError.message);
        }
      }
      
      console.log('Default deduction types initialized successfully');
    } else {
      console.log('Deduction types already initialized');
    }
  } catch (e) {
    console.error('Error initializing deduction types:', e.message);
  }

  // Migrate data from old employees table to employees_gas
  try {
    console.log('Checking for employee data migration...');
    const oldEmployeesCount = db.prepare('SELECT COUNT(*) as count FROM employees').get().count;
    const newEmployeesCount = db.prepare('SELECT COUNT(*) as count FROM employees_gas').get().count;
    
    if (oldEmployeesCount > 0 && newEmployeesCount === 0) {
      console.log(`Migrating ${oldEmployeesCount} employees from old table to new table...`);
      
      const oldEmployees = db.prepare('SELECT * FROM employees').all();
      const insertEmployee = db.prepare(`
        INSERT INTO employees_gas (
          id, matricule, nom_complet, email, telephone, 
          date_embauche, categorie, poste, statut, salaire_base,
          banque_nom, banque_compte, cree_le
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      for (const emp of oldEmployees) {
        try {
          const categorie = emp.department === 'Security' ? 'GARDE' : 'ADMINISTRATION';
          const poste = emp.department === 'Security' ? 'GARDE' : 'SUPERVISEUR';
          const statut = emp.status === 'active' ? 'ACTIF' : 'INACTIF';
          
          insertEmployee.run(
            emp.id,
            emp.employee_number,
            `${emp.first_name} ${emp.last_name}`,
            emp.email,
            emp.phone,
            emp.date_hired,
            categorie,
            poste,
            statut,
            emp.salary || 0,
            emp.bank_name,
            emp.account_number,
            emp.created_at
          );
          console.log(`  ✓ Migrated employee: ${emp.first_name} ${emp.last_name}`);
        } catch (migrationError) {
          console.error(`  ✗ Error migrating employee ${emp.first_name} ${emp.last_name}:`, migrationError.message);
        }
      }
      
      console.log('Employee migration completed successfully');
    } else if (oldEmployeesCount === 0) {
      console.log('No old employee data to migrate');
    } else {
      console.log('Employee data already migrated');
    }
  } catch (e) {
    console.error('Error during employee migration:', e.message);
  }

  // Create indexes for better performance
  try {
    db.exec(`CREATE INDEX IF NOT EXISTS idx_employees_gas_statut ON employees_gas(statut)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_employees_gas_categorie ON employees_gas(categorie)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_deployements_employe ON historique_deployements(employe_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_deployements_site ON historique_deployements(site_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_deployements_actif ON historique_deployements(est_actif)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_demandes_conge_employe ON demandes_conge(employe_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_demandes_conge_statut ON demandes_conge(statut)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_vehicules_statut ON vehicules_flotte(statut)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_equipements_statut ON equipements(statut)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_actions_disciplinaires_employe ON actions_disciplinaires(employe_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_actions_disciplinaires_statut ON actions_disciplinaires(statut)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_alertes_statut ON alertes_systeme(statut)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_alertes_type ON alertes_systeme(type_alerte)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_bulletins_periode ON bulletins_paie(periode_paie_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_bulletins_employe ON bulletins_paie(employe_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_avances_employe ON avances_employes(employe_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_remboursements_avance ON remboursements_avances(avance_id)`);
    // OHADA Payroll indexes
    db.exec(`CREATE INDEX IF NOT EXISTS idx_salaires_impayes_employe ON salaires_impayes(employe_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_salaires_impayes_periode ON salaires_impayes(periode_paie_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_salaires_impayes_statut ON salaires_impayes(statut)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_charges_sociales_periode ON charges_sociales_dues(periode_paie_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_charges_sociales_organisme ON charges_sociales_dues(organisme)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_charges_sociales_statut ON charges_sociales_dues(statut)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_ecritures_date ON ecritures_comptables(date_ecriture)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_ecritures_type ON ecritures_comptables(type_operation)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_lignes_ecriture ON lignes_ecritures(ecriture_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_lignes_compte ON lignes_ecritures(compte_comptable)`);
    
    // Enhanced Deduction System indexes
    db.exec(`CREATE INDEX IF NOT EXISTS idx_employee_deductions_employe ON employee_deductions(employe_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_employee_deductions_status ON employee_deductions(status)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_employee_deductions_type ON employee_deductions(deduction_type_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_employee_deductions_source ON employee_deductions(source_type, source_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_deduction_schedule_deduction ON deduction_schedule(deduction_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_deduction_schedule_period ON deduction_schedule(period_year, period_month)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_deduction_schedule_status ON deduction_schedule(status)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_deduction_history_deduction ON deduction_history(deduction_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_deduction_history_bulletin ON deduction_history(bulletin_paie_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_deduction_history_period ON deduction_history(period_year, period_month)`);

    console.log('Database indexes created successfully');
  } catch (e) {
    // Indexes may already exist
  }

  // Initialize default admin user if not exists
  try {
    const existingUsers = db.prepare('SELECT COUNT(*) as count FROM users').get();
    console.log('Users count:', existingUsers.count);
    
    if (existingUsers.count === 0) {
      console.log('Initializing default admin user...');
      const adminId = crypto.randomUUID();
      const hashedPassword = hashPassword('admin123');
      const now = new Date().toISOString();
      
      db.prepare(`
        INSERT INTO users (id, nom_utilisateur, mot_de_passe_hash, nom_complet, email, role, statut, cree_le, modifie_le)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        adminId,
        'admin',
        hashedPassword,
        'Administrateur Système',
        'admin@goaheadsecurity.com',
        'ADMIN',
        'ACTIF',
        now,
        now
      );
      
      console.log('✅ Default admin user created successfully');
      console.log('   Username: admin');
      console.log('   Password: admin123');
    } else {
      console.log('Users already exist, skipping admin user creation');
    }
  } catch (e) {
    console.error('Error initializing default admin user:', e.message);
  }

  console.log('HR, Operations, Inventory, Disciplinary & Payroll tables created successfully');
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.cjs')
    },
    icon: path.join(__dirname, 'icon.png'), // Add your app icon
    show: false
  });

  const startUrl = isDev 
    ? 'http://localhost:5173' 
    : `file://${path.join(__dirname, '../dist/index.html')}`;
  
  mainWindow.loadURL(startUrl);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ============================================================================
// RÔTEUR MANAGEMENT HANDLERS
// ============================================================================

// Get all rôteurs (employees with poste='ROTEUR')
ipcMain.handle('db-get-roteurs', async (event, filters = {}) => {
  try {
    let query = `
      SELECT e.*, 
             COUNT(ar.id) as sites_assigned,
             (6 - COUNT(ar.id)) as capacity_remaining
      FROM employees_gas e
      LEFT JOIN affectations_roteur ar ON e.id = ar.roteur_id 
        AND ar.statut IN ('PLANIFIE', 'EN_COURS')
      WHERE e.categorie = 'GARDE' AND e.poste = 'ROTEUR'
    `;
    const params = [];

    if (filters.statut) {
      query += ' AND e.statut = ?';
      params.push(filters.statut);
    }

    query += ' GROUP BY e.id ORDER BY e.nom_complet';

    return db.prepare(query).all(...params);
  } catch (error) {
    console.error('Error fetching rôteurs:', error);
    throw error;
  }
});

// Get rôteur assignments with optional filters
ipcMain.handle('db-get-roteur-assignments', async (event, filters = {}) => {
  console.log('🔍 [BACKEND] Getting roteur assignments with filters:', filters);
  
  try {
    let query = `
      SELECT 
        ar.*,
        r.nom_complet as roteur_nom,
        r.matricule as roteur_matricule,
        s.nom_site as site_nom,
        c.nom_entreprise as client_nom,
        (SELECT COUNT(*) FROM employees_gas WHERE site_affecte_id = s.id AND statut = 'ACTIF' AND poste = 'GARDE') as site_guard_count
      FROM affectations_roteur ar
      LEFT JOIN employees_gas r ON ar.roteur_id = r.id
      LEFT JOIN sites_gas s ON ar.site_id = s.id
      LEFT JOIN clients_gas c ON s.client_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.roteurId) {
      query += ' AND ar.roteur_id = ?';
      params.push(filters.roteurId);
    }

    if (filters.siteId) {
      query += ' AND ar.site_id = ?';
      params.push(filters.siteId);
    }

    if (filters.statut) {
      query += ' AND ar.statut = ?';
      params.push(filters.statut);
    }

    if (filters.dateDebut && filters.dateFin) {
      query += ' AND ar.date_debut <= ? AND ar.date_fin >= ?';
      params.push(filters.dateFin, filters.dateDebut);
    }

    query += ' ORDER BY ar.date_debut DESC';

    const rawAssignments = db.prepare(query).all(...params);
    
    // Process assignments to parse weekly_assignments JSON
    const processedAssignments = rawAssignments.map(assignment => {
      let weeklyAssignments = [];
      
      // Parse weekly_assignments if it exists and is a string
      if (assignment.weekly_assignments) {
        try {
          if (typeof assignment.weekly_assignments === 'string') {
            weeklyAssignments = JSON.parse(assignment.weekly_assignments);
          } else if (Array.isArray(assignment.weekly_assignments)) {
            weeklyAssignments = assignment.weekly_assignments;
          }
        } catch (parseError) {
          console.warn(`Failed to parse weekly_assignments for assignment ${assignment.id}:`, parseError);
          weeklyAssignments = [];
        }
      }
      
      // Ensure each weekly assignment has site names
      if (weeklyAssignments.length > 0) {
        weeklyAssignments = weeklyAssignments.map(wa => {
          // If site_nom is not already included, try to get it from database
          if (!wa.site_nom && wa.site_id) {
            const site = db.prepare('SELECT nom_site FROM sites_gas WHERE id = ?').get(wa.site_id);
            wa.site_nom = site ? site.nom_site : 'Site inconnu';
          }
          return wa;
        });
      }
      
      return {
        ...assignment,
        weekly_assignments: weeklyAssignments
      };
    });
    
    console.log(`🔍 [BACKEND] Returning ${processedAssignments.length} roteur assignments`);
    
    // Debug: Log first assignment to see structure
    if (processedAssignments.length > 0) {
      console.log('🔍 [BACKEND] Sample assignment structure:', {
        id: processedAssignments[0].id,
        roteur_nom: processedAssignments[0].roteur_nom,
        site_nom: processedAssignments[0].site_nom,
        weekly_assignments_count: processedAssignments[0].weekly_assignments?.length || 0,
        weekly_assignments_sample: processedAssignments[0].weekly_assignments?.slice(0, 2) || []
      });
    }
    
    return processedAssignments;
  } catch (error) {
    console.error('❌ [BACKEND] Error fetching rôteur assignments:', error);
    throw error;
  }
});

// Convert roteur back to normal guard and unassign all sites
ipcMain.handle('db-convert-roteur-to-guard', async (event, { roteurId, reason }) => {
  console.log(`🚨 BACKEND: Converting roteur ${roteurId} back to guard`);
  try {
    // Start a transaction to ensure data consistency
    const updateEmployeePoste = db.prepare('UPDATE employees_gas SET poste = ? WHERE id = ?');
    const cancelActiveAssignments = db.prepare(`
      UPDATE affectations_roteur 
      SET statut = 'ANNULE', notes = COALESCE(notes || ' | ', '') || ? 
      WHERE roteur_id = ? AND statut IN ('PLANIFIE', 'EN_COURS')
    `);
    
    // Also close related deployment history records
    const closeRoteurDeployments = db.prepare(`
      UPDATE historique_deployements 
      SET est_actif = 0, date_fin = date('now'), notes = COALESCE(notes || ' - ', '') || ?
      WHERE employe_id = ? AND est_actif = 1 AND cree_par = 'SYSTEM_ROTEUR'
    `);
    
    // Check current assignments before conversion
    const activeAssignments = db.prepare(`
      SELECT ar.*, s.nom_site, c.nom_entreprise as client_nom
      FROM affectations_roteur ar
      JOIN sites_gas s ON ar.site_id = s.id
      JOIN clients_gas c ON s.client_id = c.id
      WHERE ar.roteur_id = ? AND ar.statut IN ('PLANIFIE', 'EN_COURS')
    `).all(roteurId);
    
    // Get roteur info
    const roteurInfo = db.prepare('SELECT nom_complet, matricule FROM employees_gas WHERE id = ?').get(roteurId);
    
    console.log(`📊 Converting roteur ${roteurInfo?.nom_complet} (${roteurInfo?.matricule}):`);
    console.log(`  - Active assignments to cancel: ${activeAssignments.length}`);
    activeAssignments.forEach(assignment => {
      console.log(`    • Site: ${assignment.nom_site} (${assignment.client_nom}) - ${assignment.jour_semaine}`);
    });
    
    // Begin transaction
    const transaction = db.transaction(() => {
      // 1. Change employee poste from ROTEUR to GARDE
      const employeeResult = updateEmployeePoste.run('GARDE', roteurId);
      console.log(`✅ Employee poste updated: ${employeeResult.changes} row(s) affected`);
      
      // 2. Cancel all active roteur assignments
      const cancellationReason = reason || 'Conversion automatique: Roteur → Garde';
      const assignmentsResult = cancelActiveAssignments.run(cancellationReason, roteurId);
      
      // 2b. Close related deployment history records
      const deploymentCloseReason = 'Conversion roteur vers garde';
      const deploymentsResult = closeRoteurDeployments.run(deploymentCloseReason, roteurId);
      
      console.log(`📋 Assignments cancelled: ${assignmentsResult.changes} row(s) affected`);
      console.log(`📋 Deployment history closed: ${deploymentsResult.changes} row(s) affected`);
      
      return {
        employeeUpdated: employeeResult.changes,
        assignmentsCancelled: assignmentsResult.changes,
        sitesAffected: activeAssignments.length,
        affectedSites: activeAssignments.map(a => ({
          site_id: a.site_id,
          nom_site: a.nom_site,
          client_nom: a.client_nom,
          jour_semaine: a.jour_semaine
        }))
      };
    });
    
    // Execute the transaction and get results
    const results = transaction();
    
    console.log(`✅ Roteur conversion completed:`, results);
    
    return { success: true, ...results };
  } catch (error) {
    console.error('❌ Error converting roteur to guard:', error);
    throw error;
  }
});

// Simple test to check database state
ipcMain.handle('db-test-query', async (event, query) => {
  try {
    console.log(`🔍 TEST QUERY: ${query}`);
    const result = db.prepare(query).all();
    console.log(`📊 RESULT:`, result);
    return result;
  } catch (error) {
    console.error('❌ TEST QUERY ERROR:', error);
    throw error;
  }
});

// Debug handler to check site and employee data
ipcMain.handle('db-debug-roteur-sites', async (event) => {
  try {
    console.log('🔍 DEBUG: Checking roteur sites data...');
    
    // Check all sites
    const allSites = db.prepare(`
      SELECT s.id, s.nom_site, s.est_actif, c.nom_entreprise as client_nom
      FROM sites_gas s
      LEFT JOIN clients_gas c ON s.client_id = c.id
      ORDER BY s.nom_site
    `).all();
    console.log(`📊 Total sites: ${allSites.length}`);
    console.log('Sites:', allSites);
    
    // Check all employees
    const allEmployees = db.prepare(`
      SELECT e.id, e.nom_complet, e.poste, e.statut, e.site_affecte_id, s.nom_site
      FROM employees_gas e
      LEFT JOIN sites_gas s ON e.site_affecte_id = s.id
      WHERE e.statut = 'ACTIF'
      ORDER BY e.nom_complet
    `).all();
    console.log(`📊 Total active employees: ${allEmployees.length}`);
    console.log('Employees:', allEmployees);
    
    // Check guards specifically
    const guards = db.prepare(`
      SELECT e.id, e.nom_complet, e.poste, e.statut, e.site_affecte_id, s.nom_site
      FROM employees_gas e
      LEFT JOIN sites_gas s ON e.site_affecte_id = s.id
      WHERE e.statut = 'ACTIF' AND e.poste = 'GARDE'
      ORDER BY e.nom_complet
    `).all();
    console.log(`📊 Active guards: ${guards.length}`);
    console.log('Guards:', guards);
    
    // Check site guard counts
    const siteGuardCounts = db.prepare(`
      SELECT 
        s.id, s.nom_site, s.est_actif,
        COUNT(e.id) as guard_count,
        GROUP_CONCAT(e.nom_complet) as guard_names
      FROM sites_gas s
      LEFT JOIN employees_gas e ON e.site_affecte_id = s.id 
        AND e.statut = 'ACTIF' 
        AND e.poste = 'GARDE'
      WHERE s.est_actif = 1
      GROUP BY s.id
      ORDER BY s.nom_site
    `).all();
    console.log(`📊 Site guard counts: ${siteGuardCounts.length}`);
    console.log('Site guard counts:', siteGuardCounts);
    
    // Check sites with exactly 1 guard
    const eligibleSites = db.prepare(`
      SELECT 
        s.id, s.nom_site, s.est_actif,
        COUNT(e.id) as guard_count,
        GROUP_CONCAT(e.nom_complet) as guard_names
      FROM sites_gas s
      LEFT JOIN employees_gas e ON e.site_affecte_id = s.id 
        AND e.statut = 'ACTIF' 
        AND e.poste = 'GARDE'
      WHERE s.est_actif = 1
      GROUP BY s.id
      HAVING COUNT(e.id) = 1
      ORDER BY s.nom_site
    `).all();
    console.log(`📊 Sites with exactly 1 guard: ${eligibleSites.length}`);
    console.log('Eligible sites:', eligibleSites);
    
    return {
      totalSites: allSites.length,
      totalEmployees: allEmployees.length,
      totalGuards: guards.length,
      sitesWithGuards: siteGuardCounts.length,
      eligibleSites: eligibleSites.length,
      data: {
        allSites,
        allEmployees,
        guards,
        siteGuardCounts,
        eligibleSites
      }
    };
  } catch (error) {
    console.error('Error in debug handler:', error);
    throw error;
  }
});

// Get sites eligible for rôteur assignment (sites with exactly 1 guard)
ipcMain.handle('db-get-sites-eligible-for-roteur', async (event, filters = {}) => {
  try {
    let query = `
      SELECT 
        s.*,
        c.nom_entreprise as client_nom,
        COUNT(e.id) as guard_count,
        GROUP_CONCAT(e.nom_complet) as guard_names,
        CASE WHEN ar.id IS NOT NULL THEN 1 ELSE 0 END as has_roteur,
        ar.roteur_id,
        r.nom_complet as roteur_nom,
        ar.jour_semaine
      FROM sites_gas s
      LEFT JOIN clients_gas c ON s.client_id = c.id
      LEFT JOIN employees_gas e ON e.site_affecte_id = s.id 
        AND e.statut = 'ACTIF' 
        AND e.poste = 'GARDE'
      LEFT JOIN affectations_roteur ar ON s.id = ar.site_id 
        AND ar.statut IN ('PLANIFIE', 'EN_COURS')
      LEFT JOIN employees_gas r ON ar.roteur_id = r.id
      WHERE s.est_actif = 1
    `;
    const params = [];

    if (filters.clientId) {
      query += ' AND s.client_id = ?';
      params.push(filters.clientId);
    }

    if (filters.needsRoteur) {
      query += ' AND ar.id IS NULL'; // Only sites without roteur
    }

    query += `
      GROUP BY s.id
      HAVING COUNT(e.id) = 1
      ORDER BY c.nom_entreprise, s.nom_site
    `;

    return db.prepare(query).all(...params);
  } catch (error) {
    console.error('Error fetching sites eligible for rôteur:', error);
    throw error;
  }
});

// Create rôteur assignment (supports both old single-site and new weekly assignments)
ipcMain.handle('db-create-roteur-assignment', async (event, assignment) => {
  console.log('🔍 [BACKEND] Creating roteur assignment:', JSON.stringify(assignment, null, 2));
  
  try {
    // Check if this is a weekly assignment (new format) or single site assignment (old format)
    const isWeeklyAssignment = assignment.weekly_assignments && 
                              (typeof assignment.weekly_assignments === 'string' || Array.isArray(assignment.weekly_assignments));
    
    if (isWeeklyAssignment) {
      console.log('🔄 [BACKEND] Processing weekly assignment');
      
      // Parse weekly_assignments if it's a string
      let weeklyAssignments;
      if (typeof assignment.weekly_assignments === 'string') {
        try {
          weeklyAssignments = JSON.parse(assignment.weekly_assignments);
        } catch (parseError) {
          throw new Error('Invalid weekly_assignments JSON format');
        }
      } else {
        weeklyAssignments = assignment.weekly_assignments;
      }
      
      console.log('🔍 [BACKEND] Parsed weekly assignments:', weeklyAssignments);
      
      if (!Array.isArray(weeklyAssignments) || weeklyAssignments.length === 0) {
        throw new Error('weekly_assignments must be a non-empty array');
      }
      
      // Validation: Check if roteur exists and is active
      const roteur = db.prepare(`
        SELECT id, nom_complet, statut FROM employees_gas 
        WHERE id = ? AND categorie = 'GARDE' AND poste = 'ROTEUR'
      `).get(assignment.roteur_id);
      
      if (!roteur) {
        throw new Error('Rôteur non trouvé ou invalide');
      }
      
      if (roteur.statut !== 'ACTIF') {
        throw new Error(`Le rôteur ${roteur.nom_complet} n'est pas actif`);
      }
      
      // Validation: Check if sites exist and are eligible
      const siteIds = [...new Set(weeklyAssignments.map(wa => wa.site_id))];
      const siteValidation = db.prepare(`
        SELECT s.id, s.nom_site, COUNT(e.id) as guard_count 
        FROM sites_gas s
        LEFT JOIN employees_gas e ON e.site_affecte_id = s.id AND e.statut = 'ACTIF' AND e.poste = 'GARDE'
        WHERE s.id IN (${siteIds.map(() => '?').join(',')})
        GROUP BY s.id
      `).all(...siteIds);
      
      const invalidSites = siteValidation.filter(site => site.guard_count !== 1);
      if (invalidSites.length > 0) {
        const siteNames = invalidSites.map(s => `${s.nom_site} (${s.guard_count} garde(s))`).join(', ');
        throw new Error(`Seuls les sites avec exactement 1 garde peuvent avoir un rôteur assigné. Sites invalides: ${siteNames}`);
      }
      
      // Validation: Check for existing roteur assignments on these sites
      const existingRoteurs = db.prepare(`
        SELECT s.nom_site, ar.id, ar.roteur_id
        FROM affectations_roteur ar
        JOIN sites_gas s ON ar.site_id = s.id
        WHERE ar.site_id IN (${siteIds.map(() => '?').join(',')}) 
        AND ar.statut IN ('PLANIFIE', 'EN_COURS')
        AND ar.roteur_id != ?
      `).all(...siteIds, assignment.roteur_id);
      
      if (existingRoteurs.length > 0) {
        const siteNames = existingRoteurs.map(s => s.nom_site).join(', ');
        throw new Error(`Ces sites ont déjà un autre rôteur assigné: ${siteNames}`);
      }
      
      // Create the weekly assignment record
      const assignmentId = crypto.randomUUID();
      const primarySiteId = weeklyAssignments[0].site_id; // Use first site as primary
      
      // Prepare weekly assignments with site names for response
      const weeklyAssignmentsWithSiteNames = weeklyAssignments.map(wa => {
        const site = siteValidation.find(s => s.id === wa.site_id);
        return {
          ...wa,
          site_nom: site ? site.nom_site : 'Site inconnu'
        };
      });
      
      const insertStmt = db.prepare(`
        INSERT INTO affectations_roteur (
          id, roteur_id, site_id, date_debut, date_fin, poste, statut, notes, weekly_assignments, cree_le
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `);
      
      const result = insertStmt.run(
        assignmentId,
        assignment.roteur_id,
        primarySiteId,
        assignment.date_debut,
        assignment.date_fin || '2099-12-31',
        assignment.poste || 'NUIT',
        assignment.statut || 'PLANIFIE',
        assignment.notes || null,
        JSON.stringify(weeklyAssignments) // Store as JSON string
      );
      
      // Create a single deployment history record with all sites listed
      const siteNames = weeklyAssignmentsWithSiteNames.map(wa => wa.site_nom).join(', ');
      const deploymentId = `roteur-${assignmentId}`;
      const deploymentNotes = `Affectation rôteur hebdomadaire${assignment.notes ? ` - ${assignment.notes}` : ''}`;
      
      const deploymentStmt = db.prepare(`
        INSERT INTO historique_deployements (
          id, employe_id, site_id, date_debut, poste, motif_affectation, notes, roteur_sites, est_actif, cree_par
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 'SYSTEM_ROTEUR')
      `);
      
      deploymentStmt.run(
        deploymentId,
        assignment.roteur_id,
        primarySiteId, // Primary site for reference
        assignment.date_debut,
        assignment.poste || 'NUIT',
        'ROTATION',
        deploymentNotes,
        siteNames // All sites in comma-separated format
      );
      
      console.log('✅ [BACKEND] Created weekly roteur assignment:', {
        id: assignmentId,
        roteur_id: assignment.roteur_id,
        roteur_nom: roteur.nom_complet,
        weekly_assignments_count: weeklyAssignments.length,
        sites_covered: siteIds.length
      });
      
      return { 
        success: true, 
        id: assignmentId,
        weekly_assignments: weeklyAssignmentsWithSiteNames,
        roteur_nom: roteur.nom_complet,
        sites_count: siteIds.length
      };
      
    } else {
      // Legacy single-site assignment (keep for backward compatibility)
      console.log('🔄 [BACKEND] Processing legacy single-site assignment');
      
      const siteIds = Array.isArray(assignment.site_ids) ? assignment.site_ids : [assignment.site_id];
      
      // ... (keep existing legacy logic for single-site assignments)
      // This is the existing code that was already working
      
      // Validation 1: Check if roteur has capacity (max 6 sites total)
      const roteurSiteCount = db.prepare(`
        SELECT COUNT(*) as count 
        FROM affectations_roteur 
        WHERE roteur_id = ? AND statut IN ('PLANIFIE', 'EN_COURS')
      `).get(assignment.roteur_id);
      
      const newSitesCount = siteIds.length;
      const totalSitesAfterAssignment = roteurSiteCount.count + newSitesCount;
      
      if (totalSitesAfterAssignment > 6) {
        throw new Error(`Ce rôteur ne peut pas être assigné à ${newSitesCount} site(s) supplémentaire(s). Capacité actuelle: ${roteurSiteCount.count}/6. Maximum autorisé: ${6 - roteurSiteCount.count} site(s) supplémentaire(s).`);
      }
      
      // Validation 2: Check if each site has exactly 1 guard
      const siteValidation = db.prepare(`
        SELECT s.id, s.nom_site, COUNT(e.id) as guard_count 
        FROM sites_gas s
        LEFT JOIN employees_gas e ON e.site_affecte_id = s.id AND e.statut = 'ACTIF' AND e.poste = 'GARDE'
        WHERE s.id IN (${siteIds.map(() => '?').join(',')})
        GROUP BY s.id
      `).all(...siteIds);
      
      const invalidSites = siteValidation.filter(site => site.guard_count !== 1);
      if (invalidSites.length > 0) {
        const siteNames = invalidSites.map(s => `${s.nom_site} (${s.guard_count} garde(s))`).join(', ');
        throw new Error(`Seuls les sites avec exactement 1 garde peuvent avoir un rôteur assigné. Sites invalides: ${siteNames}`);
      }
      
      // Validation 3: Check if any site already has a roteur
      const existingRoteurs = db.prepare(`
        SELECT s.nom_site, ar.id 
        FROM affectations_roteur ar
        JOIN sites_gas s ON ar.site_id = s.id
        WHERE ar.site_id IN (${siteIds.map(() => '?').join(',')}) AND ar.statut IN ('PLANIFIE', 'EN_COURS')
      `).all(...siteIds);
      
      if (existingRoteurs.length > 0) {
        const siteNames = existingRoteurs.map(s => s.nom_site).join(', ');
        throw new Error(`Ces sites ont déjà un rôteur assigné: ${siteNames}`);
      }
      
      // Validation 4: Check day of week conflicts for roteur
      const daysOfWeek = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI'];
      const availableDays = [];
      
      // Get roteur's current day assignments
      const currentDayAssignments = db.prepare(`
        SELECT jour_semaine FROM affectations_roteur 
        WHERE roteur_id = ? AND statut IN ('PLANIFIE', 'EN_COURS') AND jour_semaine IS NOT NULL
      `).all(assignment.roteur_id);
      
      const usedDays = currentDayAssignments.map(a => a.jour_semaine);
      
      // Find available days
      for (const day of daysOfWeek) {
        if (!usedDays.includes(day)) {
          availableDays.push(day);
        }
      }
      
      if (availableDays.length < newSitesCount) {
        throw new Error(`Ce rôteur n'a que ${availableDays.length} jour(s) disponible(s) dans la semaine, mais vous essayez d'assigner ${newSitesCount} site(s).`);
      }
      
      // Create assignments for each site
      const results = [];
      const transaction = db.transaction(() => {
        const stmt = db.prepare(`
          INSERT INTO affectations_roteur (
            id, roteur_id, site_id, jour_semaine,
            date_debut, date_fin, poste, statut, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        siteIds.forEach((siteId, index) => {
          const assignmentId = crypto.randomUUID();
          const assignedDay = availableDays[index]; // Assign to next available day
          
          stmt.run(
            assignmentId,
            assignment.roteur_id,
            siteId,
            assignedDay,
            assignment.date_debut,
            assignment.date_fin,
            assignment.poste || 'JOUR',
            assignment.statut || 'PLANIFIE',
            assignment.notes || null
          );
          
          results.push({
            id: assignmentId,
            site_id: siteId,
            jour_semaine: assignedDay
          });
        });
        
        return results;
      });
      
      const assignmentResults = transaction();
      
      console.log(`✅ Created ${assignmentResults.length} roteur assignments:`, assignmentResults);
      
      return { 
        success: true, 
        assignments: assignmentResults,
        totalSitesAssigned: newSitesCount,
        roteurCapacityUsed: totalSitesAfterAssignment
      };
    }
  } catch (error) {
    console.error('❌ [BACKEND] Error creating rôteur assignment:', error);
    throw error;
  }
});

// Update rôteur assignment
ipcMain.handle('db-update-roteur-assignment', async (event, assignment) => {
  try {
    console.log('🔍 Update assignment data:', JSON.stringify(assignment, null, 2));
    console.log('🔍 Keys:', Object.keys(assignment));
    console.log('🔍 Has roteur_id:', !!assignment.roteur_id);
    console.log('🔍 Only has id and statut:', Object.keys(assignment).length === 2 && assignment.id && assignment.statut);
    
    // If only updating status (like canceling), do a partial update
    // Check if we only have id and statut, or if roteur_id is missing/null
    if ((Object.keys(assignment).length === 2 && assignment.id && assignment.statut) || 
        (assignment.statut === 'ANNULE' && !assignment.roteur_id)) {
      console.log('🔍 Doing partial update (status only)');
      const stmt = db.prepare(`
        UPDATE affectations_roteur SET
          statut = ?
        WHERE id = ?
      `);

      const result = stmt.run(assignment.statut, assignment.id);
      console.log('🔍 Partial update result:', result);
      
      // If cancelling, also close related deployment history record
      if (assignment.statut === 'ANNULE') {
        const closeDeploymentStmt = db.prepare(`
          UPDATE historique_deployements 
          SET est_actif = 0, date_fin = date('now'), notes = COALESCE(notes || ' - ', '') || 'Rotation annulée'
          WHERE id = ? AND est_actif = 1
        `);
        
        const deploymentId = `roteur-${assignment.id}`;
        const deploymentResult = closeDeploymentStmt.run(deploymentId);
        console.log('🔍 Closed deployment history record:', deploymentResult.changes);
      }
    } else {
      console.log('🔍 Doing full update');
      // Full update with all fields
      const stmt = db.prepare(`
        UPDATE affectations_roteur SET
          roteur_id = ?, site_id = ?, employe_remplace_id = ?,
          date_debut = ?, date_fin = ?, poste = ?, statut = ?, notes = ?
        WHERE id = ?
      `);

      const result = stmt.run(
        assignment.roteur_id,
        assignment.site_id,
        assignment.employe_remplace_id || null,
        assignment.date_debut,
        assignment.date_fin,
        assignment.poste,
        assignment.statut,
        assignment.notes || null,
        assignment.id
      );
      console.log('🔍 Full update result:', result);
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating rôteur assignment:', error);
    throw error;
  }
});

// Get site coverage gaps (sites with leave but no rôteur assigned)
ipcMain.handle('db-get-site-coverage-gaps', async (event, filters = {}) => {
  try {
    const { dateDebut, dateFin } = filters;
    
    // Get all approved leaves in the date range
    const leaves = db.prepare(`
      SELECT 
        dc.*,
        e.nom_complet as employe_nom,
        e.site_affecte_id,
        s.nom_site,
        c.nom_entreprise as client_nom
      FROM demandes_conge dc
      JOIN employees_gas e ON dc.employe_id = e.id
      LEFT JOIN sites_gas s ON e.site_affecte_id = s.id
      LEFT JOIN clients_gas c ON s.client_id = c.id
      WHERE dc.statut = 'APPROUVE'
        AND dc.date_debut <= ?
        AND dc.date_fin >= ?
        AND e.site_affecte_id IS NOT NULL
    `).all(dateFin || '9999-12-31', dateDebut || '1900-01-01');

    // For each leave, check if there's a rôteur assigned
    const gaps = [];
    for (const leave of leaves) {
      const assignment = db.prepare(`
        SELECT COUNT(*) as count
        FROM affectations_roteur
        WHERE site_id = ?
          AND date_debut <= ?
          AND date_fin >= ?
          AND statut IN ('PLANIFIE', 'EN_COURS')
      `).get(leave.site_affecte_id, leave.date_fin, leave.date_debut);

      if (assignment.count === 0) {
        gaps.push({
          site_id: leave.site_affecte_id,
          site_nom: leave.nom_site,
          client_nom: leave.client_nom,
          employe_id: leave.employe_id,
          employe_nom: leave.employe_nom,
          demande_conge_id: leave.id,
          date_debut: leave.date_debut,
          date_fin: leave.date_fin,
          nombre_jours: leave.nombre_jours
        });
      }
    }

    return gaps;
  } catch (error) {
    console.error('Error fetching coverage gaps:', error);
    throw error;
  }
});

// ============================================================================
// PAYROLL MODULE HANDLERS
// ============================================================================

// Helper function to calculate IPR (RDC tax brackets)
function calculateIPR(salaireImposable) {
  // Try to get IPR brackets from database
  let tranches;
  try {
    const iprSetting = db.prepare('SELECT setting_value FROM tax_settings WHERE setting_name = ?').get('IPR_BRACKETS');
    if (iprSetting) {
      tranches = JSON.parse(iprSetting.setting_value);
    }
  } catch (e) {
    console.log('Using default IPR brackets');
  }
  
  // Fallback to default if not found
  if (!tranches) {
    tranches = [
      { min: 0, max: 72000, taux: 0 },
      { min: 72001, max: 144000, taux: 0.03 },
      { min: 144001, max: 288000, taux: 0.05 },
      { min: 288001, max: 576000, taux: 0.10 },
      { min: 576001, max: 1152000, taux: 0.15 },
      { min: 1152001, max: 2304000, taux: 0.20 },
      { min: 2304001, max: 4608000, taux: 0.25 },
      { min: 4608001, max: 9216000, taux: 0.30 },
      { min: 9216001, max: 18432000, taux: 0.35 },
      { min: 18432001, max: 36864000, taux: 0.40 },
      { min: 36864001, max: Infinity, taux: 0.45 }
    ];
  }
  
  let ipr = 0;
  let reste = salaireImposable;
  
  for (const tranche of tranches) {
    if (reste <= 0) break;
    
    const trancheMax = tranche.max === Infinity ? reste : tranche.max;
    const montantTranche = Math.min(reste, trancheMax - tranche.min + 1);
    ipr += montantTranche * tranche.taux;
    reste -= montantTranche;
  }
  
  return Math.round(ipr * 100) / 100;
}

// Get all payroll periods
ipcMain.handle('db-get-payroll-periods', async () => {
  try {
    // Check if table exists first
    const tableExists = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='periodes_paie'
    `).get();
    
    if (!tableExists) {
      console.log('Payroll tables not yet created. Please restart the application.');
      return [];
    }
    
    const periods = db.prepare(`
      SELECT 
        p.*,
        COUNT(b.id) as nombre_bulletins,
        COALESCE(SUM(b.salaire_brut), 0) as total_brut,
        COALESCE(SUM(b.salaire_net), 0) as total_net
      FROM periodes_paie p
      LEFT JOIN bulletins_paie b ON p.id = b.periode_paie_id
      GROUP BY p.id
      ORDER BY p.annee DESC, p.mois DESC
    `).all();
    
    return periods;
  } catch (error) {
    console.error('Error fetching payroll periods:', error);
    return [];
  }
});

// Create payroll period
ipcMain.handle('db-create-payroll-period', async (event, data) => {
  try {
    const id = crypto.randomUUID();
    
    // Check if period already exists
    const existing = db.prepare('SELECT id FROM periodes_paie WHERE mois = ? AND annee = ?')
      .get(data.mois, data.annee);
    
    if (existing) {
      throw new Error('Une période de paie existe déjà pour ce mois');
    }
    
    // Check if there are any previous periods that are not locked
    const previousPeriod = db.prepare(`
      SELECT id, mois, annee, statut 
      FROM periodes_paie 
      WHERE (annee < ? OR (annee = ? AND mois < ?))
      AND statut != 'VERROUILLEE'
      ORDER BY annee DESC, mois DESC
      LIMIT 1
    `).get(data.annee, data.annee, data.mois);
    
    if (previousPeriod) {
      const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                          'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
      throw new Error(
        `Impossible de créer une nouvelle période. La période ${monthNames[previousPeriod.mois - 1]} ${previousPeriod.annee} doit être verrouillée d'abord (statut actuel: ${previousPeriod.statut}).`
      );
    }
    
    db.prepare(`
      INSERT INTO periodes_paie (id, mois, annee, statut, notes, calculee_par)
      VALUES (?, ?, ?, 'BROUILLON', ?, ?)
    `).run(id, data.mois, data.annee, data.notes || null, data.calculee_par || null);
    
    return { id, ...data, statut: 'BROUILLON' };
  } catch (error) {
    console.error('Error creating payroll period:', error);
    throw error;
  }
});

// Helper function to calculate employee deductions for a payroll period
async function calculateEmployeeDeductions(employeId, periodeId, mois, annee, salaireBrut) {
  try {
    // Get all active deductions for this employee
    const deductions = db.prepare(`
      SELECT ed.*, dt.code as type_code, dt.priority_order, dt.max_percentage_salary
      FROM employee_deductions ed
      JOIN deduction_types dt ON ed.deduction_type_id = dt.id
      WHERE ed.employe_id = ? AND ed.status = 'ACTIVE'
      AND (ed.end_date IS NULL OR ed.end_date >= ?)
      ORDER BY dt.priority_order
    `).all(employeId, `${annee}-${String(mois).padStart(2, '0')}-01`);
    
    const result = {
      disciplinary: 0,
      uniform: 0,
      contribution: 0,
      other: 0,
      total: 0
    };
    
    let availableSalary = salaireBrut;
    const MAX_DEDUCTION_PERCENTAGE = 0.5; // Maximum 50% of salary can be deducted
    
    for (const deduction of deductions) {
      // Check if there's a scheduled amount for this period
      const scheduledDeduction = db.prepare(`
        SELECT * FROM deduction_schedule
        WHERE deduction_id = ? AND period_year = ? AND period_month = ?
      `).get(deduction.id, annee, mois);
      
      let scheduledAmount = 0;
      if (scheduledDeduction && scheduledDeduction.status === 'PENDING') {
        scheduledAmount = scheduledDeduction.scheduled_amount;
      } else if (deduction.schedule_type === 'INSTALLMENTS' && deduction.installment_amount > 0 && deduction.amount_remaining > 0) {
        scheduledAmount = Math.min(deduction.installment_amount, deduction.amount_remaining);
      } else if (deduction.schedule_type === 'ONE_TIME' && deduction.amount_remaining > 0) {
        scheduledAmount = deduction.amount_remaining;
      } else if (deduction.schedule_type === 'RECURRING' && deduction.installment_amount > 0) {
        scheduledAmount = deduction.installment_amount;
      }
      
      if (scheduledAmount > 0) {
        // Apply constraints
        const maxPerPeriod = deduction.max_per_period || scheduledAmount;
        const maxByPercentage = deduction.max_percentage_salary 
          ? salaireBrut * deduction.max_percentage_salary 
          : scheduledAmount;
        const maxByGlobalLimit = availableSalary;
        
        const maxAllowed = Math.min(scheduledAmount, maxPerPeriod, maxByPercentage, maxByGlobalLimit);
        const actualAmount = Math.max(0, maxAllowed);
        
        if (actualAmount > 0) {
          // Create deduction history record
          const historyId = crypto.randomUUID();
          db.prepare(`
            INSERT INTO deduction_history (
              id, deduction_id, amount_deducted, period_year, period_month, 
              deduction_date, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
          `).run(
            historyId, deduction.id, actualAmount, annee, mois,
            new Date().toISOString().split('T')[0], 'APPLIED'
          );
          
          // Update deduction balance
          db.prepare(`
            UPDATE employee_deductions 
            SET amount_deducted = amount_deducted + ?,
                amount_remaining = amount_remaining - ?,
                installments_completed = installments_completed + 1,
                modified_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `).run(actualAmount, actualAmount, deduction.id);
          
          // Update schedule status if exists
          if (scheduledDeduction) {
            db.prepare(`
              UPDATE deduction_schedule 
              SET actual_amount = ?, status = 'APPLIED', applied_date = ?
              WHERE id = ?
            `).run(actualAmount, new Date().toISOString().split('T')[0], scheduledDeduction.id);
          }
          
          // Categorize deduction
          const typeCode = deduction.source_type || deduction.type_code || 'OTHER';
          switch (typeCode) {
            case 'DISCIPLINARY':
              result.disciplinary += actualAmount;
              break;
            case 'UNIFORM':
              result.uniform += actualAmount;
              break;
            case 'CONTRIBUTION':
              result.contribution += actualAmount;
              break;
            default:
              result.other += actualAmount;
          }
          
          result.total += actualAmount;
          availableSalary -= actualAmount;
          
          // Check if deduction is completed
          const updatedDeduction = db.prepare('SELECT amount_remaining FROM employee_deductions WHERE id = ?').get(deduction.id);
          if (updatedDeduction.amount_remaining <= 0) {
            db.prepare(`
              UPDATE employee_deductions 
              SET status = 'COMPLETED', modified_at = CURRENT_TIMESTAMP
              WHERE id = ?
            `).run(deduction.id);
          }
        }
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error calculating employee deductions:', error);
    return { disciplinary: 0, uniform: 0, contribution: 0, other: 0, total: 0 };
  }
}

// Calculate payroll for a period
ipcMain.handle('db-calculate-payroll', async (event, { periodeId, mois, annee, calculePar }) => {
  try {
    // Check if period is locked
    const period = db.prepare('SELECT statut FROM periodes_paie WHERE id = ?').get(periodeId);
    if (period.statut === 'VERROUILLEE') {
      throw new Error('Cette période est verrouillée');
    }
    
    // Delete existing bulletins for this period
    db.prepare('DELETE FROM bulletins_paie WHERE periode_paie_id = ?').run(periodeId);
    
    // Get all active employees
    const employees = db.prepare(`
      SELECT * FROM employees_gas 
      WHERE statut = 'ACTIF'
      ORDER BY nom_complet
    `).all();
    
    const bulletins = [];
    
    for (const emp of employees) {
      // 1. Calculate base salary
      let salaireBase = 0;
      let joursTravailles = 0;
      
      if (emp.mode_remuneration === 'MENSUEL') {
        salaireBase = emp.salaire_base || 0;
      } else {
        // Daily rate: assume 30 days worked (TODO: integrate with planning)
        joursTravailles = 30;
        salaireBase = joursTravailles * (emp.taux_journalier || 0);
      }
      
      const primes = 0; // TODO: bonus system
      
      // Calculate arriérés: sum of unpaid/partially paid salaries from previous validated periods
      // NOTE: Arriérés are tracked separately for display but NOT included in salary calculation
      const arrieresResult = db.prepare(`
        SELECT COALESCE(SUM(si.montant_restant), 0) as total_arrieres
        FROM salaires_impayes si
        JOIN periodes_paie pp ON si.periode_paie_id = pp.id
        WHERE si.employe_id = ?
        AND si.statut IN ('IMPAYE', 'PAYE_PARTIEL')
        AND (pp.annee < ? OR (pp.annee = ? AND pp.mois < ?))
      `).get(emp.id, annee, annee, mois);
      
      const arrieres = arrieresResult?.total_arrieres || 0;
      
      // Salaire brut = base salary + bonuses ONLY (arriérés NOT included)
      // Arriérés are tracked separately and shown on payslip for information
      const salaireBrut = salaireBase + primes;
      
      // 2. Calculate social deductions (get rates from database)
      let cnssRate = 0.05, onemRate = 0.015, inppRate = 0.005;
      try {
        const cnssS = db.prepare('SELECT setting_value FROM tax_settings WHERE setting_name = ?').get('CNSS_RATE');
        const onemS = db.prepare('SELECT setting_value FROM tax_settings WHERE setting_name = ?').get('ONEM_RATE');
        const inppS = db.prepare('SELECT setting_value FROM tax_settings WHERE setting_name = ?').get('INPP_RATE');
        if (cnssS) cnssRate = parseFloat(cnssS.setting_value);
        if (onemS) onemRate = parseFloat(onemS.setting_value);
        if (inppS) inppRate = parseFloat(inppS.setting_value);
      } catch (e) {
        console.log('Using default tax rates');
      }
      
      const cnss = Math.round(salaireBrut * cnssRate * 100) / 100;
      const onem = Math.round(salaireBrut * onemRate * 100) / 100;
      const inpp = Math.round(salaireBrut * inppRate * 100) / 100;
      const totalRetenuesSociales = cnss + onem + inpp;
      
      // 3. Calculate taxable salary
      const salaireImposable = salaireBrut - totalRetenuesSociales;
      
      // 4. Calculate IPR
      const ipr = calculateIPR(salaireImposable);
      
      // 5. Calculate enhanced deductions using new system
      const periodDeductions = await calculateEmployeeDeductions(emp.id, periodeId, mois, annee, salaireBrut);
      
      let retenuesDisciplinaires = periodDeductions.disciplinary || 0;
      let retenues_uniformes = periodDeductions.uniform || 0;
      let retenues_contributions = periodDeductions.contribution || 0;
      let autres_retenues_detail = periodDeductions.other || 0;
      
      // Legacy disciplinary deductions (for backward compatibility)
      const legacyDisciplinaires = db.prepare(`
        SELECT id, montant_deduction
        FROM actions_disciplinaires
        WHERE employe_id = ?
        AND statut = 'VALIDE'
        AND impact_financier = 1
        AND montant_deduction > 0
        AND (periode_paie_mois IS NULL OR periode_paie_mois = ?)
        AND (periode_paie_annee IS NULL OR periode_paie_annee = ?)
        AND applique_paie = 0
        AND deduction_id IS NULL
      `).all(emp.id, mois, annee);
      
      const legacyDisciplinaryIds = [];
      for (const disc of legacyDisciplinaires) {
        retenuesDisciplinaires += disc.montant_deduction;
        legacyDisciplinaryIds.push(disc.id);
      }
      
      // Mark legacy disciplinary actions as applied
      if (legacyDisciplinaryIds.length > 0) {
        const updateDisciplinaryStmt = db.prepare(`
          UPDATE actions_disciplinaires 
          SET periode_paie_mois = ?, periode_paie_annee = ?, applique_paie = 1
          WHERE id = ?
        `);
        
        for (const discId of legacyDisciplinaryIds) {
          updateDisciplinaryStmt.run(mois, annee, discId);
        }
      }
      
      // 6. Get advances to repay
      const avances = db.prepare(`
        SELECT id, mensualite_montant, montant_restant
        FROM avances_employes
        WHERE employe_id = ?
        AND statut = 'EN_COURS'
        AND montant_restant > 0
      `).all(emp.id);
      
      let totalAvances = 0;
      const avancesDetails = [];
      for (const avance of avances) {
        const montant = Math.min(avance.mensualite_montant, avance.montant_restant);
        totalAvances += montant;
        avancesDetails.push({ avanceId: avance.id, montant });
      }
      
      // 7. Calculate total deductions and net salary
      const totalDeductionsDetail = retenuesDisciplinaires + retenues_uniformes + retenues_contributions + autres_retenues_detail;
      const totalRetenues = totalRetenuesSociales + ipr + totalDeductionsDetail + totalAvances;
      const salaireNet = salaireBrut - totalRetenues;
      
      // 8. Create payslip with detailed deductions
      const bulletinId = crypto.randomUUID();
      
      db.prepare(`
        INSERT INTO bulletins_paie (
          id, periode_paie_id, employe_id, matricule, nom_complet, categorie, mode_remuneration,
          salaire_base, jours_travailles, taux_journalier, primes, arrieres, salaire_brut,
          cnss, onem, inpp, total_retenues_sociales, salaire_imposable, ipr,
          retenues_disciplinaires, avances, autres_retenues,
          deductions_disciplinaires, deductions_uniformes, deductions_contributions, deductions_autres,
          total_deductions_detail, total_retenues, salaire_net, devise, statut
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'USD', 'BROUILLON')
      `).run(
        bulletinId, periodeId, emp.id, emp.matricule, emp.nom_complet, emp.categorie, emp.mode_remuneration,
        salaireBase, joursTravailles, emp.taux_journalier || 0, primes, arrieres, salaireBrut,
        cnss, onem, inpp, totalRetenuesSociales, salaireImposable, ipr,
        retenuesDisciplinaires, totalAvances, totalDeductionsDetail,
        retenuesDisciplinaires, retenues_uniformes, retenues_contributions, autres_retenues_detail,
        totalDeductionsDetail, totalRetenues, salaireNet
      );
      
      // Create advance repayment records
      for (const avanceDetail of avancesDetails) {
        const repaymentId = crypto.randomUUID();
        db.prepare(`
          INSERT INTO remboursements_avances (id, avance_id, bulletin_paie_id, montant_rembourse, date_remboursement)
          VALUES (?, ?, ?, ?, date('now'))
        `).run(repaymentId, avanceDetail.avanceId, bulletinId, avanceDetail.montant);
        
        // Update advance
        db.prepare(`
          UPDATE avances_employes 
          SET montant_rembourse = montant_rembourse + ?,
              montant_restant = montant_restant - ?,
              statut = CASE WHEN montant_restant - ? <= 0 THEN 'REMBOURSE' ELSE 'EN_COURS' END
          WHERE id = ?
        `).run(avanceDetail.montant, avanceDetail.montant, avanceDetail.montant, avanceDetail.avanceId);
      }
      
      bulletins.push({
        id: bulletinId,
        employe_id: emp.id,
        nom_complet: emp.nom_complet,
        salaire_brut: salaireBrut,
        salaire_net: salaireNet
      });
    }
    
    // Update period status
    db.prepare(`
      UPDATE periodes_paie 
      SET statut = 'CALCULEE', date_calcul = datetime('now'), calculee_par = ?
      WHERE id = ?
    `).run(calculePar, periodeId);
    
    return { success: true, bulletins };
  } catch (error) {
    console.error('Error calculating payroll:', error);
    throw error;
  }
});

// Get payslips for a period
ipcMain.handle('db-get-payslips', async (event, periodeId) => {
  try {
    const payslips = db.prepare(`
      SELECT * FROM bulletins_paie
      WHERE periode_paie_id = ?
      ORDER BY nom_complet
    `).all(periodeId);
    
    return payslips;
  } catch (error) {
    console.error('Error fetching payslips:', error);
    throw error;
  }
});

// Get payslip detail
ipcMain.handle('db-get-payslip-detail', async (event, bulletinId) => {
  try {
    const bulletin = db.prepare('SELECT * FROM bulletins_paie WHERE id = ?').get(bulletinId);
    
    if (!bulletin) {
      throw new Error('Bulletin non trouvé');
    }
    
    // Get disciplinary actions applied
    const actions = db.prepare(`
      SELECT * FROM actions_disciplinaires
      WHERE employe_id = ?
      AND periode_paie_mois = (SELECT mois FROM periodes_paie WHERE id = ?)
      AND periode_paie_annee = (SELECT annee FROM periodes_paie WHERE id = ?)
      AND statut = 'VALIDE'
    `).all(bulletin.employe_id, bulletin.periode_paie_id, bulletin.periode_paie_id);
    
    // Get advance repayments
    const repayments = db.prepare(`
      SELECT r.*, a.montant_total, a.nombre_mensualites
      FROM remboursements_avances r
      JOIN avances_employes a ON r.avance_id = a.id
      WHERE r.bulletin_paie_id = ?
    `).all(bulletinId);
    
    return {
      ...bulletin,
      actions_disciplinaires: actions,
      remboursements: repayments
    };
  } catch (error) {
    console.error('Error fetching payslip detail:', error);
    throw error;
  }
});

// Validate payslips
ipcMain.handle('db-validate-payslips', async (event, { periodeId, valideePar }) => {
  try {
    const period = db.prepare('SELECT * FROM periodes_paie WHERE id = ?').get(periodeId);
    
    if (period.statut === 'VERROUILLEE') {
      throw new Error('Cette période est verrouillée');
    }
    
    // Update all payslips to VALIDE
    db.prepare(`
      UPDATE bulletins_paie 
      SET statut = 'VALIDE'
      WHERE periode_paie_id = ?
    `).run(periodeId);
    
    // Update period status
    db.prepare(`
      UPDATE periodes_paie 
      SET statut = 'VALIDEE', date_validation = datetime('now'), validee_par = ?
      WHERE id = ?
    `).run(valideePar, periodeId);
    
    // Mark disciplinary actions as applied
    db.prepare(`
      UPDATE actions_disciplinaires
      SET applique_paie = 1
      WHERE periode_paie_mois = (SELECT mois FROM periodes_paie WHERE id = ?)
      AND periode_paie_annee = (SELECT annee FROM periodes_paie WHERE id = ?)
      AND statut = 'VALIDE'
    `).run(periodeId, periodeId);
    
    // ============================================================================
    // OHADA TRACKING - Create unpaid salaries and social charges records
    // ============================================================================
    
    // Get all validated payslips for this period
    const bulletins = db.prepare('SELECT * FROM bulletins_paie WHERE periode_paie_id = ?').all(periodeId);
    
    // Calculate due date (15th of next month)
    const dateEcheance = new Date(period.annee, period.mois, 15);
    const dateEcheanceStr = dateEcheance.toISOString().split('T')[0];
    
    // Aggregate social charges
    let totalCNSS = 0, totalONEM = 0, totalINPP = 0, totalIPR = 0;
    
    // Create unpaid salary records for each employee
    for (const bulletin of bulletins) {
      // Check if already exists
      const existing = db.prepare('SELECT id FROM salaires_impayes WHERE bulletin_paie_id = ?').get(bulletin.id);
      
      if (!existing && bulletin.salaire_net > 0) {
        const salaireImpayeId = crypto.randomUUID();
        
        db.prepare(`
          INSERT INTO salaires_impayes (
            id, bulletin_paie_id, employe_id, periode_paie_id, matricule, nom_complet,
            montant_net_du, montant_paye, montant_restant, devise, date_echeance,
            statut, compte_comptable
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, 'IMPAYE', '4211')
        `).run(
          salaireImpayeId,
          bulletin.id,
          bulletin.employe_id,
          periodeId,
          bulletin.matricule,
          bulletin.nom_complet,
          bulletin.salaire_net,
          bulletin.salaire_net,
          bulletin.devise || 'USD',
          dateEcheanceStr
        );
      }
      
      // Aggregate social charges
      totalCNSS += bulletin.cnss || 0;
      totalONEM += bulletin.onem || 0;
      totalINPP += bulletin.inpp || 0;
      totalIPR += bulletin.ipr || 0;
    }
    
    // Create social charges records
    const chargesData = [
      { organisme: 'CNSS', montant: totalCNSS, compte: '4221' },
      { organisme: 'ONEM', montant: totalONEM, compte: '4222' },
      { organisme: 'INPP', montant: totalINPP, compte: '4223' },
      { organisme: 'IPR', montant: totalIPR, compte: '4224' }
    ];
    
    for (const charge of chargesData) {
      if (charge.montant > 0) {
        // Check if already exists
        const existing = db.prepare('SELECT id FROM charges_sociales_dues WHERE periode_paie_id = ? AND organisme = ?')
          .get(periodeId, charge.organisme);
        
        if (!existing) {
          const chargeId = crypto.randomUUID();
          
          db.prepare(`
            INSERT INTO charges_sociales_dues (
              id, periode_paie_id, organisme, montant_du, montant_paye, montant_restant,
              devise, date_echeance, statut, compte_comptable, mois_reference, annee_reference
            ) VALUES (?, ?, ?, ?, 0, ?, 'USD', ?, 'IMPAYE', ?, ?, ?)
          `).run(
            chargeId,
            periodeId,
            charge.organisme,
            charge.montant,
            charge.montant,
            dateEcheanceStr,
            charge.compte,
            period.mois,
            period.annee
          );
        }
      }
    }
    
    console.log(`OHADA tracking created: ${bulletins.length} unpaid salaries, 4 social charges`);
    
    return { success: true };
  } catch (error) {
    console.error('Error validating payslips:', error);
    throw error;
  }
});

// Lock payroll period
ipcMain.handle('db-lock-payroll-period', async (event, { periodeId, verrouilleePar }) => {
  try {
    const period = db.prepare('SELECT statut FROM periodes_paie WHERE id = ?').get(periodeId);
    
    if (period.statut !== 'VALIDEE') {
      throw new Error('La période doit être validée avant verrouillage');
    }
    
    db.prepare(`
      UPDATE periodes_paie 
      SET statut = 'VERROUILLEE', date_verrouillage = datetime('now'), verrouillee_par = ?
      WHERE id = ?
    `).run(verrouilleePar, periodeId);
    
    return { success: true };
  } catch (error) {
    console.error('Error locking payroll period:', error);
    throw error;
  }
});

// Flush all payroll data (delete all periods and payslips)
ipcMain.handle('db-flush-payroll', async (event) => {
  try {
    // Delete all related data in correct order (due to foreign keys)
    db.prepare('DELETE FROM remboursements_avances').run();
    db.prepare('DELETE FROM paiements_salaires').run();
    db.prepare('DELETE FROM salaires_impayes').run();
    db.prepare('DELETE FROM bulletins_paie').run();
    db.prepare('DELETE FROM periodes_paie').run();
    
    console.log('All payroll data flushed successfully');
    return { success: true, message: 'Toutes les données de paie ont été supprimées' };
  } catch (error) {
    console.error('Error flushing payroll data:', error);
    throw error;
  }
});

// Update individual payslip
ipcMain.handle('db-update-payslip', async (event, { bulletinId, updates }) => {
  try {
    // Get current payslip
    const bulletin = db.prepare('SELECT * FROM bulletins_paie WHERE id = ?').get(bulletinId);
    
    if (!bulletin) {
      throw new Error('Bulletin non trouvé');
    }
    
    if (bulletin.statut === 'VALIDE' || bulletin.statut === 'PAYE') {
      throw new Error('Impossible de modifier un bulletin validé ou payé');
    }
    
    // Check if period is locked
    const period = db.prepare('SELECT statut FROM periodes_paie WHERE id = ?').get(bulletin.periode_paie_id);
    if (period.statut === 'VERROUILLEE') {
      throw new Error('La période est verrouillée');
    }
    
    // Update payslip
    db.prepare(`
      UPDATE bulletins_paie
      SET salaire_base = ?,
          jours_travailles = ?,
          taux_journalier = ?,
          primes = ?,
          arrieres = ?,
          salaire_brut = ?,
          cnss = ?,
          onem = ?,
          inpp = ?,
          total_retenues_sociales = ?,
          salaire_imposable = ?,
          ipr = ?,
          retenues_disciplinaires = ?,
          autres_retenues = ?,
          total_retenues = ?,
          salaire_net = ?,
          modifie_le = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      updates.salaire_base,
      updates.jours_travailles || 0,
      updates.taux_journalier || 0,
      updates.primes || 0,
      updates.arrieres || 0,
      updates.salaire_brut,
      updates.cnss,
      updates.onem,
      updates.inpp,
      updates.total_retenues_sociales,
      updates.salaire_imposable,
      updates.ipr,
      updates.retenues_disciplinaires || 0,
      updates.autres_retenues || 0,
      updates.total_retenues,
      updates.salaire_net,
      bulletinId
    );
    
    return { success: true };
  } catch (error) {
    console.error('Error updating payslip:', error);
    throw error;
  }
});

// Get employee advances
ipcMain.handle('db-get-employee-advances', async (event, filters = {}) => {
  try {
    let query = `
      SELECT a.*, e.nom_complet as employe_nom, e.matricule
      FROM avances_employes a
      JOIN employees_gas e ON a.employe_id = e.id
      WHERE 1=1
    `;
    const params = [];
    
    if (filters.employeId) {
      query += ' AND a.employe_id = ?';
      params.push(filters.employeId);
    }
    
    if (filters.statut) {
      query += ' AND a.statut = ?';
      params.push(filters.statut);
    }
    
    query += ' ORDER BY a.date_avance DESC';
    
    const advances = db.prepare(query).all(...params);
    return advances;
  } catch (error) {
    console.error('Error fetching employee advances:', error);
    throw error;
  }
});

// Create employee advance
ipcMain.handle('db-create-advance', async (event, data) => {
  try {
    const id = crypto.randomUUID();
    
    const mensualiteMontant = Math.round((data.montant_total / data.nombre_mensualites) * 100) / 100;
    
    db.prepare(`
      INSERT INTO avances_employes (
        id, employe_id, date_avance, montant_total, montant_rembourse, montant_restant,
        nombre_mensualites, mensualite_montant, statut, notes, cree_par
      ) VALUES (?, ?, ?, ?, 0, ?, ?, ?, 'EN_COURS', ?, ?)
    `).run(
      id, data.employe_id, data.date_avance, data.montant_total, data.montant_total,
      data.nombre_mensualites, mensualiteMontant, data.notes || null, data.cree_par || null
    );
    
    return { id, ...data, mensualite_montant: mensualiteMontant };
  } catch (error) {
    console.error('Error creating advance:', error);
    throw error;
  }
});

// Get advance repayments
ipcMain.handle('db-get-advance-repayments', async (event, avanceId) => {
  try {
    const repayments = db.prepare(`
      SELECT r.*, b.periode_paie_id, p.mois, p.annee
      FROM remboursements_avances r
      JOIN bulletins_paie b ON r.bulletin_paie_id = b.id
      JOIN periodes_paie p ON b.periode_paie_id = p.id
      WHERE r.avance_id = ?
      ORDER BY r.date_remboursement DESC
    `).all(avanceId);
    
    return repayments;
  } catch (error) {
    console.error('Error fetching advance repayments:', error);
    throw error;
  }
});

// ============================================================================
// OHADA PAYROLL TRACKING HANDLERS - Salaires Impayés & Charges Sociales
// ============================================================================

// Get unpaid salaries with filters
ipcMain.handle('db-get-salaires-impayes', async (event, filters = {}) => {
  try {
    console.log('getSalairesImpayes called with filters:', filters);
    
    // Simple approach: build query based on what filters are provided
    if (filters.employe_id && !filters.statut && !filters.periode_paie_id && !filters.date_echeance_avant) {
      // Most common case: just get by employee ID
      const query = `
        SELECT s.*, 
               e.matricule, e.nom_complet, e.categorie,
               p.mois, p.annee, p.statut as periode_statut
        FROM salaires_impayes s
        LEFT JOIN employees_gas e ON s.employe_id = e.id
        LEFT JOIN periodes_paie p ON s.periode_paie_id = p.id
        WHERE s.employe_id = ?
        ORDER BY s.date_echeance ASC, s.nom_complet ASC
      `;
      console.log('Using simple employee query');
      const result = db.prepare(query).all(filters.employe_id);
      console.log('Query executed successfully, returned', result.length, 'records');
      return result;
    }
    
    // Fallback to dynamic query for other cases
    let query = `
      SELECT s.*, 
             e.matricule, e.nom_complet, e.categorie,
             p.mois, p.annee, p.statut as periode_statut
      FROM salaires_impayes s
      LEFT JOIN employees_gas e ON s.employe_id = e.id
      LEFT JOIN periodes_paie p ON s.periode_paie_id = p.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.statut) {
      query += ' AND s.statut = ?';
      params.push(filters.statut);
    }

    if (filters.employe_id) {
      query += ' AND s.employe_id = ?';
      params.push(filters.employe_id);
    }

    if (filters.periode_paie_id) {
      query += ' AND s.periode_paie_id = ?';
      params.push(filters.periode_paie_id);
    }

    if (filters.date_echeance_avant) {
      query += ' AND s.date_echeance <= ?';
      params.push(filters.date_echeance_avant);
    }

    query += ' ORDER BY s.date_echeance ASC, s.nom_complet ASC';

    console.log('Using dynamic query with', params.length, 'parameters');
    const result = db.prepare(query).all(...params);
    console.log('Query executed successfully, returned', result.length, 'records');
    return result;
  } catch (error) {
    console.error('Error fetching salaires impayés:', error);
    throw error;
  }
});

// Get salary payment history
ipcMain.handle('db-get-paiements-salaires', async (event, salaireImpayeId) => {
  try {
    return db.prepare(`
      SELECT p.*, c.nom_compte as compte_nom
      FROM paiements_salaires p
      LEFT JOIN comptes_tresorerie c ON p.compte_tresorerie_id = c.id
      WHERE p.salaire_impaye_id = ?
      ORDER BY p.date_paiement DESC
    `).all(salaireImpayeId);
  } catch (error) {
    console.error('Error fetching paiements salaires:', error);
    throw error;
  }
});

// Record salary payment
ipcMain.handle('db-payer-salaire', async (event, paiement) => {
  try {
    const salaireImpaye = db.prepare('SELECT * FROM salaires_impayes WHERE id = ?').get(paiement.salaire_impaye_id);
    
    if (!salaireImpaye) {
      throw new Error('Salaire impayé non trouvé');
    }

    if (paiement.montant_paye > salaireImpaye.montant_restant) {
      throw new Error('Le montant du paiement dépasse le montant restant');
    }

    const paiementId = paiement.id || crypto.randomUUID();
    
    // Insert payment record
    db.prepare(`
      INSERT INTO paiements_salaires (
        id, salaire_impaye_id, montant_paye, devise, date_paiement,
        mode_paiement, reference_paiement, compte_tresorerie_id, effectue_par, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      paiementId,
      paiement.salaire_impaye_id,
      paiement.montant_paye,
      paiement.devise || 'USD',
      paiement.date_paiement,
      paiement.mode_paiement,
      paiement.reference_paiement || null,
      paiement.compte_tresorerie_id || null,
      paiement.effectue_par || 'system',
      paiement.notes || null
    );

    // Update unpaid salary record
    const nouveauMontantPaye = salaireImpaye.montant_paye + paiement.montant_paye;
    const nouveauMontantRestant = salaireImpaye.montant_net_du - nouveauMontantPaye;
    const nouveauStatut = nouveauMontantRestant === 0 ? 'PAYE_TOTAL' : 
                         nouveauMontantPaye > 0 ? 'PAYE_PARTIEL' : 'IMPAYE';

    db.prepare(`
      UPDATE salaires_impayes
      SET montant_paye = ?, montant_restant = ?, statut = ?, modifie_le = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(nouveauMontantPaye, nouveauMontantRestant, nouveauStatut, paiement.salaire_impaye_id);

    // Update bulletin de paie status
    if (nouveauStatut === 'PAYE_TOTAL') {
      db.prepare(`
        UPDATE bulletins_paie
        SET statut = 'PAYE', date_paiement = ?, mode_paiement = ?, reference_paiement = ?
        WHERE id = ?
      `).run(
        paiement.date_paiement,
        paiement.mode_paiement,
        paiement.reference_paiement,
        salaireImpaye.bulletin_paie_id
      );
    }

    // Update treasury account if specified
    if (paiement.compte_tresorerie_id) {
      const compte = db.prepare('SELECT solde_actuel FROM comptes_tresorerie WHERE id = ?').get(paiement.compte_tresorerie_id);
      const soldeAvant = compte?.solde_actuel || 0;
      const soldeApres = soldeAvant - paiement.montant_paye;

      db.prepare('UPDATE comptes_tresorerie SET solde_actuel = ? WHERE id = ?')
        .run(soldeApres, paiement.compte_tresorerie_id);

      // Record treasury movement
      const mouvementId = crypto.randomUUID();
      db.prepare(`
        INSERT INTO mouvements_tresorerie (
          id, compte_tresorerie_id, date_mouvement, type_mouvement, montant, devise,
          libelle, type_source, source_id, solde_avant, solde_apres
        ) VALUES (?, ?, ?, 'SORTIE', ?, ?, ?, 'PAIEMENT_SALAIRE', ?, ?, ?)
      `).run(
        mouvementId,
        paiement.compte_tresorerie_id,
        paiement.date_paiement,
        paiement.montant_paye,
        paiement.devise || 'USD',
        `Paiement salaire - ${salaireImpaye.nom_complet}`,
        paiementId,
        soldeAvant,
        soldeApres
      );
    }

    return { success: true, id: paiementId };
  } catch (error) {
    console.error('Error recording salary payment:', error);
    throw error;
  }
});

// Get social charges due
ipcMain.handle('db-get-charges-sociales-dues', async (event, filters = {}) => {
  try {
    let query = `
      SELECT c.*, p.mois, p.annee, p.statut as periode_statut
      FROM charges_sociales_dues c
      LEFT JOIN periodes_paie p ON c.periode_paie_id = p.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.statut) {
      query += ' AND c.statut = ?';
      params.push(filters.statut);
    }

    if (filters.organisme) {
      query += ' AND c.organisme = ?';
      params.push(filters.organisme);
    }

    if (filters.periode_paie_id) {
      query += ' AND c.periode_paie_id = ?';
      params.push(filters.periode_paie_id);
    }

    if (filters.annee) {
      query += ' AND c.annee_reference = ?';
      params.push(filters.annee);
    }

    query += ' ORDER BY c.date_echeance ASC, c.organisme ASC';

    return db.prepare(query).all(...params);
  } catch (error) {
    console.error('Error fetching charges sociales dues:', error);
    throw error;
  }
});

// Get social charges payment history
ipcMain.handle('db-get-paiements-charges-sociales', async (event, chargeSocialeId) => {
  try {
    return db.prepare(`
      SELECT p.*, c.nom_compte as compte_nom
      FROM paiements_charges_sociales p
      LEFT JOIN comptes_tresorerie c ON p.compte_tresorerie_id = c.id
      WHERE p.charge_sociale_id = ?
      ORDER BY p.date_paiement DESC
    `).all(chargeSocialeId);
  } catch (error) {
    console.error('Error fetching paiements charges sociales:', error);
    throw error;
  }
});

// Record social charges payment
ipcMain.handle('db-payer-charge-sociale', async (event, paiement) => {
  try {
    const chargeSociale = db.prepare('SELECT * FROM charges_sociales_dues WHERE id = ?').get(paiement.charge_sociale_id);
    
    if (!chargeSociale) {
      throw new Error('Charge sociale non trouvée');
    }

    if (paiement.montant_paye > chargeSociale.montant_restant) {
      throw new Error('Le montant du paiement dépasse le montant restant');
    }

    const paiementId = paiement.id || crypto.randomUUID();
    
    // Insert payment record
    db.prepare(`
      INSERT INTO paiements_charges_sociales (
        id, charge_sociale_id, montant_paye, devise, date_paiement,
        mode_paiement, reference_paiement, numero_bordereau, compte_tresorerie_id, effectue_par, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      paiementId,
      paiement.charge_sociale_id,
      paiement.montant_paye,
      paiement.devise || 'USD',
      paiement.date_paiement,
      paiement.mode_paiement,
      paiement.reference_paiement || null,
      paiement.numero_bordereau || null,
      paiement.compte_tresorerie_id || null,
      paiement.effectue_par || 'system',
      paiement.notes || null
    );

    // Update social charge record
    const nouveauMontantPaye = chargeSociale.montant_paye + paiement.montant_paye;
    const nouveauMontantRestant = chargeSociale.montant_du - nouveauMontantPaye;
    const nouveauStatut = nouveauMontantRestant === 0 ? 'PAYE_TOTAL' : 
                         nouveauMontantPaye > 0 ? 'PAYE_PARTIEL' : 'IMPAYE';

    db.prepare(`
      UPDATE charges_sociales_dues
      SET montant_paye = ?, montant_restant = ?, statut = ?, modifie_le = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(nouveauMontantPaye, nouveauMontantRestant, nouveauStatut, paiement.charge_sociale_id);

    // Update treasury account if specified
    if (paiement.compte_tresorerie_id) {
      const compte = db.prepare('SELECT solde_actuel FROM comptes_tresorerie WHERE id = ?').get(paiement.compte_tresorerie_id);
      const soldeAvant = compte?.solde_actuel || 0;
      const soldeApres = soldeAvant - paiement.montant_paye;

      db.prepare('UPDATE comptes_tresorerie SET solde_actuel = ? WHERE id = ?')
        .run(soldeApres, paiement.compte_tresorerie_id);

      // Record treasury movement
      const mouvementId = crypto.randomUUID();
      db.prepare(`
        INSERT INTO mouvements_tresorerie (
          id, compte_tresorerie_id, date_mouvement, type_mouvement, montant, devise,
          libelle, type_source, source_id, solde_avant, solde_apres
        ) VALUES (?, ?, ?, 'SORTIE', ?, ?, ?, 'PAIEMENT_CHARGE_SOCIALE', ?, ?, ?)
      `).run(
        mouvementId,
        paiement.compte_tresorerie_id,
        paiement.date_paiement,
        paiement.montant_paye,
        paiement.devise || 'USD',
        `Paiement ${chargeSociale.organisme} - ${chargeSociale.mois_reference}/${chargeSociale.annee_reference}`,
        paiementId,
        soldeAvant,
        soldeApres
      );
    }

    return { success: true, id: paiementId };
  } catch (error) {
    console.error('Error recording social charge payment:', error);
    throw error;
  }
});

// Get OHADA payroll summary
ipcMain.handle('db-get-ohada-payroll-summary', async (event, filters = {}) => {
  try {
    const summary = {
      salaires_impayes: {
        total: 0,
        impaye: 0,
        paye_partiel: 0,
        paye_total: 0
      },
      charges_sociales: {
        cnss: { du: 0, paye: 0, restant: 0 },
        onem: { du: 0, paye: 0, restant: 0 },
        inpp: { du: 0, paye: 0, restant: 0 },
        ipr: { du: 0, paye: 0, restant: 0 }
      }
    };

    // Get unpaid salaries summary
    let salaireQuery = 'SELECT statut, SUM(montant_restant) as total FROM salaires_impayes WHERE 1=1';
    const salaireParams = [];

    if (filters.periode_paie_id) {
      salaireQuery += ' AND periode_paie_id = ?';
      salaireParams.push(filters.periode_paie_id);
    }

    salaireQuery += ' GROUP BY statut';

    const salaireStats = db.prepare(salaireQuery).all(...salaireParams);
    salaireStats.forEach(stat => {
      summary.salaires_impayes[stat.statut.toLowerCase()] = stat.total;
      summary.salaires_impayes.total += stat.total;
    });

    // Get social charges summary
    let chargeQuery = 'SELECT organisme, SUM(montant_du) as du, SUM(montant_paye) as paye, SUM(montant_restant) as restant FROM charges_sociales_dues WHERE 1=1';
    const chargeParams = [];

    if (filters.periode_paie_id) {
      chargeQuery += ' AND periode_paie_id = ?';
      chargeParams.push(filters.periode_paie_id);
    }

    chargeQuery += ' GROUP BY organisme';

    const chargeStats = db.prepare(chargeQuery).all(...chargeParams);
    chargeStats.forEach(stat => {
      const org = stat.organisme.toLowerCase();
      summary.charges_sociales[org] = {
        du: stat.du,
        paye: stat.paye,
        restant: stat.restant
      };
    });

    return summary;
  } catch (error) {
    console.error('Error fetching OHADA payroll summary:', error);
    throw error;
  }
});

// ============================================================================
// OHADA ACCOUNTING ENTRIES HANDLERS
// ============================================================================

// Create accounting entry with lines
ipcMain.handle('db-create-ecriture-comptable', async (event, { ecriture, lignes }) => {
  try {
    const ecritureId = ecriture.id || crypto.randomUUID();
    
    // Insert main entry
    db.prepare(`
      INSERT INTO ecritures_comptables (
        id, date_ecriture, numero_piece, libelle, type_operation, source_id,
        montant_total, devise, statut, cree_par
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      ecritureId,
      ecriture.date_ecriture,
      ecriture.numero_piece,
      ecriture.libelle,
      ecriture.type_operation,
      ecriture.source_id,
      ecriture.montant_total,
      ecriture.devise || 'USD',
      ecriture.statut || 'BROUILLON',
      ecriture.cree_par
    );
    
    // Insert lines
    for (const ligne of lignes) {
      const ligneId = ligne.id || crypto.randomUUID();
      db.prepare(`
        INSERT INTO lignes_ecritures (
          id, ecriture_id, compte_comptable, libelle_compte, sens, montant, devise, tiers_id, tiers_nom
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        ligneId,
        ecritureId,
        ligne.compte_comptable,
        ligne.libelle_compte,
        ligne.sens,
        ligne.montant,
        ligne.devise || 'USD',
        ligne.tiers_id,
        ligne.tiers_nom
      );
    }
    
    return { success: true, id: ecritureId };
  } catch (error) {
    console.error('Error creating accounting entry:', error);
    throw error;
  }
});

// Get accounting entries with filters
ipcMain.handle('db-get-ecritures-comptables', async (event, filters = {}) => {
  try {
    let query = 'SELECT * FROM ecritures_comptables WHERE 1=1';
    const params = [];
    
    if (filters.date_debut) {
      query += ' AND date_ecriture >= ?';
      params.push(filters.date_debut);
    }
    
    if (filters.date_fin) {
      query += ' AND date_ecriture <= ?';
      params.push(filters.date_fin);
    }
    
    if (filters.type_operation) {
      query += ' AND type_operation = ?';
      params.push(filters.type_operation);
    }
    
    if (filters.statut) {
      query += ' AND statut = ?';
      params.push(filters.statut);
    }
    
    query += ' ORDER BY date_ecriture DESC, cree_le DESC';
    
    return db.prepare(query).all(...params);
  } catch (error) {
    console.error('Error fetching accounting entries:', error);
    throw error;
  }
});

// Get accounting entry lines
ipcMain.handle('db-get-lignes-ecriture', async (event, ecritureId) => {
  try {
    return db.prepare(`
      SELECT l.*, p.libelle as compte_libelle_complet
      FROM lignes_ecritures l
      LEFT JOIN plan_comptable p ON l.compte_comptable = p.code_compte
      WHERE l.ecriture_id = ?
      ORDER BY l.sens DESC, l.compte_comptable
    `).all(ecritureId);
  } catch (error) {
    console.error('Error fetching entry lines:', error);
    throw error;
  }
});

// Validate accounting entry
ipcMain.handle('db-valider-ecriture', async (event, { ecritureId, valide_par }) => {
  try {
    db.prepare(`
      UPDATE ecritures_comptables
      SET statut = 'VALIDE', valide_par = ?, date_validation = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(valide_par, ecritureId);
    
    return { success: true };
  } catch (error) {
    console.error('Error validating entry:', error);
    throw error;
  }
});

// Get grand livre (general ledger) by account
ipcMain.handle('db-get-grand-livre', async (event, filters = {}) => {
  try {
    let query = `
      SELECT 
        l.compte_comptable,
        p.libelle as compte_libelle,
        p.type_compte,
        e.date_ecriture,
        e.numero_piece,
        e.libelle as ecriture_libelle,
        l.sens,
        l.montant,
        l.devise,
        l.tiers_nom
      FROM lignes_ecritures l
      JOIN ecritures_comptables e ON l.ecriture_id = e.id
      LEFT JOIN plan_comptable p ON l.compte_comptable = p.code_compte
      WHERE e.statut = 'VALIDE'
    `;
    const params = [];
    
    if (filters.compte_comptable) {
      query += ' AND l.compte_comptable = ?';
      params.push(filters.compte_comptable);
    }
    
    if (filters.date_debut) {
      query += ' AND e.date_ecriture >= ?';
      params.push(filters.date_debut);
    }
    
    if (filters.date_fin) {
      query += ' AND e.date_ecriture <= ?';
      params.push(filters.date_fin);
    }
    
    query += ' ORDER BY l.compte_comptable, e.date_ecriture, e.cree_le';
    
    return db.prepare(query).all(...params);
  } catch (error) {
    console.error('Error fetching grand livre:', error);
    throw error;
  }
});

// Get balance sheet data (Bilan OHADA)
ipcMain.handle('db-get-bilan-ohada', async (event, { date_fin }) => {
  try {
    const query = `
      SELECT 
        l.compte_comptable,
        p.libelle,
        p.type_compte,
        SUM(CASE WHEN l.sens = 'DEBIT' THEN l.montant ELSE 0 END) as total_debit,
        SUM(CASE WHEN l.sens = 'CREDIT' THEN l.montant ELSE 0 END) as total_credit
      FROM lignes_ecritures l
      JOIN ecritures_comptables e ON l.ecriture_id = e.id
      LEFT JOIN plan_comptable p ON l.compte_comptable = p.code_compte
      WHERE e.statut = 'VALIDE' AND e.date_ecriture <= ?
      GROUP BY l.compte_comptable, p.libelle, p.type_compte
      ORDER BY l.compte_comptable
    `;
    
    return db.prepare(query).all(date_fin);
  } catch (error) {
    console.error('Error fetching bilan:', error);
    throw error;
  }
});

// ============================================================================
// ENHANCED DEDUCTIONS SYSTEM - API HANDLERS
// ============================================================================

// Get deduction types
ipcMain.handle('db-get-deduction-types', async (event, filters = {}) => {
  try {
    let query = 'SELECT * FROM deduction_types WHERE is_active = 1';
    const params = [];
    
    if (filters.code) {
      query += ' AND code = ?';
      params.push(filters.code);
    }
    
    query += ' ORDER BY priority_order, nom';
    
    return db.prepare(query).all(...params);
  } catch (error) {
    console.error('Error fetching deduction types:', error);
    throw error;
  }
});

// Create employee deduction
ipcMain.handle('db-create-deduction', async (event, deduction) => {
  try {
    const id = deduction.id || crypto.randomUUID();
    
    // Get deduction type for validation
    const deductionType = db.prepare('SELECT * FROM deduction_types WHERE id = ?').get(deduction.deduction_type_id);
    if (!deductionType) {
      throw new Error('Type de déduction non trouvé');
    }
    
    // Calculate installment amount if needed
    let installmentAmount = deduction.installment_amount;
    if (deduction.schedule_type === 'INSTALLMENTS' && deduction.number_of_installments > 0) {
      installmentAmount = Math.round((deduction.total_amount / deduction.number_of_installments) * 100) / 100;
    }
    
    // Create deduction record
    const stmt = db.prepare(`
      INSERT INTO employee_deductions (
        id, employe_id, deduction_type_id, source_type, source_id,
        title, total_amount, amount_remaining, schedule_type,
        installment_amount, number_of_installments, start_date, end_date,
        next_deduction_date, status, max_per_period, skip_periods, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      id,
      deduction.employe_id,
      deduction.deduction_type_id,
      deduction.source_type || 'MANUAL',
      deduction.source_id || null,
      deduction.title,
      deduction.total_amount,
      deduction.total_amount, // amount_remaining starts as total
      deduction.schedule_type,
      installmentAmount,
      deduction.number_of_installments || 1,
      deduction.start_date,
      deduction.end_date || null,
      deduction.start_date, // next_deduction_date starts as start_date
      'ACTIVE',
      deduction.max_per_period || null,
      deduction.skip_periods ? JSON.stringify(deduction.skip_periods) : null,
      deduction.created_by || 'system'
    );
    
    // Generate schedule if needed
    if (deduction.schedule_type === 'INSTALLMENTS' || deduction.schedule_type === 'CUSTOM') {
      await generateDeductionSchedule(id, deduction);
    }
    
    return { success: true, id };
  } catch (error) {
    console.error('Error creating deduction:', error);
    throw error;
  }
});

// Get employee deductions
ipcMain.handle('db-get-employee-deductions', async (event, { employe_id, filters = {} } = {}) => {
  try {
    let query = `
      SELECT ed.*, dt.nom as type_nom, dt.code as type_code, dt.priority_order,
             eg.nom_complet as employe_nom,
             ed.number_of_installments as installments,
             dt.description as description
      FROM employee_deductions ed
      JOIN deduction_types dt ON ed.deduction_type_id = dt.id
      JOIN employees_gas eg ON ed.employe_id = eg.id
    `;
    const params = [];
    
    // If employe_id is provided, filter by employee
    if (employe_id) {
      query += ' WHERE ed.employe_id = ?';
      params.push(employe_id);
    } else {
      query += ' WHERE 1=1'; // Always true condition for additional filters
    }
    
    if (filters.status) {
      query += ' AND ed.status = ?';
      params.push(filters.status);
    }
    
    if (filters.source_type) {
      query += ' AND ed.source_type = ?';
      params.push(filters.source_type);
    }
    
    query += ' ORDER BY dt.priority_order, ed.created_at DESC';
    
    return db.prepare(query).all(...params);
  } catch (error) {
    console.error('Error fetching employee deductions:', error);
    throw error;
  }
});

// Calculate deductions for payroll period
ipcMain.handle('db-calculate-period-deductions', async (event, { periode_paie_id, mois, annee }) => {
  try {
    // Get all active employees for the period
    const employees = db.prepare(`
      SELECT DISTINCT bp.employe_id, bp.salaire_net
      FROM bulletins_paie bp
      WHERE bp.periode_paie_id = ?
    `).all(periode_paie_id);
    
    const deductionResults = [];
    
    for (const employee of employees) {
      // Get active deductions for this employee
      const deductions = db.prepare(`
        SELECT ed.*, dt.priority_order, dt.max_percentage_salary
        FROM employee_deductions ed
        JOIN deduction_types dt ON ed.deduction_type_id = dt.id
        WHERE ed.employe_id = ? AND ed.status = 'ACTIVE'
        AND (ed.end_date IS NULL OR ed.end_date >= ?)
        ORDER BY dt.priority_order
      `).all(employee.employe_id, `${annee}-${String(mois).padStart(2, '0')}-01`);
      
      let availableSalary = employee.salaire_net;
      const employeeDeductions = [];
      
      for (const deduction of deductions) {
        // Check if there's a scheduled amount for this period
        const scheduledDeduction = db.prepare(`
          SELECT * FROM deduction_schedule
          WHERE deduction_id = ? AND period_year = ? AND period_month = ?
        `).get(deduction.id, annee, mois);
        
        let scheduledAmount = 0;
        if (scheduledDeduction) {
          scheduledAmount = scheduledDeduction.scheduled_amount;
        } else if (deduction.schedule_type === 'INSTALLMENTS' && deduction.installment_amount > 0) {
          scheduledAmount = deduction.installment_amount;
        } else if (deduction.schedule_type === 'ONE_TIME' && deduction.amount_remaining > 0) {
          scheduledAmount = deduction.amount_remaining;
        }
        
        if (scheduledAmount > 0) {
          // Apply constraints
          const maxPerPeriod = deduction.max_per_period || scheduledAmount;
          const maxByPercentage = deduction.max_percentage_salary 
            ? employee.salaire_net * deduction.max_percentage_salary 
            : scheduledAmount;
          
          const maxAllowed = Math.min(scheduledAmount, maxPerPeriod, maxByPercentage, availableSalary);
          const actualAmount = Math.max(0, maxAllowed);
          
          if (actualAmount > 0) {
            employeeDeductions.push({
              deduction_id: deduction.id,
              employe_id: employee.employe_id,
              type_code: deduction.source_type || 'OTHER',
              scheduled_amount: scheduledAmount,
              actual_amount: actualAmount,
              shortfall: scheduledAmount - actualAmount,
              title: deduction.title
            });
            
            availableSalary -= actualAmount;
          }
        }
      }
      
      if (employeeDeductions.length > 0) {
        deductionResults.push({
          employe_id: employee.employe_id,
          deductions: employeeDeductions,
          total_deductions: employeeDeductions.reduce((sum, d) => sum + d.actual_amount, 0)
        });
      }
    }
    
    return deductionResults;
  } catch (error) {
    console.error('Error calculating period deductions:', error);
    throw error;
  }
});

// Apply deductions to payroll period
ipcMain.handle('db-apply-period-deductions', async (event, { periode_paie_id, mois, annee, deductions }) => {
  try {
    const transaction = db.transaction(() => {
      for (const employeeDeduction of deductions) {
        const { employe_id, deductions: empDeductions } = employeeDeduction;
        
        // Get the payslip for this employee
        const payslip = db.prepare(`
          SELECT id FROM bulletins_paie 
          WHERE periode_paie_id = ? AND employe_id = ?
        `).get(periode_paie_id, employe_id);
        
        if (!payslip) continue;
        
        let totalDisciplinary = 0;
        let totalUniform = 0;
        let totalContribution = 0;
        let totalOther = 0;
        
        for (const deduction of empDeductions) {
          // Create deduction history record
          const historyId = crypto.randomUUID();
          db.prepare(`
            INSERT INTO deduction_history (
              id, deduction_id, bulletin_paie_id, amount_deducted,
              period_year, period_month, deduction_date, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            historyId,
            deduction.deduction_id,
            payslip.id,
            deduction.actual_amount,
            annee,
            mois,
            new Date().toISOString().split('T')[0],
            'APPLIED'
          );
          
          // Update deduction balance
          db.prepare(`
            UPDATE employee_deductions 
            SET amount_deducted = amount_deducted + ?,
                amount_remaining = amount_remaining - ?,
                installments_completed = installments_completed + 1,
                modified_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `).run(deduction.actual_amount, deduction.actual_amount, deduction.deduction_id);
          
          // Update schedule status if exists
          db.prepare(`
            UPDATE deduction_schedule 
            SET actual_amount = ?, status = 'APPLIED', applied_date = ?
            WHERE deduction_id = ? AND period_year = ? AND period_month = ?
          `).run(
            deduction.actual_amount,
            new Date().toISOString().split('T')[0],
            deduction.deduction_id,
            annee,
            mois
          );
          
          // Categorize deductions
          switch (deduction.type_code) {
            case 'DISCIPLINARY':
              totalDisciplinary += deduction.actual_amount;
              break;
            case 'UNIFORM':
              totalUniform += deduction.actual_amount;
              break;
            case 'CONTRIBUTION':
              totalContribution += deduction.actual_amount;
              break;
            default:
              totalOther += deduction.actual_amount;
          }
        }
        
        // Update payslip with detailed deductions
        const totalDeductions = totalDisciplinary + totalUniform + totalContribution + totalOther;
        db.prepare(`
          UPDATE bulletins_paie 
          SET deductions_disciplinaires = ?,
              deductions_uniformes = ?,
              deductions_contributions = ?,
              deductions_autres = ?,
              total_deductions_detail = ?,
              autres_retenues = autres_retenues + ?,
              total_retenues = total_retenues + ?,
              salaire_net = salaire_net - ?
          WHERE id = ?
        `).run(
          totalDisciplinary,
          totalUniform,
          totalContribution,
          totalOther,
          totalDeductions,
          totalDeductions,
          totalDeductions,
          totalDeductions,
          payslip.id
        );
        
        // Mark completed deductions
        db.prepare(`
          UPDATE employee_deductions 
          SET status = 'COMPLETED'
          WHERE employe_id = ? AND amount_remaining <= 0
        `).run(employe_id);
      }
    });
    
    transaction();
    return { success: true };
  } catch (error) {
    console.error('Error applying period deductions:', error);
    throw error;
  }
});

// Update deduction
ipcMain.handle('db-update-deduction', async (event, { deduction_id, updates }) => {
  try {
    const allowedFields = [
      'title', 'total_amount', 'schedule_type', 'installment_amount',
      'number_of_installments', 'start_date', 'end_date', 'status',
      'max_per_period', 'skip_periods'
    ];
    
    const updateFields = [];
    const params = [];
    
    for (const [field, value] of Object.entries(updates)) {
      if (allowedFields.includes(field)) {
        updateFields.push(`${field} = ?`);
        params.push(field === 'skip_periods' && Array.isArray(value) ? JSON.stringify(value) : value);
      }
    }
    
    if (updateFields.length === 0) {
      throw new Error('Aucun champ valide à mettre à jour');
    }
    
    updateFields.push('modified_at = CURRENT_TIMESTAMP');
    params.push(deduction_id);
    
    const query = `UPDATE employee_deductions SET ${updateFields.join(', ')} WHERE id = ?`;
    db.prepare(query).run(...params);
    
    return { success: true };
  } catch (error) {
    console.error('Error updating deduction:', error);
    throw error;
  }
});

// Cancel deduction
ipcMain.handle('db-cancel-deduction', async (event, { deduction_id, reason }) => {
  try {
    db.prepare(`
      UPDATE employee_deductions 
      SET status = 'CANCELLED', modified_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(deduction_id);
    
    // Cancel pending schedules
    db.prepare(`
      UPDATE deduction_schedule 
      SET status = 'SKIPPED', notes = ?
      WHERE deduction_id = ? AND status = 'PENDING'
    `).run(reason || 'Déduction annulée', deduction_id);
    
    return { success: true };
  } catch (error) {
    console.error('Error cancelling deduction:', error);
    throw error;
  }
});

// Get deduction history
ipcMain.handle('db-get-deduction-history', async (event, { deduction_id }) => {
  try {
    const history = db.prepare(`
      SELECT dh.*, bp.periode_paie_id, pp.mois, pp.annee
      FROM deduction_history dh
      JOIN bulletins_paie bp ON dh.bulletin_paie_id = bp.id
      JOIN periodes_paie pp ON bp.periode_paie_id = pp.id
      WHERE dh.deduction_id = ?
      ORDER BY dh.period_year DESC, dh.period_month DESC
    `).all(deduction_id);
    
    return history;
  } catch (error) {
    console.error('Error fetching deduction history:', error);
    throw error;
  }
});

// Helper function to generate deduction schedule
async function generateDeductionSchedule(deductionId, deduction) {
  try {
    if (deduction.schedule_type !== 'INSTALLMENTS') return;
    
    const startDate = new Date(deduction.start_date);
    const skipPeriods = deduction.skip_periods || [];
    const installmentAmount = Math.round((deduction.total_amount / deduction.number_of_installments) * 100) / 100;
    const remainder = deduction.total_amount - (installmentAmount * deduction.number_of_installments);
    
    const scheduleRecords = [];
    let currentDate = new Date(startDate);
    
    for (let i = 0; i < deduction.number_of_installments; i++) {
      // Skip periods if specified
      const periodKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      while (skipPeriods.includes(periodKey)) {
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
      
      const amount = i === 0 ? installmentAmount + remainder : installmentAmount;
      
      scheduleRecords.push({
        id: crypto.randomUUID(),
        deduction_id: deductionId,
        period_year: currentDate.getFullYear(),
        period_month: currentDate.getMonth() + 1,
        scheduled_amount: amount,
        status: 'PENDING'
      });
      
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    // Insert schedule records
    const insertStmt = db.prepare(`
      INSERT INTO deduction_schedule (id, deduction_id, period_year, period_month, scheduled_amount, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    for (const record of scheduleRecords) {
      insertStmt.run(
        record.id,
        record.deduction_id,
        record.period_year,
        record.period_month,
        record.scheduled_amount,
        record.status
      );
    }
  } catch (error) {
    console.error('Error generating deduction schedule:', error);
    throw error;
  }
}

app.whenReady().then(() => {
  initDatabase();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (db) {
      db.close();
    }
    app.quit();
  }
});

// IPC handlers for database operations
ipcMain.handle('db-get-employees', async () => {
  try {
    const stmt = db.prepare(`
      SELECT e.*, 
             GROUP_CONCAT(c.id || '|' || c.name || '|' || c.status || '|' || c.expiry_date) as certifications
      FROM employees e
      LEFT JOIN certifications c ON e.id = c.employee_id
      GROUP BY e.id
      ORDER BY e.last_name, e.first_name
    `);
    const rows = stmt.all();
    
    return rows.map(row => ({
      id: row.id,
      employeeNumber: row.employee_number,
      personalInfo: {
        firstName: row.first_name,
        lastName: row.last_name,
        email: row.email,
        phone: row.phone,
        dateOfBirth: row.date_of_birth,
        nationalId: row.national_id,
        address: {
          street: row.address_street,
          city: row.address_city,
          state: row.address_state,
          zipCode: row.address_zip_code
        },
        emergencyContact: {
          name: row.emergency_contact_name,
          relationship: row.emergency_contact_relationship,
          phone: row.emergency_contact_phone
        },
        photo: row.photo
      },
      employment: {
        dateHired: row.date_hired,
        position: row.position,
        department: row.department,
        status: row.status,
        salary: row.salary,
        payrollInfo: {
          bankName: row.bank_name,
          accountNumber: row.account_number,
          routingNumber: row.routing_number
        }
      },
      certifications: row.certifications ? row.certifications.split(',').map(cert => {
        const [id, name, status, expiryDate] = cert.split('|');
        return { id, name, status, expiryDate };
      }) : [],
      documents: [],
      performanceRecords: [],
      attendanceRecords: []
    }));
  } catch (error) {
    console.error('Error fetching employees:', error);
    throw error;
  }
});

ipcMain.handle('db-add-employee', async (event, employee) => {
  try {
    const stmt = db.prepare(`
      INSERT INTO employees (
        id, employee_number, first_name, last_name, email, phone, date_of_birth,
        national_id, address_street, address_city, address_state, address_zip_code,
        emergency_contact_name, emergency_contact_relationship, emergency_contact_phone,
        photo, date_hired, position, department, status, salary, bank_name,
        account_number, routing_number
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      employee.id,
      employee.employeeNumber,
      employee.personalInfo.firstName,
      employee.personalInfo.lastName,
      employee.personalInfo.email,
      employee.personalInfo.phone,
      employee.personalInfo.dateOfBirth,
      employee.personalInfo.nationalId,
      employee.personalInfo.address.street,
      employee.personalInfo.address.city,
      employee.personalInfo.address.state,
      employee.personalInfo.address.zipCode,
      employee.personalInfo.emergencyContact.name,
      employee.personalInfo.emergencyContact.relationship,
      employee.personalInfo.emergencyContact.phone,
      employee.personalInfo.photo,
      employee.employment.dateHired,
      employee.employment.position,
      employee.employment.department,
      employee.employment.status,
      employee.employment.salary,
      employee.employment.payrollInfo.bankName,
      employee.employment.payrollInfo.accountNumber,
      employee.employment.payrollInfo.routingNumber
    );
    
    return { success: true, id: employee.id };
  } catch (error) {
    console.error('Error adding employee:', error);
    throw error;
  }
});

ipcMain.handle('db-get-clients', async () => {
  try {
    const stmt = db.prepare(`
      SELECT c.*,
             GROUP_CONCAT(s.id) as site_ids
      FROM clients c
      LEFT JOIN sites s ON c.id = s.client_id
      GROUP BY c.id
      ORDER BY c.name
    `);
    const rows = stmt.all();
    
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      type: row.type,
      contactInfo: {
        primaryContact: row.primary_contact,
        email: row.email,
        phone: row.phone,
        address: {
          street: row.address_street,
          city: row.address_city,
          state: row.address_state,
          zipCode: row.address_zip_code
        }
      },
      contract: {
        startDate: row.contract_start_date,
        endDate: row.contract_end_date,
        serviceLevel: row.service_level,
        hourlyRate: row.hourly_rate,
        billingCycle: row.billing_cycle,
        paymentTerms: row.payment_terms
      },
      status: row.status,
      sites: row.site_ids ? row.site_ids.split(',') : [],
      totalValue: row.total_value,
      createdDate: row.created_date
    }));
  } catch (error) {
    console.error('Error fetching clients:', error);
    throw error;
  }
});

ipcMain.handle('db-get-sites', async () => {
  try {
    const stmt = db.prepare(`
      SELECT s.*,
             GROUP_CONCAT(sa.employee_id) as assigned_guard_ids
      FROM sites s
      LEFT JOIN site_assignments sa ON s.id = sa.site_id AND sa.status = 'active'
      GROUP BY s.id
      ORDER BY s.name
    `);
    const rows = stmt.all();
    
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      clientId: row.client_id,
      location: {
        address: row.address,
        city: row.city,
        state: row.state,
        zipCode: row.zip_code,
        coordinates: {
          lat: row.latitude || 0,
          lng: row.longitude || 0
        }
      },
      siteDetails: {
        type: row.site_type,
        size: row.size,
        accessPoints: row.access_points ? row.access_points.split(',') : [],
        specialInstructions: row.special_instructions,
        emergencyProcedures: row.emergency_procedures,
        patrolRoutes: []
      },
      securityRequirements: {
        guardsRequired: row.guards_required,
        shiftPattern: row.shift_pattern,
        specialEquipment: row.special_equipment ? row.special_equipment.split(',') : [],
        certificationRequired: row.certification_required ? row.certification_required.split(',') : []
      },
      status: row.status,
      assignedGuards: row.assigned_guard_ids ? row.assigned_guard_ids.split(',') : []
    }));
  } catch (error) {
    console.error('Error fetching sites:', error);
    throw error;
  }
});

ipcMain.handle('db-get-dashboard-stats', async () => {
  try {
    const totalEmployees = db.prepare('SELECT COUNT(*) as count FROM employees_gas').get().count;
    const activeGuards = db.prepare("SELECT COUNT(*) as count FROM employees_gas WHERE statut = 'ACTIF' AND categorie = 'GARDE'").get().count;
    const totalClients = db.prepare("SELECT COUNT(*) as count FROM clients_gas WHERE statut != 'SUPPRIME' OR statut IS NULL").get().count;
    const activeSites = db.prepare("SELECT COUNT(*) as count FROM sites_gas WHERE est_actif = 1").get().count;
    const inactiveSites = db.prepare("SELECT COUNT(*) as count FROM sites_gas WHERE est_actif = 0").get().count;
    
    // Calculate monthly revenue from payments
    const monthlyRevenue = db.prepare("SELECT COALESCE(SUM(montant_paye), 0) as revenue FROM paiements").get().revenue || 0;
    
    // Calculate total revenue potential from active sites
    const totalRevenuePotential = db.prepare("SELECT COALESCE(SUM(tarif_mensuel_client), 0) as total FROM sites_gas WHERE est_actif = 1").get().total || 0;
    
    // Get expiring certifications (within 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    let expiringCerts = 0;
    try {
      expiringCerts = db.prepare(`
        SELECT COUNT(*) as count 
        FROM certifications 
        WHERE date(expiry_date) <= date(?) AND date(expiry_date) > date('now')
      `).get(thirtyDaysFromNow.toISOString().split('T')[0]).count;
    } catch (e) {
      // certifications table may not exist
    }
    
    return {
      totalEmployees,
      activeGuards,
      totalClients,
      activeSites,
      inactiveSites,
      monthlyRevenue: Math.round(monthlyRevenue),
      totalRevenuePotential: Math.round(totalRevenuePotential),
      pendingIncidents: 0,
      expiringCertifications: expiringCerts,
      upcomingShifts: 0
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
});

// Additional IPC handlers for CRUD operations
ipcMain.handle('db-update-employee', async (event, employee) => {
  try {
    const stmt = db.prepare(`
      UPDATE employees SET
        employee_number = ?, first_name = ?, last_name = ?, email = ?, phone = ?,
        date_of_birth = ?, national_id = ?, address_street = ?, address_city = ?,
        address_state = ?, address_zip_code = ?, emergency_contact_name = ?,
        emergency_contact_relationship = ?, emergency_contact_phone = ?, photo = ?,
        date_hired = ?, position = ?, department = ?, status = ?, salary = ?,
        bank_name = ?, account_number = ?, routing_number = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    const result = stmt.run(
      employee.employeeNumber,
      employee.personalInfo.firstName,
      employee.personalInfo.lastName,
      employee.personalInfo.email,
      employee.personalInfo.phone,
      employee.personalInfo.dateOfBirth,
      employee.personalInfo.nationalId,
      employee.personalInfo.address.street,
      employee.personalInfo.address.city,
      employee.personalInfo.address.state,
      employee.personalInfo.address.zipCode,
      employee.personalInfo.emergencyContact.name,
      employee.personalInfo.emergencyContact.relationship,
      employee.personalInfo.emergencyContact.phone,
      employee.personalInfo.photo,
      employee.employment.dateHired,
      employee.employment.position,
      employee.employment.department,
      employee.employment.status,
      employee.employment.salary,
      employee.employment.payrollInfo.bankName,
      employee.employment.payrollInfo.accountNumber,
      employee.employment.payrollInfo.routingNumber,
      employee.id
    );
    
    return { success: true };
  } catch (error) {
    console.error('Error updating employee:', error);
    throw error;
  }
});

ipcMain.handle('db-delete-employee', async (event, id) => {
  try {
    // Delete related records first
    db.prepare('DELETE FROM site_assignments WHERE employee_id = ?').run(id);
    db.prepare('DELETE FROM certifications WHERE employee_id = ?').run(id);
    db.prepare('DELETE FROM attendance_records WHERE employee_id = ?').run(id);
    
    // Delete employee
    const stmt = db.prepare('DELETE FROM employees WHERE id = ?');
    const result = stmt.run(id);
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting employee:', error);
    throw error;
  }
});

ipcMain.handle('db-add-client', async (event, client) => {
  try {
    const stmt = db.prepare(`
      INSERT INTO clients (
        id, name, type, primary_contact, email, phone, address_street, address_city,
        address_state, address_zip_code, contract_start_date, contract_end_date,
        service_level, hourly_rate, billing_cycle, payment_terms, status, total_value, created_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      client.id,
      client.name,
      client.type,
      client.contactInfo.primaryContact,
      client.contactInfo.email,
      client.contactInfo.phone,
      client.contactInfo.address.street,
      client.contactInfo.address.city,
      client.contactInfo.address.state,
      client.contactInfo.address.zipCode,
      client.contract.startDate,
      client.contract.endDate,
      client.contract.serviceLevel,
      client.contract.hourlyRate,
      client.contract.billingCycle,
      client.contract.paymentTerms,
      client.status,
      client.totalValue,
      client.createdDate
    );
    
    return { success: true, id: client.id };
  } catch (error) {
    console.error('Error adding client:', error);
    throw error;
  }
});

ipcMain.handle('db-update-client', async (event, client) => {
  try {
    const stmt = db.prepare(`
      UPDATE clients SET
        name = ?, type = ?, primary_contact = ?, email = ?, phone = ?,
        address_street = ?, address_city = ?, address_state = ?, address_zip_code = ?,
        contract_start_date = ?, contract_end_date = ?, service_level = ?, hourly_rate = ?,
        billing_cycle = ?, payment_terms = ?, status = ?, total_value = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    const result = stmt.run(
      client.name,
      client.type,
      client.contactInfo.primaryContact,
      client.contactInfo.email,
      client.contactInfo.phone,
      client.contactInfo.address.street,
      client.contactInfo.address.city,
      client.contactInfo.address.state,
      client.contactInfo.address.zipCode,
      client.contract.startDate,
      client.contract.endDate,
      client.contract.serviceLevel,
      client.contract.hourlyRate,
      client.contract.billingCycle,
      client.contract.paymentTerms,
      client.status,
      client.totalValue,
      client.id
    );
    
    return { success: true };
  } catch (error) {
    console.error('Error updating client:', error);
    throw error;
  }
});

ipcMain.handle('db-delete-client', async (event, id) => {
  try {
    // Delete related records first
    const sites = db.prepare('SELECT id FROM sites WHERE client_id = ?').all(id);
    for (const site of sites) {
      db.prepare('DELETE FROM site_assignments WHERE site_id = ?').run(site.id);
    }
    db.prepare('DELETE FROM sites WHERE client_id = ?').run(id);
    
    // Delete client
    const stmt = db.prepare('DELETE FROM clients WHERE id = ?');
    const result = stmt.run(id);
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting client:', error);
    throw error;
  }
});

ipcMain.handle('db-add-site', async (event, site) => {
  try {
    const stmt = db.prepare(`
      INSERT INTO sites (
        id, name, client_id, address, city, state, zip_code, latitude, longitude,
        site_type, size, access_points, special_instructions, emergency_procedures,
        guards_required, shift_pattern, special_equipment, certification_required, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      site.id,
      site.name,
      site.clientId,
      site.location.address,
      site.location.city,
      site.location.state,
      site.location.zipCode,
      site.location.coordinates.lat,
      site.location.coordinates.lng,
      site.siteDetails.type,
      site.siteDetails.size,
      site.siteDetails.accessPoints.join(','),
      site.siteDetails.specialInstructions,
      site.siteDetails.emergencyProcedures,
      site.securityRequirements.guardsRequired,
      site.securityRequirements.shiftPattern,
      site.securityRequirements.specialEquipment.join(','),
      site.securityRequirements.certificationRequired.join(','),
      site.status
    );
    
    return { success: true, id: site.id };
  } catch (error) {
    console.error('Error adding site:', error);
    throw error;
  }
});

ipcMain.handle('db-update-site', async (event, site) => {
  try {
    const stmt = db.prepare(`
      UPDATE sites SET
        name = ?, client_id = ?, address = ?, city = ?, state = ?, zip_code = ?,
        latitude = ?, longitude = ?, site_type = ?, size = ?, access_points = ?,
        special_instructions = ?, emergency_procedures = ?, guards_required = ?,
        shift_pattern = ?, special_equipment = ?, certification_required = ?, status = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    const result = stmt.run(
      site.name,
      site.clientId,
      site.location.address,
      site.location.city,
      site.location.state,
      site.location.zipCode,
      site.location.coordinates.lat,
      site.location.coordinates.lng,
      site.siteDetails.type,
      site.siteDetails.size,
      site.siteDetails.accessPoints.join(','),
      site.siteDetails.specialInstructions,
      site.siteDetails.emergencyProcedures,
      site.securityRequirements.guardsRequired,
      site.securityRequirements.shiftPattern,
      site.securityRequirements.specialEquipment.join(','),
      site.securityRequirements.certificationRequired.join(','),
      site.status,
      site.id
    );
    
    return { success: true };
  } catch (error) {
    console.error('Error updating site:', error);
    throw error;
  }
});

ipcMain.handle('db-delete-site', async (event, id) => {
  try {
    // Delete related records first
    db.prepare('DELETE FROM site_assignments WHERE site_id = ?').run(id);
    
    // Delete site
    const stmt = db.prepare('DELETE FROM sites WHERE id = ?');
    const result = stmt.run(id);
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting site:', error);
    throw error;
  }
});

// ============================================================================
// GUARDIAN COMMAND - IPC Handlers GAS (Conformes au schéma SQL OHADA)
// ============================================================================

// Clients GAS
ipcMain.handle('db-get-clients-gas', async (event, options) => {
  try {
    // By default, exclude deleted clients. Options can override this.
    const includeDeleted = options?.includeDeleted || false;
    const includeInactive = options?.includeInactive !== false; // Include inactive by default
    
    let whereClause = "WHERE 1=1"; // Always include all clients now, filtering by est_actif
    if (!includeInactive) {
      whereClause = "WHERE est_actif = 1";
    }
    
    const stmt = db.prepare(`
      SELECT * FROM clients_gas ${whereClause} ORDER BY nom_entreprise
    `);
    const rows = stmt.all();
    
    return rows.map(row => ({
      id: row.id,
      type_client: row.type_client,
      nom_entreprise: row.nom_entreprise,
      nif: row.nif,
      rccm: row.rccm,
      id_national: row.id_national,
      numero_contrat: row.numero_contrat,
      contrat_url: row.contrat_url,
      contact_nom: row.contact_nom,
      contact_email: row.contact_email,
      telephone: row.telephone,
      contact_urgence_nom: row.contact_urgence_nom,
      contact_urgence_telephone: row.contact_urgence_telephone,
      adresse_facturation: row.adresse_facturation,
      devise_preferee: row.devise_preferee,
      delai_paiement_jours: row.delai_paiement_jours,
      est_actif: row.est_actif === 1,
      statut: row.est_actif === 1 ? 'ACTIF' : 'INACTIF', // For backward compatibility
      cree_le: row.cree_le
    }));
  } catch (error) {
    console.error('Error fetching clients GAS:', error);
    throw error;
  }
});

// Get only active clients (for site creation)
ipcMain.handle('db-get-active-clients-gas', async () => {
  try {
    const stmt = db.prepare(`
      SELECT * FROM clients_gas WHERE est_actif = 1 ORDER BY nom_entreprise
    `);
    const rows = stmt.all();
    
    return rows.map(row => ({
      id: row.id,
      type_client: row.type_client,
      nom_entreprise: row.nom_entreprise,
      nif: row.nif,
      rccm: row.rccm,
      id_national: row.id_national,
      numero_contrat: row.numero_contrat,
      contrat_url: row.contrat_url,
      contact_nom: row.contact_nom,
      contact_email: row.contact_email,
      telephone: row.telephone,
      contact_urgence_nom: row.contact_urgence_nom,
      contact_urgence_telephone: row.contact_urgence_telephone,
      adresse_facturation: row.adresse_facturation,
      devise_preferee: row.devise_preferee,
      delai_paiement_jours: row.delai_paiement_jours,
      statut: row.statut || 'ACTIF',
      cree_le: row.cree_le
    }));
  } catch (error) {
    console.error('Error fetching active clients GAS:', error);
    throw error;
  }
});

ipcMain.handle('db-add-client-gas', async (event, client) => {
  try {
    const stmt = db.prepare(`
      INSERT INTO clients_gas (
        id, type_client, nom_entreprise, nif, rccm, id_national, numero_contrat,
        contrat_url, contact_nom, contact_email, telephone, contact_urgence_nom,
        contact_urgence_telephone, adresse_facturation, devise_preferee, delai_paiement_jours, est_actif
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      client.id,
      client.type_client,
      client.nom_entreprise,
      client.nif || null,
      client.rccm || null,
      client.id_national || null,
      client.numero_contrat || null,
      client.contrat_url || null,
      client.contact_nom || null,
      client.contact_email || null,
      client.telephone || null,
      client.contact_urgence_nom || null,
      client.contact_urgence_telephone || null,
      client.adresse_facturation || null,
      client.devise_preferee || 'USD',
      client.delai_paiement_jours || 30,
      client.est_actif !== undefined ? (client.est_actif ? 1 : 0) : 1
    );
    
    return { success: true, id: client.id };
  } catch (error) {
    console.error('Error adding client GAS:', error);
    throw error;
  }
});

ipcMain.handle('db-update-client-gas', async (event, client) => {
  try {
    const stmt = db.prepare(`
      UPDATE clients_gas SET
        type_client = ?, nom_entreprise = ?, nif = ?, rccm = ?, id_national = ?,
        numero_contrat = ?, contrat_url = ?, contact_nom = ?, contact_email = ?,
        telephone = ?, contact_urgence_nom = ?, contact_urgence_telephone = ?,
        adresse_facturation = ?, devise_preferee = ?, delai_paiement_jours = ?, est_actif = ?
      WHERE id = ?
    `);
    
    stmt.run(
      client.type_client,
      client.nom_entreprise,
      client.nif || null,
      client.rccm || null,
      client.id_national || null,
      client.numero_contrat || null,
      client.contrat_url || null,
      client.contact_nom || null,
      client.contact_email || null,
      client.telephone || null,
      client.contact_urgence_nom || null,
      client.contact_urgence_telephone || null,
      client.adresse_facturation || null,
      client.devise_preferee || 'USD',
      client.delai_paiement_jours || 30,
      client.est_actif !== undefined ? (client.est_actif ? 1 : 0) : 1,
      client.id
    );
    
    return { success: true };
  } catch (error) {
    console.error('Error updating client GAS:', error);
    throw error;
  }
});

ipcMain.handle('db-delete-client-gas', async (event, id) => {
  try {
    // Soft delete: Set client status to SUPPRIME instead of actually deleting
    // This preserves invoices for accounting reports
    db.prepare("UPDATE clients_gas SET statut = 'SUPPRIME' WHERE id = ?").run(id);
    
    // Also deactivate all sites for this client
    db.prepare('UPDATE sites_gas SET est_actif = 0 WHERE client_id = ?').run(id);
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting client GAS:', error);
    throw error;
  }
});

// Update client status (for reactivation or setting inactive)
ipcMain.handle('db-update-client-status', async (event, { id, statut }) => {
  console.log(`🚨 BACKEND: db-update-client-status called with id=${id}, statut=${statut}`);
  try {
    console.log(`🔄 Starting client status update: Client ${id} -> ${statut}`);
    
    // Convert statut to est_actif boolean value
    const est_actif = statut === 'ACTIF' ? 1 : 0;
    
    // Start a transaction to ensure data consistency
    const updateClient = db.prepare('UPDATE clients_gas SET est_actif = ? WHERE id = ?');
    const updateSites = db.prepare('UPDATE sites_gas SET est_actif = ? WHERE client_id = ?');
    const closeDeployments = db.prepare(`
      UPDATE historique_deployements 
      SET est_actif = 0, date_fin = CURRENT_TIMESTAMP 
      WHERE site_id IN (SELECT id FROM sites_gas WHERE client_id = ?) AND est_actif = 1
    `);
    const clearEmployeeSiteAssignments = db.prepare(`
      UPDATE employees_gas 
      SET site_affecte_id = NULL 
      WHERE site_affecte_id IN (SELECT id FROM sites_gas WHERE client_id = ?)
    `);
    
    // Check what we're about to affect
    const sitesToAffect = db.prepare('SELECT id, nom_site, est_actif FROM sites_gas WHERE client_id = ?').all(id);
    const deploymentsToAffect = db.prepare(`
      SELECT h.id, h.employe_id, e.nom_complet, s.nom_site 
      FROM historique_deployements h
      JOIN employees_gas e ON h.employe_id = e.id
      JOIN sites_gas s ON h.site_id = s.id
      WHERE h.est_actif = 1 AND s.client_id = ?
    `).all(id);
    const employeesToAffect = db.prepare(`
      SELECT e.id, e.nom_complet, e.site_affecte_id, s.nom_site
      FROM employees_gas e
      JOIN sites_gas s ON e.site_affecte_id = s.id
      WHERE s.client_id = ?
    `).all(id);
    
    console.log(`📊 Before update - Client ${id}:`);
    console.log(`  - Sites to affect: ${sitesToAffect.length}`, sitesToAffect);
    console.log(`  - Active deployments to close: ${deploymentsToAffect.length}`, deploymentsToAffect);
    console.log(`  - Employee assignments to clear: ${employeesToAffect.length}`, employeesToAffect);
    
    // Begin transaction
    const transaction = db.transaction(() => {
      // Update client status
      const clientResult = updateClient.run(est_actif, id);
      console.log(`✅ Client status updated: ${clientResult.changes} row(s) affected`);
      
      // If client is being deactivated, cascade the deactivation
      if (statut === 'INACTIF') {
        // 1. Deactivate all client's sites
        const sitesResult = updateSites.run(0, id); // 0 = false for est_actif
        console.log(`🏢 Sites deactivated: ${sitesResult.changes} row(s) affected`);
        
        // 2. Close all active deployments to those sites
        const deploymentsResult = closeDeployments.run(id);
        console.log(`📋 Deployments closed: ${deploymentsResult.changes} row(s) affected`);
        
        // 3. Clear site assignments for all employees assigned to those sites
        const employeesResult = clearEmployeeSiteAssignments.run(id);
        console.log(`👥 Employee assignments cleared: ${employeesResult.changes} row(s) affected`);
        
        return {
          clientUpdated: clientResult.changes,
          sitesDeactivated: sitesResult.changes,
          deploymentsClosed: deploymentsResult.changes,
          employeeAssignmentsCleared: employeesResult.changes
        };
      }
      
      return {
        clientUpdated: clientResult.changes,
        sitesDeactivated: 0,
        deploymentsClosed: 0,
        employeeAssignmentsCleared: 0
      };
    });
    
    // Execute the transaction and get results
    const results = transaction();
    
    console.log(`✅ Client ${id} status update completed:`, results);
    
    return { success: true, ...results };
  } catch (error) {
    console.error('❌ Error updating client status:', error);
    throw error;
  }
});

// Sites GAS
ipcMain.handle('db-get-sites-gas', async () => {
  try {
    const stmt = db.prepare(`
      SELECT s.*, c.nom_entreprise as client_nom, c.est_actif as client_actif
      FROM sites_gas s
      LEFT JOIN clients_gas c ON s.client_id = c.id
      ORDER BY s.nom_site
    `);
    const rows = stmt.all();
    
    return rows.map(row => ({
      id: row.id,
      client_id: row.client_id,
      nom_site: row.nom_site,
      adresse_physique: row.adresse_physique,
      latitude: row.latitude,
      longitude: row.longitude,
      effectif_jour_requis: row.effectif_jour_requis,
      effectif_nuit_requis: row.effectif_nuit_requis,
      cout_unitaire_garde: row.cout_unitaire_garde || 0,
      tarif_mensuel_client: row.tarif_mensuel_client,
      consignes_specifiques: row.consignes_specifiques,
      est_actif: row.est_actif === 1,
      client_actif: row.client_actif === 1,
      cree_le: row.cree_le,
      client: row.client_nom ? { nom_entreprise: row.client_nom } : null
    }));
  } catch (error) {
    console.error('Error fetching sites GAS:', error);
    throw error;
  }
});

ipcMain.handle('db-add-site-gas', async (event, site) => {
  try {
    const stmt = db.prepare(`
      INSERT INTO sites_gas (
        id, client_id, nom_site, adresse_physique, latitude, longitude,
        effectif_jour_requis, effectif_nuit_requis, cout_unitaire_garde,
        tarif_mensuel_client, consignes_specifiques, est_actif
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      site.id,
      site.client_id,
      site.nom_site,
      site.adresse_physique || null,
      site.latitude || null,
      site.longitude || null,
      site.effectif_jour_requis || 0,
      site.effectif_nuit_requis || 0,
      site.cout_unitaire_garde || 0,
      site.tarif_mensuel_client || 0,
      site.consignes_specifiques || null,
      site.est_actif ? 1 : 0
    );
    
    return { success: true, id: site.id };
  } catch (error) {
    console.error('Error adding site GAS:', error);
    throw error;
  }
});

ipcMain.handle('db-update-site-gas', async (event, site) => {
  try {
    const stmt = db.prepare(`
      UPDATE sites_gas SET
        client_id = ?, nom_site = ?, adresse_physique = ?, latitude = ?, longitude = ?,
        effectif_jour_requis = ?, effectif_nuit_requis = ?, cout_unitaire_garde = ?,
        tarif_mensuel_client = ?, consignes_specifiques = ?, est_actif = ?
      WHERE id = ?
    `);
    
    stmt.run(
      site.client_id,
      site.nom_site,
      site.adresse_physique || null,
      site.latitude || null,
      site.longitude || null,
      site.effectif_jour_requis || 0,
      site.effectif_nuit_requis || 0,
      site.cout_unitaire_garde || 0,
      site.tarif_mensuel_client || 0,
      site.consignes_specifiques || null,
      site.est_actif ? 1 : 0,
      site.id
    );
    
    return { success: true };
  } catch (error) {
    console.error('Error updating site GAS:', error);
    throw error;
  }
});

// Update site status (for deactivation/reactivation with deployment termination)
ipcMain.handle('db-update-site-status', async (event, { id, est_actif }) => {
  console.log(`🚨 BACKEND: db-update-site-status called with id=${id}, est_actif=${est_actif}`);
  try {
    console.log(`🔄 Starting site status update: Site ${id} -> ${est_actif ? 'ACTIF' : 'INACTIF'}`);
    
    // If trying to activate a site, check if the client is active
    if (est_actif) {
      const siteWithClient = db.prepare(`
        SELECT s.nom_site, s.client_id, c.nom_entreprise, c.est_actif as client_actif
        FROM sites_gas s
        LEFT JOIN clients_gas c ON s.client_id = c.id
        WHERE s.id = ?
      `).get(id);
      
      console.log(`🔍 Site activation check:`, siteWithClient);
      
      if (!siteWithClient) {
        throw new Error('Site non trouvé');
      }
      
      if (!siteWithClient.client_actif) {
        const errorMessage = `Impossible d'activer le site "${siteWithClient.nom_site}". Le client "${siteWithClient.nom_entreprise}" est inactif. Veuillez d'abord réactiver le client.`;
        console.log(`❌ Client validation failed: ${errorMessage}`);
        throw new Error(errorMessage);
      }
      
      console.log(`✅ Client validation passed: Client "${siteWithClient.nom_entreprise}" is active`);
    }
    
    // Start a transaction to ensure data consistency
    const updateSite = db.prepare('UPDATE sites_gas SET est_actif = ? WHERE id = ?');
    const closeDeployments = db.prepare(`
      UPDATE historique_deployements 
      SET est_actif = 0, date_fin = CURRENT_TIMESTAMP 
      WHERE site_id = ? AND est_actif = 1
    `);
    const clearEmployeeSiteAssignments = db.prepare(`
      UPDATE employees_gas 
      SET site_affecte_id = NULL 
      WHERE site_affecte_id = ?
    `);
    
    // Check what we're about to affect
    const siteInfo = db.prepare('SELECT nom_site, client_id FROM sites_gas WHERE id = ?').get(id);
    const deploymentsToAffect = db.prepare(`
      SELECT h.id, h.employe_id, e.nom_complet, s.nom_site 
      FROM historique_deployements h
      JOIN employees_gas e ON h.employe_id = e.id
      JOIN sites_gas s ON h.site_id = s.id
      WHERE h.est_actif = 1 AND h.site_id = ?
    `).all(id);
    const employeesToAffect = db.prepare(`
      SELECT e.id, e.nom_complet, e.site_affecte_id
      FROM employees_gas e
      WHERE e.site_affecte_id = ?
    `).all(id);
    
    console.log(`📊 Before update - Site ${id} (${siteInfo?.nom_site}):`);
    console.log(`  - Active deployments to close: ${deploymentsToAffect.length}`, deploymentsToAffect);
    console.log(`  - Employee assignments to clear: ${employeesToAffect.length}`, employeesToAffect);
    
    // Begin transaction
    const transaction = db.transaction(() => {
      // Update site status
      const siteResult = updateSite.run(est_actif ? 1 : 0, id);
      console.log(`✅ Site status updated: ${siteResult.changes} row(s) affected`);
      
      // If site is being deactivated, cascade the deactivation
      if (!est_actif) {
        // 1. Close all active deployments to this site
        const deploymentsResult = closeDeployments.run(id);
        console.log(`📋 Deployments closed: ${deploymentsResult.changes} row(s) affected`);
        
        // 2. Clear site assignments for all employees assigned to this site
        const employeesResult = clearEmployeeSiteAssignments.run(id);
        console.log(`👥 Employee assignments cleared: ${employeesResult.changes} row(s) affected`);
        
        return {
          siteUpdated: siteResult.changes,
          deploymentsClosed: deploymentsResult.changes,
          employeeAssignmentsCleared: employeesResult.changes
        };
      }
      
      return {
        siteUpdated: siteResult.changes,
        deploymentsClosed: 0,
        employeeAssignmentsCleared: 0
      };
    });
    
    // Execute the transaction and get results
    const results = transaction();
    
    console.log(`✅ Site ${id} status update completed:`, results);
    
    return { success: true, ...results };
  } catch (error) {
    console.error('❌ Error updating site status:', error);
    throw error;
  }
});

ipcMain.handle('db-delete-site-gas', async (event, id) => {
  try {
    // Delete related facture details first
    db.prepare('DELETE FROM factures_details WHERE site_id = ?').run(id);
    
    // Delete site
    db.prepare('DELETE FROM sites_gas WHERE id = ?').run(id);
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting site GAS:', error);
    throw error;
  }
});

// Factures GAS
ipcMain.handle('db-get-factures-gas', async () => {
  try {
    const stmt = db.prepare(`
      SELECT f.*, c.nom_entreprise as client_nom
      FROM factures_clients f
      LEFT JOIN clients_gas c ON f.client_id = c.id
      ORDER BY f.date_emission DESC
    `);
    const rows = stmt.all();
    
    // Get details for each facture
    const getDetails = db.prepare(`
      SELECT fd.*, s.nom_site
      FROM factures_details fd
      LEFT JOIN sites_gas s ON fd.site_id = s.id
      WHERE fd.facture_id = ?
    `);
    
    return rows.map(row => ({
      id: row.id,
      client_id: row.client_id,
      numero_facture: row.numero_facture,
      date_emission: row.date_emission,
      date_echeance: row.date_echeance,
      periode_mois: row.periode_mois,
      periode_annee: row.periode_annee,
      total_gardiens_factures: row.total_gardiens_factures,
      montant_ht_prestation: row.montant_ht_prestation,
      montant_frais_supp: row.montant_frais_supp,
      motif_frais_supp: row.motif_frais_supp,
      creances_anterieures: row.creances_anterieures,
      montant_total_ttc: row.montant_total_ttc,
      montant_total_du_client: row.montant_total_du_client,
      devise: row.devise,
      statut_paiement: row.statut_paiement,
      notes_facture: row.notes_facture,
      cree_le: row.cree_le,
      client: row.client_nom ? { nom_entreprise: row.client_nom } : null,
      details: getDetails.all(row.id).map(d => ({
        id: d.id,
        facture_id: d.facture_id,
        site_id: d.site_id,
        nombre_gardiens_site: d.nombre_gardiens_site,
        montant_forfaitaire_site: d.montant_forfaitaire_site,
        description_ligne: d.description_ligne,
        site: d.nom_site ? { nom_site: d.nom_site } : null
      }))
    }));
  } catch (error) {
    console.error('Error fetching factures GAS:', error);
    throw error;
  }
});

ipcMain.handle('db-add-facture-gas', async (event, facture) => {
  try {
    const stmt = db.prepare(`
      INSERT INTO factures_clients (
        id, client_id, numero_facture, date_emission, date_echeance, periode_mois,
        periode_annee, total_gardiens_factures, montant_ht_prestation, montant_frais_supp,
        motif_frais_supp, creances_anterieures, montant_total_ttc, montant_total_du_client,
        devise, statut_paiement, notes_facture
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      facture.id,
      facture.client_id,
      facture.numero_facture,
      facture.date_emission,
      facture.date_echeance || null,
      facture.periode_mois || null,
      facture.periode_annee || null,
      facture.total_gardiens_factures || 0,
      facture.montant_ht_prestation || 0,
      facture.montant_frais_supp || 0,
      facture.motif_frais_supp || null,
      facture.creances_anterieures || 0,
      facture.montant_total_ttc || 0,
      facture.montant_total_du_client || 0,
      facture.devise || 'USD',
      facture.statut_paiement || 'BROUILLON',
      facture.notes_facture || null
    );
    
    // Insert details if provided
    if (facture.details && facture.details.length > 0) {
      const insertDetail = db.prepare(`
        INSERT INTO factures_details (id, facture_id, site_id, nombre_gardiens_site, montant_forfaitaire_site, description_ligne)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      for (const detail of facture.details) {
        insertDetail.run(
          detail.id,
          facture.id,
          detail.site_id,
          detail.nombre_gardiens_site || 0,
          detail.montant_forfaitaire_site || 0,
          detail.description_ligne || null
        );
      }
    }
    
    return { success: true, id: facture.id };
  } catch (error) {
    console.error('Error adding facture GAS:', error);
    throw error;
  }
});

ipcMain.handle('db-update-facture-gas', async (event, facture) => {
  try {
    const stmt = db.prepare(`
      UPDATE factures_clients SET
        client_id = ?, numero_facture = ?, date_emission = ?, date_echeance = ?,
        periode_mois = ?, periode_annee = ?, total_gardiens_factures = ?,
        montant_ht_prestation = ?, montant_frais_supp = ?, motif_frais_supp = ?,
        creances_anterieures = ?, montant_total_ttc = ?, montant_total_du_client = ?,
        devise = ?, statut_paiement = ?, notes_facture = ?
      WHERE id = ?
    `);
    
    stmt.run(
      facture.client_id,
      facture.numero_facture,
      facture.date_emission,
      facture.date_echeance || null,
      facture.periode_mois || null,
      facture.periode_annee || null,
      facture.total_gardiens_factures || 0,
      facture.montant_ht_prestation || 0,
      facture.montant_frais_supp || 0,
      facture.motif_frais_supp || null,
      facture.creances_anterieures || 0,
      facture.montant_total_ttc || 0,
      facture.montant_total_du_client || 0,
      facture.devise || 'USD',
      facture.statut_paiement || 'BROUILLON',
      facture.notes_facture || null,
      facture.id
    );
    
    // Update details - delete existing and re-insert
    db.prepare('DELETE FROM factures_details WHERE facture_id = ?').run(facture.id);
    
    if (facture.details && facture.details.length > 0) {
      const insertDetail = db.prepare(`
        INSERT INTO factures_details (id, facture_id, site_id, nombre_gardiens_site, montant_forfaitaire_site, description_ligne)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      for (const detail of facture.details) {
        insertDetail.run(
          detail.id,
          facture.id,
          detail.site_id,
          detail.nombre_gardiens_site || 0,
          detail.montant_forfaitaire_site || 0,
          detail.description_ligne || null
        );
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error updating facture GAS:', error);
    throw error;
  }
});

ipcMain.handle('db-delete-facture-gas', async (event, id) => {
  try {
    // Delete payments first
    db.prepare('DELETE FROM paiements WHERE facture_id = ?').run(id);
    
    // Delete details
    db.prepare('DELETE FROM factures_details WHERE facture_id = ?').run(id);
    
    // Delete facture
    db.prepare('DELETE FROM factures_clients WHERE id = ?').run(id);
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting facture GAS:', error);
    throw error;
  }
});

// ============================================================================
// Paiements GAS (Encaissements clients)
// ============================================================================

ipcMain.handle('db-get-paiements-gas', async (event, factureId) => {
  try {
    let stmt;
    if (factureId) {
      stmt = db.prepare(`
        SELECT p.*, f.numero_facture, f.montant_total_du_client
        FROM paiements p
        LEFT JOIN factures_clients f ON p.facture_id = f.id
        WHERE p.facture_id = ?
        ORDER BY p.date_paiement DESC
      `);
      return stmt.all(factureId);
    } else {
      stmt = db.prepare(`
        SELECT p.*, f.numero_facture, f.montant_total_du_client, c.nom_entreprise as client_nom
        FROM paiements p
        LEFT JOIN factures_clients f ON p.facture_id = f.id
        LEFT JOIN clients_gas c ON f.client_id = c.id
        ORDER BY p.date_paiement DESC
      `);
      return stmt.all();
    }
  } catch (error) {
    console.error('Error fetching paiements:', error);
    throw error;
  }
});

ipcMain.handle('db-add-paiement-gas', async (event, paiement) => {
  try {
    console.log('Adding paiement:', paiement);
    
    // Ensure paiements table exists
    db.exec(`
      CREATE TABLE IF NOT EXISTS paiements (
        id TEXT PRIMARY KEY,
        facture_id TEXT NOT NULL,
        date_paiement TEXT NOT NULL,
        montant_paye REAL NOT NULL DEFAULT 0,
        devise TEXT NOT NULL DEFAULT 'USD',
        mode_paiement TEXT NOT NULL DEFAULT 'ESPECES',
        reference_paiement TEXT,
        banque_origine TEXT,
        notes TEXT,
        cree_le DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (facture_id) REFERENCES factures_clients (id)
      )
    `);
    
    const stmt = db.prepare(`
      INSERT INTO paiements (
        id, facture_id, date_paiement, montant_paye, devise,
        mode_paiement, reference_paiement, banque_origine, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      paiement.id,
      paiement.facture_id,
      paiement.date_paiement,
      paiement.montant_paye,
      paiement.devise || 'USD',
      paiement.mode_paiement || 'ESPECES',
      paiement.reference_paiement || null,
      paiement.banque_origine || null,
      paiement.notes || null
    );
    
    // Update facture status based on total payments
    updateFacturePaymentStatus(paiement.facture_id);
    
    // ============================================================================
    // Record payment in Treasury (Finance Module Integration)
    // ============================================================================
    try {
      // Determine which treasury account to credit based on payment mode and currency
      let compteId;
      const devise = paiement.devise || 'USD';
      const modePaiement = paiement.mode_paiement || 'ESPECES';
      
      if (modePaiement === 'ESPECES') {
        compteId = devise === 'USD' ? 'caisse-usd' : 'caisse-cdf';
      } else if (modePaiement === 'VIREMENT' || modePaiement === 'CHEQUE') {
        compteId = 'banque-usd';
      } else if (modePaiement === 'MOBILE_MONEY') {
        compteId = 'mobile-money';
      } else {
        compteId = devise === 'USD' ? 'caisse-usd' : 'caisse-cdf';
      }
      
      // Check if treasury account exists
      const compte = db.prepare('SELECT * FROM comptes_tresorerie WHERE id = ?').get(compteId);
      
      if (compte) {
        const soldeAvant = compte.solde_actuel || 0;
        const soldeApres = soldeAvant + paiement.montant_paye;
        
        // Update treasury account balance
        db.prepare('UPDATE comptes_tresorerie SET solde_actuel = ? WHERE id = ?')
          .run(soldeApres, compteId);
        
        // Get invoice and client info for the movement label
        const facture = db.prepare(`
          SELECT f.numero_facture, c.nom_entreprise 
          FROM factures_clients f 
          LEFT JOIN clients_gas c ON f.client_id = c.id 
          WHERE f.id = ?
        `).get(paiement.facture_id);
        
        const libelle = facture 
          ? `Paiement ${facture.nom_entreprise || 'Client'} - Facture ${facture.numero_facture}`
          : `Paiement client - Facture`;
        
        // Record the movement
        const mouvementId = 'mvt-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        db.prepare(`
          INSERT INTO mouvements_tresorerie (
            id, compte_tresorerie_id, date_mouvement, type_mouvement, montant, devise,
            libelle, type_source, source_id, solde_avant, solde_apres
          ) VALUES (?, ?, ?, 'ENTREE', ?, ?, ?, 'PAIEMENT_CLIENT', ?, ?, ?)
        `).run(
          mouvementId, compteId, paiement.date_paiement,
          paiement.montant_paye, devise, libelle,
          paiement.id, soldeAvant, soldeApres
        );
        
        console.log(`Payment recorded in treasury: ${compteId}, amount: ${paiement.montant_paye} ${devise}`);
      }
    } catch (treasuryError) {
      // Log but don't fail the payment if treasury recording fails
      console.error('Error recording payment in treasury:', treasuryError);
    }
    
    return { success: true, id: paiement.id };
  } catch (error) {
    console.error('Error adding paiement:', error);
    throw error;
  }
});

ipcMain.handle('db-update-paiement-gas', async (event, paiement) => {
  try {
    const stmt = db.prepare(`
      UPDATE paiements SET
        date_paiement = ?, montant_paye = ?, devise = ?,
        mode_paiement = ?, reference_paiement = ?, banque_origine = ?, notes = ?
      WHERE id = ?
    `);
    
    stmt.run(
      paiement.date_paiement,
      paiement.montant_paye,
      paiement.devise || 'USD',
      paiement.mode_paiement || 'ESPECES',
      paiement.reference_paiement || null,
      paiement.banque_origine || null,
      paiement.notes || null,
      paiement.id
    );
    
    // Update facture status
    updateFacturePaymentStatus(paiement.facture_id);
    
    return { success: true };
  } catch (error) {
    console.error('Error updating paiement:', error);
    throw error;
  }
});

ipcMain.handle('db-delete-paiement-gas', async (event, id) => {
  try {
    // Get facture_id before deleting
    const paiement = db.prepare('SELECT facture_id FROM paiements WHERE id = ?').get(id);
    
    // Delete paiement
    db.prepare('DELETE FROM paiements WHERE id = ?').run(id);
    
    // Update facture status
    if (paiement) {
      updateFacturePaymentStatus(paiement.facture_id);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting paiement:', error);
    throw error;
  }
});

ipcMain.handle('db-get-facture-paiements-summary', async (event, factureId) => {
  try {
    const facture = db.prepare('SELECT montant_total_du_client, devise FROM factures_clients WHERE id = ?').get(factureId);
    const totalPaye = db.prepare('SELECT COALESCE(SUM(montant_paye), 0) as total FROM paiements WHERE facture_id = ?').get(factureId);
    
    return {
      montant_total: facture?.montant_total_du_client || 0,
      montant_paye: totalPaye?.total || 0,
      solde_restant: (facture?.montant_total_du_client || 0) - (totalPaye?.total || 0),
      devise: facture?.devise || 'USD'
    };
  } catch (error) {
    console.error('Error getting paiements summary:', error);
    throw error;
  }
});

// Helper function to update facture payment status
function updateFacturePaymentStatus(factureId) {
  try {
    const facture = db.prepare('SELECT montant_total_du_client FROM factures_clients WHERE id = ?').get(factureId);
    const totalPaye = db.prepare('SELECT COALESCE(SUM(montant_paye), 0) as total FROM paiements WHERE facture_id = ?').get(factureId);
    
    if (!facture) return;
    
    let newStatus;
    const montantDu = facture.montant_total_du_client;
    const montantPaye = totalPaye?.total || 0;
    
    if (montantPaye >= montantDu) {
      newStatus = 'PAYE_TOTAL';
    } else if (montantPaye > 0) {
      newStatus = 'PAYE_PARTIEL';
    } else {
      // Keep current status if no payment (could be BROUILLON or ENVOYE)
      const currentStatus = db.prepare('SELECT statut_paiement FROM factures_clients WHERE id = ?').get(factureId);
      if (currentStatus?.statut_paiement === 'PAYE_TOTAL' || currentStatus?.statut_paiement === 'PAYE_PARTIEL') {
        newStatus = 'ENVOYE';
      } else {
        return; // Don't change status
      }
    }
    
    db.prepare('UPDATE factures_clients SET statut_paiement = ? WHERE id = ?').run(newStatus, factureId);
  } catch (error) {
    console.error('Error updating facture payment status:', error);
  }
}

// Seed database with sample data
ipcMain.handle('db-seed-data', async () => {
  try {
    // Sample data
    const sampleEmployees = [
      {
        id: '1', employeeNumber: 'EMP001', firstName: 'John', lastName: 'Smith',
        email: 'john.smith@goaheadsecurity.com', phone: '(555) 123-4567',
        dateOfBirth: '1985-03-15', nationalId: 'SSN123456789',
        addressStreet: '123 Main St', addressCity: 'Springfield', addressState: 'IL', addressZipCode: '62701',
        emergencyContactName: 'Jane Smith', emergencyContactRelationship: 'Spouse', emergencyContactPhone: '(555) 123-4568',
        dateHired: '2023-01-15', position: 'Security Guard', department: 'Field Operations',
        status: 'active', salary: 45000, bankName: 'First National Bank', accountNumber: '****1234', routingNumber: '123456789'
      },
      {
        id: '2', employeeNumber: 'EMP002', firstName: 'Sarah', lastName: 'Johnson',
        email: 'sarah.johnson@goaheadsecurity.com', phone: '(555) 234-5678',
        dateOfBirth: '1990-07-22', nationalId: 'SSN987654321',
        addressStreet: '456 Oak Ave', addressCity: 'Springfield', addressState: 'IL', addressZipCode: '62702',
        emergencyContactName: 'Mike Johnson', emergencyContactRelationship: 'Brother', emergencyContactPhone: '(555) 234-5679',
        dateHired: '2023-03-01', position: 'Senior Security Guard', department: 'Field Operations',
        status: 'active', salary: 52000, bankName: 'Community Bank', accountNumber: '****5678', routingNumber: '987654321'
      },
      {
        id: '3', employeeNumber: 'EMP003', firstName: 'Michael', lastName: 'Brown',
        email: 'michael.brown@goaheadsecurity.com', phone: '(555) 345-6789',
        dateOfBirth: '1988-11-30', nationalId: 'SSN456789123',
        addressStreet: '789 Pine St', addressCity: 'Springfield', addressState: 'IL', addressZipCode: '62703',
        emergencyContactName: 'Lisa Brown', emergencyContactRelationship: 'Wife', emergencyContactPhone: '(555) 345-6790',
        dateHired: '2022-08-15', position: 'Security Supervisor', department: 'Operations',
        status: 'active', salary: 65000, bankName: 'Regional Bank', accountNumber: '****9012', routingNumber: '456789123'
      }
    ];

    const sampleClients = [
      {
        id: '1', name: 'Downtown Shopping Mall', type: 'corporate', primaryContact: 'Robert Wilson',
        email: 'rwilson@downtownmall.com', phone: '(555) 111-2222',
        addressStreet: '100 Commerce St', addressCity: 'Springfield', addressState: 'IL', addressZipCode: '62701',
        contractStartDate: '2023-01-01', contractEndDate: '2024-12-31', serviceLevel: 'Premium',
        hourlyRate: 25, billingCycle: 'monthly', paymentTerms: 'Net 30',
        status: 'active', totalValue: 180000, createdDate: '2022-12-15'
      },
      {
        id: '2', name: 'Riverside Residential Complex', type: 'residential', primaryContact: 'Maria Garcia',
        email: 'mgarcia@riverside.com', phone: '(555) 222-3333',
        addressStreet: '500 River Road', addressCity: 'Springfield', addressState: 'IL', addressZipCode: '62704',
        contractStartDate: '2023-06-01', contractEndDate: '2025-05-31', serviceLevel: 'Standard',
        hourlyRate: 22, billingCycle: 'monthly', paymentTerms: 'Net 15',
        status: 'active', totalValue: 220000, createdDate: '2023-05-10'
      },
      {
        id: '3', name: 'Metro Office Complex', type: 'corporate', primaryContact: 'David Chen',
        email: 'dchen@metrooffice.com', phone: '(555) 333-4444',
        addressStreet: '200 Business Blvd', addressCity: 'Springfield', addressState: 'IL', addressZipCode: '62705',
        contractStartDate: '2023-09-01', contractEndDate: '2024-08-31', serviceLevel: 'Basic',
        hourlyRate: 20, billingCycle: 'monthly', paymentTerms: 'Net 30',
        status: 'active', totalValue: 96000, createdDate: '2023-08-15'
      }
    ];

    const sampleSites = [
      {
        id: '1', name: 'Downtown Mall - Main Entrance', clientId: '1',
        address: '100 Commerce St', city: 'Springfield', state: 'IL', zipCode: '62701',
        latitude: 39.7817, longitude: -89.6501, siteType: 'retail', size: '500,000 sq ft',
        accessPoints: 'Main Entrance,Employee Entrance,Loading Dock',
        specialInstructions: 'Monitor for shoplifting during peak hours. Check employee bags at end of shift.',
        emergencyProcedures: 'Contact mall security office at ext. 911. Evacuation route through main entrance.',
        guardsRequired: 3, shiftPattern: '24/7', specialEquipment: 'Radio,Flashlight,First Aid Kit',
        certificationRequired: 'Security Guard License', status: 'active'
      },
      {
        id: '2', name: 'Downtown Mall - Parking Garage', clientId: '1',
        address: '102 Commerce St', city: 'Springfield', state: 'IL', zipCode: '62701',
        latitude: 39.7818, longitude: -89.6502, siteType: 'retail', size: '200,000 sq ft',
        accessPoints: 'Level 1 Entrance,Level 2 Entrance,Pedestrian Bridge',
        specialInstructions: 'Vehicle patrols on all levels. Check for break-ins and vandalism.',
        emergencyProcedures: 'Contact police for vehicle break-ins. Use emergency call boxes for assistance.',
        guardsRequired: 2, shiftPattern: '24/7', specialEquipment: 'Radio,Flashlight,Vehicle',
        certificationRequired: 'Security Guard License,Driver License', status: 'active'
      },
      {
        id: '3', name: 'Riverside Complex - Main Gate', clientId: '2',
        address: '500 River Road', city: 'Springfield', state: 'IL', zipCode: '62704',
        latitude: 39.7900, longitude: -89.6600, siteType: 'residential', size: '50 acre complex',
        accessPoints: 'Main Gate,Emergency Exit',
        specialInstructions: 'Check visitor ID and maintain visitor log. Patrol common areas after dark.',
        emergencyProcedures: 'Contact management office for noise complaints. Call police for disturbances.',
        guardsRequired: 2, shiftPattern: '6 PM - 6 AM', specialEquipment: 'Radio,Flashlight,Access Control System',
        certificationRequired: 'Security Guard License', status: 'active'
      },
      {
        id: '4', name: 'Metro Office Complex', clientId: '3',
        address: '200 Business Blvd', city: 'Springfield', state: 'IL', zipCode: '62705',
        latitude: 39.7700, longitude: -89.6400, siteType: 'office', size: '300,000 sq ft',
        accessPoints: 'Main Lobby,Employee Entrance,Loading Dock',
        specialInstructions: 'Monitor elevator access after hours. Escort visitors to their destinations.',
        emergencyProcedures: 'Use building emergency procedures. Contact building management for issues.',
        guardsRequired: 1, shiftPattern: '6 PM - 6 AM', specialEquipment: 'Radio,Flashlight,Key Card Access',
        certificationRequired: 'Security Guard License', status: 'active'
      }
    ];

    // Clear existing data
    db.exec('DELETE FROM site_assignments');
    db.exec('DELETE FROM certifications');
    db.exec('DELETE FROM sites');
    db.exec('DELETE FROM clients');
    db.exec('DELETE FROM employees');

    // Insert employees
    const insertEmployee = db.prepare(`
      INSERT INTO employees (
        id, employee_number, first_name, last_name, email, phone, date_of_birth,
        national_id, address_street, address_city, address_state, address_zip_code,
        emergency_contact_name, emergency_contact_relationship, emergency_contact_phone,
        date_hired, position, department, status, salary, bank_name,
        account_number, routing_number
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const emp of sampleEmployees) {
      insertEmployee.run(
        emp.id, emp.employeeNumber, emp.firstName, emp.lastName, emp.email, emp.phone,
        emp.dateOfBirth, emp.nationalId, emp.addressStreet, emp.addressCity, emp.addressState,
        emp.addressZipCode, emp.emergencyContactName, emp.emergencyContactRelationship,
        emp.emergencyContactPhone, emp.dateHired, emp.position, emp.department, emp.status,
        emp.salary, emp.bankName, emp.accountNumber, emp.routingNumber
      );
    }

    // Insert clients
    const insertClient = db.prepare(`
      INSERT INTO clients (
        id, name, type, primary_contact, email, phone, address_street, address_city,
        address_state, address_zip_code, contract_start_date, contract_end_date,
        service_level, hourly_rate, billing_cycle, payment_terms, status, total_value, created_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const client of sampleClients) {
      insertClient.run(
        client.id, client.name, client.type, client.primaryContact, client.email, client.phone,
        client.addressStreet, client.addressCity, client.addressState, client.addressZipCode,
        client.contractStartDate, client.contractEndDate, client.serviceLevel, client.hourlyRate,
        client.billingCycle, client.paymentTerms, client.status, client.totalValue, client.createdDate
      );
    }

    // Insert sites
    const insertSite = db.prepare(`
      INSERT INTO sites (
        id, name, client_id, address, city, state, zip_code, latitude, longitude,
        site_type, size, access_points, special_instructions, emergency_procedures,
        guards_required, shift_pattern, special_equipment, certification_required, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const site of sampleSites) {
      insertSite.run(
        site.id, site.name, site.clientId, site.address, site.city, site.state, site.zipCode,
        site.latitude, site.longitude, site.siteType, site.size, site.accessPoints,
        site.specialInstructions, site.emergencyProcedures, site.guardsRequired,
        site.shiftPattern, site.specialEquipment, site.certificationRequired, site.status
      );
    }

    // Insert some certifications
    const insertCertification = db.prepare(`
      INSERT INTO certifications (id, employee_id, name, issue_date, expiry_date, issuing_authority, certificate_number, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const certifications = [
      { id: 'cert1', employeeId: '1', name: 'Security Guard License', issueDate: '2023-01-10', expiryDate: '2025-01-10', issuingAuthority: 'State Security Board', certificateNumber: 'SGL123456', status: 'active' },
      { id: 'cert2', employeeId: '1', name: 'First Aid Certification', issueDate: '2023-06-15', expiryDate: '2024-12-15', issuingAuthority: 'Red Cross', certificateNumber: 'FA789012', status: 'expiring-soon' },
      { id: 'cert3', employeeId: '2', name: 'Security Guard License', issueDate: '2023-02-28', expiryDate: '2025-02-28', issuingAuthority: 'State Security Board', certificateNumber: 'SGL654321', status: 'active' },
      { id: 'cert4', employeeId: '3', name: 'Security Supervisor License', issueDate: '2022-08-10', expiryDate: '2024-08-10', issuingAuthority: 'State Security Board', certificateNumber: 'SSL789456', status: 'expiring-soon' }
    ];

    for (const cert of certifications) {
      insertCertification.run(cert.id, cert.employeeId, cert.name, cert.issueDate, cert.expiryDate, cert.issuingAuthority, cert.certificateNumber, cert.status);
    }

    // Insert site assignments
    const insertSiteAssignment = db.prepare(`
      INSERT INTO site_assignments (id, site_id, employee_id, assigned_date, status)
      VALUES (?, ?, ?, ?, ?)
    `);

    const assignments = [
      { id: 'sa1', siteId: '1', employeeId: '1', assignedDate: '2023-01-15', status: 'active' },
      { id: 'sa2', siteId: '1', employeeId: '2', assignedDate: '2023-03-01', status: 'active' },
      { id: 'sa3', siteId: '2', employeeId: '3', assignedDate: '2022-08-15', status: 'active' },
      { id: 'sa4', siteId: '3', employeeId: '1', assignedDate: '2023-06-01', status: 'active' },
      { id: 'sa5', siteId: '4', employeeId: '2', assignedDate: '2023-09-01', status: 'active' }
    ];

    for (const assignment of assignments) {
      insertSiteAssignment.run(assignment.id, assignment.siteId, assignment.employeeId, assignment.assignedDate, assignment.status);
    }

    // ============================================================================
    // GUARDIAN COMMAND - Données GAS (Conformes au schéma SQL OHADA)
    // ============================================================================

    // Clear existing GAS data
    db.exec('DELETE FROM factures_details');
    db.exec('DELETE FROM factures_clients');
    db.exec('DELETE FROM sites_gas');
    db.exec('DELETE FROM clients_gas');

    // Sample GAS Clients
    const sampleClientsGAS = [
      {
        id: 'gas-client-1',
        type_client: 'MORALE',
        nom_entreprise: 'Banque Commerciale du Congo (BCDC)',
        nif: 'A0123456B',
        rccm: 'CD/KIN/RCCM/23-B-01234',
        numero_contrat: 'GAS-2024-001',
        contact_nom: 'Jean-Pierre Mukendi',
        contact_email: 'jp.mukendi@bcdc.cd',
        telephone: '+243 81 234 5678',
        contact_urgence_nom: 'Marie Kabongo',
        contact_urgence_telephone: '+243 99 876 5432',
        adresse_facturation: '12 Avenue du Commerce, Gombe, Kinshasa',
        devise_preferee: 'USD',
        delai_paiement_jours: 30
      },
      {
        id: 'gas-client-2',
        type_client: 'MORALE',
        nom_entreprise: 'Rawbank SARL',
        nif: 'B9876543C',
        rccm: 'CD/KIN/RCCM/22-A-05678',
        numero_contrat: 'GAS-2024-002',
        contact_nom: 'Patrick Lumumba',
        contact_email: 'p.lumumba@rawbank.cd',
        telephone: '+243 82 345 6789',
        contact_urgence_nom: 'Sophie Tshisekedi',
        contact_urgence_telephone: '+243 98 765 4321',
        adresse_facturation: '45 Boulevard du 30 Juin, Gombe, Kinshasa',
        devise_preferee: 'USD',
        delai_paiement_jours: 15
      },
      {
        id: 'gas-client-3',
        type_client: 'PHYSIQUE',
        nom_entreprise: 'Résidence Kabila',
        id_national: 'CD-KIN-1985-12345',
        numero_contrat: 'GAS-2024-003',
        contact_nom: 'Joseph Kabila',
        contact_email: 'contact@residence-kabila.cd',
        telephone: '+243 83 456 7890',
        adresse_facturation: '78 Avenue de la Libération, Ngaliema, Kinshasa',
        devise_preferee: 'CDF',
        delai_paiement_jours: 7
      }
    ];

    const insertClientGAS = db.prepare(`
      INSERT INTO clients_gas (
        id, type_client, nom_entreprise, nif, rccm, id_national, numero_contrat,
        contact_nom, contact_email, telephone, contact_urgence_nom, contact_urgence_telephone,
        adresse_facturation, devise_preferee, delai_paiement_jours, est_actif
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const client of sampleClientsGAS) {
      insertClientGAS.run(
        client.id, client.type_client, client.nom_entreprise, client.nif || null,
        client.rccm || null, client.id_national || null, client.numero_contrat || null,
        client.contact_nom || null, client.contact_email || null, client.telephone || null,
        client.contact_urgence_nom || null, client.contact_urgence_telephone || null,
        client.adresse_facturation || null, client.devise_preferee, client.delai_paiement_jours,
        1 // est_actif = true for sample data
      );
    }

    // Sample GAS Sites
    const sampleSitesGAS = [
      {
        id: 'gas-site-1',
        client_id: 'gas-client-1',
        nom_site: 'BCDC - Siège Social Gombe',
        adresse_physique: '12 Avenue du Commerce, Gombe, Kinshasa',
        latitude: -4.3217,
        longitude: 15.3125,
        effectif_jour_requis: 4,
        effectif_nuit_requis: 3,
        cout_unitaire_garde: 1214.29,
        tarif_mensuel_client: 8500,
        consignes_specifiques: 'Contrôle strict des accès. Badge obligatoire. Fouille des sacs.',
        est_actif: 1
      },
      {
        id: 'gas-site-2',
        client_id: 'gas-client-1',
        nom_site: 'BCDC - Agence Limete',
        adresse_physique: '234 Avenue Sendwe, Limete, Kinshasa',
        latitude: -4.3456,
        longitude: 15.3567,
        effectif_jour_requis: 2,
        effectif_nuit_requis: 2,
        cout_unitaire_garde: 1200,
        tarif_mensuel_client: 4800,
        consignes_specifiques: 'Surveillance parking et entrée principale.',
        est_actif: 1
      },
      {
        id: 'gas-site-3',
        client_id: 'gas-client-2',
        nom_site: 'Rawbank - Tour Principale',
        adresse_physique: '45 Boulevard du 30 Juin, Gombe, Kinshasa',
        latitude: -4.3189,
        longitude: 15.3098,
        effectif_jour_requis: 6,
        effectif_nuit_requis: 4,
        cout_unitaire_garde: 1250,
        tarif_mensuel_client: 12500,
        consignes_specifiques: 'Sécurité renforcée. Détecteur de métaux. Caméras 24/7.',
        est_actif: 1
      },
      {
        id: 'gas-site-4',
        client_id: 'gas-client-3',
        nom_site: 'Résidence Kabila - Villa Principale',
        adresse_physique: '78 Avenue de la Libération, Ngaliema, Kinshasa',
        latitude: -4.3012,
        longitude: 15.2876,
        effectif_jour_requis: 3,
        effectif_nuit_requis: 4,
        cout_unitaire_garde: 1314.29,
        tarif_mensuel_client: 9200,
        consignes_specifiques: 'Résidence privée. Discrétion absolue. Patrouilles régulières.',
        est_actif: 1
      }
    ];

    const insertSiteGAS = db.prepare(`
      INSERT INTO sites_gas (
        id, client_id, nom_site, adresse_physique, latitude, longitude,
        effectif_jour_requis, effectif_nuit_requis, cout_unitaire_garde,
        tarif_mensuel_client, consignes_specifiques, est_actif
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const site of sampleSitesGAS) {
      insertSiteGAS.run(
        site.id, site.client_id, site.nom_site, site.adresse_physique,
        site.latitude, site.longitude, site.effectif_jour_requis, site.effectif_nuit_requis,
        site.cout_unitaire_garde, site.tarif_mensuel_client, site.consignes_specifiques, site.est_actif
      );
    }

    // Sample GAS Factures
    const sampleFacturesGAS = [
      {
        id: 'gas-facture-1',
        client_id: 'gas-client-1',
        numero_facture: 'FAC-2025-001',
        date_emission: '2025-01-01',
        date_echeance: '2025-01-31',
        periode_mois: 12,
        periode_annee: 2024,
        total_gardiens_factures: 11,
        montant_ht_prestation: 13300,
        montant_frais_supp: 0,
        creances_anterieures: 0,
        montant_total_ttc: 13300,
        montant_total_du_client: 13300,
        devise: 'USD',
        statut_paiement: 'ENVOYE',
        notes_facture: 'Facturation mensuelle décembre 2024'
      },
      {
        id: 'gas-facture-2',
        client_id: 'gas-client-2',
        numero_facture: 'FAC-2025-002',
        date_emission: '2025-01-01',
        date_echeance: '2025-01-15',
        periode_mois: 12,
        periode_annee: 2024,
        total_gardiens_factures: 10,
        montant_ht_prestation: 12500,
        montant_frais_supp: 500,
        motif_frais_supp: 'Heures supplémentaires événement spécial',
        creances_anterieures: 0,
        montant_total_ttc: 13000,
        montant_total_du_client: 13000,
        devise: 'USD',
        statut_paiement: 'PAYE_TOTAL',
        notes_facture: 'Facturation mensuelle décembre 2024 + événement'
      },
      {
        id: 'gas-facture-3',
        client_id: 'gas-client-3',
        numero_facture: 'FAC-2025-003',
        date_emission: '2025-01-01',
        date_echeance: '2025-01-08',
        periode_mois: 12,
        periode_annee: 2024,
        total_gardiens_factures: 7,
        montant_ht_prestation: 9200,
        montant_frais_supp: 0,
        creances_anterieures: 2500,
        montant_total_ttc: 9200,
        montant_total_du_client: 11700,
        devise: 'CDF',
        statut_paiement: 'PAYE_PARTIEL',
        notes_facture: 'Facturation mensuelle décembre 2024 + arriérés'
      }
    ];

    const insertFactureGAS = db.prepare(`
      INSERT INTO factures_clients (
        id, client_id, numero_facture, date_emission, date_echeance, periode_mois,
        periode_annee, total_gardiens_factures, montant_ht_prestation, montant_frais_supp,
        motif_frais_supp, creances_anterieures, montant_total_ttc, montant_total_du_client,
        devise, statut_paiement, notes_facture
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const facture of sampleFacturesGAS) {
      insertFactureGAS.run(
        facture.id, facture.client_id, facture.numero_facture, facture.date_emission,
        facture.date_echeance, facture.periode_mois, facture.periode_annee,
        facture.total_gardiens_factures, facture.montant_ht_prestation, facture.montant_frais_supp,
        facture.motif_frais_supp || null, facture.creances_anterieures, facture.montant_total_ttc,
        facture.montant_total_du_client, facture.devise, facture.statut_paiement, facture.notes_facture
      );
    }

    // Sample Facture Details
    const sampleFactureDetails = [
      { id: 'fd-1', facture_id: 'gas-facture-1', site_id: 'gas-site-1', nombre_gardiens_site: 7, montant_forfaitaire_site: 8500, description_ligne: 'Gardiennage Siège Social - Décembre 2024' },
      { id: 'fd-2', facture_id: 'gas-facture-1', site_id: 'gas-site-2', nombre_gardiens_site: 4, montant_forfaitaire_site: 4800, description_ligne: 'Gardiennage Agence Limete - Décembre 2024' },
      { id: 'fd-3', facture_id: 'gas-facture-2', site_id: 'gas-site-3', nombre_gardiens_site: 10, montant_forfaitaire_site: 12500, description_ligne: 'Gardiennage Tour Principale - Décembre 2024' },
      { id: 'fd-4', facture_id: 'gas-facture-3', site_id: 'gas-site-4', nombre_gardiens_site: 7, montant_forfaitaire_site: 9200, description_ligne: 'Gardiennage Villa Principale - Décembre 2024' }
    ];

    const insertFactureDetail = db.prepare(`
      INSERT INTO factures_details (id, facture_id, site_id, nombre_gardiens_site, montant_forfaitaire_site, description_ligne)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    for (const detail of sampleFactureDetails) {
      insertFactureDetail.run(detail.id, detail.facture_id, detail.site_id, detail.nombre_gardiens_site, detail.montant_forfaitaire_site, detail.description_ligne);
    }

    console.log('Database seeded successfully!');
    return { success: true, message: 'Sample data loaded successfully' };
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
});

// ============================================================================
// IPC Handlers - Finance Module (OHADA)
// ============================================================================

// Plan Comptable
ipcMain.handle('db-get-plan-comptable', async () => {
  try {
    return db.prepare('SELECT * FROM plan_comptable WHERE est_actif = 1 ORDER BY code_compte').all();
  } catch (error) {
    console.error('Error fetching plan comptable:', error);
    throw error;
  }
});

// Categories de Depenses
ipcMain.handle('db-get-categories-depenses', async () => {
  try {
    return db.prepare(`
      SELECT c.*, p.libelle as compte_libelle 
      FROM categories_depenses c
      LEFT JOIN plan_comptable p ON c.code_compte = p.code_compte
      WHERE c.est_actif = 1
      ORDER BY c.nom_categorie
    `).all();
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
});

// Comptes de Tresorerie
ipcMain.handle('db-get-comptes-tresorerie', async () => {
  try {
    return db.prepare(`
      SELECT * FROM comptes_tresorerie WHERE est_actif = 1 ORDER BY type_compte, nom_compte
    `).all();
  } catch (error) {
    console.error('Error fetching comptes tresorerie:', error);
    throw error;
  }
});

ipcMain.handle('db-update-solde-tresorerie', async (event, { compteId, nouveauSolde }) => {
  try {
    db.prepare('UPDATE comptes_tresorerie SET solde_actuel = ? WHERE id = ?').run(nouveauSolde, compteId);
    return { success: true };
  } catch (error) {
    console.error('Error updating solde:', error);
    throw error;
  }
});

// Depenses
ipcMain.handle('db-get-depenses', async (event, filters) => {
  try {
    let query = `
      SELECT d.*, c.nom_categorie, ct.nom_compte as compte_tresorerie_nom
      FROM depenses d
      LEFT JOIN categories_depenses c ON d.categorie_id = c.id
      LEFT JOIN comptes_tresorerie ct ON d.compte_tresorerie_id = ct.id
      WHERE 1=1
    `;
    const params = [];

    if (filters?.dateDebut) {
      query += ' AND d.date_depense >= ?';
      params.push(filters.dateDebut);
    }
    if (filters?.dateFin) {
      query += ' AND d.date_depense <= ?';
      params.push(filters.dateFin);
    }
    if (filters?.categorieId) {
      query += ' AND d.categorie_id = ?';
      params.push(filters.categorieId);
    }
    if (filters?.statut) {
      query += ' AND d.statut = ?';
      params.push(filters.statut);
    }

    query += ' ORDER BY d.date_depense DESC';

    return db.prepare(query).all(...params);
  } catch (error) {
    console.error('Error fetching depenses:', error);
    throw error;
  }
});

ipcMain.handle('db-add-depense', async (event, depense) => {
  try {
    const compte = db.prepare('SELECT solde_actuel FROM comptes_tresorerie WHERE id = ?').get(depense.compte_tresorerie_id);
    const soldeAvant = compte?.solde_actuel || 0;
    const soldeApres = soldeAvant - depense.montant;

    db.prepare(`
      INSERT INTO depenses (
        id, categorie_id, compte_tresorerie_id, date_depense, quantite, prix_unitaire, montant, devise,
        beneficiaire, description, reference_piece, mode_paiement, statut, cree_par
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      depense.id, depense.categorie_id, depense.compte_tresorerie_id,
      depense.date_depense, depense.quantite || 1, depense.prix_unitaire || depense.montant,
      depense.montant, depense.devise || 'USD',
      depense.beneficiaire || null, depense.description,
      depense.reference_piece || null, depense.mode_paiement || 'ESPECES',
      depense.statut || 'VALIDEE', depense.cree_par || null
    );

    db.prepare('UPDATE comptes_tresorerie SET solde_actuel = ? WHERE id = ?')
      .run(soldeApres, depense.compte_tresorerie_id);

    const mouvementId = 'mvt-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    db.prepare(`
      INSERT INTO mouvements_tresorerie (
        id, compte_tresorerie_id, date_mouvement, type_mouvement, montant, devise,
        libelle, type_source, source_id, solde_avant, solde_apres
      ) VALUES (?, ?, ?, 'SORTIE', ?, ?, ?, 'DEPENSE', ?, ?, ?)
    `).run(
      mouvementId, depense.compte_tresorerie_id, depense.date_depense,
      depense.montant, depense.devise || 'USD', depense.description,
      depense.id, soldeAvant, soldeApres
    );

    return { success: true, id: depense.id };
  } catch (error) {
    console.error('Error adding depense:', error);
    throw error;
  }
});

ipcMain.handle('db-update-depense', async (event, depense) => {
  try {
    db.prepare(`
      UPDATE depenses SET
        categorie_id = ?, date_depense = ?, quantite = ?, prix_unitaire = ?, montant = ?, devise = ?,
        beneficiaire = ?, description = ?, reference_piece = ?, mode_paiement = ?, statut = ?
      WHERE id = ?
    `).run(
      depense.categorie_id, depense.date_depense, depense.quantite || 1, depense.prix_unitaire || depense.montant,
      depense.montant, depense.devise || 'USD',
      depense.beneficiaire || null, depense.description,
      depense.reference_piece || null, depense.mode_paiement || 'ESPECES',
      depense.statut || 'VALIDEE', depense.id
    );
    return { success: true };
  } catch (error) {
    console.error('Error updating depense:', error);
    throw error;
  }
});

ipcMain.handle('db-delete-depense', async (event, id) => {
  try {
    const depense = db.prepare('SELECT * FROM depenses WHERE id = ?').get(id);
    if (depense && depense.statut === 'VALIDEE') {
      const compte = db.prepare('SELECT solde_actuel FROM comptes_tresorerie WHERE id = ?').get(depense.compte_tresorerie_id);
      const nouveauSolde = (compte?.solde_actuel || 0) + depense.montant;
      db.prepare('UPDATE comptes_tresorerie SET solde_actuel = ? WHERE id = ?')
        .run(nouveauSolde, depense.compte_tresorerie_id);
    }

    db.prepare('DELETE FROM mouvements_tresorerie WHERE source_id = ?').run(id);
    db.prepare('DELETE FROM depenses WHERE id = ?').run(id);
    return { success: true };
  } catch (error) {
    console.error('Error deleting depense:', error);
    throw error;
  }
});

// Mouvements de Tresorerie
ipcMain.handle('db-get-mouvements-tresorerie', async (event, filters) => {
  try {
    let query = `
      SELECT m.*, ct.nom_compte
      FROM mouvements_tresorerie m
      LEFT JOIN comptes_tresorerie ct ON m.compte_tresorerie_id = ct.id
      WHERE 1=1
    `;
    const params = [];

    if (filters?.compteId) {
      query += ' AND m.compte_tresorerie_id = ?';
      params.push(filters.compteId);
    }
    if (filters?.dateDebut) {
      query += ' AND m.date_mouvement >= ?';
      params.push(filters.dateDebut);
    }
    if (filters?.dateFin) {
      query += ' AND m.date_mouvement <= ?';
      params.push(filters.dateFin);
    }

    query += ' ORDER BY m.date_mouvement DESC, m.cree_le DESC';

    return db.prepare(query).all(...params);
  } catch (error) {
    console.error('Error fetching mouvements:', error);
    throw error;
  }
});

// Finance Dashboard Stats
ipcMain.handle('db-get-finance-stats', async () => {
  try {
    const comptes = db.prepare('SELECT * FROM comptes_tresorerie WHERE est_actif = 1').all();
    
    const totalCaisseUSD = comptes
      .filter(c => c.type_compte === 'CAISSE' && c.devise === 'USD')
      .reduce((sum, c) => sum + c.solde_actuel, 0);
    
    const totalCaisseCDF = comptes
      .filter(c => c.type_compte === 'CAISSE' && c.devise === 'CDF')
      .reduce((sum, c) => sum + c.solde_actuel, 0);
    
    const totalBanque = comptes
      .filter(c => c.type_compte === 'BANQUE')
      .reduce((sum, c) => sum + c.solde_actuel, 0);

    const now = new Date();
    const firstDayOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const depensesMois = db.prepare(`
      SELECT COALESCE(SUM(montant), 0) as total 
      FROM depenses 
      WHERE date_depense >= ? AND statut = 'VALIDEE' AND devise = 'USD'
    `).get(firstDayOfMonth);

    const depensesParCategorie = db.prepare(`
      SELECT c.nom_categorie, COALESCE(SUM(d.montant), 0) as total
      FROM categories_depenses c
      LEFT JOIN depenses d ON c.id = d.categorie_id 
        AND d.date_depense >= ? AND d.statut = 'VALIDEE'
      GROUP BY c.id, c.nom_categorie
      ORDER BY total DESC
    `).all(firstDayOfMonth);

    return {
      totalCaisseUSD,
      totalCaisseCDF,
      totalBanque,
      depensesMois: depensesMois?.total || 0,
      depensesParCategorie,
      comptes
    };
  } catch (error) {
    console.error('Error getting finance stats:', error);
    throw error;
  }
});

// ============================================================================
// IPC Handlers - Entrees (Recettes/Depots)
// ============================================================================

ipcMain.handle('db-get-entrees', async (event, filters) => {
  try {
    let query = `
      SELECT e.*, ct.nom_compte as compte_tresorerie_nom, f.numero_facture, c.nom_entreprise as client_nom
      FROM entrees e
      LEFT JOIN comptes_tresorerie ct ON e.compte_tresorerie_id = ct.id
      LEFT JOIN factures_clients f ON e.facture_id = f.id
      LEFT JOIN clients_gas c ON f.client_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (filters?.dateDebut) {
      query += ' AND e.date_entree >= ?';
      params.push(filters.dateDebut);
    }
    if (filters?.dateFin) {
      query += ' AND e.date_entree <= ?';
      params.push(filters.dateFin);
    }
    if (filters?.sourceType) {
      query += ' AND e.source_type = ?';
      params.push(filters.sourceType);
    }

    query += ' ORDER BY e.date_entree DESC';

    return db.prepare(query).all(...params);
  } catch (error) {
    console.error('Error fetching entrees:', error);
    throw error;
  }
});

ipcMain.handle('db-add-entree', async (event, entree) => {
  try {
    const compte = db.prepare('SELECT solde_actuel FROM comptes_tresorerie WHERE id = ?').get(entree.compte_tresorerie_id);
    const soldeAvant = compte?.solde_actuel || 0;
    const soldeApres = soldeAvant + entree.montant;

    db.prepare(`
      INSERT INTO entrees (
        id, compte_tresorerie_id, date_entree, montant, devise,
        source_type, facture_id, description, reference, mode_paiement, cree_par
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      entree.id, entree.compte_tresorerie_id, entree.date_entree,
      entree.montant, entree.devise || 'USD', entree.source_type,
      entree.facture_id || null, entree.description,
      entree.reference || null, entree.mode_paiement || 'ESPECES',
      entree.cree_par || null
    );

    // Update treasury account balance
    db.prepare('UPDATE comptes_tresorerie SET solde_actuel = ? WHERE id = ?')
      .run(soldeApres, entree.compte_tresorerie_id);

    // Record the movement
    const mouvementId = 'mvt-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    db.prepare(`
      INSERT INTO mouvements_tresorerie (
        id, compte_tresorerie_id, date_mouvement, type_mouvement, montant, devise,
        libelle, type_source, source_id, solde_avant, solde_apres
      ) VALUES (?, ?, ?, 'ENTREE', ?, ?, ?, ?, ?, ?, ?)
    `).run(
      mouvementId, entree.compte_tresorerie_id, entree.date_entree,
      entree.montant, entree.devise || 'USD', entree.description,
      entree.source_type === 'PAIEMENT_CLIENT' ? 'PAIEMENT_CLIENT' : 'AUTRE',
      entree.id, soldeAvant, soldeApres
    );

    // If it's a client payment, also record it in paiements table and update invoice status
    if (entree.source_type === 'PAIEMENT_CLIENT' && entree.facture_id) {
      const paiementId = 'pmt-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
      db.prepare(`
        INSERT INTO paiements (
          id, facture_id, date_paiement, montant_paye, devise,
          mode_paiement, reference_paiement, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        paiementId, entree.facture_id, entree.date_entree,
        entree.montant, entree.devise || 'USD',
        entree.mode_paiement || 'ESPECES', entree.reference || null,
        'Enregistré via module Finance'
      );

      // Update invoice payment status
      const facture = db.prepare('SELECT montant_total_du_client FROM factures_clients WHERE id = ?').get(entree.facture_id);
      const totalPaye = db.prepare('SELECT COALESCE(SUM(montant_paye), 0) as total FROM paiements WHERE facture_id = ?').get(entree.facture_id);
      
      if (facture) {
        let newStatus;
        const montantDu = facture.montant_total_du_client || 0;
        const montantPaye = totalPaye?.total || 0;
        
        if (montantPaye >= montantDu) {
          newStatus = 'PAYE_TOTAL';
        } else if (montantPaye > 0) {
          newStatus = 'PAYE_PARTIEL';
        } else {
          newStatus = 'ENVOYE';
        }
        
        db.prepare('UPDATE factures_clients SET statut_paiement = ? WHERE id = ?').run(newStatus, entree.facture_id);
      }
    }

    return { success: true, id: entree.id };
  } catch (error) {
    console.error('Error adding entree:', error);
    throw error;
  }
});

ipcMain.handle('db-update-entree', async (event, entree) => {
  try {
    db.prepare(`
      UPDATE entrees SET
        date_entree = ?, montant = ?, devise = ?, source_type = ?,
        facture_id = ?, description = ?, reference = ?, mode_paiement = ?
      WHERE id = ?
    `).run(
      entree.date_entree, entree.montant, entree.devise || 'USD',
      entree.source_type, entree.facture_id || null, entree.description,
      entree.reference || null, entree.mode_paiement || 'ESPECES', entree.id
    );
    return { success: true };
  } catch (error) {
    console.error('Error updating entree:', error);
    throw error;
  }
});

ipcMain.handle('db-delete-entree', async (event, id) => {
  try {
    const entree = db.prepare('SELECT * FROM entrees WHERE id = ?').get(id);
    if (entree) {
      // Reverse the treasury balance
      const compte = db.prepare('SELECT solde_actuel FROM comptes_tresorerie WHERE id = ?').get(entree.compte_tresorerie_id);
      const nouveauSolde = (compte?.solde_actuel || 0) - entree.montant;
      db.prepare('UPDATE comptes_tresorerie SET solde_actuel = ? WHERE id = ?')
        .run(nouveauSolde, entree.compte_tresorerie_id);
      
      // If it was a client payment, also delete the associated payment record and update invoice status
      if (entree.source_type === 'PAIEMENT_CLIENT' && entree.facture_id) {
        // Find and delete the payment that was created with this entree
        // We match by facture_id, date, and amount
        db.prepare(`
          DELETE FROM paiements 
          WHERE facture_id = ? AND date_paiement = ? AND montant_paye = ?
        `).run(entree.facture_id, entree.date_entree, entree.montant);
        
        // Update invoice payment status
        const facture = db.prepare('SELECT montant_total_du_client FROM factures_clients WHERE id = ?').get(entree.facture_id);
        const totalPaye = db.prepare('SELECT COALESCE(SUM(montant_paye), 0) as total FROM paiements WHERE facture_id = ?').get(entree.facture_id);
        
        if (facture) {
          let newStatus;
          const montantDu = facture.montant_total_du_client || 0;
          const montantPaye = totalPaye?.total || 0;
          
          if (montantPaye >= montantDu) {
            newStatus = 'PAYE_TOTAL';
          } else if (montantPaye > 0) {
            newStatus = 'PAYE_PARTIEL';
          } else {
            newStatus = 'ENVOYE';
          }
          
          db.prepare('UPDATE factures_clients SET statut_paiement = ? WHERE id = ?').run(newStatus, entree.facture_id);
        }
      }
    }

    db.prepare('DELETE FROM mouvements_tresorerie WHERE source_id = ?').run(id);
    db.prepare('DELETE FROM entrees WHERE id = ?').run(id);
    return { success: true };
  } catch (error) {
    console.error('Error deleting entree:', error);
    throw error;
  }
});


// ============================================================================
// HR MODULE - Employees GAS IPC Handlers
// ============================================================================

// Get all employees with optional filters
ipcMain.handle('db-get-employees-gas', async (event, filters) => {
  try {
    let query = `
      SELECT e.*, s.nom_site as site_nom, c.nom_entreprise as client_nom
      FROM employees_gas e
      LEFT JOIN sites_gas s ON e.site_affecte_id = s.id
      LEFT JOIN clients_gas c ON s.client_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (filters?.statut) {
      query += ' AND e.statut = ?';
      params.push(filters.statut);
    }
    if (filters?.categorie) {
      query += ' AND e.categorie = ?';
      params.push(filters.categorie);
    }
    if (filters?.poste) {
      query += ' AND e.poste = ?';
      params.push(filters.poste);
    }
    if (filters?.siteId) {
      query += ' AND e.site_affecte_id = ?';
      params.push(filters.siteId);
    }
    if (filters?.search) {
      query += ' AND (e.nom_complet LIKE ? OR e.matricule LIKE ?)';
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    query += ' ORDER BY e.nom_complet';

    return db.prepare(query).all(...params);
  } catch (error) {
    console.error('Error fetching employees GAS:', error);
    throw error;
  }
});

// Get single employee with full details
ipcMain.handle('db-get-employee-gas', async (event, id) => {
  try {
    const employee = db.prepare(`
      SELECT e.*, s.nom_site as site_nom, c.nom_entreprise as client_nom
      FROM employees_gas e
      LEFT JOIN sites_gas s ON e.site_affecte_id = s.id
      LEFT JOIN clients_gas c ON s.client_id = c.id
      WHERE e.id = ?
    `).get(id);

    if (!employee) return null;

    // Get current deployment
    const currentDeployment = db.prepare(`
      SELECT h.*, s.nom_site, c.nom_entreprise as client_nom
      FROM historique_deployements h
      LEFT JOIN sites_gas s ON h.site_id = s.id
      LEFT JOIN clients_gas c ON s.client_id = c.id
      WHERE h.employe_id = ? AND h.est_actif = 1
    `).get(id);

    // Get leave balance for current year
    const currentYear = new Date().getFullYear();
    const leaveBalance = db.prepare(`
      SELECT * FROM conges_provisions WHERE employe_id = ? AND annee = ?
    `).get(id, currentYear);

    return {
      ...employee,
      currentDeployment,
      leaveBalance
    };
  } catch (error) {
    console.error('Error fetching employee GAS:', error);
    throw error;
  }
});

// Create new employee
ipcMain.handle('db-create-employee-gas', async (event, employee) => {
  try {
    // Validate site capacity if site is assigned
    if (employee.site_affecte_id) {
      const site = db.prepare(`
        SELECT effectif_jour_requis, effectif_nuit_requis, nom_site
        FROM sites_gas WHERE id = ?
      `).get(employee.site_affecte_id);

      if (!site) {
        throw new Error('Site non trouvé');
      }

      const totalCapacity = site.effectif_jour_requis + site.effectif_nuit_requis;
      const currentCount = db.prepare(`
        SELECT COUNT(*) as count
        FROM historique_deployements
        WHERE site_id = ? AND est_actif = 1
      `).get(employee.site_affecte_id);

      if (currentCount.count >= totalCapacity) {
        throw new Error(
          `Impossible d'affecter l'employé à ${site.nom_site}. ` +
          `Capacité maximale atteinte: ${totalCapacity} gardes, ` +
          `Actuellement: ${currentCount.count} gardes affectés.`
        );
      }
    }

    // Generate matricule if not provided
    if (!employee.matricule) {
      const count = db.prepare('SELECT COUNT(*) as count FROM employees_gas').get().count;
      employee.matricule = `GAS-${String(count + 1).padStart(4, '0')}`;
    }

    const stmt = db.prepare(`
      INSERT INTO employees_gas (
        id, matricule, nom_complet, date_naissance, genre, etat_civil,
        numero_id_national, telephone, email, adresse, photo_url,
        document_id_url, document_cv_url, document_casier_url,
        date_embauche, poste, categorie, site_affecte_id,
        mode_remuneration, salaire_base, taux_journalier,
        banque_nom, banque_compte, statut
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      employee.id,
      employee.matricule,
      employee.nom_complet,
      employee.date_naissance || null,
      employee.genre || null,
      employee.etat_civil || null,
      employee.numero_id_national || null,
      employee.telephone || null,
      employee.email || null,
      employee.adresse || null,
      employee.photo_url || null,
      employee.document_id_url || null,
      employee.document_cv_url || null,
      employee.document_casier_url || null,
      employee.date_embauche,
      employee.poste || 'GARDE',
      employee.categorie || 'GARDE',
      employee.site_affecte_id || null,
      employee.mode_remuneration || 'MENSUEL',
      employee.salaire_base || 0,
      employee.taux_journalier || 0,
      employee.banque_nom || null,
      employee.banque_compte || null,
      employee.statut || 'ACTIF'
    );

    // Create initial deployment if site is assigned
    if (employee.site_affecte_id) {
      const deploymentId = 'dep-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
      db.prepare(`
        INSERT INTO historique_deployements (
          id, employe_id, site_id, date_debut, poste, motif_affectation, est_actif
        ) VALUES (?, ?, ?, ?, ?, 'EMBAUCHE', 1)
      `).run(deploymentId, employee.id, employee.site_affecte_id, employee.date_embauche, 'JOUR');
    }

    // Initialize leave provision for current year
    const currentYear = new Date().getFullYear();
    const provisionId = 'prov-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    db.prepare(`
      INSERT OR IGNORE INTO conges_provisions (id, employe_id, annee, jours_acquis, jours_pris, provision_montant)
      VALUES (?, ?, ?, 0, 0, 0)
    `).run(provisionId, employee.id, currentYear);

    return { success: true, id: employee.id, matricule: employee.matricule };
  } catch (error) {
    console.error('Error creating employee GAS:', error);
    throw error;
  }
});

// Update employee
ipcMain.handle('db-update-employee-gas', async (event, employee) => {
  try {
    // Get current employee data
    const currentEmployee = db.prepare('SELECT site_affecte_id FROM employees_gas WHERE id = ?').get(employee.id);
    
    // Check if site is changing
    const siteChanging = currentEmployee && currentEmployee.site_affecte_id !== employee.site_affecte_id;
    
    // Validate new site capacity if site is being assigned or changed
    if (employee.site_affecte_id && siteChanging) {
      const site = db.prepare(`
        SELECT effectif_jour_requis, effectif_nuit_requis, nom_site
        FROM sites_gas WHERE id = ?
      `).get(employee.site_affecte_id);

      if (!site) {
        throw new Error('Site non trouvé');
      }

      const totalCapacity = site.effectif_jour_requis + site.effectif_nuit_requis;
      
      // Count current deployments (excluding this employee if they're being moved)
      const currentCount = db.prepare(`
        SELECT COUNT(*) as count
        FROM historique_deployements
        WHERE site_id = ? AND est_actif = 1 AND employe_id != ?
      `).get(employee.site_affecte_id, employee.id);

      if (currentCount.count >= totalCapacity) {
        throw new Error(
          `Impossible d'affecter l'employé à ${site.nom_site}. ` +
          `Capacité maximale atteinte: ${totalCapacity} gardes, ` +
          `Actuellement: ${currentCount.count} gardes affectés.`
        );
      }

      // Close current deployment if exists
      db.prepare(`
        UPDATE historique_deployements 
        SET est_actif = 0, date_fin = CURRENT_DATE, modifie_le = CURRENT_TIMESTAMP
        WHERE employe_id = ? AND est_actif = 1
      `).run(employee.id);

      // Create new deployment
      const deploymentId = 'dep-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
      db.prepare(`
        INSERT INTO historique_deployements (
          id, employe_id, site_id, date_debut, poste, motif_affectation, est_actif
        ) VALUES (?, ?, ?, CURRENT_DATE, ?, 'TRANSFERT', 1)
      `).run(deploymentId, employee.id, employee.site_affecte_id, 'JOUR');
    }

    const stmt = db.prepare(`
      UPDATE employees_gas SET
        nom_complet = ?, date_naissance = ?, genre = ?, etat_civil = ?,
        numero_id_national = ?, telephone = ?, email = ?, adresse = ?,
        photo_url = ?, document_id_url = ?, document_cv_url = ?, document_casier_url = ?,
        poste = ?, categorie = ?, site_affecte_id = ?,
        mode_remuneration = ?, salaire_base = ?, taux_journalier = ?,
        banque_nom = ?, banque_compte = ?, statut = ?,
        date_fin_contrat = ?, motif_fin = ?, modifie_le = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(
      employee.nom_complet,
      employee.date_naissance || null,
      employee.genre || null,
      employee.etat_civil || null,
      employee.numero_id_national || null,
      employee.telephone || null,
      employee.email || null,
      employee.adresse || null,
      employee.photo_url || null,
      employee.document_id_url || null,
      employee.document_cv_url || null,
      employee.document_casier_url || null,
      employee.poste || 'GARDE',
      employee.categorie || 'GARDE',
      employee.site_affecte_id || null,
      employee.mode_remuneration || 'MENSUEL',
      employee.salaire_base || 0,
      employee.taux_journalier || 0,
      employee.banque_nom || null,
      employee.banque_compte || null,
      employee.statut || 'ACTIF',
      employee.date_fin_contrat || null,
      employee.motif_fin || null,
      employee.id
    );

    return { success: true };
  } catch (error) {
    console.error('Error updating employee GAS:', error);
    throw error;
  }
});

// Soft delete employee
ipcMain.handle('db-delete-employee-gas', async (event, id) => {
  try {
    db.prepare("UPDATE employees_gas SET statut = 'TERMINE', date_fin_contrat = date('now') WHERE id = ?").run(id);
    
    // Close any active deployments
    db.prepare("UPDATE historique_deployements SET est_actif = 0, date_fin = date('now') WHERE employe_id = ? AND est_actif = 1").run(id);
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting employee GAS:', error);
    throw error;
  }
});

// ============================================================================
// HR MODULE - Deployment History IPC Handlers
// ============================================================================

// Get employee deployment history
ipcMain.handle('db-get-employee-deployments', async (event, employeId) => {
  try {
    const deployments = db.prepare(`
      SELECT h.*, s.nom_site, c.nom_entreprise as client_nom,
             CASE 
               WHEN h.date_fin IS NOT NULL THEN julianday(h.date_fin) - julianday(h.date_debut)
               ELSE julianday('now') - julianday(h.date_debut)
             END as duree_jours
      FROM historique_deployements h
      LEFT JOIN sites_gas s ON h.site_id = s.id
      LEFT JOIN clients_gas c ON s.client_id = c.id
      WHERE h.employe_id = ?
      ORDER BY h.date_debut DESC
    `).all(employeId);

    return deployments;
  } catch (error) {
    console.error('Error fetching employee deployments:', error);
    throw error;
  }
});

// Get site deployment history (all guards who worked at a site)
ipcMain.handle('db-get-site-deployment-history', async (event, siteId) => {
  try {
    const deployments = db.prepare(`
      SELECT h.*, e.nom_complet as employe_nom, e.matricule,
             CASE 
               WHEN h.date_fin IS NOT NULL THEN julianday(h.date_fin) - julianday(h.date_debut)
               ELSE julianday('now') - julianday(h.date_debut)
             END as duree_jours
      FROM historique_deployements h
      LEFT JOIN employees_gas e ON h.employe_id = e.id
      WHERE h.site_id = ?
      ORDER BY h.date_debut DESC
    `).all(siteId);

    return deployments;
  } catch (error) {
    console.error('Error fetching site deployment history:', error);
    throw error;
  }
});

// Create new deployment (auto-closes previous)
ipcMain.handle('db-create-deployment', async (event, deployment) => {
  try {
    // Get site capacity and current deployments
    const site = db.prepare(`
      SELECT effectif_jour_requis, effectif_nuit_requis, nom_site
      FROM sites_gas 
      WHERE id = ?
    `).get(deployment.site_id);

    if (!site) {
      throw new Error('Site non trouvé');
    }

    const totalCapacity = site.effectif_jour_requis + site.effectif_nuit_requis;

    // Count current active deployments at this site (excluding the employee being transferred)
    const currentCount = db.prepare(`
      SELECT COUNT(*) as count
      FROM historique_deployements
      WHERE site_id = ? AND est_actif = 1 AND employe_id != ?
    `).get(deployment.site_id, deployment.employe_id);

    // Check if adding this deployment would exceed capacity
    if (currentCount.count >= totalCapacity) {
      throw new Error(
        `Capacité maximale atteinte pour ${site.nom_site}. ` +
        `Capacité: ${totalCapacity} gardes, Actuellement: ${currentCount.count} gardes affectés.`
      );
    }

    // Close any active deployment for this employee
    db.prepare(`
      UPDATE historique_deployements 
      SET est_actif = 0, date_fin = ?, modifie_le = CURRENT_TIMESTAMP
      WHERE employe_id = ? AND est_actif = 1
    `).run(deployment.date_debut, deployment.employe_id);

    // Create new deployment
    const stmt = db.prepare(`
      INSERT INTO historique_deployements (
        id, employe_id, site_id, date_debut, poste, motif_affectation, notes, est_actif, cree_par
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
    `);

    stmt.run(
      deployment.id,
      deployment.employe_id,
      deployment.site_id,
      deployment.date_debut,
      deployment.poste || 'JOUR',
      deployment.motif_affectation || 'TRANSFERT',
      deployment.notes || null,
      deployment.cree_par || null
    );

    // Update employee's current site
    db.prepare('UPDATE employees_gas SET site_affecte_id = ?, modifie_le = CURRENT_TIMESTAMP WHERE id = ?')
      .run(deployment.site_id, deployment.employe_id);

    return { success: true, id: deployment.id };
  } catch (error) {
    console.error('Error creating deployment:', error);
    throw error;
  }
});

// End current deployment
ipcMain.handle('db-end-deployment', async (event, { employeId, dateEnd, notes }) => {
  try {
    db.prepare(`
      UPDATE historique_deployements 
      SET est_actif = 0, date_fin = ?, notes = COALESCE(notes || ' - ', '') || ?, modifie_le = CURRENT_TIMESTAMP
      WHERE employe_id = ? AND est_actif = 1
    `).run(dateEnd, notes || 'Fin de déploiement', employeId);

    // Clear employee's current site
    db.prepare('UPDATE employees_gas SET site_affecte_id = NULL, modifie_le = CURRENT_TIMESTAMP WHERE id = ?')
      .run(employeId);

    return { success: true };
  } catch (error) {
    console.error('Error ending deployment:', error);
    throw error;
  }
});

// Get employee's current deployment
ipcMain.handle('db-get-current-deployment', async (event, employeId) => {
  try {
    const deployment = db.prepare(`
      SELECT h.*, s.nom_site, c.nom_entreprise as client_nom
      FROM historique_deployements h
      LEFT JOIN sites_gas s ON h.site_id = s.id
      LEFT JOIN clients_gas c ON s.client_id = c.id
      WHERE h.employe_id = ? AND h.est_actif = 1
    `).get(employeId);

    return deployment || null;
  } catch (error) {
    console.error('Error fetching current deployment:', error);
    throw error;
  }
});

// ============================================================================
// HR MODULE - Leave Management IPC Handlers
// ============================================================================

// Get leave requests with optional filters
ipcMain.handle('db-get-leave-requests', async (event, filters) => {
  try {
    let query = `
      SELECT d.*, e.nom_complet as employe_nom, e.matricule,
             r.nom_complet as roteur_nom
      FROM demandes_conge d
      LEFT JOIN employees_gas e ON d.employe_id = e.id
      LEFT JOIN employees_gas r ON d.roteur_remplacant_id = r.id
      WHERE 1=1
    `;
    const params = [];

    if (filters?.employeId) {
      query += ' AND d.employe_id = ?';
      params.push(filters.employeId);
    }
    if (filters?.statut) {
      query += ' AND d.statut = ?';
      params.push(filters.statut);
    }
    if (filters?.typeConge) {
      query += ' AND d.type_conge = ?';
      params.push(filters.typeConge);
    }
    if (filters?.dateDebut) {
      query += ' AND d.date_debut >= ?';
      params.push(filters.dateDebut);
    }
    if (filters?.dateFin) {
      query += ' AND d.date_fin <= ?';
      params.push(filters.dateFin);
    }

    query += ' ORDER BY d.cree_le DESC';

    return db.prepare(query).all(...params);
  } catch (error) {
    console.error('Error fetching leave requests:', error);
    throw error;
  }
});

// Create leave request
ipcMain.handle('db-create-leave-request', async (event, request) => {
  try {
    // Check leave balance for annual leave
    if (request.type_conge === 'ANNUEL') {
      const currentYear = new Date().getFullYear();
      const provision = db.prepare(`
        SELECT jours_acquis - jours_pris as jours_restants
        FROM conges_provisions
        WHERE employe_id = ? AND annee = ?
      `).get(request.employe_id, currentYear);

      if (provision && provision.jours_restants < request.nombre_jours) {
        throw new Error(`Solde de congé insuffisant. Disponible: ${provision.jours_restants} jours`);
      }
    }

    const stmt = db.prepare(`
      INSERT INTO demandes_conge (
        id, employe_id, type_conge, date_debut, date_fin, nombre_jours,
        motif, statut, roteur_remplacant_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'EN_ATTENTE', ?)
    `);

    stmt.run(
      request.id,
      request.employe_id,
      request.type_conge,
      request.date_debut,
      request.date_fin,
      request.nombre_jours,
      request.motif || null,
      request.roteur_remplacant_id || null
    );

    return { success: true, id: request.id };
  } catch (error) {
    console.error('Error creating leave request:', error);
    throw error;
  }
});

// Approve leave request
ipcMain.handle('db-approve-leave-request', async (event, { id, approuvePar, notes }) => {
  try {
    const request = db.prepare('SELECT * FROM demandes_conge WHERE id = ?').get(id);
    if (!request) throw new Error('Demande non trouvée');

    // Update request status
    db.prepare(`
      UPDATE demandes_conge SET
        statut = 'APPROUVE',
        approuve_par = ?,
        date_approbation = date('now'),
        notes_approbation = ?
      WHERE id = ?
    `).run(approuvePar, notes || null, id);

    // Deduct from leave balance for annual leave
    if (request.type_conge === 'ANNUEL') {
      const currentYear = new Date().getFullYear();
      db.prepare(`
        UPDATE conges_provisions
        SET jours_pris = jours_pris + ?
        WHERE employe_id = ? AND annee = ?
      `).run(request.nombre_jours, request.employe_id, currentYear);
    }

    return { success: true };
  } catch (error) {
    console.error('Error approving leave request:', error);
    throw error;
  }
});

// Reject leave request
ipcMain.handle('db-reject-leave-request', async (event, { id, approuvePar, notes }) => {
  try {
    db.prepare(`
      UPDATE demandes_conge SET
        statut = 'REFUSE',
        approuve_par = ?,
        date_approbation = date('now'),
        notes_approbation = ?
      WHERE id = ?
    `).run(approuvePar, notes || null, id);

    return { success: true };
  } catch (error) {
    console.error('Error rejecting leave request:', error);
    throw error;
  }
});

// Get leave provisions
ipcMain.handle('db-get-leave-provisions', async (event, filters) => {
  try {
    let query = `
      SELECT p.*, e.nom_complet as employe_nom, e.matricule,
             (p.jours_acquis - p.jours_pris) as jours_restants
      FROM conges_provisions p
      LEFT JOIN employees_gas e ON p.employe_id = e.id
      WHERE 1=1
    `;
    const params = [];

    if (filters?.employeId) {
      query += ' AND p.employe_id = ?';
      params.push(filters.employeId);
    }
    if (filters?.annee) {
      query += ' AND p.annee = ?';
      params.push(filters.annee);
    }

    query += ' ORDER BY p.annee DESC, e.nom_complet';

    return db.prepare(query).all(...params);
  } catch (error) {
    console.error('Error fetching leave provisions:', error);
    throw error;
  }
});

// Calculate and update leave provisions for all employees
ipcMain.handle('db-calculate-leave-provisions', async (event, year) => {
  try {
    const targetYear = year || new Date().getFullYear();
    
    // Get all active employees
    const employees = db.prepare(`
      SELECT id, date_embauche, taux_journalier, salaire_base, mode_remuneration
      FROM employees_gas
      WHERE statut = 'ACTIF'
    `).all();

    for (const emp of employees) {
      const hireDate = new Date(emp.date_embauche);
      const yearStart = new Date(targetYear, 0, 1);
      const yearEnd = new Date(targetYear, 11, 31);
      
      // Calculate months worked in the year
      let monthsWorked = 12;
      if (hireDate.getFullYear() === targetYear) {
        monthsWorked = 12 - hireDate.getMonth();
      } else if (hireDate > yearEnd) {
        monthsWorked = 0;
      }

      // 1.5 days per month worked
      const joursAcquis = monthsWorked * 1.5;

      // Calculate provision amount (daily rate * days acquired)
      const dailyRate = emp.mode_remuneration === 'JOURNALIER' 
        ? emp.taux_journalier 
        : (emp.salaire_base / 26); // Assuming 26 working days per month
      const provisionMontant = joursAcquis * dailyRate;

      // Upsert provision
      const existingProvision = db.prepare(`
        SELECT id, jours_pris FROM conges_provisions WHERE employe_id = ? AND annee = ?
      `).get(emp.id, targetYear);

      if (existingProvision) {
        db.prepare(`
          UPDATE conges_provisions SET jours_acquis = ?, provision_montant = ?
          WHERE id = ?
        `).run(joursAcquis, provisionMontant, existingProvision.id);
      } else {
        const provId = 'prov-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        db.prepare(`
          INSERT INTO conges_provisions (id, employe_id, annee, jours_acquis, jours_pris, provision_montant)
          VALUES (?, ?, ?, ?, 0, ?)
        `).run(provId, emp.id, targetYear, joursAcquis, provisionMontant);
      }
    }

    return { success: true, employeesProcessed: employees.length };
  } catch (error) {
    console.error('Error calculating leave provisions:', error);
    throw error;
  }
});


// ============================================================================
// DISCIPLINARY MODULE - IPC Handlers
// ============================================================================

// Get all disciplinary actions with optional filters
ipcMain.handle('db-get-disciplinary-actions', async (event, filters) => {
  try {
    let query = `
      SELECT a.*, e.nom_complet as employe_nom, e.matricule
      FROM actions_disciplinaires a
      LEFT JOIN employees_gas e ON a.employe_id = e.id
      WHERE 1=1
    `;
    const params = [];

    if (filters?.employeId) {
      query += ' AND a.employe_id = ?';
      params.push(filters.employeId);
    }
    if (filters?.statut) {
      query += ' AND a.statut = ?';
      params.push(filters.statut);
    }
    if (filters?.typeAction) {
      query += ' AND a.type_action = ?';
      params.push(filters.typeAction);
    }
    if (filters?.dateDebut) {
      query += ' AND a.date_incident >= ?';
      params.push(filters.dateDebut);
    }
    if (filters?.dateFin) {
      query += ' AND a.date_incident <= ?';
      params.push(filters.dateFin);
    }

    query += ' ORDER BY a.cree_le DESC';

    return db.prepare(query).all(...params);
  } catch (error) {
    console.error('Error fetching disciplinary actions:', error);
    throw error;
  }
});

// Get single disciplinary action
ipcMain.handle('db-get-disciplinary-action', async (event, id) => {
  try {
    const action = db.prepare(`
      SELECT a.*, e.nom_complet as employe_nom, e.matricule
      FROM actions_disciplinaires a
      LEFT JOIN employees_gas e ON a.employe_id = e.id
      WHERE a.id = ?
    `).get(id);

    return action || null;
  } catch (error) {
    console.error('Error fetching disciplinary action:', error);
    throw error;
  }
});

// Create disciplinary action
ipcMain.handle('db-create-disciplinary-action', async (event, action) => {
  try {
    const stmt = db.prepare(`
      INSERT INTO actions_disciplinaires (
        id, employe_id, type_action, date_incident, description_incident,
        lieu_incident, temoins, impact_financier, montant_deduction,
        jours_suspension, statut, cree_par
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      action.id,
      action.employe_id,
      action.type_action,
      action.date_incident,
      action.description_incident,
      action.lieu_incident || null,
      action.temoins || null,
      action.impact_financier ? 1 : 0,
      action.montant_deduction || 0,
      action.jours_suspension || 0,
      action.statut || 'BROUILLON',
      action.cree_par || null
    );

    return { success: true, id: action.id };
  } catch (error) {
    console.error('Error creating disciplinary action:', error);
    throw error;
  }
});

// Update disciplinary action
ipcMain.handle('db-update-disciplinary-action', async (event, action) => {
  try {
    const stmt = db.prepare(`
      UPDATE actions_disciplinaires SET
        type_action = ?, date_incident = ?, description_incident = ?,
        lieu_incident = ?, temoins = ?, impact_financier = ?,
        montant_deduction = ?, jours_suspension = ?
      WHERE id = ? AND statut IN ('BROUILLON', 'EN_ATTENTE_SIGNATURE')
    `);

    const result = stmt.run(
      action.type_action,
      action.date_incident,
      action.description_incident,
      action.lieu_incident || null,
      action.temoins || null,
      action.impact_financier ? 1 : 0,
      action.montant_deduction || 0,
      action.jours_suspension || 0,
      action.id
    );

    if (result.changes === 0) {
      throw new Error('Action non modifiable (déjà validée ou en cours de validation)');
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating disciplinary action:', error);
    throw error;
  }
});

// Employee signs disciplinary action
ipcMain.handle('db-sign-disciplinary-action', async (event, { id, signature, commentaire }) => {
  try {
    const action = db.prepare('SELECT statut FROM actions_disciplinaires WHERE id = ?').get(id);
    
    if (!action) {
      throw new Error('Action disciplinaire non trouvée');
    }
    
    if (action.statut !== 'EN_ATTENTE_SIGNATURE') {
      throw new Error('Cette action n\'est pas en attente de signature');
    }

    db.prepare(`
      UPDATE actions_disciplinaires SET
        signature_employe = ?,
        date_signature_employe = datetime('now'),
        commentaire_employe = ?,
        statut = 'EN_ATTENTE_VALIDATION'
      WHERE id = ?
    `).run(signature, commentaire || null, id);

    return { success: true };
  } catch (error) {
    console.error('Error signing disciplinary action:', error);
    throw error;
  }
});

// Manager validates disciplinary action
ipcMain.handle('db-validate-disciplinary-action', async (event, { id, validePar, commentaire }) => {
  try {
    const action = db.prepare('SELECT * FROM actions_disciplinaires WHERE id = ?').get(id);
    
    if (!action) {
      throw new Error('Action disciplinaire non trouvée');
    }
    
    // Only accept EN_ATTENTE_VALIDATION status
    if (action.statut !== 'EN_ATTENTE_VALIDATION') {
      throw new Error('Cette action n\'est pas en attente de validation');
    }

    // Update action status
    db.prepare(`
      UPDATE actions_disciplinaires SET
        valide_par = ?,
        date_validation = datetime('now'),
        commentaire_validation = ?,
        statut = 'VALIDE'
      WHERE id = ?
    `).run(validePar, commentaire || null, id);

    // Create deduction if there's a financial impact
    if (action.impact_financier && action.montant_deduction > 0) {
      // Get disciplinary deduction type
      const disciplinaryType = db.prepare('SELECT id FROM deduction_types WHERE code = ?').get('DISCIPLINARY');
      
      if (disciplinaryType) {
        const deductionId = crypto.randomUUID();
        
        // Determine schedule type based on action
        let scheduleType = 'ONE_TIME';
        let installments = 1;
        
        // If deduction amount is large (> 50% of base salary), split into installments
        const employee = db.prepare('SELECT salaire_base FROM employees_gas WHERE id = ?').get(action.employe_id);
        if (employee && employee.salaire_base > 0) {
          const maxMonthlyDeduction = employee.salaire_base * 0.3; // Max 30% per month
          if (action.montant_deduction > maxMonthlyDeduction) {
            scheduleType = 'INSTALLMENTS';
            installments = Math.ceil(action.montant_deduction / maxMonthlyDeduction);
          }
        }
        
        // Create deduction record
        db.prepare(`
          INSERT INTO employee_deductions (
            id, employe_id, deduction_type_id, source_type, source_id,
            title, description, total_amount, amount_remaining,
            schedule_type, installments, status, created_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          deductionId,
          action.employe_id,
          disciplinaryType.id,
          'DISCIPLINARY_ACTION',
          action.id,
          `Sanction disciplinaire - ${action.type_action}`,
          action.description || 'Déduction suite à action disciplinaire',
          action.montant_deduction,
          action.montant_deduction,
          scheduleType,
          installments,
          'ACTIVE',
          validePar
        );
        
        // Create schedule if installments
        if (scheduleType === 'INSTALLMENTS' && installments > 1) {
          const monthlyAmount = Math.ceil(action.montant_deduction / installments * 100) / 100;
          let remainingAmount = action.montant_deduction;
          
          for (let i = 0; i < installments; i++) {
            const scheduleId = crypto.randomUUID();
            const currentDate = new Date();
            const scheduleDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + i + 1, 1);
            
            // Last installment gets the remaining amount to handle rounding
            const installmentAmount = i === installments - 1 ? remainingAmount : monthlyAmount;
            remainingAmount -= installmentAmount;
            
            db.prepare(`
              INSERT INTO deduction_schedule (
                id, deduction_id, period_year, period_month,
                scheduled_amount, status
              ) VALUES (?, ?, ?, ?, ?, ?)
            `).run(
              scheduleId,
              deductionId,
              scheduleDate.getFullYear(),
              scheduleDate.getMonth() + 1,
              installmentAmount,
              'PENDING'
            );
          }
        }
        
        // Link deduction to disciplinary action
        db.prepare(`
          UPDATE actions_disciplinaires SET deduction_id = ? WHERE id = ?
        `).run(deductionId, action.id);
      }
    }

    // If suspension, update employee status
    if (action.type_action === 'SUSPENSION' && action.jours_suspension > 0) {
      db.prepare(`
        UPDATE employees_gas SET statut = 'SUSPENDU', modifie_le = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(action.employe_id);
    }

    // If termination, update employee status
    if (action.type_action === 'LICENCIEMENT') {
      db.prepare(`
        UPDATE employees_gas SET 
          statut = 'TERMINE', 
          date_fin_contrat = date('now'),
          motif_fin = 'Licenciement disciplinaire',
          modifie_le = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(action.employe_id);

      // Close any active deployments
      db.prepare(`
        UPDATE historique_deployements SET est_actif = 0, date_fin = date('now')
        WHERE employe_id = ? AND est_actif = 1
      `).run(action.employe_id);
    }

    return { success: true };
  } catch (error) {
    console.error('Error validating disciplinary action:', error);
    throw error;
  }
});

// Reject disciplinary action
ipcMain.handle('db-reject-disciplinary-action', async (event, { id, validePar, commentaire }) => {
  try {
    const action = db.prepare('SELECT statut FROM actions_disciplinaires WHERE id = ?').get(id);
    
    if (!action) {
      throw new Error('Action disciplinaire non trouvée');
    }
    
    // Only accept EN_ATTENTE_VALIDATION status
    if (action.statut !== 'EN_ATTENTE_VALIDATION') {
      throw new Error('Cette action ne peut pas être rejetée');
    }

    db.prepare(`
      UPDATE actions_disciplinaires SET
        valide_par = ?,
        date_validation = datetime('now'),
        commentaire_validation = ?,
        statut = 'REJETE'
      WHERE id = ?
    `).run(validePar, commentaire || null, id);

    return { success: true };
  } catch (error) {
    console.error('Error rejecting disciplinary action:', error);
    throw error;
  }
});

// Get employee disciplinary history
ipcMain.handle('db-get-employee-disciplinary-history', async (event, employeId) => {
  try {
    const actions = db.prepare(`
      SELECT a.*
      FROM actions_disciplinaires a
      WHERE a.employe_id = ?
      ORDER BY a.date_incident DESC
    `).all(employeId);

    return actions;
  } catch (error) {
    console.error('Error fetching employee disciplinary history:', error);
    throw error;
  }
});

// Submit action for validation (skip signature step)
ipcMain.handle('db-submit-disciplinary-for-signature', async (event, id) => {
  try {
    const action = db.prepare('SELECT statut FROM actions_disciplinaires WHERE id = ?').get(id);
    
    if (!action) {
      throw new Error('Action disciplinaire non trouvée');
    }
    
    if (action.statut !== 'BROUILLON') {
      throw new Error('Seules les actions en brouillon peuvent être soumises');
    }

    // Go directly to EN_ATTENTE_VALIDATION (skip signature step)
    db.prepare(`
      UPDATE actions_disciplinaires SET statut = 'EN_ATTENTE_VALIDATION'
      WHERE id = ?
    `).run(id);

    return { success: true };
  } catch (error) {
    console.error('Error submitting disciplinary action for validation:', error);
    throw error;
  }
});

// Get disciplinary deductions for a payroll period
ipcMain.handle('db-get-payroll-deductions', async (event, { periode_paie_id, mois, annee }) => {
  try {
    let query = `
      SELECT 
        ad.id,
        ad.employe_id,
        ad.type_action,
        ad.date_incident,
        ad.description_incident,
        ad.montant_deduction,
        ad.applique_paie,
        eg.nom_complet,
        eg.matricule
      FROM actions_disciplinaires ad
      JOIN employees_gas eg ON ad.employe_id = eg.id
      WHERE ad.statut = 'VALIDE' 
        AND ad.impact_financier = 1 
        AND ad.montant_deduction > 0
    `;
    
    const params = [];
    
    if (periode_paie_id) {
      // Get deductions for specific period
      query += ` AND (ad.periode_paie_mois IS NULL OR ad.periode_paie_annee IS NULL OR 
                      (ad.periode_paie_mois = ? AND ad.periode_paie_annee = ?))`;
      
      // Get period details to extract month/year
      const period = db.prepare('SELECT mois, annee FROM periodes_paie WHERE id = ?').get(periode_paie_id);
      if (period) {
        params.push(period.mois, period.annee);
      }
    } else if (mois && annee) {
      // Get deductions for specific month/year
      query += ` AND (ad.periode_paie_mois IS NULL OR ad.periode_paie_annee IS NULL OR 
                      (ad.periode_paie_mois = ? AND ad.periode_paie_annee = ?))`;
      params.push(mois, annee);
    }
    
    query += ` ORDER BY ad.date_incident DESC`;
    
    const deductions = db.prepare(query).all(...params);
    
    return deductions;
  } catch (error) {
    console.error('Error getting payroll deductions:', error);
    throw error;
  }
});

// Apply disciplinary deductions to payroll period
ipcMain.handle('db-apply-disciplinary-deductions', async (event, { periode_paie_id, deduction_ids }) => {
  try {
    // Get period details
    const period = db.prepare('SELECT mois, annee FROM periodes_paie WHERE id = ?').get(periode_paie_id);
    if (!period) {
      throw new Error('Période de paie non trouvée');
    }
    
    // Update disciplinary actions to mark them as applied
    const updateStmt = db.prepare(`
      UPDATE actions_disciplinaires 
      SET periode_paie_mois = ?, 
          periode_paie_annee = ?, 
          applique_paie = 1
      WHERE id = ? AND statut = 'VALIDE' AND impact_financier = 1
    `);
    
    let appliedCount = 0;
    for (const deductionId of deduction_ids) {
      const result = updateStmt.run(period.mois, period.annee, deductionId);
      if (result.changes > 0) {
        appliedCount++;
      }
    }
    
    return { success: true, appliedCount };
  } catch (error) {
    console.error('Error applying disciplinary deductions:', error);
    throw error;
  }
});


// ============================================================================
// ALERTS SYSTEM HANDLERS
// ============================================================================

// Get all alerts with optional filters
ipcMain.handle('db-get-alerts', async (event, filters) => {
  try {
    let query = `
      SELECT a.*
      FROM alertes_systeme a
      WHERE 1=1
    `;
    const params = [];

    // Filter by type_alerte
    if (filters?.typeAlerte) {
      query += ' AND a.type_alerte = ?';
      params.push(filters.typeAlerte);
    }

    // Filter by statut
    if (filters?.statut) {
      query += ' AND a.statut = ?';
      params.push(filters.statut);
    }

    // Filter by priorite
    if (filters?.priorite) {
      query += ' AND a.priorite = ?';
      params.push(filters.priorite);
    }

    // Filter by reference_type (vehicule, employe, etc.)
    if (filters?.referenceType) {
      query += ' AND a.reference_type = ?';
      params.push(filters.referenceType);
    }

    // Filter by reference_id
    if (filters?.referenceId) {
      query += ' AND a.reference_id = ?';
      params.push(filters.referenceId);
    }

    // Filter by date_echeance range
    if (filters?.dateEcheanceDebut) {
      query += ' AND a.date_echeance >= ?';
      params.push(filters.dateEcheanceDebut);
    }
    if (filters?.dateEcheanceFin) {
      query += ' AND a.date_echeance <= ?';
      params.push(filters.dateEcheanceFin);
    }

    // Default: order by priority (CRITIQUE first) then by date_echeance
    query += ` ORDER BY 
      CASE a.priorite 
        WHEN 'CRITIQUE' THEN 1 
        WHEN 'HAUTE' THEN 2 
        WHEN 'MOYENNE' THEN 3 
        WHEN 'BASSE' THEN 4 
        ELSE 5 
      END,
      a.date_echeance ASC,
      a.cree_le DESC
    `;

    return db.prepare(query).all(...params);
  } catch (error) {
    console.error('Error fetching alerts:', error);
    throw error;
  }
});


// Acknowledge an alert
ipcMain.handle('db-acknowledge-alert', async (event, { id, acquitteePar }) => {
  try {
    const alert = db.prepare('SELECT statut FROM alertes_systeme WHERE id = ?').get(id);
    
    if (!alert) {
      throw new Error('Alerte non trouvée');
    }
    
    if (alert.statut !== 'ACTIVE') {
      throw new Error('Cette alerte ne peut pas être acquittée');
    }

    db.prepare(`
      UPDATE alertes_systeme SET
        statut = 'ACQUITTEE',
        acquittee_par = ?,
        date_acquittement = datetime('now')
      WHERE id = ?
    `).run(acquitteePar, id);

    return { success: true };
  } catch (error) {
    console.error('Error acknowledging alert:', error);
    throw error;
  }
});


// Run alert check - generates alerts for expiring items
ipcMain.handle('db-run-alert-check', async (event) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const j30 = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const j15 = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    let alertsCreated = 0;

    // Helper function to create alert if not exists
    const createAlertIfNotExists = (alertData) => {
      const existing = db.prepare(`
        SELECT id FROM alertes_systeme 
        WHERE type_alerte = ? AND reference_type = ? AND reference_id = ? AND statut = 'ACTIVE'
      `).get(alertData.type_alerte, alertData.reference_type, alertData.reference_id);

      if (!existing) {
        const id = require('crypto').randomUUID();
        db.prepare(`
          INSERT INTO alertes_systeme (id, type_alerte, reference_type, reference_id, titre, message, date_echeance, priorite)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          id,
          alertData.type_alerte,
          alertData.reference_type,
          alertData.reference_id,
          alertData.titre,
          alertData.message,
          alertData.date_echeance,
          alertData.priorite
        );
        alertsCreated++;
      }
    };

    // Check insurance expiration (J-30)
    const insuranceExpiring = db.prepare(`
      SELECT * FROM vehicules_flotte 
      WHERE assurance_date_fin <= ? AND assurance_date_fin >= ? AND statut = 'ACTIF'
    `).all(j30, today);

    for (const vehicle of insuranceExpiring) {
      createAlertIfNotExists({
        type_alerte: 'ASSURANCE',
        reference_type: 'vehicule',
        reference_id: vehicle.id,
        titre: `Assurance expire bientôt - ${vehicle.immatriculation}`,
        message: `L'assurance du véhicule ${vehicle.marque} ${vehicle.immatriculation} expire le ${vehicle.assurance_date_fin}`,
        date_echeance: vehicle.assurance_date_fin,
        priorite: 'HAUTE'
      });
    }

    // Check technical inspection (J-15)
    const techExpiring = db.prepare(`
      SELECT * FROM vehicules_flotte 
      WHERE controle_technique_expiration <= ? AND controle_technique_expiration >= ? AND statut = 'ACTIF'
    `).all(j15, today);

    for (const vehicle of techExpiring) {
      createAlertIfNotExists({
        type_alerte: 'CONTROLE_TECHNIQUE',
        reference_type: 'vehicule',
        reference_id: vehicle.id,
        titre: `Contrôle technique expire bientôt - ${vehicle.immatriculation}`,
        message: `Le contrôle technique du véhicule ${vehicle.marque} ${vehicle.immatriculation} expire le ${vehicle.controle_technique_expiration}`,
        date_echeance: vehicle.controle_technique_expiration,
        priorite: 'HAUTE'
      });
    }

    // Check employee certifications expiration (J-30)
    try {
      const certExpiring = db.prepare(`
        SELECT c.*, e.first_name, e.last_name, e.employee_number
        FROM certifications c
        JOIN employees e ON c.employee_id = e.id
        WHERE c.expiry_date <= ? AND c.expiry_date >= ? AND c.status = 'active'
      `).all(j30, today);

      for (const cert of certExpiring) {
        createAlertIfNotExists({
          type_alerte: 'CERTIFICATION',
          reference_type: 'certification',
          reference_id: cert.id,
          titre: `Certification expire bientôt - ${cert.first_name} ${cert.last_name}`,
          message: `La certification "${cert.name}" de ${cert.first_name} ${cert.last_name} (${cert.employee_number}) expire le ${cert.expiry_date}`,
          date_echeance: cert.expiry_date,
          priorite: 'HAUTE'
        });
      }
    } catch (e) {
      // certifications table may not exist in all setups
      console.log('Certifications table not available for alert check');
    }

    // Mark expired alerts
    db.prepare(`
      UPDATE alertes_systeme 
      SET statut = 'EXPIREE' 
      WHERE statut = 'ACTIVE' AND date_echeance < ?
    `).run(today);

    return { success: true, alertsCreated };
  } catch (error) {
    console.error('Error running alert check:', error);
    throw error;
  }
});


// Get alert counts for dashboard badge
ipcMain.handle('db-get-alert-counts', async (event) => {
  try {
    const counts = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN statut = 'ACTIVE' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN statut = 'ACTIVE' AND priorite = 'CRITIQUE' THEN 1 ELSE 0 END) as critique,
        SUM(CASE WHEN statut = 'ACTIVE' AND priorite = 'HAUTE' THEN 1 ELSE 0 END) as haute,
        SUM(CASE WHEN statut = 'ACTIVE' AND priorite = 'MOYENNE' THEN 1 ELSE 0 END) as moyenne,
        SUM(CASE WHEN statut = 'ACTIVE' AND priorite = 'BASSE' THEN 1 ELSE 0 END) as basse,
        SUM(CASE WHEN statut = 'ACTIVE' AND type_alerte = 'ASSURANCE' THEN 1 ELSE 0 END) as assurance,
        SUM(CASE WHEN statut = 'ACTIVE' AND type_alerte = 'CONTROLE_TECHNIQUE' THEN 1 ELSE 0 END) as controle_technique,
        SUM(CASE WHEN statut = 'ACTIVE' AND type_alerte = 'CERTIFICATION' THEN 1 ELSE 0 END) as certification,
        SUM(CASE WHEN statut = 'ACTIVE' AND type_alerte = 'CONGE' THEN 1 ELSE 0 END) as conge,
        SUM(CASE WHEN statut = 'ACQUITTEE' THEN 1 ELSE 0 END) as acquittee,
        SUM(CASE WHEN statut = 'EXPIREE' THEN 1 ELSE 0 END) as expiree
      FROM alertes_systeme
    `).get();

    return {
      total: counts.total || 0,
      active: counts.active || 0,
      byPriority: {
        critique: counts.critique || 0,
        haute: counts.haute || 0,
        moyenne: counts.moyenne || 0,
        basse: counts.basse || 0
      },
      byType: {
        assurance: counts.assurance || 0,
        controle_technique: counts.controle_technique || 0,
        certification: counts.certification || 0,
        conge: counts.conge || 0
      },
      acquittee: counts.acquittee || 0,
      expiree: counts.expiree || 0
    };
  } catch (error) {
    console.error('Error fetching alert counts:', error);
    throw error;
  }
});


// ============================================================================
// FLEET MANAGEMENT - Vehicle IPC Handlers
// ============================================================================

// Get all vehicles with optional filters
ipcMain.handle('db-get-vehicles', async (event, filters) => {
  try {
    let query = `
      SELECT v.*, e.nom_complet as employe_nom
      FROM vehicules_flotte v
      LEFT JOIN employees_gas e ON v.employe_responsable_id = e.id
      WHERE 1=1
    `;
    const params = [];

    if (filters?.statut) {
      query += ' AND v.statut = ?';
      params.push(filters.statut);
    }
    if (filters?.typeVehicule) {
      query += ' AND v.type_vehicule = ?';
      params.push(filters.typeVehicule);
    }
    if (filters?.employeId) {
      query += ' AND v.employe_responsable_id = ?';
      params.push(filters.employeId);
    }

    query += ' ORDER BY v.immatriculation';

    return db.prepare(query).all(...params);
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    throw error;
  }
});

// Get single vehicle
ipcMain.handle('db-get-vehicle', async (event, id) => {
  try {
    const vehicle = db.prepare(`
      SELECT v.*, e.nom_complet as employe_nom
      FROM vehicules_flotte v
      LEFT JOIN employees_gas e ON v.employe_responsable_id = e.id
      WHERE v.id = ?
    `).get(id);

    return vehicle || null;
  } catch (error) {
    console.error('Error fetching vehicle:', error);
    throw error;
  }
});

// Create vehicle
ipcMain.handle('db-create-vehicle', async (event, vehicle) => {
  try {
    const stmt = db.prepare(`
      INSERT INTO vehicules_flotte (
        id, type_vehicule, marque, modele, immatriculation, numero_chassis,
        annee_fabrication, couleur, employe_responsable_id, date_affectation,
        assurance_compagnie, assurance_numero_police, assurance_date_debut, assurance_date_fin,
        controle_technique_date, controle_technique_expiration,
        vignette_annee, vignette_montant, taxe_voirie_annee, taxe_voirie_montant,
        statut, kilometrage_actuel
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      vehicle.id,
      vehicle.type_vehicule,
      vehicle.marque,
      vehicle.modele || null,
      vehicle.immatriculation,
      vehicle.numero_chassis || null,
      vehicle.annee_fabrication || null,
      vehicle.couleur || null,
      vehicle.employe_responsable_id || null,
      vehicle.date_affectation || null,
      vehicle.assurance_compagnie || null,
      vehicle.assurance_numero_police || null,
      vehicle.assurance_date_debut || null,
      vehicle.assurance_date_fin || null,
      vehicle.controle_technique_date || null,
      vehicle.controle_technique_expiration || null,
      vehicle.vignette_annee || null,
      vehicle.vignette_montant || null,
      vehicle.taxe_voirie_annee || null,
      vehicle.taxe_voirie_montant || null,
      vehicle.statut || 'ACTIF',
      vehicle.kilometrage_actuel || 0
    );

    return { success: true, id: vehicle.id };
  } catch (error) {
    console.error('Error creating vehicle:', error);
    throw error;
  }
});

// Update vehicle
ipcMain.handle('db-update-vehicle', async (event, vehicle) => {
  try {
    const stmt = db.prepare(`
      UPDATE vehicules_flotte SET
        type_vehicule = ?, marque = ?, modele = ?, immatriculation = ?,
        numero_chassis = ?, annee_fabrication = ?, couleur = ?,
        employe_responsable_id = ?, date_affectation = ?,
        assurance_compagnie = ?, assurance_numero_police = ?,
        assurance_date_debut = ?, assurance_date_fin = ?,
        controle_technique_date = ?, controle_technique_expiration = ?,
        vignette_annee = ?, vignette_montant = ?,
        taxe_voirie_annee = ?, taxe_voirie_montant = ?,
        statut = ?, kilometrage_actuel = ?,
        modifie_le = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(
      vehicle.type_vehicule,
      vehicle.marque,
      vehicle.modele || null,
      vehicle.immatriculation,
      vehicle.numero_chassis || null,
      vehicle.annee_fabrication || null,
      vehicle.couleur || null,
      vehicle.employe_responsable_id || null,
      vehicle.date_affectation || null,
      vehicle.assurance_compagnie || null,
      vehicle.assurance_numero_police || null,
      vehicle.assurance_date_debut || null,
      vehicle.assurance_date_fin || null,
      vehicle.controle_technique_date || null,
      vehicle.controle_technique_expiration || null,
      vehicle.vignette_annee || null,
      vehicle.vignette_montant || null,
      vehicle.taxe_voirie_annee || null,
      vehicle.taxe_voirie_montant || null,
      vehicle.statut || 'ACTIF',
      vehicle.kilometrage_actuel || 0,
      vehicle.id
    );

    return { success: true };
  } catch (error) {
    console.error('Error updating vehicle:', error);
    throw error;
  }
});

// Delete vehicle (soft delete by setting status to HORS_SERVICE)
ipcMain.handle('db-delete-vehicle', async (event, id) => {
  try {
    db.prepare(`
      UPDATE vehicules_flotte SET statut = 'HORS_SERVICE', modifie_le = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(id);

    return { success: true };
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    throw error;
  }
});

// ============================================================================
// FUEL CONSUMPTION HANDLERS
// ============================================================================

// Get fuel consumption records with optional filters
ipcMain.handle('db-get-fuel-consumption', async (event, filters = {}) => {
  try {
    let query = `
      SELECT 
        cf.*,
        v.immatriculation as vehicule_immatriculation,
        v.marque as vehicule_marque,
        v.modele as vehicule_modele,
        c.nom_complet as conducteur_nom
      FROM consommation_carburant cf
      LEFT JOIN vehicules_flotte v ON cf.vehicule_id = v.id
      LEFT JOIN employees_gas c ON cf.conducteur_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.vehiculeId) {
      query += ' AND cf.vehicule_id = ?';
      params.push(filters.vehiculeId);
    }

    if (filters.conducteurId) {
      query += ' AND cf.conducteur_id = ?';
      params.push(filters.conducteurId);
    }

    if (filters.dateDebut) {
      query += ' AND cf.date_plein >= ?';
      params.push(filters.dateDebut);
    }

    if (filters.dateFin) {
      query += ' AND cf.date_plein <= ?';
      params.push(filters.dateFin);
    }

    query += ' ORDER BY cf.date_plein DESC';

    return db.prepare(query).all(...params);
  } catch (error) {
    console.error('Error fetching fuel consumption:', error);
    throw error;
  }
});

// Create fuel consumption record
ipcMain.handle('db-create-fuel-consumption', async (event, consumption) => {
  try {
    const id = consumption.id || crypto.randomUUID();
    
    const stmt = db.prepare(`
      INSERT INTO consommation_carburant (
        id, vehicule_id, date_plein, quantite_litres, prix_unitaire,
        montant_total, kilometrage, station, conducteur_id, depense_id, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      consumption.vehicule_id,
      consumption.date_plein,
      consumption.quantite_litres,
      consumption.prix_unitaire,
      consumption.montant_total,
      consumption.kilometrage || null,
      consumption.station || null,
      consumption.conducteur_id || null,
      consumption.depense_id || null,
      consumption.notes || null
    );

    // Update vehicle kilometrage if provided
    if (consumption.kilometrage) {
      db.prepare(`
        UPDATE vehicules_flotte 
        SET kilometrage_actuel = ?, modifie_le = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(consumption.kilometrage, consumption.vehicule_id);
    }

    return { success: true, id };
  } catch (error) {
    console.error('Error creating fuel consumption:', error);
    throw error;
  }
});

// ============================================================================
// VEHICLE REPAIRS/MAINTENANCE HANDLERS
// ============================================================================

// Get vehicle repairs with optional filters
ipcMain.handle('db-get-vehicle-repairs', async (event, filters = {}) => {
  try {
    let query = `
      SELECT 
        r.*,
        v.immatriculation as vehicule_immatriculation,
        v.marque as vehicule_marque,
        v.modele as vehicule_modele
      FROM reparations_vehicules r
      LEFT JOIN vehicules_flotte v ON r.vehicule_id = v.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.vehiculeId) {
      query += ' AND r.vehicule_id = ?';
      params.push(filters.vehiculeId);
    }

    if (filters.typeReparation) {
      query += ' AND r.type_reparation = ?';
      params.push(filters.typeReparation);
    }

    if (filters.dateDebut) {
      query += ' AND r.date_reparation >= ?';
      params.push(filters.dateDebut);
    }

    if (filters.dateFin) {
      query += ' AND r.date_reparation <= ?';
      params.push(filters.dateFin);
    }

    query += ' ORDER BY r.date_reparation DESC';

    return db.prepare(query).all(...params);
  } catch (error) {
    console.error('Error fetching vehicle repairs:', error);
    throw error;
  }
});

// Create vehicle repair record
ipcMain.handle('db-create-vehicle-repair', async (event, repair) => {
  try {
    const id = repair.id || crypto.randomUUID();
    
    const stmt = db.prepare(`
      INSERT INTO reparations_vehicules (
        id, vehicule_id, date_reparation, type_reparation, description,
        garage, cout_main_oeuvre, cout_pieces, montant_total,
        kilometrage, prochaine_revision_km, prochaine_revision_date,
        depense_id, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      repair.vehicule_id,
      repair.date_reparation,
      repair.type_reparation,
      repair.description,
      repair.garage || null,
      repair.cout_main_oeuvre || 0,
      repair.cout_pieces || 0,
      repair.montant_total,
      repair.kilometrage || null,
      repair.prochaine_revision_km || null,
      repair.prochaine_revision_date || null,
      repair.depense_id || null,
      repair.notes || null
    );

    // Update vehicle kilometrage if provided
    if (repair.kilometrage) {
      db.prepare(`
        UPDATE vehicules_flotte 
        SET kilometrage_actuel = ?, modifie_le = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(repair.kilometrage, repair.vehicule_id);
    }

    return { success: true, id };
  } catch (error) {
    console.error('Error creating vehicle repair:', error);
    throw error;
  }
});

// ============================================================================
// INVENTORY MODULE - Equipment IPC Handlers
// ============================================================================

// Get all equipment with optional filters
ipcMain.handle('db-get-equipment', async (event, filters) => {
  try {
    let query = `
      SELECT e.*, 
             ae.employe_id as employe_affecte_id,
             emp.nom_complet as employe_affecte_nom
      FROM equipements e
      LEFT JOIN (
        SELECT equipement_id, employe_id 
        FROM affectations_equipement 
        WHERE date_retour IS NULL
      ) ae ON e.id = ae.equipement_id
      LEFT JOIN employees_gas emp ON ae.employe_id = emp.id
      WHERE 1=1
    `;
    const params = [];

    if (filters?.categorie) {
      query += ' AND e.categorie = ?';
      params.push(filters.categorie);
    }
    if (filters?.statut) {
      query += ' AND e.statut = ?';
      params.push(filters.statut);
    }
    if (filters?.etat) {
      query += ' AND e.etat = ?';
      params.push(filters.etat);
    }
    if (filters?.employeId) {
      query += ' AND ae.employe_id = ?';
      params.push(filters.employeId);
    }

    query += ' ORDER BY e.code_equipement';

    return db.prepare(query).all(...params);
  } catch (error) {
    console.error('Error fetching equipment:', error);
    throw error;
  }
});

// Get single equipment item
ipcMain.handle('db-get-equipment-item', async (event, id) => {
  try {
    const equipment = db.prepare(`
      SELECT e.*, 
             ae.employe_id as employe_affecte_id,
             emp.nom_complet as employe_affecte_nom
      FROM equipements e
      LEFT JOIN (
        SELECT equipement_id, employe_id 
        FROM affectations_equipement 
        WHERE date_retour IS NULL
      ) ae ON e.id = ae.equipement_id
      LEFT JOIN employees_gas emp ON ae.employe_id = emp.id
      WHERE e.id = ?
    `).get(id);

    return equipment || null;
  } catch (error) {
    console.error('Error fetching equipment item:', error);
    throw error;
  }
});

// Create equipment
ipcMain.handle('db-create-equipment', async (event, equipment) => {
  try {
    // Generate code if not provided
    let code = equipment.code_equipement;
    if (!code) {
      const prefix = equipment.categorie.substring(0, 3).toUpperCase();
      const count = db.prepare('SELECT COUNT(*) as count FROM equipements WHERE categorie = ?').get(equipment.categorie);
      code = `${prefix}-${String((count.count || 0) + 1).padStart(4, '0')}`;
    }

    // Generate QR code value
    const qrCode = `EQ-${equipment.id}`;

    const stmt = db.prepare(`
      INSERT INTO equipements (
        id, code_equipement, qr_code, categorie, designation, description,
        numero_serie, date_acquisition, cout_acquisition, etat, statut
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      equipment.id,
      code,
      qrCode,
      equipment.categorie,
      equipment.designation,
      equipment.description || null,
      equipment.numero_serie || null,
      equipment.date_acquisition || null,
      equipment.cout_acquisition || null,
      equipment.etat || 'NEUF',
      equipment.statut || 'DISPONIBLE'
    );

    return { success: true, id: equipment.id, code_equipement: code };
  } catch (error) {
    console.error('Error creating equipment:', error);
    throw error;
  }
});

// Update equipment
ipcMain.handle('db-update-equipment', async (event, equipment) => {
  try {
    const stmt = db.prepare(`
      UPDATE equipements SET
        categorie = ?, designation = ?, description = ?,
        numero_serie = ?, date_acquisition = ?, cout_acquisition = ?,
        etat = ?, statut = ?
      WHERE id = ?
    `);

    stmt.run(
      equipment.categorie,
      equipment.designation,
      equipment.description || null,
      equipment.numero_serie || null,
      equipment.date_acquisition || null,
      equipment.cout_acquisition || null,
      equipment.etat || 'NEUF',
      equipment.statut || 'DISPONIBLE',
      equipment.id
    );

    return { success: true };
  } catch (error) {
    console.error('Error updating equipment:', error);
    throw error;
  }
});

// Assign equipment to employee
ipcMain.handle('db-assign-equipment', async (event, assignment) => {
  try {
    // Check if equipment is available
    const equipment = db.prepare('SELECT statut FROM equipements WHERE id = ?').get(assignment.equipement_id);
    if (!equipment) {
      throw new Error('Équipement non trouvé');
    }
    if (equipment.statut !== 'DISPONIBLE') {
      throw new Error('Équipement non disponible pour affectation');
    }

    // Create assignment record
    db.prepare(`
      INSERT INTO affectations_equipement (
        id, equipement_id, employe_id, date_affectation, signature_affectation, notes
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      assignment.id,
      assignment.equipement_id,
      assignment.employe_id,
      assignment.date_affectation || new Date().toISOString().split('T')[0],
      assignment.signature_affectation || null,
      assignment.notes || null
    );

    // Update equipment status
    db.prepare(`
      UPDATE equipements SET statut = 'AFFECTE' WHERE id = ?
    `).run(assignment.equipement_id);

    return { success: true, id: assignment.id };
  } catch (error) {
    console.error('Error assigning equipment:', error);
    throw error;
  }
});

// Return equipment
ipcMain.handle('db-return-equipment', async (event, returnData) => {
  try {
    // Find active assignment
    const assignment = db.prepare(`
      SELECT id FROM affectations_equipement 
      WHERE equipement_id = ? AND date_retour IS NULL
    `).get(returnData.equipement_id);

    if (!assignment) {
      throw new Error('Aucune affectation active trouvée pour cet équipement');
    }

    // Update assignment with return info
    db.prepare(`
      UPDATE affectations_equipement SET
        date_retour = ?, signature_retour = ?, etat_retour = ?, notes = COALESCE(notes || ' | ', '') || ?
      WHERE id = ?
    `).run(
      returnData.date_retour || new Date().toISOString().split('T')[0],
      returnData.signature_retour || null,
      returnData.etat_retour || 'BON',
      returnData.notes || '',
      assignment.id
    );

    // Update equipment status and condition
    db.prepare(`
      UPDATE equipements SET 
        statut = 'DISPONIBLE',
        etat = ?
      WHERE id = ?
    `).run(returnData.etat_retour || 'BON', returnData.equipement_id);

    return { success: true };
  } catch (error) {
    console.error('Error returning equipment:', error);
    throw error;
  }
});

// Get employee's assigned equipment
ipcMain.handle('db-get-employee-equipment', async (event, employeId) => {
  try {
    const equipment = db.prepare(`
      SELECT e.*, ae.date_affectation, ae.signature_affectation, ae.notes as affectation_notes
      FROM equipements e
      JOIN affectations_equipement ae ON e.id = ae.equipement_id
      WHERE ae.employe_id = ? AND ae.date_retour IS NULL
      ORDER BY ae.date_affectation DESC
    `).all(employeId);

    return equipment;
  } catch (error) {
    console.error('Error fetching employee equipment:', error);
    throw error;
  }
});


// ============================================================================
// DASHBOARD STATISTICS HANDLERS
// ============================================================================

// Get HR Statistics
ipcMain.handle('db-get-hr-stats', async () => {
  try {
    const totalEmployees = db.prepare('SELECT COUNT(*) as count FROM employees_gas').get().count;
    const activeEmployees = db.prepare('SELECT COUNT(*) as count FROM employees_gas WHERE statut = ?').get('ACTIF').count;
    const guardsCount = db.prepare('SELECT COUNT(*) as count FROM employees_gas WHERE categorie = ? AND statut = ?').get('GARDE', 'ACTIF').count;
    const roteursCount = db.prepare('SELECT COUNT(*) as count FROM employees_gas WHERE categorie = ? AND statut = ?').get('ROTEUR', 'ACTIF').count;
    const supervisorsCount = db.prepare('SELECT COUNT(*) as count FROM employees_gas WHERE categorie = ? AND statut = ?').get('SUPERVISEUR', 'ACTIF').count;
    const adminCount = db.prepare('SELECT COUNT(*) as count FROM employees_gas WHERE categorie = ? AND statut = ?').get('ADMINISTRATION', 'ACTIF').count;
    
    // Count employees currently on leave
    const onLeaveCount = db.prepare(`
      SELECT COUNT(DISTINCT employe_id) as count 
      FROM demandes_conge 
      WHERE statut = 'APPROUVE' 
      AND date('now') BETWEEN date_debut AND date_fin
    `).get().count;
    
    // Count pending leave requests
    const pendingLeaveRequests = db.prepare(`
      SELECT COUNT(*) as count 
      FROM demandes_conge 
      WHERE statut = 'EN_ATTENTE'
    `).get().count;

    return {
      totalEmployees,
      activeEmployees,
      guardsCount,
      roteursCount,
      supervisorsCount,
      adminCount,
      onLeaveCount,
      pendingLeaveRequests
    };
  } catch (error) {
    console.error('Error fetching HR stats:', error);
    throw error;
  }
});

// Get Fleet Statistics
ipcMain.handle('db-get-fleet-stats', async () => {
  try {
    const totalVehicles = db.prepare('SELECT COUNT(*) as count FROM vehicules_flotte').get().count;
    const activeVehicles = db.prepare('SELECT COUNT(*) as count FROM vehicules_flotte WHERE statut = ?').get('ACTIF').count;
    const inRepairVehicles = db.prepare('SELECT COUNT(*) as count FROM vehicules_flotte WHERE statut = ?').get('EN_REPARATION').count;
    
    // Count vehicles with expiring insurance (within 30 days)
    const expiringInsurance = db.prepare(`
      SELECT COUNT(*) as count 
      FROM vehicules_flotte 
      WHERE assurance_date_fin IS NOT NULL 
      AND date(assurance_date_fin) BETWEEN date('now') AND date('now', '+30 days')
    `).get().count;
    
    // Count vehicles with expiring technical inspection (within 30 days)
    const expiringTechnicalInspection = db.prepare(`
      SELECT COUNT(*) as count 
      FROM vehicules_flotte 
      WHERE controle_technique_expiration IS NOT NULL 
      AND date(controle_technique_expiration) BETWEEN date('now') AND date('now', '+30 days')
    `).get().count;

    return {
      totalVehicles,
      activeVehicles,
      inRepairVehicles,
      expiringInsurance,
      expiringTechnicalInspection
    };
  } catch (error) {
    console.error('Error fetching fleet stats:', error);
    throw error;
  }
});

// Get Inventory Statistics
ipcMain.handle('db-get-inventory-stats', async () => {
  try {
    const totalEquipment = db.prepare('SELECT COUNT(*) as count FROM equipements').get().count;
    const availableEquipment = db.prepare('SELECT COUNT(*) as count FROM equipements WHERE statut = ?').get('DISPONIBLE').count;
    const assignedEquipment = db.prepare('SELECT COUNT(*) as count FROM equipements WHERE statut = ?').get('AFFECTE').count;
    const damagedEquipment = db.prepare('SELECT COUNT(*) as count FROM equipements WHERE etat IN (?, ?)').get('ENDOMMAGE', 'PERDU').count;

    return {
      totalEquipment,
      availableEquipment,
      assignedEquipment,
      damagedEquipment
    };
  } catch (error) {
    console.error('Error fetching inventory stats:', error);
    throw error;
  }
});

// Get Disciplinary Statistics
ipcMain.handle('db-get-disciplinary-stats', async () => {
  try {
    const pendingActions = db.prepare('SELECT COUNT(*) as count FROM actions_disciplinaires WHERE statut = ?').get('BROUILLON').count;
    const pendingSignatures = db.prepare('SELECT COUNT(*) as count FROM actions_disciplinaires WHERE statut = ?').get('EN_ATTENTE_SIGNATURE').count;
    const pendingValidations = db.prepare('SELECT COUNT(*) as count FROM actions_disciplinaires WHERE statut = ?').get('EN_ATTENTE_VALIDATION').count;
    
    // Count actions from this month
    const thisMonthActions = db.prepare(`
      SELECT COUNT(*) as count 
      FROM actions_disciplinaires 
      WHERE strftime('%Y-%m', date_incident) = strftime('%Y-%m', 'now')
    `).get().count;

    return {
      pendingActions,
      pendingSignatures,
      pendingValidations,
      thisMonthActions
    };
  } catch (error) {
    console.error('Error fetching disciplinary stats:', error);
    throw error;
  }
});

// ============================================================================
// USER AUTHENTICATION & MANAGEMENT
// ============================================================================

// Authenticate user
ipcMain.handle('auth-authenticate-user', async (event, username, password) => {
  console.log('🔐 [AUTH] Tentative d\'authentification pour:', username);
  
  try {
    const hashedPassword = hashPassword(password);
    const user = db.prepare(`
      SELECT id, nom_utilisateur, nom_complet, email, role, statut, derniere_connexion, cree_le
      FROM users 
      WHERE nom_utilisateur = ? AND mot_de_passe_hash = ?
    `).get(username, hashedPassword);

    if (user) {
      console.log('✅ [AUTH] Authentification réussie pour:', user.nom_complet);
      return user;
    } else {
      console.log('❌ [AUTH] Échec d\'authentification pour:', username);
      return null;
    }
  } catch (error) {
    console.error('❌ [AUTH] Erreur lors de l\'authentification:', error);
    throw error;
  }
});

// Get user by ID
ipcMain.handle('auth-get-user-by-id', async (event, userId) => {
  try {
    const user = db.prepare(`
      SELECT id, nom_utilisateur, nom_complet, email, role, statut, derniere_connexion, cree_le
      FROM users 
      WHERE id = ?
    `).get(userId);
    
    return user;
  } catch (error) {
    console.error('❌ [AUTH] Erreur lors de la récupération de l\'utilisateur:', error);
    throw error;
  }
});

// Update last login
ipcMain.handle('auth-update-last-login', async (event, userId) => {
  try {
    const now = new Date().toISOString();
    db.prepare(`
      UPDATE users 
      SET derniere_connexion = ?, modifie_le = ?
      WHERE id = ?
    `).run(now, now, userId);
    
    console.log('✅ [AUTH] Dernière connexion mise à jour pour:', userId);
    return { success: true };
  } catch (error) {
    console.error('❌ [AUTH] Erreur lors de la mise à jour de la dernière connexion:', error);
    throw error;
  }
});

// Get all users
ipcMain.handle('auth-get-users', async (event) => {
  try {
    const users = db.prepare(`
      SELECT id, nom_utilisateur, nom_complet, email, role, statut, derniere_connexion, cree_le
      FROM users 
      ORDER BY nom_complet
    `).all();
    
    return users;
  } catch (error) {
    console.error('❌ [AUTH] Erreur lors de la récupération des utilisateurs:', error);
    throw error;
  }
});

// Create user
ipcMain.handle('auth-create-user', async (event, userData) => {
  try {
    const { nom_utilisateur, nom_complet, email, role, statut, mot_de_passe } = userData;
    const id = crypto.randomUUID();
    const hashedPassword = hashPassword(mot_de_passe);
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO users (id, nom_utilisateur, mot_de_passe_hash, nom_complet, email, role, statut, cree_le, modifie_le)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, nom_utilisateur, hashedPassword, nom_complet, email || null, role, statut, now, now);

    console.log('✅ [AUTH] Utilisateur créé:', nom_complet);
    return { success: true, id };
  } catch (error) {
    console.error('❌ [AUTH] Erreur lors de la création de l\'utilisateur:', error);
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      throw new Error('Ce nom d\'utilisateur existe déjà.');
    }
    throw error;
  }
});

// Update user
ipcMain.handle('auth-update-user', async (event, userData) => {
  try {
    const { id, nom_utilisateur, nom_complet, email, role, statut, mot_de_passe } = userData;
    const now = new Date().toISOString();

    if (mot_de_passe) {
      // Update with new password
      const hashedPassword = hashPassword(mot_de_passe);
      db.prepare(`
        UPDATE users 
        SET nom_utilisateur = ?, mot_de_passe_hash = ?, nom_complet = ?, email = ?, role = ?, statut = ?, modifie_le = ?
        WHERE id = ?
      `).run(nom_utilisateur, hashedPassword, nom_complet, email || null, role, statut, now, id);
    } else {
      // Update without changing password
      db.prepare(`
        UPDATE users 
        SET nom_utilisateur = ?, nom_complet = ?, email = ?, role = ?, statut = ?, modifie_le = ?
        WHERE id = ?
      `).run(nom_utilisateur, nom_complet, email || null, role, statut, now, id);
    }

    console.log('✅ [AUTH] Utilisateur mis à jour:', nom_complet);
    return { success: true };
  } catch (error) {
    console.error('❌ [AUTH] Erreur lors de la mise à jour de l\'utilisateur:', error);
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      throw new Error('Ce nom d\'utilisateur existe déjà.');
    }
    throw error;
  }
});

// Delete user
ipcMain.handle('auth-delete-user', async (event, userId) => {
  try {
    db.prepare('DELETE FROM users WHERE id = ?').run(userId);
    console.log('✅ [AUTH] Utilisateur supprimé:', userId);
    return { success: true };
  } catch (error) {
    console.error('❌ [AUTH] Erreur lors de la suppression de l\'utilisateur:', error);
    throw error;
  }
});

// Update user status
ipcMain.handle('auth-update-user-status', async (event, userId, status) => {
  try {
    const now = new Date().toISOString();
    db.prepare(`
      UPDATE users 
      SET statut = ?, modifie_le = ?
      WHERE id = ?
    `).run(status, now, userId);

    console.log('✅ [AUTH] Statut utilisateur mis à jour:', userId, status);
    return { success: true };
  } catch (error) {
    console.error('❌ [AUTH] Erreur lors de la mise à jour du statut:', error);
    throw error;
  }
});

// ============================================================================
// USER SETTINGS & QUICK ACTIONS
// ============================================================================

// Get user settings
ipcMain.handle('db-get-user-settings', async (event, userId) => {
  try {
    const settings = db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(userId);
    
    if (settings) {
      // Parse JSON fields
      return {
        ...settings,
        quick_actions: settings.quick_actions ? JSON.parse(settings.quick_actions) : [],
        preferences: settings.preferences ? JSON.parse(settings.preferences) : {}
      };
    }
    
    // Return default settings if none exist
    return {
      id: crypto.randomUUID(),
      user_id: userId,
      user_role: 'ADMIN',
      quick_actions: [],
      preferences: {}
    };
  } catch (error) {
    console.error('Error fetching user settings:', error);
    throw error;
  }
});

// Save user settings
ipcMain.handle('db-save-user-settings', async (event, settings) => {
  try {
    const { id, user_id, user_role, quick_actions, preferences } = settings;
    
    // Check if settings exist
    const existing = db.prepare('SELECT id FROM user_settings WHERE user_id = ?').get(user_id);
    
    if (existing) {
      // Update existing settings
      db.prepare(`
        UPDATE user_settings
        SET quick_actions = ?,
            preferences = ?,
            user_role = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `).run(
        JSON.stringify(quick_actions || []),
        JSON.stringify(preferences || {}),
        user_role,
        user_id
      );
    } else {
      // Insert new settings
      db.prepare(`
        INSERT INTO user_settings (id, user_id, user_role, quick_actions, preferences)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        id || crypto.randomUUID(),
        user_id,
        user_role,
        JSON.stringify(quick_actions || []),
        JSON.stringify(preferences || {})
      );
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error saving user settings:', error);
    throw error;
  }
});

// Get available quick actions based on user role
ipcMain.handle('db-get-available-quick-actions', async (event, userRole) => {
  try {
    const allActions = [
      { id: 'add-employee', label: 'Nouvel Employé', icon: 'Users', module: 'hr', color: 'blue', roles: ['ADMIN', 'CEO', 'OPS_MANAGER'] },
      { id: 'add-client', label: 'Nouveau Client', icon: 'Building2', module: 'finance', color: 'green', roles: ['ADMIN', 'CEO', 'FINANCE'] },
      { id: 'create-invoice', label: 'Nouvelle Facture', icon: 'FileText', module: 'finance', color: 'purple', roles: ['ADMIN', 'CEO', 'FINANCE'] },
      { id: 'view-planning', label: 'Planning', icon: 'Calendar', module: 'operations', color: 'orange', roles: ['ADMIN', 'CEO', 'OPS_MANAGER', 'SUPERVISOR'] },
      { id: 'add-site', label: 'Nouveau Site', icon: 'MapPin', module: 'finance', color: 'teal', roles: ['ADMIN', 'CEO', 'OPS_MANAGER'] },
      { id: 'payroll', label: 'Paie', icon: 'DollarSign', module: 'payroll-module', color: 'emerald', roles: ['ADMIN', 'CEO', 'FINANCE'] },
      { id: 'add-vehicle', label: 'Nouveau Véhicule', icon: 'Truck', module: 'logistics-module', color: 'indigo', roles: ['ADMIN', 'CEO', 'OPS_MANAGER'] },
      { id: 'add-equipment', label: 'Nouvel Équipement', icon: 'Package', module: 'logistics-module', color: 'pink', roles: ['ADMIN', 'CEO', 'OPS_MANAGER'] },
      { id: 'view-alerts', label: 'Alertes', icon: 'Bell', module: 'dashboard', color: 'red', roles: ['ADMIN', 'CEO', 'OPS_MANAGER', 'SUPERVISOR'] },
      { id: 'view-reports', label: 'Rapports', icon: 'BarChart3', module: 'analytics', color: 'violet', roles: ['ADMIN', 'CEO', 'FINANCE'] },
      { id: 'leave-requests', label: 'Demandes de Congé', icon: 'CalendarCheck', module: 'hr-module', color: 'amber', roles: ['ADMIN', 'CEO', 'OPS_MANAGER'] },
      { id: 'disciplinary', label: 'Actions Disciplinaires', icon: 'AlertTriangle', module: 'operations-module', color: 'rose', roles: ['ADMIN', 'CEO', 'OPS_MANAGER', 'SUPERVISOR'] }
    ];
    
    // Filter actions based on user role
    const availableActions = allActions.filter(action => 
      action.roles.includes(userRole) || userRole === 'ADMIN'
    );
    
    return availableActions;
  } catch (error) {
    console.error('Error fetching available quick actions:', error);
    throw error;
  }
});

// ============================================================================
// TAX SETTINGS
// ============================================================================

// Get all tax settings
ipcMain.handle('db-get-tax-settings', async () => {
  try {
    console.log('=== ELECTRON TAX SETTINGS DEBUG ===');
    console.log('Fetching tax settings...');
    const settings = db.prepare('SELECT * FROM tax_settings ORDER BY category, setting_name').all();
    console.log(`Found ${settings.length} tax settings`);
    console.log('Raw settings from database:', settings);
    
    // Parse values appropriately
    const parsedSettings = settings.map(setting => {
      console.log(`Processing setting: ${setting.setting_name} = ${setting.setting_value} (type: ${typeof setting.setting_value})`);
      
      if (setting.setting_name === 'IPR_BRACKETS') {
        try {
          const parsed = {
            ...setting,
            setting_value: JSON.parse(setting.setting_value)
          };
          console.log(`IPR_BRACKETS parsed successfully`);
          return parsed;
        } catch (e) {
          console.error('Error parsing IPR_BRACKETS:', e);
          return setting;
        }
      }
      // Parse numeric values
      const numValue = parseFloat(setting.setting_value);
      const result = {
        ...setting,
        setting_value: isNaN(numValue) ? setting.setting_value : numValue
      };
      console.log(`${setting.setting_name}: ${setting.setting_value} -> ${result.setting_value} (${typeof result.setting_value})`);
      return result;
    });
    
    console.log('Final parsed settings:', parsedSettings);
    console.log('=== END ELECTRON TAX SETTINGS DEBUG ===');
    return parsedSettings;
  } catch (error) {
    console.error('Error fetching tax settings:', error);
    throw error;
  }
});

// Update tax setting
ipcMain.handle('db-update-tax-setting', async (event, { setting_name, setting_value, updated_by }) => {
  try {
    // Convert value to string for storage
    const valueStr = typeof setting_value === 'object' 
      ? JSON.stringify(setting_value) 
      : String(setting_value);
    
    db.prepare(`
      UPDATE tax_settings
      SET setting_value = ?,
          updated_at = CURRENT_TIMESTAMP,
          updated_by = ?
      WHERE setting_name = ?
    `).run(valueStr, updated_by || 'system', setting_name);
    
    return { success: true };
  } catch (error) {
    console.error('Error updating tax setting:', error);
    throw error;
  }
});

// Reset tax settings to default
ipcMain.handle('db-reset-tax-settings', async () => {
  try {
    const defaultSettings = {
      'CNSS_RATE': '0.05',
      'ONEM_RATE': '0.015',
      'INPP_RATE': '0.005',
      'IPR_BRACKETS': JSON.stringify([
        { min: 0, max: 72000, taux: 0 },
        { min: 72001, max: 144000, taux: 0.03 },
        { min: 144001, max: 288000, taux: 0.05 },
        { min: 288001, max: 576000, taux: 0.10 },
        { min: 576001, max: 1152000, taux: 0.15 },
        { min: 1152001, max: 2304000, taux: 0.20 },
        { min: 2304001, max: 4608000, taux: 0.25 },
        { min: 4608001, max: 9216000, taux: 0.30 },
        { min: 9216001, max: 18432000, taux: 0.35 },
        { min: 18432001, max: 36864000, taux: 0.40 },
        { min: 36864001, max: Infinity, taux: 0.45 }
      ])
    };
    
    for (const [name, value] of Object.entries(defaultSettings)) {
      db.prepare(`
        UPDATE tax_settings
        SET setting_value = ?,
            updated_at = CURRENT_TIMESTAMP,
            updated_by = 'system'
        WHERE setting_name = ?
      `).run(value, name);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error resetting tax settings:', error);
    throw error;
  }
});


// ============================================================================
// REPORTING MODULE HANDLERS
// ============================================================================

// Get HR Report Statistics
ipcMain.handle('db-get-hr-report-stats', async (event, dateRange) => {
  try {
    const { startDate, endDate } = dateRange;
    
    // Total employees
    const totalEmployees = db.prepare('SELECT COUNT(*) as count FROM employees_gas').get().count;
    const activeEmployees = db.prepare("SELECT COUNT(*) as count FROM employees_gas WHERE statut = 'ACTIF'").get().count;
    const inactiveEmployees = db.prepare("SELECT COUNT(*) as count FROM employees_gas WHERE statut = 'INACTIF'").get().count;
    const suspendedEmployees = db.prepare("SELECT COUNT(*) as count FROM employees_gas WHERE statut = 'SUSPENDU'").get().count;
    const terminatedEmployees = db.prepare("SELECT COUNT(*) as count FROM employees_gas WHERE statut = 'TERMINE'").get().count;
    
    // By category
    const gardesCount = db.prepare("SELECT COUNT(*) as count FROM employees_gas WHERE categorie = 'GARDE' AND statut = 'ACTIF'").get().count;
    const roteursCount = db.prepare("SELECT COUNT(*) as count FROM employees_gas WHERE categorie = 'GARDE' AND poste = 'ROTEUR' AND statut = 'ACTIF'").get().count;
    const administrationCount = db.prepare("SELECT COUNT(*) as count FROM employees_gas WHERE categorie = 'ADMINISTRATION' AND statut = 'ACTIF'").get().count;
    
    // New hires this month
    const newHiresThisMonth = db.prepare(`
      SELECT COUNT(*) as count 
      FROM employees_gas 
      WHERE date(date_embauche) BETWEEN date(?) AND date(?)
    `).get(startDate, endDate).count;
    
    // Terminations this month
    const terminationsThisMonth = db.prepare(`
      SELECT COUNT(*) as count 
      FROM employees_gas 
      WHERE statut = 'TERMINE' 
      AND date(date_fin_contrat) BETWEEN date(?) AND date(?)
    `).get(startDate, endDate).count;
    
    // Average tenure in months
    const avgTenure = db.prepare(`
      SELECT AVG(
        CAST((julianday('now') - julianday(date_embauche)) / 30 AS INTEGER)
      ) as avg_months
      FROM employees_gas 
      WHERE statut = 'ACTIF'
    `).get().avg_months || 0;
    
    // Employees by categorie
    const employeesByCategorie = db.prepare(`
      SELECT categorie, COUNT(*) as count 
      FROM employees_gas 
      WHERE statut = 'ACTIF'
      GROUP BY categorie
    `).all();
    
    // Employees by poste
    const employeesByPoste = db.prepare(`
      SELECT poste, COUNT(*) as count 
      FROM employees_gas 
      WHERE statut = 'ACTIF'
      GROUP BY poste
      ORDER BY count DESC
    `).all();
    
    // Employees by site
    const employeesBySite = db.prepare(`
      SELECT 
        COALESCE(s.nom_site, 'Non affecté') as site_nom,
        COUNT(e.id) as count
      FROM employees_gas e
      LEFT JOIN sites_gas s ON e.site_affecte_id = s.id
      WHERE e.statut = 'ACTIF'
      GROUP BY e.site_affecte_id
      ORDER BY count DESC
    `).all();
    
    return {
      totalEmployees,
      activeEmployees,
      inactiveEmployees,
      suspendedEmployees,
      terminatedEmployees,
      gardesCount,
      roteursCount,
      administrationCount,
      newHiresThisMonth,
      terminationsThisMonth,
      averageTenure: Math.round(avgTenure),
      employeesByCategorie,
      employeesByPoste,
      employeesBySite
    };
  } catch (error) {
    console.error('Error fetching HR report stats:', error);
    throw error;
  }
});

// Get Operations Report Statistics
ipcMain.handle('db-get-operations-report-stats', async (event, dateRange) => {
  try {
    const { startDate, endDate } = dateRange;
    
    // Total sites
    const totalSites = db.prepare('SELECT COUNT(*) as count FROM sites_gas').get().count;
    const activeSites = db.prepare('SELECT COUNT(*) as count FROM sites_gas WHERE est_actif = 1').get().count;
    
    // Total guards deployed
    const totalGuardsDeployed = db.prepare(`
      SELECT COUNT(DISTINCT employe_id) as count 
      FROM historique_deployements 
      WHERE est_actif = 1
    `).get().count;
    
    // Sites coverage analysis
    const deploymentsBySite = db.prepare(`
      SELECT 
        s.nom_site as site_nom,
        COUNT(h.employe_id) as guards_count,
        (s.effectif_jour_requis + s.effectif_nuit_requis) as required
      FROM sites_gas s
      LEFT JOIN historique_deployements h ON s.id = h.site_id AND h.est_actif = 1
      WHERE s.est_actif = 1
      GROUP BY s.id
      ORDER BY s.nom_site
    `).all();
    
    const sitesFullyCovered = deploymentsBySite.filter(s => s.guards_count >= s.required).length;
    const sitesUnderstaffed = deploymentsBySite.filter(s => s.guards_count < s.required).length;
    
    // Roteur assignments in date range
    const roteurAssignments = db.prepare(`
      SELECT 
        e.nom_complet as roteur_nom,
        s.nom_site as site_nom,
        CAST((julianday(COALESCE(ar.date_fin, date('now'))) - julianday(ar.date_debut)) AS INTEGER) as days
      FROM affectations_roteur ar
      JOIN employees_gas e ON ar.roteur_id = e.id
      JOIN sites_gas s ON ar.site_id = s.id
      WHERE ar.date_debut <= date(?) AND COALESCE(ar.date_fin, date('now')) >= date(?)
      AND ar.statut IN ('EN_COURS', 'TERMINE')
      ORDER BY days DESC
      LIMIT 10
    `).all(endDate, startDate);
    
    const roteursActive = db.prepare(`
      SELECT COUNT(DISTINCT roteur_id) as count 
      FROM affectations_roteur 
      WHERE statut = 'EN_COURS'
    `).get().count;
    
    const averageGuardsPerSite = totalGuardsDeployed / (activeSites || 1);
    
    return {
      totalSites,
      activeSites,
      totalGuardsDeployed,
      sitesFullyCovered,
      sitesUnderstaffed,
      roteursActive,
      averageGuardsPerSite: Math.round(averageGuardsPerSite * 10) / 10,
      deploymentsBySite,
      roteurAssignments
    };
  } catch (error) {
    console.error('Error fetching operations report stats:', error);
    throw error;
  }
});

// ============================================================================
// FILE MANAGEMENT - Photo and Document Upload
// ============================================================================

const fs = require('fs');

// Save uploaded file (photo or document)
ipcMain.handle('db-save-file', async (event, { fileBuffer, fileName, fileType, employeeId }) => {
  try {
    const uploadsDir = isDev 
      ? path.join(__dirname, '..', 'uploads')
      : path.join(process.resourcesPath, 'uploads');
    
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    // Create employee-specific directory
    const employeeDir = path.join(uploadsDir, employeeId);
    if (!fs.existsSync(employeeDir)) {
      fs.mkdirSync(employeeDir, { recursive: true });
    }
    
    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const extension = path.extname(fileName);
    const baseName = path.basename(fileName, extension);
    const uniqueFileName = `${fileType}_${timestamp}_${baseName}${extension}`;
    const filePath = path.join(employeeDir, uniqueFileName);
    
    // Save file
    fs.writeFileSync(filePath, Buffer.from(fileBuffer));
    
    // Return relative path for database storage
    const relativePath = path.join('uploads', employeeId, uniqueFileName);
    
    return { success: true, filePath: relativePath };
  } catch (error) {
    console.error('Error saving file:', error);
    throw error;
  }
});

// Delete file
ipcMain.handle('db-delete-file', async (event, filePath) => {
  try {
    const fullPath = isDev 
      ? path.join(__dirname, '..', filePath)
      : path.join(process.resourcesPath, filePath);
    
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
});

// Get file path for serving
ipcMain.handle('db-get-file-path', async (event, relativePath) => {
  try {
    const fullPath = isDev 
      ? path.join(__dirname, '..', relativePath)
      : path.join(process.resourcesPath, relativePath);
    
    return { success: true, fullPath };
  } catch (error) {
    console.error('Error getting file path:', error);
    throw error;
  }
});
