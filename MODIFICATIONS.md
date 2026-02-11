# Récapitulatif des modifications (session)

Ce fichier liste **toutes les modifications** faites sur le projet pendant notre session.

---

## 1. Installation et démarrage du projet

- **`install.ps1`** (racine) : script d’installation automatique (frontend `npm install` + backend `bundle install`).
- **`package.json`** (racine) : script `npm run install:auto` pour lancer l’installation.
- **`backend/.env.example`** : exemple de variables pour la connexion PostgreSQL.
- **`backend/POSTGRESQL.md`** : guide pour installer/démarrer PostgreSQL et connecter la base.
- **`backend/lib/tasks/db_test_connection.rake`** : tâche `rake db:test_connection` pour tester la connexion PostgreSQL.
- **`backend/.ruby-version`** : avait été passé à `ruby-4.1.0` (peut avoir été modifié/supprimé localement).

---

## 2. Projets – fonctionnalités

### Backend

- **`backend/app/controllers/api/v1/investment_projects_controller.rb`**
  - Création : accepte `total_shares` en plus de `total_amount_cents` / `share_price_cents`.
  - Si `total_shares` est fourni, calcul de `total_amount_cents = total_shares * share_price_cents`.
  - Paramètre `total_shares` ajouté dans `project_params`.

- **`backend/app/controllers/api/v1/admin/investment_projects_controller.rb`**
  - Même logique de création avec `total_shares` pour l’admin.

### Frontend

- **`frontend/src/pages/dashboard/PropertiesPage.jsx`**
  - Formulaire de **création de projet** :
    - Section « Parts (tokens / fractions) » : montant total, prix par part, optionnellement nombre de parts.
    - Section « Montant min / max d’investissement ».
    - Section « Date de début / fin de levée de fonds » avec `funding_start_date` et `funding_end_date`.
  - Envoi correct des champs `funding_start_date`, `funding_end_date` à l’API (plus `start_date`/`end_date`).

- **`frontend/src/pages/projects/ProjectsPage.jsx`**
  - Suivi de l’avancement : barre de progression, dates de levée, min/max par projet.
  - Bouton « Créer un projet (via un bien) » pour porteur/admin (vers `/properties`).
  - Affichage des dates de levée et du min/max sur chaque carte projet.

- **`frontend/src/pages/projects/ProjectDetailPage.jsx`**
  - Bloc « Suivi de l’avancement du financement » avec objectif et période de levée.
  - Libellés clarifiés : parts, investissement min/max, dates de levée.

---

## 3. Organisation par rôle (dashboard et menu)

### Redirection selon le rôle

- **`frontend/src/App.jsx`**
  - Nouveau composant `DashboardRedirect` : selon le rôle, redirige vers `/admin/dashboard` (admin) ou `/dashboard` (autres).
  - Routes `/` et `*` utilisent ce redirect.

- **`frontend/src/pages/auth/LoginPage.jsx`**
  - Après connexion, redirection vers `/` au lieu de `/dashboard` pour appliquer la redirection par rôle.

### Menu (sidebar) selon le rôle

- **`frontend/src/components/Layout.jsx`**
  - **Investisseur** : Tableau de bord, Portefeuille, Projets, Mes Investissements, Profil, KYC. **Pas** de « Biens immobiliers ».
  - **Porteur** : idem + section « Immobilier » avec « Biens immobiliers ».
  - **Admin** : premier lien = « Tableau de bord » (vers `/admin/dashboard`), pas de lien vers le dashboard utilisateur ; puis Portefeuille, Projets, Mes Investissements, Biens immobiliers, Profil, KYC ; puis section « Administration » (Utilisateurs, Biens (admin), Projets (admin), Investissements, Transactions, Audit Logs).

### Contenu du tableau de bord selon le rôle

- **`frontend/src/pages/dashboard/DashboardPage.jsx`**
  - **Admin** : redirection automatique vers `/admin/dashboard`.
  - **Porteur** : tableau de bord dédié (stats biens, projets, investisseurs, montants levés ; projets et biens récents ; actions rapides vers Biens, Projets, Portefeuille). Données via `porteur_dashboard` API.
  - **Investisseur** : tableau de bord investisseur (solde, total investi, investissements actifs, KYC ; résumé portefeuille ; transactions récentes ; actions Déposer, Explorer projets, Mes investissements). Données via `dashboard` API (investisseur).
  - Plus de lien « Biens immobiliers » dans les actions rapides pour l’investisseur.

### API

- **`frontend/src/api/investments.js`**
  - Ajout de `porteurDashboardApi.get()` qui appelle `GET /porteur_dashboard`.

---

## 4. Fichiers modifiés (résumé Git)

D’après `git status` et `git diff --stat` :

| Fichier | Type de changement |
|---------|---------------------|
| `backend/.ruby-version` | Supprimé (selon ton arbre local) |
| `backend/Gemfile` | Modifié (peut être local) |
| `backend/config/database.yml` | Modifié (peut être local) |
| `backend/app/controllers/api/v1/investment_projects_controller.rb` | Modifié |
| `backend/app/controllers/api/v1/admin/investment_projects_controller.rb` | Modifié |
| `backend/lib/tasks/db_test_connection.rake` | Nouveau (untracked) |
| `frontend/src/App.jsx` | Modifié |
| `frontend/src/api/investments.js` | Modifié |
| `frontend/src/components/Layout.jsx` | Modifié |
| `frontend/src/pages/auth/LoginPage.jsx` | Modifié |
| `frontend/src/pages/dashboard/DashboardPage.jsx` | Modifié (refonte) |
| `frontend/src/pages/dashboard/PropertiesPage.jsx` | Modifié |
| `frontend/src/pages/projects/ProjectsPage.jsx` | Modifié |
| `frontend/src/pages/projects/ProjectDetailPage.jsx` | Modifié |
| `package.json` (racine) | Nouveau (untracked) |

Fichiers créés qui peuvent être ignorés par Git ou dans un autre dossier :  
`install.ps1`, `backend/.env.example`, `backend/POSTGRESQL.md`.

---

## 5. Voir les diffs dans le terminal

Pour voir le détail des changements :

```powershell
cd "c:\Users\azooz\Desktop\x-fund-app\-x-fund-app"

# Liste des fichiers modifiés
git status

# Diff d’un fichier précis (exemple)
git diff frontend/src/App.jsx
git diff frontend/src/components/Layout.jsx
git diff frontend/src/pages/dashboard/DashboardPage.jsx

# Tous les diffs
git diff
```

Pour valider toutes les modifs :

```powershell
git add .
git status
git commit -m "Rôle-based dashboards, projet features, install script, PostgreSQL doc"
```

---

*Dernière mise à jour : récapitulatif des modifications de la session.*
