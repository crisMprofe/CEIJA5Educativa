import axios from 'axios';

// Servicio para manejar registros pendientes
export const registrosPendientesService = {
    // Obtener todos los registros pendientes
    obtenerRegistrosPendientes: async () => {
        try {
            const response = await axios.get('/api/registros-pendientes');
            return response.data || [];
        } catch (error) {
            console.error('Error al obtener registros pendientes:', error);
            throw error;
        }
    },

    // Obtener un registro específico por DNI
    obtenerRegistroPorDni: async (dni) => {
        try {
            const registros = await registrosPendientesService.obtenerRegistrosPendientes();
            const registro = registros.find(r => r.dni === dni);
            
            if (!registro) {
                throw new Error(`Registro con DNI ${dni} no encontrado`);
            }
            
            return registro;
        } catch (error) {
            console.error('Error al obtener registro por DNI:', error);
            throw error;
        }
    },

    // Transformar datos para formulario de inscripción
    transformarParaFormulario: (registro) => {
        return {
            // Datos personales
            nombre: registro.datos?.nombre || '',
            apellido: registro.datos?.apellido || '',
            dni: registro.datos?.dni || registro.dni,
            cuil: registro.datos?.cuil || '',
            email: registro.datos?.email || '',
            telefono: registro.datos?.telefono || '',
            fechaNacimiento: registro.datos?.fechaNacimiento || '',
            tipoDocumento: registro.datos?.tipoDocumento || 'DNI',
            paisEmision: registro.datos?.paisEmision || 'Argentina',
            
            // Domicilio
            calle: registro.datos?.calle || '',
            numero: registro.datos?.numero || '',
            barrio: registro.datos?.barrio || '',
            localidad: registro.datos?.localidad || '',
            provincia: registro.datos?.provincia || '',
            codigoPostal: registro.datos?.codigoPostal || '',
            
            // Información académica
            modalidad: registro.datos?.modalidad || '',
            modalidadId: registro.datos?.modalidadId || null,
            planAnio: registro.datos?.planAnio || '',
            modulos: registro.datos?.modulos || '',
            idModulo: registro.datos?.idModulo || null,
            
            // Archivos existentes (para pre-cargar en el modal)
            archivosExistentes: registro.archivos || {},
            
            // Metadata
            origenRegistro: 'registros-pendientes',
            registroPendienteId: registro.dni,
            fechaCreacionOriginal: registro.timestamp
        };
    },

    // Obtener archivos existentes formateados para el modal
    obtenerArchivosParaModal: (registro) => {
        const archivos = registro.archivos || {};
        const archivosFormateados = {};
        
        Object.keys(archivos).forEach(campo => {
            const rutaArchivo = archivos[campo];
            
            // Extraer información del archivo desde la ruta
            if (rutaArchivo && typeof rutaArchivo === 'string') {
                const nombreArchivo = rutaArchivo.split('/').pop(); // Obtener solo el nombre del archivo
                
                archivosFormateados[campo] = {
                    file: {
                        name: nombreArchivo,
                        size: 0, // No tenemos el tamaño real
                        type: nombreArchivo.includes('.pdf') ? 'application/pdf' : 'image/jpeg'
                    },
                    preview: rutaArchivo, // Ruta para preview
                    exists: true, // Marca que el archivo ya existe
                    uploaded: true // Marca que ya fue subido previamente
                };
            }
        });
        
        return archivosFormateados;
    },

    // Eliminar registro pendiente
    eliminarRegistro: async (dni) => {
        try {
            const response = await axios.delete(`/api/registros-pendientes/${dni}`);
            return response.data;
        } catch (error) {
            console.error('Error al eliminar registro:', error);
            throw error.response?.data || error;
        }
    },

    // Actualizar estado de registro
    actualizarEstado: async (dni, estado, observaciones = null) => {
        try {
            const response = await axios.put(`/api/registros-pendientes/${dni}`, {
                estado,
                observaciones
            });
            return response.data;
        } catch (error) {
            console.error('Error al actualizar registro:', error);
            throw error.response?.data || error;
        }
    },

    // NUEVO: Completar documentación y registrar en BD
    completarDocumentacion: async (dni, datosFormulario, archivos) => {
        try {
            const formData = new FormData();
            
            // Agregar datos del formulario
            Object.keys(datosFormulario).forEach(key => {
                if (datosFormulario[key] !== null && datosFormulario[key] !== undefined) {
                    formData.append(key, datosFormulario[key]);
                }
            });
            
            // Agregar archivos nuevos si hay
            if (archivos) {
                Object.keys(archivos).forEach(fieldName => {
                    const archivo = archivos[fieldName];
                    if (archivo && archivo.file) {
                        formData.append(fieldName, archivo.file);
                    }
                });
            }
            
            const response = await axios.post(`/api/completar-documentacion/${dni}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            return response.data;
        } catch (error) {
            console.error('Error al completar documentación:', error);
            throw error.response?.data || error;
        }
    }
};