import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { obtenerRegistrosSinDocumentacion, obtenerDocumentosRequeridos } from '../utils/registroSinDocumentacion';
import registrosPendientesService from '../services/serviceRegistrosPendientes';
import { useAlerts } from '../hooks/useAlerts';
import jsPDF from 'jspdf';
import AlertaMens from './AlertaMens';
import HeaderModal from './registrosPendientes/HeaderModal';
import ListaRegistrosPendientes from './registrosPendientes/ListaRegistrosPendientes';
import SeccionEmails from './registrosPendientes/SeccionEmails';
import SeccionDescargas from './registrosPendientes/SeccionDescargas';
import SeccionDuplicados from './registrosPendientes/SeccionDuplicados';
import ModalEditarRegistro from './registrosPendientes/ModalEditarRegistro';

import '../estilos/modalM.css';
import '../estilos/botones.css';
import '../estilos/ModalRegistrosPendientes.css';

const ModalRegistrosPendientes = ({ onClose }) => {
    const { showSuccess, showError, showWarning, showInfo, alerts, removeAlert, modal, closeModal } = useAlerts();
    // Eliminar estado local de alerta, usar solo sistema global
    const [registros, setRegistros] = useState([]);
    const [mensajeEmail, setMensajeEmail] = useState('');
    const [enviandoEmail, setEnviandoEmail] = useState(false);
    const [descargando, setDescargando] = useState(false);
    const [estadoDuplicados, setEstadoDuplicados] = useState(null);
    const [cargandoRegistros, setCargandoRegistros] = useState(false);
    const [limpiandoDuplicados, setLimpiandoDuplicados] = useState(false);
    const [registroEditando, setRegistroEditando] = useState(null);
    const [mostrarModalEdicion, setMostrarModalEdicion] = useState(false);
    const [estudiantesRegistrados, setEstudiantesRegistrados] = useState(new Set());

    // Funciones para gestión de duplicados adaptadas para datos actuales
    const verificarEstadoDuplicados = useCallback(async () => {
        try {
            setEstadoDuplicados(null);
            
            // Usar los registros actuales en lugar del localStorage
            const registrosActuales = registros || [];
            
            // Contar DNIs
            const dniMap = new Map();
            registrosActuales.forEach(registro => {
                const dni = registro.datos?.dni || registro.dni;
                if (dni) {
                    dniMap.set(dni, (dniMap.get(dni) || 0) + 1);
                }
            });
            
            // Encontrar duplicados
            const duplicados = Array.from(dniMap.entries())
                .filter(([, cantidad]) => cantidad > 1)
                .map(([dni, cantidad]) => ({
                    dni,
                    cantidad,
                    registros: registrosActuales.filter(r => (r.datos?.dni || r.dni) === dni).map(r => ({
                        nombre: r.datos?.nombre || r.nombre,
                        apellido: r.datos?.apellido || r.apellido,
                        fecha: new Date(r.timestamp).toLocaleString('es-AR'),
                        tipo: r.tipo || 'REGISTRO_PENDIENTE'
                    }))
                }));
            
            const resultado = {
                totalRegistros: registrosActuales.length,
                dnisUnicos: dniMap.size,
                cantidadDuplicados: duplicados.length,
                duplicados
            };
            
            console.log('📊 Estado de duplicados (registros actuales):', resultado);
            
            setEstadoDuplicados(resultado);
            
            // Solo mostrar alertas cuando se ejecuta manualmente, no automáticamente
            // if (resultado.cantidadDuplicados > 0) {
            //     showWarning(`⚠️ Encontrados ${resultado.cantidadDuplicados} DNI(s) duplicados`);
            // } else {
            //     showSuccess('✅ No se encontraron registros duplicados');
            // }
            
        } catch (error) {
            console.error('Error al verificar duplicados:', error);
            showError('❌ Error al verificar duplicados');
        }
    }, [registros, showError]);

    // Función para verificación manual con alertas
    const verificarEstadoDuplicadosManual = async () => {
        await verificarEstadoDuplicados();
        
        if (estadoDuplicados) {
            if (estadoDuplicados.cantidadDuplicados > 0) {
                showWarning(`⚠️ Encontrados ${estadoDuplicados.cantidadDuplicados} DNI(s) duplicados`);
            } else {
                showSuccess('✅ No se encontraron registros duplicados');
            }
        }
    };

    // Función para recargar registros
    const recargarRegistros = async (esRecargaManual = false) => {
        try {
            console.log('🔄 Recargando registros pendientes desde servidor...');
            setMensajeEmail('Actualizando lista de registros...');

            const registrosActualizados = await registrosPendientesService.obtenerRegistrosPendientes();
            console.log('📋 Registros actualizados:', registrosActualizados);

            const registrosAnteriores = registros.length;
            const registrosNuevos = registrosActualizados.length;

            setRegistros(registrosActualizados);
            
            // Verificar estado de registro de estudiantes después de actualizar la lista
            await verificarTodosLosEstudiantes(registrosActualizados);

            if (registrosNuevos < registrosAnteriores) {
                const diferencia = registrosAnteriores - registrosNuevos;
                setMensajeEmail(`✅ Lista actualizada - ${diferencia} registro${diferencia > 1 ? 's' : ''} procesado${diferencia > 1 ? 's' : ''}`);
            } else if (registrosNuevos === registrosAnteriores) {
                setMensajeEmail('✅ Lista actualizada - sin cambios');
                if (esRecargaManual) {
                    showInfo('ℹ️ La lista de registros está actualizada, no hay cambios nuevos');
                }
            } else {
                setMensajeEmail('✅ Lista actualizada - nuevos registros pendientes');
                if (esRecargaManual) {
                    showWarning(`⚠️ Se encontraron ${registrosNuevos - registrosAnteriores} nuevos registros pendientes`);
                }
            }

            setTimeout(() => setMensajeEmail(''), 3000);

        } catch (error) {
            console.error('❌ Error al recargar registros:', error);
            setMensajeEmail(`❌ Error al actualizar: ${error.message}`);
            setTimeout(() => setMensajeEmail(''), 5000);
        }
    };

    // Función auxiliar para verificar y limpiar registros completados
    const verificarYLimpiarRegistrosCompletados = async () => {
        try {
            const registrosActuales = obtenerRegistrosSinDocumentacion();
            const idsActuales = new Set(registrosActuales.map(r => r.id));

            setRegistros(prevRegistros => {
                const registrosFiltrados = prevRegistros.filter(r => idsActuales.has(r.id));

                if (registrosFiltrados.length !== prevRegistros.length) {
                    const eliminados = prevRegistros.length - registrosFiltrados.length;
                    console.log(`🧹 Limpiados ${eliminados} registro(s) completado(s) de la lista local`);
                }

                return registrosFiltrados;
            });

        } catch (error) {
            console.error('Error al verificar registros completados:', error);
        }
    };

    // Función para verificar si un estudiante ya está registrado en la base de datos o en pendientes
    // Ahora recibe la lista de registros como argumento para evitar dependencias cíclicas
    const verificarEstudianteRegistrado = useCallback(async (dni, registrosList) => {
        // Verificar en la base de datos principal
        let registradoEnBD = false;
        try {
            const response = await fetch(`/api/estudiantes/verificar/${dni}`);
            if (response.ok) {
                const data = await response.json();
                registradoEnBD = data.registrado;
            }
        } catch {
            registradoEnBD = false;
        }

        // Verificar en registros pendientes (en la lista recibida)
        const registradoEnPendientes = registrosList.some(r => (r.datos?.dni || r.dni) === dni);

        return { registradoEnBD, registradoEnPendientes };
    }, []);

    // Función para verificar todos los estudiantes
    const verificarTodosLosEstudiantes = useCallback(async (registrosList) => {
        console.log('🔄 Verificando', registrosList.length, 'estudiantes');
        const estudiantesSet = new Set();
        const pendientesSet = new Set();
        for (const registro of registrosList) {
            if (registro.datos?.dni) {
                const { registradoEnBD, registradoEnPendientes } = await verificarEstudianteRegistrado(registro.datos.dni, registrosList);
                if (registradoEnBD) {
                    estudiantesSet.add(registro.datos.dni);
                }
                if (registradoEnPendientes) {
                    pendientesSet.add(registro.datos.dni);
                }
            }
        }
        if (estudiantesSet.size > 0) {
            console.log('✅ Estudiantes ya registrados en BD:', Array.from(estudiantesSet));
        }
        if (pendientesSet.size > 0) {
            console.log('🕒 Estudiantes en Registros_Pendientes:', Array.from(pendientesSet));
        }
        setEstudiantesRegistrados(estudiantesSet);
        // Puedes guardar pendientesSet en otro estado si lo necesitas en la UI
    }, [verificarEstudianteRegistrado]);

    // Cargar registros desde el archivo JSON del backend
    useEffect(() => {
        const cargarRegistrosPendientes = async () => {
            try {
                setCargandoRegistros(true);
                console.log('🔄 Cargando registros pendientes desde archivo JSON...');

                const registrosBackend = await registrosPendientesService.obtenerRegistrosPendientes();
                console.log('📋 Registros desde backend:', registrosBackend);

                setRegistros(registrosBackend);
                // Verificar cuáles estudiantes ya están registrados
                await verificarTodosLosEstudiantes(registrosBackend);

                if (registrosBackend.length === 0) {
                    setMensajeEmail('ℹ️ No hay registros pendientes en este momento. ¡Excelente trabajo!');
                } else {
                    setMensajeEmail(`📋 Cargados ${registrosBackend.length} registro(s) pendiente(s) de documentación`);
                }
                setTimeout(() => setMensajeEmail(''), 3000);

            } catch (error) {
                console.error('❌ Error al cargar registros:', error);
                setMensajeEmail(`❌ Error al cargar registros: ${error.message}`);
                setRegistros([]);
                setMensajeEmail('⚠️ No se pudieron cargar registros');
                setTimeout(() => setMensajeEmail(''), 3000);
            } finally {
                setCargandoRegistros(false);
            }
        };

        cargarRegistrosPendientes();

        const intervalo = setInterval(() => {
            verificarYLimpiarRegistrosCompletados();
        }, 30000);

        return () => clearInterval(intervalo);
    }, [verificarTodosLosEstudiantes]); // useEffect depende de verificarTodosLosEstudiantes para cumplir con eslint

    // Función para obtener información del vencimiento
    const obtenerInfoVencimiento = (registro) => {
        const ahora = new Date();
        const fechaRegistro = new Date(registro.timestamp);
        const vencimiento = new Date(fechaRegistro.getTime() + (7 * 24 * 60 * 60 * 1000));
        const msRestantes = vencimiento.getTime() - ahora.getTime();

        if (msRestantes <= 0) {
            return { vencido: true, diasRestantes: 0, mensaje: 'VENCIDO', color: '#dc3545' };
        }

        const diasRestantes = Math.ceil(msRestantes / (1000 * 60 * 60 * 24));
        const horasRestantes = Math.ceil(msRestantes / (1000 * 60 * 60));

        let mensaje, color;
        if (diasRestantes > 3) {
            mensaje = `${diasRestantes} días restantes`;
            color = '#28a745';
        } else if (diasRestantes > 1) {
            mensaje = `${diasRestantes} días restantes`;
            color = '#ffc107';
        } else if (diasRestantes === 1) {
            mensaje = `1 día restante`;
            color = '#fd7e14';
        } else {
            mensaje = `${horasRestantes}h restantes`;
            color = '#dc3545';
        }

        return {
            vencido: false,
            diasRestantes,
            mensaje,
            color,
            fechaVencimiento: vencimiento.toLocaleString()
        };
    };

    // Función para obtener icono de tipo de registro
    const getTipoIcon = (tipo) => {
        switch (tipo) {
            case 'SIN_DOCUMENTACION': return '📋';
            case 'DOCUMENTACION_INCOMPLETA': return '📄';
            default: return '📝';
        }
    };

    // Función para formatear tipo de registro
    const formatearTipo = (tipo) => {
        switch (tipo) {
            case 'SIN_DOCUMENTACION': return 'Sin Documentación';
            case 'DOCUMENTACION_INCOMPLETA': return 'Documentación Incompleta';
            default: return tipo;
        }
    };

    // Función para abrir modal de edición/completar registro
    const completarRegistro = (registro) => {
        console.log('📝 Abriendo modal de edición para:', registro.datos?.dni || registro.dni);
        setRegistroEditando(registro);
        setMostrarModalEdicion(true);
    };

    // Función para cerrar modal de edición
    const cerrarModalEdicion = () => {
        setMostrarModalEdicion(false);
        setRegistroEditando(null);
    };

    // Función para manejar guardado desde el modal
    const handleRegistroGuardado = async (registro, tipoOperacion) => {
        console.log(`✅ Registro ${tipoOperacion}:`, registro.dni);
        

        if (tipoOperacion === 'completado') {
            const nombreCompleto = `${registro.datos?.nombre || registro.nombre} ${registro.datos?.apellido || registro.apellido}`;
            showSuccess(`🎉 ${nombreCompleto} - Estudiante registrado y aprobado.`);
            // Eliminar automáticamente de la lista local
            setRegistros(prevRegistros => prevRegistros.filter(r => r.dni !== registro.dni));
        } else {
            await recargarRegistros(false);
        }
        
        // Cerrar modal después de un pequeño delay para que se vea el mensaje
        setTimeout(() => {
            cerrarModalEdicion();
        }, 500);
    };

    // Función para manejar eliminación desde el modal
    const handleRegistroEliminado = (registro) => {
        console.log(`🗑️ Registro eliminado:`, registro.dni);
        // Eliminar de la lista local
        setRegistros(prevRegistros => 
            prevRegistros.filter(r => r.dni !== registro.dni)
        );
        cerrarModalEdicion();
    };
    // Función para eliminar un registro del listado de pendientes
    const procesarEliminacion = async (registro) => {
        // Construir nombre completo robusto
        const nombreCompleto = `${registro.datos?.nombre || registro.nombre || ''} ${registro.datos?.apellido || registro.apellido || ''}`.trim();
        try {
            showInfo(`🗑️ Eliminando ${nombreCompleto || 'registro'} del listado de pendientes...`);
            await registrosPendientesService.eliminarRegistroPendiente(registro.dni);
            console.log('✅ Registro eliminado del archivo de pendientes exitosamente');
            setRegistros(prevRegistros =>
                prevRegistros.filter(r => (r.datos?.dni || r.dni) !== registro.dni)
            );
            showSuccess(`✅ ${nombreCompleto || 'Registro'} eliminado del listado de pendientes`);
            setMensajeEmail('');
        } catch (error) {
            console.error('Error al eliminar registro:', error);
            showError(`❌ Error al eliminar: ${error.message}`);
        }
    };

    // Función para enviar email individual
    const enviarEmailIndividual = async (registro) => {
        const nombreCompleto = `${registro.datos?.nombre || registro.nombre} ${registro.datos?.apellido || registro.apellido}`;
        const email = registro.datos?.email || registro.email;

        if (!email || !email.includes('@')) {
            setMensajeEmail(`❌ ${nombreCompleto} no tiene email válido registrado`);
            showWarning(`⚠️ ${nombreCompleto} no tiene email válido registrado. Verifique la información de contacto.`);
            setTimeout(() => setMensajeEmail(''), 5000);
            return;
        }

        try {
            setEnviandoEmail(true);
            setMensajeEmail(`📧 Enviando notificación a ${nombreCompleto}...`);

            const resultado = await registrosPendientesService.enviarNotificacion(registro.dni);

            if (resultado.success) {
                setMensajeEmail(`✅ Email enviado exitosamente a ${nombreCompleto} (${email})`);
                setTimeout(() => setMensajeEmail(''), 3000);
            } else {
                setMensajeEmail(`❌ Error: ${resultado.message}`);
                setTimeout(() => setMensajeEmail(''), 5000);
            }

        } catch (error) {
            console.error('Error al enviar email:', error);
            setMensajeEmail(`❌ Error al enviar email a ${nombreCompleto}: ${error.message}`);
            setTimeout(() => setMensajeEmail(''), 5000);
        } finally {
            setEnviandoEmail(false);
        }
    };

    // Funciones para emails masivos
    const enviarEmailsMasivos = async () => {
        setEnviandoEmail(true);
        try {
            setMensajeEmail('📧 Enviando notificaciones masivas a todos los estudiantes...');

            const response = await fetch('http://localhost:5000/api/notificaciones/enviar-masivo', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            const resultado = await response.json();

            if (resultado.success) {
                setMensajeEmail(`✅ Emails masivos completados: ${resultado.enviados} enviados${resultado.fallidos > 0 ? `, ${resultado.fallidos} fallidos` : ''}`);
                setTimeout(() => setMensajeEmail(''), 4000);
            } else {
                setMensajeEmail(`❌ Error en envío masivo: ${resultado.message}`);
                setTimeout(() => setMensajeEmail(''), 5000);
            }

        } catch (error) {
            console.error('Error al enviar emails masivos:', error);
            setMensajeEmail(`❌ Error al enviar emails masivos: ${error.message}`);
            setTimeout(() => setMensajeEmail(''), 5000);
        } finally {
            setEnviandoEmail(false);
        }
    };

    const enviarEmailsUrgentes = async () => {
        setEnviandoEmail(true);
        try {
            setMensajeEmail('⚡ Enviando notificaciones urgentes (≤3 días)...');

            const response = await fetch('http://localhost:5000/api/notificaciones/enviar-urgentes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ diasUmbral: 3 })
            });

            const resultado = await response.json();

            if (resultado.success) {
                setMensajeEmail(`⚡ Emails urgentes completados: ${resultado.enviados} enviados${resultado.fallidos > 0 ? `, ${resultado.fallidos} fallidos` : ''}`);
                setTimeout(() => setMensajeEmail(''), 4000);
            } else {
                setMensajeEmail(`❌ Error en envío urgente: ${resultado.message}`);
                setTimeout(() => setMensajeEmail(''), 5000);
            }

        } catch (error) {
            console.error('Error al enviar emails urgentes:', error);
            setMensajeEmail(`❌ Error al enviar emails urgentes: ${error.message}`);
            setTimeout(() => setMensajeEmail(''), 5000);
        } finally {
            setEnviandoEmail(false);
        }
    };

    const limpiarDuplicadosManual = async () => {
        try {
            setLimpiandoDuplicados(true);
            showWarning('🧹 Analizando duplicados en registros actuales...');
            
            // Trabajar con registros actuales
            if (!estadoDuplicados || estadoDuplicados.cantidadDuplicados === 0) {
                showInfo('ℹ️ No hay duplicados para limpiar');
                return;
            }
            
            // Para registros pendientes, no eliminamos automáticamente
            // Solo informamos al administrador
            const mensaje = `⚠️ Se encontraron ${estadoDuplicados.cantidadDuplicados} DNI(s) duplicados. `;
            const detalles = estadoDuplicados.duplicados.map(dup => 
                `DNI ${dup.dni}: ${dup.cantidad} registros`
            ).join(', ');
            
            showWarning(`${mensaje} Detalles: ${detalles}. Revise manualmente.`);
            
        } catch (error) {
            console.error('Error al analizar duplicados:', error);
            showError('❌ Error al analizar duplicados');
        } finally {
            setLimpiandoDuplicados(false);
        }
    };

    const probarSistema7Dias = async () => {
        try {
            showInfo('🧪 Analizando sistema de vencimiento en registros actuales...');
            
            const registrosActuales = registros || [];
            const ahora = new Date();
            
            console.log('🧪 === ANÁLISIS SISTEMA VENCIMIENTOS ===');
            console.log(`📅 Fecha actual: ${ahora.toLocaleString('es-AR')}`);
            console.log(`📋 Total registros: ${registrosActuales.length}`);
            
            if (registrosActuales.length === 0) {
                showInfo('ℹ️ No hay registros para analizar');
                return;
            }
            
            const detalles = registrosActuales.map((registro, index) => {
                const fechaCreacion = new Date(registro.timestamp);
                const info = obtenerInfoVencimiento(registro);
                
                const detalle = {
                    indice: index + 1,
                    dni: registro.datos?.dni || registro.dni,
                    nombre: `${registro.datos?.nombre || registro.nombre} ${registro.datos?.apellido || registro.apellido}`,
                    fechaCreacion: fechaCreacion.toLocaleString('es-AR'),
                    estado: info.vencido ? '❌ VENCIDO' : '✅ VIGENTE',
                    mensaje: info.mensaje,
                    diasRestantes: info.diasRestantes,
                    color: info.color
                };
                
                console.log(`${detalle.indice}. ${detalle.nombre} (DNI: ${detalle.dni}):`);
                console.log(`   📅 Creado: ${detalle.fechaCreacion}`);
                console.log(`   📊 Estado: ${detalle.estado}`);
                console.log(`   💬 Mensaje: ${detalle.mensaje}`);
                console.log(`   ⏳ Días restantes: ${detalle.diasRestantes}`);
                console.log('   ---');
                
                return detalle;
            });
            
            const vigentes = detalles.filter(d => !d.estado.includes('VENCIDO')).length;
            const vencidos = detalles.filter(d => d.estado.includes('VENCIDO')).length;
            
            console.log('📊 === RESUMEN ===');
            console.log(`✅ Registros vigentes: ${vigentes}`);
            console.log(`❌ Registros vencidos: ${vencidos}`);
            
            showSuccess(`🧪 Análisis completado: ${vigentes} vigentes, ${vencidos} vencidos de ${registrosActuales.length} totales`);
            
        } catch (error) {
            console.error('Error en análisis de vencimientos:', error);
            showError('❌ Error en análisis de vencimientos');
        }
    };

    // Mapeo de documentos para reportes
    const mapeoDocumentos = {
        'cuil': 'CUIL',
        'dni': 'DNI',
        'fichaMedica': 'Ficha Médica',
        'certificadoNivelPrimario': 'Certificado Nivel Primario',
        'partidaNacimiento': 'Partida de Nacimiento',
        'foto': 'Foto',
        'certificadoNivelSecundario': 'Certificado Nivel Secundario',
        'constanciaAlumnoRegular': 'Constancia Alumno Regular'
    };

    // Función utilitaria para obtener estado de documentación
    const obtenerEstadoDocumentacion = (registro) => {
        const modalidad = registro.datos?.modalidad || registro.modalidad || '';
        const planAnio = registro.datos?.planAnio || registro.planAnio || '';
        const modulos = registro.datos?.modulos || registro.modulos || '';
        console.log('[DEBUG] Llamando a obtenerDocumentosRequeridos desde ModalRegistrosPendientes.jsx con:', {
            modalidad, planAnio, modulos
        });
        const requerimientos = obtenerDocumentosRequeridos(modalidad, planAnio, modulos);
        const documentosRequeridosDinamicos = requerimientos.documentos || [];
        const documentosAlternativos = requerimientos.alternativos;
        
        let documentosSubidos = [];
        
        if (Array.isArray(registro.documentosSubidos)) {
            documentosSubidos = registro.documentosSubidos;
        } else if (registro.archivos && typeof registro.archivos === 'object') {
            documentosSubidos = Object.keys(registro.archivos).filter(key => 
                registro.archivos[key] && registro.archivos[key] !== null && registro.archivos[key] !== ''
            );
        }
        
        let documentosFaltantes = [];
        let documentosValidosSubidos = [];
        let documentoUsado = null;
        
        if (documentosAlternativos) {
            const tienePreferido = documentosSubidos.includes(documentosAlternativos.preferido);
            const tieneAlternativa = documentosSubidos.includes(documentosAlternativos.alternativa);
            
            if (tienePreferido) {
                documentoUsado = `${mapeoDocumentos[documentosAlternativos.preferido]} (Preferido)`;
                documentosValidosSubidos = documentosSubidos;
                documentosFaltantes = documentosRequeridosDinamicos.filter(doc => 
                    doc !== documentosAlternativos.preferido && 
                    doc !== documentosAlternativos.alternativa && 
                    !documentosSubidos.includes(doc)
                );
            } else if (tieneAlternativa) {
                documentoUsado = `${mapeoDocumentos[documentosAlternativos.alternativa]} (Alternativo)`;
                documentosValidosSubidos = documentosSubidos;
                documentosFaltantes = documentosRequeridosDinamicos.filter(doc => 
                    doc !== documentosAlternativos.preferido && 
                    doc !== documentosAlternativos.alternativa && 
                    !documentosSubidos.includes(doc)
                );
            } else {
                documentosValidosSubidos = documentosSubidos.filter(doc => 
                    doc !== documentosAlternativos.preferido && 
                    doc !== documentosAlternativos.alternativa
                );
                documentosFaltantes = documentosRequeridosDinamicos.filter(doc => !documentosSubidos.includes(doc));
            }
        } else {
            documentosValidosSubidos = documentosSubidos.filter(doc => documentosRequeridosDinamicos.includes(doc));
            documentosFaltantes = documentosRequeridosDinamicos.filter(doc => !documentosSubidos.includes(doc));
        }
        
        const totalRequeridos = documentosRequeridosDinamicos.length - (documentosAlternativos ? 1 : 0);
        
        return {
            subidos: documentosValidosSubidos.map(doc => mapeoDocumentos[doc] || doc),
            faltantes: documentosFaltantes.map(doc => mapeoDocumentos[doc] || doc),
            totalSubidos: documentosValidosSubidos.length,
            totalRequeridos: totalRequeridos,
            documentoUsado: documentoUsado,
            porcentajeCompletado: Math.round((documentosValidosSubidos.length / totalRequeridos) * 100)
        };
    };

    // Funciones para descargas
    const generarReporteAdministrativo = () => {
        try {
            setDescargando(true);
            
            let contenido = `REPORTE ADMINISTRATIVO - REGISTROS PENDIENTES DE DOCUMENTACIÓN\n`;
            contenido += `Fecha de generación: ${new Date().toLocaleString('es-AR')}\n`;
            contenido += `Total de registros: ${registros.length}\n`;
            contenido += `${'='.repeat(80)}\n\n`;

            registros.forEach((registro, index) => {
                const info = obtenerInfoVencimiento(registro);
                const estadoDoc = obtenerEstadoDocumentacion(registro);
                
                contenido += `${index + 1}. ${registro.datos?.nombre || registro.nombre} ${registro.datos?.apellido || registro.apellido}\n`;
                contenido += `   DNI: ${registro.datos?.dni || registro.dni}\n`;
                contenido += `   Email: ${registro.datos?.email || registro.email || 'Sin email'}\n`;
                contenido += `   Modalidad: ${registro.datos?.modalidad || registro.modalidad}\n`;
                contenido += `   Estado: ${info.vencido ? 'VENCIDO' : info.mensaje}\n`;
                contenido += `   Registrado: ${new Date(registro.timestamp).toLocaleString('es-AR')}\n`;
                
                // Información de documentación
                contenido += `   \n   📊 DOCUMENTACIÓN:\n`;
                contenido += `   Completado: ${estadoDoc.totalSubidos}/${estadoDoc.totalRequeridos} (${estadoDoc.porcentajeCompletado}%)\n`;
                
                if (estadoDoc.subidos.length > 0) {
                    contenido += `   ✅ Documentos presentados:\n`;
                    estadoDoc.subidos.forEach(doc => {
                        contenido += `      • ${doc}\n`;
                    });
                }
                
                if (estadoDoc.faltantes.length > 0) {
                    contenido += `   ❌ Documentos faltantes:\n`;
                    estadoDoc.faltantes.forEach(doc => {
                        contenido += `      • ${doc}\n`;
                    });
                } else {
                    contenido += `   ✅ Documentación completa\n`;
                }
                
                if (estadoDoc.documentoUsado) {
                    contenido += `   📝 ${estadoDoc.documentoUsado}\n`;
                }
                
                contenido += `\n${'─'.repeat(60)}\n\n`;
            });

            const blob = new Blob([contenido], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `reporte-registros-pendientes-${new Date().toISOString().split('T')[0]}.txt`;
            link.click();
            URL.revokeObjectURL(url);
            
            showSuccess('📊 Reporte administrativo descargado');
        } catch (error) {
            showError(`Error al generar reporte: ${error.message}`);
        } finally {
            setDescargando(false);
        }
    };

    const generarReportePDF = () => {
        try {
            setDescargando(true);
            
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.width;
            const margin = 20;
            let yPosition = 30;
            
            // Encabezado
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.text('REPORTE DE REGISTROS PENDIENTES', pageWidth / 2, yPosition, { align: 'center' });
            
            yPosition += 10;
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`Fecha: ${new Date().toLocaleString('es-AR')}`, pageWidth / 2, yPosition, { align: 'center' });
            doc.text(`Total: ${registros.length} registros`, pageWidth / 2, yPosition + 5, { align: 'center' });
            
            yPosition += 20;
            
            // Tabla de registros
            registros.forEach((registro, index) => {
                if (yPosition > 200) {
                    doc.addPage();
                    yPosition = 30;
                }
                
                const info = obtenerInfoVencimiento(registro);
                const estadoDoc = obtenerEstadoDocumentacion(registro);
                const nombre = `${registro.datos?.nombre || registro.nombre} ${registro.datos?.apellido || registro.apellido}`;
                
                // Número y nombre
                doc.setFont('helvetica', 'bold');
                doc.text(`${index + 1}. ${nombre}`, margin, yPosition);
                yPosition += 7;
                
                // Información básica
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(8);
                doc.text(`DNI: ${registro.datos?.dni || registro.dni}`, margin + 5, yPosition);
                doc.text(`Email: ${registro.datos?.email || registro.email || 'Sin email'}`, margin + 5, yPosition + 3);
                doc.text(`Modalidad: ${registro.datos?.modalidad || registro.modalidad}`, margin + 5, yPosition + 6);
                doc.text(`Estado: ${info.vencido ? 'VENCIDO' : info.mensaje}`, margin + 5, yPosition + 9);
                doc.text(`Fecha: ${new Date(registro.timestamp).toLocaleDateString('es-AR')}`, margin + 5, yPosition + 12);
                
                yPosition += 18;
                
                // Información de documentación
                doc.setFont('helvetica', 'bold');
                doc.text(`Documentación: ${estadoDoc.totalSubidos}/${estadoDoc.totalRequeridos} (${estadoDoc.porcentajeCompletado}%)`, margin + 5, yPosition);
                yPosition += 4;
                
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(7);
                
                if (estadoDoc.subidos.length > 0) {
                    doc.text('Presentados: ' + estadoDoc.subidos.join(', '), margin + 5, yPosition, { maxWidth: pageWidth - 2 * margin });
                    yPosition += 3;
                }
                
                if (estadoDoc.faltantes.length > 0) {
                    doc.text('Faltantes: ' + estadoDoc.faltantes.join(', '), margin + 5, yPosition, { maxWidth: pageWidth - 2 * margin });
                    yPosition += 3;
                }
                
                if (estadoDoc.documentoUsado) {
                    doc.text(`Especial: ${estadoDoc.documentoUsado}`, margin + 5, yPosition);
                    yPosition += 3;
                }
                
                yPosition += 8;
                doc.setFontSize(10);
            });
            
            // Descargar PDF
            doc.save(`reporte-registros-pendientes-${new Date().toISOString().split('T')[0]}.pdf`);
            
        } catch (error) {
            console.error('Error al generar reporte PDF:', error);
            showError('Error al generar el reporte PDF');
        } finally {
            setDescargando(false);
        }
    };

    const generarReporteCSV = () => {
        try {
            setDescargando(true);
            
            const headers = [
                'Nombre', 'Apellido', 'DNI', 'Email', 'Modalidad', 'Estado', 'Días Restantes', 
                'Fecha Registro', 'Docs Presentados', 'Docs Requeridos', '% Completado', 
                'Documentos Subidos', 'Documentos Faltantes', 'Documento Especial'
            ];
            let csv = headers.join(',') + '\n';

            registros.forEach(registro => {
                const info = obtenerInfoVencimiento(registro);
                const estadoDoc = obtenerEstadoDocumentacion(registro);
                const fila = [
                    `"${registro.datos?.nombre || registro.nombre}"`,
                    `"${registro.datos?.apellido || registro.apellido}"`,
                    `"${registro.datos?.dni || registro.dni}"`,
                    `"${registro.datos?.email || registro.email || 'Sin email'}"`,
                    `"${registro.datos?.modalidad || registro.modalidad}"`,
                    `"${info.vencido ? 'VENCIDO' : 'VIGENTE'}"`,
                    `"${info.diasRestantes}"`,
                    `"${new Date(registro.timestamp).toLocaleString('es-AR')}"`,
                    `"${estadoDoc.totalSubidos}"`,
                    `"${estadoDoc.totalRequeridos}"`,
                    `"${estadoDoc.porcentajeCompletado}%"`,
                    `"${estadoDoc.subidos.join('; ')}"`,
                    `"${estadoDoc.faltantes.join('; ')}"`,
                    `"${estadoDoc.documentoUsado || ''}"`
                ];
                csv += fila.join(',') + '\n';
            });

            const BOM = '\uFEFF';
            const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `registros-pendientes-${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
            URL.revokeObjectURL(url);
            
            showSuccess('📄 Archivo CSV descargado');
        } catch (error) {
            showError(`Error al generar CSV: ${error.message}`);
        } finally {
            setDescargando(false);
        }
    };

    const descargarJSON = () => {
        try {
            const dataStr = JSON.stringify(registros, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `registros-pendientes-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            URL.revokeObjectURL(url);
            showSuccess('📄 Archivo JSON descargado');
        } catch (error) {
            showError(`Error al descargar JSON: ${error.message}`);
        }
    };

    // Calcular fecha de última actualización
    const fechaActualizacion = registros.length > 0 
        ? new Date(Math.max(...registros.map(r => new Date(r.timestamp)))).toLocaleString('es-AR')
        : null;

    return (
        <div className="modal-registros-pendientes">
            <div className="modal-overlay">
                <div className="modal-container registros-pendientes">
                    
                    {/* Header del modal */}
                    <HeaderModal 
                        cantidadTotal={registros.length}
                        fechaActualizacion={fechaActualizacion}
                        onCerrar={onClose}
                    />
                    {/* ALERTAS FLOTANTES GLOBALES */}
                    <AlertaMens 
                        mode="floating"
                        alerts={alerts}
                        onCloseAlert={removeAlert}
                        modal={modal}
                        onCloseModal={closeModal}
                    />
                    {/* Contenido principal */}
                    <div className="modal-content">
                        
                        {/* Lista de registros */}
                        <ListaRegistrosPendientes
                            registros={registros}
                            cargandoRegistros={cargandoRegistros}
                            estudiantesRegistrados={estudiantesRegistrados}
                            mapeoDocumentos={{
                                'cuil': 'CUIL',
                                'dni': 'DNI',
                                'fichaMedica': 'Ficha Médica',
                                'certificadoNivelPrimario': 'Certificado Nivel Primario',
                                'partidaNacimiento': 'Partida de Nacimiento',
                                'foto': 'Foto',
                                'certificadoNivelSecundario': 'Certificado Nivel Secundario',
                                'constanciaAlumnoRegular': 'Constancia Alumno Regular'
                            }}
                            enviandoEmail={enviandoEmail}
                            onCompletar={completarRegistro}
                            onEliminar={procesarEliminacion}
                            onEnviarEmail={enviarEmailIndividual}
                            obtenerInfoVencimiento={obtenerInfoVencimiento}
                            getTipoIcon={getTipoIcon}
                            formatearTipo={formatearTipo}
                        />
                    </div>

                    {/* Footer */}
                    <div className="modal-footer">
                        
                        {/* Mensaje de estado de emails */}
                        {mensajeEmail && (
                            <div className={`mensaje-email ${mensajeEmail.includes('❌') ? 'error' : 'success'}`}>
                                {mensajeEmail}
                            </div>
                        )}

                        {/* Sección de emails */}
                        <SeccionEmails
                            onEnviarUrgentes={enviarEmailsUrgentes}
                            onEnviarTodos={enviarEmailsMasivos}
                            enviandoEmail={enviandoEmail}
                        />

                        {/* Sección de descargas */}
                        <SeccionDescargas
                            onGenerarReporteTXT={generarReporteAdministrativo}
                            onGenerarReporteCSV={generarReporteCSV}
                            onGenerarReportePDF={generarReportePDF}
                            onDescargarJSON={descargarJSON}
                            descargando={descargando}
                        />

                        {/* Sección de duplicados */}
                        <SeccionDuplicados
                            estadoDuplicados={estadoDuplicados}
                            limpiandoDuplicados={limpiandoDuplicados}
                            onVerificarDuplicados={verificarEstadoDuplicadosManual}
                            onLimpiarDuplicados={limpiarDuplicadosManual}
                            onTestSistema7Dias={probarSistema7Dias}
                        />
                    </div>
                </div>
            </div>

            {/* Modal de edición de registro */}
            {mostrarModalEdicion && registroEditando && (
                <ModalEditarRegistro
                    registro={registroEditando}
                    onClose={cerrarModalEdicion}
                    onGuardado={handleRegistroGuardado}
                    onEliminado={handleRegistroEliminado}
                />
            )}
        </div>
    );
}

ModalRegistrosPendientes.propTypes = {
    onClose: PropTypes.func.isRequired
};

export default ModalRegistrosPendientes;