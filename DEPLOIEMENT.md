# 🚀 Guide de Déploiement — Amy Colis Express

## Stack
- **Frontend + API** : Next.js 16 → Vercel
- **Base de données** : PostgreSQL → Supabase
- **Auth** : JWT custom (PIN 6 chiffres)
- **IA** : Google Gemini 2.0 Flash

---

## ÉTAPE 1 : Créer le projet Supabase

1. Allez sur [supabase.com](https://supabase.com) → **New Project**
2. Notez vos identifiants :
   - **Project URL** : `https://XXXXX.supabase.co`
   - **Anon Key** : dans Settings → API
   - **Service Role Key** : dans Settings → API
   - **Database Password** : celui que vous avez choisi

---

## ÉTAPE 2 : Configurer les variables d'environnement

Créez un fichier `.env.local` à la racine du projet :

```env
# Supabase Database (remplacez [YOUR-PASSWORD] et [YOUR-PROJECT-REF])
DATABASE_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres"

# JWT Secret (générez une chaîne aléatoire)
JWT_SECRET="votre-secret-jwt-tres-long-et-aleatoire-minimum-32-chars"

# Admin PIN
ADMIN_PIN="020106"

# URL de l'app
NEXT_PUBLIC_APP_URL="https://votre-domaine.vercel.app"
```

> **Note** : Trouvez l'URL exacte dans Supabase → Settings → Database → Connection string

---

## ÉTAPE 3 : Pousser le schéma en base de données

```bash
# Installer les dépendances
npm install

# Générer le client Prisma
npx prisma generate

# Pousser le schéma vers Supabase (crée toutes les tables)
npx prisma db push

# Créer le compte admin (PIN: 020106)
npm run seed
```

---

## ÉTAPE 4 : Déployer sur Vercel

### Option A : Via l'interface Vercel (recommandé)

1. Allez sur [vercel.com](https://vercel.com) → **New Project**
2. Importez votre repo GitHub
3. Dans **Environment Variables**, ajoutez :
   - `DATABASE_URL` = (votre URL Supabase avec pgbouncer)
   - `DIRECT_URL` = (votre URL Supabase directe)
   - `JWT_SECRET` = (votre secret JWT)
   - `ADMIN_PIN` = `020106`
4. Cliquez **Deploy**

### Option B : Via CLI Vercel

```bash
npm install -g vercel
vercel login
vercel --prod
```

---

## ÉTAPE 5 : Première connexion

1. Ouvrez votre URL Vercel
2. Connectez-vous avec :
   - **Username** : `amy`
   - **PIN** : `020106`
3. Allez dans **Paramètres** pour configurer :
   - Adresse de récupération Paris
   - Lien Google Maps
   - Prix au kg
   - Messages WhatsApp
   - Clé API Gemini

---

## Création des comptes employés

1. Connectez-vous en tant qu'admin
2. Allez dans **Admin → Utilisateurs** (`/admin/users`)
3. Cliquez **Nouvel employé** et remplissez le formulaire :
   - Nom d'utilisateur (lettres, chiffres, `_`, 3-30 caractères)
   - Rôle : Employé Abidjan / Employé France / Administrateur
   - PIN à 6 chiffres (à répéter pour confirmation)
4. Actions disponibles par compte :
   - **Activer / Désactiver** : empêche la connexion sans supprimer les données
   - **Changer PIN** : réinitialise le PIN de l'employé
   - **Supprimer** : suppression définitive si aucun colis lié ; sinon désactivation automatique

Ou via l'API directement :
```bash
curl -X POST https://votre-app.vercel.app/api/admin/users \
  -H "Content-Type: application/json" \
  -H "Cookie: ace_session=<votre-token-admin>" \
  -d '{"username":"employe_abidjan","pin":"123456","role":"employe_abidjan"}'
```

---

## Utilisation de l'IA (Gemini)

1. Obtenez une clé API gratuite sur [Google AI Studio](https://aistudio.google.com)
2. Dans l'app : Admin → Paramètres → Clé API Gemini
3. Admin → Analyse IA → Lancer l'analyse

---

## Structure des rôles

| Rôle | Accès |
|------|-------|
| `admin` | Tout + IA + Audit + Toutes les caisses |
| `employe_abidjan` | Enregistrement colis + Stock + Voyages |
| `employe_france` | Réception + Notifications WhatsApp + Paiements |

---

## PIN maître admin

Le PIN `020106` déverrouille **tous** les comptes en mode admin.
Connectez-vous avec **n'importe quel username** + PIN `020106` → accès admin complet.

Exemples :
- `amy` + `020106` → compte admin principal
- `employe_paris` + `020106` → accès admin sur ce compte (utile pour dépanner un employé)

---

## Troubleshooting

### Erreur de connexion DB
- Vérifiez que `DATABASE_URL` pointe vers la bonne URL Supabase
- Assurez-vous d'utiliser l'URL avec `?pgbouncer=true` pour `DATABASE_URL`
- Et l'URL sans pgbouncer pour `DIRECT_URL`

### Les photos disparaissent
- Normal : elles sont supprimées après 14 jours (configurable dans Paramètres)
- Les 3 derniers jours, un avertissement apparaît avec un bouton "Garder +14 jours"

### L'IA ne répond pas
- Vérifiez votre clé API Gemini dans les paramètres
- La clé doit commencer par `AIzaSy...`
