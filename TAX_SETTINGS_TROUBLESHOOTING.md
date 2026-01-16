# Dépannage - Paramètres Fiscaux

## Problème: "Erreur lors du chargement des paramètres fiscaux"

### Solution 1: Redémarrer l'application
Les modifications apportées nécessitent un redémarrage complet de l'application Electron.

**Étapes:**
1. Fermez complètement l'application Electron (toutes les fenêtres)
2. Arrêtez le serveur de développement (Ctrl+C dans le terminal)
3. Relancez: `npm run dev`
4. Ouvrez l'application et naviguez vers Finance → Paramètres Fiscaux

### Solution 2: Vérifier la console
Ouvrez les DevTools (F12) et vérifiez la console pour des messages détaillés:
- "Tax settings count: X" - indique combien de paramètres existent
- "Fetching tax settings..." - confirme que la requête est envoyée
- "Found X tax settings" - confirme que les données sont récupérées

### Solution 3: Réinitialiser la base de données
Si la table n'existe pas ou est corrompue:

1. Fermez l'application
2. Supprimez le fichier `database.sqlite`
3. Relancez l'application - la base sera recréée avec les valeurs par défaut

### Solution 4: Vérifier manuellement la base de données

**Avec DB Browser for SQLite:**
1. Téléchargez DB Browser for SQLite (gratuit)
2. Ouvrez `database.sqlite`
3. Vérifiez que la table `tax_settings` existe
4. Vérifiez qu'elle contient 4 lignes:
   - CNSS_RATE: 0.05
   - ONEM_RATE: 0.015
   - INPP_RATE: 0.005
   - IPR_BRACKETS: [JSON array]

### Solution 5: Forcer l'initialisation

Si la table existe mais est vide, exécutez ce code dans la console DevTools:

```javascript
// Réinitialiser les paramètres fiscaux
await window.electronAPI.resetTaxSettings();
// Recharger la page
location.reload();
```

## Valeurs par défaut (RDC)

Les paramètres fiscaux par défaut sont:

### Cotisations Sociales
- **CNSS**: 5% (0.05)
- **ONEM**: 1.5% (0.015)
- **INPP**: 0.5% (0.005)

### IPR (Impôt Professionnel sur les Rémunérations)
Barème progressif à 11 tranches (0% à 45%)

## Logs de débogage

Les logs suivants devraient apparaître dans la console Electron au démarrage:

```
Tax settings count: 4
Tax settings already initialized
```

Ou si c'est la première fois:

```
Tax settings count: 0
Initializing default tax settings...
  ✓ Inserted CNSS_RATE
  ✓ Inserted ONEM_RATE
  ✓ Inserted INPP_RATE
  ✓ Inserted IPR_BRACKETS
Default tax settings initialized successfully
```

## Vérification du chargement

Quand vous ouvrez la page Paramètres Fiscaux, vous devriez voir:

```
Fetching tax settings...
Found 4 tax settings
Tax settings parsed successfully
Tax settings loaded: [array of 4 objects]
```

## Contact

Si le problème persiste après avoir essayé toutes ces solutions, vérifiez:
1. Que vous êtes en mode Electron (pas en mode web)
2. Que le fichier `public/electron.cjs` contient les handlers IPC
3. Que le fichier `public/preload.cjs` expose les méthodes
4. Que les permissions de fichier permettent l'écriture dans `database.sqlite`
