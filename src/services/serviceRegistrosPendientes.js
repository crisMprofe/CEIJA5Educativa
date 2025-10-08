import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const registrosPendientesService = {
    // Obtener todos los registros pendientes
    obtenerRegistrosPendientes: async () => {
        try {
            console.log('📋 Obteniendo registros pendientes...');
            const response = await axios.get(`${API_BASE_URL}/registros-pendientes`);
            
            const registros = response.data;
            console.log(`✅ ${registros.length} registros pendientes obtenidos`);
            return registros;
        } catch (error) {
            console.error('Error al obtener registros pendientes:', error);
            throw error;
        }
    },

    // Crear un nuevo registro pendiente
    crearRegistroPendiente: async (datosRegistro) => {
        try {
            console.log('💾 Creando registro pendiente:', datosRegistro.dni);
            const response = await axios.post(`${API_BASE_URL}/registros-pendientes`, datosRegistro);
            
            const resultado = response.data;
            console.log('✅ Registro pendiente creado exitosamente');
            return resultado;
        } catch (error) {
            console.error('Error al crear registro pendiente:', error);
            throw error.response?.data || error;
        }
    },

    // Actualizar un registro pendiente (acepta datos y archivos, siempre guarda en archivosPendientes)
    actualizarRegistroPendiente: async (dni, datos, archivos = null) => {
        try {
            console.log(`🔄 Actualizando registro pendiente: ${dni}`);
            
            // Si hay archivos, usar FormData
            if (archivos && Object.keys(archivos).length > 0) {
                const formData = new FormData();
                
                Object.keys(datos).forEach(key => {
                    if (datos[key] !== null && datos[key] !== undefined) {
                        formData.append(key, datos[key]);
                    }
                });
                
                Object.keys(archivos).forEach(fieldName => {
                    const archivo = archivos[fieldName];
                    if (archivo && archivo.file) {
                        formData.append(fieldName, archivo.file);
                    }
                });
                
                const response = await axios.put(`${API_BASE_URL}/registros-pendientes/${dni}`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
                
                const resultado = response.data;
                console.log('✅ Registro pendiente actualizado exitosamente');
                return resultado;
            } else {
                // Si no hay archivos, usar JSON
                const response = await axios.put(`${API_BASE_URL}/registros-pendientes/${dni}`, datos);
                
                const resultado = response.data;
                console.log('✅ Registro pendiente actualizado exitosamente');
                return resultado;
            }
        } catch (error) {
            console.error('Error al actualizar registro pendiente:', error);
            throw error.response?.data || error;
        }
    },

    // Eliminar un registro pendiente
    eliminarRegistroPendiente: async (dni) => {
        try {
            console.log(`🗑️ Eliminando registro pendiente: ${dni}`);
            const response = await axios.delete(`${API_BASE_URL}/registros-pendientes/${dni}`);
            
            const resultado = response.data;
            console.log('✅ Registro pendiente eliminado exitosamente');
            return resultado;
        } catch (error) {
            console.error('Error al eliminar registro pendiente:', error);
            throw error.response?.data || error;
        }
    },

    // Obtener estadísticas de registros pendientes
    obtenerEstadisticas: async () => {
        try {
            console.log('📊 Obteniendo estadísticas de registros pendientes...');
            const response = await axios.get(`${API_BASE_URL}/registros-pendientes/stats`);
            
            const stats = response.data;
            console.log('✅ Estadísticas obtenidas:', stats);
            return stats;
        } catch (error) {
            console.error('Error al obtener estadísticas:', error);
            throw error;
        }
    },

    // Procesar un registro pendiente (convertir a registro completo)
    procesarRegistroPendiente: async (dni) => {
        try {
            // Primero actualizar el estado a "PROCESADO"
            await registrosPendientesService.actualizarRegistroPendiente(dni, {
                estado: 'PROCESADO',
                observaciones: `Procesado y convertido a registro completo el ${new Date().toLocaleDateString('es-AR')}`
            });

            console.log(`✅ Registro pendiente ${dni} marcado como procesado`);
            return { success: true, message: 'Registro procesado exitosamente' };
        } catch (error) {
            console.error('Error al procesar registro pendiente:', error);
            throw error;
        }
    },

    // Completar un registro pendiente (enviarlo a la BD)
    completarRegistro: async (formData) => {
        try {
            // Obtener el dni del FormData
            const dni = formData.get('dni') || formData.get('registroPendienteId');
            if (!dni) throw new Error('No se encontró el DNI en el FormData');
            
            console.log('✅ Enviando registro completo a la base de datos...');
            const response = await axios.post(`${API_BASE_URL}/completar-documentacion/${dni}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            const resultado = response.data;
            console.log('✅ Registro completado y guardado en BD exitosamente');
            return resultado;
        } catch (error) {
            console.error('Error al completar registro:', error);
            throw error.response?.data || error;
        }
    },

    // Enviar notificación por email
    enviarNotificacion: async (dni) => {
        try {
            console.log(`📧 Enviando notificación por email para DNI: ${dni}`);
            const response = await axios.post(`${API_BASE_URL}/notificaciones/enviar-individual`, { dni });

            const resultado = response.data;
            console.log('✅ Notificación enviada exitosamente');
            return resultado;
        } catch (error) {
            console.error('Error al enviar notificación:', error);
            throw error.response?.data || error;
        }
    }
};

export default registrosPendientesService;