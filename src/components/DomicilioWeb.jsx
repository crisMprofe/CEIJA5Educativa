import { useState } from 'react';
import { Domicilio } from './Domicilio';
import { useAdmin } from '../hooks/useAdmin';

const DomicilioWeb = ({ 
    onDomicilioChange,
    valoresIniciales = {},
    className = ""
}) => {
    const { esAdmin } = useAdmin();
    const [datosDomicilio, setDatosDomicilio] = useState({
        calle: '',
        numero: '',
        barrio: '',
        localidad: '',
        provincia: '',
        ...valoresIniciales
    });

    const handleCambio = (nuevosValores) => {
        setDatosDomicilio(nuevosValores);
        if (onDomicilioChange) {
            onDomicilioChange(nuevosValores);
        }
    };

    return (
        <div className={`domicilio-web-container ${className}`}>
            <Domicilio
                esAdmin={esAdmin}
                usarFormik={false}
                valores={datosDomicilio}
                onCambio={handleCambio}
            />
        </div>
    );
};

export default DomicilioWeb;