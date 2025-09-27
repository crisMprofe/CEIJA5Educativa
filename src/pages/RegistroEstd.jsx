import { Form } from 'formik';
import { useState, useMemo } from 'react';
import CloseButton from '../components/CloseButton';
import VolverButton from '../components/VolverButton';
import ModalidadSelection from '../components/ModalidadSelection';
import FormDocumentacion from '../components/FormDocumentacion';
import VerificadorRegistroPendiente from '../components/VerificadorRegistroPendiente';
import { DatosPersonales } from '../components/DatosPersonales';
import { Domicilio } from '../components/Domicilio';
import AlertaMens from '../components/AlertaMens';
import PropTypes from 'prop-types';
import '../estilos/estilosInscripcion.css';
import '../estilos/botones.css';
import EstadoInscripcion from '../components/EstadoInscripcion';
import BotonCargando from '../components/BotonCargando';

const RegistroEstd = ({
    previews,
    handleFileChange,
    handleChange,
    handleSubmit,
    alert,
    setAlert,
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
    // Estado requerido por ModalidadSelection (solo formData)
    const [formData, setFormData] = useState({});
    // Estados para manejo de registros pendientes - No mostrar si se está completando un registro desde URL
    const [showVerificador, setShowVerificador] = useState(!completarRegistro);

    const closeModal = () => {
        setIsModalOpen(false);
    };

    // Funciones para manejo de registro pendiente
    const handleRegistroCompleto = (registroData) => {
        console.log('🔄 Completando registro pendiente:', registroData);
        setShowVerificador(false);
        
        // Pre-llenar el formulario con los datos del registro pendiente
        if (registroData) {
            setFieldValue('dni', registroData.dni || '');
            setFieldValue('nombre', registroData.nombre || '');
            setFieldValue('apellido', registroData.apellido || '');
            setFieldValue('modalidad', registroData.modalidad || '');
            if (registroData.modalidadId) {
                setFieldValue('modalidadId', registroData.modalidadId);
            }
        }
        
        setAlert({ 
            text: '📝 Formulario cargado con datos del registro pendiente. Complete la documentación para finalizar la inscripción.', 
            variant: 'info' 
        });
    };

    const handleSinRegistro = () => {
        console.log('✨ Sin registro pendiente, formulario nuevo');
        setShowVerificador(false);
    };

    // Memoizar el cálculo para evitar re-renders innecesarios
    const showMateriasList = useMemo(() => {
        return values.planAnio !== '' && values.modalidad !== '';
    }, [values.planAnio, values.modalidad]);

    // Función para proceder al registro desde el modal de documentación
    const handleProceedToRegister = () => {
        closeModal(); // Cerrar el modal primero
        // Validar estado de inscripción antes de proceder
        if (!values.idEstadoInscripcion) {
            setAlert({ text: 'Debe seleccionar un estado de inscripción.', variant: 'error' });
            return;
        }
        // Proceder con el registro
        handleSubmit(values, { setSubmitting: () => {} });
    };

    const customHandleSubmit = (e) => {
        e.preventDefault();
        if (!values.idEstadoInscripcion) {
            setAlert({ text: 'Debe seleccionar un estado de inscripción.', variant: 'error' });
            return;
        }
        handleSubmit(values, { setSubmitting: () => {} });
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
                <div style={{
                    background: 'linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%)',
                    border: '1px solid #2196f3',
                    borderRadius: '8px',
                    padding: '15px',
                    margin: '15px 0',
                    textAlign: 'center'
                }}>
                    <h4 style={{ color: '#1976d2', margin: '0 0 8px 0' }}>
                        🔄 Completando Registro Pendiente
                    </h4>
                    <p style={{ color: '#424242', margin: 0, fontSize: '0.9rem' }}>
                        Los datos del registro pendiente han sido cargados automáticamente. 
                        Complete la documentación faltante para finalizar la inscripción.
                    </p>
                </div>
            )}

            <div className="formd">
                    <DatosPersonales />
                    <Domicilio esAdmin={isAdmin} />
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
                        <button type="button" className="boton-principal" onClick={() => setIsModalOpen(true)}>
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
            {alert.text && <AlertaMens text={alert.text} variant={alert.variant} />}
        </Form>
    );
};

RegistroEstd.propTypes = {
    previews: PropTypes.object.isRequired,
    handleFileChange: PropTypes.func.isRequired,
    handleChange: PropTypes.func.isRequired,
    handleSubmit: PropTypes.func.isRequired,
    alert: PropTypes.object.isRequired,
    setAlert: PropTypes.func.isRequired,
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