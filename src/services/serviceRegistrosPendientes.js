const API_BASE_URL = 'http://localhost:5000/api';

const registrosPendientesService = {
    // Obtener todos los registros pendientes
    obtenerRegistrosPendientes: async () => {
        try {
            console.log('📋 Obteniendo registros pendientes...');
            const response = await fetch(`${API_BASE_URL}/registros-pendientes`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const registros = await response.json();
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
            const response = await fetch(`${API_BASE_URL}/registros-pendientes`, {
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
            console.log('✅ Registro pendiente creado exitosamente');
            return resultado;
        } catch (error) {
            console.error('Error al crear registro pendiente:', error);
            throw error;
        }
    },

    // Actualizar estado de un registro pendiente
    actualizarRegistroPendiente: async (dni, datos) => {
        try {
            console.log(`🔄 Actualizando registro pendiente: ${dni}`);
            const response = await fetch(`${API_BASE_URL}/registros-pendientes/${dni}`, {
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
            console.log('✅ Registro pendiente actualizado exitosamente');
            return resultado;
        } catch (error) {
            console.error('Error al actualizar registro pendiente:', error);
            throw error;
        }
    },

    // Eliminar un registro pendiente
    eliminarRegistroPendiente: async (dni) => {
        try {
            console.log(`🗑️ Eliminando registro pendiente: ${dni}`);
            const response = await fetch(`${API_BASE_URL}/registros-pendientes/${dni}`, {
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
            console.log('✅ Registro pendiente eliminado exitosamente');
            return resultado;
        } catch (error) {
            console.error('Error al eliminar registro pendiente:', error);
            throw error;
        }
    },

    // Obtener estadísticas de registros pendientes
    obtenerEstadisticas: async () => {
        try {
            console.log('📊 Obteniendo estadísticas de registros pendientes...');
            const response = await fetch(`${API_BASE_URL}/registros-pendientes/stats`, {
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
    }
};

export default registrosPendientesService;