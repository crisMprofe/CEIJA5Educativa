import { useContext } from 'react';
import PropTypes from 'prop-types';
import { useAlerts } from '../hooks/useAlerts';
import AlertaMens from '../components/AlertaMens';
import { AlertContext } from './alertContextDefinition';

/**
 * Provider global de alertas para toda la aplicación
 */
export function AlertProvider({ children }) {
    const alertMethods = useAlerts();

    return (
        <AlertContext.Provider value={alertMethods}>
            {children}
            
            {/* AlertaMens global flotante - esquina superior derecha */}
            <AlertaMens 
                mode="floating"
                alerts={alertMethods.alerts} 
                modal={alertMethods.modal}
                onCloseAlert={alertMethods.removeAlert}
                onCloseModal={alertMethods.closeModal}
            />
        </AlertContext.Provider>
    );
}

AlertProvider.propTypes = {
    children: PropTypes.node.isRequired
};

/**
 * Hook personalizado para usar el contexto de alertas
 * Usar ESTO en tus componentes
 */
export function useAlertContext() {
    const context = useContext(AlertContext);
    
    if (!context) {
        throw new Error('useAlertContext debe usarse dentro de AlertProvider');
    }
    
    return context;
}

// Re-exportar para compatibilidad
export { AlertContext };