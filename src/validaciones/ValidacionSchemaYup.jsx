
import * as yup from 'yup';

export const formularioInscripcionSchema = yup.object().shape({
    nombre: yup.string().required('Nombre es requerido'),
    apellido: yup.string().required('Apellido es requerido'),
    tipoDocumento: yup.string().required('Tipo de documento es requerido'),
    dni: yup
        .string()
        .required('Número de documento es requerido')
        .when('tipoDocumento', {
            is: 'DNI',
            then: (schema) => schema.matches(/^\d{8}$/, 'DNI debe tener exactamente 8 dígitos, sin espacios ni puntos'),
            otherwise: (schema) => schema.min(5, 'Número de documento debe tener al menos 5 caracteres')
        }),
    paisEmision: yup
        .string()
        .when('tipoDocumento', {
            is: (val) => val && val !== 'DNI',
            then: (schema) => schema.required('País de emisión es requerido para documentos extranjeros'),
            otherwise: (schema) => schema.notRequired()
        }),
    cuil: yup
        .string()
        .when('tipoDocumento', {
            is: 'DNI',
            then: (schema) => schema
                .required('CUIL es requerido para DNI argentino')
                .matches(/^\d{2}-\d{8}-\d$/, 'CUIL debe tener el formato 00-00000000-0 (11 dígitos con guiones)'),
            otherwise: (schema) => schema.notRequired()
        }),
    email: yup
        .string()
        .email('Debe ser un email válido')
        .required('Email es requerido'), // Email ahora es obligatorio
    telefono: yup
        .string()
        .required('Teléfono es requerido')
        .matches(
            /^(\+54\s?)?(\d{2,4}[-\s]?\d{4}[-\s]?\d{4}|\d{3}[-\s]?\d{3}[-\s]?\d{4}|\d{10,11})$/,
            'Formato de teléfono inválido. Ej: 11-1234-5678, 0351-4567890 o +54 11 1234 5678'
        )
        .min(8, 'El teléfono debe tener al menos 8 dígitos')
        .max(18, 'El teléfono no puede tener más de 18 caracteres'),
   fechaNacimiento: yup
        .date()
        .required('Fecha de nacimiento es requerida')
        .typeError('Fecha inválida'),
    calle: yup.string().required('Calle es requerida'),
            numero: yup
            .number()
            .typeError('Número es requerido')
            .required('Número es requerido'),
    barrio: yup.string().required('Barrio es requerido'),
    localidad: yup.string().required('Localidad es requerida'),
    provincia: yup.string().required('Provincia es requerida'),
     modalidad: yup.string().required('Modalidad es requerida'),
     planAnio: yup
        .number()
        .typeError('Plan/Año es requerido')
        .required('Plan/Año es requerido'),
    modulos: yup
        .number()
        .typeError('Módulo es requerido')
        .required('Módulo es requerido'),
    idEstadoInscripcion: yup
        .number()
        .typeError('Estado de inscripción es requerido')
        .required('Estado de inscripción es requerido'),
});
export const loginValidationSchema = yup.object().shape({
    email: yup
        .string()
        .trim()
        .email("Ingresa un email válido")
        .required("El campo email es obligatorio"),
    password: yup
        .string()
        .trim()
        .required("El campo contraseña es obligatorio"),
});
export const userValidationSchema = yup.object().shape({
    nombre: yup.string().trim().required("El campo nombre es obligatorio"),
    apellido: yup.string().trim().required("El campo apellido es obligatorio"),
    email: yup
        .string()
        .trim()
        .email("Ingresa un email válido")
        .required("El campo email es obligatorio"),
    password: yup.string().trim().required("El campo contraseña es obligatorio"),
    rol: yup.string().trim().required("El campo rol es obligatorio"),
});
