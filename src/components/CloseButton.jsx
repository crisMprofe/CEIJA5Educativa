import PropTypes from 'prop-types';
import '../estilos/botones.css'; // Usar estilos unificados

const CloseButton = ({ onClose, className }) => {
    const getClassName = () => {
        if (className) {
            return className; // Usar className personalizada si se proporciona
        }
        // Usar clase unificada del sistema
        return 'boton-principal';
    };

    const isSmall = className && className.includes('boton-small');
    
    return (
        <button
            className={getClassName()}
            onClick={onClose}
            style={{
                minWidth: isSmall ? '28px' : '50px',
                width: isSmall ? '28px' : '50px',
                height: isSmall ? '28px' : '50px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: isSmall ? '14px' : '18px',
                fontWeight: 'bold'
            }}
        >
            ✖
        </button>
    );
};

CloseButton.propTypes = {
    onClose: PropTypes.func.isRequired,
    className: PropTypes.string,
};

export default CloseButton;
