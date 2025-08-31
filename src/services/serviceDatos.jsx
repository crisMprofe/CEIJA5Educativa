import axiosInstance from '../config/axios';
import FormatError from '../utils/MensajeError';

// Obtener datos del domicilio por ID
const getDomicilioById = async (idDomicilio) => {
    try {
        const response = await axiosInstance.get(`/datos-domicilio/${idDomicilio}`);
        return response.data.domicilio;
    } catch (error) {
        console.error('Error al obtener el domicilio:', error);
        const message = FormatError(error);
        return { error: message };
    }
};

// Obtener información académica por ID de estudiante
const getInscripcionByEstudianteId = async (idEstudiante, modalidadId) => {
    try {
        // Agrega modalidadId como query param
        const response = await axiosInstance.get(`/datos-inscripcion/${idEstudiante}?modalidadId=${modalidadId}`);
        return response.data.inscripcion;
    } catch (error) {
        console.error('Error al obtener la inscripción:', error);
        const message = FormatError(error);
        return { error: message };
    }
};

// Obtener datos completos del estudiante por DNI
// Permite pasar setAlert para mostrar el error en un alert si ocurre
const getEstudianteCompletoByDni = async (dni, modalidadId, setAlert) => {
    if (!dni || !/^[\d]{7,8}$/.test(String(dni))) {
        if (setAlert) setAlert({ text: 'DNI no válido.', variant: 'error' });
        return { error: 'DNI no válido.' };
    }
    try {
        // Agrega modalidadId como query param
        const { data } = await axiosInstance.get(`/consultar-estudiantes-dni/${dni}?modalidadId=${modalidadId}`);
        console.log('Respuesta completa del servicio:', data);
        console.log('Documentación recibida:', data.documentacion);
        return data;
    } catch (error) {
        const message = FormatError(error);
        if (setAlert) setAlert({ text: message, variant: 'error' });
        return { error: message };
    }
};

export default {
    getDomicilioById,
    getInscripcionByEstudianteId,
    getEstudianteCompletoByDni,
};