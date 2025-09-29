import { useState, useCallback } from 'react';

/**
 * Hook personalizado para manejo de alertas y notificaciones
 */
export const useAlerts = () => {
    const [alert, setAlert] = useState({ show: false, type: '', message: '' });
    const [loading, setLoading] = useState(false);

    // Ocultar alerta
    const hideAlert = useCallback(() => {
        setAlert({ show: false, type: '', message: '' });
    }, []);

    // Mostrar alerta de éxito
    const showSuccess = useCallback((message) => {
        setAlert({
            show: true,
            type: 'success',
            message: message || 'Operación completada exitosamente'
        });
        
        // Auto-ocultar después de 5 segundos
        setTimeout(() => hideAlert(), 5000);
    }, [hideAlert]);

    // Mostrar alerta de error
    const showError = useCallback((message) => {
        setAlert({
            show: true,
            type: 'error',
            message: message || 'Ha ocurrido un error inesperado'
        });
        
        // Auto-ocultar después de 8 segundos para errores
        setTimeout(() => hideAlert(), 8000);
    }, [hideAlert]);

    // Mostrar alerta de advertencia
    const showWarning = useCallback((message) => {
        setAlert({
            show: true,
            type: 'warning',
            message: message || 'Advertencia'
        });
        
        // Auto-ocultar después de 6 segundos
        setTimeout(() => hideAlert(), 6000);
    }, [hideAlert]);

    // Mostrar alerta de información
    const showInfo = useCallback((message) => {
        setAlert({
            show: true,
            type: 'info',
            message: message
        });
        
        // Auto-ocultar después de 4 segundos
        setTimeout(() => hideAlert(), 4000);
    }, [hideAlert]);

    // Mostrar estado de carga
    const showLoading = useCallback((message = 'Cargando...') => {
        setLoading(true);
        setAlert({
            show: true,
            type: 'loading',
            message: message
        });
    }, []);

    // Ocultar estado de carga
    const hideLoading = useCallback(() => {
        setLoading(false);
        hideAlert();
    }, [hideAlert]);

    // Manejar errores de validación
    const handleValidationErrors = useCallback((errors) => {
        if (Array.isArray(errors) && errors.length > 0) {
            const errorMessage = `Campos faltantes: ${errors.join(', ')}`;
            showError(errorMessage);
        } else if (typeof errors === 'object' && Object.keys(errors).length > 0) {
            const errorList = Object.entries(errors).map(([field, error]) => `${field}: ${error}`);
            const errorMessage = `Errores de validación:\n${errorList.join('\n')}`;
            showError(errorMessage);
        }
    }, [showError]);

    // Manejar respuestas de API
    const handleApiResponse = useCallback((response, successMessage = null) => {
        if (response.success) {
            showSuccess(successMessage || response.message || 'Operación exitosa');
            return true;
        } else {
            showError(response.error || response.message || 'Error en la operación');
            return false;
        }
    }, [showSuccess, showError]);

    // Confirmar acción peligrosa
    const confirmAction = useCallback((message, onConfirm) => {
        const confirmed = window.confirm(message || '¿Está seguro de realizar esta acción?');
        if (confirmed && onConfirm) {
            onConfirm();
        }
        return confirmed;
    }, []);

    return {
        alert,
        loading,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        hideAlert,
        showLoading,
        hideLoading,
        handleValidationErrors,
        handleApiResponse,
        confirmAction
    };
};