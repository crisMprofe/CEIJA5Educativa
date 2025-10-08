import { Form } from 'formik';
import { useState, useMemo } from 'react';
// (Eliminado import duplicado de useEffect)
import CloseButton from '../components/CloseButton';
import VolverButton from '../components/VolverButton';
import ModalidadSelection from '../components/ModalidadSelection';
import FormDocumentacion from '../components/FormDocumentacion';
import VerificadorRegistroPendiente from '../components/VerificadorRegistroPendiente';
import { DatosPersonales } from '../components/DatosPersonales';
import { Domicilio } from '../components/Domicilio';
import PropTypes from 'prop-types';
import '../estilos/estilosInscripcion.css';
import '../estilos/botones.css';
import '../estilos/RegistroEstd.css';
import '../estilos/FormularioMejorado.css';
import EstadoInscripcion from '../components/EstadoInscripcion';
import BotonCargando from '../components/BotonCargando';
import { useContext } from 'react';
import { AlertContext } from '../context/alertContextDefinition';

const RegistroEstd = ({
    previews,
    handleFileChange,
    handleChange,
    handleSubmit,
    isSubmitting,
    accion,
    values,
    setFieldValue,
    isAdmin,
    isWebUser, // Nuevo prop para usuario web
    onClose,
    onVolver,
    completarRegistro // Nuevo prop para detectar si se está completando un registro
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Limpiar archivos/documentos y sessionStorage justo ANTES de abrir el modal de documentación para un registro nuevo
    const handleAbrirModalDocumentacion = () => {
        if ((isWebUser || isAdmin) && accion === 'Registrar') {
            if (typeof setFieldValue === 'function') {
                setFieldValue('archivos', {});
                setFieldValue('previews', {});
            }
            // Limpieza extra: eliminar posibles archivos/previews de la sesión
            sessionStorage.removeItem('datosRegistroWeb');
            sessionStorage.removeItem('datosRegistroPendiente');
            // Limpieza extra: si existen variables globales o en window
            if (window.archivos) window.archivos = {};
            if (window.previews) window.previews = {};
        }
        // Refuerzo: limpiar previews y archivos en el objeto values si existen
        if (values && values.previews) values.previews = {};
        if (values && values.archivos) values.archivos = {};
        setIsModalOpen(false); // Cierra primero por si quedó abierto
        setTimeout(() => setIsModalOpen(true), 0); // Reabre limpio
    };
    // Estado requerido por ModalidadSelection (solo formData)
    const [formData, setFormData] = useState({});
    // Estados para manejo de registros pendientes - No mostrar si se está completando un registro desde URL
    const [showVerificador, setShowVerificador] = useState(!completarRegistro);
    const { showError } = useContext(AlertContext);

    const closeModal = () => {
        setIsModalOpen(false);
    };

    // Funciones para manejo de registro pendiente
    const handleRegistroCompleto = (registroData) => {
        console.log('🔄 Completando registro pendiente:', registroData);
        setShowVerificador(false);
        // Pre-llenar TODOS los campos del formulario con los datos del registro pendiente/web
        if (registroData) {
            // Datos personales
            setFieldValue('dni', registroData.dni || '');
            setFieldValue('nombre', registroData.nombre || '');
            setFieldValue('apellido', registroData.apellido || '');
            setFieldValue('modalidad', registroData.modalidad || '');
            setFieldValue('modalidadId', registroData.modalidadId || '');
            setFieldValue('tipoDocumento', registroData.tipoDocumento || 'DNI');
            setFieldValue('cuil', registroData.cuil || '');
            setFieldValue('email', registroData.email || '');
            setFieldValue('telefono', registroData.telefono || '');
            setFieldValue('fechaNacimiento', registroData.fechaNacimiento || '');
            setFieldValue('paisEmision', registroData.paisEmision || '');
            // Domicilio
            setFieldValue('calle', registroData.calle || '');
            setFieldValue('numero', registroData.numero || '');
            setFieldValue('provincia', registroData.provincia || '');
            setFieldValue('localidad', registroData.localidad || '');
            setFieldValue('barrio', registroData.barrio || '');
        }
        // Registro completado silenciosamente, sin mensaje molesto
    };

    const handleSinRegistro = () => {
        console.log('✨ Sin registro pendiente, formulario nuevo');
        setShowVerificador(false);
    };

    // Memoizar el cálculo para evitar re-renders innecesarios
    const showMateriasList = useMemo(() => {
        return values.planAnio !== '' && values.modalidad !== '';
    }, [values.planAnio, values.modalidad]);

    // Función para cerrar el modal de documentación (solo cerrar, no procesar)
    const handleProceedToRegister = () => {
        closeModal(); // Solo cerrar el modal, el registro se hará con el botón "Registrar"
    };

    const customHandleSubmit = async (e) => {
        e.preventDefault();
        if (!values.idEstadoInscripcion) {
            showError('Debe seleccionar un estado de inscripción.');
            return;
        }

        // Usar el handleSubmit del hook que maneja todo el flujo correctamente
        const result = await handleSubmit(values, { 
            setSubmitting: () => {}, 
            resetForm: () => {} 
        }, accion, isAdmin, isWebUser, completarRegistro, values.modalidad, null);

        // Mostrar feedback según resultado
        if (result && result.success) {
            if (result.migradoABaseDatos) {
                // Registro completo y guardado en BD
                if (window?.showSuccess) window.showSuccess('✅ Registro completado y guardado en la base de datos');
                else alert('✅ Registro completado y guardado en la base de datos');
            } else if (result.migradoAPendientes) {
                // Documentación incompleta, movido a pendientes
                if (window?.showWarning) window.showWarning('⚠️ Documentación incompleta. El registro se movió a pendientes');
                else alert('⚠️ Documentación incompleta. El registro se movió a pendientes');
            } else {
                // Registro exitoso pero sin detalle
                if (window?.showSuccess) window.showSuccess('✅ Registro procesado correctamente');
                else alert('✅ Registro procesado correctamente');
            }
        } else {
            // Error
            if (window?.showError) window.showError(result?.message || '❌ Error al procesar el registro');
            else alert(result?.message || '❌ Error al procesar el registro');
        }

        // Si es usuario web y el registro fue exitoso, redirigir al home
        if (isWebUser && result && result.success) {
            window.location.href = '/';
        }
    };

    return (
        <Form encType="multipart/form-data" onSubmit={customHandleSubmit}>
            {/* Header con título y botones bien organizados */}
            <div className="registro-header-container">
                <div className="registro-header-row">
                    <div className="registro-nav-left">
                        {onVolver && <VolverButton onClick={onVolver} />}
                    </div>
                    <h2 className="modal-title-registro">
                        {accion === 'Eliminar' ? 'Eliminar Estudiante' : accion === 'Modificar' ? 'Modificar Estudiante' : 'Registro de Estudiante'}
                    </h2>
                    <div className="registro-nav-right">
                        {onClose && <CloseButton onClose={onClose} variant="modal" />}
                    </div>
                </div>
            </div>

            {/* Verificador de registros pendientes - Solo para nuevos registros */}
            {accion !== 'Eliminar' && accion !== 'Modificar' && showVerificador && (
                <VerificadorRegistroPendiente
                    dni={values.dni}
                    onRegistroCompleto={handleRegistroCompleto}
                    onSinRegistro={handleSinRegistro}
                />
            )}

            {/* Mensaje informativo cuando se está completando un registro */}
            {completarRegistro && (
                <div className="mensaje-registro-pendiente">
                    <h4>🔄 Completando Registro Pendiente</h4>
                    <p>
                        Los datos del registro pendiente han sido cargados automáticamente. 
                        Complete la documentación faltante para finalizar la inscripción.
                    </p>
                </div>
            )}

            <div className="formd">
                <div className="form-datos">
                    <DatosPersonales />
                </div>
                <div className="form-domicilio">
                    <Domicilio esAdmin={isAdmin} />
                </div>
                <div className="form-eleccion">
                    <ModalidadSelection
                        modalidad={values.modalidad}
                        modalidadId={values.modalidadId}
                        setFieldValue={setFieldValue}
                        values={values}
                        showMateriasList={showMateriasList}
                        handleChange={handleChange}
                        editMode={{}}
                        formData={formData}
                        setFormData={setFormData}
                    />
                </div>
                <div className="left-container button-stack">
                    <h4>Acciones</h4>
                    <button type="button" className="boton-principal" onClick={handleAbrirModalDocumentacion}>
                        Adjuntar Documentación
                    </button>
                        {accion === "Eliminar" ? (
                            <button
                                type="button"
                                className="boton-principal"
                                onClick={() => {
                                    handleSubmit(values, { setSubmitting: () => {} }); // Llama a la función de eliminación
                                }}
                            >
                                Confirmar eliminación
                            </button>
                        ) : isSubmitting ? (
                            <BotonCargando loading={true}>{accion || "Registrando..."}</BotonCargando>
                        ) : (
                            <button type="submit" className="boton-principal">{accion || "Registrar"}</button>
                        )}
                        {/* Solo mostrar EstadoInscripcion para admins y NO para usuarios web */}
                        {isAdmin && !isWebUser && (
                            <EstadoInscripcion
                                value={values.idEstadoInscripcion}
                                handleChange={e => setFieldValue('idEstadoInscripcion', e.target.value)}
                            />
                        )}
                    </div>
                    {isModalOpen && (
                        <FormDocumentacion
                            onClose={closeModal}
                            previews={previews}
                            handleFileChange={(e, field) => handleFileChange(e, field, setFieldValue)}
                            setFieldValue={setFieldValue}
                            onProceedToRegister={handleProceedToRegister}
                        />
                    )}
                </div>
        </Form>
    );
};

RegistroEstd.propTypes = {
    previews: PropTypes.object.isRequired,
    handleFileChange: PropTypes.func.isRequired,
    handleChange: PropTypes.func.isRequired,
    handleSubmit: PropTypes.func.isRequired,
    values: PropTypes.object.isRequired,
    setFieldValue: PropTypes.func.isRequired,
    accion: PropTypes.string,
    isAdmin: PropTypes.bool.isRequired,
    isWebUser: PropTypes.bool, // Indicar si es usuario web
    isSubmitting: PropTypes.bool.isRequired,
    onClose: PropTypes.func,
    onVolver: PropTypes.func,
    completarRegistro: PropTypes.string, // DNI del registro a completar
};

export default RegistroEstd;