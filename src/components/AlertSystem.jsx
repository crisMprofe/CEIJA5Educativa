import PropTypes from 'prop-types';
import '../estilos/AlertSystem.css';

/**
 * Componente para mostrar alertas del sistema
 * @param {Object} alert - Configuración de la alerta
 * @param {Function} onClose - Función para cerrar la alerta
 */
const AlertSystem = ({ alert, onClose }) => {
    if (!alert.show) return null;

    const getAlertIcon = () => {
        switch (alert.type) {
            case 'success':
                return '✓';
            case 'error':
                return '✕';
            case 'warning':
                return '⚠';
            case 'info':
                return 'ℹ';
            case 'loading':
                return '⟳';
            default:
                return 'ℹ';
        }
    };

    const getAlertClass = () => {
        return `alert alert-${alert.type}`;
    };

    return (
        <div className={getAlertClass()}>
            <div className="alert-content">
                <span className="alert-icon">{getAlertIcon()}</span>
                <div className="alert-message">
                    {alert.message.split('\n').map((line, index) => (
                        <div key={index}>{line}</div>
                    ))}
                </div>
                {alert.type !== 'loading' && (
                    <button 
                        className="alert-close"
                        onClick={onClose}
                        aria-label="Cerrar alerta"
                    >
                        ✕
                    </button>
                )}
            </div>
            {alert.type === 'loading' && (
                <div className="loading-bar">
                    <div className="loading-progress"></div>
                </div>
            )}
        </div>
    );
};

AlertSystem.propTypes = {
    alert: PropTypes.shape({
        show: PropTypes.bool.isRequired,
        type: PropTypes.oneOf(['success', 'error', 'warning', 'info', 'loading']).isRequired,
        message: PropTypes.string.isRequired
    }).isRequired,
    onClose: PropTypes.func.isRequired
};

export default AlertSystem;