import PropTypes from 'prop-types';
import RegistroEstd from './RegistroEstd';
import AlertaMens from '../components/AlertaMens';
import '../estilos/estilosInscripcion.css';

const GestionEstudianteView = ({
    onClose,
    onBack, // Nuevo prop para navegación hacia atrás
    alert,
    setAlert,
    previews,
    handleFileChange,
    handleChange,
    accion,
    handleSubmit,
    setFieldValue,
    values,
    isAdmin,
    isWebUser, // Nuevo prop para usuario web
    isSubmitting,
    completarRegistro // Nuevo prop para completar registro
}) => {
    return (
        <div className={`formulario-inscripcion-${isAdmin ? 'adm' : 'est'}`}>
            {/* Botones manejados directamente por RegistroEstd - No duplicar aquí */}
            
            {alert.text && <AlertaMens text={alert.text} variant={alert.variant} />}

            <RegistroEstd
                modalidad={values.modalidad}
                previews={previews}
                handleFileChange={handleFileChange}
                handleChange={handleChange}
                alert={alert}
                setAlert={setAlert}
                accion={accion}
                handleSubmit={handleSubmit}
                setFieldValue={setFieldValue}
                values={values}
                isAdmin={isAdmin}
                isWebUser={isWebUser} // Pasar prop de usuario web
                isSubmitting={isSubmitting}
                completarRegistro={completarRegistro} // Pasar el prop
                onClose={onClose} // Botón cerrar
                onVolver={onBack} // Botón volver - usar onBack
            />
        </div>
    );
};

GestionEstudianteView.propTypes = {
    onClose: PropTypes.func,
    onBack: PropTypes.func, // Función para navegación hacia atrás
    navigate: PropTypes.func,
    alert: PropTypes.object.isRequired,
    setAlert: PropTypes.func.isRequired,
    previews: PropTypes.object.isRequired,
    handleFileChange: PropTypes.func.isRequired,
    handleChange: PropTypes.func.isRequired,
    accion: PropTypes.string.isRequired,
    handleSubmit: PropTypes.func.isRequired,
    setFieldValue: PropTypes.func.isRequired,
    values: PropTypes.object.isRequired,
    isAdmin: PropTypes.bool.isRequired,
    isWebUser: PropTypes.bool, // Indicar si es usuario web
    isSubmitting: PropTypes.bool.isRequired,
    completarRegistro: PropTypes.string, // DNI del registro a completar
};

export default GestionEstudianteView;
