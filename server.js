require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./db');

// Importa las rutas
const modalidadesRoutes = require('./routes/modalidades');
const planCursoRoutes = require('./routes/planCurso');
const modulosRoutes = require('./routes/modulos');
const userRoutes = require('./routes/users');
const areasRoutes = require('./routes/areas');
const materiasRoutes = require('./routes/materias');
const estadosInscripcionRoutes = require('./routes/estadosInscripcion');
const registroEstRoutes = require('./routes/registroEst');
const faltantesRoutes = require('./routes/faltantes');
const consultarEstdInscriptosRoutes = require('./routes/consultarEstdInscriptos');
const datosInsRoutes = require('./routes/datosIns');
const datosDomicilioRoutes = require('./routes/datosDomicilio');
const modificarEstRoutes = require('./routes/modificarEst');
const eliminarEstRoutes = require('./routes/eliminarEst'); // Importa la ruta
const documentacionRoutes = require('./routes/buscarDocumentacion');
const documentosFaltantesRoutes = require('./routes/documentosFaltantes');
const estadoDocumentalRoutes = require('./routes/estadoDocumental');
const modificarEstSeccionRoutes = require('./routes/modificarEstSeccion'); // Importa la nueva ruta
const modificarDocumentacionRoutes = require('./routes/modificarSeccionDocumentacion'); // Importa la ruta de modificación de documentación
const ubicacionesRoutes = require('./routes/ubicaciones'); // Nueva ruta para ubicaciones
const actualizarEstadoInscripcionRoutes = require('./routes/actualizarEstadoInscripcion'); // Nueva ruta para actualizar solo estado
const path = require('path');

app.use(cors());
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// en app.js o server.js, antes de las rutas

// También servir desde archivosDocumento (sin 's') para compatibilidad
app.use(
  '/archivosDocumento',                              // URL pública
  express.static(path.join(__dirname, 'archivosDocumento')) // carpeta real
);

// Servir archivos de registros web
app.use(
  '/archivosDocWeb',                              // URL pública
  express.static(path.join(__dirname, 'archivosDocWeb')) // carpeta real
);
// Servir archivos de registros pendientes
app.use(
  '/archivosPendientes',
  express.static(path.join(__dirname, 'archivosPendientes'))
);

// Rutas
app.use('/api/users', userRoutes);
app.use('/api/modalidades', modalidadesRoutes);
app.use('/api/planes', planCursoRoutes);
app.use('/api/modulos', modulosRoutes);
app.use('/api/areas', areasRoutes);
app.use('/api/materias', materiasRoutes);
app.use('/api/estados-inscripcion', estadosInscripcionRoutes);
app.use('/api/estudiantes', registroEstRoutes);
app.use('/api/faltantes', faltantesRoutes);
app.use('/api/consultar-estudiantes', consultarEstdInscriptosRoutes);
app.use('/api/consultar-estudiantes-dni', datosInsRoutes);
app.use('/api/datos-domicilio', datosDomicilioRoutes);
app.use('/api/modificar-estudiante', modificarEstRoutes);
app.use('/api/modificar-estudiante-seccion', modificarEstSeccionRoutes); // Registra la nueva ruta
app.use('/api/modificar-documentacion-estudiante', modificarDocumentacionRoutes); // Registra la ruta de modificación de documentación
app.use('/api/eliminar-estudiante', eliminarEstRoutes); // Registra la ruta bajo el prefijo /api
app.use('/api/documentacion', documentacionRoutes);
app.use('/api/documentos-faltantes', documentosFaltantesRoutes);
app.use('/api/estado-documental', estadoDocumentalRoutes);
app.use('/api/registros-web', require('./routes/registrosWeb')); // Nueva ruta para registros web
app.use('/api/registros-pendientes', require('./routes/registrosPendientes')); // Nueva ruta para registros pendientes
app.use('/api/completar-documentacion', require('./routes/completarDocumentacion')); // Ruta separada para completar documentación
app.use('/api/ubicaciones', ubicacionesRoutes); // Nueva ruta para ubicaciones
app.use('/api/actualizar-estado-inscripcion', actualizarEstadoInscripcionRoutes); // Nueva ruta para actualizar solo el estado
app.use('/api/notificaciones', require('./routes/notificaciones')); // Ruta para notificaciones por email
// Middleware para manejo de errores globales
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Error interno del servidor.' });
});

// Ruta de prueba
app.get('/', (_req, res) => {
    res.send('Servidor funcionando correctamente');
});

// Inicia el servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});