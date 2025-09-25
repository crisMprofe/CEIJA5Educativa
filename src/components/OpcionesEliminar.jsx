import PropTypes from 'prop-types';
import CloseButton from './CloseButton';
import '../estilos/consultaOpc.css';

const OpcionesEliminar = ({ onSeleccion, onClose }) => {
    return (
        <div className="consulta-opciones opciones-accion-flujo">
            {/* Botón de cerrar */}
            <button className="boton-principal" onClick={onClose}>
                ✖
            </button>
            {/* Header del modal */}
            <div className="modal-header">
                <h2 className="modal-title">Seleccionar tipo de eliminación</h2>
                <p className="modal-subtitle">Elija cómo desea eliminar estudiantes</p>
                    <div className="modal-header-buttons">
                        <CloseButton onClose={onClose} variant="modal" />
                    </div>
            </div>
            {/* Opciones */}
            <div className="opciones-grid">
                <button className="boton-principal" onClick={() => onSeleccion('dni')} style={{marginBottom: '12px'}}>
                    <div className="opcion-icon">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8"/>
                            <path d="m21 21-4.35-4.35"/>
                        </svg>
                    </div>
                    <span style={{marginLeft: '8px', textAlign: 'left'}}>
                        <h3 style={{margin: 0}}>Eliminar Estudiante por DNI</h3>
                        <p style={{margin: 0}}>Buscar un estudiante específico por su número de DNI</p>
                    </span>
                </button>
                <button className="boton-principal" onClick={() => onSeleccion('lista')}>
                    <div className="opcion-icon">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 6h18"/>
                            <path d="M3 12h18"/>
                            <path d="M3 18h18"/>
                        </svg>
                    </div>
                    <span style={{marginLeft: '8px', textAlign: 'left'}}>
                        <h3 style={{margin: 0}}>Ver a todos los estudiantes</h3>
                        <p style={{margin: 0}}>Ver lista completa de estudiantes inscriptos en el sistema</p>
                    </span>
                </button>
            </div>
        </div>
    );
};

OpcionesEliminar.propTypes = {
    onSeleccion: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
};

export default OpcionesEliminar;
