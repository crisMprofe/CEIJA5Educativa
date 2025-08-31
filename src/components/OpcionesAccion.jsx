import PropTypes from 'prop-types';
import CloseButton from './CloseButton';
import "../estilos/opcionesModificar.css";

const OpcionesAccion = ({ accion, onSeleccion, onClose }) => {
    const configuraciones = {
        Consultar: {
            titulo: 'Seleccionar Tipo de Consulta',
            descripcion: 'Elija cómo desea consultar estudiantes',
            opcionDNI: {
                titulo: 'Consultar Estudiante por DNI',
                descripcion: 'Buscar un estudiante específico por su número de DNI',
                icono: '🔍'
            },
            opcionLista: {
                titulo: 'Consultar Estudiantes Inscriptos',
                descripcion: 'Ver lista completa de estudiantes inscriptos',
                icono: '📋'
            }
        },
        Modificar: {
            titulo: 'Seleccionar Tipo de Modificación',
            descripcion: 'Elija cómo desea modificar estudiantes',
            opcionDNI: {
                titulo: 'Modificar Estudiante por DNI',
                descripcion: 'Buscar un estudiante específico por su número de DNI',
                icono: '🔍'
            },
            opcionLista: {
                titulo: 'Modificar Estudiantes',
                descripcion: 'Ver lista completa de estudiantes y seleccionar uno para modificar',
                icono: '📋'
            }
        },
        Eliminar: {
            titulo: 'Seleccionar Tipo de Eliminación',
            descripcion: 'Elija cómo desea eliminar estudiantes',
            opcionDNI: {
                titulo: 'Eliminar Estudiante por DNI',
                descripcion: 'Buscar un estudiante específico por su número de DNI',
                icono: '🔍'
            },
            opcionLista: {
                titulo: 'Eliminar Estudiantes',
                descripcion: 'Ver lista completa de estudiantes y seleccionar uno para eliminar',
                icono: '📋'
            }
        }
    };

    const config = configuraciones[accion] || configuraciones.Consultar;

    return (
        <div className="modal-overlay">
            <div className="modal-modificar-container">
                <CloseButton onClose={onClose} />
                
                <div className="modificar-header">
                    <h2>{config.titulo}</h2>
                    <p>{config.descripcion}</p>
                </div>

                <div className="opciones-modificar-container">
                    <button 
                        className="opcion-modificar-button" 
                        onClick={() => onSeleccion('dni')}
                    >
                        <div className="opcion-icono">
                            {config.opcionDNI.icono}
                        </div>
                        <div className="opcion-contenido">
                            <h3>{config.opcionDNI.titulo}</h3>
                            <p>{config.opcionDNI.descripcion}</p>
                        </div>
                    </button>
                    
                    <button 
                        className="opcion-modificar-button" 
                        onClick={() => onSeleccion('lista')}
                    >
                        <div className="opcion-icono">
                            {config.opcionLista.icono}
                        </div>
                        <div className="opcion-contenido">
                            <h3>{config.opcionLista.titulo}</h3>
                            <p>{config.opcionLista.descripcion}</p>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
};

OpcionesAccion.propTypes = {
    accion: PropTypes.oneOf(['Consultar', 'Modificar', 'Eliminar']).isRequired,
    onSeleccion: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
};

export default OpcionesAccion;
