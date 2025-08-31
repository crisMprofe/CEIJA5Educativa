
const FormatError = (error) => {
    // Si el error tiene una clave "mensaje" o "message", retorna ese mensaje
    if (error?.mensaje) {
        return error.mensaje;
    }
    if (error?.message) {
        return error.message;
    }
    // Si no hay respuesta del servidor
    if (!error?.response) {
        return 'No se pudo conectar con el servidor. Verifica tu conexión a internet.';
    }
    // Retorna el mensaje de error del backend si existe (soporta message o mensaje)
    const data = error.response.data;
    if (data?.message) return data.message;
    if (data?.mensaje) return data.mensaje;
    return 'Ocurrió un error inesperado.';
};

export default FormatError;

