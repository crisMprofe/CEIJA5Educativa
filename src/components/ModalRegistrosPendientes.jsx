import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import CloseButton from './CloseButton';
import { descargarRegistrosCSV, obtenerRegistrosSinDocumentacion, limpiarDuplicadosManualmente, verificarDuplicados, testearSistema7Dias } from '../utils/registroSinDocumentacion';
import { notificacionesService } from '../services/notificacionesService';
import { migracionService } from '../services/migracionService';
import { registrosPendientesService } from '../services/registrosPendientesService';
import { obtenerDocumentosRequeridos } from '../utils/registroSinDocumentacion';
import '../estilos/modalM.css';
import '../estilos/botones.css';
import '../estilos/ModalRegistrosPendientes.css';

const ModalRegistrosPendientes = ({ registros: registrosProp, onClose, onDescargar }) => {
    const navigate = useNavigate();
    const [descargando, setDescargando] = useState(false);
    const [enviandoEmail, setEnviandoEmail] = useState(false);
    const [mensajeEmail, setMensajeEmail] = useState('');
    const [registros, setRegistros] = useState([]);
    const [cargandoRegistros, setCargandoRegistros] = useState(true);
    const [estadoDuplicados, setEstadoDuplicados] = useState(null);
    const [limpiandoDuplicados, setLimpiandoDuplicados] = useState(false);

    // Función para recargar registros
    const recargarRegistros = async () => {
        try {
            console.log('🔄 Recargando registros pendientes desde localStorage...');
            setMensajeEmail('Actualizando lista de registros...');
            
            // Obtener registros actualizados del localStorage
            const registrosActualizados = obtenerRegistrosSinDocumentacion();
            console.log('📋 Registros actualizados:', registrosActualizados);
            
            // Comparar con la lista anterior para detectar cambios
            const registrosAnteriores = registros.length;
            const registrosNuevos = registrosActualizados.length;
            
            setRegistros(registrosActualizados);
            
            if (registrosNuevos < registrosAnteriores) {
                const diferencia = registrosAnteriores - registrosNuevos;
                setMensajeEmail(`✅ Lista actualizada - ${diferencia} registro${diferencia > 1 ? 's' : ''} procesado${diferencia > 1 ? 's' : ''}`);
            } else if (registrosNuevos === registrosAnteriores) {
                setMensajeEmail('✅ Lista actualizada - sin cambios');
            } else {
                setMensajeEmail('✅ Lista actualizada - nuevos registros pendientes');
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
            // Obtener registros actuales del localStorage
            const registrosActuales = obtenerRegistrosSinDocumentacion();
            const idsActuales = new Set(registrosActuales.map(r => r.id));
            
            // Filtrar registros locales para mantener solo los que siguen pendientes
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

    // Cargar registros desde localStorage al montar el componente
    useEffect(() => {
        const cargarRegistrosPendientes = async () => {
            try {
                setCargandoRegistros(true);
                console.log('🔄 Cargando registros pendientes desde localStorage...');
                
                // Obtener registros del localStorage (registros de administrador)
                const registrosLocalStorage = obtenerRegistrosSinDocumentacion();
                console.log('📋 Registros desde localStorage:', registrosLocalStorage);
                
                setRegistros(registrosLocalStorage);
                setMensajeEmail('✅ Registros cargados exitosamente');
                setTimeout(() => setMensajeEmail(''), 2000);
                
                // Verificación automática de duplicados al cargar
                setTimeout(() => {
                    verificarEstadoDuplicados();
                }, 500);
                
            } catch (error) {
                console.error('❌ Error al cargar registros:', error);
                setMensajeEmail(`❌ Error al cargar registros: ${error.message}`);
                
                // Si falla, usar los registros que se pasaron como prop (fallback)
                if (registrosProp && registrosProp.length > 0) {
                    console.log('📋 Usando registros de prop como fallback:', registrosProp);
                    setRegistros(registrosProp);
                    setMensajeEmail('⚠️ Cargando desde cache local');
                    setTimeout(() => setMensajeEmail(''), 3000);
                } else {
                    setRegistros([]);
                }
            } finally {
                setCargandoRegistros(false);
            }
        };

        cargarRegistrosPendientes();

        // Configurar intervalo para verificar registros completados cada 30 segundos
        const intervalo = setInterval(() => {
            verificarYLimpiarRegistrosCompletados();
        }, 30000);

        return () => clearInterval(intervalo);
    }, [registrosProp]);

    const obtenerInfoVencimiento = (registro) => {
        const ahora = new Date();
        const vencimiento = new Date(registro.fechaVencimiento);
        const msRestantes = vencimiento.getTime() - ahora.getTime();
        
        if (msRestantes <= 0) {
            return { vencido: true, diasRestantes: 0, mensaje: 'VENCIDO', color: '#dc3545' };
        }
        
        const diasRestantes = Math.ceil(msRestantes / (1000 * 60 * 60 * 24));
        const horasRestantes = Math.ceil(msRestantes / (1000 * 60 * 60));
        
        let mensaje, color;
        if (diasRestantes > 3) {
            mensaje = `${diasRestantes} días restantes`;
            color = '#28a745'; // Verde
        } else if (diasRestantes > 1) {
            mensaje = `${diasRestantes} días restantes`;
            color = '#ffc107'; // Amarillo
        } else if (diasRestantes === 1) {
            mensaje = `1 día restante`;
            color = '#fd7e14'; // Naranja
        } else {
            mensaje = `${horasRestantes}h restantes`;
            color = '#dc3545'; // Rojo
        }
        
        return { 
            vencido: false, 
            diasRestantes, 
            mensaje,
            color,
            fechaVencimiento: vencimiento.toLocaleString()
        };
    };

    // Función para enviar email a un estudiante individual
    const enviarEmailIndividual = async (registro) => {
        try {
            setMensajeEmail('Enviando notificación...');
            await notificacionesService.enviarEmailIndividual(registro.dni);
            
            setMensajeEmail(`✅ Email enviado exitosamente a ${registro.nombre} ${registro.apellido}`);
            setTimeout(() => setMensajeEmail(''), 3000);
            
        } catch (error) {
            console.error('Error al enviar email:', error);
            setMensajeEmail(`❌ Error al enviar email: ${error.message}`);
            setTimeout(() => setMensajeEmail(''), 5000);
        }
    };

    // Función para enviar emails masivos
    const enviarEmailsMasivos = async () => {
        setEnviandoEmail(true);
        try {
            setMensajeEmail('Enviando notificaciones masivas...');
            const result = await notificacionesService.enviarEmailsMasivos();
            
            setMensajeEmail(`✅ Emails enviados exitosamente a ${result.enviados} estudiantes`);
            setTimeout(() => setMensajeEmail(''), 3000);
            
        } catch (error) {
            console.error('Error al enviar emails masivos:', error);
            setMensajeEmail(`❌ Error al enviar emails: ${error.message}`);
            setTimeout(() => setMensajeEmail(''), 5000);
        } finally {
            setEnviandoEmail(false);
        }
    };

    // Función para enviar emails urgentes (solo a registros próximos a vencer)
    const enviarEmailsUrgentes = async () => {
        setEnviandoEmail(true);
        try {
            setMensajeEmail('Enviando notificaciones urgentes...');
            const result = await notificacionesService.enviarEmailsUrgentes(3);
            
            setMensajeEmail(`⚡ Emails urgentes enviados a ${result.enviados} estudiantes`);
            setTimeout(() => setMensajeEmail(''), 3000);
            
        } catch (error) {
            console.error('Error al enviar emails urgentes:', error);
            setMensajeEmail(`❌ Error al enviar emails urgentes: ${error.message}`);
            setTimeout(() => setMensajeEmail(''), 5000);
        } finally {
            setEnviandoEmail(false);
        }
    };

    // Función para migrar registros de localStorage al archivo JSON del backend
    const migrarRegistrosLocalStorage = async () => {
        setEnviandoEmail(true);
        try {
            setMensajeEmail('🚀 Migrando registros desde localStorage al servidor...');
            
            const resultado = await migracionService.ejecutarMigracionCompleta();
            
            if (resultado.success) {
                setMensajeEmail(`✅ Migración exitosa: ${resultado.registrosMigrados} registros migrados al archivo JSON`);
                
                // Recargar registros después de la migración
                setTimeout(async () => {
                    try {
                        const registrosServidor = await notificacionesService.obtenerRegistrosPendientes();
                        setRegistros(registrosServidor);
                        setMensajeEmail('📋 Registros recargados desde el servidor');
                    } catch (error) {
                        console.error('Error al recargar después de migración:', error);
                    }
                }, 2000);
                
            } else {
                setMensajeEmail(`❌ Error en migración: ${resultado.message}`);
            }
            
            setTimeout(() => setMensajeEmail(''), 8000);
            
        } catch (error) {
            console.error('Error al migrar registros:', error);
            setMensajeEmail(`❌ Error al migrar registros: ${error.message}`);
            setTimeout(() => setMensajeEmail(''), 5000);
        } finally {
            setEnviandoEmail(false);
        }
    };

    // Función para eliminar un registro pendiente
    const eliminarRegistro = async (registro) => {
        if (!confirm(`¿Estás seguro de que quieres eliminar el registro de ${registro.nombre} ${registro.apellido}?`)) {
            return;
        }

        try {
            setMensajeEmail(`🗑️ Eliminando registro de ${registro.nombre} ${registro.apellido}...`);
            
            const resultado = await notificacionesService.eliminarRegistro(registro.dni);
            
            if (resultado.success) {
                // Eliminar de la lista local inmediatamente
                setRegistros(prevRegistros => 
                    prevRegistros.filter(r => r.dni !== registro.dni)
                );
                
                setMensajeEmail(`✅ Registro de ${registro.nombre} ${registro.apellido} eliminado exitosamente`);
                setTimeout(() => setMensajeEmail(''), 3000);
                
                // También eliminar de localStorage si existe
                try {
                    const registrosLocal = obtenerRegistrosSinDocumentacion();
                    const registrosFiltrados = registrosLocal.filter(r => r.dni !== registro.dni);
                    localStorage.setItem('registrosSinDocumentacion', JSON.stringify(registrosFiltrados, null, 2));
                } catch (error) {
                    console.log('No se pudo eliminar de localStorage (normal si ya no está):', error);
                }
                
            } else {
                setMensajeEmail(`❌ Error al eliminar registro: ${resultado.message}`);
                setTimeout(() => setMensajeEmail(''), 5000);
            }
            
        } catch (error) {
            console.error('Error al eliminar registro:', error);
            setMensajeEmail(`❌ Error al eliminar registro: ${error.message}`);
            setTimeout(() => setMensajeEmail(''), 5000);
        }
    };

    // Función para completar un registro pendiente (navegar al formulario de inscripción)
    const completarRegistro = async (registro) => {
        try {
            console.log('🔄 Cargando datos del registro pendiente:', registro);
            setMensajeEmail(`📋 Cargando datos de ${registro.nombre} ${registro.apellido}...`);
            
            // Obtener datos completos del registro desde el archivo JSON
            const datosCompletos = await registrosPendientesService.obtenerRegistroPorDni(registro.dni);
            console.log('📋 Datos completos obtenidos:', datosCompletos);
            
            // Transformar datos para el formulario
            const datosFormulario = registrosPendientesService.transformarParaFormulario(datosCompletos);
            console.log('📋 Datos transformados para formulario:', datosFormulario);
            
            // Obtener archivos existentes para el modal
            const archivosExistentes = registrosPendientesService.obtenerArchivosParaModal(datosCompletos);
            console.log('📎 Archivos existentes:', archivosExistentes);
            
            // Guardar datos en sessionStorage para que el formulario los use
            sessionStorage.setItem('registroPendienteCompleto', JSON.stringify({
                ...datosFormulario,
                archivosExistentes: archivosExistentes
            }));
            
            // Cerrar el modal actual
            onClose();
            
            // Navegar al formulario de inscripción con parámetros
            const params = new URLSearchParams({
                completar: registro.dni,
                modalidad: encodeURIComponent(datosCompletos.datos?.modalidad || ''),
                origen: 'registros-pendientes',
                precargar: 'true' // Indica que debe pre-cargar datos y archivos
            });
            
            navigate(`/dashboard/formulario-inscripcion-adm?${params.toString()}`);
            
            setMensajeEmail(`✅ Abriendo formulario para ${registro.nombre} ${registro.apellido}`);
            setTimeout(() => setMensajeEmail(''), 2000);
            
        } catch (error) {
            console.error('Error al completar registro:', error);
            setMensajeEmail(`❌ Error al cargar datos: ${error.message}`);
            setTimeout(() => setMensajeEmail(''), 5000);
        }
    };

    const handleDescargar = async () => {
        setDescargando(true);
        try {
            await onDescargar();
        } finally {
            setDescargando(false);
        }
    };

    // Función para generar reporte administrativo legible
    const generarReporteAdministrativo = () => {
        try {
            const fechaActual = new Date().toLocaleDateString('es-AR');
            const horaActual = new Date().toLocaleTimeString('es-AR');
            
            let contenidoReporte = `REPORTE DE REGISTROS PENDIENTES DE DOCUMENTACIÓN
================================================================================
Fecha del reporte: ${fechaActual} - ${horaActual}
Total de registros pendientes: ${registros.length}
================================================================================

`;

            registros.forEach((registro, index) => {
                const info = obtenerInfoVencimiento(registro);
                const estadoDoc = obtenerEstadoDocumentacionRegistro(registro);
                
                contenidoReporte += `${index + 1}. ${registro.nombre.toUpperCase()} ${registro.apellido.toUpperCase()}
   DNI: ${registro.dni}
   Email: ${registro.email || 'No proporcionado'}
   Modalidad: ${registro.modalidad}
   Tipo de registro: ${formatearTipo(registro.tipoRegistro)}
   Estado: ${info.vencido ? 'VENCIDO ❌' : `⏳ ${info.mensaje}`}
   ${!info.vencido ? `Fecha límite: ${info.fechaVencimiento}` : 'Registro vencido - será eliminado automáticamente'}
   
   📋 DOCUMENTACIÓN (${estadoDoc.totalSubidos}/${estadoDoc.totalRequeridos} documentos):
   
   ✅ DOCUMENTOS YA PRESENTADOS:`;
   
                if (estadoDoc.subidos.length > 0) {
                    estadoDoc.subidos.forEach(doc => {
                        contenidoReporte += `\n      • ${mapeoDocumentos[doc] || doc}`;
                    });
                } else {
                    contenidoReporte += `\n      • Ningún documento presentado aún`;
                }
                
                contenidoReporte += `\n   
   ⚠️  DOCUMENTOS FALTANTES:`;
                
                if (estadoDoc.faltantes.length > 0) {
                    estadoDoc.faltantes.forEach(doc => {
                        contenidoReporte += `\n      • ${mapeoDocumentos[doc] || doc}`;
                    });
                } else {
                    contenidoReporte += `\n      • Documentación completa`;
                }
                
                contenidoReporte += `\n\n${'─'.repeat(80)}\n\n`;
            });

            contenidoReporte += `RESUMEN:
• Registros sin documentación: ${registros.filter(r => r.tipoRegistro === 'SIN_DOCUMENTACION').length}
• Registros con documentación incompleta: ${registros.filter(r => r.tipoRegistro === 'DOCUMENTACION_INCOMPLETA').length}
• Registros vencidos: ${registros.filter(r => obtenerInfoVencimiento(r).vencido).length}

NOTA IMPORTANTE:
- Los registros se eliminan automáticamente después de 7 días desde su creación
- Los estudiantes pueden completar su documentación desde el sistema web
- Para consultas técnicas, contactar al administrador del sistema
`;

            // Crear y descargar el archivo
            const blob = new Blob([contenidoReporte], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            
            link.href = url;
            link.download = `Reporte-Registros-Pendientes-${new Date().toISOString().split('T')[0]}.txt`;
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            URL.revokeObjectURL(url);
            
            console.log('📄 Reporte administrativo descargado exitosamente');
            return true;
        } catch (error) {
            console.error('❌ Error al generar reporte administrativo:', error);
            return false;
        }
    };

    // Función para generar archivo CSV para Excel - MEJORADA
    const generarReporteCSV = () => {
        try {
            // Usar la función mejorada de registroSinDocumentacion.js
            const exito = descargarRegistrosCSV();
            
            if (exito) {
                console.log('📊 Archivo CSV descargado exitosamente con formato mejorado');
                return true;
            } else {
                console.error('❌ Error al generar archivo CSV');
                return false;
            }
        } catch (error) {
            console.error('❌ Error al generar archivo CSV:', error);
            return false;
        }
    };

    // Función para verificar estado de duplicados
    const verificarEstadoDuplicados = async () => {
        try {
            console.log('🔍 Verificando estado de duplicados...');
            const estado = verificarDuplicados();
            setEstadoDuplicados(estado);
            
            if (estado && estado.cantidadDuplicados > 0) {
                setMensajeEmail(`⚠️ Se encontraron ${estado.cantidadDuplicados} DNI(s) con registros duplicados`);
                setTimeout(() => setMensajeEmail(''), 5000);
            } else {
                setMensajeEmail('✅ No se encontraron registros duplicados');
                setTimeout(() => setMensajeEmail(''), 3000);
            }
            
            return estado;
        } catch (error) {
            console.error('❌ Error al verificar duplicados:', error);
            setMensajeEmail(`❌ Error al verificar duplicados: ${error.message}`);
            setTimeout(() => setMensajeEmail(''), 5000);
            return null;
        }
    };

    // Función para limpiar duplicados manualmente
    const limpiarDuplicadosManual = async () => {
        setLimpiandoDuplicados(true);
        try {
            console.log('🧹 Iniciando limpieza manual de duplicados...');
            setMensajeEmail('Limpiando registros duplicados...');
            
            const resultado = limpiarDuplicadosManualmente();
            
            if (resultado.success) {
                setMensajeEmail(`✅ ${resultado.mensaje}`);
                
                // Recargar registros después de la limpieza
                setTimeout(async () => {
                    await recargarRegistros();
                    await verificarEstadoDuplicados();
                }, 1000);
            } else {
                setMensajeEmail(`❌ ${resultado.mensaje}`);
            }
            
            setTimeout(() => setMensajeEmail(''), 5000);
            
        } catch (error) {
            console.error('❌ Error al limpiar duplicados:', error);
            setMensajeEmail(`❌ Error al limpiar duplicados: ${error.message}`);
            setTimeout(() => setMensajeEmail(''), 5000);
        } finally {
            setLimpiandoDuplicados(false);
        }
    };

    // 🧪 Función para probar el sistema de 7 días
    const probarSistema7Dias = () => {
        try {
            console.log('🧪 Ejecutando prueba del sistema de 7 días desde Modal...');
            setMensajeEmail('🧪 Analizando sistema de 7 días...');
            
            const resultado = testearSistema7Dias();
            
            if (resultado) {
                const mensaje = `🧪 Análisis completado: ${resultado.registrosVigentes} vigentes, ${resultado.registrosVencidos} vencidos, ${resultado.calculosCorrectos}/${resultado.totalRegistros} cálculos correctos`;
                setMensajeEmail(mensaje);
                console.log('📊 Resultado del análisis:', resultado);
            } else {
                setMensajeEmail('❌ Error en el análisis del sistema');
            }
            
            setTimeout(() => setMensajeEmail(''), 8000);
            
        } catch (error) {
            console.error('❌ Error al probar sistema:', error);
            setMensajeEmail(`❌ Error: ${error.message}`);
            setTimeout(() => setMensajeEmail(''), 5000);
        }
    };

    const getTipoIcon = (tipo) => {
        switch (tipo) {
            case 'SIN_DOCUMENTACION': return '📋';
            case 'DOCUMENTACION_INCOMPLETA': return '📄';
            default: return '📝';
        }
    };

    const formatearTipo = (tipo) => {
        switch (tipo) {
            case 'SIN_DOCUMENTACION': return 'Sin Documentación';
            case 'DOCUMENTACION_INCOMPLETA': return 'Documentación Incompleta';
            default: return tipo;
        }
    };

    // Mapeo de nombres técnicos a nombres legibles para documentos
    const mapeoDocumentos = {
        "foto": "📷 Foto 4x4",
        "archivo_dni": "📄 DNI",
        "archivo_cuil": "📄 CUIL",
        "archivo_fichaMedica": "🏥 Ficha Médica",
        "archivo_partidaNacimiento": "📜 Partida de Nacimiento",
        "archivo_solicitudPase": "📝 Solicitud de Pase",
        "archivo_analiticoParcial": "📊 Analítico Parcial",
        "archivo_certificadoNivelPrimario": "🎓 Certificado Nivel Primario"
    };

    // Lista completa de documentos requeridos - YA NO SE USA (se obtiene dinámicamente)
    // const documentosRequeridos = [...] - ELIMINADO para usar la función dinámica

    // Función para obtener el estado de documentación de un registro - CON LÓGICA DE DOCUMENTOS ALTERNATIVOS
    const obtenerEstadoDocumentacionRegistro = (registro) => {
        console.log('🔍 Analizando documentación para registro:', registro.id, registro);
        
        // Obtener documentos requeridos dinámicamente según modalidad del registro
        const requerimientos = obtenerDocumentosRequeridos(
            registro.modalidad || '', 
            registro.planAnio || '', 
            registro.modulos || ''
        );
        
        const documentosRequeridosDinamicos = requerimientos.documentos || [];
        const documentosAlternativos = requerimientos.alternativos;
        
        console.log(`📋 Documentos requeridos para ${registro.modalidad}:`, documentosRequeridosDinamicos);
        if (documentosAlternativos) {
            console.log(`🔄 Alternativas:`, documentosAlternativos.descripcion);
        }
        
        // Manejar diferentes estructuras de datos
        let documentosSubidos = [];
        
        if (Array.isArray(registro.documentosSubidos)) {
            // Si ya es un array (desde backend)
            documentosSubidos = registro.documentosSubidos;
            console.log('📋 Documentos subidos (array):', documentosSubidos);
        } else if (registro.documentosSubidos && typeof registro.documentosSubidos === 'object') {
            // Si es un objeto, obtener las claves
            documentosSubidos = Object.keys(registro.documentosSubidos);
            console.log('📋 Documentos subidos (objeto keys):', documentosSubidos);
        } else if (registro.archivos && typeof registro.archivos === 'object') {
            // Si hay archivos en el registro
            documentosSubidos = Object.keys(registro.archivos);
            console.log('📋 Documentos subidos (archivos):', documentosSubidos);
        } else {
            // Fallback: array vacío
            documentosSubidos = [];
            console.log('⚠️ No se encontraron documentos, usando array vacío');
        }
        
        // Procesar documentos alternativos si existen
        let documentosFaltantes = [];
        let documentosValidosSubidos = [];
        
        if (documentosAlternativos) {
            // Verificar si tiene el documento preferido o la alternativa
            const tienePreferido = documentosSubidos.includes(documentosAlternativos.preferido);
            const tieneAlternativa = documentosSubidos.includes(documentosAlternativos.alternativa);
            
            // Validar documentos base (excluyendo los alternativos)
            for (const doc of documentosRequeridosDinamicos) {
                if (doc === documentosAlternativos.preferido || doc === documentosAlternativos.alternativa) {
                    // Es parte del grupo alternativo
                    if (tienePreferido) {
                        documentosValidosSubidos.push(documentosAlternativos.preferido);
                    } else if (tieneAlternativa) {
                        documentosValidosSubidos.push(documentosAlternativos.alternativa);
                    } else {
                        documentosFaltantes.push(documentosAlternativos.preferido); // Mostrar el preferido como faltante
                    }
                } else {
                    // Documento regular
                    if (documentosSubidos.includes(doc)) {
                        documentosValidosSubidos.push(doc);
                    } else {
                        documentosFaltantes.push(doc);
                    }
                }
            }
            
            // Evitar duplicados
            documentosValidosSubidos = [...new Set(documentosValidosSubidos)];
            documentosFaltantes = [...new Set(documentosFaltantes)];
            
        } else {
            // Sin documentos alternativos, validación normal
            documentosValidosSubidos = documentosSubidos.filter(doc => 
                documentosRequeridosDinamicos.includes(doc)
            );
            documentosFaltantes = documentosRequeridosDinamicos.filter(doc => 
                !documentosSubidos.includes(doc)
            );
        }
        
        // Calcular totales correctos
        const totalRequeridos = documentosRequeridosDinamicos.length - (documentosAlternativos ? 1 : 0);
        
        const resultado = {
            subidos: documentosValidosSubidos,
            faltantes: documentosFaltantes,
            totalSubidos: documentosValidosSubidos.length,
            totalRequeridos: totalRequeridos,
            modalidad: registro.modalidad,
            plan: registro.planAnio || registro.modulos,
            documentosAlternativos: documentosAlternativos
        };
        
        console.log('📊 Estado de documentación:', resultado);
        return resultado;
    };

    return (
        <div className="modal-registros-pendientes">
            <div className="modal-overlay">
                <div className="modal-container registros-pendientes">
                    {/* Header del modal */}
                    <div className="modal-header">
                        <h2>
                            📅 Registros Pendientes ({registros.length})
                        </h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <button 
                                onClick={recargarRegistros}
                                className="btn-recargar"
                                title="Actualizar lista de registros"
                                style={{
                                    background: '#28a745',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    padding: '6px 12px',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem'
                                }}
                            >
                                🔄 Actualizar
                            </button>
                            <CloseButton onClose={onClose} variant="modal" />
                        </div>
                    </div>

                    {/* Contenido principal */}
                    <div className="modal-content">
                        {/* Lista de registros */}
                        <div className="lista-registros">
                            {cargandoRegistros ? (
                                <div className="estado-cargando">
                                    <div>⏳</div>
                                    <div>Cargando registros pendientes...</div>
                                </div>
                            ) : registros.length === 0 ? (
                                <div className="estado-vacio">
                                    <div>📋</div>
                                    <div>No hay registros pendientes</div>
                                </div>
                            ) : (
                                registros.map((registro, index) => {
                                const info = obtenerInfoVencimiento(registro);
                                const estadoDoc = obtenerEstadoDocumentacionRegistro(registro);
                                
                                return (
                                    <div key={registro.id || index} 
                                         className={`registro-item ${info.vencido ? 'registro-vencido' : 'registro-vigente'}`} 
                                         style={{ borderLeftColor: info.color }}>
                                        <div className="registro-grid">
                                            {/* Información principal en horizontal */}
                                            <div className="registro-info-principal">
                                                {/* Columna izquierda - Información del estudiante */}
                                                <div className="registro-info-estudiante">
                                                    <h4>{registro.nombre} {registro.apellido}</h4>
                                                    <p><strong>📄 DNI:</strong> {registro.dni}</p>
                                                    <p>
                                                        <strong>📧 Email:</strong> {
                                                            registro.email || 
                                                            <span style={{color: '#dc3545', fontStyle: 'italic'}}>Sin email</span>
                                                        }
                                                    </p>
                                                    <p>
                                                        <strong>{getTipoIcon(registro.tipoRegistro)} Tipo:</strong> {formatearTipo(registro.tipoRegistro)}
                                                    </p>
                                                    <p>
                                                        <strong>📎 Documentos:</strong> {estadoDoc.totalSubidos}/{estadoDoc.totalRequeridos}
                                                    </p>
                                                </div>
                                                
                                                {/* Columna derecha - Estado y tiempos */}
                                                <div className="registro-info-derecha">
                                                    <div className="registro-vencimiento" style={{ color: info.color }}>
                                                        {info.vencido ? '🔴 VENCIDO' : `🕒 ${info.mensaje}`}
                                                    </div>
                                                    {!info.vencido && (
                                                        <div className="registro-fecha-limite">
                                                            Vence: {info.fechaVencimiento}
                                                        </div>
                                                    )}
                                                    {registro.modalidad && (
                                                        <div className="registro-modalidad">
                                                            📚 {registro.modalidad}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Documentos en layout horizontal */}
                                            <div className="documentos-container">
                                                {/* Sección de documentos subidos */}
                                                {estadoDoc.subidos.length > 0 && (
                                                    <div className="seccion-documentos documentos-subidos">
                                                        <strong>✅ Documentos subidos:</strong>
                                                        <ul>
                                                            {estadoDoc.subidos.map(doc => (
                                                                <li key={doc}>
                                                                    {mapeoDocumentos[doc] || doc}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                                {/* Sección de documentos faltantes */}
                                                {estadoDoc.faltantes.length > 0 && (
                                                    <div className="seccion-documentos documentos-faltantes">
                                                        <strong>⚠️ Documentos faltantes:</strong>
                                                        <ul>
                                                            {estadoDoc.faltantes.map(doc => (
                                                                <li key={doc}>
                                                                    {estadoDoc.documentosAlternativos && doc === estadoDoc.documentosAlternativos.preferido ? 
                                                                        `${mapeoDocumentos[doc] || doc} (o alternativamente: ${mapeoDocumentos[estadoDoc.documentosAlternativos.alternativa] || estadoDoc.documentosAlternativos.alternativa})` :
                                                                        mapeoDocumentos[doc] || doc
                                                                    }
                                                                </li>
                                                            ))}
                                                        </ul>
                                                        {/* Información adicional sobre documentos alternativos */}
                                                        {estadoDoc.documentosAlternativos && estadoDoc.faltantes.includes(estadoDoc.documentosAlternativos.preferido) && (
                                                            <div className="info-alternativos">
                                                                ℹ️ {estadoDoc.documentosAlternativos.descripcion}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Información especial cuando hay documentos alternativos pero está completo */}
                                            {estadoDoc.documentosAlternativos && estadoDoc.faltantes.length === 0 && (
                                                <div className="info-documento-usado">
                                                    {estadoDoc.subidos.includes(estadoDoc.documentosAlternativos.preferido) ? 
                                                        `✨ Presenta documento preferido: ${mapeoDocumentos[estadoDoc.documentosAlternativos.preferido]}` :
                                                        `📝 Presenta alternativa: ${mapeoDocumentos[estadoDoc.documentosAlternativos.alternativa]}`
                                                    }
                                                </div>
                                            )}

                                            {/* Botones de acción */}
                                            <div className="registro-acciones">
                                                {/* Botón para completar registro */}
                                                {!info.vencido && (
                                                    <button
                                                        onClick={() => completarRegistro(registro)}
                                                        className="btn-completar"
                                                        title="Marcar este registro como completado y procesado"
                                                        disabled={enviandoEmail}
                                                    >
                                                        ✅ Completar
                                                    </button>
                                                )}

                                                {/* Botón para eliminar registro */}
                                                <button
                                                    onClick={() => eliminarRegistro(registro)}
                                                    className="btn-eliminar"
                                                    title="Eliminar este registro permanentemente"
                                                    disabled={enviandoEmail}
                                                    style={{
                                                        backgroundColor: '#dc3545',
                                                        color: 'white',
                                                        border: 'none',
                                                        padding: '8px 12px',
                                                        borderRadius: '4px',
                                                        cursor: 'pointer',
                                                        fontSize: '12px',
                                                        margin: '2px'
                                                    }}
                                                >
                                                    🗑️ Eliminar
                                                </button>
                                                
                                                {/* Botón para enviar email individual */}
                                                {registro.email && !info.vencido && (
                                                    <button
                                                        onClick={() => enviarEmailIndividual(registro)}
                                                        className="btn-notificar"
                                                        disabled={enviandoEmail}
                                                        title={`Enviar notificación por email a ${registro.email}`}
                                                    >
                                                        {enviandoEmail ? '📧 Enviando...' : '📧 Notificar'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        </div>
                    </div>
                    
                    {/* Footer */}
                    <div className="modal-footer">
                        {/* Mensaje de estado de emails */}
                        {mensajeEmail && (
                            <div className={`mensaje-email ${mensajeEmail.includes('❌') ? 'error' : 'success'}`}>
                                {mensajeEmail}
                            </div>
                        )}
                        
                        {/* Sección de botones de email */}
                        <div className="seccion-emails">
                            <h4>📧 Notificaciones por Email</h4>
                            <div className="botones-emails">
                                <button 
                                    onClick={enviarEmailsUrgentes}
                                    className="btn-urgente"
                                    disabled={enviandoEmail}
                                    title="Enviar emails solo a registros urgentes (próximos a vencer)"
                                >
                                    {enviandoEmail ? '⚡ Enviando...' : '⚡ Urgentes'}
                                </button>
                                <button 
                                    onClick={enviarEmailsMasivos}
                                    className="btn-todos-emails"
                                    disabled={enviandoEmail}
                                    title="Enviar email a todos los estudiantes con registros pendientes"
                                >
                                    {enviandoEmail ? '📧 Enviando...' : '📧 Todos'}
                                </button>
                                <button 
                                    onClick={migrarRegistrosLocalStorage}
                                    className="btn-migracion"
                                    disabled={enviandoEmail}
                                    title="Migrar registros desde localStorage al archivo JSON del servidor"
                                    style={{
                                        backgroundColor: '#17a2b8',
                                        color: 'white',
                                        border: 'none',
                                        padding: '8px 12px',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        marginLeft: '10px'
                                    }}
                                >
                                    {enviandoEmail ? '📦 Migrando...' : '📦 Migrar a JSON'}
                                </button>
                            </div>
                            <p className="info-emails">
                                Los emails incluyen información personalizada sobre documentación faltante y plazos
                            </p>
                        </div>
                        
                        {/* Botones de descarga */}
                        <div className="botones-descarga">
                            <button 
                                onClick={generarReporteAdministrativo}
                                className="btn-reporte-txt"
                                title="Generar reporte legible para administración escolar"
                            >
                                📋 Reporte TXT
                            </button>
                            <button 
                                onClick={generarReporteCSV}
                                className="btn-excel-csv"
                                title="Generar archivo Excel (CSV) para análisis de datos"
                            >
                                📊 Excel (CSV)
                            </button>
                            <button 
                                onClick={handleDescargar}
                                className="btn-json-tecnico"
                                disabled={descargando}
                                title="Descargar archivo JSON técnico (para programadores)"
                            >
                                {descargando ? '⏳ Descargando...' : '💾 JSON Técnico'}
                            </button>
                        </div>
                        
                        {/* Botones para gestión de duplicados */}
                        <div className="botones-duplicados" style={{
                            display: 'flex',
                            gap: '10px',
                            justifyContent: 'center',
                            marginTop: '15px',
                            paddingTop: '15px',
                            borderTop: '1px solid #e0e0e0'
                        }}>
                            <button 
                                onClick={verificarEstadoDuplicados}
                                className="btn-verificar-duplicados"
                                title="Verificar si existen registros duplicados para el mismo DNI"
                                style={{
                                    background: '#17a2b8',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    padding: '8px 16px',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem'
                                }}
                            >
                                🔍 Verificar Duplicados
                            </button>
                            
                            {estadoDuplicados && estadoDuplicados.cantidadDuplicados > 0 && (
                                <button 
                                    onClick={limpiarDuplicadosManual}
                                    disabled={limpiandoDuplicados}
                                    className="btn-limpiar-duplicados"
                                    title={`Encontrados ${estadoDuplicados.cantidadDuplicados} DNI(s) duplicados - Click para limpiar`}
                                    style={{
                                        background: limpiandoDuplicados ? '#6c757d' : '#dc3545',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        padding: '8px 16px',
                                        cursor: limpiandoDuplicados ? 'not-allowed' : 'pointer',
                                        fontSize: '0.9rem'
                                    }}
                                >
                                    {limpiandoDuplicados ? '⏳ Limpiando...' : `🧹 Limpiar ${estadoDuplicados.cantidadDuplicados} Duplicado(s)`}
                                </button>
                            )}
                            
                            {/* Botón para testing del sistema de 7 días (solo en desarrollo) */}
                            {window.location.hostname === 'localhost' && (
                                <button 
                                    onClick={probarSistema7Dias}
                                    className="btn-test-sistema"
                                    title="Probar funcionamiento del sistema de vencimiento de 7 días"
                                    style={{
                                        background: '#6f42c1',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        padding: '8px 16px',
                                        cursor: 'pointer',
                                        fontSize: '0.9rem'
                                    }}
                                >
                                    🧪 Test 7 Días
                                </button>
                            )}
                        </div>
                        
                        {/* Información de estado de duplicados */}
                        {estadoDuplicados && (
                            <div style={{
                                marginTop: '10px',
                                padding: '10px',
                                background: estadoDuplicados.cantidadDuplicados > 0 ? '#fff3cd' : '#d4edda',
                                border: `1px solid ${estadoDuplicados.cantidadDuplicados > 0 ? '#ffeaa7' : '#c3e6cb'}`,
                                borderRadius: '4px',
                                fontSize: '0.85rem'
                            }}>
                                📊 <strong>Estado:</strong> {estadoDuplicados.totalRegistros} registros totales, {estadoDuplicados.dnisUnicos} DNI únicos
                                {estadoDuplicados.cantidadDuplicados > 0 && (
                                    <div style={{ marginTop: '5px', color: '#856404' }}>
                                        ⚠️ {estadoDuplicados.cantidadDuplicados} DNI(s) tienen registros duplicados
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

ModalRegistrosPendientes.propTypes = {
    registros: PropTypes.arrayOf(PropTypes.object), // Opcional, se cargan desde backend
    onClose: PropTypes.func.isRequired,
    onDescargar: PropTypes.func.isRequired,
    onCompletarRegistro: PropTypes.func,
};

export default ModalRegistrosPendientes;