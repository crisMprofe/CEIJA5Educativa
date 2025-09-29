import { useMemo } from 'react';
import { verificarRegistroPendiente } from '../utils/registroSinDocumentacion';

/**
 * Hook personalizado para generar valores iniciales del formulario
 * @param {string} modalidad - Modalidad seleccionada
 * @param {string} completarRegistro - DNI del registro pendiente a completar
 * @param {object} datosRegistroWeb - Datos del registro web a completar
 */
export const useInitialValues = (modalidad, completarRegistro, datosRegistroWeb) => {
    // Buscar datos en sessionStorage primero (desde modal "Completar")
    let datosSessionStorage = null;
    try {
        const datosString = sessionStorage.getItem('registroPendienteCompleto');
        if (datosString) {
            datosSessionStorage = JSON.parse(datosString);
            console.log('📋 Datos encontrados en sessionStorage:', datosSessionStorage);
            // Limpiar sessionStorage después de leer
            sessionStorage.removeItem('registroPendienteCompleto');
        }
    } catch (error) {
        console.error('Error al parsear datos de sessionStorage:', error);
    }
    
    // Determinar qué datos usar
    const registroPendiente = datosSessionStorage || 
        (completarRegistro ? verificarRegistroPendiente(completarRegistro) : null);

    return useMemo(() => {
        const baseValues = {
            nombre: '',
            apellido: '',
            tipoDocumento: 'DNI',
            dni: '',
            paisEmision: '',
            cuil: '',
            fechaNacimiento: '',
            calle: '',
            numero: '',
            barrio: '',
            localidad: '',
            provincia: '',
            email: '',
            telefono: '',
            modalidad: modalidad || '',
            modalidadId: modalidad === 'Presencial' ? 1 : modalidad === 'Semipresencial' ? 2 : 1,
            planAnio: '',
            modulos: '',
            idModulo: '',
            idEstadoInscripcion: 1,
            // Campos de documentación (archivos)
            archivo_dni: null,
            archivo_cuil: null,
            archivo_partidaNacimiento: null,
            archivo_fichaMedica: null,
            archivo_solicitudPase: null,
            archivo_analiticoParcial: null,
            archivo_certificadoNivelPrimario: null,
            foto: null,
        };

        // Si hay registro pendiente, pre-llenar campos
        if (registroPendiente) {
            console.log('📝 Pre-llenando formulario con registro pendiente:', registroPendiente);
            return {
                ...baseValues,
                nombre: registroPendiente.nombre || '',
                apellido: registroPendiente.apellido || '',
                dni: registroPendiente.dni || '',
                cuil: registroPendiente.cuil || '',
                fechaNacimiento: registroPendiente.fechaNacimiento || '',
                calle: registroPendiente.calle || '',
                numero: registroPendiente.numero || '',
                barrio: registroPendiente.barrio || '',
                localidad: registroPendiente.localidad || '',
                provincia: registroPendiente.provincia || '',
                email: registroPendiente.email || '',
                telefono: registroPendiente.telefono || '',
                modalidad: registroPendiente.modalidad || modalidad || '',
                modalidadId: registroPendiente.modalidadId || (modalidad === 'Presencial' ? 1 : modalidad === 'Semipresencial' ? 2 : 1),
                planAnio: registroPendiente.planAnio || '',
                modulos: registroPendiente.modulos || '',
                idModulo: registroPendiente.idModulo || '',
            };
        }

        // Si hay datos de registro web, pre-llenar campos
        if (datosRegistroWeb) {
            console.log('📝 Pre-llenando formulario con registro web:', datosRegistroWeb);
            return {
                ...baseValues,
                nombre: datosRegistroWeb.nombre || '',
                apellido: datosRegistroWeb.apellido || '',
                dni: datosRegistroWeb.dni || '',
                cuil: '', // Los registros web no tienen CUIL inicialmente
                fechaNacimiento: datosRegistroWeb.fechaNacimiento || '',
                calle: datosRegistroWeb.calle || '',
                numero: datosRegistroWeb.numero || '',
                barrio: '', // Los registros web no tienen barrio inicialmente
                localidad: datosRegistroWeb.localidad || '',
                provincia: datosRegistroWeb.provincia || '',
                email: datosRegistroWeb.email || '',
                telefono: datosRegistroWeb.telefono || '',
                modalidad: datosRegistroWeb.modalidad || modalidad || '',
                modalidadId: (datosRegistroWeb.modalidad === 'Presencial' ? 1 : datosRegistroWeb.modalidad === 'Semipresencial' ? 2 : 1),
                planAnio: '',
                modulos: '',
                idModulo: '',
            };
        }

        return baseValues;
    }, [modalidad, registroPendiente, datosRegistroWeb]);
};