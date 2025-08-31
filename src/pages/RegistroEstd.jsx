import { Form } from 'formik';import { useState, useMemo } from 'react';
import ModalidadSelection from '../components/ModalidadSelection';
import FormDocumentacion from '../components/FormDocumentacion';
import { DatosPersonales } from '../components/DatosPersonales';
import { Domicilio } from '../components/Domicilio';
import AlertaMens from '../components/AlertaMens';
import PropTypes from 'prop-types';
import '../estilos/estilosInscripcion.css';
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
    resetForm,
    handleReset,
    values,
    setFieldValue,
    isAdmin,
    onClose
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    // Estado requerido por ModalidadSelection (solo formData)
    const [formData, setFormData] = useState({});

    const closeModal = () => {
        setIsModalOpen(false);
    };

    // Memoizar el cálculo para evitar re-renders innecesarios
    const showMateriasList = useMemo(() => {
        return values.planAnio !== '' && values.modalidad !== '';
    }, [values.planAnio, values.modalidad]);

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
            <div className="formd">
                <DatosPersonales />
                <Domicilio />
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
            <div className="left-container">
                        <button type="button" className="buttonD" onClick={() => setIsModalOpen(true)}>
                            Adjuntar Documentación
                        </button>
                        {isAdmin && (
                            <EstadoInscripcion
                                value={values.idEstadoInscripcion}
                                handleChange={e => setFieldValue('idEstadoInscripcion', e.target.value)}
                            />
                        )}
            </div>
            <div className="right-container">
                        {accion === "Eliminar" ? (
                                <button
                                    type="button"
                                    className="buttonF"
                                    onClick={() => {
                                        handleSubmit(values, { setSubmitting: () => {} }); // Llama a la función de eliminación
                                    }}
                                >
                                    Confirmar eliminación
                                </button>
                        ) : isSubmitting ? (
                            <BotonCargando loading={true}>{accion || "Registrando..."}</BotonCargando>
                        ) : (
                            <>
                                <button type="submit" className="buttonF">{accion || "Registrar"}</button>
                                <button
                                    type="button"
                                    className="buttonF"
                                    onClick={() => {
                                        handleReset(); // tu función personalizada
                                        resetForm();   // resetea los campos de Formik
                                    }}
                                >
                                    Limpiar
                                </button>
                                {onClose && (
                                    <button
                                        type="button"
                                        className="buttonF button-close"
                                        onClick={onClose}
                                    >
                                        Cerrar
                                    </button>
                                )}
                            </>
                        )}
            </div>
                
                {isModalOpen && (
                    <FormDocumentacion
                        onClose={closeModal}
                        previews={previews}
                        handleFileChange={(e, field) => handleFileChange(e, field, setFieldValue)}
                        setFieldValue={setFieldValue}
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
    resetForm: PropTypes.func.isRequired,
    handleReset: PropTypes.func,
    accion: PropTypes.string,
    isAdmin: PropTypes.bool.isRequired,
    isSubmitting: PropTypes.bool.isRequired,
    onClose: PropTypes.func,
};

export default RegistroEstd;