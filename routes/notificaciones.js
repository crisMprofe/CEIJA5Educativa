const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const { 
    enviarEmailEstudiante, 
    enviarEmailsMasivos 
} = require('../services/emailService');

// Ruta del archivo JSON donde están los registros web pendientes
const REGISTROS_WEB_PATH = path.join(__dirname, '..', 'data', 'Registro_Web.json');

// Función para obtener registros pendientes desde el archivo JSON
const obtenerRegistrosPendientes = async () => {
    try {
        // Leer el archivo JSON
        const data = await fs.readFile(REGISTROS_WEB_PATH, 'utf8');
        const todosLosRegistros = JSON.parse(data);
        
        // Filtrar solo los registros pendientes
        const registrosPendientes = todosLosRegistros.filter(registro => {
            return registro.estado === 'PENDIENTE' && 
                   registro.tipo === 'WEB_REGISTRATION';
        });
        
        // Procesar los registros para agregar información adicional
        const registrosProcesados = registrosPendientes.map(registro => {
            const fechaCreacion = new Date(registro.timestamp);
            const fechaVencimiento = new Date(fechaCreacion);
            fechaVencimiento.setDate(fechaVencimiento.getDate() + 7);
            
            // Determinar documentos subidos basado en los archivos
            const documentosSubidos = registro.archivos ? Object.keys(registro.archivos) : [];
            
            // Lista de documentos requeridos (puedes ajustar según necesidad)
            const documentosRequeridos = [
                'foto', 'archivo_dni', 'archivo_cuil', 'archivo_fichaMedica', 
                'archivo_partidaNacimiento', 'archivo_solicitudPase', 
                'archivo_analiticoParcial', 'archivo_certificadoNivelPrimario'
            ];
            
            const documentosFaltantes = documentosRequeridos.filter(doc => 
                !documentosSubidos.includes(doc)
            );
            
            return {
                id: registro.id,
                nombre: registro.datos.nombre,
                apellido: registro.datos.apellido,
                dni: registro.datos.dni,
                email: registro.datos.email,
                telefono: registro.datos.telefono,
                modalidad: registro.datos.modalidad,
                fechaCreacion: fechaCreacion.toISOString(),
                fechaVencimiento: fechaVencimiento.toISOString(),
                documentosSubidos,
                documentosFaltantes,
                tipoRegistro: documentosSubidos.length === 0 ? 'SIN_DOCUMENTACION' : 'DOCUMENTACION_INCOMPLETA',
                planAnio: registro.datos.planAnio
            };
        });
        
        console.log(`📋 Encontrados ${registrosProcesados.length} registros pendientes`);
        return registrosProcesados;
        
    } catch (error) {
        console.error('Error al obtener registros pendientes:', error);
        
        // Si no existe el archivo, retornar array vacío
        if (error.code === 'ENOENT') {
            return [];
        }
        
        throw error;
    }
};

// POST: Enviar email a un estudiante específico
router.post('/enviar-individual', async (req, res) => {
    try {
        const { registroId } = req.body;
        
        if (!registroId) {
            return res.status(400).json({
                success: false,
                message: 'ID del registro requerido'
            });
        }

        // Obtener los registros pendientes
        const registros = await obtenerRegistrosPendientes();
        const registro = registros.find(r => r.id == registroId);
        
        if (!registro) {
            return res.status(404).json({
                success: false,
                message: 'Registro no encontrado o ya procesado'
            });
        }

        if (!registro.email || !registro.email.includes('@')) {
            return res.status(400).json({
                success: false,
                message: 'El estudiante no tiene email válido registrado'
            });
        }

        console.log(`📧 Enviando email individual a: ${registro.email}`);
        
        const resultado = await enviarEmailEstudiante(registro);
        
        if (resultado.success) {
            res.json({
                success: true,
                message: `Email enviado exitosamente a ${registro.nombre} ${registro.apellido}`,
                email: registro.email
            });
        } else {
            res.status(500).json({
                success: false,
                message: resultado.error || 'Error al enviar email'
            });
        }
        
    } catch (error) {
        console.error('Error al enviar email individual:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// POST: Enviar emails masivos a todos los estudiantes pendientes
router.post('/enviar-masivo', async (req, res) => {
    try {
        console.log('📧 Iniciando envío masivo de notificaciones...');
        
        const registros = await obtenerRegistrosPendientes();
        
        if (registros.length === 0) {
            return res.json({
                success: true,
                message: 'No hay registros pendientes para notificar',
                enviados: 0,
                resultados: {
                    enviados: [],
                    fallidos: [],
                    total: 0,
                    exitosos: 0,
                    fallidos_count: 0
                }
            });
        }

        // Filtrar solo los que tienen email válido
        const registrosConEmail = registros.filter(r => r.email && r.email.includes('@'));
        
        if (registrosConEmail.length === 0) {
            return res.json({
                success: false,
                message: 'No hay registros con emails válidos para notificar',
                enviados: 0
            });
        }

        console.log(`📧 Enviando emails masivos a ${registrosConEmail.length} estudiantes de ${registros.length} totales...`);
        
        const resultados = await enviarEmailsMasivos(registrosConEmail);
        
        res.json({
            success: true,
            message: `Envío masivo completado: ${resultados.exitosos} enviados, ${resultados.fallidos_count} fallidos`,
            enviados: resultados.exitosos,
            fallidos: resultados.fallidos_count,
            totalRegistros: registros.length,
            conEmail: registrosConEmail.length,
            resultados
        });

    } catch (error) {
        console.error('Error en envío masivo:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// POST: Enviar emails urgentes (próximos a vencer)
router.post('/enviar-urgentes', async (req, res) => {
    try {
        const { diasUmbral = 3 } = req.body; // Por defecto 3 días o menos
        
        console.log(`⚡ Iniciando envío urgente (${diasUmbral} días o menos)...`);
        
        const registros = await obtenerRegistrosPendientes();
        
        if (registros.length === 0) {
            return res.json({
                success: true,
                message: 'No hay registros pendientes',
                enviados: 0,
                resultados: {
                    enviados: [],
                    fallidos: [],
                    total: 0,
                    exitosos: 0,
                    fallidos_count: 0
                }
            });
        }

        // Filtrar registros urgentes (próximos a vencer)
        const ahora = new Date();
        const registrosUrgentes = registros.filter(registro => {
            if (!registro.email || !registro.email.includes('@')) return false;
            
            const fechaVencimiento = new Date(registro.fechaVencimiento);
            const msRestantes = fechaVencimiento.getTime() - ahora.getTime();
            const diasRestantes = Math.ceil(msRestantes / (1000 * 60 * 60 * 24));
            
            return diasRestantes <= diasUmbral && diasRestantes >= 0;
        });

        if (registrosUrgentes.length === 0) {
            return res.json({
                success: true,
                message: `No hay registros urgentes (que venzan en menos de ${diasUmbral} días)`,
                enviados: 0,
                diasUmbral,
                resultados: {
                    enviados: [],
                    fallidos: [],
                    total: 0,
                    exitosos: 0,
                    fallidos_count: 0
                }
            });
        }

        console.log(`⚡ Enviando emails urgentes a ${registrosUrgentes.length} estudiantes de ${registros.length} totales...`);
        
        const resultados = await enviarEmailsMasivos(registrosUrgentes);
        
        res.json({
            success: true,
            message: `Envío urgente completado: ${resultados.exitosos} enviados, ${resultados.fallidos_count} fallidos`,
            enviados: resultados.exitosos,
            fallidos: resultados.fallidos_count,
            totalUrgentes: registrosUrgentes.length,
            diasUmbral,
            resultados
        });

    } catch (error) {
        console.error('Error en envío urgente:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// GET: Obtener lista de registros pendientes (para debugging)
router.get('/registros-pendientes', async (req, res) => {
    try {
        const registros = await obtenerRegistrosPendientes();
        
        res.json({
            success: true,
            total: registros.length,
            registros: registros.map(r => ({
                id: r.id,
                nombre: r.nombre,
                apellido: r.apellido,
                dni: r.dni,
                email: r.email,
                modalidad: r.modalidad,
                fechaVencimiento: r.fechaVencimiento,
                documentosSubidos: r.documentosSubidos.length,
                documentosFaltantes: r.documentosFaltantes.length,
                tipoRegistro: r.tipoRegistro
            }))
        });
    } catch (error) {
        console.error('Error al obtener registros pendientes:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

module.exports = router;