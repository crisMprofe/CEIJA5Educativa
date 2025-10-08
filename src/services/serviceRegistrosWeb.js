import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const registrosWebService = {
    // Obtener todos los registros web
    obtenerRegistrosWeb: async () => {
        try {
            console.log('📋 Obteniendo registros web...');
            const response = await axios.get(`${API_BASE_URL}/registros-web`);
            
            const registros = response.data;
            console.log(`✅ ${registros.length} registros web obtenidos`);
            return registros;
        } catch (error) {
            console.error('Error al obtener registros web:', error);
            throw error;
        }
    },

    // Crear un nuevo registro web
    crearRegistroWeb: async (datosRegistro) => {
        try {
            console.log('💾 Creando registro web:', datosRegistro.dni);
            const response = await axios.post(`${API_BASE_URL}/registros-web`, datosRegistro);
            
            const resultado = response.data;
            console.log('✅ Registro web creado exitosamente');
            return resultado;
        } catch (error) {
            console.error('Error al crear registro web:', error);
            throw error.response?.data || error;
        }
    },

    // Actualizar estado de un registro web
    actualizarRegistroWeb: async (id, datos) => {
        try {
            console.log(`🔄 Actualizando registro web: ${id}`);
            const response = await axios.put(`${API_BASE_URL}/registros-web/${id}`, datos);
            
            const resultado = response.data;
            console.log('✅ Registro web actualizado exitosamente');
            return resultado;
        } catch (error) {
            console.error('Error al actualizar registro web:', error);
            throw error.response?.data || error;
        }
    },

    // Eliminar un registro web
    eliminarRegistroWeb: async (id) => {
        try {
            console.log(`🗑️ Eliminando registro web: ${id}`);
            const response = await axios.delete(`${API_BASE_URL}/registros-web/${id}`);
            
            const resultado = response.data;
            console.log('✅ Registro web eliminado exitosamente');
            return resultado;
        } catch (error) {
            console.error('Error al eliminar registro web:', error);
            throw error.response?.data || error;
        }
    },

    // Obtener estadísticas de registros web
    obtenerEstadisticas: async () => {
        try {
            console.log('📊 Obteniendo estadísticas de registros web...');
            const response = await axios.get(`${API_BASE_URL}/registros-web/stats`);
            
            const stats = response.data;
            console.log('✅ Estadísticas obtenidas:', stats);
            return stats;
        } catch (error) {
            console.error('Error al obtener estadísticas:', error);
            throw error;
        }
    },

    // Obtener un registro web específico por ID
    obtenerRegistroWebPorId: async (id) => {
        try {
            console.log(`🔍 Buscando registro web ID: ${id}`);
            const registros = await registrosWebService.obtenerRegistrosWeb();
            const registro = registros.find(r => r.id === id);
            
            if (!registro) {
                throw new Error(`Registro web con ID ${id} no encontrado`);
            }
            
            console.log(`✅ Registro web encontrado:`, registro.datos.nombre, registro.datos.apellido);
            return registro;
        } catch (error) {
            console.error('❌ Error al obtener registro web por ID:', error);
            throw error;
        }
    },

    // Procesar un registro web (convertir a registro completo en BD o guardar en registros_web/pendientes)
    /**
     * Procesar un registro web (convertir a registro completo en BD o guardar en registros_web/pendientes)
     * Si destinoBD es true, usa FormData (para la BD). Si es false, usa JSON (para registros_web o registros_pendientes).
     */
    procesarRegistroWeb: async (id, datosFormulario, documentos, destinoBD = true) => {
        try {
            console.log(`🔄 Procesando registro web ID: ${id} (destinoBD=${destinoBD})`);
            let response;
            
            if (destinoBD) {
                // Enviar a la BD: usar FormData para archivos
                const formData = new FormData();
                formData.append('datosFormulario', JSON.stringify(datosFormulario));
                // documentos: puede tener File o string (ruta existente)
                Object.entries(documentos || {}).forEach(([key, value]) => {
                    if (value instanceof File) {
                        formData.append(key, value);
                    } else if (typeof value === 'string') {
                        formData.append(key + '_ruta', value); // backend debe aceptar *_ruta para rutas existentes
                    }
                });
                
                response = await axios.post(`${API_BASE_URL}/registros-web/${id}/procesar`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
            } else {
                // Guardar como JSON (registros_web o registros_pendientes)
                response = await axios.post(`${API_BASE_URL}/registros-web/${id}/procesar`, {
                    datosFormulario,
                    documentos
                });
            }

            const resultado = response.data;
            console.log(`✅ Registro web procesado y guardado:`, resultado);
            return resultado;
        } catch (error) {
            console.error('❌ Error al procesar registro web:', error);
            throw error.response?.data || error;
        }
    },

    // Mover registro web a pendientes
    moverRegistroWebAPendientes: async (id, motivoPendiente) => {
        try {
            console.log(`📋 Moviendo registro web ${id} a pendientes`);
            
            const response = await axios.post(`${API_BASE_URL}/registros-web/${id}/mover-pendiente`, {
                motivoPendiente
            });

            const resultado = response.data;
            console.log(`✅ Registro web movido a pendientes:`, resultado);
            return resultado;
        } catch (error) {
            console.error('❌ Error al mover registro web a pendientes:', error);
            throw error.response?.data || error;
        }
    }
};

export default registrosWebService;