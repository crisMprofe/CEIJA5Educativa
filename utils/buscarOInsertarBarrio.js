module.exports = async function buscarOInsertarBarrio(db, nombreBarrio, idLocalidad) {
    console.log('🏘️ [buscarOInsertarBarrio] Recibido:', { nombreBarrio, idLocalidad, tipo: typeof nombreBarrio });
    
    // Si nombreBarrio es null, undefined o vacío, crear un barrio por defecto
    if (!nombreBarrio || nombreBarrio === null || nombreBarrio === undefined || nombreBarrio === '') {
        console.log('⚠️ [buscarOInsertarBarrio] Barrio vacío/nulo, creando barrio por defecto');
        nombreBarrio = 'Sin especificar';
    }
    
    // Si viene un ID numérico, devolverlo directamente
    if (!isNaN(nombreBarrio) && Number.isInteger(Number(nombreBarrio))) {
        const barrio = { id: Number(nombreBarrio) };
        console.log('🔢 [buscarOInsertarBarrio] ID numérico directo:', barrio);
        return barrio;
    }
    
    // Buscar por nombre y localidad (para compatibilidad con registros existentes)
    const [barrioResult] = await db.query(
        'SELECT id FROM barrios WHERE nombre = ? AND idLocalidad = ?',
        [nombreBarrio, idLocalidad]
    );
    if (barrioResult.length > 0) {
        const barrio = { id: barrioResult[0].id };
        console.log('🔍 [buscarOInsertarBarrio] Barrio encontrado:', barrio);
        return barrio;
    } else {
        const [newBarrio] = await db.query(
            'INSERT INTO barrios (nombre, idLocalidad) VALUES (?, ?)',
            [nombreBarrio, idLocalidad]
        );
        const barrio = { id: newBarrio.insertId };
        console.log('✨ [buscarOInsertarBarrio] Barrio creado:', barrio);
        return barrio;
    }
};