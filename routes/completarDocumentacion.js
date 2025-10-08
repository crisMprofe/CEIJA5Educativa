const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const multer = require('multer');
const db = require('../db');

// Configurar multer para archivos de completación
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, path.join(__dirname, '../archivosDocumento'));
    },
    filename: (req, file, cb) => {
        const nombre = (req.body.nombre || 'sin_nombre').trim().replace(/\s+/g, '_');
        const apellido = (req.body.apellido || 'sin_apellido').trim().replace(/\s+/g, '_');
        const dni = (req.body.dni || req.params.dni || 'sin_dni');
        const campo = file.fieldname;
        const ext = path.extname(file.originalname);
        
        const filename = `${nombre}_${apellido}_${dni}_${campo}${ext}`;
        cb(null, filename);
    }
});

const upload = multer({ storage });

const REGISTROS_PENDIENTES_PATH = path.join(__dirname, '..', 'data', 'Registros_Pendientes.json');

// Funciones auxiliares para domicilio
const buscarOInsertarProvincia = async (db, nombreProvincia) => {
    const [rows] = await db.query('SELECT * FROM provincias WHERE nombre = ?', [nombreProvincia]);
    if (rows.length > 0) return rows[0];
    const [result] = await db.query('INSERT INTO provincias (nombre) VALUES (?)', [nombreProvincia]);
    return { id: result.insertId, nombre: nombreProvincia };
};

const buscarOInsertarLocalidad = async (db, nombreLocalidad, idProvincia) => {
    const [rows] = await db.query('SELECT * FROM localidades WHERE nombre = ? AND idProvincia = ?', [nombreLocalidad, idProvincia]);
    if (rows.length > 0) return rows[0];
    const [result] = await db.query('INSERT INTO localidades (nombre, idProvincia) VALUES (?, ?)', [nombreLocalidad, idProvincia]);
    return { id: result.insertId, nombre: nombreLocalidad, idProvincia };
};

const buscarOInsertarBarrio = async (db, nombreBarrio, idLocalidad) => {
    const [rows] = await db.query('SELECT * FROM barrios WHERE nombre = ? AND idLocalidad = ?', [nombreBarrio, idLocalidad]);
    if (rows.length > 0) return rows[0];
    const [result] = await db.query('INSERT INTO barrios (nombre, idLocalidad) VALUES (?, ?)', [nombreBarrio, idLocalidad]);
    return { id: result.insertId, nombre: nombreBarrio, idLocalidad };
};

// POST: Completar documentación de registro pendiente y pasar a BD
router.post('/:dni', upload.any(), async (req, res) => {
    try {
        const { dni } = req.params;
        console.log(`✅ [COMPLETAR] Iniciando completación de documentación para DNI: ${dni}`);
        
        // Leer registros pendientes
        const data = await fs.readFile(REGISTROS_PENDIENTES_PATH, 'utf8');
        let registros = JSON.parse(data);
        
        // Buscar el registro pendiente
        const indiceRegistro = registros.findIndex(r => r.dni === dni);
        
        if (indiceRegistro === -1) {
            return res.status(404).json({
                success: false,
                message: `Registro pendiente con DNI ${dni} no encontrado`
            });
        }
        
        const registro = registros[indiceRegistro];
        
        // Verificar si ya existe en BD
        const [existente] = await db.query('SELECT 1 FROM estudiantes WHERE dni = ?', [dni]);
        if (existente.length) {
            return res.status(400).json({ 
                success: false,
                message: 'El DNI ya está registrado en la base de datos.' 
            });
        }
        
        // Procesar archivos nuevos
        const archivosNuevos = {};
        if (req.files && req.files.length > 0) {
            req.files.forEach(file => {
                archivosNuevos[file.fieldname] = `/archivosPendientes/${file.filename}`;
            });
        }

        // Combinar archivos existentes con nuevos
        const todosLosArchivos = {
            ...registro.archivos,
            ...archivosNuevos
        };

        // Validación completa usando la lógica de validación del backend
        const { obtenerDocumentosRequeridos } = require(path.join(__dirname, '../utils/obtenerDocumentosRequeridos.js'));
        const modalidad = registro.datos?.modalidad || registro.modalidad || '';
        const planAnio = registro.datos?.planAnio || registro.planAnio || '';
        const modulos = registro.datos?.modulos || registro.modulos || '';
        const requerimientos = obtenerDocumentosRequeridos(modalidad, planAnio, modulos);
        const documentosRequeridos = requerimientos.documentos;
        const documentosAlternativos = requerimientos.alternativos;

        // Validar documentos subidos
        let documentosSubidos = [];
        let documentosFaltantes = [];
        let validacionAlternativaOK = true;
        for (const doc of documentosRequeridos) {
            if (documentosAlternativos && (doc === documentosAlternativos.preferido || doc === documentosAlternativos.alternativa)) {
                const tienePreferido = !!todosLosArchivos[documentosAlternativos.preferido];
                const tieneAlternativa = !!todosLosArchivos[documentosAlternativos.alternativa];
                if (tienePreferido || tieneAlternativa) {
                    documentosSubidos.push(tienePreferido ? documentosAlternativos.preferido : documentosAlternativos.alternativa);
                } else {
                    documentosFaltantes.push(doc);
                    validacionAlternativaOK = false;
                }
                continue;
            }
            if (todosLosArchivos[doc]) {
                documentosSubidos.push(doc);
            } else {
                documentosFaltantes.push(doc);
            }
        }
        const cantidadSubidos = documentosSubidos.length;
        const totalDocumentos = documentosRequeridos.length;
        const esCompleto = (cantidadSubidos === totalDocumentos) && validacionAlternativaOK;

        if (!esCompleto) {
            // Si falta documentación, guardar los archivos nuevos en archivosPendientes
            const fsExtra = require('fs-extra');
            const carpetaPendientes = path.join(__dirname, '../archivosPendientes');
            await fsExtra.ensureDir(carpetaPendientes);
            const archivosPendientes = { ...registro.archivos };
            if (req.files && req.files.length > 0) {
                for (const file of req.files) {
                    const nombreArchivo = file.filename;
                    const origen = path.join(__dirname, '../archivosPendientes', nombreArchivo);
                    const destino = path.join(carpetaPendientes, nombreArchivo);
                    try {
                        await fsExtra.copy(origen, destino);
                        archivosPendientes[file.fieldname] = `/archivosPendientes/${nombreArchivo}`;
                    } catch (err) {
                        console.warn(`⚠️ Error copiando archivo a pendientes: ${nombreArchivo}`, err.message);
                    }
                }
            }
            // Actualizar el registro pendiente con los nuevos archivos y estado
            registros[indiceRegistro].archivos = archivosPendientes;
            registros[indiceRegistro].estado = 'PENDIENTE';
            await fs.writeFile(REGISTROS_PENDIENTES_PATH, JSON.stringify(registros, null, 2));
            // Actualizar contador y estado en la respuesta
            return res.status(200).json({
                success: true,
                migradoAPendientes: true,
                migradoABaseDatos: false,
                message: 'Registrado en Pendientes de Inscripcion',
                documentosFaltantes,
                archivosPendientes,
                estado: 'PENDIENTE',
                contadorPendientes: registros.length
            });
        }
        
        // Extraer datos del registro
        const datos = registro.datos || registro;
        
        // 1. Crear domicilio
        const provincia = datos.provincia || 'Córdoba';
        const localidad = datos.localidad || datos.ciudad || 'La Calera';
        const barrio = datos.barrio || 'Centro';
        const calle = datos.calle || datos.direccion || 'Sin especificar';
        const numero = parseInt(datos.numero || datos.numeroCalle || '0') || 0;
        
        const provinciaResult = await buscarOInsertarProvincia(db, provincia);
        const localidadResult = await buscarOInsertarLocalidad(db, localidad, provinciaResult.id);
        const barrioResult = await buscarOInsertarBarrio(db, barrio, localidadResult.id);
        
        const [domicilioRes] = await db.query(
            'INSERT INTO domicilios (calle, numero, idBarrio, idLocalidad, idProvincia) VALUES (?,?,?,?,?)',
            [calle, numero, barrioResult.id, localidadResult.id, provinciaResult.id]
        );
        const idDomicilio = domicilioRes.insertId;
        
        // 2. Crear estudiante
        // Si la foto está en archivosPendientes, mover a archivosDocumento
        let fotoUrl = todosLosArchivos.foto || todosLosArchivos.archivo_foto || null;
        if (fotoUrl && fotoUrl.startsWith('/archivosPendientes/')) {
            const nombreArchivo = fotoUrl.split('/').pop();
            const origen = path.join(__dirname, '../archivosPendientes', nombreArchivo);
            const destino = path.join(__dirname, '../archivosDocumento', nombreArchivo);
            const fsExtra = require('fs-extra');
            try {
                await fsExtra.copy(origen, destino);
                fotoUrl = `/archivosDocumento/${nombreArchivo}`;
            } catch (err) {
                console.warn(`⚠️ Error moviendo foto a archivosDocumento: ${nombreArchivo}`, err.message);
            }
        }
        const fechaNacimiento = datos.fechaNacimiento || null;
        
        const [estRes] = await db.query(
            `INSERT INTO estudiantes
             (nombre, apellido, tipoDocumento, paisEmision, dni, cuil, email, telefono, fechaNacimiento, foto, idDomicilio, idUsuarios)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
            [
                datos.nombre,
                datos.apellido, 
                datos.tipoDocumento || 'DNI',
                datos.paisEmision || 'Argentina',
                dni,
                datos.cuil || null,
                datos.email || null,
                datos.telefono || null,
                fechaNacimiento,
                fotoUrl,
                idDomicilio,
                null
            ]
        );
        const idEstudiante = estRes.insertId;
        
        // 3. Crear inscripcion (APROBADO)
        const modalidadId = parseInt(datos.modalidadId) || 1;
        const planAnioId = parseInt(datos.planAnio) || 1;
        const modulosId = parseInt(datos.idModulo) || 1;
        const idEstadoInscripcion = 2; // APROBADO

        // Validar existencia en tablas referenciadas
        const [[modalidadExiste]] = await db.query('SELECT id FROM modalidades WHERE id = ?', [modalidadId]);
        if (!modalidadExiste) {
            return res.status(400).json({
                success: false,
                message: `La modalidad seleccionada (${modalidadId}) no existe en la base de datos.`
            });
        }
        const [[planExiste]] = await db.query('SELECT id FROM anio_plan WHERE id = ?', [planAnioId]);
        if (!planExiste) {
            return res.status(400).json({
                success: false,
                message: `El año/plan seleccionado (${planAnioId}) no existe en la base de datos.`
            });
        }
        const [[moduloExiste]] = await db.query('SELECT id FROM modulos WHERE id = ?', [modulosId]);
        if (!moduloExiste) {
            return res.status(400).json({
                success: false,
                message: `El módulo seleccionado (${modulosId}) no existe en la base de datos.`
            });
        }

        const [inscRes] = await db.query(
            'INSERT INTO inscripciones (idEstudiante, idModalidad, idAnioPlan, idModulos, idEstadoInscripcion, fechaInscripcion) VALUES (?, ?, ?, ?, ?, CURDATE())',
            [idEstudiante, modalidadId, planAnioId, modulosId, idEstadoInscripcion]
        );
        const idInscripcion = inscRes.insertId;
        
        // 4. Guardar archivos en BD
        const fsExtra = require('fs-extra');
        for (const [campo, rutaArchivo] of Object.entries(todosLosArchivos)) {
            if (rutaArchivo && campo.startsWith('archivo_') || campo === 'foto') {
                try {
                    // Copiar archivo a archivosDocumento si no está allí
                    const nombreArchivo = rutaArchivo.split('/').pop();
                    const origen = rutaArchivo.startsWith('/archivosDocWeb/')
                        ? path.join(__dirname, '../archivosDocWeb', nombreArchivo)
                        : rutaArchivo.startsWith('/archivosPendientes/')
                            ? path.join(__dirname, '../archivosPendientes', nombreArchivo)
                            : null;
                    const destino = path.join(__dirname, '../archivosDocumento', nombreArchivo);
                    if (origen && origen !== destino) {
                        try {
                            await fsExtra.copy(origen, destino);
                            console.log(`📁 Copiado ${nombreArchivo} a archivosDocumento`);
                        } catch (copyError) {
                            console.warn(`⚠️ Error copiando archivo ${nombreArchivo}:`, copyError.message);
                        }
                    }
                    // Guardar ruta en archivos_estudiantes
                    await db.query(
                        'INSERT INTO archivos_estudiantes (idEstudiante, tipoArchivo, rutaArchivo) VALUES (?, ?, ?)',
                        [idEstudiante, campo, `/archivosDocumento/${nombreArchivo}`]
                    );

                    // Mapeo explícito igual al frontend
                    const DocumentacionNameToId = {
                      archivo_dni: 1,
                      archivo_cuil: 2,
                      archivo_fichaMedica: 3,
                      archivo_partidaNacimiento: 4,
                      archivo_solicitudPase: 5,
                      archivo_analiticoParcial: 6,
                      archivo_certificadoNivelPrimario: 7,
                      foto: 8,
                    };
                    const idDocumentaciones = DocumentacionNameToId[campo];
                    if (idDocumentaciones) {
                        await db.query(
                            'INSERT INTO detalle_inscripcion (estadoDocumentacion, fechaEntrega, idDocumentaciones, idInscripcion, archivoDocumentacion) VALUES (?, CURDATE(), ?, ?, ?)',
                            ['Entregado', idDocumentaciones, idInscripcion, `/archivosDocumento/${nombreArchivo}`]
                        );
                    }
                } catch (archivoError) {
                    console.warn(`⚠️ Error guardando archivo ${campo}:`, archivoError.message);
                }
            }
        }
        
        // 5. ELIMINAR del archivo registros pendientes
        registros.splice(indiceRegistro, 1);
        await fs.writeFile(REGISTROS_PENDIENTES_PATH, JSON.stringify(registros, null, 2));
        
        console.log(`✅ [COMPLETAR] Estudiante ${datos.nombre} ${datos.apellido} (DNI: ${dni}) registrado y ELIMINADO de pendientes`);
        
        res.json({
            success: true,
            migradoABaseDatos: true,
            migradoAPendientes: false,
            message: 'Registrado correctamente en el sistema',
            estado: 'APROBADO_Y_PROCESADO',
            estudiante: {
                id: idEstudiante,
                nombre: datos.nombre,
                apellido: datos.apellido,
                dni: dni,
                inscripcionId: idInscripcion
            }
        });
        
    } catch (error) {
        console.error('Error completando documentación:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor: ' + error.message
        });
    }
});

module.exports = router;