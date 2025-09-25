import PropTypes from 'prop-types';
import CloseButton from './CloseButton';
import "../estilos/opcionesModificar.css";

const OpcionesModificar = ({ onSeleccion, onClose }) => {
    return (
        <div className="modal-modificar-container opciones-accion-flujo">
                <div className="modal-header-buttons">
                    <CloseButton onClose={onClose} variant="modal" />
                </div>
            <div className="modificar-header">
                <h2>Seleccionar Tipo de Modificación</h2>
                <p>Elija cómo desea modificar estudiantes</p>
            </div>
            <div className="opciones-modificar-container">
                <button 
                    className="opcion-modificar-button" 
                    onClick={() => onSeleccion('dni')}
                >
                    <div className="opcion-icono">
                        🔍
                    </div>
                    <div className="opcion-contenido">
                        <h3>Modificar Estudiante por DNI</h3>
                        <p>Buscar un estudiante específico por su número de DNI</p>
                    </div>
                </button>
                <button 
                    className="opcion-modificar-button" 
                    onClick={() => onSeleccion('lista')}
                >
                    <div className="opcion-icono">
                        📋
                    </div>
                    <div className="opcion-contenido">
                        <h3>Modificar Estudiantes</h3>
                        <p>Ver lista completa de estudiantes y seleccionar uno para modificar</p>
                    </div>
                </button>
            </div>
        </div>
    );
};

OpcionesModificar.propTypes = {
    onSeleccion: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
};

export default OpcionesModificar;
