import PropTypes from 'prop-types';
import '../estilos/botonClose.css'; // Importa los estilos propios

const CloseButton = ({ onClose, variant }) => {
    const getClassName = () => {
        let className = 'cerrar-button cerrar-buttonR';
        if (variant === 'modal') {
            className += ' modal-close';
        } else if (variant === 'simple') {
            className += ' simple';
        }
        return className;
    };

    return (
        <button
            className={getClassName()}
            onClick={onClose}
        >
            ✖
        </button>
    );
};

CloseButton.propTypes = {
    onClose: PropTypes.func.isRequired,
    variant: PropTypes.string,
};

export default CloseButton;
