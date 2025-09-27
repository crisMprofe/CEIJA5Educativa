module.exports = async function buscarOInsertarProvincia(db, nombreProvincia) {
    // Si viene un ID numérico, devolverlo directamente
    if (!isNaN(nombreProvincia) && Number.isInteger(Number(nombreProvincia))) {
        return Number(nombreProvincia);
    }
    
    // Buscar por nombre (para compatibilidad con registros existentes)
    const [provinciaResult] = await db.query('SELECT id FROM provincias WHERE nombre = ?', [nombreProvincia]);
    if (provinciaResult.length > 0) {
        return provinciaResult[0].id;
    } else {
        const [newProvincia] = await db.query('INSERT INTO provincias (nombre) VALUES (?)', [nombreProvincia]);
        return newProvincia.insertId;
    }
};