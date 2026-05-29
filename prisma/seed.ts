import { config as loadEnv } from 'dotenv'
loadEnv({ path: '.env.local' })
loadEnv()

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import bcrypt from 'bcryptjs'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// Date de référence des données de production
const DATE_REF = new Date('2026-05-27T10:00:00.000Z')
const PRIX_PAR_KG = 8.0

async function main() {
  console.log('🌱 Seeding Amy Colis Express database...')

  // ----------------------------------------------------------
  // 1. Comptes utilisateurs (idempotent via upsert sur username)
  // ----------------------------------------------------------
  const adminPin = process.env.ADMIN_PIN || '020106'
  const admin = await prisma.user.upsert({
    where: { username: 'amy' },
    update: { role: 'admin', actif: true },
    create: {
      username: 'amy',
      pinHash: await bcrypt.hash(adminPin, 12),
      role: 'admin',
    },
  })
  console.log(`✅ Admin : ${admin.username} (PIN ${adminPin})`)

  const abdoul = await prisma.user.upsert({
    where: { username: 'abdoul' },
    update: { role: 'employe_france', actif: true },
    create: {
      username: 'abdoul',
      pinHash: await bcrypt.hash('022512', 12),
      role: 'employe_france',
    },
  })
  console.log(`✅ Employé France : ${abdoul.username} (PIN 022512)`)

  // ----------------------------------------------------------
  // 2. Paramètres (singleton)
  // ----------------------------------------------------------
  await prisma.parametres.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      adresseRecuperation: '158 rue de Saussure, 75017 Paris, 1er étage, porte n°34',
      lienGoogleMaps: 'https://maps.app.goo.gl/5UmRv3wd9SN6S3bQ6?g_st=ic',
      telephoneEntreprise: '',
      prixParKg: PRIX_PAR_KG,
    },
  })
  console.log('✅ Paramètres initialisés')

  // ----------------------------------------------------------
  // 3. Voyage #2 (idempotent via upsert sur numero unique)
  // ----------------------------------------------------------
  const voyage = await prisma.voyage.upsert({
    where: { numero: 2 },
    update: { statut: 'receptionne', dateVoyage: DATE_REF },
    create: {
      numero: 2,
      dateVoyage: DATE_REF,
      statut: 'receptionne',
    },
  })
  console.log(`✅ Voyage #${voyage.numero} (${voyage.statut})`)

  // ----------------------------------------------------------
  // 4. Colis + clients (idempotent : id explicite + tel unique)
  // ----------------------------------------------------------
  type SeedColis = {
    slug: string
    nom: string
    prenom: string
    tel: string
    montant: number
    description: string
  }

  const colisData: SeedColis[] = [
    { slug: 'bertome',    nom: 'Bertome',    prenom: '',          tel: '0605906127', montant: 80.50, description: 'Colis' },
    { slug: 'coulibaly',  nom: 'Coulibaly',  prenom: 'Mohamed',   tel: '0751596960', montant: 11,    description: 'Colis' },
    { slug: 'amara',      nom: 'Amara',      prenom: 'Latifa',    tel: '0758097036', montant: 15,    description: 'Colis' },
    { slug: 'kady',       nom: 'Kady',       prenom: '',          tel: '0767803401', montant: 66,    description: 'Colis' },
    { slug: 'mirena',     nom: 'Mirena',     prenom: '',          tel: '0749547104', montant: 15,    description: 'Colis' },
    // Glaudo Marie : 2 colis (perruques) — 84€ + 80€ = 164€
    { slug: 'glaudo-1',   nom: 'Glaudo',     prenom: 'Marie',     tel: '0780614143', montant: 84,    description: 'Perruques' },
    { slug: 'glaudo-2',   nom: 'Glaudo',     prenom: 'Marie',     tel: '0780614143', montant: 80,    description: 'Perruques' },
    { slug: 'avois',      nom: 'Avois',      prenom: '',          tel: '0778633573', montant: 12,    description: 'Colis' },
    { slug: 'djedje',     nom: 'Djédjé',     prenom: 'Toussaint', tel: '0651925007', montant: 11,    description: 'Colis' },
    { slug: 'christelle', nom: 'Christelle', prenom: '',          tel: '0621311171', montant: 12,    description: 'Colis' },
    { slug: 'rachel',     nom: 'Rachel',     prenom: '',          tel: '0769378124', montant: 12,    description: 'Colis' },
  ]

  let count = 0
  for (const c of colisData) {
    // Client (upsert par téléphone unique → Glaudo dédupliquée automatiquement)
    const client = await prisma.client.upsert({
      where: { telephone: c.tel },
      update: { nom: c.nom, prenom: c.prenom },
      create: { nom: c.nom, prenom: c.prenom, telephone: c.tel },
    })

    // Poids estimé à partir du montant (à ajuster par l'opérateur si besoin)
    const poids = Math.round((c.montant / PRIX_PAR_KG) * 10) / 10

    const colisId = `seed-colis-${c.slug}`
    await prisma.colis.upsert({
      where: { id: colisId },
      update: {
        statut: 'receptionne',
        montant: c.montant,
        voyageId: voyage.id,
      },
      create: {
        id: colisId,
        clientId: client.id,
        expediteurTel: c.tel,
        poids,
        description: c.description,
        montant: c.montant,
        statut: 'receptionne',
        estPrepaye: false,
        voyageId: voyage.id,
        enregistreParId: admin.id,
        receptionneParId: abdoul.id,
        dateEnregistrement: DATE_REF,
        dateReception: DATE_REF,
      },
    })
    count++
  }
  console.log(`✅ ${count} colis (${colisData.length}) sur le voyage #${voyage.numero}`)

  // Mettre à jour les compteurs du voyage
  await prisma.voyage.update({
    where: { id: voyage.id },
    data: { nbColisAttendus: count, nbColisRecus: count },
  })

  console.log('\n🎉 Seed terminé !')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('amy    / 020106  → Administrateur')
  console.log('abdoul / 022512  → Employé France')
  console.log(`Voyage #2 · ${count} colis · ${DATE_REF.toLocaleDateString('fr-FR')}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
