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
// ⚠️ SOLO guarda en Registro_Web.json y archivosDocWeb. NO mueve a pendientes ni a la base de datos.
// El registro web queda en estado 'PENDIENTE' hasta que un admin lo procese desde el dashboard.
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

// POST: Procesar un registro web (solo ADMIN)
// Si la documentación está completa: guarda en la base de datos y migra archivos a archivosDocumento.
// Si está incompleta: mueve a Registros_Pendientes.json y marca el registro web como MOVIDO_A_PENDIENTES.
router.post('/:id/procesar', upload.any(), async (req, res) => {
    try {
        await ensureFileExists();
        const { id } = req.params;
        // Los datos del formulario pueden venir en req.body
        // Los archivos nuevos en req.files
        // Cargar registro web original
        const data = await fs.readFile(REGISTROS_WEB_PATH, 'utf8');
        let registros = JSON.parse(data);
        const indiceRegistro = registros.findIndex(r => r.id === id);
        if (indiceRegistro === -1) {
            return res.status(404).json({ error: 'Registro web no encontrado' });
        }
        const registro = registros[indiceRegistro];
        // Mapear archivos nuevos
        const archivosNuevos = {};
        if (req.files) {
            req.files.forEach(file => {
                archivosNuevos[file.fieldname] = `/archivosDocumento/${file.filename}`;
            });
        }
        // Combinar archivos existentes y nuevos
        const archivosCombinados = { ...registro.archivos, ...archivosNuevos };
        // Combinar datos del formulario
        const datosCompletos = { ...registro.datos, ...req.body };
        // Validar documentación (usa tu lógica de validación)
    const { obtenerDocumentosRequeridos } = require(path.join(__dirname, '../utils/obtenerDocumentosRequeridos.js'));
        const modalidad = datosCompletos.modalidad || '';
        const planAnio = datosCompletos.planAnio || '';
        const modulos = datosCompletos.modulos || '';
        const requerimientos = obtenerDocumentosRequeridos(modalidad, planAnio, modulos);
        const documentosRequeridos = requerimientos.documentos;
        const documentosAlternativos = requerimientos.alternativos;
        // Validar documentos subidos
        let documentosSubidos = [];
        let documentosFaltantes = [];
        let validacionAlternativaOK = true;
        for (const doc of documentosRequeridos) {
            if (documentosAlternativos && (doc === documentosAlternativos.preferido || doc === documentosAlternativos.alternativa)) {
                const tienePreferido = !!archivosCombinados[documentosAlternativos.preferido];
                const tieneAlternativa = !!archivosCombinados[documentosAlternativos.alternativa];
                if (tienePreferido || tieneAlternativa) {
                    documentosSubidos.push(tienePreferido ? documentosAlternativos.preferido : documentosAlternativos.alternativa);
                } else {
                    documentosFaltantes.push(doc);
                    validacionAlternativaOK = false;
                }
                continue;
            }
            if (archivosCombinados[doc]) {
                documentosSubidos.push(doc);
            } else {
                documentosFaltantes.push(doc);
            }
        }
        const cantidadSubidos = documentosSubidos.length;
        const totalDocumentos = documentosRequeridos.length;
        const esCompleto = (cantidadSubidos === totalDocumentos) && validacionAlternativaOK;
        // Si la documentación está incompleta, mover a pendientes
        const REGISTROS_PENDIENTES_PATH = path.join(__dirname, '..', 'data', 'Registros_Pendientes.json');
        let registrosPendientes = [];
        try {
            const dataPendientes = await fs.readFile(REGISTROS_PENDIENTES_PATH, 'utf8');
            registrosPendientes = JSON.parse(dataPendientes);
        } catch { registrosPendientes = []; }
        // Validar si ya existe en pendientes por DNI
        const yaEnPendientes = registrosPendientes.some(rp => rp.dni === datosCompletos.dni);
        if (yaEnPendientes) {
            // Solo cambiar estado y devolver mensaje, no eliminar ni crear duplicado
            registros[indiceRegistro] = {
                ...registro,
                estado: 'MOVIDO_A_PENDIENTES',
                fechaMovimiento: new Date().toISOString(),
                motivoPendiente: `Ya existe en pendientes`,
                observaciones: `Registro ya estaba en pendientes, contabilizado como procesado a pendientes el ${new Date().toLocaleDateString('es-AR')}`
            };
            await fs.writeFile(REGISTROS_WEB_PATH, JSON.stringify(registros, null, 2));
            return res.status(200).json({
                message: 'Registro procesado a pendientes',
                registroWebActualizado: registros[indiceRegistro]
            });
        }
        // Copiar todos los archivos de archivosDocWeb a archivosPendientes antes de crear el registro pendiente
        const archivosPendientesDir = path.join(__dirname, '../archivosPendientes');
        await fs.mkdir(archivosPendientesDir, { recursive: true });
        for (const [campo, ruta] of Object.entries(archivosCombinados)) {
            if (ruta && ruta.startsWith('/archivosDocWeb/')) {
                const nombreArchivo = path.basename(ruta);
                const origen = path.join(__dirname, '../archivosDocWeb', nombreArchivo);
                const destino = path.join(archivosPendientesDir, nombreArchivo);
                try {
                    await fs.copyFile(origen, destino);
                    // Actualiza la ruta para el registro pendiente
                    archivosCombinados[campo] = `/archivosPendientes/${nombreArchivo}`;
                } catch (err) {
                    console.error(`Error copiando archivo ${nombreArchivo}:`, err);
                }
            }
        }
        // Crear registro pendiente
        const registroPendiente = {
            dni: datosCompletos.dni,
            timestamp: new Date().toISOString(),
            fechaRegistro: new Date().toLocaleDateString('es-AR'),
            horaRegistro: new Date().toLocaleTimeString('es-AR'),
            tipo: 'REGISTRO_WEB_PENDIENTE',
            estado: 'PENDIENTE',
            origenWeb: true,
            idRegistroWebOriginal: registro.id,
            datos: {
                ...datosCompletos,
                motivoPendiente: `Faltan: ${documentosFaltantes.join(', ')}`,
                administrador: 'admin_web'
            },
            archivos: archivosCombinados,
            observaciones: `Movido desde registro web a pendientes el ${new Date().toLocaleDateString('es-AR')} - Faltan: ${documentosFaltantes.join(', ')}`
        };
        registrosPendientes.push(registroPendiente);
        await fs.writeFile(REGISTROS_PENDIENTES_PATH, JSON.stringify(registrosPendientes, null, 2));
        // Actualizar estado del registro web original
        registros[indiceRegistro] = {
            ...registro,
            estado: 'MOVIDO_A_PENDIENTES',
            fechaMovimiento: new Date().toISOString(),
            motivoPendiente: `Faltan: ${documentosFaltantes.join(', ')}`,
            observaciones: `Movido a registros pendientes el ${new Date().toLocaleDateString('es-AR')} - Faltan: ${documentosFaltantes.join(', ')}`
        };
        await fs.writeFile(REGISTROS_WEB_PATH, JSON.stringify(registros, null, 2));
        return res.status(200).json({
            message: 'Registro web movido a pendientes por documentación incompleta',
            registroWebActualizado: registros[indiceRegistro],
            registroPendienteCreado: registroPendiente
        });
        // Si la documentación está completa, guardar en la base de datos
        const pool = require('../db');
        try {
            // Insertar estudiante en la tabla 'estudiantes'
            const [result] = await pool.query(
                `INSERT INTO estudiantes (nombre, apellido, dni, cuil, email, telefono, fechaNacimiento, tipoDocumento, paisEmision, calle, numero, barrio, localidad, provincia, modalidad, planAnio, modulos, usuario, archivo_dni, archivo_cuil, archivo_fichaMedica, archivo_partidaNacimiento, foto, archivo_analiticoParcial, archivo_certificadoNivelPrimario, archivo_solicitudPase)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    datosCompletos.nombre,
                    datosCompletos.apellido,
                    datosCompletos.dni,
                    datosCompletos.cuil,
                    datosCompletos.email,
                    datosCompletos.telefono,
                    datosCompletos.fechaNacimiento,
                    datosCompletos.tipoDocumento,
                    datosCompletos.paisEmision,
                    datosCompletos.calle,
                    datosCompletos.numero,
                    datosCompletos.barrio,
                    datosCompletos.localidad,
                    datosCompletos.provincia,
                    datosCompletos.modalidad,
                    datosCompletos.planAnio,
                    datosCompletos.modulos,
                    datosCompletos.usuario,
                    archivosCombinados['archivo_dni'] || '',
                    archivosCombinados['archivo_cuil'] || '',
                    archivosCombinados['archivo_fichaMedica'] || '',
                    archivosCombinados['archivo_partidaNacimiento'] || '',
                    archivosCombinados['foto'] || '',
                    archivosCombinados['archivo_analiticoParcial'] || '',
                    archivosCombinados['archivo_certificadoNivelPrimario'] || '',
                    archivosCombinados['archivo_solicitudPase'] || ''
                ]
            );
            registros[indiceRegistro] = {
                ...registro,
                estado: 'PROCESADO',
                fechaProcesado: new Date().toISOString(),
                archivos: archivosCombinados,
                datos: datosCompletos,
                observaciones: `Procesado y guardado en BD el ${new Date().toLocaleDateString('es-AR')}`
            };
            await fs.writeFile(REGISTROS_WEB_PATH, JSON.stringify(registros, null, 2));
            return res.status(200).json({
                message: 'Registro web procesado y guardado en la base de datos',
                registroProcesado: registros[indiceRegistro],
                insertId: result.insertId
            });
        } catch (err) {
            console.error('Error al guardar en la base de datos:', err);
            return res.status(500).json({
                error: 'Error al guardar en la base de datos',
                message: err.message
            });
        }
        // Por ahora, solo marcamos como PROCESADO y respondemos
        registros[indiceRegistro] = {
            ...registro,
            estado: 'PROCESADO',
            fechaProcesado: new Date().toISOString(),
            archivos: archivosCombinados,
            datos: datosCompletos,
            observaciones: `Procesado correctamente el ${new Date().toLocaleDateString('es-AR')}`
        };
        await fs.writeFile(REGISTROS_WEB_PATH, JSON.stringify(registros, null, 2));
        return res.status(200).json({
            message: 'Registro web procesado exitosamente',
            registroProcesado: registros[indiceRegistro]
        });
    } catch (error) {
        console.error('Error al procesar registro web:', error);
        res.status(500).json({ 
            error: 'Error al procesar el registro web',
            message: error.message 
        });
    }
});

// POST: Mover un registro web a pendientes (solo ADMIN, acción manual)
// Permite mover un registro web a Registros_Pendientes.json y marcarlo como MOVIDO_A_PENDIENTES.
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
            procesados: registros.filter(r => r.estado === 'PROCESADO' || r.estado === 'MOVIDO_A_PENDIENTES').length,
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