module.exports = async function buscarOInsertarLocalidad(db, nombreLocalidad, idProvincia) {
    // Si viene un ID numérico, devolverlo directamente
    if (!isNaN(nombreLocalidad) && Number.isInteger(Number(nombreLocalidad))) {
        return Number(nombreLocalidad);
    }
    
    // Buscar por nombre y provincia (para compatibilidad con registros existentes)
    const [localidadResult] = await db.query(
        'SELECT id FROM localidades WHERE nombre = ? AND idProvincia = ?',
        [nombreLocalidad, idProvincia]
    );
    if (localidadResult.length > 0) {
        return localidadResult[0].id;
    } else {
        const [newLocalidad] = await db.query(
            'INSERT INTO localidades (nombre, idProvincia) VALUES (?, ?)',
            [nombreLocalidad, idProvincia]
        );
        return newLocalidad.insertId;
    }
};