module.exports = async function buscarOInsertarBarrio(db, nombreBarrio, idLocalidad) {
    const [barrioResult] = await db.query(
        'SELECT id FROM barrios WHERE nombre = ? AND idLocalidad = ?',
        [nombreBarrio, idLocalidad]
    );
    if (barrioResult.length > 0) {
        return barrioResult[0].id;
    } else {
        const [newBarrio] = await db.query(
            'INSERT INTO barrios (nombre, idLocalidad) VALUES (?, ?)',
            [nombreBarrio, idLocalidad]
        );
        return newBarrio.insertId;
    }
};