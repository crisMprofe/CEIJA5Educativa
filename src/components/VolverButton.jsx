import PropTypes from 'prop-types';
import { FaArrowLeft } from 'react-icons/fa';
import '../estilos/botonVolver.css'; // Importa los estilos propios

const VolverButton = ({ onClick }) => {
    return (
        <button className="volver-button volver-buttonR" onClick={onClick}>
            <FaArrowLeft /> {/* Solo muestra el ícono */}
        </button>
    );
};

VolverButton.propTypes = {
    onClick: PropTypes.func.isRequired,
};

export default VolverButton;