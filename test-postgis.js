// test-postgis.js
// Script para verificar coordenadas PostGIS desde Node.js
// Ejecutar: node test-postgis.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testPostGIS() {
  console.log('🔍 Verificando coordenadas PostGIS...\n');

  try {
    // 1. Verificar el evento "este-s"
    console.log('📍 Buscando evento "este-s"...');
    const event = await prisma.event.findUnique({
      where: { slug: 'este-s' },
      select: {
        id: true,
        name: true,
        slug: true,
        city: true,
        country: true,
        location: true,
      },
    });

    if (!event) {
      console.log('❌ Evento no encontrado\n');
      return;
    }

    console.log('✅ Evento encontrado:', event.name);
    console.log('   ID:', event.id);
    console.log('   Location field:', event.location);
    console.log('   Location type:', typeof event.location);
    console.log('   Location is null?', event.location === null);
    console.log('');

    // 2. Extraer coordenadas con query raw
    if (event.location) {
      console.log('📐 Extrayendo coordenadas con PostGIS...');
      const result = await prisma.$queryRawUnsafe(
        'SELECT ST_Y(location::geometry) as lat, ST_X(location::geometry) as lon FROM events WHERE id = $1',
        event.id
      );

      if (result && result[0]) {
        console.log('✅ Coordenadas extraídas:');
        console.log('   Latitude:', result[0].lat);
        console.log('   Longitude:', result[0].lon);
      } else {
        console.log('⚠️  No se pudieron extraer coordenadas');
      }
    } else {
      console.log('⚠️  El campo location es NULL');
      console.log('');
      console.log('💡 Para agregar coordenadas, ejecuta en PostgreSQL:');
      console.log(`   UPDATE events SET location = ST_SetSRID(ST_MakePoint(2.1734, 41.3874), 4326) WHERE id = '${event.id}';`);
    }

    console.log('');

    // 3. Contar eventos con y sin coordenadas
    console.log('📊 Estadísticas generales:');
    const stats = await prisma.$queryRaw`
      SELECT 
        COUNT(*) FILTER (WHERE location IS NOT NULL) as con_coordenadas,
        COUNT(*) FILTER (WHERE location IS NULL) as sin_coordenadas,
        COUNT(*) as total
      FROM events
    `;

    if (stats && stats[0]) {
      console.log('   Con coordenadas:', Number(stats[0].con_coordenadas));
      console.log('   Sin coordenadas:', Number(stats[0].sin_coordenadas));
      console.log('   Total:', Number(stats[0].total));
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testPostGIS();
