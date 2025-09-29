import { useSearchParams } from 'react-router-dom';
import { useMemo } from 'react';

/**
 * Hook personalizado para obtener y procesar datos de registro web desde parámetros URL
 * @param {string} modalidad - Modalidad por defecto
 */
export const useRegistroWebData = (modalidad) => {
    const [searchParams] = useSearchParams();
    
    return useMemo(() => {
        const completarWebParam = searchParams.get('completarWeb');
        
        if (!completarWebParam) return { completarWebParam: null, datosRegistroWeb: null };
        
        const datosRegistroWeb = {
            dni: searchParams.get('dni') || '',
            nombre: searchParams.get('nombre') || '',
            apellido: searchParams.get('apellido') || '',
            email: searchParams.get('email') || '',
            telefono: searchParams.get('telefono') || '',
            fechaNacimiento: searchParams.get('fechaNacimiento') || '',
            calle: searchParams.get('calle') || '',
            numero: searchParams.get('numero') || '',
            localidad: searchParams.get('localidad') || '',
            codigoPostal: searchParams.get('codigoPostal') || '',
            provincia: searchParams.get('provincia') || '',
            modalidad: searchParams.get('modalidad') || modalidad || ''
        };
        
        return { completarWebParam, datosRegistroWeb };
    }, [searchParams, modalidad]);
};