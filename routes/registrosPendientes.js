const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const multer = require('multer');

// Configurar multer para manejar archivos de registros pendientes
const storage = multer.diskStorage({
    // Carpeta donde se guardan los archivos de registros pendientes
    destination: (_req, _file, cb) => {
        cb(null, path.join(__dirname, '../archivosPendientes'));
    },
    // Nombre del archivo: <nombre>_<apellido>_<dni>_<campo>.<ext>
    filename: (req, file, cb) => {
        const nombre = (req.body.nombre || 'sin_nombre').trim().replace(/\s+/g, '_');
        const apellido = (req.body.apellido || 'sin_apellido').trim().replace(/\s+/g, '_');
        const dni = (req.body.dni || 'sin_dni');
        const campo = file.fieldname; // archivo_dni, archivo_cuil, foto, etc.
        const ext = path.extname(file.originalname);
        
        const filename = `${nombre}_${apellido}_${dni}_${campo}${ext}`;
        console.log(`📎 [archivos-pendientes] Guardando archivo: ${filename}`);
        cb(null, filename);
    }
});

const upload = multer({ storage });

// Ruta del archivo JSON donde se guardarán los registros pendientes
const REGISTROS_PENDIENTES_PATH = path.join(__dirname, '..', 'data', 'Registros_Pendientes.json');

// Función para asegurar que existe el directorio y el archivo
const ensureFileExists = async () => {
    const dir = path.dirname(REGISTROS_PENDIENTES_PATH);
    
    try {
        await fs.access(dir);
    } catch {
        await fs.mkdir(dir, { recursive: true });
    }
    
    try {
        await fs.access(REGISTROS_PENDIENTES_PATH);
    } catch {
        await fs.writeFile(REGISTROS_PENDIENTES_PATH, JSON.stringify([], null, 2));
    }
};

// GET: Obtener todos los registros pendientes
router.get('/', async (req, res) => {
    try {
        await ensureFileExists();
        const data = await fs.readFile(REGISTROS_PENDIENTES_PATH, 'utf8');
        const registros = JSON.parse(data);
        
        console.log(`📋 Obteniendo ${registros.length} registros pendientes`);
        res.json(registros);
    } catch (error) {
        console.error('Error al obtener registros pendientes:', error);
        res.status(500).json({ 
            error: 'Error al obtener los registros pendientes',
            message: error.message 
        });
    }
});

// GET: Obtener un registro pendiente específico por DNI y modalidadId (opcional)
router.get('/:dni', async (req, res) => {
    try {
        await ensureFileExists();
        const data = await fs.readFile(REGISTROS_PENDIENTES_PATH, 'utf8');
        const registros = JSON.parse(data);

        const { modalidadId } = req.query;
        let registro = registros.find(r => r.dni === req.params.dni);

        // Si se pasa modalidadId, filtrar también por modalidadId
        if (registro && modalidadId) {
            // Puede estar en r.datos o en r.modalidadId
            const regModalidadId = (registro.datos && registro.datos.modalidadId) || registro.modalidadId;
            if (parseInt(regModalidadId) !== parseInt(modalidadId)) {
                registro = undefined;
            }
        }

        if (!registro) {
            return res.status(404).json({ 
                error: 'Registro no encontrado',
                message: `No se encontró un registro con DNI ${req.params.dni}` + (modalidadId ? ` y modalidadId ${modalidadId}` : '')
            });
        }

        console.log(`📋 Obteniendo registro pendiente para DNI: ${req.params.dni}` + (modalidadId ? ` y modalidadId: ${modalidadId}` : ''));
        res.json(registro);
    } catch (error) {
        console.error('Error al obtener registro pendiente:', error);
        res.status(500).json({ 
            error: 'Error al obtener el registro pendiente',
            message: error.message 
        });
    }
});

// POST: Crear un nuevo registro pendiente
router.post('/', upload.any(), async (req, res) => {
    try {
        await ensureFileExists();
        
        console.log('📋 [registros-pendientes] Datos recibidos:', req.body);
        console.log('📎 [registros-pendientes] Archivos recibidos:', req.files);

        // Mapear archivos recibidos
        const archivosMap = {};
        if (req.files) {
            req.files.forEach(file => {
                // Guardar la ruta relativa para acceso web
                archivosMap[file.fieldname] = `/archivosPendientes/${file.filename}`;
                console.log(`📎 [archivos-pendientes] Mapeado: ${file.fieldname} → ${file.filename}`);
            });
        }
        
        const nuevoRegistro = {
            dni: req.body.dni || '',
            timestamp: new Date().toISOString(),
            fechaRegistro: new Date().toLocaleDateString('es-AR'),
            horaRegistro: new Date().toLocaleTimeString('es-AR'),
            tipo: 'REGISTRO_PENDIENTE',
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
                planAnio: req.body.planAnio !== undefined && req.body.planAnio !== null ? req.body.planAnio : '',
                modulos: req.body.modulos !== undefined && req.body.modulos !== null ? req.body.modulos : '',
                idModulo: Array.isArray(req.body.idModulo)
                    ? req.body.idModulo.filter(x => x && x !== ',' && x !== '').map(String)
                    : (typeof req.body.idModulo === 'string' && req.body.idModulo !== '' && req.body.idModulo !== ',' ? [req.body.idModulo] : []),
                
                // Información del administrador
                administrador: req.body.administrador || req.user?.usuario || 'admin',
                motivoPendiente: req.body.motivoPendiente || 'Documentación incompleta'
            },
            archivos: archivosMap, // Agregar información de archivos subidos
            observaciones: req.body.observaciones || `Registro pendiente creado el ${new Date().toLocaleDateString('es-AR')} a las ${new Date().toLocaleTimeString('es-AR')}`
        };

        // Leer registros existentes
        const data = await fs.readFile(REGISTROS_PENDIENTES_PATH, 'utf8');
        const registros = JSON.parse(data);
        
        // Verificar si ya existe un registro con el mismo DNI
        const registroExistente = registros.findIndex(r => r.dni === nuevoRegistro.dni);
        
        if (registroExistente !== -1) {
            // Actualizar registro existente
            registros[registroExistente] = {
                ...registros[registroExistente],
                ...nuevoRegistro,
                fechaActualizacion: new Date().toISOString()
            };
            console.log(`🔄 Registro pendiente actualizado - DNI: ${nuevoRegistro.dni}`);
        } else {
            // Agregar nuevo registro
            registros.push(nuevoRegistro);
            console.log(`✅ Nuevo registro pendiente creado - DNI: ${nuevoRegistro.dni}`);
        }
        
        // Guardar archivo actualizado
        await fs.writeFile(REGISTROS_PENDIENTES_PATH, JSON.stringify(registros, null, 2));
        
        console.log(`📎 Archivos guardados:`, Object.keys(archivosMap).length, 'archivos');
        
        res.status(201).json({
            message: 'Registro pendiente guardado exitosamente',
            registro: nuevoRegistro,
            archivosProcesados: Object.keys(archivosMap).length
        });
        
    } catch (error) {
        console.error('Error al crear registro pendiente:', error);
        res.status(500).json({ 
            error: 'Error al guardar el registro pendiente',
            message: error.message 
        });
    }
});

// PUT: Actualizar estado de un registro pendiente
router.put('/:dni', async (req, res) => {
    try {
        await ensureFileExists();
        const { dni } = req.params;
        const { estado, observaciones } = req.body;
        
        const data = await fs.readFile(REGISTROS_PENDIENTES_PATH, 'utf8');
        const registros = JSON.parse(data);
        
        const indiceRegistro = registros.findIndex(r => r.dni === dni);
        
        if (indiceRegistro === -1) {
            return res.status(404).json({ error: 'Registro no encontrado' });
        }
        
        // Actualizar registro
        registros[indiceRegistro].estado = estado || registros[indiceRegistro].estado;
        registros[indiceRegistro].observaciones = observaciones || registros[indiceRegistro].observaciones;
        registros[indiceRegistro].fechaActualizacion = new Date().toISOString();
        
        await fs.writeFile(REGISTROS_PENDIENTES_PATH, JSON.stringify(registros, null, 2));
        
        console.log(`🔄 Registro pendiente actualizado - DNI: ${dni}, Estado: ${estado}`);
        
        res.json({
            message: 'Registro actualizado exitosamente',
            registro: registros[indiceRegistro]
        });
        
    } catch (error) {
        console.error('Error al actualizar registro pendiente:', error);
        res.status(500).json({ 
            error: 'Error al actualizar el registro pendiente',
            message: error.message 
        });
    }
});

// DELETE: Eliminar un registro pendiente
router.delete('/:dni', async (req, res) => {
    try {
        await ensureFileExists();
        const { dni } = req.params;
        
        const data = await fs.readFile(REGISTROS_PENDIENTES_PATH, 'utf8');
        let registros = JSON.parse(data);
        
        const registroAEliminar = registros.find(r => r.dni === dni);
        
        if (!registroAEliminar) {
            return res.status(404).json({ error: 'Registro no encontrado' });
        }
        
        // Filtrar registros (eliminar el seleccionado)
        registros = registros.filter(r => r.dni !== dni);
        
        await fs.writeFile(REGISTROS_PENDIENTES_PATH, JSON.stringify(registros, null, 2));
        
        console.log(`🗑️ Registro pendiente eliminado - DNI: ${dni}`);
        
        res.json({
            message: 'Registro eliminado exitosamente',
            registroEliminado: registroAEliminar
        });
        
    } catch (error) {
        console.error('Error al eliminar registro pendiente:', error);
        res.status(500).json({ 
            error: 'Error al eliminar el registro pendiente',
            message: error.message 
        });
    }
});

// GET: Obtener estadísticas de registros pendientes
router.get('/stats', async (req, res) => {
    try {
        await ensureFileExists();
        const data = await fs.readFile(REGISTROS_PENDIENTES_PATH, 'utf8');
        const registros = JSON.parse(data);
        
        const stats = {
            total: registros.length,
            pendientes: registros.filter(r => r.estado === 'PENDIENTE').length,
            procesados: registros.filter(r => r.estado === 'PROCESADO').length,
            vencidos: registros.filter(r => {
                const fechaRegistro = new Date(r.timestamp);
                const ahora = new Date();
                const diasTranscurridos = Math.floor((ahora - fechaRegistro) / (1000 * 60 * 60 * 24));
                return diasTranscurridos > 7;
            }).length,
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

// PUT: Actualizar un registro pendiente específico
router.put('/:dni', upload.any(), async (req, res) => {
    try {
        const { dni } = req.params;
        const datosActualizados = req.body;
        
        console.log(`🔄 Actualizando registro pendiente para DNI: ${dni}`);
        
        await ensureFileExists();
        
        // Leer registros existentes
        const data = await fs.readFile(REGISTROS_PENDIENTES_PATH, 'utf8');
        let registros = JSON.parse(data);
        
        // Buscar el registro a actualizar
        const indiceRegistro = registros.findIndex(r => r.dni === dni);
        
        if (indiceRegistro === -1) {
            return res.status(404).json({
                success: false,
                message: `Registro pendiente con DNI ${dni} no encontrado`
            });
        }
        
        // Procesar archivos si hay
        const archivosActualizados = {};
        if (req.files && req.files.length > 0) {
            console.log(`📎 Procesando ${req.files.length} archivos actualizados`);
            req.files.forEach(file => {
                archivosActualizados[file.fieldname] = `/archivosPendientes/${file.filename}`;
            });
        }
        
        // Actualizar el registro
        const registroExistente = registros[indiceRegistro];
        registros[indiceRegistro] = {
            ...registroExistente,
            datos: {
                ...registroExistente.datos,
                ...datosActualizados.datos || datosActualizados
            },
            archivos: {
                ...registroExistente.archivos,
                ...archivosActualizados
            },
            timestamp: new Date().toISOString(),
            fechaActualizacion: new Date().toLocaleDateString('es-AR'),
            horaActualizacion: new Date().toLocaleTimeString('es-AR'),
            observaciones: `Registro actualizado el ${new Date().toLocaleDateString('es-AR')} a las ${new Date().toLocaleTimeString('es-AR')}`
        };
        
        // Guardar cambios
        await fs.writeFile(REGISTROS_PENDIENTES_PATH, JSON.stringify(registros, null, 2));
        
        console.log(`✅ Registro pendiente ${dni} actualizado exitosamente`);
        
        res.json({
            success: true,
            message: 'Registro pendiente actualizado exitosamente',
            registro: registros[indiceRegistro]
        });
        
    } catch (error) {
        console.error('Error al actualizar registro pendiente:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});




// POST: Procesar/aprobar un registro pendiente
router.post('/:dni/procesar', async (req, res) => {
    try {
        await ensureFileExists();
        const { dni } = req.params;
        const data = await fs.readFile(REGISTROS_PENDIENTES_PATH, 'utf8');
        let registros = JSON.parse(data);
        const indiceRegistro = registros.findIndex(r => r.dni === dni);
        if (indiceRegistro === -1) {
            return res.status(404).json({ error: 'Registro pendiente no encontrado' });
        }
        const registro = registros[indiceRegistro];

        // Validar documentación completa (puedes ajustar la lógica según tus requerimientos)
        const documentosRequeridos = [
            'archivo_dni', 'archivo_cuil', 'archivo_fichaMedica', 'archivo_partidaNacimiento',
            'foto', 'archivo_analiticoParcial', 'archivo_certificadoNivelPrimario', 'archivo_solicitudPase'
        ];
        const archivos = registro.archivos || {};
        const faltantes = documentosRequeridos.filter(doc => !archivos[doc]);
        if (faltantes.length > 0) {
            return res.status(400).json({
                error: 'Documentación incompleta',
                faltantes
            });
        }

        // 1. Migrar archivos a /archivosDocumento
        const archivosMigrados = {};
        const archivosPendientesDir = path.join(__dirname, '../archivosPendientes');
        const archivosDocumentoDir = path.join(__dirname, '../archivosDocumento');
        await fs.mkdir(archivosDocumentoDir, { recursive: true });
        for (const [campo, ruta] of Object.entries(archivos)) {
            if (ruta && ruta.startsWith('/archivosPendientes/')) {
                const nombreArchivo = path.basename(ruta);
                const origen = path.join(archivosPendientesDir, nombreArchivo);
                const destino = path.join(archivosDocumentoDir, nombreArchivo);
                try {
                    await fs.copyFile(origen, destino);
                    archivosMigrados[campo] = `/archivosDocumento/${nombreArchivo}`;
                } catch (err) {
                    return res.status(500).json({ error: `Error migrando archivo ${nombreArchivo}: ${err.message}` });
                }
            } else if (ruta && ruta.startsWith('/archivosDocumento/')) {
                archivosMigrados[campo] = ruta;
            } else {
                archivosMigrados[campo] = '';
            }
        }

        // 2. Guardar en la base de datos (tabla estudiantes)
        let insertId = null;
        try {
            const pool = require('../db');
            const datos = registro.datos || {};
            const [result] = await pool.query(
                `INSERT INTO estudiantes (nombre, apellido, dni, cuil, email, telefono, fechaNacimiento, tipoDocumento, paisEmision, calle, numero, barrio, localidad, provincia, modalidad, planAnio, modulos, usuario, archivo_dni, archivo_cuil, archivo_fichaMedica, archivo_partidaNacimiento, foto, archivo_analiticoParcial, archivo_certificadoNivelPrimario, archivo_solicitudPase)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    datos.nombre,
                    datos.apellido,
                    registro.dni,
                    datos.cuil,
                    datos.email,
                    datos.telefono,
                    datos.fechaNacimiento,
                    datos.tipoDocumento,
                    datos.paisEmision,
                    datos.calle,
                    datos.numero,
                    datos.barrio,
                    datos.localidad,
                    datos.provincia,
                    datos.modalidad,
                    datos.planAnio,
                    datos.modulos,
                    datos.administrador || 'admin',
                    archivosMigrados['archivo_dni'] || '',
                    archivosMigrados['archivo_cuil'] || '',
                    archivosMigrados['archivo_fichaMedica'] || '',
                    archivosMigrados['archivo_partidaNacimiento'] || '',
                    archivosMigrados['foto'] || '',
                    archivosMigrados['archivo_analiticoParcial'] || '',
                    archivosMigrados['archivo_certificadoNivelPrimario'] || '',
                    archivosMigrados['archivo_solicitudPase'] || ''
                ]
            );
            insertId = result.insertId;
        } catch (err) {
            return res.status(500).json({ error: 'Error al guardar en la base de datos', message: err.message });
        }

        // 3. Eliminar del JSON de pendientes
        registros.splice(indiceRegistro, 1);
        await fs.writeFile(REGISTROS_PENDIENTES_PATH, JSON.stringify(registros, null, 2));

        return res.status(200).json({
            message: 'Registro pendiente procesado y guardado en la base de datos',
            insertId,
            archivos: archivosMigrados
        });
    } catch (error) {
        console.error('Error al procesar/aprobar pendiente:', error);
        res.status(500).json({ error: 'Error al procesar/aprobar pendiente', message: error.message });
    }
});

module.exports = router;