import PropTypes from 'prop-types';
import '../estilos/consultaOpc.css'; // Usar los mismos estilos que ConsultaOpciones

const OpcionesEliminar = ({ onSeleccion, onClose }) => {
    return (
        <div className="modal-overlay">
            <div className="consulta-opciones">
                {/* Botón de cerrar */}
                <button className="btn-cerrar" onClick={onClose}>
                    ✖
                </button>

                {/* Header del modal */}
                <div className="modal-header">
                    <h2 className="modal-title">Seleccionar tipo de eliminación</h2>
                    <p className="modal-subtitle">Elija cómo desea eliminar estudiantes</p>
                </div>

                {/* Opciones */}
                <div className="opciones-grid">
                    <div className="opcion-card" onClick={() => onSeleccion('dni')}>
                        <div className="opcion-icon">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8"/>
                                <path d="m21 21-4.35-4.35"/>
                            </svg>
                        </div>
                        <h3>Eliminar Estudiante por DNI</h3>
                        <p>Buscar un estudiante específico por su número de DNI</p>
                    </div>

                    <div className="opcion-card" onClick={() => onSeleccion('lista')}>
                        <div className="opcion-icon">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 6h18"/>
                                <path d="M3 12h18"/>
                                <path d="M3 18h18"/>
                            </svg>
                        </div>
                        <h3>Ver a todos los estudiantes</h3>
                        <p>Ver lista completa de estudiantes inscriptos en el sistema</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

OpcionesEliminar.propTypes = {
    onSeleccion: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
};

export default OpcionesEliminar;
