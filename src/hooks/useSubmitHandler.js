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

    const handleResponse = async (response, values, files, previews, accion, isWebUser, completarWebParam, resetForm, resetArchivos, modalidad, isAdmin) => {
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
        
        if (accion === "Registrar" && !hayDocumentosCompletos && isAdmin) {
            // Caso especial: registro de admin sin documentación o incompleto → enviar a Registros_Pendientes.json
            try {
                console.log('📋 Enviando registro pendiente al backend:', values);
                
                // Crear FormData específico para registros pendientes
                const formDataPendiente = buildFormData(values, files, estadoDocumentacion, true);
                formDataPendiente.append('motivoPendiente', estadoDocumentacion.mensaje);
                formDataPendiente.append('tipoRegistro', estadoDocumentacion.completo ? 'DOCUMENTACION_INCOMPLETA' : 'SIN_DOCUMENTACION');
                
                // Enviar al backend para guardar en Registros_Pendientes.json
                const responsePendiente = await serviceRegInscripcion.createRegistroPendiente(formDataPendiente);
                
                setAlert({ 
                    text: `📋 Registro guardado como pendiente: ${estadoDocumentacion.mensaje}`, 
                    variant: 'warning' 
                });
                
                console.log('✅ Registro pendiente guardado en backend:', responsePendiente);
                
            } catch (error) {
                console.error('❌ Error al guardar registro pendiente en backend:', error);
                
                // Fallback: guardar en localStorage como respaldo
                try {
                    await guardarRegistroSinDocumentacion({
                        ...values,
                        modalidad,
                        mensaje: response?.message || 'Registro pendiente'
                    }, estadoDocumentacion);
                    
                    setAlert({ 
                        text: `⚠️ Guardado localmente: ${estadoDocumentacion.mensaje}`, 
                        variant: 'warning' 
                    });
                } catch (localError) {
                    console.error('❌ Error en fallback local:', localError);
                    setAlert({ 
                        text: 'Error al guardar registro pendiente', 
                        variant: 'error' 
                    });
                }
            }
        } else if (accion === "Registrar" && !hayDocumentosCompletos && !isAdmin) {
            // Caso usuario web sin documentación → guardar local
            try {
                await guardarRegistroSinDocumentacion({
                    ...values,
                    modalidad,
                    mensaje: response?.message || 'Registro web incompleto'
                }, estadoDocumentacion);
                
                setAlert({ 
                    text: estadoDocumentacion.mensaje, 
                    variant: 'warning' 
                });
            } catch (error) {
                console.error('Error al guardar registro web local:', error);
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
            // Limpiar sessionStorage después de un registro exitoso
            sessionStorage.removeItem('datosRegistroPendiente');
            console.log('🧹 SessionStorage limpiado tras registro exitoso');
        }
    };

    const handleSubmit = async (values, { setSubmitting, resetForm }, accion, isAdmin, isWebUser, completarWebParam, modalidad, completarRegistroWeb) => {
        setSubmitting(true);
        try {
            setAlert({ text: '', variant: '' });

            // Detectar si es completar registro web
            const esCompletarRegistroWeb = !!completarRegistroWeb || sessionStorage.getItem('datosRegistroWeb');
            
            if (esCompletarRegistroWeb) {
                console.log('🌐 Completando registro web:', completarRegistroWeb);
                await handleCompletarRegistroWeb(values, resetForm, resetArchivos);
                return;
            }

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
            await handleResponse(response, values, files, previews, accion, isWebUser, completarWebParam, resetForm, resetArchivos, modalidad, isAdmin);

        } catch (error) {
            const mensajeError = error.response?.data?.message || 'Ocurrió un error al enviar los datos.';
            setAlert({ text: mensajeError, variant: 'error' });
        } finally {
            setTimeout(() => setAlert({ text: '', variant: '' }), 10000);
            setSubmitting(false);
        }
    };

    const handleCompletarRegistroWeb = async (values, resetForm, resetArchivos) => {
        try {
            console.log('🔄 Procesando completar registro web...');
            
            // Obtener datos del registro web desde sessionStorage
            const datosRegistroWeb = JSON.parse(sessionStorage.getItem('datosRegistroWeb') || '{}');
            const idRegistroWeb = datosRegistroWeb.id;
            
            if (!idRegistroWeb) {
                throw new Error('ID de registro web no encontrado');
            }

            console.log('📋 Datos del registro web:', datosRegistroWeb);
            console.log('🎓 Valores del formulario:', values);

            // Evaluar documentación con parámetros correctos
            const modalidadActual = values.modalidad || datosRegistroWeb.datos?.modalidad || '';
            const planAnioActual = values.planAnio || datosRegistroWeb.datos?.planAnio || '';
            const modulosActual = values.modulos || datosRegistroWeb.datos?.modulos || '';
            
            const estadoDocumentacion = obtenerEstadoDocumentacion(
                files,
                previews,
                modalidadActual,
                planAnioActual,
                modulosActual
            );

            console.log('📊 Estado documentación registro web:', estadoDocumentacion);

            // Construir datos completos para envío
            const datosCompletos = {
                ...datosRegistroWeb.datos, // Datos originales del registro web
                ...values,  // Datos actualizados del formulario (sobrescribe los originales)
                // Asegurar que tenemos los datos clave
                modalidad: modalidadActual,
                planAnio: planAnioActual,
                modulos: modulosActual
            };

            console.log('📦 Datos completos a procesar:', datosCompletos);

            // Construir información de documentos
            const documentos = {
                files: files,
                previews: previews,
                detalle: buildDetalleDocumentacion(),
                estado: estadoDocumentacion
            };

            // Decidir si procesar en BD o mover a pendientes
            if (estadoDocumentacion.completo) {
                console.log('✅ Documentación completa - Procesando registro web en BD');
                
                // Procesar en BD y marcar como PROCESADO
                const resultado = await serviceRegistrosWeb.procesarRegistroWeb(idRegistroWeb, datosCompletos, documentos);
                
                setAlert({ 
                    text: 'Registro web procesado y guardado en la base de datos exitosamente', 
                    variant: 'success' 
                });
                
                console.log('✅ Registro procesado en BD:', resultado);
            } else {
                console.log('⚠️ Documentación incompleta - Moviendo a pendientes');
                
                // Construir mensaje detallado del motivo
                const documentosFaltantesTexto = estadoDocumentacion.faltantes?.map(doc => {
                    const nombres = {
                        "foto": "📷 Foto",
                        "archivo_dni": "📄 DNI",
                        "archivo_cuil": "📄 CUIL",
                        "archivo_fichaMedica": "🏥 Ficha Médica",
                        "archivo_partidaNacimiento": "📜 Partida de Nacimiento",
                        "archivo_solicitudPase": "📝 Solicitud de Pase",
                        "archivo_analiticoParcial": "📊 Analítico Parcial",
                        "archivo_certificadoNivelPrimario": "🎓 Certificado Primario"
                    };
                    return nombres[doc] || doc;
                }).join(', ') || 'Documentos varios';
                
                const motivoPendiente = `⚠️ Documentación incompleta (${estadoDocumentacion.totalSubidos || 0}/${estadoDocumentacion.totalRequeridos || 6}) para ${modalidadActual} - Registro quedará PENDIENTE. Faltan: ${documentosFaltantesTexto}`;
                
                // Mover a registros pendientes
                const resultado = await serviceRegistrosWeb.moverRegistroWebAPendientes(idRegistroWeb, motivoPendiente);
                
                setAlert({ 
                    text: `⚠️ Registro movido a pendientes. ${motivoPendiente}`, 
                    variant: 'warning' 
                });
                
                console.log('⚠️ Registro movido a pendientes:', resultado);
            }

            // Limpiar y resetear
            resetArchivos();
            resetForm();
            sessionStorage.removeItem('datosRegistroWeb');
            
            // Redirigir al dashboard con mensaje
            setTimeout(() => {
                window.location.href = '/dashboard?tab=registros-web';
            }, 3000);

        } catch (error) {
            console.error('❌ Error al completar registro web:', error);
            setAlert({ 
                text: `Error al procesar registro web: ${error.message}`, 
                variant: 'error' 
            });
        }
    };

    return { handleSubmit };
};