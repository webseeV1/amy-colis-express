-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin', 'employe_abidjan', 'employe_france');

-- CreateEnum
CREATE TYPE "StatutColis" AS ENUM ('en_stock', 'en_voyage', 'receptionne', 'notifie', 'paye', 'prepaye', 'attente_montant', 'impaye');

-- CreateEnum
CREATE TYPE "StatutVoyage" AS ENUM ('preparation', 'envoye', 'receptionne');

-- CreateEnum
CREATE TYPE "TypeFinance" AS ENUM ('entree', 'depense', 'entree_diverse');

-- CreateEnum
CREATE TYPE "ModePayment" AS ENUM ('especes', 'virement');

-- CreateEnum
CREATE TYPE "TypeAction" AS ENUM ('creation', 'modification', 'suppression', 'paiement', 'reception', 'notification', 'connexion', 'deconnexion', 'depense', 'entree');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "pinHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Voyage" (
    "id" TEXT NOT NULL,
    "numero" SERIAL NOT NULL,
    "dateVoyage" TIMESTAMP(3) NOT NULL,
    "statut" "StatutVoyage" NOT NULL DEFAULT 'preparation',
    "nbColisAttendus" INTEGER NOT NULL DEFAULT 0,
    "nbColisRecus" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Voyage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Colis" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "expediteurTel" TEXT NOT NULL,
    "poids" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL,
    "statut" "StatutColis" NOT NULL DEFAULT 'en_stock',
    "estPrepaye" BOOLEAN NOT NULL DEFAULT false,
    "photoUrl" TEXT,
    "photoExpiresAt" TIMESTAMP(3),
    "modePayment" "ModePayment",
    "voyageId" TEXT,
    "enregistreParId" TEXT NOT NULL,
    "receptionneParId" TEXT,
    "payeParId" TEXT,
    "dateEnregistrement" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateReception" TIMESTAMP(3),
    "datePaiement" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Colis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Finance" (
    "id" TEXT NOT NULL,
    "type" "TypeFinance" NOT NULL,
    "motif" TEXT NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL,
    "modePayment" "ModePayment",
    "voyageId" TEXT,
    "userId" TEXT NOT NULL,
    "colisId" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Finance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" "TypeAction" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Parametres" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "adresseRecuperation" TEXT NOT NULL DEFAULT '158 rue de Saussure, 75017 Paris, 1er étage, porte n°34',
    "lienGoogleMaps" TEXT NOT NULL DEFAULT 'https://maps.app.goo.gl/5UmRv3wd9SN6S3bQ6?g_st=ic',
    "telephoneEntreprise" TEXT NOT NULL DEFAULT '',
    "prixParKg" DOUBLE PRECISION NOT NULL DEFAULT 8.0,
    "messageWhatsapp" TEXT NOT NULL DEFAULT 'Bonjour {nom}, votre colis est arrivé ! Montant à régler : {montant}€. Adresse : {adresse}. {maps_link}',
    "messageRelance" TEXT NOT NULL DEFAULT 'Bonjour {nom}, votre colis vous attend toujours. Montant : {montant}€',
    "livraisonTexte" TEXT NOT NULL DEFAULT 'Livraison à domicile en Île-de-France disponible pour 20€',
    "livraisonPrix" DOUBLE PRECISION NOT NULL DEFAULT 20.0,
    "geminiApiKey" TEXT NOT NULL DEFAULT '',
    "dureeConservationPhoto" INTEGER NOT NULL DEFAULT 14,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Parametres_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Client_telephone_key" ON "Client"("telephone");

-- CreateIndex
CREATE UNIQUE INDEX "Voyage_numero_key" ON "Voyage"("numero");

-- AddForeignKey
ALTER TABLE "Colis" ADD CONSTRAINT "Colis_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Colis" ADD CONSTRAINT "Colis_voyageId_fkey" FOREIGN KEY ("voyageId") REFERENCES "Voyage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Colis" ADD CONSTRAINT "Colis_enregistreParId_fkey" FOREIGN KEY ("enregistreParId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Colis" ADD CONSTRAINT "Colis_receptionneParId_fkey" FOREIGN KEY ("receptionneParId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Colis" ADD CONSTRAINT "Colis_payeParId_fkey" FOREIGN KEY ("payeParId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Finance" ADD CONSTRAINT "Finance_voyageId_fkey" FOREIGN KEY ("voyageId") REFERENCES "Voyage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Finance" ADD CONSTRAINT "Finance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

