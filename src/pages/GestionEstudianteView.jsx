import PropTypes from 'prop-types';
import RegistroEstd from './RegistroEstd';
import AlertaMens from '../components/AlertaMens';
import CloseButton from '../components/CloseButton';
import VolverButton from '../components/VolverButton';
import '../estilos/estilosInscripcion.css';

const GestionEstudianteView = ({
    onClose,
    alert,
    setAlert,
    previews,
    handleFileChange,
    handleChange,
    accion,
    resetForm,
    handleSubmit,
    resetArchivos,
    setFieldValue,
    values,
    isAdmin,
    isSubmitting
}) => {
    return (
        <div className={`formulario-inscripcion-${isAdmin ? 'adm' : 'est'}`}>
            {/* Contenedor de botones superior */}
            <div className="modal-header-buttons">
                {onClose && (
                    <VolverButton onClick={onClose} />
                )}
                {onClose && (
                    <CloseButton onClose={onClose} variant="modal" />
                )}
            </div>

            {alert.text && <AlertaMens text={alert.text} variant={alert.variant} />}

            <RegistroEstd
                modalidad={values.modalidad}
                previews={previews}
                handleFileChange={handleFileChange}
                handleChange={handleChange}
                alert={alert}
                setAlert={setAlert}
                accion={accion}
                resetForm={resetForm}
                handleSubmit={handleSubmit}
                handleReset={resetArchivos}
                setFieldValue={setFieldValue}
                values={values}
                isAdmin={isAdmin}
                isSubmitting={isSubmitting}
                onClose={null} // No mostrar el botón de cerrar en RegistroEstd
            />
        </div>
    );
};

GestionEstudianteView.propTypes = {
    onClose: PropTypes.func,
    navigate: PropTypes.func,
    alert: PropTypes.object.isRequired,
    setAlert: PropTypes.func.isRequired,
    previews: PropTypes.object.isRequired,
    handleFileChange: PropTypes.func.isRequired,
    handleChange: PropTypes.func.isRequired,
    accion: PropTypes.string.isRequired,
    resetForm: PropTypes.func.isRequired,
    handleSubmit: PropTypes.func.isRequired,
    resetArchivos: PropTypes.func.isRequired,
    setFieldValue: PropTypes.func.isRequired,
    values: PropTypes.object.isRequired,
    isAdmin: PropTypes.bool.isRequired,
    isSubmitting: PropTypes.bool.isRequired
};

export default GestionEstudianteView;
