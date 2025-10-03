import { useNavigate } from 'react-router-dom';
import { Formik } from 'formik';
import PropTypes from 'prop-types';
import useGestionDocumentacion from '../hooks/useGestionDocumentacion';
import { useInitialValues } from '../hooks/useInitialValues';
import { useRegistroWebData } from '../hooks/useRegistroWebData';
import { useSubmitHandler } from '../hooks/useSubmitHandler';
import { useGlobalAlerts } from '../hooks/useGlobalAlerts';
import GestionEstudianteView from './GestionEstudianteView';

const GestionEstudiante = ({ modalidad, accion, isAdmin, completarRegistro, isWebUser, onClose, onBack, datosRegistroPendiente }) => {
    const navigate = useNavigate();
    
    // Hooks personalizados
    const {
        files,
        previews,
        handleFileChange,
        buildDetalleDocumentacion,
        resetArchivos,
    } = useGestionDocumentacion();

    const { completarWebParam, datosRegistroWeb } = useRegistroWebData(modalidad);
    const initialValues = useInitialValues(modalidad, completarRegistro, datosRegistroWeb, datosRegistroPendiente);
    const { handleSubmit: handleSubmitForm } = useSubmitHandler(
        (alertData) => {
            // Usar el sistema de alertas principal (AlertSystem) en lugar de docAlert
            if (alertData.variant === 'success') {
                showSuccess(alertData.text);
            } else if (alertData.variant === 'error') {
                showError(alertData.text);
            } else if (alertData.variant === 'warning') {
                showWarning(alertData.text);
            } else {
                showInfo(alertData.text);
            }
        }, 
        files, 
        previews, 
        resetArchivos, 
        buildDetalleDocumentacion
    );

    // Hooks adicionales para mejor funcionalidad
    const { showError, showSuccess, showWarning, showInfo } = useGlobalAlerts();

    // Wrapper para el handleSubmit que incluye los parámetros específicos del componente
    const handleSubmit = async (values, formikBag) => {
        // El useSubmitHandler ya maneja todos los mensajes a través de la función setAlert que pasamos
        await handleSubmitForm(
            values, 
            formikBag, 
            accion, 
            isAdmin, 
            isWebUser, 
            completarWebParam, 
            modalidad
        );
    };

    // Función simplificada para manejo de archivos - usar solo useGestionDocumentacion
    const handleFileChangeWithValidation = (e, field, setFieldValue) => {
        // Pasar directamente al hook useGestionDocumentacion
        handleFileChange(e, field, setFieldValue);
    };

    return (
        <>

            <Formik
                initialValues={initialValues}
                onSubmit={handleSubmit}
            >
                {(formikProps) => (
                    <GestionEstudianteView
                        onClose={onClose}
                        onBack={onBack}
                        navigate={navigate}
                        previews={previews}
                        setAlert={(alertData) => {
                            // Usar el sistema de alertas principal (AlertSystem)
                            if (alertData.variant === 'success') {
                                showSuccess(alertData.text);
                            } else if (alertData.variant === 'error') {
                                showError(alertData.text);
                            } else if (alertData.variant === 'warning') {
                                showWarning(alertData.text);
                            } else {
                                showInfo(alertData.text);
                            }
                        }}
                        accion={accion}
                        isAdmin={isAdmin}
                        isWebUser={isWebUser}
                        handleFileChange={handleFileChangeWithValidation}
                        completarRegistro={completarRegistro}
                        completarRegistroWeb={completarWebParam}
                        datosRegistroWeb={datosRegistroWeb}
                        {...formikProps}
                    />
                )}
            </Formik>
        </>
    );
};

GestionEstudiante.propTypes = {
    modalidad: PropTypes.string.isRequired,
    accion: PropTypes.string.isRequired,
    isAdmin: PropTypes.bool.isRequired,
    completarRegistro: PropTypes.string,
    isWebUser: PropTypes.bool,
    onClose: PropTypes.func.isRequired,
    onBack: PropTypes.func,
    datosRegistroPendiente: PropTypes.object,
};

export default GestionEstudiante;