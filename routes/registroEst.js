const express = require('express');
const router  = express.Router();
const db      = require('../db');
const multer  = require('multer');
const path    = require('path');

const buscarOInsertarProvincia  = require('../utils/buscarOInsertarProvincia');
const buscarOInsertarLocalidad  = require('../utils/buscarOInsertarLocalidad');
const buscarOInsertarBarrio     = require('../utils/buscarOInsertarBarrio');
const obtenerRutaFoto           = require('../utils/obtenerRutaFoto');
const insertarInscripcion       = require('../utils/insertarInscripcion');
const buscarOInsertarDetalleDocumentacion = require('../utils/buscarOInsertarDetalleDocumentacion');

// ────────────────────────────────────────────────────────────
//  Multer: guarda los archivos en /archivosDocumento
//  nombre archivo  ➜  <nombre>_<apellido>_<dni>.<ext>
// ────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  // 1️⃣ Carpeta física donde quedan los PDF/JPG
  destination: (_req, _file, cb) => {
    cb(null, path.join(__dirname, '../archivosDocumento'));
  },
  // 2️⃣ Nombre del archivo:  <nombre>_<apellido>_<campo>.<ext>
  filename: (req, file, cb) => {
  const nombre   = (req.body.nombre   || 'sin_nombre').trim().replace(/\s+/g, '_');
  const apellido = (req.body.apellido || 'sin_apellido').trim().replace(/\s+/g, '_');
  const dni      = (req.body.dni      || 'sin_dni');
  const campo    = file.fieldname;                           // dni, cuil, partidaNacimiento…
  const ext      = path.extname(file.originalname);

  cb(null, `${nombre}_${apellido}_${dni}_${campo}${ext}`);
  // Ej: Juan_Perez_12345678_dni.pdf
  }
});
const upload = multer({ storage });


// ────────────────────────────────────────────────────────────
//  POST /registrar
// ────────────────────────────────────────────────────────────
router.post('/registrar', upload.any(), async (req, res) => {
  try {
    // Verificar los archivos recibidos por multer
    console.log("Archivos recibidos por multer:", req.files);

    // util para campos que a veces llegan como array
    const getFirst = v => Array.isArray(v) ? v[0] : v;

    // ─── 1) Datos personales ───────────────────────────────
    const nombre          = getFirst(req.body.nombre);
    const apellido        = getFirst(req.body.apellido);
    const tipoDocumento   = getFirst(req.body.tipoDocumento);
    const dni             = getFirst(req.body.dni);
    let paisEmision       = getFirst(req.body.paisEmision);
    const cuil            = getFirst(req.body.cuil);
    const fechaNacimiento = getFirst(req.body.fechaNacimiento);

    // validación básica
    if (!nombre || !apellido || !tipoDocumento || !dni || !fechaNacimiento) {
      return res.status(400).json({ message: 'Datos personales obligatorios incompletos.' });
    }

    // Validación específica para DNI argentino
    if (tipoDocumento === 'DNI' && !cuil) {
      return res.status(400).json({ message: 'CUIL es requerido para DNI argentino.' });
    }

    // Validación para documentos extranjeros
    if (tipoDocumento !== 'DNI' && !paisEmision) {
      return res.status(400).json({ message: 'País de emisión es requerido para documentos extranjeros.' });
    }

    // Auto-asignar "Argentina" para documentos DNI si paisEmision está vacío
    if (tipoDocumento === 'DNI' && !paisEmision) {
      paisEmision = 'Argentina';
    }

    // ─── 1.1) DNI duplicado ────────────────────────────────
    const [existente] = await db.query('SELECT 1 FROM estudiantes WHERE dni = ?', [dni]);
    if (existente.length) {
      return res.status(400).json({ message: 'El DNI ya está registrado.' });
    }

    // ─── 2) Datos de domicilio ─────────────────────────────
    const provincia      = getFirst(req.body.provincia);
    const localidad = getFirst(req.body.localidad);
    const barrio    = getFirst(req.body.barrio);
    const calle     = getFirst(req.body.calle);
    const numero    = Number(getFirst(req.body.numero));

    if (!provincia || !localidad || !barrio || !calle || isNaN(numero)) {
      return res.status(400).json({ message: 'Datos de domicilio incompletos.' });
    }

    const idProvincia  = await buscarOInsertarProvincia(db, provincia);
    const idLocalidad  = await buscarOInsertarLocalidad(db, localidad, idProvincia);
    const idBarrio     = await buscarOInsertarBarrio(db, barrio, idLocalidad);

    const [domicilioRes] = await db.query(
      'INSERT INTO domicilios (calle, numero, idBarrio, idLocalidad, idProvincia) VALUES (?,?,?,?,?)',
      [calle, numero, idBarrio, idLocalidad, idProvincia]
    );
    const idDomicilio = domicilioRes.insertId;

    // ─── 3) Archivos subidos ───────────────────────────────
    // justo después de subirlos
        const archivosMap = {};
        if (Array.isArray(req.files)) {
            req.files.forEach(f => {
                archivosMap[f.fieldname] = '/archivosDocumento/' + f.filename;
            });
        }

    const fotoUrl = obtenerRutaFoto(archivosMap);

    // ─── 4) Insertar estudiante ────────────────────────────
    const idUsuarios = req.body.idUsuarios ? Number(req.body.idUsuarios) : null;

    const [estRes] = await db.query(
      `INSERT INTO estudiantes
       (nombre, apellido, tipoDocumento, paisEmision, dni, cuil, email, telefono, fechaNacimiento, foto, idDomicilio, idUsuarios)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [nombre, apellido, tipoDocumento, paisEmision, dni, cuil, req.body.email || null, req.body.telefono || null, fechaNacimiento, fotoUrl, idDomicilio, idUsuarios]
    );
    const idEstudiante = estRes.insertId;

    // ─── 5) Parámetros de inscripción ──────────────────────
    const modalidadId        = Number(getFirst(req.body.modalidadId));
    const planAnioId         = Number(getFirst(req.body.planAnio));
    const modulosId          = Number(getFirst(req.body.idModulo));
    const idEstadoInscripcion= Number(getFirst(req.body.idEstadoInscripcion));

    if ([modalidadId, planAnioId, modulosId, idEstadoInscripcion].some(isNaN)) {
      return res.status(400).json({ message: 'Datos de inscripción incompletos o inválidos.' });
    }

    if (![1, 2, 3].includes(idEstadoInscripcion)) {
        return res.status(400).json({ message: 'Estado de inscripción inválido.' });
    }

    // ─── 6) Insertar inscripción ───────────────────────────
    const idInscripcion = await insertarInscripcion(
      db,
      idEstudiante,
      modalidadId,
      planAnioId,
      modulosId,
      idEstadoInscripcion,
      'CURDATE()' // Inserta solo la fecha
    );

    // ─── 7) Detalle de documentación ──────────────────────
    let detalleDocumentacion = [];
    try {
      detalleDocumentacion = JSON.parse(req.body.detalleDocumentacion || '[]');
    } catch (_e) {
      return res.status(400).json({ message: 'detalleDocumentacion mal formado.' });
    }

    console.log("Datos recibidos en el cuerpo:", req.body);
    console.log("Detalle de documentación recibido:", req.body.detalleDocumentacion);

   if (!Array.isArray(detalleDocumentacion)) {
  return res.status(400).json({ message: 'Detalle de documentación mal formado.' });
}

    for (const det of detalleDocumentacion) {
        const url = archivosMap[det.nombreArchivo] || null; // Busca la URL del archivo en archivosMap

        const idDetalle = await buscarOInsertarDetalleDocumentacion(
            db,
            idInscripcion,
            det.idDocumentaciones,
            det.estadoDocumentacion || 'Pendiente',
            det.fechaEntrega || null,
            url
        );

        console.log(`Detalle insertado o encontrado with ID: ${idDetalle}`);
    }


    // ─── 8) OK ─────────────────────────────────────────────
    res.status(201).json({
      success: true,
      message: 'Estudiante e inscripción creados con éxito.',
      idEstudiante,
      idInscripcion
    });

  } catch (err) {
    console.error('Error en /registrar:', err);
    res.status(500).json({ message: 'Error interno: ' + err.message });
  }
});

module.exports = router;
