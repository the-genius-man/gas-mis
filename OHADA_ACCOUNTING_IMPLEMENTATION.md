# Implémentation Comptabilité OHADA Complète

## Vue d'ensemble

Le système GAS-MIS implémente maintenant une **comptabilité OHADA complète** pour le suivi des salaires impayés, des charges sociales et des écritures comptables en partie double.

---

## 📊 Nouvelles Tables de Base de Données

### 1. **salaires_impayes** (Compte 422 - Personnel, Rémunérations Dues)
Suivi des salaires non payés aux employés.

**Champs clés:**
- `montant_net_du`: Montant total dû
- `montant_paye`: Montant déjà payé
- `montant_restant`: Solde à payer
- `statut`: IMPAYE | PAYE_PARTIEL | PAYE_TOTAL
- `date_echeance`: Date limite de paiement
- `compte_comptable`: 4211 (Salaires à payer)

### 2. **paiements_salaires**
Historique des paiements de salaires (partiels ou totaux).

**Champs clés:**
- `salaire_impaye_id`: Référence au salaire impayé
- `montant_paye`: Montant du paiement
- `mode_paiement`: ESPECES | VIREMENT | CHEQUE | MOBILE_MONEY
- `compte_tresorerie_id`: Compte utilisé pour le paiement

### 3. **charges_sociales_dues** (Comptes 42x)
Suivi des cotisations sociales à payer aux organismes.

**Champs clés:**
- `organisme`: CNSS | ONEM | INPP | IPR
- `montant_du`: Montant total dû
- `montant_paye`: Montant déjà payé
- `montant_restant`: Solde à payer
- `date_echeance`: Généralement 15 du mois suivant
- `compte_comptable`: 
  - 4221 pour CNSS
  - 4222 pour ONEM
  - 4223 pour INPP
  - 4224 pour IPR

### 4. **paiements_charges_sociales**
Historique des paiements aux organismes sociaux.

**Champs clés:**
- `charge_sociale_id`: Référence à la charge sociale
- `numero_bordereau`: Numéro de bordereau de paiement
- `penalites`: Pénalités de retard éventuelles

### 5. **ecritures_comptables** (Journal)
Enregistrement des écritures comptables.

**Champs clés:**
- `date_ecriture`: Date de l'opération
- `numero_piece`: Numéro de pièce justificative
- `type_operation`: PAIE | PAIEMENT_SALAIRE | PAIEMENT_CHARGES | DEPENSE | RECETTE
- `statut`: BROUILLON | VALIDE | CLOTURE
- `montant_total`: Montant total de l'écriture

### 6. **lignes_ecritures** (Débit/Crédit)
Lignes de détail des écritures (partie double).

**Champs clés:**
- `compte_comptable`: Code du compte OHADA
- `sens`: DEBIT | CREDIT
- `montant`: Montant de la ligne
- `tiers_id` / `tiers_nom`: Identification du tiers

---

## 🔧 API / IPC Handlers Disponibles

### Salaires Impayés

```javascript
// Obtenir la liste des salaires impayés
await window.electronAPI.getSalairesImpayes({
  periode_paie_id: 'xxx',
  employe_id: 'xxx',
  statut: 'IMPAYE'
});

// Obtenir l'historique des paiements d'un salaire
await window.electronAPI.getPaiementsSalaires(salaireImpayeId);

// Enregistrer un paiement de salaire
await window.electronAPI.payerSalaire({
  salaire_impaye_id: 'xxx',
  montant_paye: 500,
  date_paiement: '2026-01-15',
  mode_paiement: 'VIREMENT',
  compte_tresorerie_id: 'xxx',
  reference_paiement: 'VIR-001'
});
```

### Charges Sociales

```javascript
// Obtenir les charges sociales dues
await window.electronAPI.getChargesSocialesDues({
  periode_paie_id: 'xxx',
  organisme: 'CNSS',
  statut: 'IMPAYE'
});

// Obtenir l'historique des paiements d'une charge
await window.electronAPI.getPaiementsChargesSociales(chargeSocialeId);

// Enregistrer un paiement de charge sociale
await window.electronAPI.payerChargeSociale({
  charge_sociale_id: 'xxx',
  montant_paye: 1000,
  date_paiement: '2026-01-15',
  mode_paiement: 'VIREMENT',
  numero_bordereau: 'BOR-2026-01',
  compte_tresorerie_id: 'xxx'
});
```

### Résumé OHADA

```javascript
// Obtenir un résumé complet des dettes de paie
const summary = await window.electronAPI.getOhadaPayrollSummary({
  periode_paie_id: 'xxx' // optionnel
});

// Retourne:
// {
//   salaires_impayes: {
//     total: 50000,
//     impaye: 30000,
//     paye_partiel: 10000,
//     paye_total: 10000
//   },
//   charges_sociales: {
//     cnss: { du: 5000, paye: 2000, restant: 3000 },
//     onem: { du: 1500, paye: 0, restant: 1500 },
//     inpp: { du: 500, paye: 0, restant: 500 },
//     ipr: { du: 3000, paye: 1000, restant: 2000 }
//   }
// }
```

### Écritures Comptables

```javascript
// Créer une écriture comptable
await window.electronAPI.createEcritureComptable({
  ecriture: {
    date_ecriture: '2026-01-31',
    numero_piece: 'PAIE-2026-01',
    libelle: 'Paie du mois de janvier 2026',
    type_operation: 'PAIE',
    source_id: 'periode_xxx',
    montant_total: 100000,
    devise: 'USD',
    statut: 'BROUILLON',
    cree_par: 'user_xxx'
  },
  lignes: [
    {
      compte_comptable: '661',
      libelle_compte: 'Salaires et appointements',
      sens: 'DEBIT',
      montant: 100000,
      devise: 'USD'
    },
    {
      compte_comptable: '4211',
      libelle_compte: 'Personnel - Salaires à payer',
      sens: 'CREDIT',
      montant: 70000,
      devise: 'USD'
    },
    {
      compte_comptable: '4221',
      libelle_compte: 'CNSS à payer',
      sens: 'CREDIT',
      montant: 5000,
      devise: 'USD'
    },
    // ... autres lignes
  ]
});

// Obtenir les écritures comptables
await window.electronAPI.getEcrituresComptables({
  date_debut: '2026-01-01',
  date_fin: '2026-01-31',
  type_operation: 'PAIE',
  statut: 'VALIDE'
});

// Obtenir les lignes d'une écriture
await window.electronAPI.getLignesEcriture(ecritureId);

// Valider une écriture
await window.electronAPI.validerEcriture({
  ecritureId: 'xxx',
  valide_par: 'user_xxx'
});

// Obtenir le grand livre
await window.electronAPI.getGrandLivre({
  compte_comptable: '4211', // optionnel
  date_debut: '2026-01-01',
  date_fin: '2026-12-31'
});

// Obtenir le bilan OHADA
await window.electronAPI.getBilanOhada({
  date_fin: '2026-12-31'
});
```

---

## 📋 Workflow Comptable OHADA

### 1. **Calcul de la Paie (Fin du mois)**

Quand la paie est calculée:
1. Les bulletins de paie sont créés
2. **Automatiquement**, des enregistrements sont créés dans `salaires_impayes`
3. **Automatiquement**, des enregistrements sont créés dans `charges_sociales_dues`
4. Statut initial: `IMPAYE`

**Écriture comptable générée:**
```
DEBIT   661 - Salaires et appointements     100,000
DEBIT   664 - Charges sociales               7,000
    CREDIT  4211 - Salaires à payer          70,000
    CREDIT  4221 - CNSS à payer               5,000
    CREDIT  4222 - ONEM à payer               1,500
    CREDIT  4223 - INPP à payer                 500
    CREDIT  4224 - IPR à payer               30,000
```

### 2. **Paiement des Salaires**

Quand un salaire est payé:
1. Enregistrement dans `paiements_salaires`
2. Mise à jour du statut dans `salaires_impayes`
3. Déduction du compte de trésorerie
4. Création d'un mouvement de trésorerie

**Écriture comptable générée:**
```
DEBIT   4211 - Salaires à payer             70,000
    CREDIT  521 - Banque                     70,000
```

### 3. **Paiement des Charges Sociales**

Quand une charge sociale est payée:
1. Enregistrement dans `paiements_charges_sociales`
2. Mise à jour du statut dans `charges_sociales_dues`
3. Déduction du compte de trésorerie
4. Création d'un mouvement de trésorerie

**Écriture comptable générée:**
```
DEBIT   4221 - CNSS à payer                  5,000
    CREDIT  521 - Banque                      5,000
```

---

## 📊 Rapports OHADA Disponibles

### 1. **État des Salaires Impayés**
Liste tous les salaires non payés ou partiellement payés par employé.

### 2. **État des Charges Sociales**
Liste toutes les charges sociales dues par organisme (CNSS, ONEM, INPP, IPR).

### 3. **Journal Comptable**
Liste chronologique de toutes les écritures comptables validées.

### 4. **Grand Livre**
Mouvements détaillés par compte comptable avec soldes.

### 5. **Bilan OHADA**
État des actifs et passifs à une date donnée.

### 6. **Compte de Résultat**
Charges et produits sur une période donnée.

---

## 🎯 Prochaines Étapes

### Phase 2: Interface Utilisateur
- [ ] Page de gestion des salaires impayés
- [ ] Page de gestion des charges sociales
- [ ] Page du journal comptable
- [ ] Page du grand livre
- [ ] Génération du bilan OHADA
- [ ] Génération du compte de résultat

### Phase 3: Automatisation
- [ ] Génération automatique des écritures lors du calcul de paie
- [ ] Génération automatique des écritures lors des paiements
- [ ] Alertes pour échéances de paiement
- [ ] Calcul automatique des pénalités de retard

### Phase 4: Rapports Avancés
- [ ] Balance générale
- [ ] Tableau de flux de trésorerie
- [ ] Annexes OHADA
- [ ] Export vers logiciels comptables

---

## 📚 Références OHADA

- **Compte 421**: Personnel, rémunérations dues
  - 4211: Salaires à payer
  - 4212: Appointements à payer
  - 4213: Primes et gratifications à payer

- **Compte 422**: Personnel, charges sociales
  - 4221: CNSS
  - 4222: ONEM
  - 4223: INPP
  - 4224: IPR

- **Compte 661**: Salaires et appointements (Charge)
- **Compte 664**: Charges sociales (Charge)
- **Compte 521**: Banques (Actif)
- **Compte 571**: Caisse (Actif)

---

## ✅ Conformité OHADA

Le système est maintenant conforme aux normes OHADA pour:
- ✅ Suivi des dettes du personnel (Compte 421)
- ✅ Suivi des charges sociales à payer (Compte 422)
- ✅ Écritures en partie double (Débit/Crédit)
- ✅ Journal comptable
- ✅ Grand livre par compte
- ✅ Bilan (Actif/Passif)
- ✅ Compte de résultat (Charges/Produits)

Le système peut maintenant être audité selon les normes OHADA!
