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

  const nombreArchivo = `${nombre}_${apellido}_${dni}_${campo}${ext}`;
  console.log(`📁 [MULTER] Generando archivo: ${nombreArchivo} | Campo: ${campo} | Original: ${file.originalname}`);
  
  cb(null, nombreArchivo);
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

    const provinciaResult = await buscarOInsertarProvincia(db, provincia);
    const idProvincia     = provinciaResult.id; // Extraer el ID del objeto retornado
    
    const localidadResult = await buscarOInsertarLocalidad(db, localidad, idProvincia);
    const idLocalidad     = localidadResult.id; // Extraer el ID del objeto retornado
    
    const barrioResult    = await buscarOInsertarBarrio(db, barrio, idLocalidad);
    const idBarrio        = barrioResult.id; // Extraer el ID del objeto retornado

    console.log('🏘️ [DEBUG] IDs para domicilio:', { idProvincia, idLocalidad, idBarrio });

    const [domicilioRes] = await db.query(
      'INSERT INTO domicilios (calle, numero, idBarrio, idLocalidad, idProvincia) VALUES (?,?,?,?,?)',
      [calle, numero, idBarrio, idLocalidad, idProvincia]
    );
    const idDomicilio = domicilioRes.insertId;

    // ─── 3) Archivos subidos ───────────────────────────────
    // justo después de subirlos
        const archivosMap = {};
        if (Array.isArray(req.files)) {
            console.log(`📄 [ARCHIVOS] Procesando ${req.files.length} archivos:`)
            req.files.forEach(f => {
                const url = '/archivosDocumento/' + f.filename;
                archivosMap[f.fieldname] = url;
                console.log(`  - ${f.fieldname} -> ${url}`);
            });
        }
        console.log('📋 [ARCHIVOS MAP]:', archivosMap);

    // ─── 3.1) Manejo especial de archivos web existentes ──────
    let archivosWebExistentes = [];
    let totalArchivos = Object.keys(archivosMap).length;
    let tieneDocumentoEspecial = false;
    
    if (req.body.archivosWebExistentes) {
        try {
            archivosWebExistentes = JSON.parse(req.body.archivosWebExistentes);
            console.log('🌐 [ARCHIVOS WEB] Archivos existentes del registro web:', archivosWebExistentes);
            
            // Contar archivos totales (web + nuevos)
            totalArchivos += archivosWebExistentes.length;
            
            // Verificar si tiene documento especial (web o nuevo)
            tieneDocumentoEspecial = archivosWebExistentes.some(archivo => 
                archivo.tipo === 'archivo_certificadoNivelPrimario' || 
                archivo.tipo === 'archivo_analiticoParcial'
            ) || archivosMap.archivo_certificadoNivelPrimario || archivosMap.archivo_analiticoParcial;
            
            console.log(`🌐 [EVALUACIÓN] Total archivos: ${totalArchivos}`);
            console.log(`🌐 [EVALUACIÓN] Tiene documento especial: ${tieneDocumentoEspecial}`);
            
            // Copiar archivos web a la carpeta de documentos finales si cumplen criterios
            if (req.body.forzarBaseDatos === 'true' && totalArchivos >= 4 && tieneDocumentoEspecial) {
                const fs = require('fs').promises;
                const pathWeb = path.join(__dirname, '../archivosDocWeb');
                const pathFinal = path.join(__dirname, '../archivosDocumento');
                
                console.log('🌐 [COPIA ARCHIVOS] Copiando archivos web a carpeta final...');
                
                for (const archivo of archivosWebExistentes) {
                    const archivoWeb = archivo.archivo || archivo.ruta.split('/').pop();
                    const rutaOrigen = path.join(pathWeb, archivoWeb);
                    const nombreNuevo = `${nombre}_${apellido}_${dni}_${archivo.tipo}${path.extname(archivoWeb)}`;
                    const rutaDestino = path.join(pathFinal, nombreNuevo);
                    
                    try {
                        await fs.copyFile(rutaOrigen, rutaDestino);
                        archivosMap[archivo.tipo] = '/archivosDocumento/' + nombreNuevo;
                        console.log(`  ✅ Copiado: ${archivoWeb} -> ${nombreNuevo}`);
                    } catch (copyError) {
                        console.error(`  ❌ Error copiando ${archivoWeb}:`, copyError.message);
                    }
                }
                
                console.log('🌐 [ARCHIVOS FINALES] Map actualizado:', archivosMap);
            }
            
        } catch (parseError) {
            console.error('Error al parsear archivos web existentes:', parseError);
        }
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
        console.log(`📋 [DETALLE] Procesando: ${det.nombreArchivo} -> URL: ${url} -> ID: ${det.idDocumentaciones}`);

        const idDetalle = await buscarOInsertarDetalleDocumentacion(
            db,
            idInscripcion,
            det.idDocumentaciones,
            det.estadoDocumentacion || 'Pendiente',
            det.fechaEntrega || null,
            url
        );

        console.log(`✅ [DETALLE] Insertado con ID: ${idDetalle}`);
    }


    // ─── 8) Eliminar registro pendiente si existe ─────────
    try {
      const fs = require('fs').promises;
      const registrosPendientesPath = path.join(__dirname, '../data/Registros_Pendientes.json');
      
      // Verificar si el archivo existe
      try {
        await fs.access(registrosPendientesPath);
        
        // Leer el archivo
        const data = await fs.readFile(registrosPendientesPath, 'utf8');
        const registrosPendientes = JSON.parse(data);
        
        // Buscar y eliminar el registro con el mismo DNI
        const registrosFiltrados = registrosPendientes.filter(registro => registro.dni !== dni);
        
        // Si se eliminó algún registro, actualizar el archivo
        if (registrosFiltrados.length < registrosPendientes.length) {
          await fs.writeFile(registrosPendientesPath, JSON.stringify(registrosFiltrados, null, 2));
          console.log(`🗑️ Registro pendiente eliminado automáticamente para DNI: ${dni}`);
        }
        
      } catch (fileError) {
        // Si el archivo no existe, no hay problema
        if (fileError.code !== 'ENOENT') {
          console.error('Error al procesar registros pendientes:', fileError);
        }
      }
    } catch (cleanupError) {
      console.error('Error en limpieza de registros pendientes:', cleanupError);
      // No interrumpir el flujo principal por este error
    }

    // ─── 9) OK ─────────────────────────────────────────────
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

// ────────────────────────────────────────────────────────────
//  POST /registrar-web-pendiente
//  Maneja registros web que no cumplen criterios para BD
// ────────────────────────────────────────────────────────────
router.post('/registrar-web-pendiente', upload.any(), async (req, res) => {
  try {
    console.log('⏰ [REGISTRO WEB PENDIENTE] Procesando registro que va a pendientes...');
    
    // Procesar datos básicos sin insertar en BD
    const getFirst = v => Array.isArray(v) ? v[0] : v;
    
    const nombre = getFirst(req.body.nombre);
    const apellido = getFirst(req.body.apellido);
    const dni = getFirst(req.body.dni);
    const email = getFirst(req.body.email);
    const modalidad = getFirst(req.body.modalidad);
    
    // Procesar archivos nuevos subidos
    const archivosNuevos = {};
    if (Array.isArray(req.files)) {
      console.log(`📄 [ARCHIVOS NUEVOS] Procesando ${req.files.length} archivos:`)
      req.files.forEach(f => {
        const url = '/archivosDocumento/' + f.filename;
        archivosNuevos[f.fieldname] = url;
        console.log(`  - ${f.fieldname} -> ${url}`);
      });
    }
    
    // Obtener archivos web existentes
    let archivosWebExistentes = [];
    if (req.body.archivosWebExistentes) {
      try {
        archivosWebExistentes = JSON.parse(req.body.archivosWebExistentes);
      } catch (e) {
        console.error('Error al parsear archivos web:', e);
      }
    }
    
    const totalArchivos = Object.keys(archivosNuevos).length + archivosWebExistentes.length;
    
    console.log(`⏰ [PENDIENTE] ${nombre} ${apellido} - DNI: ${dni}`);
    console.log(`⏰ [PENDIENTE] Total archivos: ${totalArchivos}`);
    console.log(`⏰ [PENDIENTE] Motivo: Documentación incompleta o sin documento especial`);
    
    // Actualizar estado del registro web si se proporciona el ID
    if (req.body.idRegistroWeb) {
      const fs = require('fs').promises;
      const registroWebPath = path.join(__dirname, '../data/Registro_Web.json');
      
      try {
        const data = await fs.readFile(registroWebPath, 'utf8');
        const registros = JSON.parse(data);
        
        const indice = registros.findIndex(r => r.id === req.body.idRegistroWeb);
        if (indice !== -1) {
          registros[indice].estado = 'PENDIENTE';
          registros[indice].observaciones = `Registro enviado a pendientes el ${new Date().toLocaleDateString('es-AR')} - Documentación incompleta`;
          registros[indice].fechaActualizacion = new Date().toISOString();
          
          await fs.writeFile(registroWebPath, JSON.stringify(registros, null, 2));
          console.log(`⏰ [ACTUALIZACIÓN] Estado del registro web ${req.body.idRegistroWeb} actualizado a PENDIENTE`);
        }
      } catch (error) {
        console.error('Error al actualizar registro web:', error);
      }
    }
    
    res.status(200).json({
      success: true,
      message: 'Registro procesado y enviado a registros pendientes por documentación incompleta.',
      motivo: 'Documentación insuficiente: se requieren al menos 4 documentos incluyendo certificado primario o analítico parcial.',
      totalArchivos: totalArchivos,
      archivosNuevos: Object.keys(archivosNuevos).length,
      archivosWeb: archivosWebExistentes.length
    });
    
  } catch (error) {
    console.error('Error en /registrar-web-pendiente:', error);
    res.status(500).json({ message: 'Error interno: ' + error.message });
  }
});

// ────────────────────────────────────────────────────────────
//  🔍 Verificar si un estudiante ya está registrado
// ────────────────────────────────────────────────────────────
router.get('/verificar/:dni', async (req, res) => {
  try {
    const { dni } = req.params;
    
    if (!dni) {
      return res.status(400).json({ 
        registrado: false, 
        message: 'DNI requerido' 
      });
    }

    const query = `
      SELECT COUNT(*) as count 
      FROM estudiantes 
      WHERE documento = ?
    `;
    
    const [rows] = await db.promise().query(query, [dni]);
    const estaRegistrado = rows[0].count > 0;

    res.json({ 
      registrado: estaRegistrado,
      dni: dni,
      message: estaRegistrado ? 'Estudiante encontrado en la base de datos' : 'Estudiante no registrado'
    });

  } catch (error) {
    console.error('Error verificando estudiante:', error);
    res.status(500).json({ 
      registrado: false, 
      message: 'Error interno: ' + error.message 
    });
  }
});

module.exports = router;
