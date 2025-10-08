import { useMemo } from 'react';

/**
 * Hook personalizado para manejo de validaciones del formulario
 * @param {Object} values - Valores del formulario
 */
export const useFormValidation = (values) => {
    
    // Campos obligatorios base
    const camposObligatorios = useMemo(() => [
        'nombre', 'apellido', 'dni', 'cuil', 'fechaNacimiento', 
        'calle', 'numero', 'barrio', 'localidad', 'provincia', 
        'email', 'telefono'
    ], []);

    // Validar campos obligatorios
    const validateRequiredFields = useMemo(() => {
        return camposObligatorios.filter((campo) => !values[campo]);
    }, [values, camposObligatorios]);

    // Validar formato de email
    const validateEmail = useMemo(() => {
        if (!values.email) return null;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(values.email) ? null : 'Formato de email inválido';
    }, [values.email]);

    // Validar formato de DNI
    const validateDNI = useMemo(() => {
        if (!values.dni) return null;
        const dniRegex = /^\d{7,8}$/;
        return dniRegex.test(values.dni) ? null : 'DNI debe tener 7-8 dígitos';
    }, [values.dni]);

    // Validar formato de CUIL
    const validateCUIL = useMemo(() => {
        if (!values.cuil) return null;
        const cuilRegex = /^\d{2}-\d{8}-\d{1}$/;
        return cuilRegex.test(values.cuil) ? null : 'CUIL debe tener formato XX-XXXXXXXX-X';
    }, [values.cuil]);

    // Validar teléfono
    const validateTelefono = useMemo(() => {
        if (!values.telefono) return null;
        const telefonoRegex = /^[\d\s+\-()]{8,15}$/;
        return telefonoRegex.test(values.telefono) ? null : 'Formato de teléfono inválido';
    }, [values.telefono]);

    // Validar fecha de nacimiento
    const validateFechaNacimiento = useMemo(() => {
        if (!values.fechaNacimiento) return null;
        
        const fecha = new Date(values.fechaNacimiento);
        const hoy = new Date();
        const edad = hoy.getFullYear() - fecha.getFullYear();
        
        if (edad < 16) return 'Debe ser mayor de 16 años';
        if (edad > 100) return 'Fecha de nacimiento inválida';
        
        return null;
    }, [values.fechaNacimiento]);

    // Validaciones completas
    const validationErrors = useMemo(() => {
        const errors = {};
        
        if (validateEmail) errors.email = validateEmail;
        if (validateDNI) errors.dni = validateDNI;
        if (validateCUIL) errors.cuil = validateCUIL;
        if (validateTelefono) errors.telefono = validateTelefono;
        if (validateFechaNacimiento) errors.fechaNacimiento = validateFechaNacimiento;
        
        return errors;
    }, [validateEmail, validateDNI, validateCUIL, validateTelefono, validateFechaNacimiento]);

    // Estado general de validación
    const isFormValid = useMemo(() => {
        return validateRequiredFields.length === 0 && Object.keys(validationErrors).length === 0;
    }, [validateRequiredFields.length, validationErrors]);

    return {
        validateRequiredFields,
        validationErrors,
        isFormValid,
        camposObligatorios
    };
};