import axiosInstance from '../config/axios';
import FormatError from '../utils/MensajeError';


// Registrar nueva inscripción Web
const createWebInscription = async (formDataToSend) => {
    try {
        const response = await axiosInstance.post('/inscriptions/web', formDataToSend); // Nueva ruta
        return response.data;
    } catch (error) {
        console.error('Error en createWebInscription:', error);
        return FormatError(error); // Manejo uniforme de errores
    }
};

// Inscripción Estudiante Adm
// Permite pasar setAlert para mostrar el error en un alert si ocurre
const createEstd = async (formDataToSend, setAlert) => {
    try {
        if (import.meta.env.DEV && formDataToSend instanceof FormData) {
            // Mostrar todos los pares clave-valor enviados, tipo y valor
            const entries = {};
            for (let [key, value] of formDataToSend.entries()) {
                entries[key] = { valor: value, tipo: typeof value };
            }
            console.log('[createEstd] FormData enviado:', entries);
        }
        const response = await axiosInstance.post('/estudiantes/registrar', formDataToSend);
        if (import.meta.env.DEV) {
            console.log('Respuesta del servidor:', response.data);
        }
        return response.data;
    } catch (error) {
        const msg = FormatError(error);
        if (setAlert) setAlert({ text: msg, variant: 'error' });
        if (import.meta.env.DEV) {
            console.error('Error en createEstd - respuesta servidor:', error.response?.data);
        }
        throw new Error(msg);
    }
};
export default {
    createWebInscription,       
    createEstd,
}