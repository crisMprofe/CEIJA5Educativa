import { useNavigate } from 'react-router-dom';
import { Formik } from 'formik';
import PropTypes from 'prop-types';
import useGestionDocumentacion from '../hooks/useGestionDocumentacion';
import { useInitialValues } from '../hooks/useInitialValues';
import { useRegistroWebData } from '../hooks/useRegistroWebData';
import { useSubmitHandler } from '../hooks/useSubmitHandler';
import { useAlerts } from '../hooks/useAlerts';
import AlertSystem from '../components/AlertSystem';
import GestionEstudianteView from './GestionEstudianteView';

const GestionEstudiante = ({ modalidad, accion, isAdmin, completarRegistro, isWebUser, onClose, onBack }) => {
    const navigate = useNavigate();
    
    // Hooks personalizados
    const {
        files,
        previews,
        alert: docAlert,
        setAlert: setDocAlert,
        handleFileChange,
        buildDetalleDocumentacion,
        resetArchivos,
    } = useGestionDocumentacion();

    const { completarWebParam, datosRegistroWeb } = useRegistroWebData(modalidad);
    const initialValues = useInitialValues(modalidad, completarRegistro, datosRegistroWeb);
    const { handleSubmit: handleSubmitForm } = useSubmitHandler(
        setDocAlert, 
        files, 
        previews, 
        resetArchivos, 
        buildDetalleDocumentacion
    );

    // Hooks adicionales para mejor funcionalidad
    const { alert, showError, showSuccess, hideAlert } = useAlerts();

    // Wrapper para el handleSubmit que incluye los parámetros específicos del componente
    const handleSubmit = async (values, formikBag) => {
        try {
            const result = await handleSubmitForm(
                values, 
                formikBag, 
                accion, 
                isAdmin, 
                isWebUser, 
                completarWebParam, 
                modalidad
            );
            
            if (result?.success) {
                showSuccess(result.message || 'Operación completada exitosamente');
            } else if (result?.error) {
                showError(result.error);
            }
        } catch (error) {
            showError('Error inesperado durante el envío del formulario');
            console.error('Error en handleSubmit:', error);
        }
    };

    // Función simplificada para manejo de archivos - usar solo useGestionDocumentacion
    const handleFileChangeWithValidation = (e, field, setFieldValue) => {
        // Pasar directamente al hook useGestionDocumentacion
        handleFileChange(e, field, setFieldValue);
    };

    return (
        <>
            <AlertSystem alert={alert} onClose={hideAlert} />
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
                        alert={docAlert}
                        setAlert={setDocAlert}
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
};

export default GestionEstudiante;