import axiosInstance from '../config/axios';

const registrosPendientesService = {
    // Obtener todos los registros pendientes
    obtenerRegistrosPendientes: async () => {
        try {
            console.log('📋 Obteniendo registros pendientes...');
            const response = await axiosInstance.get('/registros-pendientes');
            console.log(`✅ ${response.data.length} registros pendientes obtenidos`);
            return response.data;
        } catch (error) {
            console.error('❌ Error al obtener registros pendientes:', error);
            throw error;
        }
    },

    // Obtener archivos de un estudiante pendiente
    obtenerArchivosEstudiante: async (dni) => {
        try {
            console.log(`📁 Obteniendo archivos del estudiante: ${dni}`);
            const response = await axiosInstance.get(`/registros-pendientes/archivos/${dni}`);
            console.log('✅ Archivos obtenidos:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Error obteniendo archivos:', error);
            return { archivos: [], total: 0 };
        }
    },

    // Crear un nuevo registro pendiente
    crearRegistroPendiente: async (datosRegistro) => {
        try {
            console.log('💾 Creando registro pendiente:', datosRegistro.dni);
            const response = await axiosInstance.post('/registros-pendientes', datosRegistro);
            console.log('✅ Registro pendiente creado exitosamente');
            return response.data;
        } catch (error) {
            console.error('❌ Error al crear registro pendiente:', error);
            throw error;
        }
    },

    // Actualizar un registro pendiente (acepta datos y archivos, siempre guarda en archivosPendientes)
    actualizarRegistroPendiente: async (dni, datos, archivos = null) => {
        try {
            console.log(`🔄 Actualizando registro pendiente: ${dni}`);
            
            let response;
            
            if (archivos && Object.keys(archivos).length > 0) {
                // Si hay archivos, usar FormData
                const formData = new FormData();
                
                // Agregar datos
                Object.keys(datos).forEach(key => {
                    if (datos[key] !== null && datos[key] !== undefined) {
                        formData.append(key, datos[key]);
                    }
                });
                
                // Agregar archivos
                Object.keys(archivos).forEach(fieldName => {
                    const archivo = archivos[fieldName];
                    if (archivo && archivo.file) {
                        formData.append(fieldName, archivo.file);
                    }
                });
                
                response = await axiosInstance.put(
                    `/registros-pendientes/${dni}`, 
                    formData,
                    {
                        headers: {
                            'Content-Type': 'multipart/form-data'
                        }
                    }
                );
            } else {
                // Sin archivos, enviar JSON
                response = await axiosInstance.put(
                    `/registros-pendientes/${dni}`, 
                    datos,
                    {
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }
                );
            }
            
            console.log('✅ Registro pendiente actualizado exitosamente');
            return response.data;
        } catch (error) {
            console.error('❌ Error al actualizar registro pendiente:', error);
            throw error;
        }
    },

    // Eliminar un registro pendiente
    eliminarRegistroPendiente: async (dni) => {
        try {
            console.log(`🗑️ Eliminando registro pendiente: ${dni}`);
            
            const response = await axiosInstance.delete(`/registros-pendientes/${dni}`);
            
            console.log('✅ Registro pendiente eliminado exitosamente');
            return response.data;
        } catch (error) {
            console.error('❌ Error al eliminar registro pendiente:', error);
            throw error;
        }
    },

    // Obtener estadísticas de registros pendientes
    obtenerEstadisticas: async () => {
        try {
            console.log('📊 Obteniendo estadísticas de registros pendientes...');
            
            const response = await axiosInstance.get('/registros-pendientes/stats');
            
            console.log('✅ Estadísticas obtenidas:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Error al obtener estadísticas:', error);
            throw error;
        }
    },

    // Procesar un registro pendiente (convertir a registro completo)
    procesarRegistroPendiente: async (dni) => {
        try {
            console.log(`🔄 Procesando registro pendiente: ${dni}`);
            
            // Actualizar el estado a "PROCESADO"
            const response = await axiosInstance.put(
                `/registros-pendientes/${dni}`,
                {
                    estado: 'PROCESADO',
                    observaciones: `Procesado y convertido a registro completo el ${new Date().toLocaleDateString('es-AR')}`
                },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            console.log(`✅ Registro pendiente ${dni} marcado como procesado`);
            return { success: true, message: 'Registro procesado exitosamente', data: response.data };
        } catch (error) {
            console.error('❌ Error al procesar registro pendiente:', error);
            throw error;
        }
    },

    // Completar un registro pendiente (procesar y migrar a la BD)
    completarRegistro: async (formData) => {
        try {
            const dni = formData.get('dni') || formData.get('registroPendienteId');
            
            if (!dni) {
                throw new Error('No se encontró el DNI en el FormData');
            }
            
            console.log(`✅ Completando registro pendiente: ${dni}`);
            console.log('📤 Procesando registro pendiente y migrando a BD...');
            
            const response = await axiosInstance.post(
                `/registros-pendientes/${dni}/procesar`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );
            
            console.log('✅ Registro pendiente procesado y guardado en BD:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Error al completar registro pendiente:', error);
            
            // Extraer mensaje de error
            const errorMessage = error.response?.data?.message 
                || error.response?.data?.error
                || error.message;
                
            throw new Error(errorMessage);
        }
    },

    // Aprobar un registro pendiente (validar y guardar en BD)
    aprobarRegistroPendiente: async (dni) => {
        try {
            console.log(`✅ Aprobando registro pendiente: ${dni}`);
            
            const response = await axiosInstance.post(
                `/registros-pendientes/${dni}/aprobar`,
                {},
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            console.log('✅ Registro pendiente aprobado y guardado en BD');
            return response.data;
        } catch (error) {
            console.error('❌ Error al aprobar registro pendiente:', error);
            
            const errorMessage = error.response?.data?.message 
                || error.response?.data?.error
                || error.message;
                
            throw new Error(errorMessage);
        }
    },

    // Enviar notificación por email
    enviarNotificacion: async (dni) => {
        try {
            console.log(`📧 Enviando notificación por email para DNI: ${dni}`);
            
            const response = await axiosInstance.post(
                '/notificaciones/enviar-individual', 
                { dni },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            console.log('✅ Notificación enviada exitosamente');
            return response.data;
        } catch (error) {
            console.error('❌ Error al enviar notificación:', error);
            
            const errorMessage = error.response?.data?.message 
                || error.response?.data?.error
                || error.message;
                
            throw new Error(errorMessage);
        }
    }
};

export default registrosPendientesService;