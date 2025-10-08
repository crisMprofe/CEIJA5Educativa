const express = require('express');
const router  = express.Router();
const db      = require('../db');

const buscarOInsertarProvincia  = require('../utils/buscarOInsertarProvincia');
const buscarOInsertarLocalidad  = require('../utils/buscarOInsertarLocalidad');
const buscarOInsertarBarrio     = require('../utils/buscarOInsertarBarrio');
const obtenerDocumentacionPorInscripcion = require('../utils/obtenerDocumentacion');

const path   = require('path');
const fs     = require('fs');
const multer = require('multer');

// ─── carpeta y multer ─────────────────────────────────────
const UPLOAD_DIR = path.join(__dirname, '../archivosDocumento');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, {recursive:true});

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const { nombre = 'sin_nombre', apellido = 'sin_apellido' } = req.body;
    const dni     = req.params.dni;
    const campo   = file.fieldname;               // dni, cuil, etc.
    const ext     = path.extname(file.originalname);
    cb(null, `${nombre.trim().replace(/\s+/g,'_')}_${apellido.trim().replace(/\s+/g,'_')}_${dni}_${campo}${ext}`);
  }
});
const upload = multer({ storage });

// ─── PUT /modificar-estudiante/:dni ───────────────────────
router.put('/:dni', upload.any(), async (req, res) => {
  const dni = Number(req.params.dni);
  if (!Number.isInteger(dni)) {
    return res.status(400).json({ success:false, message:'DNI inválido.' });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Debug: Mostrar datos recibidos
    console.log('Datos recibidos para modificar:', req.body);
    console.log('Archivos recibidos:', req.files);

    // Auto-asignar "Argentina" para documentos DNI si paisEmision está vacío
    if (req.body.tipoDocumento === 'DNI' && !req.body.paisEmision) {
      req.body.paisEmision = 'Argentina';
      console.log('Auto-asignando paisEmision = "Argentina" para DNI');
    }

    // ─── localizar estudiante & domicilio ─────────────────
    const [[est]] = await conn.query(
      'SELECT id, idDomicilio, nombre, apellido FROM estudiantes WHERE dni = ?',
      [dni]
    );
    if (!est) {
      await conn.rollback();
      return res.status(404).json({ success:false, message:'Estudiante no encontrado.' });
    }
    const idEst        = est.id;
    const idDomicilio  = est.idDomicilio;
    
    console.log(`🔍 [ESTUDIANTE LOCALIZADO] ID: ${idEst}, DNI: ${dni}, Nombre: ${est.nombre} ${est.apellido}`);

    // ─── provincia / localidad / barrio ───────────────────
    // ─── provincia / localidad / barrio ───────────────────

// Solo actualizar domicilio si alguno de sus campos viene en el body:
 // ─── ACTUALIZACIÓN DEL DOMICILIO ──────────────────────────────
// Solo procesar domicilio si realmente se enviaron cambios de domicilio
const camposDomicilio = ['calle', 'numero', 'barrio', 'localidad', 'provincia'];
const tieneCAmbiosDomicilio = camposDomicilio.some(campo => req.body[campo] && req.body[campo].toString().trim());

console.log('🏠 [DOMICILIO] Verificando cambios:', {
  camposEnviados: camposDomicilio.filter(campo => req.body[campo]),
  tieneCAmbiosDomicilio
});

if (tieneCAmbiosDomicilio) {
  if (!req.body.provincia || typeof req.body.provincia !== 'string' || !req.body.provincia.trim()) {
    throw new Error('Falta el campo provincia o es inválido');
  }

  const provinciaResult = await buscarOInsertarProvincia(conn, req.body.provincia);
  const idProvincia = parseInt(provinciaResult.id || provinciaResult, 10);

  if (!req.body.localidad || !req.body.localidad.trim()) {
    throw new Error('Falta el campo localidad o es inválido');
  }
  const localidadResult = await buscarOInsertarLocalidad(conn, req.body.localidad, provinciaResult);
  const idLocalidad = parseInt(localidadResult.id || localidadResult, 10);

  if (!req.body.barrio || !req.body.barrio.trim()) {
    throw new Error('Falta el campo barrio o es inválido');
  }
  const barrioResult = await buscarOInsertarBarrio(conn, req.body.barrio, localidadResult);
  const idBarrio = parseInt(barrioResult.id || barrioResult, 10);

  console.log('🏠 [DOMICILIO] IDs extraídos:', { idProvincia, idLocalidad, idBarrio });
  console.log('🔍 [DOMICILIO] Tipos:', { 
    idProvincia: typeof idProvincia, 
    idLocalidad: typeof idLocalidad, 
    idBarrio: typeof idBarrio 
  });
  console.log('🔍 [DOMICILIO] Valores exactos:', {
    idProvincia: JSON.stringify(idProvincia),
    idLocalidad: JSON.stringify(idLocalidad), 
    idBarrio: JSON.stringify(idBarrio)
  });

  // Validar que todos los IDs sean números válidos
  if (isNaN(idProvincia) || isNaN(idLocalidad) || isNaN(idBarrio)) {
    throw new Error(`IDs inválidos - Provincia: ${idProvincia}, Localidad: ${idLocalidad}, Barrio: ${idBarrio}`);
  }

  // Verificar si realmente necesita actualizar el domicilio
  const [domicilioActual] = await conn.query('SELECT * FROM domicilios WHERE id = ?', [idDomicilio]);
  const domicilio = domicilioActual[0];
  
  const necesitaActualizacion = (
    domicilio.calle !== req.body.calle ||
    domicilio.numero != req.body.numero ||
    domicilio.idBarrio !== idBarrio ||
    domicilio.idLocalidad !== idLocalidad ||
    domicilio.idProvincia !== idProvincia
  );
  
  console.log('🏠 [DOMICILIO] Comparación:', {
    actual: domicilio,
    nuevo: { calle: req.body.calle, numero: req.body.numero, idBarrio, idLocalidad, idProvincia },
    necesitaActualizacion
  });

  if (necesitaActualizacion) {
    console.log('🔄 [DOMICILIO] Actualizando domicilio...');
    await conn.query(
      `UPDATE domicilios
         SET calle=?, numero=?, idBarrio=?, idLocalidad=?, idProvincia=?
       WHERE id=?`,
      [req.body.calle, req.body.numero, idBarrio, idLocalidad, idProvincia, idDomicilio]
    );
  } else {
    console.log('⏭️  [DOMICILIO] No necesita actualización, saltando...');
  }
}



    // ─── actualización de estudiante ─────────────────────
    console.log('Actualizando estudiante con ID:', idEst);
    console.log('Datos para actualizar estudiante:', {
      nombre: req.body.nombre,
      apellido: req.body.apellido,
      dni: req.body.dni,
      cuil: req.body.cuil,
      email: req.body.email,
      telefono: req.body.telefono,
      fechaNacimiento: req.body.fechaNacimiento,
      tipoDocumento: req.body.tipoDocumento,
      paisEmision: req.body.paisEmision
    });
    
    const resultEstudiante = await conn.query(
      `UPDATE estudiantes
         SET nombre=?, apellido=?, dni=?, cuil=?, email=?, telefono=?, fechaNacimiento=?, tipoDocumento=?, paisEmision=?
       WHERE id=?`,
      [req.body.nombre, req.body.apellido, req.body.dni, req.body.cuil, req.body.email, req.body.telefono, req.body.fechaNacimiento, req.body.tipoDocumento, req.body.paisEmision, idEst]
    );
    if (resultEstudiante.affectedRows === 0) {
      console.error('No se pudo actualizar el estudiante. Verifica los datos enviados.');
      await conn.rollback();
      return res.status(400).json({ success: false, message: 'No se pudo actualizar el estudiante.' });
    }

    // Validar que idAnioPlan exista en la tabla anio_plan
    console.log('Validando planAnioId:', req.body.planAnioId);
    const [[anioPlan]] = await conn.query(
      'SELECT id FROM anio_plan WHERE id = ?',
      [req.body.planAnioId]
    );
    if (!anioPlan) {
      await conn.rollback();
      console.error('planAnioId no válido:', req.body.planAnioId);
      return res.status(400).json({ success: false, message: 'El plan de año seleccionado no es válido.' });
    }

    // Validar que idEstadoInscripcion exista en la tabla estado_inscripciones
    console.log('Validando estadoInscripcionId:', req.body.estadoInscripcionId);
    const [[estadoInscripcion]] = await conn.query(
      'SELECT id FROM estado_inscripciones WHERE id = ?',
      [req.body.estadoInscripcionId]
    );
    if (!estadoInscripcion) {
      await conn.rollback();
      console.error('estadoInscripcionId no válido:', req.body.estadoInscripcionId);
      return res.status(400).json({ success: false, message: 'El estado de inscripción seleccionado no es válido.' });
    }

    // ─── actualización de inscripción ────────────────────
    let updateInscripcionQuery = `UPDATE inscripciones SET idModalidad=?, idAnioPlan=?, idModulos=?, idEstadoInscripcion=?`;
    let updateInscripcionParams = [req.body.modalidadId, req.body.planAnioId, req.body.modulosId, req.body.estadoInscripcionId];
    if (req.body.fechaInscripcion) {
      updateInscripcionQuery += `, fechaInscripcion=?`;
      updateInscripcionParams.push(req.body.fechaInscripcion);
    }
    updateInscripcionQuery += ` WHERE idEstudiante=?`;
    updateInscripcionParams.push(idEst);
    
    console.log('🔄 Actualizando inscripción con query:', updateInscripcionQuery);
    console.log('📋 Parámetros completos:', updateInscripcionParams);
    console.log('🎯 Datos específicos - estadoInscripcionId:', req.body.estadoInscripcionId, 'tipo:', typeof req.body.estadoInscripcionId);
    console.log('👤 idEstudiante:', idEst);
    
    const [resultInscripcion] = await conn.query(updateInscripcionQuery, updateInscripcionParams);
    console.log('✅ Resultado actualización inscripción:', resultInscripcion.affectedRows, 'filas afectadas');
    console.log('🔍 Cambios detectados en la consulta:', resultInscripcion.changedRows);
    
    if (resultInscripcion.affectedRows === 0) {
      console.error('❌ No se pudo actualizar la inscripción. Verifica los datos enviados.');
      await conn.rollback();
      return res.status(400).json({ success: false, message: 'No se pudo actualizar la inscripción.' });
    }
    
    // Verificar el estado actual después de la actualización
    const [[verificacion]] = await conn.query(
      'SELECT idEstadoInscripcion FROM inscripciones WHERE idEstudiante = ?',
      [idEst]
    );
    console.log(`✨ [VERIFICACIÓN POST-UPDATE] Estado actual en BD: ${verificacion?.idEstadoInscripcion}`);

    // ─── idInscripcion necesario para detalle_doc ────────
    const [[ins]] = await conn.query(
      'SELECT id FROM inscripciones WHERE idEstudiante=?',
      [idEst]
    );
    const idInscripcion = ins.id;
    const documentosExistentes = await obtenerDocumentacionPorInscripcion(idInscripcion);
    console.log('Documentación existente:', documentosExistentes);

    // ─── mapear archivos subidos ──────────────────────────
    const archivosMap = {};
    req.files?.forEach(f => {
      archivosMap[f.fieldname] = '/archivosDocumento/' + f.filename;
    });

    // ─── procesar detalleDocumentacion ───────────────────
    let detalle = [];
    try {
      detalle = JSON.parse(req.body.detalleDocumentacion || '[]');
    } catch {
      await conn.rollback();
      return res.status(400).json({ success:false, message:'detalleDocumentacion mal formado.' });
    }

    // Procesar detalleDocumentacion
for (const doc of detalle) {
  const archivoNuevo = archivosMap[doc.nombreArchivo];

  // Verificar si existe ya ese documento para la inscripción
  const [[row]] = await conn.query(
    `SELECT id, archivoDocumentacion FROM detalle_inscripcion
     WHERE idInscripcion=? AND idDocumentaciones=?`,
    [idInscripcion, doc.idDocumentaciones]
  );

  if (row) {
    // UPDATE - preservar archivo existente si no hay uno nuevo
    const urlFinal = archivoNuevo || row.archivoDocumentacion;
    await conn.query(
      `UPDATE detalle_inscripcion
       SET estadoDocumentacion=?, fechaEntrega=?, archivoDocumentacion=?
       WHERE id=?`,
      [doc.estadoDocumentacion, doc.fechaEntrega, urlFinal, row.id]
    );
  } else {
    // INSERT - solo insertar si hay archivo nuevo
    if (archivoNuevo) {
      await conn.query(
        `INSERT INTO detalle_inscripcion
         (idInscripcion, idDocumentaciones, estadoDocumentacion, fechaEntrega, archivoDocumentacion)
         VALUES (?,?,?,?,?)`,
        [idInscripcion, doc.idDocumentaciones, doc.estadoDocumentacion, doc.fechaEntrega, archivoNuevo]
      );
    }
  }
}

// ─── traer estado y fecha de inscripción actual ─────────────
const [[infoInscripcion]] = await conn.query(
  `SELECT i.fechaInscripcion, ei.descripcionEstado AS estado
   FROM inscripciones i
   LEFT JOIN estado_inscripciones ei ON ei.id = i.idEstadoInscripcion
   WHERE i.id = ?`,
  [idInscripcion]
);

// ─── obtener documentación actualizada ──────────────────────
const documentacionActualizada = await obtenerDocumentacionPorInscripcion(idInscripcion);

// ─── respuesta final ────────────────────────────────────────
await conn.commit();
res.json({
  success: true,
  message: 'Los datos del estudiante se han modificado con éxito.',
  documentacion: documentacionActualizada,
  estadoInscripcion: infoInscripcion?.estado || null,
  fechaInscripcion: infoInscripcion?.fechaInscripcion || null
});

   
  } catch (err) {
    await conn.rollback();
    console.error('Error al modificar estudiante:', err);
    res.status(500).json({ success:false, message:'Error interno del servidor.' });
  } finally {
    conn.release();
  }
});

module.exports = router;
