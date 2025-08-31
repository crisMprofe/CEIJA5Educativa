module.exports = async function buscarOInsertarProvincia(db, nombreProvincia) {
    const [provinciaResult] = await db.query('SELECT id FROM provincias WHERE nombre = ?', [nombreProvincia]);
    if (provinciaResult.length > 0) {
        return provinciaResult[0].id;
    } else {
        const [newProvincia] = await db.query('INSERT INTO provincias (nombre) VALUES (?)', [nombreProvincia]);
        return newProvincia.insertId;
    }
};