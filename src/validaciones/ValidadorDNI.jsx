// src/components/ValidadorDni.jsx
import { useEffect, useState } from 'react';
import { useFormikContext } from 'formik';
import serviceDatos from '../services/serviceDatos';

const ValidadorDni = () => {
    const { values, setFieldError } = useFormikContext();
    const [checkingDni, setCheckingDni] = useState(false);

    useEffect(() => {
        let cancelado = false;
        const validarDni = async () => {
            if (
                values.tipoDocumento === 'DNI' &&
                values.dni &&
                values.dni.toString().length === 8 &&
                !checkingDni
            ) {
                setCheckingDni(true);
                try {
                    const modalidadId = values.modalidadId || values.modalidad_id || values.modalidad;
                    const res = await serviceDatos.getEstudianteCompletoByDni(values.dni, modalidadId);
                     if (!cancelado && res && !res.error && res.idEstudiante) {
                        setFieldError('dni', 'El DNI ya está registrado en el sistema.');
                    }
                } catch (e) {
                    setFieldError('dni', 'Error al verificar el DNI.');
                    console.error('Error al verificar el DNI:', e);
                } finally {
                    if (!cancelado) setCheckingDni(false);
                }
            }
        };

        validarDni();
        return () => {
        cancelado = true; // Previene actualizaciones de estado si se desmonta
    };
    }, [
        values.dni,
        values.tipoDocumento,
        values.modalidadId,
        values.modalidad_id,
        values.modalidad,
        setFieldError,
        checkingDni
    ]);

    return null; // No renderiza nada visible, solo actúa en segundo plano
};

export default ValidadorDni;
