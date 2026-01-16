# Corrections - Paramètres Fiscaux

## Problème identifié
Erreur lors du chargement des paramètres fiscaux dans l'interface.

## Corrections apportées

### 1. Amélioration du handler IPC (`public/electron.cjs`)
- ✅ Ajout de validation `isNaN()` pour éviter les erreurs de parsing
- ✅ Meilleure gestion des erreurs pour IPR_BRACKETS (JSON)
- ✅ Logs détaillés pour le débogage

### 2. Initialisation robuste de la base de données
- ✅ Logs détaillés lors de l'initialisation
- ✅ Gestion d'erreur individuelle pour chaque paramètre
- ✅ Messages de confirmation dans la console

### 3. Composant TaxSettings amélioré
- ✅ Messages d'erreur plus détaillés
- ✅ Logs dans la console pour le débogage
- ✅ **NOUVEAU**: Bouton "Diagnostic" pour vérifier l'état
- ✅ Meilleure gestion des erreurs de réinitialisation

### 4. Documentation
- ✅ Guide de dépannage complet (`TAX_SETTINGS_TROUBLESHOOTING.md`)
- ✅ Instructions étape par étape

## Comment tester

### Étape 1: Redémarrer l'application
```bash
# Arrêter le serveur (Ctrl+C)
# Puis relancer
npm run dev
```

### Étape 2: Ouvrir les DevTools
- Appuyez sur F12 dans l'application Electron
- Allez dans l'onglet Console

### Étape 3: Naviguer vers Paramètres Fiscaux
- Sidebar → Finance → Onglet "Paramètres Fiscaux"

### Étape 4: Utiliser le bouton Diagnostic
- Cliquez sur "Diagnostic" en haut à droite
- Vérifiez que 4 paramètres sont affichés

## Logs attendus dans la console

### Au démarrage de l'application:
```
Tax settings count: 4
Tax settings already initialized
```

### Lors du chargement de la page:
```
Fetching tax settings...
Found 4 tax settings
Tax settings parsed successfully
Tax settings loaded: [Array(4)]
```

## Fonctionnalités disponibles

### Bouton "Diagnostic" 🆕
- Affiche le nombre de paramètres
- Liste tous les paramètres avec leurs valeurs
- Indique si la configuration est complète
- Utile pour identifier les problèmes

### Bouton "Réinitialiser"
- Restaure les valeurs par défaut RDC
- Confirmation avant action
- Messages d'erreur détaillés

### Bouton "Enregistrer"
- Sauvegarde les modifications
- Validation avant enregistrement
- Confirmation de succès

## Valeurs par défaut

| Paramètre | Valeur | Description |
|-----------|--------|-------------|
| CNSS_RATE | 5% | Caisse Nationale de Sécurité Sociale |
| ONEM_RATE | 1.5% | Office National de l'Emploi |
| INPP_RATE | 0.5% | Institut National de Préparation Professionnelle |
| IPR_BRACKETS | 11 tranches | Barème progressif 0% à 45% |

## Si le problème persiste

1. **Vérifier la base de données**
   - Ouvrez `database.sqlite` avec DB Browser
   - Vérifiez que la table `tax_settings` existe
   - Vérifiez qu'elle contient 4 lignes

2. **Réinitialiser la base de données**
   - Fermez l'application
   - Supprimez `database.sqlite`
   - Relancez l'application

3. **Vérifier les permissions**
   - Assurez-vous que l'application peut écrire dans le dossier
   - Vérifiez les permissions du fichier `database.sqlite`

4. **Consulter les logs**
   - Ouvrez DevTools (F12)
   - Onglet Console pour les logs JavaScript
   - Terminal pour les logs Electron/Node.js

## Prochaines étapes

Une fois les paramètres fiscaux chargés correctement:
1. Vous pouvez modifier les taux CNSS, ONEM, INPP
2. Les modifications affecteront les futurs calculs de paie
3. Les périodes de paie déjà calculées ne seront pas affectées
4. Le barème IPR est affiché en lecture seule (modification technique requise)
