import { useNavigate } from 'react-router-dom';
import { Formik } from 'formik';
import PropTypes from 'prop-types';
import { useSearchParams } from 'react-router-dom';
import useGestionDocumentacion from '../hooks/useGestionDocumentacion';
import GestionEstudianteView from './GestionEstudianteView';
import serviceRegInscripcion from '../services/serviceRegInscripcion';
import serviceInscripcion from '../services/serviceInscripcion';
import serviceRegistrosWeb from '../services/serviceRegistrosWeb';
import { 
    guardarRegistroSinDocumentacion, 
    obtenerEstadoDocumentacion, 
    verificarRegistroPendiente,
    eliminarRegistroPendiente 
} from '../utils/registroSinDocumentacion';

const GestionEstudiante = ({ modalidad, accion, isAdmin, completarRegistro, isWebUser, onClose, onBack }) => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const {
        files,
        previews,
        alert,
        setAlert,
        handleFileChange,
        buildDetalleDocumentacion,
        resetArchivos,
    } = useGestionDocumentacion();

    // Obtener datos del registro pendiente si existe
    const registroPendiente = completarRegistro ? verificarRegistroPendiente(completarRegistro) : null;
    
    // Obtener datos del registro web desde parámetros URL
    const completarWebParam = searchParams.get('completarWeb');
    const datosRegistroWeb = completarWebParam ? {
        dni: searchParams.get('dni') || '',
        nombre: searchParams.get('nombre') || '',
        apellido: searchParams.get('apellido') || '',
        email: searchParams.get('email') || '',
        telefono: searchParams.get('telefono') || '',
        fechaNacimiento: searchParams.get('fechaNacimiento') || '',
        calle: searchParams.get('calle') || '',
        numero: searchParams.get('numero') || '',
        localidad: searchParams.get('localidad') || '',
        codigoPostal: searchParams.get('codigoPostal') || '',
        provincia: searchParams.get('provincia') || '',
        modalidad: searchParams.get('modalidad') || modalidad || ''
    } : null;
    
    // Generar valores iniciales dinámicamente
    const getInitialValues = () => {
        const baseValues = {
            nombre: '',
            apellido: '',
            tipoDocumento: 'DNI',
            dni: '',
            paisEmision: '',
            cuil: '',
            fechaNacimiento: '',
            calle: '',
            numero: '',
            barrio: '',
            localidad: '',
            provincia: '',
            email: '',
            telefono: '',
            modalidad: modalidad || '',
            modalidadId: modalidad === 'Presencial' ? 1 : modalidad === 'Semipresencial' ? 2 : 1,
            planAnio: '',
            modulos: '',
            idModulo: '',
            idEstadoInscripcion: 1,
            // Campos de documentación (archivos)
            archivo_dni: null,
            archivo_cuil: null,
            archivo_partidaNacimiento: null,
            archivo_fichaMedica: null,
            archivo_solicitudPase: null,
            archivo_analiticoParcial: null,
            archivo_certificadoNivelPrimario: null,
            foto: null,
        };

        // Si hay registro pendiente, pre-llenar campos
        if (registroPendiente) {
            console.log('📝 Pre-llenando formulario con registro pendiente:', registroPendiente);
            return {
                ...baseValues,
                nombre: registroPendiente.nombre || '',
                apellido: registroPendiente.apellido || '',
                dni: registroPendiente.dni || '',
                cuil: registroPendiente.cuil || '',
                fechaNacimiento: registroPendiente.fechaNacimiento || '',
                calle: registroPendiente.calle || '',
                numero: registroPendiente.numero || '',
                barrio: registroPendiente.barrio || '',
                localidad: registroPendiente.localidad || '',
                provincia: registroPendiente.provincia || '',
                email: registroPendiente.email || '',
                telefono: registroPendiente.telefono || '',
                modalidad: registroPendiente.modalidad || modalidad || '',
                modalidadId: registroPendiente.modalidadId || (modalidad === 'Presencial' ? 1 : modalidad === 'Semipresencial' ? 2 : 1),
                planAnio: registroPendiente.planAnio || '',
                modulos: registroPendiente.modulos || '',
                idModulo: registroPendiente.idModulo || '',
            };
        }

        // Si hay datos de registro web, pre-llenar campos
        if (datosRegistroWeb) {
            console.log('📝 Pre-llenando formulario con registro web:', datosRegistroWeb);
            return {
                ...baseValues,
                nombre: datosRegistroWeb.nombre || '',
                apellido: datosRegistroWeb.apellido || '',
                dni: datosRegistroWeb.dni || '',
                cuil: '', // Los registros web no tienen CUIL inicialmente
                fechaNacimiento: datosRegistroWeb.fechaNacimiento || '',
                calle: datosRegistroWeb.calle || '',
                numero: datosRegistroWeb.numero || '',
                barrio: '', // Los registros web no tienen barrio inicialmente
                localidad: datosRegistroWeb.localidad || '',
                provincia: datosRegistroWeb.provincia || '',
                email: datosRegistroWeb.email || '',
                telefono: datosRegistroWeb.telefono || '',
                modalidad: datosRegistroWeb.modalidad || modalidad || '',
                modalidadId: (datosRegistroWeb.modalidad === 'Presencial' ? 1 : datosRegistroWeb.modalidad === 'Semipresencial' ? 2 : 1),
                planAnio: '',
                modulos: '',
                idModulo: '',
            };
        }

        return baseValues;
    };

    const handleSubmit = async (values, { setSubmitting, resetForm }) => {
        setSubmitting(true);
        try {
            setAlert({ text: '', variant: '' });

            const camposObligatorios = ['nombre', 'apellido', 'dni', 'cuil', 'fechaNacimiento', 'calle', 'numero', 'barrio', 'localidad', 'provincia', 'email', 'telefono'];
            const camposFaltantes = camposObligatorios.filter((campo) => !values[campo]);

            if (camposFaltantes.length > 0) {
                setAlert({ text: `Faltan completar: ${camposFaltantes.join(', ')}`, variant: 'error' });
                return;
            }

            // Verificar si este registro viene de completar un pendiente
            const registroPendiente = verificarRegistroPendiente(values.dni);
            const esRegistroPendienteCompletado = registroPendiente && values.dni;

            const detalleDocumentacion = buildDetalleDocumentacion();
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
                const archivosFields = ['archivo_dni', 'archivo_cuil', 'archivo_partidaNacimiento', 'archivo_fichaMedica', 
                                       'archivo_solicitudPase', 'archivo_analiticoParcial', 'archivo_certificadoNivelPrimario', 'foto'];
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

            let response;
            if (accion === "Registrar") {
                response = isAdmin
                    ? await serviceRegInscripcion.createEstd(formDataToSend)
                    : await serviceRegInscripcion.createWebInscription(formDataToSend);
            } else if (accion === "Modificar" && isAdmin) {
                response = await serviceInscripcion.updateEstd(formDataToSend, values.dni);
            }

            // Debug logging para usuarios web
            if (!isAdmin) {
                console.log('🌐 Respuesta para usuario web:', response);
                console.log('🌐 ¿Tiene message?', !!response?.message);
                console.log('🌐 Message content:', response?.message);
            }

            if (response?.message) {
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
            } else {
                setAlert({ text: 'El formulario se envió, pero no hubo respuesta.', variant: 'warning' });
            }
        } catch (error) {
            const mensajeError = error.response?.data?.message || 'Ocurrió un error al enviar los datos.';
            setAlert({ text: mensajeError, variant: 'error' });
        } finally {
            setTimeout(() => setAlert({ text: '', variant: '' }), 10000);
            setSubmitting(false);
        }
    };

    return (
        <Formik
            initialValues={getInitialValues()}
            onSubmit={handleSubmit}
        >
            {(formikProps) => (
                <GestionEstudianteView
                    onClose={onClose}
                    onBack={onBack} // Agregar prop onBack
                    navigate={navigate}
                    previews={previews}
                    alert={alert}
                    setAlert={setAlert}
                    accion={accion}
                    isAdmin={isAdmin}
                    isWebUser={isWebUser} // Pasar prop de usuario web
                    handleFileChange={handleFileChange}
                    completarRegistro={completarRegistro} // Pasar el prop
                    {...formikProps}
                />
            )}
        </Formik>
    );
};

GestionEstudiante.propTypes = {
    modalidad: PropTypes.string.isRequired,
    accion: PropTypes.string.isRequired,
    isAdmin: PropTypes.bool.isRequired,
    completarRegistro: PropTypes.string, // DNI del registro a completar
    isWebUser: PropTypes.bool, // Indicar si es usuario web
    onClose: PropTypes.func.isRequired,
    onBack: PropTypes.func, // Función para navegar hacia atrás
};

export default GestionEstudiante;