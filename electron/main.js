const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const Database = require('better-sqlite3');
const crypto = require('crypto');
const XLSX = require('xlsx');

let mainWindow;
let db;

// Initialize SQLite database
function initDatabase() {
  const isDev = !app.isPackaged;
  const dbPath = isDev 
    ? path.join(__dirname, '..', 'database.sqlite')
    : path.join(process.resourcesPath, 'database.sqlite');
  
  db = new Database(dbPath);
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

  // Clients GAS
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
      cout_unitaire_garde REAL NOT NULL DEFAULT 0,
      cree_le DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Add cout_unitaire_garde column if it doesn't exist (migration)
  try {
    db.exec(`ALTER TABLE clients_gas ADD COLUMN cout_unitaire_garde REAL NOT NULL DEFAULT 0`);
  } catch (e) {
    // Column already exists, ignore
  }

  // Add statut column if it doesn't exist (migration)
  try {
    db.exec(`ALTER TABLE clients_gas ADD COLUMN statut TEXT NOT NULL DEFAULT 'ACTIF'`);
  } catch (e) {
    // Column already exists, ignore
  }

  // Sites GAS
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

  // Add modifie_le column to sites_gas if it doesn't exist (migration)
  try {
    db.exec(`ALTER TABLE sites_gas ADD COLUMN modifie_le DATETIME DEFAULT CURRENT_TIMESTAMP`);
  } catch (e) {
    // Column already exists, ignore
  }

  // Factures clients
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

  // Factures details
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

  // Paiements
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

  // ============================================================================
  // FINANCE MODULE - Plan Comptable OHADA
  // ============================================================================

  // Plan Comptable OHADA
  db.exec(`
    CREATE TABLE IF NOT EXISTS plan_comptable (
      code_compte TEXT PRIMARY KEY,
      libelle TEXT NOT NULL,
      classe TEXT NOT NULL,
      type_compte TEXT NOT NULL CHECK(type_compte IN ('ACTIF', 'PASSIF', 'CHARGE', 'PRODUIT')),
      est_actif INTEGER NOT NULL DEFAULT 1,
      description TEXT
    )
  `);

  // Comptes de Trésorerie (Caisses et Banques)
  db.exec(`
    CREATE TABLE IF NOT EXISTS comptes_tresorerie (
      id TEXT PRIMARY KEY,
      code_compte TEXT NOT NULL,
      nom_compte TEXT NOT NULL,
      type_compte TEXT NOT NULL CHECK(type_compte IN ('CAISSE', 'BANQUE', 'MOBILE_MONEY')),
      devise TEXT NOT NULL DEFAULT 'USD',
      solde_actuel REAL NOT NULL DEFAULT 0,
      banque_nom TEXT,
      numero_compte TEXT,
      est_actif INTEGER NOT NULL DEFAULT 1,
      cree_le DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (code_compte) REFERENCES plan_comptable (code_compte)
    )
  `);

  // Catégories de Dépenses
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories_depenses (
      id TEXT PRIMARY KEY,
      code_compte TEXT NOT NULL,
      nom_categorie TEXT NOT NULL,
      description TEXT,
      est_actif INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (code_compte) REFERENCES plan_comptable (code_compte)
    )
  `);

  // Dépenses (Charges)
  db.exec(`
    CREATE TABLE IF NOT EXISTS depenses (
      id TEXT PRIMARY KEY,
      categorie_id TEXT NOT NULL,
      compte_tresorerie_id TEXT NOT NULL,
      date_depense TEXT NOT NULL,
      montant REAL NOT NULL,
      devise TEXT NOT NULL DEFAULT 'USD',
      beneficiaire TEXT,
      description TEXT NOT NULL,
      reference_piece TEXT,
      mode_paiement TEXT NOT NULL DEFAULT 'ESPECES',
      statut TEXT NOT NULL DEFAULT 'VALIDEE' CHECK(statut IN ('EN_ATTENTE', 'VALIDEE', 'ANNULEE')),
      cree_par TEXT,
      cree_le DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (categorie_id) REFERENCES categories_depenses (id),
      FOREIGN KEY (compte_tresorerie_id) REFERENCES comptes_tresorerie (id)
    )
  `);

  // Mouvements de Trésorerie (Journal de Caisse/Banque)
  db.exec(`
    CREATE TABLE IF NOT EXISTS mouvements_tresorerie (
      id TEXT PRIMARY KEY,
      compte_tresorerie_id TEXT NOT NULL,
      date_mouvement TEXT NOT NULL,
      type_mouvement TEXT NOT NULL CHECK(type_mouvement IN ('ENTREE', 'SORTIE', 'TRANSFERT')),
      montant REAL NOT NULL,
      devise TEXT NOT NULL DEFAULT 'USD',
      libelle TEXT NOT NULL,
      reference_source TEXT,
      type_source TEXT CHECK(type_source IN ('PAIEMENT_CLIENT', 'DEPENSE', 'TRANSFERT', 'AUTRE')),
      source_id TEXT,
      solde_avant REAL NOT NULL DEFAULT 0,
      solde_apres REAL NOT NULL DEFAULT 0,
      cree_le DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (compte_tresorerie_id) REFERENCES comptes_tresorerie (id)
    )
  `);

  // Seed Plan Comptable OHADA if empty
  const planComptableCount = db.prepare('SELECT COUNT(*) as count FROM plan_comptable').get();
  if (planComptableCount.count === 0) {
    const planComptable = [
      // Classe 4 - Tiers & Dettes
      { code: '411', libelle: 'Clients', classe: '4', type: 'ACTIF', desc: 'Suivi des créances et factures impayées' },
      { code: '401', libelle: 'Fournisseurs', classe: '4', type: 'PASSIF', desc: 'Dettes d\'exploitation' },
      { code: '422', libelle: 'Personnel - Rémunérations dues', classe: '4', type: 'PASSIF', desc: 'Dettes salariales nettes à payer' },
      { code: '44', libelle: 'État et Collectivités', classe: '4', type: 'PASSIF', desc: 'IPR, TVA, CNSS, ONEM, INPP' },
      // Classe 5 - Trésorerie
      { code: '571', libelle: 'Caisse', classe: '5', type: 'ACTIF', desc: 'Gestion séparée USD et CDF' },
      { code: '521', libelle: 'Banques', classe: '5', type: 'ACTIF', desc: 'Comptes bancaires' },
      { code: '522', libelle: 'Mobile Money', classe: '5', type: 'ACTIF', desc: 'Comptes Mobile Money' },
      // Classe 6 - Charges
      { code: '661', libelle: 'Salaires et appointements', classe: '6', type: 'CHARGE', desc: 'Salaires, primes et indemnités' },
      { code: '615', libelle: 'Entretien et réparations', classe: '6', type: 'CHARGE', desc: 'Véhicules et bureaux' },
      { code: '6061', libelle: 'Eau', classe: '6', type: 'CHARGE', desc: 'Fourniture d\'eau' },
      { code: '6062', libelle: 'Électricité (SNEL)', classe: '6', type: 'CHARGE', desc: 'Fourniture d\'électricité' },
      { code: '6063', libelle: 'Carburant', classe: '6', type: 'CHARGE', desc: 'Carburant véhicules' },
      { code: '6132', libelle: 'Loyers', classe: '6', type: 'CHARGE', desc: 'Loyers bureaux et locaux' },
      { code: '6136', libelle: 'Télécommunications', classe: '6', type: 'CHARGE', desc: 'Téléphone, Internet' },
      { code: '6226', libelle: 'Honoraires', classe: '6', type: 'CHARGE', desc: 'Honoraires et consultations' },
      { code: '641', libelle: 'Impôts et taxes', classe: '6', type: 'CHARGE', desc: 'Taxes foncières, Voirie, Vignette' },
      { code: '6064', libelle: 'Fournitures de bureau', classe: '6', type: 'CHARGE', desc: 'Papeterie et consommables' },
      { code: '6068', libelle: 'Autres achats', classe: '6', type: 'CHARGE', desc: 'Achats divers non stockés' },
      // Classe 7 - Produits
      { code: '706', libelle: 'Services vendus', classe: '7', type: 'PRODUIT', desc: 'Prestations de gardiennage' },
    ];

    const insertPlan = db.prepare(`
      INSERT INTO plan_comptable (code_compte, libelle, classe, type_compte, description)
      VALUES (?, ?, ?, ?, ?)
    `);

    for (const compte of planComptable) {
      insertPlan.run(compte.code, compte.libelle, compte.classe, compte.type, compte.desc);
    }

    // Seed default categories
    const categories = [
      { id: 'cat-salaires', code: '661', nom: 'Salaires et Primes' },
      { id: 'cat-entretien', code: '615', nom: 'Entretien et Réparations' },
      { id: 'cat-eau', code: '6061', nom: 'Eau' },
      { id: 'cat-electricite', code: '6062', nom: 'Électricité (SNEL)' },
      { id: 'cat-carburant', code: '6063', nom: 'Carburant' },
      { id: 'cat-loyer', code: '6132', nom: 'Loyers' },
      { id: 'cat-telecom', code: '6136', nom: 'Télécommunications' },
      { id: 'cat-honoraires', code: '6226', nom: 'Honoraires' },
      { id: 'cat-taxes', code: '641', nom: 'Impôts et Taxes' },
      { id: 'cat-fournitures', code: '6064', nom: 'Fournitures de Bureau' },
      { id: 'cat-autres', code: '6068', nom: 'Autres Dépenses' },
    ];

    const insertCat = db.prepare(`
      INSERT INTO categories_depenses (id, code_compte, nom_categorie)
      VALUES (?, ?, ?)
    `);

    for (const cat of categories) {
      insertCat.run(cat.id, cat.code, cat.nom);
    }

    // Seed default treasury accounts
    const comptesTresorerie = [
      { id: 'caisse-usd', code: '571', nom: 'Caisse USD', type: 'CAISSE', devise: 'USD' },
      { id: 'caisse-cdf', code: '571', nom: 'Caisse CDF', type: 'CAISSE', devise: 'CDF' },
      { id: 'banque-usd', code: '521', nom: 'Compte Bancaire USD', type: 'BANQUE', devise: 'USD' },
      { id: 'mobile-money', code: '522', nom: 'Mobile Money', type: 'MOBILE_MONEY', devise: 'CDF' },
    ];

    const insertCompte = db.prepare(`
      INSERT INTO comptes_tresorerie (id, code_compte, nom_compte, type_compte, devise)
      VALUES (?, ?, ?, ?, ?)
    `);

    for (const compte of comptesTresorerie) {
      insertCompte.run(compte.id, compte.code, compte.nom, compte.type, compte.devise);
    }
  }

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
      poste TEXT DEFAULT 'GARDE',
      categorie TEXT CHECK(categorie IN ('ADMINISTRATION', 'GARDE', 'ROTEUR', 'SUPERVISEUR')) DEFAULT 'GARDE',
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
      motif_affectation TEXT CHECK(motif_affectation IN ('EMBAUCHE', 'TRANSFERT', 'DEMANDE_CLIENT', 'DISCIPLINAIRE', 'REORGANISATION', 'AUTRE')) DEFAULT 'EMBAUCHE',
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
      employe_remplace_id TEXT REFERENCES employees_gas(id),
      demande_conge_id TEXT REFERENCES demandes_conge(id),
      date_debut TEXT NOT NULL,
      date_fin TEXT NOT NULL,
      poste TEXT CHECK(poste IN ('JOUR', 'NUIT')) DEFAULT 'JOUR',
      statut TEXT CHECK(statut IN ('PLANIFIE', 'EN_COURS', 'TERMINE', 'ANNULE')) DEFAULT 'PLANIFIE',
      notes TEXT,
      cree_le TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

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
      cree_par TEXT,
      cree_le TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

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
  } catch (e) {
    // Indexes may already exist
  }

  console.log('HR, Operations, Inventory & Disciplinary tables created successfully');
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    title: 'Go Ahead Security',
    backgroundColor: '#F9FAFB'
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ============================================================================
// ROTEUR MANAGEMENT - IPC Handlers
// ============================================================================

// Get all roteurs (employees with categorie='GARDE' and poste='ROTEUR')
ipcMain.handle('db-get-roteurs', async (event, filters) => {
  try {
    let query = `
      SELECT e.*, s.nom_site as site_nom, c.nom_entreprise as client_nom
      FROM employees_gas e
      LEFT JOIN sites_gas s ON e.site_affecte_id = s.id
      LEFT JOIN clients_gas c ON s.client_id = c.id
      WHERE e.categorie = 'GARDE' AND e.poste = 'ROTEUR'
    `;
    const params = [];

    if (filters?.statut) {
      query += ' AND e.statut = ?';
      params.push(filters.statut);
    }
    if (filters?.search) {
      query += ' AND (e.nom_complet LIKE ? OR e.matricule LIKE ?)';
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    query += ' ORDER BY e.nom_complet';

    return db.prepare(query).all(...params);
  } catch (error) {
    console.error('Error fetching roteurs:', error);
    throw error;
  }
});

// Get all roteur assignments with optional filters
ipcMain.handle('db-get-roteur-assignments', async (event, filters) => {
  try {
    let query = `
      SELECT a.*, 
             r.nom_complet as roteur_nom, r.matricule as roteur_matricule,
             s.nom_site as site_nom, c.nom_entreprise as client_nom,
             e.nom_complet as employe_remplace_nom
      FROM affectations_roteur a
      LEFT JOIN employees_gas r ON a.roteur_id = r.id
      LEFT JOIN sites_gas s ON a.site_id = s.id
      LEFT JOIN clients_gas c ON s.client_id = c.id
      LEFT JOIN employees_gas e ON a.employe_remplace_id = e.id
      WHERE 1=1
    `;
    const params = [];

    if (filters?.roteurId) {
      query += ' AND a.roteur_id = ?';
      params.push(filters.roteurId);
    }
    if (filters?.siteId) {
      query += ' AND a.site_id = ?';
      params.push(filters.siteId);
    }
    if (filters?.statut) {
      query += ' AND a.statut = ?';
      params.push(filters.statut);
    }
    if (filters?.dateDebut) {
      query += ' AND a.date_fin >= ?';
      params.push(filters.dateDebut);
    }
    if (filters?.dateFin) {
      query += ' AND a.date_debut <= ?';
      params.push(filters.dateFin);
    }

    query += ' ORDER BY a.date_debut DESC';

    return db.prepare(query).all(...params);
  } catch (error) {
    console.error('Error fetching roteur assignments:', error);
    throw error;
  }
});

// Helper function to get week boundaries
function getWeekBoundaries(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day; // Adjust to get Monday as start of week
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  
  return { monday, sunday };
}

// Helper function to check weekly site constraint
function validateWeeklySiteConstraint(roteurId, siteId, dateDebut, dateFin, excludeAssignmentId = null) {
  const startDate = new Date(dateDebut);
  const endDate = new Date(dateFin);
  
  // Get all weeks that this assignment spans
  const weeksToCheck = [];
  let currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const { monday, sunday } = getWeekBoundaries(currentDate);
    const weekKey = `${monday.getFullYear()}-W${Math.ceil((monday.getDate() + monday.getDay()) / 7)}`;
    
    if (!weeksToCheck.some(w => w.key === weekKey)) {
      weeksToCheck.push({ key: weekKey, monday, sunday });
    }
    
    // Move to next week
    currentDate.setDate(currentDate.getDate() + 7);
  }
  
  // Check each week for existing assignments to the same site
  for (const week of weeksToCheck) {
    let query = `
      SELECT id, date_debut, date_fin FROM affectations_roteur 
      WHERE roteur_id = ? AND site_id = ? AND statut IN ('PLANIFIE', 'EN_COURS')
      AND ((date_debut <= ? AND date_fin >= ?) OR (date_debut <= ? AND date_fin >= ?))
    `;
    const params = [
      roteurId, siteId,
      week.sunday.toISOString().split('T')[0], week.monday.toISOString().split('T')[0],
      week.monday.toISOString().split('T')[0], week.sunday.toISOString().split('T')[0]
    ];
    
    if (excludeAssignmentId) {
      query += ' AND id != ?';
      params.push(excludeAssignmentId);
    }
    
    const existingAssignment = db.prepare(query).get(...params);
    
    if (existingAssignment) {
      const weekStart = week.monday.toLocaleDateString('fr-FR');
      const weekEnd = week.sunday.toLocaleDateString('fr-FR');
      throw new Error(
        `Le rôteur est déjà affecté à ce site pendant la semaine du ${weekStart} au ${weekEnd}. ` +
        `Un rôteur ne peut servir qu'une fois par semaine au même site.`
      );
    }
  }
}

// Create new roteur assignment
ipcMain.handle('db-create-roteur-assignment', async (event, assignment) => {
  try {
    // Handle both single site and multiple sites assignment
    const siteIds = assignment.site_ids || [assignment.site_id];
    const roteurId = assignment.roteur_id;
    const dateDebut = assignment.date_debut;
    const dateFin = assignment.date_fin;
    
    if (!siteIds || siteIds.length === 0) {
      throw new Error('Au moins un site doit être spécifié');
    }

    // Validate dates
    if (new Date(dateFin) <= new Date(dateDebut)) {
      throw new Error('La date de fin doit être postérieure à la date de début');
    }

    // Validate that roteur is available during the period (no overlapping assignments)
    const conflictingAssignment = db.prepare(`
      SELECT id FROM affectations_roteur 
      WHERE roteur_id = ? AND statut IN ('PLANIFIE', 'EN_COURS')
      AND ((date_debut <= ? AND date_fin >= ?) OR (date_debut <= ? AND date_fin >= ?))
    `).get(roteurId, dateDebut, dateDebut, dateFin, dateFin);

    if (conflictingAssignment) {
      throw new Error('Le rôteur est déjà affecté pendant cette période');
    }

    // Validate weekly site constraint for each site
    for (const siteId of siteIds) {
      validateWeeklySiteConstraint(roteurId, siteId, dateDebut, dateFin);
    }

    // Create assignments for each site
    const createdAssignments = [];
    const stmt = db.prepare(`
      INSERT INTO affectations_roteur (
        id, roteur_id, site_id, employe_remplace_id, demande_conge_id,
        date_debut, date_fin, poste, statut, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const siteId of siteIds) {
      const assignmentId = assignment.id || crypto.randomUUID();
      
      stmt.run(
        assignmentId,
        roteurId,
        siteId,
        assignment.employe_remplace_id || null,
        assignment.demande_conge_id || null,
        dateDebut,
        dateFin,
        assignment.poste || 'JOUR',
        assignment.statut || 'PLANIFIE',
        assignment.notes || null
      );

      // Get site name for response
      const siteInfo = db.prepare('SELECT nom_site FROM sites_gas WHERE id = ?').get(siteId);
      
      createdAssignments.push({
        id: assignmentId,
        site_id: siteId,
        site_nom: siteInfo?.nom_site || 'Site inconnu',
        jour_semaine: 'Rotation automatique'
      });
    }

    return { 
      success: true, 
      assignments: createdAssignments,
      totalSitesAssigned: siteIds.length,
      roteurCapacityUsed: siteIds.length
    };
  } catch (error) {
    console.error('Error creating roteur assignment:', error);
    throw error;
  }
});

// Update roteur assignment
ipcMain.handle('db-update-roteur-assignment', async (event, assignment) => {
  try {
    // Check if assignment exists and is modifiable
    const existing = db.prepare('SELECT statut FROM affectations_roteur WHERE id = ?').get(assignment.id);
    
    if (!existing) {
      throw new Error('Affectation non trouvée');
    }

    if (existing.statut === 'TERMINE') {
      throw new Error('Impossible de modifier une affectation terminée');
    }

    // If updating dates, roteur, or site, validate constraints
    if (assignment.date_debut || assignment.date_fin || assignment.roteur_id || assignment.site_id) {
      const current = db.prepare('SELECT roteur_id, site_id, date_debut, date_fin FROM affectations_roteur WHERE id = ?').get(assignment.id);
      
      const roteurId = assignment.roteur_id || current.roteur_id;
      const siteId = assignment.site_id || current.site_id;
      const dateDebut = assignment.date_debut || current.date_debut;
      const dateFin = assignment.date_fin || current.date_fin;

      // Validate dates
      if (new Date(dateFin) <= new Date(dateDebut)) {
        throw new Error('La date de fin doit être postérieure à la date de début');
      }

      // Check for overlapping assignments (excluding current assignment)
      const conflictingAssignment = db.prepare(`
        SELECT id FROM affectations_roteur 
        WHERE roteur_id = ? AND statut IN ('PLANIFIE', 'EN_COURS') AND id != ?
        AND ((date_debut <= ? AND date_fin >= ?) OR (date_debut <= ? AND date_fin >= ?))
      `).get(roteurId, assignment.id, dateDebut, dateDebut, dateFin, dateFin);

      if (conflictingAssignment) {
        throw new Error('Le rôteur est déjà affecté pendant cette période');
      }

      // Validate weekly site constraint (excluding current assignment)
      validateWeeklySiteConstraint(roteurId, siteId, dateDebut, dateFin, assignment.id);
    }

    // Build dynamic update query
    const updateFields = [];
    const params = [];

    if (assignment.roteur_id !== undefined) {
      updateFields.push('roteur_id = ?');
      params.push(assignment.roteur_id);
    }
    if (assignment.site_id !== undefined) {
      updateFields.push('site_id = ?');
      params.push(assignment.site_id);
    }
    if (assignment.employe_remplace_id !== undefined) {
      updateFields.push('employe_remplace_id = ?');
      params.push(assignment.employe_remplace_id);
    }
    if (assignment.date_debut !== undefined) {
      updateFields.push('date_debut = ?');
      params.push(assignment.date_debut);
    }
    if (assignment.date_fin !== undefined) {
      updateFields.push('date_fin = ?');
      params.push(assignment.date_fin);
    }
    if (assignment.poste !== undefined) {
      updateFields.push('poste = ?');
      params.push(assignment.poste);
    }
    if (assignment.statut !== undefined) {
      updateFields.push('statut = ?');
      params.push(assignment.statut);
    }
    if (assignment.notes !== undefined) {
      updateFields.push('notes = ?');
      params.push(assignment.notes);
    }

    if (updateFields.length === 0) {
      return { success: true }; // Nothing to update
    }

    params.push(assignment.id); // Add ID for WHERE clause

    const stmt = db.prepare(`
      UPDATE affectations_roteur SET ${updateFields.join(', ')}
      WHERE id = ?
    `);

    stmt.run(...params);

    return { success: true };
  } catch (error) {
    console.error('Error updating roteur assignment:', error);
    throw error;
  }
});

    if (assignment.roteur_id !== undefined) {
      updateFields.push('roteur_id = ?');
      params.push(assignment.roteur_id);
    }
    if (assignment.site_id !== undefined) {
      updateFields.push('site_id = ?');
      params.push(assignment.site_id);
    }
    if (assignment.employe_remplace_id !== undefined) {
      updateFields.push('employe_remplace_id = ?');
      params.push(assignment.employe_remplace_id);
    }
    if (assignment.date_debut !== undefined) {
      updateFields.push('date_debut = ?');
      params.push(assignment.date_debut);
    }
    if (assignment.date_fin !== undefined) {
      updateFields.push('date_fin = ?');
      params.push(assignment.date_fin);
    }
    if (assignment.poste !== undefined) {
      updateFields.push('poste = ?');
      params.push(assignment.poste);
    }
    if (assignment.statut !== undefined) {
      updateFields.push('statut = ?');
      params.push(assignment.statut);
    }
    if (assignment.notes !== undefined) {
      updateFields.push('notes = ?');
      params.push(assignment.notes);
    }

    if (updateFields.length === 0) {
      return { success: true }; // Nothing to update
    }

    params.push(assignment.id); // Add ID for WHERE clause

    const stmt = db.prepare(`
      UPDATE affectations_roteur SET ${updateFields.join(', ')}
      WHERE id = ?
    `);

    stmt.run(...params);

    return { success: true };
  } catch (error) {
    console.error('Error updating roteur assignment:', error);
    throw error;
  }
});

// Check weekly availability for roteur at specific sites
ipcMain.handle('db-check-roteur-weekly-availability', async (event, { roteurId, siteIds, dateDebut, dateFin, excludeAssignmentId }) => {
  try {
    const conflicts = [];
    
    for (const siteId of siteIds) {
      try {
        validateWeeklySiteConstraint(roteurId, siteId, dateDebut, dateFin, excludeAssignmentId);
      } catch (error) {
        // Get site name for better error reporting
        const siteInfo = db.prepare('SELECT nom_site FROM sites_gas WHERE id = ?').get(siteId);
        conflicts.push({
          siteId,
          siteName: siteInfo?.nom_site || 'Site inconnu',
          error: error.message
        });
      }
    }
    
    return {
      available: conflicts.length === 0,
      conflicts
    };
  } catch (error) {
    console.error('Error checking roteur weekly availability:', error);
    throw error;
  }
});

// Get site coverage gaps (sites needing roteur coverage)
ipcMain.handle('db-get-site-coverage-gaps', async (event, filters) => {
  try {
    // This query finds sites with exactly 1 guard that might need roteur coverage
    let query = `
      SELECT 
        s.id as site_id,
        s.nom_site,
        c.nom_entreprise as client_nom,
        COUNT(h.employe_id) as guard_count,
        GROUP_CONCAT(e.nom_complet) as guard_names
      FROM sites_gas s
      LEFT JOIN clients_gas c ON s.client_id = c.id
      LEFT JOIN historique_deployements h ON s.id = h.site_id AND h.est_actif = 1
      LEFT JOIN employees_gas e ON h.employe_id = e.id AND e.statut = 'ACTIF' AND e.poste != 'ROTEUR'
      WHERE s.est_actif = 1
    `;
    const params = [];

    if (filters?.clientId) {
      query += ' AND s.client_id = ?';
      params.push(filters.clientId);
    }

    query += `
      GROUP BY s.id, s.nom_site, c.nom_entreprise
      HAVING guard_count = 1
      ORDER BY s.nom_site
    `;

    return db.prepare(query).all(...params);
  } catch (error) {
    console.error('Error fetching site coverage gaps:', error);
    throw error;
  }
});

// Get roteur availability for a specific period
ipcMain.handle('db-get-roteur-availability', async (event, { dateDebut, dateFin }) => {
  try {
    const roteurs = db.prepare(`
      SELECT e.*, 
             CASE WHEN a.id IS NOT NULL THEN 0 ELSE 1 END as is_available
      FROM employees_gas e
      LEFT JOIN affectations_roteur a ON e.id = a.roteur_id 
        AND a.statut IN ('PLANIFIE', 'EN_COURS')
        AND ((a.date_debut <= ? AND a.date_fin >= ?) OR (a.date_debut <= ? AND a.date_fin >= ?))
      WHERE e.categorie = 'GARDE' AND e.poste = 'ROTEUR' AND e.statut = 'ACTIF'
      ORDER BY e.nom_complet
    `).all(dateDebut, dateDebut, dateFin, dateFin);

    return roteurs;
  } catch (error) {
    console.error('Error checking roteur availability:', error);
    throw error;
  }
});

// ============================================================================
// HR STATS - Dashboard Statistics
// ============================================================================

// Get HR statistics for dashboard
ipcMain.handle('db-get-hr-stats', async (event) => {
  try {
    // Total employees
    const totalEmployees = db.prepare('SELECT COUNT(*) as count FROM employees_gas WHERE statut != "TERMINE"').get();
    
    // Active employees
    const activeEmployees = db.prepare('SELECT COUNT(*) as count FROM employees_gas WHERE statut = "ACTIF"').get();
    
    // Guards count (excluding roteurs)
    const guardsCount = db.prepare(`
      SELECT COUNT(*) as count FROM employees_gas 
      WHERE categorie = 'GARDE' AND poste != 'ROTEUR' AND statut = 'ACTIF'
    `).get();
    
    // Roteurs count
    const roteursCount = db.prepare(`
      SELECT COUNT(*) as count FROM employees_gas 
      WHERE categorie = 'GARDE' AND poste = 'ROTEUR' AND statut = 'ACTIF'
    `).get();
    
    // Supervisors count
    const supervisorsCount = db.prepare(`
      SELECT COUNT(*) as count FROM employees_gas 
      WHERE poste IN ('SUPERVISEUR', 'SUPERVISEUR_NUIT') AND statut = 'ACTIF'
    `).get();
    
    // Admin count
    const adminCount = db.prepare(`
      SELECT COUNT(*) as count FROM employees_gas 
      WHERE categorie = 'ADMINISTRATION' AND statut = 'ACTIF'
    `).get();
    
    // On leave count (employees with active leave requests)
    const onLeaveCount = db.prepare(`
      SELECT COUNT(DISTINCT employe_id) as count FROM demandes_conge 
      WHERE statut = 'APPROUVE' AND date_debut <= date('now') AND date_fin >= date('now')
    `).get();
    
    // Pending leave requests
    const pendingLeaveRequests = db.prepare(`
      SELECT COUNT(*) as count FROM demandes_conge WHERE statut = 'EN_ATTENTE'
    `).get();

    return {
      totalEmployees: totalEmployees?.count || 0,
      activeEmployees: activeEmployees?.count || 0,
      guardsCount: guardsCount?.count || 0,
      roteursCount: roteursCount?.count || 0,
      supervisorsCount: supervisorsCount?.count || 0,
      adminCount: adminCount?.count || 0,
      onLeaveCount: onLeaveCount?.count || 0,
      pendingLeaveRequests: pendingLeaveRequests?.count || 0
    };
  } catch (error) {
    console.error('Error getting HR stats:', error);
    throw error;
  }
});

// Get fleet statistics for dashboard
ipcMain.handle('db-get-fleet-stats', async (event) => {
  try {
    const totalVehicles = db.prepare('SELECT COUNT(*) as count FROM vehicules_flotte').get();
    const activeVehicles = db.prepare('SELECT COUNT(*) as count FROM vehicules_flotte WHERE statut = "ACTIF"').get();
    const inRepairVehicles = db.prepare('SELECT COUNT(*) as count FROM vehicules_flotte WHERE statut = "EN_REPARATION"').get();
    
    // Vehicles with insurance expiring in next 30 days
    const j30 = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const expiringInsurance = db.prepare(`
      SELECT COUNT(*) as count FROM vehicules_flotte 
      WHERE assurance_date_fin <= ? AND assurance_date_fin >= date('now') AND statut = 'ACTIF'
    `).get(j30);
    
    // Vehicles with technical inspection expiring in next 15 days
    const j15 = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const expiringTechnicalInspection = db.prepare(`
      SELECT COUNT(*) as count FROM vehicules_flotte 
      WHERE controle_technique_expiration <= ? AND controle_technique_expiration >= date('now') AND statut = 'ACTIF'
    `).get(j15);

    return {
      totalVehicles: totalVehicles?.count || 0,
      activeVehicles: activeVehicles?.count || 0,
      inRepairVehicles: inRepairVehicles?.count || 0,
      expiringInsurance: expiringInsurance?.count || 0,
      expiringTechnicalInspection: expiringTechnicalInspection?.count || 0
    };
  } catch (error) {
    console.error('Error getting fleet stats:', error);
    throw error;
  }
});

// Get inventory statistics for dashboard
ipcMain.handle('db-get-inventory-stats', async (event) => {
  try {
    const totalEquipment = db.prepare('SELECT COUNT(*) as count FROM equipements').get();
    const availableEquipment = db.prepare('SELECT COUNT(*) as count FROM equipements WHERE statut = "DISPONIBLE"').get();
    const assignedEquipment = db.prepare('SELECT COUNT(*) as count FROM equipements WHERE statut = "AFFECTE"').get();
    const damagedEquipment = db.prepare('SELECT COUNT(*) as count FROM equipements WHERE etat = "ENDOMMAGE"').get();

    return {
      totalEquipment: totalEquipment?.count || 0,
      availableEquipment: availableEquipment?.count || 0,
      assignedEquipment: assignedEquipment?.count || 0,
      damagedEquipment: damagedEquipment?.count || 0
    };
  } catch (error) {
    console.error('Error getting inventory stats:', error);
    throw error;
  }
});

// Get disciplinary statistics for dashboard
ipcMain.handle('db-get-disciplinary-stats', async (event) => {
  try {
    const pendingActions = db.prepare('SELECT COUNT(*) as count FROM actions_disciplinaires WHERE statut = "BROUILLON"').get();
    const pendingSignatures = db.prepare('SELECT COUNT(*) as count FROM actions_disciplinaires WHERE statut = "EN_ATTENTE_SIGNATURE"').get();
    const pendingValidations = db.prepare('SELECT COUNT(*) as count FROM actions_disciplinaires WHERE statut = "EN_ATTENTE_VALIDATION"').get();
    
    // Actions created this month
    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const thisMonthActions = db.prepare(`
      SELECT COUNT(*) as count FROM actions_disciplinaires WHERE date_incident >= ?
    `).get(firstDayOfMonth);

    return {
      pendingActions: pendingActions?.count || 0,
      pendingSignatures: pendingSignatures?.count || 0,
      pendingValidations: pendingValidations?.count || 0,
      thisMonthActions: thisMonthActions?.count || 0
    };
  } catch (error) {
    console.error('Error getting disciplinary stats:', error);
    throw error;
  }
});

app.on('ready', () => {
  initDatabase();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});


// ============================================================================
// IPC Handlers - Employees
// ============================================================================

ipcMain.handle('db-get-employees', async () => {
  try {
    const stmt = db.prepare('SELECT * FROM employees ORDER BY last_name, first_name');
    return stmt.all();
  } catch (error) {
    console.error('Error fetching employees:', error);
    throw error;
  }
});

ipcMain.handle('db-add-employee', async (event, employee) => {
  try {
    const stmt = db.prepare(`
      INSERT INTO employees (
        id, employee_number, first_name, last_name, email, phone,
        date_of_birth, national_id, address_street, address_city,
        address_state, address_zip_code, emergency_contact_name,
        emergency_contact_relationship, emergency_contact_phone,
        date_hired, position, department, status, salary,
        bank_name, account_number, routing_number
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      employee.id, employee.employeeNumber, employee.firstName, employee.lastName,
      employee.email, employee.phone, employee.dateOfBirth, employee.nationalId,
      employee.addressStreet, employee.addressCity, employee.addressState,
      employee.addressZipCode, employee.emergencyContactName,
      employee.emergencyContactRelationship, employee.emergencyContactPhone,
      employee.dateHired, employee.position, employee.department,
      employee.status, employee.salary, employee.bankName,
      employee.accountNumber, employee.routingNumber
    );
    return { success: true, id: employee.id };
  } catch (error) {
    console.error('Error adding employee:', error);
    throw error;
  }
});

ipcMain.handle('db-update-employee', async (event, employee) => {
  try {
    const stmt = db.prepare(`
      UPDATE employees SET
        employee_number = ?, first_name = ?, last_name = ?, email = ?,
        phone = ?, date_of_birth = ?, national_id = ?, address_street = ?,
        address_city = ?, address_state = ?, address_zip_code = ?,
        emergency_contact_name = ?, emergency_contact_relationship = ?,
        emergency_contact_phone = ?, date_hired = ?, position = ?,
        department = ?, status = ?, salary = ?, bank_name = ?,
        account_number = ?, routing_number = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(
      employee.employeeNumber, employee.firstName, employee.lastName,
      employee.email, employee.phone, employee.dateOfBirth, employee.nationalId,
      employee.addressStreet, employee.addressCity, employee.addressState,
      employee.addressZipCode, employee.emergencyContactName,
      employee.emergencyContactRelationship, employee.emergencyContactPhone,
      employee.dateHired, employee.position, employee.department,
      employee.status, employee.salary, employee.bankName,
      employee.accountNumber, employee.routingNumber, employee.id
    );
    return { success: true };
  } catch (error) {
    console.error('Error updating employee:', error);
    throw error;
  }
});

ipcMain.handle('db-delete-employee', async (event, id) => {
  try {
    db.prepare('DELETE FROM employees WHERE id = ?').run(id);
    return { success: true };
  } catch (error) {
    console.error('Error deleting employee:', error);
    throw error;
  }
});

// ============================================================================
// IPC Handlers - Clients GAS
// ============================================================================

ipcMain.handle('db-get-clients-gas', async () => {
  try {
    // Filter out SUPPRIME clients by default
    const stmt = db.prepare("SELECT * FROM clients_gas WHERE statut != 'SUPPRIME' OR statut IS NULL ORDER BY nom_entreprise");
    return stmt.all();
  } catch (error) {
    console.error('Error fetching clients GAS:', error);
    throw error;
  }
});

ipcMain.handle('db-add-client-gas', async (event, client) => {
  try {
    const stmt = db.prepare(`
      INSERT INTO clients_gas (
        id, type_client, nom_entreprise, nif, rccm, id_national,
        numero_contrat, contrat_url, contact_nom, contact_email, telephone,
        contact_urgence_nom, contact_urgence_telephone, adresse_facturation,
        devise_preferee, delai_paiement_jours
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      client.id, client.type_client, client.nom_entreprise, client.nif || null,
      client.rccm || null, client.id_national || null, client.numero_contrat || null,
      client.contrat_url || null, client.contact_nom || null, client.contact_email || null,
      client.telephone || null, client.contact_urgence_nom || null,
      client.contact_urgence_telephone || null, client.adresse_facturation || null,
      client.devise_preferee || 'USD', client.delai_paiement_jours || 30
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
        adresse_facturation = ?, devise_preferee = ?, delai_paiement_jours = ?
      WHERE id = ?
    `);
    stmt.run(
      client.type_client, client.nom_entreprise, client.nif || null,
      client.rccm || null, client.id_national || null, client.numero_contrat || null,
      client.contrat_url || null, client.contact_nom || null, client.contact_email || null,
      client.telephone || null, client.contact_urgence_nom || null,
      client.contact_urgence_telephone || null, client.adresse_facturation || null,
      client.devise_preferee || 'USD', client.delai_paiement_jours || 30,
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

// Get only active clients (for site creation)
ipcMain.handle('db-get-active-clients-gas', async () => {
  try {
    const stmt = db.prepare("SELECT * FROM clients_gas WHERE statut = 'ACTIF' ORDER BY nom_entreprise");
    return stmt.all();
  } catch (error) {
    console.error('Error getting active clients GAS:', error);
    throw error;
  }
});

// Update client status (for reactivation or setting inactive)
ipcMain.handle('db-update-client-status', async (event, { id, statut }) => {
  console.log(`🚨 BACKEND: db-update-client-status called with id=${id}, statut=${statut}`);
  try {
    console.log(`🔄 Starting client status update: Client ${id} -> ${statut}`);
    
    // Start a transaction to ensure data consistency
    const updateClient = db.prepare('UPDATE clients_gas SET statut = ?, modifie_le = CURRENT_TIMESTAMP WHERE id = ?');
    const updateSites = db.prepare('UPDATE sites_gas SET est_actif = ?, modifie_le = CURRENT_TIMESTAMP WHERE client_id = ?');
    const closeDeployments = db.prepare(`
      UPDATE historique_deployements 
      SET est_actif = 0, date_fin = CURRENT_TIMESTAMP, modifie_le = CURRENT_TIMESTAMP 
      WHERE site_id IN (SELECT id FROM sites_gas WHERE client_id = ?) AND est_actif = 1
    `);
    const clearEmployeeSiteAssignments = db.prepare(`
      UPDATE employees_gas 
      SET site_affecte_id = NULL, modifie_le = CURRENT_TIMESTAMP 
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
      const clientResult = updateClient.run(statut, id);
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

// ============================================================================
// IPC Handlers - Sites GAS
// ============================================================================

ipcMain.handle('db-get-sites-gas', async () => {
  try {
    const stmt = db.prepare(`
      SELECT s.*, c.nom_entreprise as client_nom
      FROM sites_gas s
      LEFT JOIN clients_gas c ON s.client_id = c.id
      ORDER BY s.nom_site
    `);
    return stmt.all();
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
      site.id, site.client_id, site.nom_site, site.adresse_physique || null,
      site.latitude || null, site.longitude || null,
      site.effectif_jour_requis || 0, site.effectif_nuit_requis || 0,
      site.cout_unitaire_garde || 0, site.tarif_mensuel_client || 0,
      site.consignes_specifiques || null, site.est_actif ? 1 : 0
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
        client_id = ?, nom_site = ?, adresse_physique = ?, latitude = ?,
        longitude = ?, effectif_jour_requis = ?, effectif_nuit_requis = ?,
        cout_unitaire_garde = ?, tarif_mensuel_client = ?,
        consignes_specifiques = ?, est_actif = ?
      WHERE id = ?
    `);
    stmt.run(
      site.client_id, site.nom_site, site.adresse_physique || null,
      site.latitude || null, site.longitude || null,
      site.effectif_jour_requis || 0, site.effectif_nuit_requis || 0,
      site.cout_unitaire_garde || 0, site.tarif_mensuel_client || 0,
      site.consignes_specifiques || null, site.est_actif ? 1 : 0, site.id
    );
    return { success: true };
  } catch (error) {
    console.error('Error updating site GAS:', error);
    throw error;
  }
});

ipcMain.handle('db-delete-site-gas', async (event, id) => {
  try {
    db.prepare('DELETE FROM sites_gas WHERE id = ?').run(id);
    return { success: true };
  } catch (error) {
    console.error('Error deleting site GAS:', error);
    throw error;
  }
});

// ============================================================================
// IPC Handlers - Factures GAS
// ============================================================================

ipcMain.handle('db-get-factures-gas', async () => {
  try {
    const stmt = db.prepare(`
      SELECT f.*, c.nom_entreprise as client_nom
      FROM factures_clients f
      LEFT JOIN clients_gas c ON f.client_id = c.id
      ORDER BY f.date_emission DESC
    `);
    return stmt.all();
  } catch (error) {
    console.error('Error fetching factures GAS:', error);
    throw error;
  }
});

ipcMain.handle('db-add-facture-gas', async (event, facture) => {
  try {
    const stmt = db.prepare(`
      INSERT INTO factures_clients (
        id, client_id, numero_facture, date_emission, date_echeance,
        periode_mois, periode_annee, total_gardiens_factures,
        montant_ht_prestation, montant_frais_supp, motif_frais_supp,
        creances_anterieures, montant_total_ttc, montant_total_du_client,
        devise, statut_paiement, notes_facture
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      facture.id, facture.client_id, facture.numero_facture,
      facture.date_emission, facture.date_echeance || null,
      facture.periode_mois || null, facture.periode_annee || null,
      facture.total_gardiens_factures || 0, facture.montant_ht_prestation || 0,
      facture.montant_frais_supp || 0, facture.motif_frais_supp || null,
      facture.creances_anterieures || 0, facture.montant_total_ttc || 0,
      facture.montant_total_du_client || 0, facture.devise || 'USD',
      facture.statut_paiement || 'BROUILLON', facture.notes_facture || null
    );
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
      facture.client_id, facture.numero_facture, facture.date_emission,
      facture.date_echeance || null, facture.periode_mois || null,
      facture.periode_annee || null, facture.total_gardiens_factures || 0,
      facture.montant_ht_prestation || 0, facture.montant_frais_supp || 0,
      facture.motif_frais_supp || null, facture.creances_anterieures || 0,
      facture.montant_total_ttc || 0, facture.montant_total_du_client || 0,
      facture.devise || 'USD', facture.statut_paiement || 'BROUILLON',
      facture.notes_facture || null, facture.id
    );
    return { success: true };
  } catch (error) {
    console.error('Error updating facture GAS:', error);
    throw error;
  }
});

ipcMain.handle('db-delete-facture-gas', async (event, id) => {
  try {
    db.prepare('DELETE FROM paiements WHERE facture_id = ?').run(id);
    db.prepare('DELETE FROM factures_details WHERE facture_id = ?').run(id);
    db.prepare('DELETE FROM factures_clients WHERE id = ?').run(id);
    return { success: true };
  } catch (error) {
    console.error('Error deleting facture GAS:', error);
    throw error;
  }
});

// ============================================================================
// IPC Handlers - Paiements GAS
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
    
    // Validate payment amount doesn't exceed remaining balance
    const facture = db.prepare('SELECT montant_total_du_client FROM factures_clients WHERE id = ?').get(paiement.facture_id);
    const totalPaye = db.prepare('SELECT COALESCE(SUM(montant_paye), 0) as total FROM paiements WHERE facture_id = ?').get(paiement.facture_id);
    
    if (!facture) {
      throw new Error('Facture non trouvée');
    }
    
    const soldeRestant = (facture.montant_total_du_client || 0) - (totalPaye?.total || 0);
    
    if (paiement.montant_paye > soldeRestant) {
      throw new Error(`Le montant du paiement (${paiement.montant_paye}) dépasse le solde restant (${soldeRestant})`);
    }
    
    if (paiement.montant_paye <= 0) {
      throw new Error('Le montant du paiement doit être supérieur à 0');
    }
    
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
    
    // Update facture status
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
        const factureInfo = db.prepare(`
          SELECT f.numero_facture, c.nom_entreprise 
          FROM factures_clients f 
          LEFT JOIN clients_gas c ON f.client_id = c.id 
          WHERE f.id = ?
        `).get(paiement.facture_id);
        
        const libelle = factureInfo 
          ? `Paiement ${factureInfo.nom_entreprise || 'Client'} - Facture ${factureInfo.numero_facture}`
          : `Paiement client - Facture`;
        
        // Record the movement
        db.prepare(`
          INSERT INTO mouvements_tresorerie (
            id, compte_tresorerie_id, date_mouvement, type_mouvement, montant, devise,
            libelle, type_source, source_id, solde_avant, solde_apres
          ) VALUES (?, ?, ?, 'ENTREE', ?, ?, ?, 'PAIEMENT_CLIENT', ?, ?, ?)
        `).run(
          crypto.randomUUID(), compteId, paiement.date_paiement,
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
    
    updateFacturePaymentStatus(paiement.facture_id);
    
    return { success: true };
  } catch (error) {
    console.error('Error updating paiement:', error);
    throw error;
  }
});

ipcMain.handle('db-delete-paiement-gas', async (event, id) => {
  try {
    const paiement = db.prepare('SELECT facture_id FROM paiements WHERE id = ?').get(id);
    db.prepare('DELETE FROM paiements WHERE id = ?').run(id);
    
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
    const facture = db.prepare('SELECT montant_total_du_client, statut_paiement FROM factures_clients WHERE id = ?').get(factureId);
    const totalPaye = db.prepare('SELECT COALESCE(SUM(montant_paye), 0) as total FROM paiements WHERE facture_id = ?').get(factureId);
    
    if (!facture) return;
    
    const montantDu = facture.montant_total_du_client || 0;
    const montantPaye = totalPaye?.total || 0;
    
    let newStatus;
    
    // Calculate status based on payment amounts
    if (montantPaye <= 0) {
      // No payment - keep ENVOYE if it was issued, otherwise keep current
      newStatus = (facture.statut_paiement === 'BROUILLON') ? 'BROUILLON' : 'ENVOYE';
    } else if (montantPaye >= montantDu) {
      // Fully paid
      newStatus = 'PAYE_TOTAL';
    } else {
      // Partially paid (montantPaye > 0 && montantPaye < montantDu)
      newStatus = 'PAYE_PARTIEL';
    }
    
    // Only update if status changed and not ANNULE
    if (facture.statut_paiement !== 'ANNULE') {
      db.prepare('UPDATE factures_clients SET statut_paiement = ? WHERE id = ?').run(newStatus, factureId);
    }
  } catch (error) {
    console.error('Error updating facture status:', error);
  }
}

// ============================================================================
// IPC Handlers - Dashboard Stats
// ============================================================================

ipcMain.handle('db-get-dashboard-stats', async () => {
  try {
    const totalEmployees = db.prepare('SELECT COUNT(*) as count FROM employees').get();
    const activeGuards = db.prepare("SELECT COUNT(*) as count FROM employees WHERE status = 'active' AND department = 'Security'").get();
    const totalClients = db.prepare("SELECT COUNT(*) as count FROM clients_gas WHERE statut != 'SUPPRIME' OR statut IS NULL").get();
    const activeSites = db.prepare('SELECT COUNT(*) as count FROM sites_gas WHERE est_actif = 1').get();
    const inactiveSites = db.prepare('SELECT COUNT(*) as count FROM sites_gas WHERE est_actif = 0').get();
    const monthlyRevenue = db.prepare('SELECT COALESCE(SUM(montant_paye), 0) as total FROM paiements').get();
    const totalRevenuePotential = db.prepare('SELECT COALESCE(SUM(tarif_mensuel_client), 0) as total FROM sites_gas WHERE est_actif = 1').get();
    
    return {
      totalEmployees: totalEmployees?.count || 0,
      activeGuards: activeGuards?.count || 0,
      totalClients: totalClients?.count || 0,
      activeSites: activeSites?.count || 0,
      inactiveSites: inactiveSites?.count || 0,
      monthlyRevenue: monthlyRevenue?.total || 0,
      totalRevenuePotential: totalRevenuePotential?.total || 0,
      pendingIncidents: 0,
      expiringCertifications: 0,
      upcomingShifts: 0
    };
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
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

// Categories de Dépenses
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

// Comptes de Trésorerie
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

// Dépenses
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
    // Get current solde
    const compte = db.prepare('SELECT solde_actuel FROM comptes_tresorerie WHERE id = ?').get(depense.compte_tresorerie_id);
    const soldeAvant = compte?.solde_actuel || 0;
    const soldeApres = soldeAvant - depense.montant;

    // Insert depense
    db.prepare(`
      INSERT INTO depenses (
        id, categorie_id, compte_tresorerie_id, date_depense, montant, devise,
        beneficiaire, description, reference_piece, mode_paiement, statut, cree_par
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      depense.id, depense.categorie_id, depense.compte_tresorerie_id,
      depense.date_depense, depense.montant, depense.devise || 'USD',
      depense.beneficiaire || null, depense.description,
      depense.reference_piece || null, depense.mode_paiement || 'ESPECES',
      depense.statut || 'VALIDEE', depense.cree_par || null
    );

    // Update solde
    db.prepare('UPDATE comptes_tresorerie SET solde_actuel = ? WHERE id = ?')
      .run(soldeApres, depense.compte_tresorerie_id);

    // Record mouvement
    db.prepare(`
      INSERT INTO mouvements_tresorerie (
        id, compte_tresorerie_id, date_mouvement, type_mouvement, montant, devise,
        libelle, type_source, source_id, solde_avant, solde_apres
      ) VALUES (?, ?, ?, 'SORTIE', ?, ?, ?, 'DEPENSE', ?, ?, ?)
    `).run(
      crypto.randomUUID(), depense.compte_tresorerie_id, depense.date_depense,
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
        categorie_id = ?, date_depense = ?, montant = ?, devise = ?,
        beneficiaire = ?, description = ?, reference_piece = ?, mode_paiement = ?, statut = ?
      WHERE id = ?
    `).run(
      depense.categorie_id, depense.date_depense, depense.montant, depense.devise || 'USD',
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
    // Get depense details to reverse the solde
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

// Mouvements de Trésorerie
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

    // Get current month expenses
    const now = new Date();
    const firstDayOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const depensesMois = db.prepare(`
      SELECT COALESCE(SUM(montant), 0) as total 
      FROM depenses 
      WHERE date_depense >= ? AND statut = 'VALIDEE' AND devise = 'USD'
    `).get(firstDayOfMonth);

    // Get expenses by category for current month
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
// Update employee
ipcMain.handle('db-update-employee-gas', async (event, employee) => {
  try {
    // Get current employee data
    const currentEmployee = db.prepare('SELECT site_affecte_id, poste FROM employees_gas WHERE id = ?').get(employee.id);
    
    // Check if site is changing or being cleared
    const currentSiteId = currentEmployee ? currentEmployee.site_affecte_id : null;
    const newSiteId = employee.site_affecte_id || null;
    const siteChanging = currentSiteId !== newSiteId;
    
    // Check if employee is becoming a ROTEUR
    const isBecomingRoteur = employee.poste === 'ROTEUR';
    const wasRoteur = currentEmployee && currentEmployee.poste === 'ROTEUR';
    
    // If becoming a ROTEUR or site is being cleared, close current deployment
    if ((isBecomingRoteur && !wasRoteur) || (siteChanging && !newSiteId)) {
      db.prepare(`
        UPDATE historique_deployements 
        SET est_actif = 0, date_fin = CURRENT_DATE, modifie_le = CURRENT_TIMESTAMP
        WHERE employe_id = ? AND est_actif = 1
      `).run(employee.id);
    }
    
    // Validate new site capacity if site is being assigned or changed to a new site
    if (newSiteId && siteChanging) {
      const site = db.prepare(`
        SELECT effectif_jour_requis, effectif_nuit_requis, nom_site
        FROM sites_gas WHERE id = ?
      `).get(newSiteId);

      if (!site) {
        throw new Error('Site non trouvé');
      }

      const totalCapacity = site.effectif_jour_requis + site.effectif_nuit_requis;
      
      // Count current deployments (excluding this employee if they're being moved)
      const currentCount = db.prepare(`
        SELECT COUNT(*) as count
        FROM historique_deployements
        WHERE site_id = ? AND est_actif = 1 AND employe_id != ?
      `).get(newSiteId, employee.id);

      if (currentCount.count >= totalCapacity) {
        throw new Error(
          `Impossible d'affecter l'employé à ${site.nom_site}. ` +
          `Capacité maximale atteinte: ${totalCapacity} gardes, ` +
          `Actuellement: ${currentCount.count} gardes affectés.`
        );
      }

      // Close current deployment if exists (if not already closed above)
      if (!((isBecomingRoteur && !wasRoteur) || (!newSiteId))) {
        db.prepare(`
          UPDATE historique_deployements 
          SET est_actif = 0, date_fin = CURRENT_DATE, modifie_le = CURRENT_TIMESTAMP
          WHERE employe_id = ? AND est_actif = 1
        `).run(employee.id);
      }

      // Create new deployment (only if not becoming a ROTEUR)
      if (!isBecomingRoteur) {
        const deploymentId = 'dep-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        db.prepare(`
          INSERT INTO historique_deployements (
            id, employe_id, site_id, date_debut, poste, motif_affectation, est_actif
          ) VALUES (?, ?, ?, CURRENT_DATE, ?, 'TRANSFERT', 1)
        `).run(deploymentId, employee.id, newSiteId, 'JOUR');
      }
    }

    // Ensure ROTEUR employees don't have site assignments
    const finalSiteId = (employee.poste === 'ROTEUR') ? null : (employee.site_affecte_id || null);

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
      finalSiteId,
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

// Get site deployment history
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

// Create new deployment
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

    db.prepare('UPDATE employees_gas SET site_affecte_id = NULL, modifie_le = CURRENT_TIMESTAMP WHERE id = ?')
      .run(employeId);

    return { success: true };
  } catch (error) {
    console.error('Error ending deployment:', error);
    throw error;
  }
});

// Get current deployment
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

// Get leave requests
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

    db.prepare(`
      UPDATE demandes_conge SET
        statut = 'APPROUVE',
        approuve_par = ?,
        date_approbation = date('now'),
        notes_approbation = ?
      WHERE id = ?
    `).run(approuvePar, notes || null, id);

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

// Calculate leave provisions
ipcMain.handle('db-calculate-leave-provisions', async (event, year) => {
  try {
    const targetYear = year || new Date().getFullYear();
    
    const employees = db.prepare(`
      SELECT id, date_embauche, taux_journalier, salaire_base, mode_remuneration
      FROM employees_gas
      WHERE statut = 'ACTIF'
    `).all();

    for (const emp of employees) {
      const hireDate = new Date(emp.date_embauche);
      const yearStart = new Date(targetYear, 0, 1);
      const yearEnd = new Date(targetYear, 11, 31);
      
      let monthsWorked = 12;
      if (hireDate.getFullYear() === targetYear) {
        monthsWorked = 12 - hireDate.getMonth();
      } else if (hireDate > yearEnd) {
        monthsWorked = 0;
      }

      const joursAcquis = monthsWorked * 1.5;
      const dailyRate = emp.mode_remuneration === 'JOURNALIER' 
        ? emp.taux_journalier 
        : (emp.salaire_base / 26);
      const provisionMontant = joursAcquis * dailyRate;

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
    
    if (!['EN_ATTENTE_SIGNATURE', 'EN_ATTENTE_VALIDATION'].includes(action.statut)) {
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

// Submit action for employee signature
ipcMain.handle('db-submit-disciplinary-for-signature', async (event, id) => {
  try {
    const action = db.prepare('SELECT statut FROM actions_disciplinaires WHERE id = ?').get(id);
    
    if (!action) {
      throw new Error('Action disciplinaire non trouvée');
    }
    
    if (action.statut !== 'BROUILLON') {
      throw new Error('Seules les actions en brouillon peuvent être soumises');
    }

    db.prepare(`
      UPDATE actions_disciplinaires SET statut = 'EN_ATTENTE_SIGNATURE'
      WHERE id = ?
    `).run(id);

    return { success: true };
  } catch (error) {
    console.error('Error submitting disciplinary action for signature:', error);
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
        const id = crypto.randomUUID();
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
// PAYROLL MODULE - Flush and Lock Validation
// ============================================================================

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

// ============================================================================
// FILE MANAGEMENT - Photo and Document Upload
// ============================================================================

const fs = require('fs');

// Save uploaded file (photo or document)
ipcMain.handle('db-save-file', async (event, { fileBuffer, fileName, fileType, employeeId }) => {
  try {
    const isDev = !app.isPackaged;
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
    const isDev = !app.isPackaged;
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
    const isDev = !app.isPackaged;
    const fullPath = isDev 
      ? path.join(__dirname, '..', relativePath)
      : path.join(process.resourcesPath, relativePath);
    
    return { success: true, fullPath };
  } catch (error) {
    console.error('Error getting file path:', error);
    throw error;
  }
});

// ============================================================================
// DATA CONSISTENCY UTILITIES
// ============================================================================

// Clean up inconsistent site assignments for ROTEUR employees
ipcMain.handle('db-cleanup-roteur-assignments', async () => {
  try {
    // Close active deployments for ROTEUR employees
    const result1 = db.prepare(`
      UPDATE historique_deployements 
      SET est_actif = 0, date_fin = CURRENT_DATE, modifie_le = CURRENT_TIMESTAMP
      WHERE employe_id IN (
        SELECT id FROM employees_gas WHERE poste = 'ROTEUR'
      ) AND est_actif = 1
    `).run();

    // Clear site assignments for ROTEUR employees
    const result2 = db.prepare(`
      UPDATE employees_gas 
      SET site_affecte_id = NULL, modifie_le = CURRENT_TIMESTAMP
      WHERE poste = 'ROTEUR' AND site_affecte_id IS NOT NULL
    `).run();

    return { 
      success: true, 
      deploymentsUpdated: result1.changes,
      employeesUpdated: result2.changes
    };
  } catch (error) {
    console.error('Error cleaning up roteur assignments:', error);
    throw error;
  }
});

// General data consistency check
ipcMain.handle('db-check-data-consistency', async () => {
  try {
    const issues = [];

    // Check for ROTEUR employees with site assignments
    const roteurWithSites = db.prepare(`
      SELECT id, nom_complet, site_affecte_id
      FROM employees_gas 
      WHERE poste = 'ROTEUR' AND site_affecte_id IS NOT NULL
    `).all();

    if (roteurWithSites.length > 0) {
      issues.push({
        type: 'ROTEUR_WITH_SITE',
        count: roteurWithSites.length,
        description: 'Rôteurs avec affectation de site',
        employees: roteurWithSites
      });
    }

    // Check for active deployments for ROTEUR employees
    const roteurWithActiveDeployments = db.prepare(`
      SELECT h.id, h.employe_id, e.nom_complet, s.nom_site
      FROM historique_deployements h
      JOIN employees_gas e ON h.employe_id = e.id
      JOIN sites_gas s ON h.site_id = s.id
      WHERE e.poste = 'ROTEUR' AND h.est_actif = 1
    `).all();

    if (roteurWithActiveDeployments.length > 0) {
      issues.push({
        type: 'ROTEUR_WITH_ACTIVE_DEPLOYMENT',
        count: roteurWithActiveDeployments.length,
        description: 'Rôteurs avec déploiements actifs',
        deployments: roteurWithActiveDeployments
      });
    }

    // Check for employees with site assignments but no active deployment
    const employeesWithSiteButNoDeployment = db.prepare(`
      SELECT e.id, e.nom_complet, e.site_affecte_id, s.nom_site
      FROM employees_gas e
      JOIN sites_gas s ON e.site_affecte_id = s.id
      WHERE e.poste != 'ROTEUR' 
        AND e.statut = 'ACTIF'
        AND e.site_affecte_id IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM historique_deployements h 
          WHERE h.employe_id = e.id AND h.est_actif = 1
        )
    `).all();

    if (employeesWithSiteButNoDeployment.length > 0) {
      issues.push({
        type: 'EMPLOYEE_WITH_SITE_NO_DEPLOYMENT',
        count: employeesWithSiteButNoDeployment.length,
        description: 'Employés avec site affecté mais sans déploiement actif',
        employees: employeesWithSiteButNoDeployment
      });
    }

    // Check for employees with active deployments but mismatched site_affecte_id
    const employeesWithMismatchedSites = db.prepare(`
      SELECT 
        e.id, 
        e.nom_complet, 
        e.matricule,
        e.site_affecte_id as employee_site_id,
        s1.nom_site as employee_site_name,
        h.site_id as deployment_site_id,
        s2.nom_site as deployment_site_name
      FROM employees_gas e
      JOIN historique_deployements h ON e.id = h.employe_id AND h.est_actif = 1
      LEFT JOIN sites_gas s1 ON e.site_affecte_id = s1.id
      JOIN sites_gas s2 ON h.site_id = s2.id
      WHERE e.poste != 'ROTEUR' 
        AND e.statut = 'ACTIF'
        AND (e.site_affecte_id IS NULL OR e.site_affecte_id != h.site_id)
    `).all();

    if (employeesWithMismatchedSites.length > 0) {
      issues.push({
        type: 'SITE_ASSIGNMENT_MISMATCH',
        count: employeesWithMismatchedSites.length,
        description: 'Employés avec incohérence entre site_affecte_id et déploiement actif',
        employees: employeesWithMismatchedSites
      });
    }

    // Check for active sites belonging to inactive clients
    const activeSitesWithInactiveClients = db.prepare(`
      SELECT 
        s.id as site_id,
        s.nom_site,
        s.est_actif as site_active,
        c.id as client_id,
        c.nom_entreprise,
        c.statut as client_status
      FROM sites_gas s
      JOIN clients_gas c ON s.client_id = c.id
      WHERE s.est_actif = 1 AND c.statut = 'INACTIF'
    `).all();

    if (activeSitesWithInactiveClients.length > 0) {
      issues.push({
        type: 'ACTIVE_SITES_INACTIVE_CLIENT',
        count: activeSitesWithInactiveClients.length,
        description: 'Sites actifs appartenant à des clients inactifs',
        sites: activeSitesWithInactiveClients
      });
    }

    // Check for active deployments to sites of inactive clients
    const activeDeploymentsInactiveClients = db.prepare(`
      SELECT 
        h.id as deployment_id,
        h.employe_id,
        e.nom_complet as employee_name,
        s.id as site_id,
        s.nom_site,
        c.id as client_id,
        c.nom_entreprise,
        c.statut as client_status
      FROM historique_deployements h
      JOIN employees_gas e ON h.employe_id = e.id
      JOIN sites_gas s ON h.site_id = s.id
      JOIN clients_gas c ON s.client_id = c.id
      WHERE h.est_actif = 1 AND c.statut = 'INACTIF'
    `).all();

    if (activeDeploymentsInactiveClients.length > 0) {
      issues.push({
        type: 'ACTIVE_DEPLOYMENTS_INACTIVE_CLIENT',
        count: activeDeploymentsInactiveClients.length,
        description: 'Déploiements actifs sur des sites de clients inactifs',
        deployments: activeDeploymentsInactiveClients
      });
    }

    // Check for employees assigned to sites of inactive clients
    const employeesAssignedToInactiveClientSites = db.prepare(`
      SELECT 
        e.id as employee_id,
        e.nom_complet as employee_name,
        e.matricule,
        s.id as site_id,
        s.nom_site,
        c.id as client_id,
        c.nom_entreprise,
        c.statut as client_status
      FROM employees_gas e
      JOIN sites_gas s ON e.site_affecte_id = s.id
      JOIN clients_gas c ON s.client_id = c.id
      WHERE c.statut = 'INACTIF'
    `).all();

    if (employeesAssignedToInactiveClientSites.length > 0) {
      issues.push({
        type: 'EMPLOYEES_ASSIGNED_INACTIVE_CLIENT_SITES',
        count: employeesAssignedToInactiveClientSites.length,
        description: 'Employés affectés à des sites de clients inactifs',
        employees: employeesAssignedToInactiveClientSites
      });
    }

    return { success: true, issues };
  } catch (error) {
    console.error('Error checking data consistency:', error);
    throw error;
  }
});

// Sync site assignments with active deployments
ipcMain.handle('db-sync-site-assignments', async () => {
  try {
    // Update employees_gas.site_affecte_id to match their active deployment
    const result = db.prepare(`
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
        WHERE e.poste != 'ROTEUR' 
          AND e.statut = 'ACTIF'
          AND (e.site_affecte_id IS NULL OR e.site_affecte_id != h.site_id)
      )
    `).run();

    return { 
      success: true, 
      employeesUpdated: result.changes,
      message: `${result.changes} employé(s) synchronisé(s)`
    };
  } catch (error) {
    console.error('Error syncing site assignments:', error);
    throw error;
  }
});

// Fix client-site status inconsistencies
ipcMain.handle('db-fix-client-site-consistency', async () => {
  try {
    // Use a transaction to ensure all operations succeed together
    const deactivateSites = db.prepare(`
      UPDATE sites_gas 
      SET est_actif = 0, modifie_le = CURRENT_TIMESTAMP
      WHERE est_actif = 1 
        AND client_id IN (SELECT id FROM clients_gas WHERE statut = 'INACTIF')
    `);
    
    const closeDeployments = db.prepare(`
      UPDATE historique_deployements 
      SET est_actif = 0, date_fin = CURRENT_TIMESTAMP, modifie_le = CURRENT_TIMESTAMP 
      WHERE est_actif = 1 
        AND site_id IN (
          SELECT s.id FROM sites_gas s 
          JOIN clients_gas c ON s.client_id = c.id 
          WHERE c.statut = 'INACTIF'
        )
    `);
    
    const clearEmployeeAssignments = db.prepare(`
      UPDATE employees_gas 
      SET site_affecte_id = NULL, modifie_le = CURRENT_TIMESTAMP 
      WHERE site_affecte_id IN (
        SELECT s.id FROM sites_gas s 
        JOIN clients_gas c ON s.client_id = c.id 
        WHERE c.statut = 'INACTIF'
      )
    `);

    // Execute all operations in a transaction
    const transaction = db.transaction(() => {
      const sitesResult = deactivateSites.run();
      const deploymentsResult = closeDeployments.run();
      const employeesResult = clearEmployeeAssignments.run();
      
      return {
        sitesDeactivated: sitesResult.changes,
        deploymentsClosed: deploymentsResult.changes,
        employeeAssignmentsCleared: employeesResult.changes
      };
    });

    const results = transaction();

    return { 
      success: true, 
      ...results,
      message: `Cohérence restaurée: ${results.sitesDeactivated} site(s) désactivé(s), ${results.deploymentsClosed} déploiement(s) fermé(s), ${results.employeeAssignmentsCleared} affectation(s) d'employé supprimée(s)`
    };
  } catch (error) {
    console.error('Error fixing client-site consistency:', error);
    throw error;
  }
});

// Debug function to test client deactivation workflow
ipcMain.handle('db-test-client-deactivation', async (event, clientId) => {
  try {
    console.log(`🧪 Testing client deactivation workflow for client: ${clientId}`);
    
    // Check current state
    const client = db.prepare('SELECT * FROM clients_gas WHERE id = ?').get(clientId);
    const sites = db.prepare('SELECT * FROM sites_gas WHERE client_id = ?').all(clientId);
    const activeDeployments = db.prepare(`
      SELECT h.*, e.nom_complet, s.nom_site 
      FROM historique_deployements h
      JOIN employees_gas e ON h.employe_id = e.id
      JOIN sites_gas s ON h.site_id = s.id
      WHERE h.est_actif = 1 AND s.client_id = ?
    `).all(clientId);
    const assignedEmployees = db.prepare(`
      SELECT e.*, s.nom_site
      FROM employees_gas e
      JOIN sites_gas s ON e.site_affecte_id = s.id
      WHERE s.client_id = ?
    `).all(clientId);
    
    return {
      client,
      sites,
      activeDeployments,
      assignedEmployees,
      summary: {
        clientStatus: client?.statut,
        totalSites: sites.length,
        activeSites: sites.filter(s => s.est_actif).length,
        activeDeployments: activeDeployments.length,
        assignedEmployees: assignedEmployees.length
      }
    };
  } catch (error) {
    console.error('Error testing client deactivation:', error);
    throw error;
  }
});

// ============================================================================
// USER SETTINGS AND PREFERENCES
// ============================================================================

// Get user settings
ipcMain.handle('db-get-user-settings', async (event, userId) => {
  try {
    // For now, return default settings since we don't have a users table
    // In a real implementation, you would fetch from a user_settings table
    const defaultSettings = {
      id: `settings-${userId}`,
      user_id: userId,
      user_role: 'ADMIN', // This should come from actual user data
      quick_actions: [
        { id: 'add-employee', label: 'Ajouter Employé', icon: 'UserPlus', module: 'RH', color: 'blue', roles: ['ADMIN', 'HR'] },
        { id: 'add-client', label: 'Nouveau Client', icon: 'Building', module: 'Finance', color: 'green', roles: ['ADMIN', 'FINANCE'] },
        { id: 'create-invoice', label: 'Créer Facture', icon: 'FileText', module: 'Finance', color: 'purple', roles: ['ADMIN', 'FINANCE'] },
        { id: 'view-reports', label: 'Rapports', icon: 'BarChart', module: 'Rapports', color: 'orange', roles: ['ADMIN', 'MANAGER'] }
      ],
      preferences: {
        theme: 'light',
        language: 'fr',
        notifications: true,
        autoSave: true,
        compactView: false,
        showWelcomeBanner: true,
        dateFormat: 'DD/MM/YYYY',
        currency: 'USD',
        itemsPerPage: 25
      }
    };

    return defaultSettings;
  } catch (error) {
    console.error('Error getting user settings:', error);
    throw error;
  }
});

// Save user settings
ipcMain.handle('db-save-user-settings', async (event, settings) => {
  try {
    // For now, just return success since we don't have persistent storage
    // In a real implementation, you would save to a user_settings table
    console.log('Saving user settings:', settings);
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
      { id: 'add-employee', label: 'Ajouter Employé', icon: 'UserPlus', module: 'RH', color: 'blue', roles: ['ADMIN', 'HR'] },
      { id: 'add-client', label: 'Nouveau Client', icon: 'Building', module: 'Finance', color: 'green', roles: ['ADMIN', 'FINANCE'] },
      { id: 'create-invoice', label: 'Créer Facture', icon: 'FileText', module: 'Finance', color: 'purple', roles: ['ADMIN', 'FINANCE'] },
      { id: 'view-reports', label: 'Rapports', icon: 'BarChart', module: 'Rapports', color: 'orange', roles: ['ADMIN', 'MANAGER'] },
      { id: 'add-site', label: 'Nouveau Site', icon: 'MapPin', module: 'Operations', color: 'indigo', roles: ['ADMIN', 'OPERATIONS'] },
      { id: 'fleet-management', label: 'Gestion Flotte', icon: 'Truck', module: 'Operations', color: 'gray', roles: ['ADMIN', 'OPERATIONS'] },
      { id: 'payroll', label: 'Paie', icon: 'DollarSign', module: 'Paie', color: 'emerald', roles: ['ADMIN', 'HR'] },
      { id: 'inventory', label: 'Inventaire', icon: 'Package', module: 'Inventaire', color: 'amber', roles: ['ADMIN', 'INVENTORY'] },
      { id: 'disciplinary', label: 'Actions Disciplinaires', icon: 'AlertTriangle', module: 'RH', color: 'red', roles: ['ADMIN', 'HR'] },
      { id: 'roteur-management', label: 'Gestion Rôteurs', icon: 'RotateCcw', module: 'Operations', color: 'cyan', roles: ['ADMIN', 'OPERATIONS'] }
    ];

    // Filter actions based on user role
    const availableActions = allActions.filter(action => 
      action.roles.includes(userRole) || userRole === 'ADMIN'
    );

    return availableActions;
  } catch (error) {
    console.error('Error getting available quick actions:', error);
    throw error;
  }
});

// Change user password
ipcMain.handle('db-change-user-password', async (event, userId, currentPassword, newPassword) => {
  try {
    // For now, just simulate password change since we don't have user authentication
    // In a real implementation, you would:
    // 1. Verify current password
    // 2. Hash new password
    // 3. Update user record
    console.log(`Password change requested for user ${userId}`);
    
    // Simulate password verification (always fail for demo)
    if (currentPassword !== 'admin') {
      throw new Error('Mot de passe actuel incorrect');
    }

    return { success: true };
  } catch (error) {
    console.error('Error changing user password:', error);
    throw error;
  }
});

// Export user data
ipcMain.handle('db-export-user-data', async (event, userId) => {
  try {
    // Export relevant user data
    const userData = {
      user_id: userId,
      export_date: new Date().toISOString(),
      settings: {
        preferences: {
          theme: 'light',
          language: 'fr',
          notifications: true,
          autoSave: true,
          compactView: false,
          showWelcomeBanner: true,
          dateFormat: 'DD/MM/YYYY',
          currency: 'USD',
          itemsPerPage: 25
        }
      },
      // Add other user-specific data as needed
      metadata: {
        export_version: '1.0',
        application: 'Go Ahead Security'
      }
    };

    return userData;
  } catch (error) {
    console.error('Error exporting user data:', error);
    throw error;
  }
});

// Import user data
ipcMain.handle('db-import-user-data', async (event, userId, data) => {
  try {
    // Validate import data structure
    if (!data || !data.settings) {
      throw new Error('Format de données invalide');
    }

    // In a real implementation, you would:
    // 1. Validate data structure
    // 2. Merge with existing settings
    // 3. Save to database
    console.log(`Importing user data for user ${userId}:`, data);

    return { success: true };
  } catch (error) {
    console.error('Error importing user data:', error);
    throw error;
  }
});

// ============================================================================
// EXCEL IMPORT - Customer Import from Excel
// ============================================================================

ipcMain.handle('db-import-customers-from-excel', async (event) => {
  try {
    console.log('🔄 Starting Excel import process...');
    
    // 1. Read Excel file
    const isDev = !app.isPackaged;
    const excelPath = isDev 
      ? path.join(__dirname, '..', 'public', 'customers.xlsx')
      : path.join(process.resourcesPath, 'public', 'customers.xlsx');
    
    console.log(`📁 Reading Excel file from: ${excelPath}`);
    
    // Check if file exists
    const fs = require('fs');
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
      return {
        success: false,
        error: 'Le fichier Excel est vide ou ne contient pas de données valides'
      };
    }
    
    // 2. Group data by company name to identify duplicates
    const groupedData = {};
    data.forEach((row, index) => {
      // Use the actual column names from the Excel file
      const companyName = row['nameCustomer'] || row['nom_entreprise'] || row['Nom Entreprise'] || 
                         row['Company Name'] || row['nom'] || row['Nom'] || row['Name'] || 
                         row['ENTREPRISE'] || row['entreprise'] || row['Client'] || row['CLIENT'];
      
      if (!companyName) {
        console.warn(`⚠️ Row ${index + 1}: No company name found, skipping`);
        return;
      }
      
      const normalizedName = companyName.toString().trim().toUpperCase();
      if (!groupedData[normalizedName]) {
        groupedData[normalizedName] = [];
      }
      groupedData[normalizedName].push({ ...row, originalCompanyName: companyName, rowIndex: index + 1 });
    });
    
    console.log(`🏢 Found ${Object.keys(groupedData).length} unique companies`);
    
    // 3. Process each group
    let clientsCreated = 0;
    let sitesCreated = 0;
    const errors = [];
    
    // Prepare database statements
    const insertClient = db.prepare(`
      INSERT INTO clients_gas (
        id, type_client, nom_entreprise, nif, contact_nom, telephone, 
        contact_email, adresse_facturation, devise_preferee, statut
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const insertSite = db.prepare(`
      INSERT INTO sites_gas (
        id, client_id, nom_site, adresse_physique, effectif_jour_requis, 
        effectif_nuit_requis, tarif_mensuel_client, cout_unitaire_garde, est_actif
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const checkExistingClient = db.prepare(`
      SELECT id FROM clients_gas WHERE UPPER(nom_entreprise) = ? AND statut != 'SUPPRIME'
    `);
    
    // Process each company group
    for (const [normalizedName, records] of Object.entries(groupedData)) {
      try {
        console.log(`🔄 Processing company: ${normalizedName} (${records.length} records)`);
        
        // Check if client already exists
        const existingClient = checkExistingClient.get(normalizedName);
        let clientId = existingClient?.id;
        
        // If client doesn't exist, create it from the first record
        if (!existingClient) {
          const firstRecord = records[0];
          clientId = crypto.randomUUID();
          
          // Map Excel columns to client fields
          const clientData = {
            id: clientId,
            type_client: firstRecord['type_client'] || firstRecord['Type Client'] || 'MORALE',
            nom_entreprise: firstRecord.originalCompanyName,
            nif: firstRecord['nif'] || firstRecord['NIF'] || firstRecord['Tax ID'] || null,
            contact_nom: firstRecord['nameRepCustomer'] || firstRecord['contact_nom'] || firstRecord['Contact'] || firstRecord['contact'] || null,
            telephone: firstRecord['phoneCustomer'] || firstRecord['telephone'] || firstRecord['phone'] || firstRecord['Phone'] || firstRecord['Tel'] || null,
            contact_email: firstRecord['emailCustomer'] || firstRecord['email'] || firstRecord['Email'] || firstRecord['contact_email'] || null,
            adresse_facturation: firstRecord['addressCustomer'] || firstRecord['adresse'] || firstRecord['Adresse'] || firstRecord['Address'] || null,
            devise_preferee: firstRecord['devise'] || firstRecord['Currency'] || 'USD',
            statut: 'ACTIF'
          };
          
          insertClient.run(
            clientData.id,
            clientData.type_client,
            clientData.nom_entreprise,
            clientData.nif,
            clientData.contact_nom,
            clientData.telephone,
            clientData.contact_email,
            clientData.adresse_facturation,
            clientData.devise_preferee,
            clientData.statut
          );
          
          clientsCreated++;
          console.log(`✅ Created client: ${clientData.nom_entreprise}`);
        } else {
          console.log(`ℹ️ Using existing client: ${normalizedName}`);
        }
        
        // Create sites for all records (including first one if client was new)
        for (const record of records) {
          const siteId = crypto.randomUUID();
          
          // Generate site name (use siteCodeName from Excel or fallback)
          const siteName = record['siteCodeName'] || record['nom_site'] || record['Site Name'] || 
                          record['site'] || record['location'] || record['Location'] || 
                          `${record.originalCompanyName} - Site ${record.rowIndex}`;
          
          const siteData = {
            id: siteId,
            client_id: clientId,
            nom_site: siteName,
            adresse_physique: record['addressCustomer'] || record['adresse_physique'] || record['adresse'] || record['Address'] || record['Adresse'] || null,
            effectif_jour_requis: parseInt(record['agents'] || record['effectif_jour'] || record['Guards Day'] || record['jour'] || '1') || 1,
            effectif_nuit_requis: parseInt(record['effectif_nuit'] || record['Guards Night'] || record['nuit'] || '0') || 0,
            tarif_mensuel_client: parseFloat(record['totalPrice'] || record['tarif_mensuel'] || record['Monthly Rate'] || record['tarif'] || '0') || 0,
            cout_unitaire_garde: parseFloat(record['unitPrice'] || record['cout_unitaire'] || record['Unit Cost'] || record['cout'] || '0') || 0,
            est_actif: 1
          };
          
          insertSite.run(
            siteData.id,
            siteData.client_id,
            siteData.nom_site,
            siteData.adresse_physique,
            siteData.effectif_jour_requis,
            siteData.effectif_nuit_requis,
            siteData.tarif_mensuel_client,
            siteData.cout_unitaire_garde,
            siteData.est_actif
          );
          
          sitesCreated++;
          console.log(`✅ Created site: ${siteData.nom_site}`);
        }
        
      } catch (error) {
        const errorMsg = `Erreur lors du traitement de ${normalizedName}: ${error.message}`;
        console.error(`❌ ${errorMsg}`);
        errors.push(errorMsg);
      }
    }
    
    console.log(`✅ Import completed: ${clientsCreated} clients, ${sitesCreated} sites created`);
    
    return {
      success: true,
      clientsCreated,
      sitesCreated,
      totalProcessed: data.length,
      errors: errors.length > 0 ? errors : undefined
    };
    
  } catch (error) {
    console.error('❌ Excel import failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
});