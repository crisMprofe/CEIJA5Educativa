const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const db = require('../db');
const { 
    enviarEmailEstudiante, 
    enviarEmailsMasivos 
} = require('../services/emailService');

// Función para obtener registros pendientes desde la base de datos
const obtenerRegistrosPendientes = async () => {
    try {
        const query = `
            SELECT 
                rw.id,
                rw.nombre,
                rw.apellido,
                rw.dni,
                rw.email,
                rw.telefono,
                rw.fechaCreacion,
                rw.detalleDocumentacion,
                rw.modalidadId,
                m.nombre as modalidad,
                rw.planAnio,
                DATE_ADD(rw.fechaCreacion, INTERVAL 7 DAY) as fechaVencimiento
            FROM registros_web rw
            LEFT JOIN modalidades m ON rw.modalidadId = m.id
            WHERE rw.idEstadoInscripcion = 1
            AND DATE_ADD(rw.fechaCreacion, INTERVAL 7 DAY) > NOW()
            ORDER BY rw.fechaCreacion DESC
        `;
        
        return new Promise((resolve, reject) => {
            db.query(query, (err, results) => {
                if (err) {
                    console.error('Error en consulta de registros pendientes:', err);
                    reject(err);
                    return;
                }
                
                // Procesar los resultados para agregar información adicional
                const registrosProcesados = results.map(registro => {
                    let documentosSubidos = [];
                    
                    // Procesar el detalle de documentación si existe
                    if (registro.detalleDocumentacion) {
                        try {
                            const detalle = JSON.parse(registro.detalleDocumentacion);
                            documentosSubidos = detalle
                                .filter(doc => doc.estadoDocumentacion === 'Entregado')
                                .map(doc => doc.nombreArchivo);
                        } catch (e) {
                            console.warn('Error al parsear detalleDocumentacion:', e);
                        }
                    }
                    
                    return {
                        ...registro,
                        documentosSubidos,
                        tipoRegistro: documentosSubidos.length === 0 ? 'SIN_DOCUMENTACION' : 'DOCUMENTACION_INCOMPLETA'
                    };
                });
                
                console.log(`📋 Encontrados ${registrosProcesados.length} registros pendientes`);
                resolve(registrosProcesados);
            });
        });
    } catch (error) {
        console.error('Error al obtener registros pendientes:', error);
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

        console.log(`📧 Enviando email individual a: ${registro.nombre} ${registro.apellido} (${registro.email})`);
        
        const resultado = await enviarEmailEstudiante(registro);
        
        if (resultado.success) {
            res.json({
                success: true,
                message: `Email enviado exitosamente a ${registro.nombre} ${registro.apellido}`,
                email: registro.email,
                resultado
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Error al enviar el email',
                error: resultado.error,
                resultado
            });
        }

    } catch (error) {
        console.error('Error en envío de email individual:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// POST: Enviar emails masivos a múltiples estudiantes
router.post('/enviar-masivo', async (req, res) => {
    try {
        console.log('📧 Iniciando envío masivo...');
        
        // Obtener registros pendientes desde la base de datos
        const registros = await obtenerRegistrosPendientes();
        
        if (registros.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No hay registros pendientes para enviar'
            });
        }

        // Filtrar solo registros con email válido
        const registrosConEmail = registros.filter(r => r.email && r.email.includes('@'));
        
        if (registrosConEmail.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No hay registros con emails válidos'
            });
        }

        console.log(`📧 Enviando emails a ${registrosConEmail.length} estudiantes de ${registros.length} registros totales...`);
        
        const resultados = await enviarEmailsMasivos(registrosConEmail);
        
        res.json({
            success: true,
            message: `Envío masivo completado: ${resultados.exitosos} enviados, ${resultados.fallidos_count} fallidos`,
            enviados: resultados.exitosos,
            fallidos: resultados.fallidos_count,
            totalProcesados: registrosConEmail.length,
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

// POST: Enviar emails solo a registros con urgencia (vencen pronto o ya vencidos)
router.post('/enviar-urgentes', async (req, res) => {
    try {
        const { diasUmbral = 3 } = req.body;
        
        console.log('⚡ Iniciando envío de emails urgentes...');
        
        // Obtener registros pendientes desde la base de datos
        const todosRegistros = await obtenerRegistrosPendientes();
        
        if (todosRegistros.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No hay registros pendientes'
            });
        }

        // Filtrar registros urgentes (vencen en menos de diasUmbral días)
        const registrosUrgentes = todosRegistros.filter(registro => {
            const ahora = new Date();
            const vencimiento = new Date(registro.fechaVencimiento);
            const msRestantes = vencimiento.getTime() - ahora.getTime();
            const diasRestantes = Math.ceil(msRestantes / (1000 * 60 * 60 * 24));
            
            // Incluir registros que vencen en menos de diasUmbral días o ya vencidos
            return diasRestantes <= diasUmbral && registro.email && registro.email.includes('@');
        });

        if (registrosUrgentes.length === 0) {
            return res.status(404).json({
                success: false,
                message: `No hay registros urgentes (que venzan en ${diasUmbral} días o menos) con emails válidos`
            });
        }

        console.log(`⚡ Enviando emails urgentes a ${registrosUrgentes.length} estudiantes de ${todosRegistros.length} totales...`);
        
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

// GET: Probar configuración de email
router.get('/test-config', async (req, res) => {
    try {
        const emailConfig = {
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: process.env.SMTP_PORT || 587,
            user: process.env.EMAIL_USER || 'ceija5.inscripciones@gmail.com',
            hasPassword: !!process.env.EMAIL_PASS
        };

        res.json({
            success: true,
            message: 'Configuración de email obtenida',
            config: emailConfig
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener configuración',
            error: error.message
        });
    }
});

module.exports = router;