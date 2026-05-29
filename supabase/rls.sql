-- ============================================================
-- AMY COLIS EXPRESS — Sécurité Row Level Security (Supabase)
-- ============================================================
-- L'application gère l'authentification et les rôles au niveau
-- applicatif (JWT maison + vérifications de rôle dans les routes API).
-- Prisma se connecte à PostgreSQL via la chaîne DATABASE_URL avec le
-- rôle propriétaire (postgres / service_role), qui CONTOURNE la RLS.
--
-- On active donc la RLS sur toutes les tables et on NE crée AUCUNE
-- policy publique : la clé "anon" (NEXT_PUBLIC_SUPABASE_ANON_KEY) ne
-- peut donc rien lire ni écrire directement. Toute donnée transite
-- exclusivement par l'API de l'application. C'est une défense en
-- profondeur contre les accès directs à la base.
--
-- À exécuter dans : Supabase Dashboard > SQL Editor.
-- ============================================================

ALTER TABLE "User"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Client"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Voyage"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Colis"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Finance"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog"   ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Parametres" ENABLE ROW LEVEL SECURITY;

-- Forcer la RLS même pour le propriétaire des tables n'est PAS souhaité
-- ici : Prisma doit pouvoir tout faire. On laisse donc le rôle de service
-- contourner la RLS (comportement par défaut). Aucune policy = tout est
-- refusé pour les rôles soumis à la RLS (anon, authenticated).

-- (Optionnel) Révoquer explicitement les droits du rôle anonyme :
REVOKE ALL ON ALL TABLES    IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon;

-- ============================================================
-- NOTE : si vous migrez un jour vers Supabase Auth (auth.uid()),
-- vous pourrez créer des policies par rôle. Tant que l'app utilise
-- son propre JWT, le verrouillage ci-dessus est la bonne approche.
-- ============================================================
