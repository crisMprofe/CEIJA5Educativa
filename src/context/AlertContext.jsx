import PropTypes from 'prop-types';
import { useAlerts } from '../hooks/useAlerts';
import AlertSystem from '../components/AlertSystem';
import { AlertContext } from './alertContextDefinition';

/**
 * Provider global de alertas para toda la aplicación
 */
export const AlertProvider = ({ children }) => {
    const alertMethods = useAlerts();

    return (
        <AlertContext.Provider value={alertMethods}>
            {children}
            {/* AlertSystem global flotante */}
            <AlertSystem 
                alerts={alertMethods.alerts} 
                modal={alertMethods.modal}
                onCloseAlert={alertMethods.removeAlert}
                onCloseModal={alertMethods.closeModal}
            />
        </AlertContext.Provider>
    );
};

AlertProvider.propTypes = {
    children: PropTypes.node.isRequired
};