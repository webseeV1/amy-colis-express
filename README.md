# Amy Colis Express

Application de gestion de colis pour le fret **aérien & maritime** entre **Abidjan** et **Paris**.

Stack : **Next.js 16** · **Prisma 7** · **PostgreSQL / Supabase** · Auth JWT par code PIN · IA **Google Gemini**.

---

## Fonctionnalités

- **Colis** : enregistrement (Abidjan), affectation à un voyage, réception (Paris), notification WhatsApp, paiement.
- **Voyages** : numérotés, isolés (les données d'un voyage ne se mélangent jamais).
- **Caisse / Trésorerie** :
  - **CA (Chiffre d'affaires)** = somme des paiements de colis encaissés (les colis *prépayés* et *en attente de montant* sont exclus).
  - **Trésorerie** = CA + entrées diverses − dépenses.
  - Vue par employé (CA, trésorerie, historique) et vue admin consolidée (par employé + globale + graphes).
- **Rôles** : `admin`, `employe_abidjan`, `employe_france`.
- **PIN admin maître** : déverrouille n'importe quel compte admin.
- **Journal d'audit** : chaque action importante est tracée (date, heure, utilisateur).
- **PWA**, design mobile-first.

---

## Prérequis

- Node.js 20+
- PostgreSQL 16 (local) ou un projet Supabase

---

## Installation (développement local)

```bash
# 1. Dépendances
npm install

# 2. Variables d'environnement
cp .env.example .env.local
#   puis éditez .env.local (DATABASE_URL, DIRECT_URL, JWT_SECRET, ADMIN_PIN...)

# 3. Base de données : appliquer les migrations
npm run db:deploy        # prisma migrate deploy

# 4. Données initiales (comptes, voyage, colis)
npm run db:seed          # idempotent (upsert)

# 5. Lancer
npm run dev              # http://localhost:3000
```

### Comptes créés par le seed

| Username | PIN     | Rôle             |
|----------|---------|------------------|
| `amy`    | `020106`| Administrateur   |
| `abdoul` | `022512`| Employé France   |

> Le PIN `020106` est aussi le **PIN maître** qui déverrouille tout compte admin.

---

## Scripts

| Script               | Description                                            |
|----------------------|--------------------------------------------------------|
| `npm run dev`        | Serveur de développement                               |
| `npm run build`      | `prisma generate` + `prisma migrate deploy` + build    |
| `npm run start`      | Serveur de production                                   |
| `npm run db:migrate` | Créer une nouvelle migration (dev)                     |
| `npm run db:deploy`  | Appliquer les migrations (prod)                        |
| `npm run db:status`  | État des migrations                                    |
| `npm run db:seed`    | Insérer les données initiales                          |
| `npm run db:studio`  | Prisma Studio                                          |

---

## Migrations — RÈGLE ABSOLUE

> **Les données ne doivent JAMAIS être perdues lors d'une mise à jour.**

- On utilise **uniquement les migrations Prisma** (`prisma/migrations/`).
- **Jamais `prisma db push` en production.**
- Chaque nouvelle fonctionnalité qui modifie le schéma = **une nouvelle migration** :

  ```bash
  npm run db:migrate -- --name description_du_changement
  ```

- En production / sur Vercel, les migrations sont appliquées automatiquement au build
  via `prisma migrate deploy` (qui n'efface jamais les données existantes).

---

## Déploiement sur Vercel + Supabase

1. **Supabase** : créez un projet, récupérez les chaînes de connexion.
   - `DATABASE_URL` → *Connection Pooler* (port `6543`, `?pgbouncer=true&connection_limit=1`).
   - `DIRECT_URL` → connexion directe (port `5432`), utilisée pour les migrations.
2. **(Sécurité) RLS** : exécutez `supabase/rls.sql` dans le SQL Editor de Supabase
   (verrouille l'accès direct ; toutes les données passent par l'API de l'app).
3. **Vercel** : importez le repo, puis configurez les *Environment Variables*
   (voir `.env.example`) : `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `ADMIN_PIN`,
   `NEXT_PUBLIC_APP_URL`, et les clés Supabase.
4. Le build Vercel exécute `prisma migrate deploy` puis `next build`.
5. Après le premier déploiement, lancez le seed une fois :
   ```bash
   DATABASE_URL=... DIRECT_URL=... npm run db:seed
   ```

---

## Architecture

```
prisma/
  schema.prisma        # 7 modèles : User, Client, Voyage, Colis, Finance, AuditLog, Parametres
  migrations/          # migrations versionnées (source de vérité du schéma)
  seed.ts              # données initiales (idempotent)
supabase/
  rls.sql              # politiques de sécurité Row Level Security
src/
  app/                 # routes (App Router) + API
  components/          # UI réutilisable
  lib/                 # auth (JWT/PIN), prisma, audit, utils
public/images/         # logo.png, logo-icon.png
```

---

## Sécurité

- Auth par **JWT** signé (cookie `ace_session`), PIN hashé **bcrypt** (12 rounds).
- Contrôles de rôle dans chaque route API sensible.
- RLS Supabase en défense en profondeur (`supabase/rls.sql`).
- Toutes les actions importantes sont **auditées**.
