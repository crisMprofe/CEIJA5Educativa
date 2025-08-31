import ConsultaOpciones from './ConsultaOpciones';
import PropTypes from 'prop-types';

const VistaOpcionesModificar = ({ onSeleccion, onClose }) => (
    <ConsultaOpciones 
        onSeleccion={onSeleccion}
        titulo=""
        onClose={onClose}
        tituloModal="Seleccionar tipo de Modificación"
        descripcionModal="Elija cómo desea modificar estudiantes:"
        esModificacion={true}
    />
);

VistaOpcionesModificar.propTypes = {
    onSeleccion: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired
};

export default VistaOpcionesModificar;
