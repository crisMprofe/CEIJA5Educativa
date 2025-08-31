import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import '../estilos/alertaMens.css'; // Elimina o comenta esta línea si no usas estilos personalizados

function AlertaMens({ text, variant = 'info', duration = 4000, onClose }) {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        if (text && duration > 0) {
            const timer = setTimeout(() => {
                setVisible(false);
                if (onClose) onClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [text, duration, onClose]);

    if (!text || !visible) return null;
    return (
        <div className={`alerta-mens alerta-${variant}`} style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 1000 }}>
            {text}
        </div>
    );
}

AlertaMens.propTypes = {
    text: PropTypes.string.isRequired,
    variant: PropTypes.oneOf(['info', 'success', 'error', 'warning']),
    duration: PropTypes.number,
    onClose: PropTypes.func,
};

export default AlertaMens;
