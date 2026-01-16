# Fonctionnalité d'Édition des Bulletins de Paie

## Vue d'ensemble

Ajout de la possibilité de modifier les bulletins de paie **après le calcul** et **avant la validation**, permettant des ajustements manuels si nécessaire.

---

## 🎯 Fonctionnalité Ajoutée

### Quand peut-on éditer un bulletin?

✅ **Statut CALCULEE**: Les bulletins peuvent être modifiés
❌ **Statut BROUILLON**: Pas encore calculés
❌ **Statut VALIDE**: Déjà validés, modification interdite
❌ **Statut PAYE**: Déjà payés, modification interdite
❌ **Période VERROUILLEE**: Période verrouillée, modification interdite

---

## 📝 Champs Modifiables

### 1. **Rémunération de Base**

**Pour les employés MENSUELS:**
- Salaire de base (USD)

**Pour les employés JOURNALIERS:**
- Jours travaillés (0-31)
- Taux journalier (USD)

### 2. **Primes et Retenues**

- **Primes** (USD): Primes de performance, transport, etc.
- **Retenues Disciplinaires** (USD): Amendes, sanctions
- **Autres Retenues** (USD): Prêts, avances remboursées, etc.

### 3. **Champs Non Modifiables**

- **Avances**: Gérées dans l'onglet Avances
- **Cotisations sociales**: Calculées automatiquement (CNSS, ONEM, INPP)
- **IPR**: Calculé automatiquement selon le barème
- **Salaire Net**: Calculé automatiquement

---

## 🔄 Recalcul Automatique

Lors de la modification, le système recalcule automatiquement:

1. **Salaire Brut** = Base (ou Jours × Taux) + Primes
2. **CNSS** = Brut × 5%
3. **ONEM** = Brut × 1.5%
4. **INPP** = Brut × 0.5%
5. **Salaire Imposable** = Brut - Cotisations Sociales
6. **IPR** = Selon barème progressif
7. **Total Retenues** = Cotisations + IPR + Retenues Disciplinaires + Avances + Autres
8. **Salaire Net** = Brut - Total Retenues

---

## 🎨 Interface Utilisateur

### Accès à l'Édition

**Navigation:** Paie → Sélectionner une période CALCULEE → Cliquer sur l'icône ✏️ (Edit2)

### Formulaire d'Édition

**Sections:**
1. **En-tête**: Nom et matricule de l'employé
2. **Avertissement**: Message sur l'impact des modifications
3. **Rémunération de Base**: Champs selon le mode (Mensuel/Journalier)
4. **Primes et Retenues**: Champs modifiables
5. **Récapitulatif du Calcul**: Affichage en temps réel des calculs
6. **Actions**: Boutons Annuler / Enregistrer

### Récapitulatif en Temps Réel

Le formulaire affiche un récapitulatif qui se met à jour automatiquement:
- Salaire Brut
- Détail des cotisations sociales
- Salaire Imposable
- IPR
- Détail des retenues
- **Salaire Net** (en vert, en gras)

---

## 🔒 Validations et Sécurité

### Validations Côté Frontend
- Montants positifs uniquement
- Jours travaillés entre 0 et 31
- Confirmation avant enregistrement

### Validations Côté Backend
- Vérification du statut du bulletin (doit être BROUILLON)
- Vérification du statut de la période (ne doit pas être VERROUILLEE)
- Vérification de l'existence du bulletin

### Messages d'Erreur
- "Bulletin non trouvé"
- "Impossible de modifier un bulletin validé ou payé"
- "La période est verrouillée"

---

## 💾 Données Enregistrées

### Table: bulletins_paie

Champs mis à jour:
- `salaire_base`
- `jours_travailles`
- `taux_journalier`
- `primes`
- `salaire_brut` (recalculé)
- `cnss` (recalculé)
- `onem` (recalculé)
- `inpp` (recalculé)
- `total_retenues_sociales` (recalculé)
- `salaire_imposable` (recalculé)
- `ipr` (recalculé)
- `retenues_disciplinaires`
- `autres_retenues`
- `total_retenues` (recalculé)
- `salaire_net` (recalculé)
- `modifie_le` (timestamp)

---

## 🔄 Workflow Complet

### 1. Créer une Période
```
Statut: BROUILLON
Actions disponibles: Calculer
```

### 2. Calculer la Paie
```
Statut: CALCULEE
Actions disponibles: Modifier (✏️), Valider
```

### 3. Modifier un Bulletin (NOUVEAU!)
```
- Cliquer sur l'icône ✏️
- Modifier les champs nécessaires
- Voir le récapitulatif en temps réel
- Enregistrer les modifications
```

### 4. Valider les Bulletins
```
Statut: VALIDEE
Actions disponibles: Verrouiller
Note: Modification interdite après validation
```

### 5. Verrouiller la Période
```
Statut: VERROUILLEE
Actions disponibles: Aucune
Note: Action irréversible
```

---

## 📊 Cas d'Usage

### Cas 1: Ajustement de Prime
**Situation:** Un employé a reçu une prime de performance non prévue

**Solution:**
1. Ouvrir le bulletin en édition
2. Ajouter le montant dans "Primes"
3. Vérifier le nouveau salaire net
4. Enregistrer

### Cas 2: Correction de Jours Travaillés
**Situation:** Un employé journalier a travaillé plus/moins de jours que prévu

**Solution:**
1. Ouvrir le bulletin en édition
2. Modifier "Jours Travaillés"
3. Le salaire brut se recalcule automatiquement
4. Enregistrer

### Cas 3: Retenue Disciplinaire
**Situation:** Une amende doit être appliquée

**Solution:**
1. Ouvrir le bulletin en édition
2. Ajouter le montant dans "Retenues Disciplinaires"
3. Le salaire net se recalcule automatiquement
4. Enregistrer

### Cas 4: Correction d'Erreur de Saisie
**Situation:** Le salaire de base a été mal saisi

**Solution:**
1. Ouvrir le bulletin en édition
2. Corriger le "Salaire de Base"
3. Tous les calculs se mettent à jour
4. Enregistrer

---

## 🚨 Limitations

### Ce qui NE peut PAS être modifié:
- ❌ Avances (géré dans l'onglet Avances)
- ❌ Taux de cotisations sociales (géré dans Paramètres Fiscaux)
- ❌ Barème IPR (géré dans Paramètres Fiscaux)
- ❌ Bulletins validés ou payés
- ❌ Périodes verrouillées

### Pourquoi ces limitations?
- **Avances**: Nécessitent un suivi séparé avec remboursements
- **Taux fiscaux**: Doivent être cohérents pour tous les employés
- **Bulletins validés**: Intégrité comptable OHADA
- **Périodes verrouillées**: Conformité réglementaire

---

## 🎓 Formation Utilisateur

### Pour les Gestionnaires de Paie

**Étapes:**
1. Calculer la paie normalement
2. **NOUVEAU**: Vérifier chaque bulletin
3. **NOUVEAU**: Modifier si nécessaire (primes, retenues, etc.)
4. Valider uniquement quand tout est correct
5. Verrouiller la période

**Bonnes Pratiques:**
- Toujours vérifier le récapitulatif avant d'enregistrer
- Noter les raisons des modifications dans un registre externe
- Ne valider qu'après avoir vérifié tous les bulletins
- Ne jamais modifier après validation

---

## 🔧 Implémentation Technique

### Fichiers Créés/Modifiés

**Nouveau Composant:**
- `src/components/Payroll/PayslipEditForm.tsx` (350+ lignes)

**Composants Modifiés:**
- `src/components/Payroll/PayrollManagement.tsx`
  - Ajout du state `editingPayslip`
  - Ajout de la fonction `handleUpdatePayslip`
  - Ajout du bouton Edit2 dans le tableau
  - Rendu conditionnel du formulaire d'édition

**Backend:**
- `public/electron.cjs`
  - Handler `db-update-payslip` ajouté
  - Validations de sécurité

**API:**
- `public/preload.cjs`
  - Méthode `updatePayslip` exposée

**Types:**
- `src/vite-env.d.ts`
  - Déclaration TypeScript pour `updatePayslip`

---

## ✅ Tests Recommandés

### Tests Fonctionnels
- [ ] Modifier un bulletin CALCULEE → Succès
- [ ] Tenter de modifier un bulletin VALIDE → Erreur
- [ ] Tenter de modifier dans une période VERROUILLEE → Erreur
- [ ] Modifier salaire de base → Recalcul correct
- [ ] Modifier jours travaillés → Recalcul correct
- [ ] Ajouter une prime → Recalcul correct
- [ ] Ajouter une retenue → Recalcul correct
- [ ] Annuler les modifications → Pas de changement
- [ ] Enregistrer les modifications → Mise à jour en base

### Tests de Calcul
- [ ] CNSS = 5% du brut
- [ ] ONEM = 1.5% du brut
- [ ] INPP = 0.5% du brut
- [ ] IPR selon barème progressif
- [ ] Salaire Net = Brut - Total Retenues

---

## 📈 Prochaines Améliorations

### Phase 2
- [ ] Historique des modifications (audit trail)
- [ ] Commentaires sur les modifications
- [ ] Approbation à deux niveaux
- [ ] Modification en masse (plusieurs bulletins)

### Phase 3
- [ ] Workflow d'approbation
- [ ] Notifications par email
- [ ] Export des modifications
- [ ] Rapports d'audit

---

## ✅ Checklist de Mise en Production

- [x] Backend (handler IPC) implémenté
- [x] Frontend (composant d'édition) créé
- [x] Intégration dans PayrollManagement
- [x] Validations de sécurité
- [x] Recalculs automatiques
- [x] Types TypeScript
- [ ] Tests utilisateur
- [ ] Formation des utilisateurs
- [ ] Documentation utilisateur finale
- [ ] Validation par le service RH

---

La fonctionnalité est **prête à être testée**! Redémarrez l'application Electron pour voir les changements.
