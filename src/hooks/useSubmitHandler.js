import { 
    obtenerEstadoDocumentacion, 
    verificarRegistroPendiente,
    eliminarRegistroPendiente,
    guardarRegistroSinDocumentacion
} from '../utils/registroSinDocumentacion';
import serviceRegInscripcion from '../services/serviceRegInscripcion';
import serviceInscripcion from '../services/serviceInscripcion';
import serviceRegistrosWeb from '../services/serviceRegistrosWeb';

/**
 * Hook personalizado para manejar el envío del formulario de registro
 * @param {Function} setAlert - Función para mostrar alertas
 * @param {Object} files - Archivos adjuntos
 * @param {Object} previews - Previsualizaciones de archivos
 * @param {Function} resetArchivos - Función para resetear archivos
 * @param {Function} buildDetalleDocumentacion - Función para construir detalle de documentación
 */
export const useSubmitHandler = (setAlert, files, previews, resetArchivos, buildDetalleDocumentacion) => {
    
    const validateRequiredFields = (values) => {
        const camposObligatorios = [
            'nombre', 'apellido', 'dni', 'cuil', 'fechaNacimiento', 
            'calle', 'numero', 'barrio', 'localidad', 'provincia', 
            'email', 'telefono'
        ];
        return camposObligatorios.filter((campo) => !values[campo]);
    };

    const buildFormData = (values, files, detalleDocumentacion, isAdmin) => {
        const formDataToSend = new FormData();

        // Debug logging para usuarios web antes de construir FormData
        if (!isAdmin) {
            console.log('🌐 [DEBUG] Construyendo FormData para usuario web...');
            console.log('🌐 [DEBUG] Values:', values);
            console.log('🌐 [DEBUG] Files:', files);
        }

        // Solo iterar los values, no agregar modalidad manualmente para evitar duplicados
        Object.entries(values).forEach(([key, value]) => {
            // Excluir campos de archivos para evitar conflictos
            const archivosFields = [
                'archivo_dni', 'archivo_cuil', 'archivo_partidaNacimiento', 
                'archivo_fichaMedica', 'archivo_solicitudPase', 'archivo_analiticoParcial', 
                'archivo_certificadoNivelPrimario', 'foto'
            ];
            if (!archivosFields.includes(key)) {
                const campo = key === 'modulos' ? 'idModulo' : key;
                formDataToSend.append(campo, value);
                // Debug logging para usuarios web
                if (!isAdmin && value) {
                    console.log(`🌐 [DEBUG] Agregando al FormData: ${campo} = ${value}`);
                }
            }
        });

        Object.entries(files).forEach(([key, file]) => {
            if (file) {
                formDataToSend.append(key, file);
                if (!isAdmin) {
                    console.log(`🌐 [DEBUG] Agregando archivo: ${key} = ${file.name}`);
                }
            }
        });

        formDataToSend.append('detalleDocumentacion', JSON.stringify(detalleDocumentacion));
        
        // Debug logging final para usuarios web
        if (!isAdmin) {
            console.log('🌐 [DEBUG] FormData construido, enviando al servicio...');
        }

        return formDataToSend;
    };

    const sendRequest = async (formData, accion, isAdmin, values) => {
        let response;
        if (accion === "Registrar") {
            response = isAdmin
                ? await serviceRegInscripcion.createEstd(formData)
                : await serviceRegInscripcion.createWebInscription(formData);
        } else if (accion === "Modificar" && isAdmin) {
            response = await serviceInscripcion.updateEstd(formData, values.dni);
        }
        return response;
    };

    const handleResponse = async (response, values, files, previews, accion, isWebUser, completarWebParam, resetForm, resetArchivos, modalidad) => {
        if (!response?.message) {
            setAlert({ text: 'El formulario se envió, pero no hubo respuesta.', variant: 'warning' });
            return;
        }

        // Verificar si este registro viene de completar un pendiente
        const registroPendiente = verificarRegistroPendiente(values.dni);
        const esRegistroPendienteCompletado = registroPendiente && values.dni;

        // Obtener estado completo de la documentación
        const estadoDocumentacion = obtenerEstadoDocumentacion(files, previews);
        const hayDocumentosCompletos = estadoDocumentacion.completo;
        
        if (accion === "Registrar" && !hayDocumentosCompletos) {
            // Caso especial: registro sin documentación o incompleto
            try {
                // Guardar en archivo JSON local con información detallada
                await guardarRegistroSinDocumentacion({
                    ...values,
                    modalidad,
                    mensaje: response.message
                }, estadoDocumentacion);
                
                // Usar el mensaje específico según el estado
                setAlert({ 
                    text: estadoDocumentacion.mensaje, 
                    variant: 'warning' 
                });
            } catch (error) {
                console.error('Error al guardar registro pendiente:', error);
                setAlert({ 
                    text: estadoDocumentacion.mensaje, 
                    variant: 'warning' 
                });
            }
        } else {
            // Caso normal: con documentación completa
            let mensajeExito = response.message;
            
            // Si es usuario web, personalizar mensaje de éxito
            if (isWebUser) {
                mensajeExito = 'Registro realizado con éxito, recuerda finalizar la inscripción de manera presencial para iniciar tus estudios';
            }
            
            // Si se completó un registro pendiente, eliminar de localStorage
            if (esRegistroPendienteCompletado) {
                eliminarRegistroPendiente(values.dni);
                mensajeExito += ' ✅ Registro pendiente completado exitosamente.';
                console.log(`🎉 Registro pendiente completado para DNI ${values.dni}`);
            }
            
            // Si se completó un registro web, actualizar su estado
            if (completarWebParam) {
                try {
                    await serviceRegistrosWeb.procesarRegistroWeb(completarWebParam);
                    mensajeExito += ' ✅ Registro web procesado exitosamente.';
                    console.log(`🎉 Registro web procesado para ID ${completarWebParam}`);
                } catch (error) {
                    console.error('Error al actualizar estado del registro web:', error);
                    // No detener el flujo, solo log del error
                }
            }
            
            setAlert({ text: mensajeExito, variant: 'success' });
        }
        
        // Resetear formulario solo si el registro fue exitoso
        if (accion === "Registrar") {
            // Resetear archivos y previews
            resetArchivos();
            // Resetear campos del formulario a valores iniciales
            resetForm();
        }
    };

    const handleSubmit = async (values, { setSubmitting, resetForm }, accion, isAdmin, isWebUser, completarWebParam, modalidad) => {
        setSubmitting(true);
        try {
            setAlert({ text: '', variant: '' });

            // Validar campos obligatorios
            const camposFaltantes = validateRequiredFields(values);
            if (camposFaltantes.length > 0) {
                setAlert({ text: `Faltan completar: ${camposFaltantes.join(', ')}`, variant: 'error' });
                return;
            }

            // Construir FormData
            const detalleDocumentacion = buildDetalleDocumentacion();
            const formDataToSend = buildFormData(values, files, detalleDocumentacion, isAdmin);

            // Enviar request
            const response = await sendRequest(formDataToSend, accion, isAdmin, values);

            // Debug logging para usuarios web
            if (!isAdmin) {
                console.log('🌐 Respuesta para usuario web:', response);
                console.log('🌐 ¿Tiene message?', !!response?.message);
                console.log('🌐 Message content:', response?.message);
            }

            // Manejar respuesta
            await handleResponse(response, values, files, previews, accion, isWebUser, completarWebParam, resetForm, resetArchivos, modalidad);

        } catch (error) {
            const mensajeError = error.response?.data?.message || 'Ocurrió un error al enviar los datos.';
            setAlert({ text: mensajeError, variant: 'error' });
        } finally {
            setTimeout(() => setAlert({ text: '', variant: '' }), 10000);
            setSubmitting(false);
        }
    };

    return { handleSubmit };
};