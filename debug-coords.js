// debug-coords.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debug() {
  console.log('🔍 Debug de coordenadas\n');

  try {
    // 1. Buscar el evento
    const event = await prisma.event.findUnique({
      where: { slug: 'una-preuba-de-mapa' }
    });

    console.log('📍 Evento encontrado:');
    console.log('   ID:', event.id);
    console.log('   Nombre:', event.name);
    console.log('   Location (raw):', event.location);
    console.log('   Type of location:', typeof event.location);
    console.log('   Location truthy?', !!event.location);
    console.log('');

    // 2. Query directa SQL
    console.log('📐 Query SQL directa:');
    const result = await prisma.$queryRaw`
      SELECT 
        id, 
        name,
        location IS NOT NULL as has_location,
        ST_Y(location::geometry) as lat, 
        ST_X(location::geometry) as lon 
      FROM events 
      WHERE id = ${event.id}
    `;
    
    console.log('   Resultado:', result);
    console.log('');

    // 3. Intentar con queryRawUnsafe
    console.log('📐 Query con queryRawUnsafe:');
    const result2 = await prisma.$queryRawUnsafe(
      `SELECT id, ST_Y(location::geometry) as lat, ST_X(location::geometry) as lon 
       FROM events 
       WHERE id = $1 AND location IS NOT NULL`,
      event.id
    );
    
    console.log('   Resultado:', result2);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debug();