import PropTypes from 'prop-types';
import { FaArrowLeft } from 'react-icons/fa';
import '../estilos/botones.css'; // Usar estilos unificados

const VolverButton = ({ onClick, className }) => {
    const buttonClassName = className || 'boton-principal';
    const isSmall = className && className.includes('boton-small');
    
    return (
        <button 
            className={buttonClassName} 
            onClick={onClick}
            style={{
                minWidth: isSmall ? '28px' : '50px',
                width: isSmall ? '28px' : '50px',
                height: isSmall ? '28px' : '50px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: isSmall ? '12px' : '16px'
            }}
        >
            <FaArrowLeft />
        </button>
    );
};

VolverButton.propTypes = {
    onClick: PropTypes.func.isRequired,
    className: PropTypes.string,
};

export default VolverButton;