import PropTypes from 'prop-types';
import CloseButton from './CloseButton';
import "../estilos/opcionesModificar.css";
import "../estilos/estilosInscripcion.css"; // Importa los estilos para modal-header-buttons

const ConsultaOpciones = ({ onSeleccion, titulo = "", onClose, tituloModal = "Seleccionar Tipo de Consulta", descripcionModal = "Elija cómo desea consultar estudiantes", esModificacion = false }) => {
    return (
        <div className="modal-overlay">
            <div className="modal-modificar-container">
                {/* Contenedor de botones superior */}
                <div className="modal-header-buttons">
                    {onClose && (
                        <CloseButton onClose={onClose} variant="simple" />
                    )}
                </div>
                
                <div className="modificar-header">
                    <h2>{tituloModal}</h2>
                    <p>{descripcionModal}</p>
                </div>

                <div className="opciones-modificar-container">
                    <button 
                        className="opcion-modificar-button" 
                        onClick={() => onSeleccion('dni')}
                    >
                        <div className="opcion-icono">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="8"/>
                                <path d="m21 21-4.35-4.35"/>
                            </svg>
                        </div>
                        <div className="opcion-contenido">
                            <h3>{titulo}{esModificacion ? "Modificar Estudiante por DNI" : titulo.includes("Eliminar") ? "Estudiante por DNI" : "Buscar Estudiante por DNI"}</h3>
                            <p>Buscar un estudiante específico por su número de DNI</p>
                        </div>
                    </button>
                    
                    <button 
                        className="opcion-modificar-button" 
                        onClick={() => onSeleccion('inscripciones')}
                    >
                        <div className="opcion-icono">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M3 6h18"/>
                                <path d="M3 12h18"/>
                                <path d="M3 18h18"/>
                            </svg>
                        </div>
                        <div className="opcion-contenido">
                            <h3>{titulo}{esModificacion ? "Modificar Estudiantes" : titulo.includes("Eliminar") ? "Estudiantes" : "Ver Todos los Estudiantes"}</h3>
                            <p>{esModificacion ? "Ver lista completa de estudiantes y seleccionar uno para modificar" : titulo.includes("Eliminar") ? "Ver lista completa de estudiantes y seleccionar uno para eliminar" : "Ver lista completa de estudiantes inscriptos en el sistema"}</p>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
};

ConsultaOpciones.propTypes = {
    onSeleccion: PropTypes.func.isRequired,
    titulo: PropTypes.string, // Prop opcional para personalizar el título
    onClose: PropTypes.func,
    tituloModal: PropTypes.string,
    descripcionModal: PropTypes.string,
    esModificacion: PropTypes.bool, // Indica si está en modo modificación
};

export default ConsultaOpciones;