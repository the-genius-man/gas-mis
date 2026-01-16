# Module Paie - Spécifications Fonctionnelles

## Vue d'Ensemble
Module de gestion de la paie pour Go Ahead Security, conforme aux réglementations RDC (CNSS, IPR, ONEM, INPP).

## Objectifs
1. Calculer automatiquement les salaires mensuels
2. Gérer les retenues légales et disciplinaires
3. Générer les bulletins de paie
4. Exporter les données pour la comptabilité et les organismes sociaux

## Fonctionnalités Principales

### 1. Calcul de Paie
- **Salaire de Base**
  - Employés mensuels: salaire fixe
  - Employés journaliers: jours travaillés × taux journalier
  
- **Retenues Légales (RDC)**
  - CNSS (Caisse Nationale de Sécurité Sociale): 5% du salaire brut
  - IPR (Impôt Professionnel sur les Rémunérations): barème progressif
  - ONEM (Office National de l'Emploi): 1.5% du salaire brut
  - INPP (Institut National de Préparation Professionnelle): 0.5% du salaire brut
  
- **Retenues Disciplinaires**
  - Déductions des actions disciplinaires validées
  - Suspensions non payées
  
- **Avances et Prêts**
  - Remboursements mensuels d'avances
  - Déductions automatiques

### 2. Génération de Bulletins
- Bulletin de paie détaillé par employé
- Format PDF imprimable
- Historique des bulletins
- Signature électronique (optionnel)

### 3. Exports
- Export Excel pour comptabilité
- Fichier virement bancaire
- Déclaration CNSS
- Rapport IPR

### 4. Gestion des Périodes
- Paie mensuelle (mois/année)
- Verrouillage des périodes traitées
- Réouverture avec autorisation
- Historique complet

## Règles de Calcul

### Barème IPR (RDC 2024)
| Tranche Mensuelle (CDF) | Taux |
|-------------------------|------|
| 0 - 72,000 | 0% |
| 72,001 - 144,000 | 3% |
| 144,001 - 288,000 | 5% |
| 288,001 - 576,000 | 10% |
| 576,001 - 1,152,000 | 15% |
| 1,152,001 - 2,304,000 | 20% |
| 2,304,001 - 4,608,000 | 25% |
| 4,608,001 - 9,216,000 | 30% |
| 9,216,001 - 18,432,000 | 35% |
| 18,432,001 - 36,864,000 | 40% |
| > 36,864,000 | 45% |

### Formule de Calcul
```
Salaire Brut = Salaire Base + Primes
Retenues Sociales = CNSS + ONEM + INPP
Salaire Imposable = Salaire Brut - Retenues Sociales
IPR = Calcul selon barème progressif
Retenues Disciplinaires = Somme des déductions validées
Avances = Remboursements du mois
Salaire Net = Salaire Brut - Retenues Sociales - IPR - Retenues Disciplinaires - Avances
```

## Modèle de Données

### Table: periodes_paie
- id (UUID)
- mois (1-12)
- annee (YYYY)
- statut (BROUILLON, CALCULEE, VALIDEE, VERROUILLEE)
- date_calcul
- calculee_par (user_id)
- date_validation
- validee_par (user_id)
- notes

### Table: bulletins_paie
- id (UUID)
- periode_paie_id
- employe_id
- salaire_base
- jours_travailles (pour journaliers)
- primes
- salaire_brut
- cnss (5%)
- onem (1.5%)
- inpp (0.5%)
- total_retenues_sociales
- salaire_imposable
- ipr
- retenues_disciplinaires
- avances
- total_retenues
- salaire_net
- devise (USD/CDF)
- statut (BROUILLON, VALIDE, PAYE)
- date_paiement
- mode_paiement
- reference_paiement

### Table: avances_employes
- id (UUID)
- employe_id
- date_avance
- montant_total
- montant_rembourse
- montant_restant
- nombre_mensualites
- mensualite_montant
- statut (EN_COURS, REMBOURSE, ANNULE)
- notes

### Table: remboursements_avances
- id (UUID)
- avance_id
- bulletin_paie_id
- montant_rembourse
- date_remboursement

## Interface Utilisateur

### Écran Principal: Gestion de Paie
- Sélection période (mois/année)
- Bouton "Calculer Paie"
- Liste des employés avec aperçu salaire
- Filtres: catégorie, statut, site
- Actions: Valider, Exporter, Imprimer

### Écran: Détail Bulletin
- Informations employé
- Détail des calculs
- Retenues détaillées
- Actions disciplinaires appliquées
- Avances déduites
- Bouton "Imprimer Bulletin"

### Écran: Avances
- Liste des avances par employé
- Formulaire nouvelle avance
- Suivi des remboursements
- Historique

## Workflow

1. **Préparation**
   - Sélectionner période (mois/année)
   - Vérifier données employés à jour
   - Vérifier actions disciplinaires validées

2. **Calcul**
   - Calculer salaires bruts
   - Calculer retenues légales
   - Appliquer retenues disciplinaires
   - Déduire avances
   - Calculer salaires nets

3. **Validation**
   - Réviser les calculs
   - Corriger si nécessaire
   - Valider la période

4. **Paiement**
   - Générer bulletins PDF
   - Exporter fichier virement
   - Marquer comme payé
   - Verrouiller période

5. **Déclarations**
   - Export CNSS
   - Export IPR
   - Export comptable

## Contraintes Techniques
- Calculs en précision décimale (2 décimales)
- Conversion USD/CDF selon taux du jour
- Validation des montants négatifs
- Audit trail complet
- Backup avant verrouillage

## Sécurité
- Seuls ADMIN et FINANCE peuvent calculer
- Seul ADMIN peut verrouiller
- Historique des modifications
- Impossibilité de modifier période verrouillée

## Performance
- Calcul batch pour tous les employés
- Cache des résultats
- Export asynchrone pour gros volumes
