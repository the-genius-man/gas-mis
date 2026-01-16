# Module Salaires Impayés - Documentation

## Vue d'ensemble

Le module **Salaires Impayés** permet de suivre et gérer les rémunérations dues au personnel selon les normes OHADA (Compte 422 - Personnel, Rémunérations Dues).

---

## 📍 Accès au Module

**Navigation:** Sidebar → Paie → Onglet "Salaires Impayés"

---

## 🎯 Fonctionnalités

### 1. **Tableau de Bord Récapitulatif**

Trois cartes affichent les indicateurs clés:

- **Total Dû**: Montant total des salaires à payer
- **Total Payé**: Montant déjà versé aux employés
- **Solde Restant**: Montant encore à payer (en rouge)

### 2. **Liste des Salaires Impayés**

Tableau détaillé avec les colonnes:
- **Employé**: Nom complet et matricule
- **Période**: Mois/Année de la paie
- **Montant Dû**: Salaire net total
- **Payé**: Montant déjà versé
- **Restant**: Solde à payer (en rouge)
- **Échéance**: Date limite de paiement
- **Statut**: Badge coloré (Impayé/Partiel/Payé)
- **Actions**: Boutons pour payer ou voir l'historique

### 3. **Filtres et Recherche**

- **Recherche**: Par nom ou matricule d'employé
- **Filtre par Statut**: 
  - Impayé (rouge)
  - Paiement partiel (jaune)
  - Payé total (vert)

### 4. **Enregistrement de Paiement**

Modal avec formulaire pour enregistrer un paiement:

**Champs:**
- Montant à payer (max = solde restant)
- Date de paiement
- Mode de paiement:
  - Espèces
  - Virement Bancaire
  - Chèque
  - Mobile Money
- Référence de paiement (optionnel)
- Notes (optionnel)

**Validation:**
- Le montant ne peut pas dépasser le solde restant
- Confirmation avant enregistrement
- Mise à jour automatique du statut

### 5. **Historique des Paiements**

Modal affichant tous les paiements effectués pour un salaire:

**Informations affichées:**
- Numéro du paiement
- Montant payé
- Date de paiement
- Mode de paiement
- Référence
- Notes

---

## 🎨 Interface Utilisateur

### Badges de Statut

- 🔴 **Impayé**: Badge rouge avec icône AlertCircle
- 🟡 **Paiement Partiel**: Badge jaune avec icône Clock
- 🟢 **Payé Total**: Badge vert avec icône CheckCircle

### Boutons d'Action

- 💳 **Payer**: Bouton bleu avec icône CreditCard (visible si non payé totalement)
- 👁️ **Historique**: Bouton gris avec icône Eye (visible si paiements existants)

### Cartes Récapitulatives

- **Total Dû**: Fond bleu clair
- **Total Payé**: Fond vert clair
- **Solde Restant**: Fond rouge clair

---

## 🔄 Workflow

### Scénario 1: Paiement Total

1. Cliquer sur le bouton "Payer" (💳)
2. Le montant est pré-rempli avec le solde restant
3. Sélectionner le mode de paiement
4. Entrer la référence (optionnel)
5. Cliquer sur "Enregistrer le Paiement"
6. Le statut passe à "Payé Total" (vert)

### Scénario 2: Paiement Partiel

1. Cliquer sur le bouton "Payer" (💳)
2. Modifier le montant (inférieur au solde)
3. Remplir les informations de paiement
4. Enregistrer
5. Le statut passe à "Paiement Partiel" (jaune)
6. Le solde restant est mis à jour
7. Le bouton "Payer" reste visible pour les paiements suivants

### Scénario 3: Consulter l'Historique

1. Cliquer sur le bouton "Historique" (👁️)
2. Modal affiche tous les paiements effectués
3. Voir les détails de chaque paiement
4. Fermer le modal

---

## 💾 Données Enregistrées

### Table: salaires_impayes

Chaque ligne représente un salaire impayé avec:
- Référence au bulletin de paie
- Référence à l'employé
- Référence à la période de paie
- Montants (dû, payé, restant)
- Date d'échéance
- Statut
- Compte comptable (4211)

### Table: paiements_salaires

Chaque paiement enregistré avec:
- Référence au salaire impayé
- Montant du paiement
- Date et mode de paiement
- Référence et notes
- Compte de trésorerie utilisé (si applicable)

---

## 🔗 Intégration OHADA

### Compte Comptable

**Compte 4211 - Personnel, Salaires à Payer**

### Écritures Automatiques

**À la création (calcul de paie):**
```
DEBIT   661 - Salaires et appointements
    CREDIT  4211 - Salaires à payer
```

**Au paiement:**
```
DEBIT   4211 - Salaires à payer
    CREDIT  521 - Banque (ou 571 - Caisse)
```

---

## 📊 Indicateurs de Performance

Le module permet de suivre:
- Taux de paiement des salaires
- Délais de paiement moyens
- Montants en retard
- Employés avec paiements partiels

---

## 🚀 Prochaines Améliorations

### Phase 2
- [ ] Export Excel de la liste
- [ ] Export PDF des reçus de paiement
- [ ] Alertes pour échéances proches
- [ ] Filtrage par période de paie
- [ ] Graphiques de suivi

### Phase 3
- [ ] Paiements groupés (plusieurs employés)
- [ ] Intégration avec comptes de trésorerie
- [ ] Génération automatique des virements bancaires
- [ ] Notifications par email/SMS aux employés
- [ ] Signature électronique des reçus

---

## 🎓 Formation Utilisateur

### Pour les Gestionnaires de Paie

1. **Consulter les salaires impayés** après chaque calcul de paie
2. **Enregistrer les paiements** dès qu'ils sont effectués
3. **Vérifier les échéances** régulièrement
4. **Consulter l'historique** en cas de litige

### Pour les Comptables

1. **Suivre le compte 4211** via ce module
2. **Rapprocher avec les mouvements de trésorerie**
3. **Vérifier la cohérence** avec les bulletins de paie
4. **Préparer les déclarations** fiscales et sociales

---

## ✅ Checklist de Mise en Production

- [x] Backend (tables, handlers IPC) implémenté
- [x] Types TypeScript définis
- [x] Interface utilisateur créée
- [x] Intégration dans le module Paie
- [ ] Tests utilisateur
- [ ] Formation des utilisateurs
- [ ] Documentation utilisateur finale
- [ ] Validation par le service comptable

---

## 📞 Support

Pour toute question ou problème:
1. Consulter cette documentation
2. Vérifier les logs dans la console (F12)
3. Contacter le support technique
