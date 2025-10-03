const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const multer = require('multer');

// Configurar multer para manejar archivos de registros web
const storage = multer.diskStorage({
    // Carpeta donde se guardan los archivos de registros web
    destination: (_req, _file, cb) => {
        cb(null, path.join(__dirname, '../archivosDocWeb'));
    },
    // Nombre del archivo: <nombre>_<apellido>_<dni>_<campo>.<ext>
    filename: (req, file, cb) => {
        const nombre = (req.body.nombre || 'sin_nombre').trim().replace(/\s+/g, '_');
        const apellido = (req.body.apellido || 'sin_apellido').trim().replace(/\s+/g, '_');
        const dni = (req.body.dni || 'sin_dni');
        const campo = file.fieldname; // archivo_dni, archivo_cuil, foto, etc.
        const ext = path.extname(file.originalname);
        
        const filename = `${nombre}_${apellido}_${dni}_${campo}${ext}`;
        console.log(`📎 [archivos-web] Guardando archivo: ${filename}`);
        cb(null, filename);
    }
});

const upload = multer({ storage });

// Ruta del archivo JSON donde se guardarán los registros web
const REGISTROS_WEB_PATH = path.join(__dirname, '..', 'data', 'Registro_Web.json');

// Función para asegurar que existe el directorio y el archivo
const ensureFileExists = async () => {
    const dir = path.dirname(REGISTROS_WEB_PATH);
    
    try {
        await fs.access(dir);
    } catch {
        await fs.mkdir(dir, { recursive: true });
    }
    
    try {
        await fs.access(REGISTROS_WEB_PATH);
    } catch {
        await fs.writeFile(REGISTROS_WEB_PATH, JSON.stringify([], null, 2));
    }
};

// GET: Obtener todos los registros web
router.get('/', async (req, res) => {
    try {
        await ensureFileExists();
        const data = await fs.readFile(REGISTROS_WEB_PATH, 'utf8');
        const registros = JSON.parse(data);
        
        console.log(`📋 Obteniendo ${registros.length} registros web`);
        res.json(registros);
    } catch (error) {
        console.error('Error al obtener registros web:', error);
        res.status(500).json({ 
            error: 'Error al obtener los registros web',
            message: error.message 
        });
    }
});

// POST: Crear un nuevo registro web
router.post('/', upload.any(), async (req, res) => {
    try {
        await ensureFileExists();
        
        console.log('📋 [registros-web] Datos recibidos:', req.body);
        console.log('📎 [registros-web] Archivos recibidos:', req.files);

        // Mapear archivos recibidos
        const archivosMap = {};
        if (req.files) {
            req.files.forEach(file => {
                // Guardar la ruta relativa para acceso web
                archivosMap[file.fieldname] = `/archivosDocWeb/${file.filename}`;
                console.log(`📎 [archivos-web] Mapeado: ${file.fieldname} → ${file.filename}`);
            });
        }
        
        const nuevoRegistro = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            fechaRegistro: new Date().toLocaleDateString('es-AR'),
            horaRegistro: new Date().toLocaleTimeString('es-AR'),
            tipo: 'WEB_REGISTRATION',
            estado: 'PENDIENTE',
            datos: {
                // Datos personales
                nombre: req.body.nombre || '',
                apellido: req.body.apellido || '',
                dni: req.body.dni || '',
                cuil: req.body.cuil || '',
                email: req.body.email || '',
                telefono: req.body.telefono || '',
                fechaNacimiento: req.body.fechaNacimiento || '',
                tipoDocumento: req.body.tipoDocumento || 'DNI',
                paisEmision: req.body.paisEmision || 'Argentina',
                
                // Domicilio
                calle: req.body.calle || '',
                numero: req.body.numero || '',
                barrio: req.body.barrio || '',
                localidad: req.body.localidad || '',
                provincia: req.body.provincia || '',
                
                // Información académica
                modalidad: req.body.modalidad || '',
                modalidadId: req.body.modalidadId || null,
                planAnio: req.body.planAnio || '',
                modulos: req.body.modulos || '',
                idModulo: req.body.idModulo || null,
                
                // Información del usuario web
                usuario: req.body.usuario || req.user?.usuario || 'usuario_web',
                ipAddress: req.ip || req.connection.remoteAddress,
                userAgent: req.get('User-Agent')
            },
            archivos: archivosMap, // Agregar información de archivos subidos
            observaciones: `Registro web realizado el ${new Date().toLocaleDateString('es-AR')} a las ${new Date().toLocaleTimeString('es-AR')}`
        };

        // Leer registros existentes
        const data = await fs.readFile(REGISTROS_WEB_PATH, 'utf8');
        const registros = JSON.parse(data);
        
        // Agregar nuevo registro
        registros.push(nuevoRegistro);
        
        // Guardar archivo actualizado
        await fs.writeFile(REGISTROS_WEB_PATH, JSON.stringify(registros, null, 2));
        
        console.log(`✅ Nuevo registro web creado - DNI: ${nuevoRegistro.datos.dni}, Usuario: ${nuevoRegistro.datos.usuario}`);
        console.log(`📎 Archivos guardados:`, Object.keys(archivosMap).length, 'archivos');
        
        res.status(201).json({
            message: 'Registro web guardado exitosamente',
            registro: nuevoRegistro,
            archivosProcesados: Object.keys(archivosMap).length
        });
        
    } catch (error) {
        console.error('Error al crear registro web:', error);
        res.status(500).json({ 
            error: 'Error al guardar el registro web',
            message: error.message 
        });
    }
});

// PUT: Actualizar estado de un registro web
router.put('/:id', async (req, res) => {
    try {
        await ensureFileExists();
        const { id } = req.params;
        const { estado, observaciones } = req.body;
        
        const data = await fs.readFile(REGISTROS_WEB_PATH, 'utf8');
        const registros = JSON.parse(data);
        
        const indiceRegistro = registros.findIndex(r => r.id === id);
        
        if (indiceRegistro === -1) {
            return res.status(404).json({ error: 'Registro no encontrado' });
        }
        
        // Actualizar registro
        registros[indiceRegistro].estado = estado || registros[indiceRegistro].estado;
        registros[indiceRegistro].observaciones = observaciones || registros[indiceRegistro].observaciones;
        registros[indiceRegistro].fechaActualizacion = new Date().toISOString();
        
        await fs.writeFile(REGISTROS_WEB_PATH, JSON.stringify(registros, null, 2));
        
        console.log(`🔄 Registro web actualizado - ID: ${id}, Estado: ${estado}`);
        
        res.json({
            message: 'Registro actualizado exitosamente',
            registro: registros[indiceRegistro]
        });
        
    } catch (error) {
        console.error('Error al actualizar registro web:', error);
        res.status(500).json({ 
            error: 'Error al actualizar el registro web',
            message: error.message 
        });
    }
});

// DELETE: Eliminar un registro web
router.delete('/:id', async (req, res) => {
    try {
        await ensureFileExists();
        const { id } = req.params;
        
        const data = await fs.readFile(REGISTROS_WEB_PATH, 'utf8');
        let registros = JSON.parse(data);
        
        const registroAEliminar = registros.find(r => r.id === id);
        
        if (!registroAEliminar) {
            return res.status(404).json({ error: 'Registro no encontrado' });
        }
        
        // Filtrar registros (eliminar el seleccionado)
        registros = registros.filter(r => r.id !== id);
        
        await fs.writeFile(REGISTROS_WEB_PATH, JSON.stringify(registros, null, 2));
        
        console.log(`🗑️ Registro web eliminado - DNI: ${registroAEliminar.datos.dni}`);
        
        res.json({
            message: 'Registro eliminado exitosamente',
            registroEliminado: registroAEliminar
        });
        
    } catch (error) {
        console.error('Error al eliminar registro web:', error);
        res.status(500).json({ 
            error: 'Error al eliminar el registro web',
            message: error.message 
        });
    }
});

// POST: Procesar un registro web (enviar a BD y marcar como PROCESADO)
router.post('/:id/procesar', async (req, res) => {
    try {
        await ensureFileExists();
        const { id } = req.params;
        const { datosFormulario, documentos } = req.body;
        
        console.log(`🔄 Procesando registro web ID: ${id} en base de datos`);
        
        // Leer registros actuales
        const data = await fs.readFile(REGISTROS_WEB_PATH, 'utf8');
        const registros = JSON.parse(data);
        
        const indiceRegistro = registros.findIndex(r => r.id === id);
        if (indiceRegistro === -1) {
            return res.status(404).json({ error: 'Registro web no encontrado' });
        }
        
        const registro = registros[indiceRegistro];
        console.log(`📋 Datos originales del registro:`, registro.datos);
        console.log(`📝 Datos actualizados del formulario:`, datosFormulario);
        
        // Importar funciones de la BD (desde registroEst.js)
        const db = require('../db');
        const buscarOInsertarProvincia = require('../utils/buscarOInsertarProvincia');
        const buscarOInsertarLocalidad = require('../utils/buscarOInsertarLocalidad');
        const buscarOInsertarBarrio = require('../utils/buscarOInsertarBarrio');
        const obtenerRutaFoto = require('../utils/obtenerRutaFoto');
        const insertarInscripcion = require('../utils/insertarInscripcion');
        const buscarOInsertarDetalleDocumentacion = require('../utils/buscarOInsertarDetalleDocumentacion');
        
        // Función auxiliar para obtener primer valor de array o string
        const getFirst = (val) => Array.isArray(val) ? val[0] : val;
        
        // 1) Verificar si el estudiante ya existe por DNI
        const dniEstudiante = datosFormulario.dni || registro.datos.dni;
        const [existeEstudiante] = await db.query('SELECT dni FROM estudiantes WHERE dni = ?', [dniEstudiante]);
        
        if (existeEstudiante.length > 0) {
            return res.status(400).json({ 
                error: 'El estudiante ya está registrado en la base de datos',
                message: `Ya existe un estudiante con DNI ${dniEstudiante}` 
            });
        }
        
        // 2) Insertar domicilio
        const provincia = await buscarOInsertarProvincia(db, datosFormulario.provincia || registro.datos.provincia);
        const localidad = await buscarOInsertarLocalidad(db, datosFormulario.localidad || registro.datos.localidad, provincia.id || provincia);
        const barrio = await buscarOInsertarBarrio(db, datosFormulario.barrio || registro.datos.barrio, localidad.id || localidad);
        
        // Extraer IDs correctamente (manejar tanto números como objetos)
        const provinciaId = provincia.id || provincia;
        const localidadId = localidad.id || localidad;
        const barrioId = barrio.id || barrio;
        
        const [domRes] = await db.query(
            `INSERT INTO domicilios (calle, numero, idBarrio, idLocalidad, idProvincia) VALUES (?,?,?,?,?)`,
            [
                datosFormulario.calle || registro.datos.calle,
                datosFormulario.numero || registro.datos.numero,
                barrioId,
                localidadId,
                provinciaId
            ]
        );
        const idDomicilio = domRes.insertId;
        
        // 3) Obtener ruta de la foto
        let fotoUrl = null;
        if (registro.archivos?.foto) {
            // Convertir ruta de archivosDocWeb a archivosDocumento para consistencia
            const nombreFoto = path.basename(registro.archivos.foto);
            fotoUrl = `/archivosDocumento/${nombreFoto}`;
            
            // Copiar archivo de archivosDocWeb a archivosDocumento si no existe
            const rutaOrigen = path.join(__dirname, '..', registro.archivos.foto.replace(/^\//, ''));
            const rutaDestino = path.join(__dirname, '../archivosDocumento', nombreFoto);
            
            try {
                await fs.access(rutaDestino);
                console.log(`📷 Foto ya existe en archivosDocumento: ${nombreFoto}`);
            } catch {
                try {
                    await fs.copyFile(rutaOrigen, rutaDestino);
                    console.log(`📷 Foto copiada a archivosDocumento: ${nombreFoto}`);
                } catch (copyError) {
                    console.error(`❌ Error al copiar foto: ${copyError.message}`);
                    fotoUrl = registro.archivos.foto; // Usar ruta original si falla la copia
                }
            }
        }
        
        // 4) Insertar estudiante
        const fechaNacimiento = datosFormulario.fechaNacimiento || registro.datos.fechaNacimiento;
        const [estRes] = await db.query(
            `INSERT INTO estudiantes
             (nombre, apellido, tipoDocumento, paisEmision, dni, cuil, email, telefono, fechaNacimiento, foto, idDomicilio, idUsuarios)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
            [
                datosFormulario.nombre || registro.datos.nombre,
                datosFormulario.apellido || registro.datos.apellido,
                datosFormulario.tipoDocumento || registro.datos.tipoDocumento || 'DNI',
                datosFormulario.paisEmision || registro.datos.paisEmision || 'Argentina',
                dniEstudiante,
                datosFormulario.cuil || registro.datos.cuil,
                datosFormulario.email || registro.datos.email,
                datosFormulario.telefono || registro.datos.telefono,
                fechaNacimiento,
                fotoUrl,
                idDomicilio,
                null // idUsuarios - null para registros web
            ]
        );
        const idEstudiante = estRes.insertId;
        
        // 5) Insertar inscripción
        const modalidadId = Number(getFirst(datosFormulario.modalidadId || registro.datos.modalidadId));
        const planAnioId = Number(getFirst(datosFormulario.planAnio || registro.datos.planAnio));
        const modulosId = Number(getFirst(datosFormulario.idModulo || registro.datos.idModulo));
        const idEstadoInscripcion = Number(getFirst(datosFormulario.idEstadoInscripcion)) || 1;
        
        const idInscripcion = await insertarInscripcion(
            db,
            idEstudiante,
            modalidadId,
            planAnioId,
            modulosId,
            idEstadoInscripcion,
            'CURDATE()'
        );
        
        // 6) Insertar detalle de documentación
        let detalleDocumentacion = [];
        if (documentos?.detalle && Array.isArray(documentos.detalle)) {
            detalleDocumentacion = documentos.detalle;
        }
        
        if (detalleDocumentacion.length > 0) {
            await buscarOInsertarDetalleDocumentacion(db, idInscripcion, detalleDocumentacion);
        }
        
        // 7) Actualizar estado del registro web
        registros[indiceRegistro] = {
            ...registro,
            estado: 'PROCESADO',
            datosActualizados: datosFormulario,
            documentosFinales: documentos,
            fechaProcesamiento: new Date().toISOString(),
            idEstudianteBD: idEstudiante,
            idInscripcionBD: idInscripcion,
            observaciones: `Procesado y guardado en base de datos el ${new Date().toLocaleDateString('es-AR')} a las ${new Date().toLocaleTimeString('es-AR')} - ID Estudiante: ${idEstudiante}`
        };
        
        // Guardar cambios en el JSON
        await fs.writeFile(REGISTROS_WEB_PATH, JSON.stringify(registros, null, 2));
        
        console.log(`✅ Registro web ${id} procesado y guardado en BD - ID Estudiante: ${idEstudiante}, ID Inscripción: ${idInscripcion}`);
        
        res.json({
            message: 'Registro web procesado y guardado en base de datos exitosamente',
            registro: registros[indiceRegistro],
            idEstudiante: idEstudiante,
            idInscripcion: idInscripcion
        });
        
    } catch (error) {
        console.error('Error al procesar registro web:', error);
        res.status(500).json({ 
            error: 'Error al procesar el registro web',
            message: error.message 
        });
    }
});

// POST: Mover un registro web a pendientes
router.post('/:id/mover-pendiente', async (req, res) => {
    try {
        await ensureFileExists();
        const { id } = req.params;
        const { motivoPendiente } = req.body;
        
        console.log(`📋 Moviendo registro web ${id} a pendientes`);
        
        // Leer registros web actuales
        const dataWeb = await fs.readFile(REGISTROS_WEB_PATH, 'utf8');
        const registrosWeb = JSON.parse(dataWeb);
        
        const indiceRegistro = registrosWeb.findIndex(r => r.id === id);
        if (indiceRegistro === -1) {
            return res.status(404).json({ error: 'Registro web no encontrado' });
        }
        
        const registroWeb = registrosWeb[indiceRegistro];
        
        // Crear registro pendiente
        const registroPendiente = {
            dni: registroWeb.datos.dni,
            timestamp: new Date().toISOString(),
            fechaRegistro: new Date().toLocaleDateString('es-AR'),
            horaRegistro: new Date().toLocaleTimeString('es-AR'),
            tipo: 'REGISTRO_WEB_PENDIENTE',
            estado: 'PENDIENTE',
            origenWeb: true,
            idRegistroWebOriginal: registroWeb.id,
            datos: {
                ...registroWeb.datos,
                motivoPendiente: motivoPendiente,
                administrador: 'admin_web'
            },
            archivos: registroWeb.archivos || {},
            observaciones: `Movido desde registro web a pendientes el ${new Date().toLocaleDateString('es-AR')} - ${motivoPendiente}`
        };
        
        // Leer y actualizar registros pendientes
        const REGISTROS_PENDIENTES_PATH = path.join(__dirname, '..', 'data', 'Registros_Pendientes.json');
        let registrosPendientes = [];
        
        try {
            const dataPendientes = await fs.readFile(REGISTROS_PENDIENTES_PATH, 'utf8');
            registrosPendientes = JSON.parse(dataPendientes);
        } catch {
            // Si no existe el archivo, crear array vacío
            registrosPendientes = [];
        }
        
        registrosPendientes.push(registroPendiente);
        await fs.writeFile(REGISTROS_PENDIENTES_PATH, JSON.stringify(registrosPendientes, null, 2));
        
        // Actualizar estado del registro web original
        registrosWeb[indiceRegistro] = {
            ...registroWeb,
            estado: 'MOVIDO_A_PENDIENTES',
            fechaMovimiento: new Date().toISOString(),
            motivoPendiente: motivoPendiente,
            observaciones: `Movido a registros pendientes el ${new Date().toLocaleDateString('es-AR')} - ${motivoPendiente}`
        };
        
        await fs.writeFile(REGISTROS_WEB_PATH, JSON.stringify(registrosWeb, null, 2));
        
        console.log(`✅ Registro web ${id} movido a pendientes exitosamente`);
        
        res.json({
            message: 'Registro web movido a pendientes exitosamente',
            registroWebActualizado: registrosWeb[indiceRegistro],
            registroPendienteCreado: registroPendiente
        });
        
    } catch (error) {
        console.error('Error al mover registro web a pendientes:', error);
        res.status(500).json({ 
            error: 'Error al mover el registro web a pendientes',
            message: error.message 
        });
    }
});

// GET: Obtener estadísticas de registros web
router.get('/stats', async (req, res) => {
    try {
        await ensureFileExists();
        const data = await fs.readFile(REGISTROS_WEB_PATH, 'utf8');
        const registros = JSON.parse(data);
        
        const stats = {
            total: registros.length,
            pendientes: registros.filter(r => r.estado === 'PENDIENTE').length,
            procesados: registros.filter(r => r.estado === 'PROCESADO').length,
            anulados: registros.filter(r => r.estado === 'ANULADO').length,
            movidosAPendientes: registros.filter(r => r.estado === 'MOVIDO_A_PENDIENTES').length,
            ultimoRegistro: registros.length > 0 ? registros[registros.length - 1].timestamp : null
        };
        
        res.json(stats);
    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        res.status(500).json({ 
            error: 'Error al obtener estadísticas',
            message: error.message 
        });
    }
});

module.exports = router;