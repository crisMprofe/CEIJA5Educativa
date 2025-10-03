import PropTypes from 'prop-types';
import '../estilos/AlertSystem.css';

/**
 * Componente para mostrar alertas flotantes y modales de confirmación
 * @param {Array} alerts - Lista de alertas flotantes
 * @param {Object} modal - Modal de confirmación activo
 * @param {Function} onCloseAlert - Función para cerrar una alerta flotante
 * @param {Function} onCloseModal - Función para cerrar el modal
 */
const AlertSystem = ({ alerts, modal, onCloseAlert, onCloseModal }) => {
    const getAlertIcon = (type) => {
        switch (type) {
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

    const getAlertTitle = (type) => {
        switch (type) {
            case 'success':
                return 'Éxito';
            case 'error':
                return 'Error';
            case 'warning':
                return 'Advertencia';
            case 'info':
                return 'Información';
            case 'loading':
                return 'Cargando...';
            default:
                return 'Notificación';
        }
    };

    return (
        <>
            {/* Alertas Flotantes */}
            {alerts && alerts.length > 0 && (
                <div className="alert-overlay">
                    {alerts.map((alert, index) => (
                        <div key={index} className={`alert-container ${alert.type}`}>
                            <div className="alert-header">
                                <span className="alert-icon">{getAlertIcon(alert.type)}</span>
                                <h4 className="alert-title">{getAlertTitle(alert.type)}</h4>
                            </div>
                            <p className="alert-message">{alert.message}</p>
                            {alert.type !== 'loading' && (
                                <button 
                                    className="alert-close"
                                    onClick={() => onCloseAlert(index)}
                                    aria-label="Cerrar alerta"
                                >
                                    ×
                                </button>
                            )}
                            {alert.type === 'loading' && (
                                <div className="loading-bar">
                                    <div className="loading-progress"></div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Modal de Confirmación */}
            {modal && modal.show && (
                <div className="alert-overlay modal-overlay">
                    <div className="alert-container modal-container">
                        <div className="alert-header">
                            <span className="alert-icon">❓</span>
                            <h4 className="alert-title">Confirmación</h4>
                        </div>
                        <p className="alert-message">{modal.message}</p>
                        <div className="alert-actions">
                            <button 
                                className="btn-cancel"
                                onClick={modal.onCancel || onCloseModal}
                            >
                                Cancelar
                            </button>
                            <button 
                                className="btn-confirm"
                                onClick={modal.onConfirm}
                            >
                                Aceptar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

AlertSystem.propTypes = {
    alerts: PropTypes.arrayOf(
        PropTypes.shape({
            type: PropTypes.oneOf(['success', 'error', 'warning', 'info', 'loading']).isRequired,
            message: PropTypes.string.isRequired
        })
    ),
    modal: PropTypes.shape({
        show: PropTypes.bool.isRequired,
        message: PropTypes.string.isRequired,
        onConfirm: PropTypes.func.isRequired,
        onCancel: PropTypes.func
    }),
    onCloseAlert: PropTypes.func.isRequired,
    onCloseModal: PropTypes.func.isRequired
};

AlertSystem.defaultProps = {
    alerts: [],
    modal: null
};

export default AlertSystem;