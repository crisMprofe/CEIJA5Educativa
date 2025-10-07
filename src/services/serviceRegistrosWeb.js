const API_BASE_URL = 'http://localhost:5000/api';

const registrosWebService = {
    // Obtener todos los registros web
    obtenerRegistrosWeb: async () => {
        try {
            console.log('📋 Obteniendo registros web...');
            const response = await fetch(`${API_BASE_URL}/registros-web`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const registros = await response.json();
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
            const response = await fetch(`${API_BASE_URL}/registros-web`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(datosRegistro),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
            }

            const resultado = await response.json();
            console.log('✅ Registro web creado exitosamente');
            return resultado;
        } catch (error) {
            console.error('Error al crear registro web:', error);
            throw error;
        }
    },

    // Actualizar estado de un registro web
    actualizarRegistroWeb: async (id, datos) => {
        try {
            console.log(`🔄 Actualizando registro web: ${id}`);
            const response = await fetch(`${API_BASE_URL}/registros-web/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(datos),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
            }

            const resultado = await response.json();
            console.log('✅ Registro web actualizado exitosamente');
            return resultado;
        } catch (error) {
            console.error('Error al actualizar registro web:', error);
            throw error;
        }
    },

    // Eliminar un registro web
    eliminarRegistroWeb: async (id) => {
        try {
            console.log(`🗑️ Eliminando registro web: ${id}`);
            const response = await fetch(`${API_BASE_URL}/registros-web/${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
            }

            const resultado = await response.json();
            console.log('✅ Registro web eliminado exitosamente');
            return resultado;
        } catch (error) {
            console.error('Error al eliminar registro web:', error);
            throw error;
        }
    },

    // Obtener estadísticas de registros web
    obtenerEstadisticas: async () => {
        try {
            console.log('📊 Obteniendo estadísticas de registros web...');
            const response = await fetch(`${API_BASE_URL}/registros-web/stats`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const stats = await response.json();
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

    // Procesar un registro web (convertir a registro completo en BD)
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
                response = await fetch(`${API_BASE_URL}/registros-web/${id}/procesar`, {
                    method: 'POST',
                    body: formData
                });
            } else {
                // Guardar como JSON (registros_web o registros_pendientes)
                response = await fetch(`${API_BASE_URL}/registros-web/${id}/procesar`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        datosFormulario,
                        documentos
                    })
                });
            }

            if (!response.ok) {
                let errorData;
                try { errorData = await response.json(); } catch { errorData = {}; }
                throw new Error(errorData?.message || `Error ${response.status}: ${response.statusText}`);
            }

            const resultado = await response.json();
            console.log(`✅ Registro web procesado y guardado:`, resultado);
            return resultado;
        } catch (error) {
            console.error('❌ Error al procesar registro web:', error);
            throw error;
        }
    },

    // Mover registro web a pendientes
    moverRegistroWebAPendientes: async (id, motivoPendiente) => {
        try {
            console.log(`📋 Moviendo registro web ${id} a pendientes`);
            
            const response = await fetch(`${API_BASE_URL}/registros-web/${id}/mover-pendiente`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    motivoPendiente
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
            }

            const resultado = await response.json();
            console.log(`✅ Registro web movido a pendientes:`, resultado);
            return resultado;
        } catch (error) {
            console.error('❌ Error al mover registro web a pendientes:', error);
            throw error;
        }
    }
};

export default registrosWebService;