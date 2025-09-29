
const API_BASE = 'http://localhost:5000/api/ubicaciones';

/**
 * Servicio para obtener información de ubicaciones (provincias, localidades, barrios)
 * y resolver IDs a nombres para pre-población de formularios
 */
const ubicacionesService = {
    // Obtener todas las provincias
    getProvincias: async () => {
        try {
            const response = await fetch(`${API_BASE}/provincias`);
            const data = await response.json();
            if (data.success && data.data) {
                return data.data;
            }
            throw new Error('Error al obtener provincias');
        } catch (error) {
            console.error('❌ Error obteniendo provincias:', error);
            throw error;
        }
    },

    // Obtener localidades por provincia
    getLocalidadesByProvincia: async (idProvincia) => {
        try {
            const response = await fetch(`${API_BASE}/localidades/${idProvincia}`);
            const data = await response.json();
            if (data.success && data.data) {
                return data.data;
            }
            throw new Error(`Error al obtener localidades para provincia ${idProvincia}`);
        } catch (error) {
            console.error(`❌ Error obteniendo localidades para provincia ${idProvincia}:`, error);
            throw error;
        }
    },

    // Obtener barrios por localidad
    getBarriosByLocalidad: async (idLocalidad) => {
        try {
            const response = await fetch(`${API_BASE}/barrios/${idLocalidad}`);
            const data = await response.json();
            if (data.success && data.data) {
                return data.data;
            }
            throw new Error(`Error al obtener barrios para localidad ${idLocalidad}`);
        } catch (error) {
            console.error(`❌ Error obteniendo barrios para localidad ${idLocalidad}:`, error);
            throw error;
        }
    },

    // Función principal para resolver IDs a nombres
    resolverUbicaciones: async (provinciaId, localidadId, barrioId) => {
        try {
            console.log('🔄 [UbicacionesService] Resolviendo ubicaciones:', { provinciaId, localidadId, barrioId });
            
            const resultado = {
                provincia: '',
                localidad: '',
                barrio: ''
            };

            // Resolver provincia
            if (provinciaId) {
                const provincias = await ubicacionesService.getProvincias();
                const provincia = provincias.find(p => p.id == provinciaId);
                resultado.provincia = provincia ? provincia.nombre : provinciaId;
                console.log('📍 Provincia resuelta:', resultado.provincia);
            }

            // Resolver localidad
            if (localidadId && provinciaId) {
                try {
                    const localidades = await ubicacionesService.getLocalidadesByProvincia(provinciaId);
                    const localidad = localidades.find(l => l.id == localidadId);
                    resultado.localidad = localidad ? localidad.nombre : localidadId;
                    console.log('🏘️ Localidad resuelta:', resultado.localidad);
                } catch {
                    console.warn('⚠️ No se pudo resolver localidad, usando ID:', localidadId);
                    resultado.localidad = localidadId;
                }
            }

            // Resolver barrio
            if (barrioId && localidadId) {
                try {
                    const barrios = await ubicacionesService.getBarriosByLocalidad(localidadId);
                    const barrio = barrios.find(b => b.id == barrioId);
                    resultado.barrio = barrio ? barrio.nombre : barrioId;
                    console.log('🏠 Barrio resuelto:', resultado.barrio);
                } catch {
                    console.warn('⚠️ No se pudo resolver barrio, usando ID:', barrioId);
                    resultado.barrio = barrioId;
                }
            }

            console.log('✅ [UbicacionesService] Ubicaciones resueltas:', resultado);
            return resultado;

        } catch (error) {
            console.error('❌ [UbicacionesService] Error resolviendo ubicaciones:', error);
            // En caso de error, retornar los valores originales
            return {
                provincia: provinciaId || '',
                localidad: localidadId || '',
                barrio: barrioId || ''
            };
        }
    },

    // Función helper para resolver solo el nombre de una ubicación específica
    resolverNombrePorId: async (tipo, id, idPadre = null) => {
        try {
            switch (tipo) {
                case 'provincia': {
                    const provincias = await ubicacionesService.getProvincias();
                    const provincia = provincias.find(p => p.id == id);
                    return provincia ? provincia.nombre : id;
                }

                case 'localidad': {
                    if (!idPadre) throw new Error('Se requiere ID de provincia para resolver localidad');
                    const localidades = await ubicacionesService.getLocalidadesByProvincia(idPadre);
                    const localidad = localidades.find(l => l.id == id);
                    return localidad ? localidad.nombre : id;
                }

                case 'barrio': {
                    if (!idPadre) throw new Error('Se requiere ID de localidad para resolver barrio');
                    const barrios = await ubicacionesService.getBarriosByLocalidad(idPadre);
                    const barrio = barrios.find(b => b.id == id);
                    return barrio ? barrio.nombre : id;
                }

                default:
                    throw new Error(`Tipo de ubicación no válido: ${tipo}`);
            }
        } catch (error) {
            console.error(`❌ Error resolviendo ${tipo} con ID ${id}:`, error);
            return id; // Retornar el ID original si no se puede resolver
        }
    }
};

export default ubicacionesService;