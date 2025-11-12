import { PrismaClient, UserRole, RaceType, EventStatus, EditionStatus, RegistrationStatus, ParticipationStatus, Language, TranslationStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed v2...\n');

  // Limpiar base de datos
  console.log('🧹 Cleaning database...');
  await prisma.editionRating.deleteMany();
  await prisma.userEdition.deleteMany();
  await prisma.userCompetition.deleteMany();
  await prisma.review.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.competitionTranslation.deleteMany();
  await prisma.category.deleteMany();
  await prisma.edition.deleteMany();
  await prisma.competition.deleteMany();
  await prisma.event.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.competitionType.deleteMany();
  await prisma.terrainType.deleteMany();
  await prisma.specialSeries.deleteMany();

  // ===================================
  // 0. CREAR CATÁLOGOS - FASE 1
  // ===================================
  console.log('📚 Creating catalogs...');

  // Competition Types
  const skyRunning = await prisma.competitionType.create({
    data: {
      name: 'Sky Running',
      slug: 'sky-running',
      description: 'Carreras de montaña de alta dificultad técnica, normalmente por encima de 2000m',
      sortOrder: 1,
      isActive: true,
    },
  });

  const ultraTrail = await prisma.competitionType.create({
    data: {
      name: 'Ultra Trail',
      slug: 'ultra-trail',
      description: 'Carreras de ultra distancia (>42km) por senderos de montaña',
      sortOrder: 2,
      isActive: true,
    },
  });

  const trailRunning = await prisma.competitionType.create({
    data: {
      name: 'Trail Running',
      slug: 'trail-running',
      description: 'Carreras por senderos de montaña de distancia media',
      sortOrder: 3,
      isActive: true,
    },
  });

  const verticalKilometer = await prisma.competitionType.create({
    data: {
      name: 'Vertical Kilometer',
      slug: 'vertical-kilometer',
      description: 'Carreras verticales de 1000m+ de desnivel en menos de 5km',
      sortOrder: 4,
      isActive: true,
    },
  });

  const trailUnmarked = await prisma.competitionType.create({
    data: {
      name: 'Trail sin marcar',
      slug: 'trail-sin-marcar',
      description: 'Carreras de orientación por terreno no marcado',
      sortOrder: 5,
      isActive: true,
    },
  });

  const canicross = await prisma.competitionType.create({
    data: {
      name: 'Canicross',
      slug: 'canicross',
      description: 'Carreras con perros en trail',
      sortOrder: 6,
      isActive: true,
    },
  });

  console.log(`✅ Created ${6} competition types`);

  // Terrain Types
  const mountainTechnical = await prisma.terrainType.create({
    data: {
      name: 'Montaña técnica',
      slug: 'montana-tecnica',
      description: 'Terreno de alta montaña con pasajes técnicos',
      sortOrder: 1,
      isActive: true,
    },
  });

  const mountainMedium = await prisma.terrainType.create({
    data: {
      name: 'Montaña media',
      slug: 'montana-media',
      description: 'Montaña de altitud media sin pasajes técnicos',
      sortOrder: 2,
      isActive: true,
    },
  });

  const forestTrails = await prisma.terrainType.create({
    data: {
      name: 'Senderos boscosos',
      slug: 'senderos-boscosos',
      description: 'Senderos por bosques y zonas arboladas',
      sortOrder: 3,
      isActive: true,
    },
  });

  const desert = await prisma.terrainType.create({
    data: {
      name: 'Desierto',
      slug: 'desierto',
      description: 'Terreno desértico o semidesértico',
      sortOrder: 4,
      isActive: true,
    },
  });

  const mixed = await prisma.terrainType.create({
    data: {
      name: 'Mixto asfalto/sendero',
      slug: 'mixto-asfalto-sendero',
      description: 'Combinación de asfalto y senderos',
      sortOrder: 5,
      isActive: true,
    },
  });

  const highMountain = await prisma.terrainType.create({
    data: {
      name: 'Alta montaña',
      slug: 'alta-montana',
      description: 'Terreno de alta montaña por encima de 3000m',
      sortOrder: 6,
      isActive: true,
    },
  });

  console.log(`✅ Created ${6} terrain types`);

  // Special Series
  const goldenTrail = await prisma.specialSeries.create({
    data: {
      name: 'Golden Trail Series',
      slug: 'golden-trail-series',
      logoUrl: 'https://www.goldentrailseries.com/images/logo.png',
      websiteUrl: 'https://www.goldentrailseries.com',
      description: 'Serie mundial de carreras de skyrunning',
      sortOrder: 1,
      isActive: true,
    },
  });

  const utmbWorld = await prisma.specialSeries.create({
    data: {
      name: 'UTMB World Series',
      slug: 'utmb-world-series',
      logoUrl: 'https://utmb.world/images/logo.png',
      websiteUrl: 'https://utmb.world',
      description: 'Serie mundial de ultra trails',
      sortOrder: 2,
      isActive: true,
    },
  });

  const skyrunnerWorld = await prisma.specialSeries.create({
    data: {
      name: 'Skyrunner World Series',
      slug: 'skyrunner-world-series',
      logoUrl: 'https://www.skyrunner.com/images/logo.png',
      websiteUrl: 'https://www.skyrunner.com',
      description: 'Serie mundial de skyrunning',
      sortOrder: 3,
      isActive: true,
    },
  });

  console.log(`✅ Created ${3} special series\n`);

  // 1. CREAR USUARIOS
  console.log('👤 Creating users...');
  
  const hashedPassword = await bcrypt.hash('Password123!', 10);
  
  const admin = await prisma.user.create({
    data: {
      email: 'admin@wwtrail.com',
      username: 'admin',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'WWTRAIL',
      role: UserRole.ADMIN,
      isActive: true,
      language: Language.ES,
      country: 'ES',
      city: 'Madrid',
    },
  });

  const organizerUTMB = await prisma.user.create({
    data: {
      email: 'jean@montblanc.fr',
      username: 'jean_utmb',
      password: hashedPassword,
      firstName: 'Jean',
      lastName: 'Dupont',
      role: UserRole.ORGANIZER,
      isActive: true,
      language: Language.FR,
      country: 'FR',
      city: 'Chamonix',
    },
  });

  const organizerES = await prisma.user.create({
    data: {
      email: 'maria@trailrunning.es',
      username: 'maria_trail',
      password: hashedPassword,
      firstName: 'María',
      lastName: 'García',
      role: UserRole.ORGANIZER,
      isActive: true,
      language: Language.ES,
      country: 'ES',
      city: 'Barcelona',
    },
  });

  const athlete = await prisma.user.create({
    data: {
      email: 'carlos@runner.com',
      username: 'carlos_runner',
      password: hashedPassword,
      firstName: 'Carlos',
      lastName: 'Martínez',
      role: UserRole.ATHLETE,
      isActive: true,
      language: Language.ES,
      country: 'ES',
      city: 'Valencia',
    },
  });

  console.log('✅ 4 users created\n');

  // 2. CREAR EVENTOS (Nivel 1)
  console.log('🏔️ Creating events...');

  const eventUTMB = await prisma.event.create({
    data: {
      name: 'UTMB Mont-Blanc',
      slug: 'utmb-mont-blanc',
      description: 'El evento de trail running más prestigioso del mundo en Chamonix, Francia.',
      country: 'FR',
      city: 'Chamonix',
      typicalMonth: 8,
      firstEditionYear: 2003,
      website: 'https://utmb.world',
      email: 'info@utmb.world',
      phone: '+33 4 50 47 62 73',
      organizerId: organizerUTMB.id,
      status: EventStatus.PUBLISHED,
      featured: true,
    },
  });

  const eventTGC = await prisma.event.create({
    data: {
      name: 'Transgrancanaria',
      slug: 'transgrancanaria',
      description: 'Una de las ultras más duras de Europa en la isla de Gran Canaria.',
      country: 'ES',
      city: 'Las Palmas',
      typicalMonth: 2,
      firstEditionYear: 2003,
      website: 'https://transgrancanaria.net',
      email: 'info@transgrancanaria.net',
      organizerId: organizerES.id,
      status: EventStatus.PUBLISHED,
      featured: true,
    },
  });

  console.log('✅ 2 events created\n');

  // 3. CREAR COMPETICIONES (Nivel 2 - Distancias)
  console.log('🏃 Creating competitions...');

  const compUTMB171 = await prisma.competition.create({
    data: {
      eventId: eventUTMB.id,
      name: 'UTMB 171K',
      slug: 'utmb-mont-blanc-utmb-171k',
      description: 'La carrera principal: 171km con 10.000m D+',
      baseDistance: 171,
      baseElevation: 10000,
      baseMaxParticipants: 2300,
      type: RaceType.ULTRA,
      organizerId: organizerUTMB.id,
      status: EventStatus.PUBLISHED,
      featured: true,
    },
  });

  const compCCC = await prisma.competition.create({
    data: {
      eventId: eventUTMB.id,
      name: 'CCC 101K',
      slug: 'utmb-mont-blanc-ccc-101k',
      description: 'Courmayeur - Champex - Chamonix: 101km con 6100m D+',
      baseDistance: 101,
      baseElevation: 6100,
      baseMaxParticipants: 1700,
      type: RaceType.ULTRA,
      organizerId: organizerUTMB.id,
      status: EventStatus.PUBLISHED,
      featured: false,
    },
  });

  const compTGC125 = await prisma.competition.create({
    data: {
      eventId: eventTGC.id,
      name: 'Transgrancanaria 125K',
      slug: 'transgrancanaria-125k',
      description: 'La clásica: 125km atravesando Gran Canaria de norte a sur',
      baseDistance: 125,
      baseElevation: 7500,
      baseMaxParticipants: 1500,
      type: RaceType.ULTRA,
      organizerId: organizerES.id,
      status: EventStatus.PUBLISHED,
      featured: true,
    },
  });

  console.log('✅ 3 competitions created\n');

  // 4. CREAR EDICIONES (Nivel 3 - Años específicos)
  console.log('📅 Creating editions...');

  const editionUTMB2025 = await prisma.edition.create({
    data: {
      competitionId: compUTMB171.id,
      year: 2025,
      slug: 'utmb-mont-blanc-utmb-171k-2025',
      startDate: new Date('2025-08-29T17:00:00Z'),
      endDate: new Date('2025-08-31T12:00:00Z'),
      registrationOpenDate: new Date('2024-12-15T10:00:00Z'),
      registrationCloseDate: new Date('2025-08-15T23:59:59Z'),
      registrationUrl: 'https://utmb.world/registration',
      prices: {
        early: 230,
        normal: 260,
        late: 290,
      },
      status: EditionStatus.UPCOMING,
      registrationStatus: RegistrationStatus.OPEN,
      currentParticipants: 1850,
      featured: true,
    },
  });

  const editionUTMB2023 = await prisma.edition.create({
    data: {
      competitionId: compUTMB171.id,
      year: 2023,
      slug: 'utmb-mont-blanc-utmb-171k-2023',
      startDate: new Date('2023-08-25T17:00:00Z'),
      endDate: new Date('2023-08-27T12:00:00Z'),
      prices: {
        early: 210,
        normal: 240,
      },
      status: EditionStatus.FINISHED,
      registrationStatus: RegistrationStatus.CLOSED,
      currentParticipants: 2300,
      featured: false,
    },
  });

  const editionCCC2025 = await prisma.edition.create({
    data: {
      competitionId: compCCC.id,
      year: 2025,
      slug: 'utmb-mont-blanc-ccc-101k-2025',
      startDate: new Date('2025-08-30T08:00:00Z'),
      endDate: new Date('2025-08-31T06:00:00Z'),
      registrationOpenDate: new Date('2024-12-15T10:00:00Z'),
      registrationCloseDate: new Date('2025-08-15T23:59:59Z'),
      registrationUrl: 'https://utmb.world/registration',
      prices: {
        early: 160,
        normal: 180,
        late: 200,
      },
      status: EditionStatus.UPCOMING,
      registrationStatus: RegistrationStatus.OPEN,
      currentParticipants: 1200,
      featured: false,
    },
  });

  const editionTGC2025 = await prisma.edition.create({
    data: {
      competitionId: compTGC125.id,
      year: 2025,
      slug: 'transgrancanaria-125k-2025',
      startDate: new Date('2025-02-22T07:00:00Z'),
      endDate: new Date('2025-02-23T18:00:00Z'),
      registrationOpenDate: new Date('2024-09-01T10:00:00Z'),
      registrationCloseDate: new Date('2025-02-01T23:59:59Z'),
      registrationUrl: 'https://transgrancanaria.net/inscripcion',
      prices: {
        early: 140,
        normal: 170,
        late: 200,
      },
      status: EditionStatus.REGISTRATION_CLOSED,
      registrationStatus: RegistrationStatus.CLOSED,
      currentParticipants: 1500,
      featured: true,
    },
  });

  console.log('✅ 4 editions created\n');

  // 5. CREAR TRADUCCIONES
  console.log('🌍 Creating translations...');

  await prisma.competitionTranslation.create({
    data: {
      competitionId: compUTMB171.id,
      language: Language.ES,
      name: 'UTMB 171K',
      description: 'La carrera principal: 171km con 10.000m D+',
      status: TranslationStatus.APPROVED,
    },
  });

  await prisma.competitionTranslation.create({
    data: {
      competitionId: compCCC.id,
      language: Language.ES,
      name: 'CCC 101K',
      description: 'Courmayeur - Champex - Chamonix: 101km con 6100m D+',
      status: TranslationStatus.APPROVED,
    },
  });

  console.log('✅ 2 translations created\n');

  // 6. CREAR CATEGORÍAS
  console.log('📂 Creating categories...');

  await prisma.category.create({
    data: {
      competitionId: compUTMB171.id,
      name: 'Masculino General',
      description: 'Categoría masculina abierta',
      minAge: 18,
      gender: 'M',
    },
  });

  await prisma.category.create({
    data: {
      competitionId: compUTMB171.id,
      name: 'Femenino General',
      description: 'Categoría femenina abierta',
      minAge: 18,
      gender: 'F',
    },
  });

  console.log('✅ 2 categories created\n');

  // 7. CREAR REVIEWS
  console.log('⭐ Creating reviews...');

  await prisma.review.create({
    data: {
      competitionId: compUTMB171.id,
      userId: athlete.id,
      rating: 5,
      comment: 'Increíble experiencia. La organización fue impecable y el recorrido espectacular.',
    },
  });

  console.log('✅ 1 review created\n');

  // 8. CREAR USER COMPETITIONS
  console.log('📝 Creating user competitions tracking...');

  await prisma.userCompetition.create({
    data: {
      userId: athlete.id,
      competitionId: compUTMB171.id,
      status: ParticipationStatus.INTERESTED,
    },
  });

  await prisma.userCompetition.create({
    data: {
      userId: athlete.id,
      competitionId: compTGC125.id,
      status: ParticipationStatus.REGISTERED,
      notes: 'Primera ultra de 100k+. Emocionado!',
    },
  });

  console.log('✅ 2 user competitions created\n');

  // 9. CREAR USER EDITIONS
  console.log('🎯 Creating user editions tracking...');

  await prisma.userEdition.create({
    data: {
      userId: athlete.id,
      editionId: editionUTMB2023.id,
      status: ParticipationStatus.COMPLETED,
      finishTime: '28:45:30',
      finishTimeSeconds: 103530,
      position: 587,
      bibNumber: 'UTMB1234',
      notes: 'Mi primera UTMB. Experiencia inolvidable.',
      personalRating: 5,
      completedAt: new Date('2023-08-27T06:45:30Z'),
    },
  });

  console.log('✅ 1 user edition created\n');

  console.log('🎉 Seed completed successfully!\n');
  console.log('📊 Summary:');
  console.log('- 4 Users (1 admin, 2 organizers, 1 athlete)');
  console.log('- 2 Events (UTMB, Transgrancanaria)');
  console.log('- 3 Competitions (171K, 101K, 125K)');
  console.log('- 4 Editions (2025 + 1 historical)');
  console.log('- 2 Translations');
  console.log('- 2 Categories');
  console.log('- 1 Review');
  console.log('- 2 User Competitions');
  console.log('- 1 User Edition');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });