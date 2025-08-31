import BusquedaDNI from './BusquedaDNI';
import PropTypes from 'prop-types';

const VistaBusquedaDNI = ({ onEstudianteEncontrado, onClose, onVolver, esConsultaDirecta, modoModificacion, modalidadId }) => (
    <BusquedaDNI 
        onEstudianteEncontrado={onEstudianteEncontrado}
        onClose={onClose}
        onVolver={onVolver}
        esConsultaDirecta={esConsultaDirecta}
        modoModificacion={modoModificacion}
        modalidadId={modalidadId}
    />
);

VistaBusquedaDNI.propTypes = {
    onEstudianteEncontrado: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
    onVolver: PropTypes.func,
    esConsultaDirecta: PropTypes.bool,
    modoModificacion: PropTypes.bool,
    modalidadId: PropTypes.number, // Asegúrate de que esta prop sea requerida si es necesaria
};

export default VistaBusquedaDNI;
