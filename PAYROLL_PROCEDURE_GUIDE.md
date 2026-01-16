# Guide: Procédure de Paiement des Salaires

## Vue d'Ensemble

Le système Go Ahead Security MIS utilise un processus de paie en **4 étapes** pour garantir l'exactitude et la conformité des paiements de salaires aux agents.

---

## 📋 Processus Complet de Paie

### Étape 1: Créer une Période de Paie
**Statut**: BROUILLON

**Procédure**:
1. Aller au module **Paie** dans le menu latéral
2. Cliquer sur **"Nouvelle Période"**
3. Sélectionner:
   - **Mois**: Janvier à Décembre
   - **Année**: 2026, etc.
   - **Notes**: (Optionnel) Ex: "Paie normale", "Avec primes", etc.
4. Cliquer sur **"Créer"**

**Résultat**: Une nouvelle période est créée avec le statut **BROUILLON**

---

### Étape 2: Calculer la Paie
**Statut**: BROUILLON → CALCULEE

**Procédure**:
1. Sélectionner la période dans la liste de gauche
2. Cliquer sur le bouton **"Calculer la Paie"** (icône calculatrice)
3. Confirmer l'action dans la boîte de dialogue
4. Attendre la fin du calcul (peut prendre quelques secondes)

**Ce qui se passe**:
Le système calcule automatiquement pour **chaque employé actif**:

#### A. Salaire de Base
- **Employés Mensuels**: Salaire fixe mensuel
- **Employés Journaliers**: Taux journalier × Nombre de jours travaillés

#### B. Déductions Sociales (RDC)
- **CNSS** (Caisse Nationale de Sécurité Sociale): 5% du salaire brut
- **ONEM** (Office National de l'Emploi): 1.5% du salaire brut
- **INPP** (Institut National de Préparation Professionnelle): 0.5% du salaire brut

#### C. Impôt sur le Revenu (IPR)
Barème progressif RDC (11 tranches):
```
0 - 1,500 USD      : 0%
1,501 - 3,000      : 3%
3,001 - 4,500      : 6%
4,501 - 6,000      : 9%
6,001 - 7,500      : 12%
7,501 - 9,000      : 15%
9,001 - 12,000     : 20%
12,001 - 15,000    : 25%
15,001 - 18,000    : 30%
18,001 - 24,000    : 35%
24,001+            : 45%
```

#### D. Avances et Remboursements
- Déduction automatique des avances non remboursées
- Calcul du montant à rembourser ce mois

#### E. Calcul du Net à Payer
```
Salaire Net = Salaire Brut 
            - CNSS (5%)
            - ONEM (1.5%)
            - INPP (0.5%)
            - IPR (selon barème)
            - Remboursement d'avance
```

**Résultat**: 
- Un bulletin de paie est créé pour chaque employé
- Le statut de la période passe à **CALCULEE**
- Les totaux sont affichés (nombre de bulletins, total net)

---

### Étape 3: Valider les Bulletins
**Statut**: CALCULEE → VALIDEE

**Procédure**:
1. Vérifier les bulletins calculés:
   - Cliquer sur chaque bulletin pour voir les détails
   - Vérifier les montants, déductions, et calculs
   - S'assurer que tout est correct
2. Cliquer sur le bouton **"Valider les Bulletins"** (icône check)
3. Confirmer la validation

**Ce qui se passe**:
- Tous les bulletins sont marqués comme validés
- Le statut de la période passe à **VALIDEE**
- Les bulletins ne peuvent plus être modifiés

**Important**: 
- ⚠️ Vérifiez bien avant de valider
- Une fois validés, les bulletins ne peuvent plus être modifiés
- Seule la période peut être déverrouillée par un administrateur

---

### Étape 4: Verrouiller la Période
**Statut**: VALIDEE → VERROUILLEE

**Procédure**:
1. S'assurer que tous les paiements ont été effectués
2. Cliquer sur le bouton **"Verrouiller la Période"** (icône cadenas)
3. Confirmer le verrouillage

**Ce qui se passe**:
- La période est définitivement verrouillée
- Aucune modification n'est possible
- Le statut passe à **VERROUILLEE**

**Important**:
- ⚠️ **Cette action est IRRÉVERSIBLE**
- Ne verrouillez qu'après avoir payé tous les employés
- Gardez une copie des bulletins pour vos archives

---

## 💰 Paiement Individuel des Agents

### Méthode 1: Consultation des Bulletins

**Pour voir le montant à payer à chaque agent**:

1. Aller au module **Paie**
2. Sélectionner la période (ex: Janvier 2026)
3. La liste des bulletins s'affiche avec:
   - Nom de l'employé
   - Matricule
   - Salaire brut
   - Total déductions
   - **Salaire net** (montant à payer)
   - Statut

4. Cliquer sur un bulletin pour voir les détails complets:
   - Informations employé
   - Détail des calculs
   - Déductions ligne par ligne
   - Montant net à payer

### Méthode 2: Export des Bulletins

**Pour créer une liste de paiement**:

1. Depuis la liste des bulletins
2. Cliquer sur **"Exporter Excel"** (si disponible)
3. Obtenir un fichier avec:
   - Liste de tous les employés
   - Montants nets à payer
   - Numéros de compte bancaire
   - Prêt pour le virement bancaire

### Méthode 3: Impression des Bulletins

**Pour remettre aux employés**:

1. Cliquer sur un bulletin
2. Cliquer sur **"Imprimer"** ou **"Export PDF"**
3. Remettre le bulletin à l'employé comme preuve de paiement

---

## 📊 Exemple de Calcul

### Employé: Jean MUKENDI
- **Poste**: Gardien
- **Salaire Brut**: 500 USD
- **Mode**: Mensuel Fixe

#### Calcul:
```
Salaire Brut:           500.00 USD

Déductions Sociales:
- CNSS (5%):            -25.00 USD
- ONEM (1.5%):          -7.50 USD
- INPP (0.5%):          -2.50 USD
Total Déductions:       -35.00 USD

Salaire Imposable:      465.00 USD

IPR (0% car < 1,500):   -0.00 USD

Avance à rembourser:    -50.00 USD

SALAIRE NET:            415.00 USD
```

**Montant à payer à Jean**: **415.00 USD**

---

## 🔄 Workflow Complet

```
┌─────────────────────────────────────────────────────────┐
│ 1. CRÉER PÉRIODE                                        │
│    - Sélectionner mois/année                            │
│    - Statut: BROUILLON                                  │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ 2. CALCULER PAIE                                        │
│    - Calcul automatique pour tous les employés         │
│    - Création des bulletins                             │
│    - Statut: CALCULEE                                   │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ 3. VÉRIFIER & VALIDER                                   │
│    - Consulter chaque bulletin                          │
│    - Vérifier les calculs                               │
│    - Valider tous les bulletins                         │
│    - Statut: VALIDEE                                    │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ 4. PAYER LES EMPLOYÉS                                   │
│    - Consulter les montants nets                        │
│    - Effectuer les virements bancaires                  │
│    - OU remettre l'argent en espèces                    │
│    - Remettre les bulletins aux employés                │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ 5. VERROUILLER PÉRIODE                                  │
│    - Après paiement de tous les employés                │
│    - Verrouillage définitif                             │
│    - Statut: VERROUILLEE                                │
└─────────────────────────────────────────────────────────┘
```

---

## 📝 Informations sur les Bulletins

### Contenu d'un Bulletin de Paie

Chaque bulletin contient:

**Section 1: Informations Employé**
- Nom complet
- Matricule
- Poste
- Département
- Catégorie (Garde/Administration)

**Section 2: Période**
- Mois et année
- Nombre de jours travaillés (pour journaliers)

**Section 3: Rémunération**
- Salaire de base
- Primes (si applicable)
- **Salaire Brut Total**

**Section 4: Déductions**
- CNSS (5%)
- ONEM (1.5%)
- INPP (0.5%)
- IPR (selon barème)
- Remboursement avance
- **Total Déductions**

**Section 5: Net à Payer**
- **Montant Net** (en gras)
- Devise (USD/CDF)

**Section 6: Signatures**
- Signature employeur
- Signature employé (à la réception)

---

## 🔍 Cas Particuliers

### 1. Employé avec Avance

**Situation**: L'employé a reçu une avance de 100 USD

**Calcul**:
```
Salaire Net (avant avance):  500.00 USD
Remboursement avance:        -100.00 USD
Salaire Net à payer:         400.00 USD
```

**Note**: Le système déduit automatiquement les avances

### 2. Employé Journalier

**Situation**: Gardien payé 20 USD/jour, a travaillé 25 jours

**Calcul**:
```
Taux journalier:  20.00 USD
Jours travaillés: 25
Salaire Brut:     500.00 USD
(puis déductions normales)
```

### 3. Nouvel Employé (Mois Partiel)

**Situation**: Employé embauché le 15 du mois

**Solution**:
- Pour mensuel: Calculer au prorata (15 jours / 30 jours)
- Pour journalier: Compter uniquement les jours travaillés

### 4. Employé en Congé

**Situation**: Employé en congé payé

**Solution**:
- Le salaire est calculé normalement
- Les jours de congé sont payés
- Aucune déduction supplémentaire

### 5. Employé Suspendu

**Situation**: Employé suspendu sans solde

**Solution**:
- Changer le statut à "SUSPENDU" dans RH
- L'employé n'apparaîtra pas dans le calcul de paie
- Aucun bulletin n'est généré

---

## ⚠️ Points d'Attention

### Avant de Calculer
✅ Vérifier que tous les employés actifs sont à jour
✅ Vérifier les avances enregistrées
✅ Vérifier les taux de salaire
✅ Vérifier les jours travaillés (pour journaliers)

### Avant de Valider
✅ Consulter tous les bulletins
✅ Vérifier les montants nets
✅ Vérifier les déductions
✅ Corriger les erreurs si nécessaire (recalculer)

### Avant de Verrouiller
✅ Tous les employés ont été payés
✅ Tous les bulletins ont été remis
✅ Les archives sont sauvegardées
✅ Les virements bancaires sont confirmés

---

## 🆘 Dépannage

### Problème: "Période déjà existante"
**Solution**: Une période pour ce mois/année existe déjà. Utilisez la période existante ou supprimez-la d'abord.

### Problème: "Aucun employé actif"
**Solution**: Vérifiez que vous avez des employés avec le statut "ACTIF" dans le module RH.

### Problème: "Erreur de calcul"
**Solution**: 
1. Vérifiez les données de l'employé (salaire, taux)
2. Recalculez la période
3. Contactez le support si le problème persiste

### Problème: "Impossible de modifier"
**Solution**: La période est validée ou verrouillée. Seul un administrateur peut déverrouiller.

---

## 📞 Support

Pour toute question sur la paie:
- Consultez ce guide
- Vérifiez les paramètres dans le module RH
- Contactez l'administrateur système

---

## 📚 Résumé Rapide

**Pour payer les salaires**:
1. **Créer** une période (mois/année)
2. **Calculer** la paie (automatique)
3. **Vérifier** les bulletins
4. **Valider** les bulletins
5. **Payer** les employés (consulter les montants nets)
6. **Verrouiller** la période

**Montant à payer** = Salaire Net affiché sur chaque bulletin

**Statuts**:
- BROUILLON → En préparation
- CALCULEE → Prêt à vérifier
- VALIDEE → Prêt à payer
- VERROUILLEE → Terminé et archivé

---

*Guide créé pour Go Ahead Security MIS - Version 1.0*
