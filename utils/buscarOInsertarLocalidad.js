module.exports = async function buscarOInsertarLocalidad(db, nombreLocalidad, idProvincia) {
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