import { useState } from 'react';
import PropTypes from 'prop-types';
import '../estilos/busquedaDNI.css'; // Importa los estilos propios
import serviceDatos from '../services/serviceDatos';
import BotonCargando from '../components/BotonCargando'; // ajusta la ruta si cambia
import Input from '../components/Input'; // Importa el componente Input
import CloseButton from '../components/CloseButton'; // Importa el componente CloseButton
import VolverButton from '../components/VolverButton'; // Importa el componente VolverButton
import '../estilos/Modal.css'; // Importa los estilos del modal
import '../estilos/estilosInscripcion.css';
import '../estilos/botonCargando.css';


const BusquedaDNI = ({
    onEstudianteEncontrado,
    onClose,
    onVolver,
    modalidadId,
    esConsultaDirecta = false,
    modoModificacion = false,
    modoEliminacion = false
}) => {
    const [dni, setDni] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    // Log de depuración para modalidadId
    console.log('🟦 modalidadId en BusquedaDNI:', modalidadId);


    const handleChange = (e) => {
        // Solo permitir números en el input
        const soloDigitos = e.target.value.replace(/\D/g, '');
        setDni(soloDigitos);
        if (error) setError(null);
    };

    const clearError = () => {
        setError(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!dni || dni.length < 7) {
            setError('El DNI debe tener al menos 7 dígitos.');
            return;
        }
        if (dni.length > 8) {
            setError('El DNI no puede tener más de 8 dígitos.');
            return;
        }
        // Eliminada la restricción de modalidadId obligatorio

        setLoading(true);

        try {
            const resultado = await serviceDatos.getEstudianteCompletoByDni(Number(dni), modalidadId);
            setTimeout(() => {
                setLoading(false);

                // Si el backend responde con error, mostrar mensaje y no renderizar datos
                if (!resultado.success) {
                    setError(resultado.message || 'No existe inscripción en la modalidad seleccionada.');
                    onEstudianteEncontrado(null); // Limpia el estudiante en el padre
                    return;
                }

                // Si no hay inscripción, mostrar error
                if (!resultado.inscripcion) {
                    setError('No existe inscripción en la modalidad seleccionada.');
                    onEstudianteEncontrado(null); // Limpia el estudiante en el padre
                    return;
                }

                setError(null);
                onEstudianteEncontrado({
                    success: true,
                    estudiante: resultado.estudiante,
                    domicilio: resultado.domicilio,
                    inscripcion: resultado.inscripcion,
                    documentacion: resultado.documentacion
                });
            }, 2000);
        } catch {
            setLoading(false);
            setError('Hubo un problema al realizar la consulta.');
            setTimeout(() => setError(null), 5000);
        }
    };
    return (
        <div className="busqueda-dni-container">
            {/* Contenedor de botones superior */}
            {!esConsultaDirecta && (
                <div className="modal-header-buttons">
                    {onVolver && <VolverButton onClick={onVolver} />}
                    {onClose && <CloseButton onClose={onClose} variant="modal" />}
                </div>
            )}
                  
            <h2>{modoEliminacion ? "Eliminar Estudiante por DNI" : modoModificacion ? "Modificar Estudiante por DNI" : "Consulta de Estudiante por DNI"}</h2>
            <form onSubmit={handleSubmit} className="busqueda-dni-form">
                <div className="input-container">
                    <Input
                        label="DNI"
                        placeholder={modoEliminacion ? "Ingrese el DNI del estudiante que desea eliminar" : modoModificacion ? "Ingrese el DNI del estudiante que desea modificar" : "Ingresa el DNI"}
                        type="text"
                        registro={{
                            value: dni,
                            onChange: handleChange,
                        }}
                    />
                    {/* Mostrar error personalizado con botón de cerrar */}
                    {error && (
                        <div className="error-message">
                            <div className="error-message-content">
                                <span>{error}</span>
                            </div>
                            <button 
                                type="button"
                                className="error-close-btn"
                                onClick={clearError}
                                title="Cerrar mensaje"
                            >
                                ✕
                            </button>
                        </div>
                    )}
                </div>
                <div className="button-container">
                    <BotonCargando loading={loading} className="modalidad-button">
                        {modoEliminacion ? "Buscar para Eliminar" : modoModificacion ? "Buscar para Modificar" : "Buscar"}
                    </BotonCargando>
                </div>
            </form>
        </div>
    );
};

/**
 * Props:
 * - onEstudianteEncontrado (function, required): Callback when a student is found.
  accion: PropTypes.oneOf(['consultar', 'editar', 'eliminar']), // ajusta la lista según tus acciones permitidas
 * - accion (string, optional): Action type.
 */
BusquedaDNI.propTypes = {
  onEstudianteEncontrado: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired, // Callback para el botón "Cerrar"
  onVolver: PropTypes.func, // Callback para el botón "Volver"
  esConsultaDirecta: PropTypes.bool, // Indica si es consulta directa (oculta botón cerrar)
  modoModificacion: PropTypes.bool, // Indica si está en modo modificación
  modoEliminacion: PropTypes.bool, // Indica si está en modo eliminación
  modalidadId: PropTypes.number, // <-- agrega aquí
};

export default BusquedaDNI;

