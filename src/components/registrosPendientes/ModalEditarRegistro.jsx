import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import registrosPendientesService from '../../services/serviceRegistrosPendientes';
import { obtenerDocumentosRequeridos } from '../../utils/registroSinDocumentacion';
import { useAlerts } from '../../hooks/useAlerts';
import useGestionDocumentacion from '../../hooks/useGestionDocumentacion';

// Importar componentes y estilos del formulario de registro
import CloseButton from '../CloseButton';
import { DatosPersonales } from '../DatosPersonales';
import { Domicilio } from '../Domicilio';
import ModalidadSelection from '../ModalidadSelection';
import FormDocumentacion from '../FormDocumentacion';
import EstadoInscripcion from '../EstadoInscripcion';
import BotonCargando from '../BotonCargando';

// Importar estilos del formulario original
import '../../estilos/estilosInscripcion.css';
import '../../estilos/botones.css';
import '../../estilos/RegistroEstd.css';
import '../../estilos/FormularioMejorado.css';
import '../../estilos/ModalEditarRegistroCompleto.css';

const ModalEditarRegistro = ({ registro, onClose, onGuardado, onEliminado }) => {
    const { showSuccess, showError } = useAlerts();
    const [guardando, setGuardando] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Usar el hook de gestión de documentación
    const {
        previews,
        setPreviews,
        handleFileChange: gestionHandleFileChange
    } = useGestionDocumentacion();

    // Estados iniciales para Formik
    const initialValues = {
        tipoDocumento: 'DNI',
        dni: registro.datos?.dni || registro.dni || '',
        nombre: registro.datos?.nombre || registro.nombre || '',
        apellido: registro.datos?.apellido || registro.apellido || '',
        cuil: registro.datos?.cuil || registro.cuil || '',
        email: registro.datos?.email || registro.email || '',
        telefono: registro.datos?.telefono || registro.telefono || '',
        fechaNacimiento: registro.datos?.fechaNacimiento || registro.fechaNacimiento || '',
        paisEmision: registro.datos?.paisEmision || registro.paisEmision || '',
        calle: registro.datos?.calle || registro.calle || '',
        numero: registro.datos?.numero || registro.numero || '',
        barrio: registro.datos?.barrio || registro.barrio || '',
        localidad: registro.datos?.localidad || registro.localidad || '',
        provincia: registro.datos?.provincia || registro.provincia || '',
        codigoPostal: registro.datos?.codigoPostal || registro.codigoPostal || '',
        modalidad: registro.datos?.modalidad || registro.modalidad || '',
        modalidadId: (() => {
            const modalidad = registro.datos?.modalidad || registro.modalidad || '';
            const modalidadIdExistente = registro.datos?.modalidadId || registro.modalidadId;
            
            // Si ya existe modalidadId, convertir a número
            if (modalidadIdExistente) {
                return parseInt(modalidadIdExistente, 10);
            }
            
            // Mapear modalidad a ID si no existe
            switch (modalidad) {
                case 'Presencial': return 1;
                case 'Semipresencial': return 2;
                case 'A Distancia': return 3;
                default: return '';
            }
        })(),
        planAnio: registro.datos?.planAnio || registro.planAnio || null,
        modulos: registro.datos?.modulos || registro.modulos || null,
        idEstadoInscripcion: 1 // Estado por defecto para completar
    };





    // Función para manejar cambios de archivos
    const handleFileChange = (e, field, setFieldValueFunc) => {
        // Usar la gestión de documentación del hook
        gestionHandleFileChange(e, field, setFieldValueFunc);
    };

    // Cerrar modal de documentación
    const closeModal = () => {
        setIsModalOpen(false);
    };

    // Función para proceder al registro (no necesaria aquí)
    const handleProceedToRegister = () => {
        closeModal();
    };

    // Función principal de envío
    const handleSubmit = async (formValues, { setSubmitting }) => {
        try {
            setGuardando(true);
            
            console.log('� Completando registro pendiente:', formValues);

            // Preparar FormData
            const formData = new FormData();
            
            // Agregar todos los campos del formulario
            Object.keys(formValues).forEach(key => {
                if (formValues[key] !== null && formValues[key] !== undefined) {
                    formData.append(key, formValues[key]);
                }
            });

            // Agregar archivos nuevos (no existentes)
            Object.keys(previews).forEach(tipoDoc => {
                const previewData = previews[tipoDoc];
                if (previewData && previewData.file && !previewData.existente) {
                    // Solo agregar archivos nuevos (no existentes)
                    formData.append(tipoDoc, previewData.file);
                    console.log(`📎 Agregando archivo nuevo: ${tipoDoc}`);
                }
            });

            // Verificar documentación completa
            const documentosRequeridos = obtenerDocumentosRequeridos(
                formValues.modalidad, 
                formValues.planAnio, 
                formValues.modulos
            );

            // Verificar qué archivos están presentes (existentes o nuevos)
            const archivosPresentes = Object.keys(previews).filter(field => {
                const preview = previews[field];
                return preview && (preview.url || preview.file);
            });

            const documentacionCompleta = documentosRequeridos.documentos.every(doc => 
                archivosPresentes.includes(doc)
            );

            console.log('📋 Documentos requeridos:', documentosRequeridos.documentos);
            console.log('📎 Archivos presentes:', archivosPresentes);
            console.log('✅ Documentación completa:', documentacionCompleta);

            formData.append('registroPendienteId', registro.dni);
            formData.append('documentacionCompleta', documentacionCompleta);
            
            let resultado;
            
            if (documentacionCompleta) {
                // Completar registro en BD
                console.log('✅ Documentación completa - Enviando a BD');
                resultado = await registrosPendientesService.completarRegistro(formData);
                
                console.log('✅ Respuesta de completar registro:', resultado);
                
                // Verificar si la respuesta indica éxito
                if (resultado && (resultado.success === true || resultado.message?.includes('exitoso') || resultado.id)) {
                    // No mostrar mensaje aquí - lo maneja el componente padre
                    console.log('✅ Registro completado exitosamente');
                    // Eliminar del archivo de pendientes
                    await registrosPendientesService.eliminarRegistroPendiente(registro.dni);
                    onGuardado && onGuardado(registro, 'completado');
                } else if (resultado && resultado.success === false) {
                    throw new Error(resultado.message || 'Error al completar el registro');
                } else {
                    // Si no hay estructura de respuesta clara pero llegó aquí, considerar como éxito
                    console.log('⚠️ Respuesta sin estructura clara para completar, considerando como éxito');
                    // No mostrar mensaje aquí - lo maneja el componente padre
                    await registrosPendientesService.eliminarRegistroPendiente(registro.dni);
                    onGuardado && onGuardado(registro, 'completado');
                }
            } else {
                // Actualizar en pendientes
                console.log('📝 Documentación incompleta - Actualizando pendientes');
                
                // Preparar archivos para actualización (incluir tanto existentes como nuevos)
                const archivosActualizados = {};
                Object.keys(previews).forEach(tipoDoc => {
                    const preview = previews[tipoDoc];
                    if (preview) {
                        if (preview.existente) {
                            // Mantener ruta original para archivos existentes
                            archivosActualizados[tipoDoc] = preview.rutaOriginal;
                        } else if (preview.file) {
                            // Para archivos nuevos, se procesarán en el backend
                            archivosActualizados[tipoDoc] = `nuevo_${tipoDoc}`;
                        }
                    }
                });
                
                resultado = await registrosPendientesService.actualizarRegistroPendiente(registro.dni, {
                    datos: formValues,
                    archivos: archivosActualizados,
                    timestamp: new Date().toISOString(),
                    tipo: 'DOCUMENTACION_INCOMPLETA'
                });
                
                console.log('📝 Respuesta de actualización:', resultado);
                
                // Verificar si la respuesta indica éxito
                if (resultado && (resultado.success === true || resultado.message?.includes('actualizado') || resultado.message?.includes('exitosamente'))) {
                    showSuccess('📝 Cambios guardados - Faltan documentos por completar');
                    onGuardado && onGuardado(registro, 'actualizado');
                } else if (resultado && resultado.success === false) {
                    throw new Error(resultado.message || 'Error al actualizar el registro');
                } else {
                    // Si no hay estructura de respuesta clara, considerar como éxito si no hay error
                    console.log('⚠️ Respuesta sin estructura clara, considerando como éxito');
                    showSuccess('📝 Cambios guardados - Faltan documentos por completar');
                    onGuardado && onGuardado(registro, 'actualizado');
                }
            }

            onClose();

        } catch (error) {
            console.error('❌ Error al procesar registro:', error);
            
            // Verificar si el "error" en realidad contiene un mensaje de éxito
            const errorMessage = error.message || error.toString();
            
            // Detectar mensajes de éxito que llegan como "error"
            if (errorMessage.includes('actualizado exitosamente') || 
                errorMessage.includes('completado exitosamente') ||
                (errorMessage.includes('exitosamente') && !errorMessage.toLowerCase().includes('error al')) ||
                errorMessage.includes('correctamente')) {
                console.log('🔄 Mensaje de éxito detectado en catch, mostrando como éxito');
                showSuccess('✅ Cambios guardados en pendientes');
                onGuardado && onGuardado(registro, 'actualizado');
                onClose();
                return;
            }
            
            // Si es un error real, mostrarlo como error
            showError(`Error al procesar el registro: ${errorMessage}`);
        } finally {
            setGuardando(false);
            if (setSubmitting) setSubmitting(false);
        }
    };

    // Función para eliminar registro
    const handleEliminar = async () => {
        if (!window.confirm('¿Está seguro de que desea eliminar este registro permanentemente?')) {
            return;
        }

        try {
            setGuardando(true);
            const resultado = await registrosPendientesService.eliminarRegistroPendiente(registro.dni);
            
            if (resultado.success) {
                showSuccess('🗑️ Registro eliminado de pendientes');
                onEliminado && onEliminado(registro);
                onClose();
            } else {
                throw new Error(resultado.message || 'Error al eliminar el registro');
            }
        } catch (error) {
            console.error('❌ Error al eliminar:', error);
            showError(`❌ Error: ${error.message}`);
        } finally {
            setGuardando(false);
        }
    };



    // Cargar archivos existentes en sessionStorage para que el hook los procese
    useEffect(() => {
        if (registro.archivos || registro.datos || registro.modalidad) {
            // Guardar todos los datos del registro en sessionStorage para que los componentes los procesen
            const datosRegistroPendiente = {
                archivosExistentes: registro.archivos || {},
                // Agregar datos para que PlanAnioSelector pueda acceder al módulo
                modalidad: registro.datos?.modalidad || registro.modalidad,
                modalidadId: initialValues.modalidadId,
                planAnio: registro.datos?.planAnio || registro.planAnio,
                modulos: registro.datos?.modulos || registro.modulos,
                idModulo: registro.datos?.idModulo || registro.idModulo || (registro.datos?.modulos ? [registro.datos.modulos] : [])
            };
            
            console.log('💾 Guardando datos en sessionStorage para modal:', datosRegistroPendiente);
            sessionStorage.setItem('datosRegistroPendiente', JSON.stringify(datosRegistroPendiente));
            
            // Procesar archivos existentes manualmente
            const previewsExistentes = {};
            Object.entries(registro.archivos).forEach(([tipoDocumento, rutaArchivo]) => {
                if (rutaArchivo) {
                    const rutaLimpia = rutaArchivo.replace(/\\/g, '/');
                    const nombreArchivo = rutaLimpia.split('/').pop();
                    const urlArchivo = `http://localhost:5000${rutaArchivo}`;
                    
                    const extension = nombreArchivo.split('.').pop().toLowerCase();
                    const tipoArchivo = extension === 'pdf' ? 'application/pdf' : 
                                      ['jpg', 'jpeg', 'png', 'gif'].includes(extension) ? `image/${extension}` : 
                                      'application/octet-stream';
                    
                    previewsExistentes[tipoDocumento] = {
                        url: urlArchivo,
                        type: tipoArchivo,
                        file: null,
                        existente: true,
                        uploaded: true,
                        rutaOriginal: rutaArchivo,
                        nombreArchivo: nombreArchivo
                    };
                }
            });
            
            // Actualizar previews con archivos existentes
            setPreviews(prevPreviews => ({
                ...prevPreviews,
                ...previewsExistentes
            }));
            
            console.log('📋 Archivos existentes cargados en modal:', previewsExistentes);
        }
    }, [registro, setPreviews, initialValues.modalidadId]);

    // Esquema de validación
    const validationSchema = Yup.object({
        nombre: Yup.string().required('Nombre es requerido'),
        apellido: Yup.string().required('Apellido es requerido'),
        dni: Yup.string()
            .matches(/^\d{8}$/, 'DNI debe tener 8 dígitos')
            .required('DNI es requerido'),
        email: Yup.string()
            .email('Email inválido')
            .required('Email es requerido'),
        telefono: Yup.string().required('Teléfono es requerido'),
        modalidad: Yup.string().required('Modalidad es requerida')
    });

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-container registro-modal-grande">
                
                <Formik
                    initialValues={initialValues}
                    validationSchema={validationSchema}
                    onSubmit={async (formValues, { setSubmitting }) => {
                        await handleSubmit(formValues, { setSubmitting });
                    }}
                    enableReinitialize={true}
                >
                    {({ values: formikValues, setFieldValue: formikSetFieldValue, isSubmitting }) => (
                        <Form encType="multipart/form-data">
                            
                            {/* Header igual que RegistroEstd */}
                            <div className="registro-header-container">
                                <div className="registro-header-row">
                                    <div className="registro-nav-left">
                                        {/* Volver está vacío aquí */}
                                    </div>
                                    <h2 className="modal-title-registro">
                                        📝 Completar Registro Pendiente
                                    </h2>
                                    <div className="registro-nav-right">
                                        <CloseButton onClose={onClose} variant="modal" />
                                    </div>
                                </div>
                            </div>

                            {/* Mensaje informativo sobre el registro */}
                            <div className="mensaje-registro-pendiente">
                                <h4>🔄 Completando Registro Pendiente</h4>
                                <p>
                                    Los datos del registro pendiente han sido cargados. 
                                    Complete o verifique la información y documentación para finalizar la inscripción.
                                </p>
                            </div>

                            {/* Estructura de formulario igual que RegistroEstd */}
                            <div className="formd">
                                <div className="form-datos">
                                    <DatosPersonales />
                                </div>
                                
                                <div className="form-domicilio">
                                    <Domicilio esAdmin={true} />
                                </div>
                                
                                <div className="form-eleccion">
                                    <ModalidadSelection
                                        modalidad={formikValues.modalidad}
                                        modalidadId={formikValues.modalidadId}
                                        setFieldValue={formikSetFieldValue}
                                        values={formikValues}
                                        showMateriasList={formikValues.planAnio !== '' && formikValues.modalidad !== ''}
                                        handleChange={(e) => {
                                            const { name, value } = e.target;
                                            formikSetFieldValue(name, value);
                                        }}
                                        editMode={{}}
                                        formData={{}}
                                        setFormData={() => {}}
                                    />
                                </div>
                                
                                <div className="left-container button-stack">
                                    <h4>Acciones</h4>
                                    
                                    <button 
                                        type="button" 
                                        className="boton-principal" 
                                        onClick={() => setIsModalOpen(true)}
                                    >
                                        Adjuntar Documentación
                                    </button>
                                    
                                    {guardando || isSubmitting ? (
                                        <BotonCargando loading={true}>
                                            Completando Registro...
                                        </BotonCargando>
                                    ) : (
                                        <button type="submit" className="boton-principal">
                                            ✅ Completar Registro
                                        </button>
                                    )}
                                    
                                    <EstadoInscripcion
                                        value={formikValues.idEstadoInscripcion}
                                        handleChange={e => formikSetFieldValue('idEstadoInscripcion', e.target.value)}
                                    />
                                    
                                    <button
                                        type="button"
                                        onClick={handleEliminar}
                                        disabled={guardando || isSubmitting}
                                        className="boton-eliminar"
                                    >
                                        🗑️ Eliminar Registro
                                    </button>
                                </div>
                                
                                {/* Modal de documentación igual que RegistroEstd */}
                                {isModalOpen && (
                                    <FormDocumentacion
                                        onClose={closeModal}
                                        previews={previews}
                                        handleFileChange={(e, field) => handleFileChange(e, field, formikSetFieldValue)}
                                        setFieldValue={formikSetFieldValue}
                                        onProceedToRegister={handleProceedToRegister}
                                    />
                                )}
                            </div>
                        </Form>
                    )}
                </Formik>
            </div>
        </div>
    );
};

ModalEditarRegistro.propTypes = {
    registro: PropTypes.object.isRequired,
    onClose: PropTypes.func.isRequired,
    onGuardado: PropTypes.func,
    onEliminado: PropTypes.func
};

export default ModalEditarRegistro;