const buscarOInsertarDetalleDocumentacion = async (db, idInscripcion, idDocumentaciones, estadoDocumentacion, fechaEntrega, archivoDocumentacion) => {
    // Verificar si el detalle ya existe
    const [existente] = await db.query(
        `SELECT id FROM detalle_inscripcion 
         WHERE idInscripcion = ? AND idDocumentaciones = ?`,
        [idInscripcion, idDocumentaciones]
    );

    if (existente.length) {
        // Si ya existe, devolver el ID
        return existente[0].id;
    }

    // Si no existe, insertar el nuevo detalle
    const [resultado] = await db.query(
        `INSERT INTO detalle_inscripcion 
         (idInscripcion, idDocumentaciones, estadoDocumentacion, fechaEntrega, archivoDocumentacion) 
         VALUES (?, ?, ?, ?, ?)`,
        [idInscripcion, idDocumentaciones, estadoDocumentacion, fechaEntrega, archivoDocumentacion]
    );

    return resultado.insertId; // Devolver el ID del nuevo registro
};

module.exports = buscarOInsertarDetalleDocumentacion;